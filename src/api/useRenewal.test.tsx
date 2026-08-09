import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ accessToken: 'token', user: { profile: { email: 'customer@example.com' } } }),
}));

vi.mock('./checkout', () => ({
  createInvoice: vi.fn(),
  createInvoiceFromQuote: vi.fn(),
  createRenewal: vi.fn(),
  fetchPaymentMethods: vi.fn().mockResolvedValue([{ method_code: 'card' }]),
  fetchRenewalPreview: vi.fn(),
}));

const { createRenewal, fetchPaymentMethods, fetchRenewalPreview } = await import('./checkout');
const { useRenewal } = await import('./useCheckout');
const { LanguageProvider } = await import('../i18n/LanguageContext');

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/ru/dashboard']}>
      <LanguageProvider lang="ru">{children}</LanguageProvider>
    </MemoryRouter>
  );
}

const subscription = {
  subscription_id: 'sub-1',
  status: 'active',
  package_code: 'VDS_CUSTOM_MONTHLY',
  valid_until: '2026-09-08T00:00:00Z',
} as never;

describe('useRenewal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(fetchPaymentMethods).mockResolvedValue([{ method_code: 'card' }] as never);
    vi.mocked(fetchRenewalPreview).mockResolvedValue({
      amount_minor: 180000,
      currency: 'RUB',
    } as never);
    vi.mocked(createRenewal).mockResolvedValue({
      invoice_id: 'inv-1',
      payment_url: 'https://pay.local/inv-1',
    } as never);
    // The hook hands the browser to the gateway on success; jsdom would warn.
    Object.defineProperty(window, 'location', {
      value: { ...window.location, assign: vi.fn(), origin: 'https://dev.hotvds.com' },
      writable: true,
    });
  });

  /**
   * The regression that mattered: renewal sent no receipt address at all, so on a
   * fiscalized install PO refused the payment and Billing reported it as a 502.
   * Every renewal failed between 2026-08-07 and 2026-08-09 for this reason.
   */
  it('forwards the customer email to Billing', async () => {
    const { result } = renderHook(() => useRenewal(), { wrapper });

    await act(async () => {
      await result.current.renew(subscription, 'accounting@example.com');
    });

    expect(createRenewal).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createRenewal).mock.calls[0][0]).toMatchObject({
      subscriptionId: 'sub-1',
      customerEmail: 'accounting@example.com',
    });
  });

  it('trims the email before sending it', async () => {
    const { result } = renderHook(() => useRenewal(), { wrapper });

    await act(async () => {
      await result.current.renew(subscription, '  spaced@example.com  ');
    });

    expect(vi.mocked(createRenewal).mock.calls[0][0].customerEmail).toBe('spaced@example.com');
  });

  /**
   * Refusing here is the point: sending an empty address gets a 502 back from
   * Billing, which tells the customer nothing about what went wrong.
   */
  it('refuses to open a renewal with no email, and does not call Billing', async () => {
    const { result } = renderHook(() => useRenewal(), { wrapper });

    await act(async () => {
      await result.current.renew(subscription, '   ');
    });

    expect(createRenewal).not.toHaveBeenCalled();
    expect(result.current.error).toBe('missing_email');
    expect(result.current.errorSubscriptionId).toBe('sub-1');
  });

  /**
   * The payment-method lookup is amount-scoped, so the amount has to come from
   * Billing's preview rather than being guessed — a method that cannot take the
   * real total would otherwise be selected.
   */
  it('prices the renewal from Billing before choosing a payment method', async () => {
    const { result } = renderHook(() => useRenewal(), { wrapper });

    await act(async () => {
      await result.current.renew(subscription, 'customer@example.com');
    });

    expect(fetchRenewalPreview).toHaveBeenCalledWith('token', 'sub-1', 'RUB');
    expect(fetchPaymentMethods).toHaveBeenCalledWith('token', 180000, 'RUB');
  });

  it('reports the failure against the subscription that failed', async () => {
    vi.mocked(createRenewal).mockRejectedValue(new Error('renewal_boom'));
    const { result } = renderHook(() => useRenewal(), { wrapper });

    await act(async () => {
      await result.current.renew(subscription, 'customer@example.com');
    });

    expect(result.current.error).toBe('renewal_boom');
    expect(result.current.errorSubscriptionId).toBe('sub-1');
    expect(result.current.renewingId).toBeNull();
  });
});
