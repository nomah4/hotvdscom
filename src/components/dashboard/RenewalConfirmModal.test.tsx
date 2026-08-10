import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ accessToken: 'token', user: { profile: { email: 'customer@example.com' } } }),
}));

vi.mock('../../api/checkout', () => ({
  fetchRenewalPreview: vi.fn(),
}));

const { fetchRenewalPreview } = await import('../../api/checkout');
const { RenewalConfirmModal } = await import('./RenewalConfirmModal');
const { renderWithProviders } = await import('../../test/renderWithProviders');

const subscription = {
  subscription_id: 'sub-1',
  status: 'active',
  package_code: 'VDS_CUSTOM_MONTHLY',
  valid_until: '2026-09-08T00:00:00Z',
} as never;

function renderModal(overrides: Record<string, unknown> = {}) {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const { container } = renderWithProviders(
    <RenewalConfirmModal
      subscription={subscription}
      planName="Custom VDS"
      onClose={onClose}
      onConfirm={onConfirm}
      isSubmitting={false}
      submitError={null}
      {...overrides}
    />,
    { lang: 'en' },
  );
  return { onConfirm, onClose, container };
}

describe('RenewalConfirmModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchRenewalPreview).mockResolvedValue({
      amount_minor: 180000,
      currency: 'RUB',
    } as never);
  });

  /**
   * The whole reason this dialog exists: the renew control used to charge money
   * off a single click without ever showing a total.
   */
  it('shows the amount Billing quotes before anything is charged', async () => {
    renderModal();
    await waitFor(() => expect(screen.getByText(/1,800/)).toBeInTheDocument());
    expect(fetchRenewalPreview).toHaveBeenCalledWith('token', 'sub-1', 'RUB');
  });

  it('prefills the receipt email from the signed-in profile', async () => {
    renderModal();
    const input = await screen.findByDisplayValue('customer@example.com');
    expect(input).toBeInTheDocument();
  });

  it('lets the customer send the receipt somewhere else', async () => {
    const { onConfirm } = renderModal();
    await waitFor(() => expect(screen.getByText(/1,800/)).toBeInTheDocument());

    const input = screen.getByDisplayValue('customer@example.com');
    fireEvent.change(input, { target: { value: 'accounting@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /pay and renew/i }));

    expect(onConfirm).toHaveBeenCalledWith('accounting@example.com');
  });

  /** Nothing may be charged before Billing has said what it costs. */
  it('cannot be confirmed until the amount has loaded', async () => {
    vi.mocked(fetchRenewalPreview).mockReturnValue(new Promise(() => {}) as never);
    renderModal();

    expect(screen.getByRole('button', { name: /pay and renew/i })).toBeDisabled();
  });

  it('cannot be confirmed with an unusable email', async () => {
    const { onConfirm } = renderModal();
    await waitFor(() => expect(screen.getByText(/1,800/)).toBeInTheDocument());

    const input = screen.getByDisplayValue('customer@example.com');
    fireEvent.change(input, { target: { value: 'not-an-address' } });

    expect(screen.getByRole('button', { name: /pay and renew/i })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('says so when Billing cannot price the renewal, rather than showing a total', async () => {
    vi.mocked(fetchRenewalPreview).mockRejectedValue(new Error('nope'));
    renderModal();

    await waitFor(() =>
      expect(screen.getByText(/could not get the amount/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /pay and renew/i })).toBeDisabled();
  });

  it('cannot be dismissed while the payment is being opened', async () => {
    const { onClose } = renderModal({ isSubmitting: true });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  /**
   * Renewal calls displayPrice with `emphasis: 'charge'` — roubles lead
   * because that is what the card is actually debited in and what the 54-ФЗ
   * fiscal receipt states. This is the opposite ordering from a marketing
   * surface like TariffCard, and it is the one regression that would slip
   * past every other test here: they all assert the amount is *present*
   * (`/1,800/`), not which figure is the headline. If someone later flips
   * this component to 'marketing', those tests would keep passing while a
   * customer authorised a real charge reading a dollar figure as the total.
   */
  describe('price emphasis (charge — money is about to move here)', () => {
    it('shows the roubles amount as the headline, ahead of the USD figure', async () => {
      const { container } = renderModal();
      await waitFor(() => expect(screen.getByText(/1,800/)).toBeInTheDocument());

      const text = container.textContent ?? '';
      const rubIndex = text.indexOf('1,800');
      const dollarIndex = text.indexOf('$');

      expect(rubIndex).toBeGreaterThan(-1);
      expect(dollarIndex).toBeGreaterThan(-1);
      expect(rubIndex).toBeLessThan(dollarIndex);
    });

    it('leaves the roubles figure exact and marks the USD figure approximate', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/1,800/)).toBeInTheDocument());

      // The primary (roubles) figure carries no approximation marker — it is
      // exact, and it is what the receipt states.
      expect(screen.getByText(/1,800/).textContent ?? '').not.toContain('~');
      // Any $ figure present must carry the '~' that marks it as derived,
      // never presented as an exact amount.
      expect(screen.getByText(/~\$/)).toBeInTheDocument();
    });
  });
});
