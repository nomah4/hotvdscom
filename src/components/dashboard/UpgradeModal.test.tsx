import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ accessToken: 'token', user: { profile: { email: 'customer@example.com' } } }),
}));

vi.mock('../../api/checkout', () => ({
  fetchUpgradePreview: vi.fn(),
}));

vi.mock('../../api/catalogue', () => ({
  useConfigurableVds: () => ({
    customPackage: {
      schema: {
        dimensions: {
          cpu: { min: 1, max: 16, step: 1 },
          ram_gb: { min: 2, max: 64, step: 2 },
          ssd_gb: { min: 10, max: 640, step: 10 },
        },
      },
    },
    isLoading: false,
    error: null,
  }),
}));

const balanceState = { balance: null as null | { amount_minor: number; currency: string } };
vi.mock('../../api/balance', () => ({
  useBalance: () => ({ balance: balanceState.balance }),
}));

const { fetchUpgradePreview } = await import('../../api/checkout');
const { UpgradeModal } = await import('./UpgradeModal');
const { renderWithProviders } = await import('../../test/renderWithProviders');
const { dictionaries } = await import('../../i18n/dictionaries');

const subscription = {
  subscription_id: 'sub-1',
  status: 'active',
  package_code: 'VDS_CUSTOM_MONTHLY',
  valid_until: '2026-11-15T23:59:59Z',
  upgradable: true,
  configuration: { cpu: 2, ram_gb: 8, ssd_gb: 40 },
} as never;

const preview = {
  subscription_id: 'sub-1',
  amount_minor: 38800,
  currency: 'RUB',
  valid_until: '2026-11-15T23:59:59Z',
  remaining_seconds: 1296000,
  term_seconds: 2678400,
  current_configuration: { cpu: 2, ram_gb: 8, ssd_gb: 40 },
  new_configuration: { cpu: 2, ram_gb: 16, ssd_gb: 40 },
  current_renewal_amount_minor: 270000,
  renewal_amount_minor: 414000,
  breakdown: [],
};

