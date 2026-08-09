import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
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

const { createInvoice } = await import('./checkout');
const { useCheckout, orderIdempotencyKey, purgeStaleCheckoutKeys } = await import('./useCheckout');
const { LanguageProvider } = await import('../i18n/LanguageContext');

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/ru/checkout']}>
      <LanguageProvider lang="ru">{children}</LanguageProvider>
    </MemoryRouter>
  );
}

const tariff = {
  id: 'pro',
  name: 'Pro',
  cpu: 2,
  ram: 4,
  ssd: 60,
  priceMonthly: 20,
  priceYearly: 200,
  currency: 'RUB',
  packageCode: { monthly: 'VDS_PRO_MONTHLY', annual: 'VDS_PRO_ANNUAL' },
} as never;

const SCOPE = 'VDS_PRO_MONTHLY:RUB';
const STORAGE_KEY = `hotvds.checkoutKey.${SCOPE}`;

/**
 * Ordering the same server twice has to produce two servers — the purchase
 * policy is `separate`, and a customer who clicks Order twice expects two
 * machines.
 *
 * Billing enforces that only as far as the key it is handed lets it: it replays
 * the original response for a repeated `X-Idempotency-Key`. Until 2026-08-09 the
 * key was scoped to package/currency/configuration and retired only when the
 * return page observed the invoice settle, so a second identical order in the
 * same tab replayed the first invoice and no second server appeared.
 *
 * These tests are about *when the key is retired*, not about how it is built —
 * that is where the bug was, and a test of the key-building functions alone
 * would have passed throughout.
 */
describe('useCheckout — idempotency key lifetime', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(createInvoice).mockReset();
    // jsdom refuses real navigation; the call itself is not what is under test.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign: vi.fn() },
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('retires the key once Billing has accepted the purchase', async () => {
    vi.mocked(createInvoice).mockResolvedValue({
      invoice_id: 'inv_1',
      payment_url: 'https://gateway.example/pay/1',
    } as never);

    const { result } = renderHook(() => useCheckout(), { wrapper });
    await act(async () => {
      await result.current.confirm(tariff, 'monthly');
    });

    // Left behind, the next identical order would reuse it and Billing would
    // hand back this same invoice instead of opening a second one.
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('gives a second identical order a different key', async () => {
    vi.mocked(createInvoice).mockResolvedValue({
      invoice_id: 'inv_1',
      payment_url: 'https://gateway.example/pay/1',
    } as never);

    const { result } = renderHook(() => useCheckout(), { wrapper });
    await act(async () => {
      await result.current.confirm(tariff, 'monthly');
    });
    const firstKey = vi.mocked(createInvoice).mock.calls[0][0].idempotencyKey;

    await act(async () => {
      await result.current.confirm(tariff, 'monthly');
    });
    const secondKey = vi.mocked(createInvoice).mock.calls[1][0].idempotencyKey;

    expect(firstKey).toBeTruthy();
    expect(secondKey).not.toBe(firstKey);
  });

  it('retires the key even when payment_url is missing', async () => {
    // The nastiest of the three original cases: the throw landed after the key
    // was minted and the invoice created, but before the invoice was recorded —
    // so nothing could ever find the key to retire it, and every later order of
    // this plan in the tab replayed the first.
    vi.mocked(createInvoice).mockResolvedValue({ invoice_id: 'inv_1', payment_url: null } as never);

    const { result } = renderHook(() => useCheckout(), { wrapper });
    await act(async () => {
      await result.current.confirm(tariff, 'monthly');
    });

    expect(result.current.error).toBe('no_payment_url');
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('keeps the key while the attempt is still in flight', async () => {
    // The key still has a job: it is what makes a retry after a dropped
    // connection reuse the invoice rather than register a second payment.
    let release: (value: unknown) => void = () => {};
    vi.mocked(createInvoice).mockImplementation(
      () => new Promise((resolve) => { release = resolve; }) as never,
    );

    const { result } = renderHook(() => useCheckout(), { wrapper });
    let pending!: Promise<void>;
    await act(async () => {
      pending = result.current.confirm(tariff, 'monthly');
    });

    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();

    await act(async () => {
      release({ invoice_id: 'inv_1', payment_url: 'https://gateway.example/pay/1' });
      await pending;
    });

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('purges keys stranded by an older build', () => {
    // A key never legitimately survives a page load now, so anything present at
    // startup is stranded — including keys written before 2026-08-09, which is
    // how someone already stuck gets out without closing the tab.
    sessionStorage.setItem('hotvds.checkoutKey.VDS_PRO_MONTHLY:RUB', 'stranded-uuid');
    sessionStorage.setItem('hotvds.pendingInvoiceId', '{"invoiceId":"inv_1"}');

    purgeStaleCheckoutKeys();

    expect(sessionStorage.getItem('hotvds.checkoutKey.VDS_PRO_MONTHLY:RUB')).toBeNull();
    // Only the keys — the pending-invoice record is what the return page reads
    // to show an outcome, and it is not an idempotency key.
    expect(sessionStorage.getItem('hotvds.pendingInvoiceId')).not.toBeNull();
  });

  it('reuses the key within one attempt', () => {
    // Two calls with no purchase in between — a remount of the confirm page —
    // must not mint a second key.
    expect(orderIdempotencyKey(SCOPE)).toBe(orderIdempotencyKey(SCOPE));
  });
});