function renderModal(overrides: Record<string, unknown> = {}) {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(
    <UpgradeModal
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
  return { onConfirm, onClose };
}

const t = dictionaries.en.dashboard.upgrade;

function moveRam(value: number) {
  fireEvent.change(screen.getByLabelText(t.ram), { target: { value: String(value) } });
}

describe('UpgradeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    balanceState.balance = null;
    vi.mocked(fetchUpgradePreview).mockResolvedValue(preview as never);
  });

  /** Нечего улучшать, пока ничего не выбрано: денег брать не с чего. */
  it('asks nothing of Billing and cannot be confirmed until a value is raised', () => {
    renderModal();

    expect(screen.getByText(t.pickMore)).toBeInTheDocument();
    expect(fetchUpgradePreview).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: t.confirm })).toBeDisabled();
  });

  /** Апгрейд только вверх: ползунок физически не опускается ниже нынешнего. */
  it('never lets a slider go below what the server already has', () => {
    renderModal();

    expect(screen.getByLabelText(t.cpu)).toHaveAttribute('min', '2');
    expect(screen.getByLabelText(t.ram)).toHaveAttribute('min', '8');
    expect(screen.getByLabelText(t.ssd)).toHaveAttribute('min', '40');
  });

  it('takes the upper limits from the package schema', () => {
    renderModal();

    expect(screen.getByLabelText(t.ram)).toHaveAttribute('max', '64');
    expect(screen.getByLabelText(t.ram)).toHaveAttribute('step', '2');
  });

  it('shows the surcharge Billing quotes for the chosen resources', async () => {
    renderModal();
    moveRam(16);

    await waitFor(() => expect(screen.getByText(/388/)).toBeInTheDocument());
    expect(fetchUpgradePreview).toHaveBeenCalledWith(
      'token',
      'sub-1',
      { cpu: 2, ram_gb: 16, ssd_gb: 40 },
      'RUB',
    );
  });

  it('shows what the next renewal will cost before and after', async () => {
    renderModal();
    moveRam(16);

    await waitFor(() => expect(screen.getByText(/4,140/)).toBeInTheDocument());
    expect(screen.getByText(/2,700/)).toBeInTheDocument();
  });

  it('sends the receipt email and the chosen resources on confirm', async () => {
    const { onConfirm } = renderModal();
    moveRam(16);
    await waitFor(() => expect(screen.getByText(/388/)).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue('customer@example.com'), {
      target: { value: 'accounting@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: t.confirm }));

    expect(onConfirm).toHaveBeenCalledWith('accounting@example.com', {
      cpu: 2,
      ram_gb: 16,
      ssd_gb: 40,
    });
  });

  /** Нельзя брать деньги за сумму, которую клиент не видел. */
  it('cannot be confirmed while the surcharge is still being calculated', () => {
    vi.mocked(fetchUpgradePreview).mockReturnValue(new Promise(() => {}) as never);
    renderModal();
    moveRam(16);

    expect(screen.getByRole('button', { name: t.confirm })).toBeDisabled();
  });

  it('cannot be confirmed with an unusable email', async () => {
    renderModal();
    moveRam(16);
    await waitFor(() => expect(screen.getByText(/388/)).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue('customer@example.com'), {
      target: { value: 'not-an-address' },
    });

    expect(screen.getByRole('button', { name: t.confirm })).toBeDisabled();
  });

  /** Правило «когда можно» живёт у биллинга; окно говорит его словами. */
  it('explains why Billing refused, in words the customer can act on', async () => {
    vi.mocked(fetchUpgradePreview).mockRejectedValue(
      new Error('renewal_in_progress: A renewal is waiting for payment'),
    );
    renderModal();
    moveRam(16);

    await waitFor(() => expect(screen.getByText(t.errors.renewalInProgress)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: t.confirm })).toBeDisabled();
  });

  it('does not show the raw server text for an unknown refusal', async () => {
    vi.mocked(fetchUpgradePreview).mockRejectedValue(new Error('weird_code: internal detail 0xDEAD'));
    renderModal();
    moveRam(16);

    await waitFor(() => expect(screen.getByText(t.errors.generic)).toBeInTheDocument());
    expect(screen.queryByText(/0xDEAD/)).not.toBeInTheDocument();
  });

  it('translates the hook error about a different unpaid upgrade', () => {
    renderModal({ submitError: 'upgrade_open_differs' });
    expect(screen.getByText(t.errors.openDiffers)).toBeInTheDocument();
  });

  it('offers to pay from the balance when it covers the surcharge', async () => {
    balanceState.balance = { amount_minor: 100000, currency: 'RUB' };
    renderModal();
    moveRam(16);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: t.confirmFromBalance })).toBeInTheDocument(),
    );
  });

  it('keeps the card button when the balance is not enough', async () => {
    balanceState.balance = { amount_minor: 100, currency: 'RUB' };
    renderModal();
    moveRam(16);

    await waitFor(() => expect(screen.getByText(/388/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: t.confirm })).toBeInTheDocument();
  });

  it('warns about the reboot, and about the disk only when the disk grows', async () => {
    renderModal();
    expect(screen.getByText(t.rebootWarning)).toBeInTheDocument();

    moveRam(16);
    expect(screen.queryByText(t.diskNote)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(t.ssd), { target: { value: '80' } });
    expect(screen.getByText(t.diskNote)).toBeInTheDocument();
  });

  it('cannot be dismissed while the payment is being opened', () => {
    const { onClose } = renderModal({ isSubmitting: true });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  /** Деньги списываются в рублях, и чек тоже в рублях. */
  it('leads with the roubles amount, ahead of the USD figure', async () => {
    const { container } = (() => {
      renderModal();
      return { container: document.body };
    })();
    moveRam(16);
    await waitFor(() => expect(screen.getByText(/388/)).toBeInTheDocument());

    const text = container.textContent ?? '';
    expect(text.indexOf('388')).toBeGreaterThan(-1);
    expect(text.indexOf('388')).toBeLessThan(text.indexOf('$'));
  });
});
