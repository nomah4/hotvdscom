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
  createUpgrade: vi.fn(),
  fetchPaymentMethods: vi.fn(),
  fetchRenewalPreview: vi.fn(),
  fetchUpgradePreview: vi.fn(),
}));

const { createUpgrade, fetchPaymentMethods, fetchUpgradePreview } = await import('./checkout');
const { useUpgrade } = await import('./useCheckout');
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
  valid_until: '2026-11-15T23:59:59Z',
  upgradable: true,
} as never;

const RESOURCES = { cpu: 2, ram_gb: 16, ssd_gb: 40 };

describe('useUpgrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(fetchPaymentMethods).mockResolvedValue([{ method_code: 'card' }] as never);
    vi.mocked(fetchUpgradePreview).mockResolvedValue({
      amount_minor: 38800,
      currency: 'RUB',
    } as never);
    vi.mocked(createUpgrade).mockResolvedValue({
      upgrade_id: 'up-1',
      invoice_id: 'inv-1',
      status: 'pending_payment',
      payment_url: 'https://pay.local/inv-1',
      configuration: RESOURCES,
    } as never);
    Object.defineProperty(window, 'location', {
      value: { ...window.location, assign: vi.fn(), origin: 'https://dev.hotvds.com' },
      writable: true,
    });
  });

  it('prices the upgrade, picks a payment method for that amount and opens the gateway', async () => {
    const { result } = renderHook(() => useUpgrade(), { wrapper });

    await act(async () => {
      await result.current.upgrade(subscription, RESOURCES, 'customer@example.com');
    });

    expect(fetchUpgradePreview).toHaveBeenCalledWith('token', 'sub-1', RESOURCES, 'RUB');
    expect(fetchPaymentMethods).toHaveBeenCalledWith('token', 38800, 'RUB');
    expect(window.location.assign).toHaveBeenCalledWith('https://pay.local/inv-1');
    expect(result.current.error).toBeNull();
  });

  /** Та же беда, что была у продления: без адреса фискальный шлюз отвечает 502. */
  it('forwards the trimmed receipt email together with the chosen resources', async () => {
    const { result } = renderHook(() => useUpgrade(), { wrapper });

    await act(async () => {
      await result.current.upgrade(subscription, RESOURCES, '  accounting@example.com  ');
    });

    expect(vi.mocked(createUpgrade).mock.calls[0][0]).toMatchObject({
      subscriptionId: 'sub-1',
      resources: RESOURCES,
      customerEmail: 'accounting@example.com',
      methodCode: 'card',
    });
  });

  it('refuses to start without an email and never calls Billing', async () => {
    const { result } = renderHook(() => useUpgrade(), { wrapper });

    await act(async () => {
      await result.current.upgrade(subscription, RESOURCES, '   ');
    });

    expect(result.current.error).toBe('missing_email');
    expect(result.current.errorSubscriptionId).toBe('sub-1');
    expect(fetchUpgradePreview).not.toHaveBeenCalled();
    expect(createUpgrade).not.toHaveBeenCalled();
  });

  /**
   * Биллинг возвращает уже открытую неоплаченную попытку, а не новую. Если у неё
   * другие цифры, платить её молча нельзя: клиент выбирал не это.
   */
  it('refuses to send the customer to pay an older attempt with different values', async () => {
    vi.mocked(createUpgrade).mockResolvedValue({
      upgrade_id: 'up-old',
      invoice_id: 'inv-old',
      status: 'pending_payment',
      payment_url: 'https://pay.local/inv-old',
      configuration: { cpu: 2, ram_gb: 12, ssd_gb: 40 },
    } as never);
    const { result } = renderHook(() => useUpgrade(), { wrapper });

    await act(async () => {
      await result.current.upgrade(subscription, RESOURCES, 'customer@example.com');
    });

    expect(result.current.error).toBe('upgrade_open_differs');
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it('does not leave the page when the balance paid, and reports it', async () => {
    vi.mocked(createUpgrade).mockResolvedValue({
      upgrade_id: 'up-1',
      invoice_id: 'inv-1',
      status: 'paid',
      payment_url: null,
      paid_from_balance: true,
      configuration: RESOURCES,
    } as never);
    const onPaidFromBalance = vi.fn();
    const { result } = renderHook(() => useUpgrade({ onPaidFromBalance }), { wrapper });

    await act(async () => {
      await result.current.upgrade(subscription, RESOURCES, 'customer@example.com');
    });

    expect(window.location.assign).not.toHaveBeenCalled();
    expect(result.current.paidFromBalance).toBe('sub-1');
    expect(onPaidFromBalance).toHaveBeenCalledWith(subscription);
    expect(result.current.error).toBeNull();
  });

  it('reports a Billing refusal against the subscription it belongs to', async () => {
    vi.mocked(fetchUpgradePreview).mockRejectedValue(
      new Error('provisioning_not_ready: The server is not ready yet'),
    );
    const { result } = renderHook(() => useUpgrade(), { wrapper });

    await act(async () => {
      await result.current.upgrade(subscription, RESOURCES, 'customer@example.com');
    });

    expect(result.current.error).toMatch(/^provisioning_not_ready/);
    expect(result.current.errorSubscriptionId).toBe('sub-1');
    expect(result.current.upgradingId).toBeNull();
    expect(createUpgrade).not.toHaveBeenCalled();
  });

  it('says so when no payment method is available', async () => {
    vi.mocked(fetchPaymentMethods).mockResolvedValue([] as never);
    const { result } = renderHook(() => useUpgrade(), { wrapper });

    await act(async () => {
      await result.current.upgrade(subscription, RESOURCES, 'customer@example.com');
    });

    expect(result.current.error).toBe('no_payment_methods');
    expect(createUpgrade).not.toHaveBeenCalled();
  });

  /**
   * Ключ идемпотентности привязан к цифрам: после неудачи клиент мог передвинуть
   * ползунок, и тот же ключ с другим телом биллинг отверг бы как конфликт.
   */
  it('uses a different idempotency key for different resources', async () => {
    vi.mocked(createUpgrade).mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useUpgrade(), { wrapper });

    await act(async () => {
      await result.current.upgrade(subscription, RESOURCES, 'customer@example.com');
    });
    await act(async () => {
      await result.current.upgrade(subscription, { cpu: 2, ram_gb: 24, ssd_gb: 40 }, 'customer@example.com');
    });

    const keys = vi.mocked(createUpgrade).mock.calls.map((call) => call[0].idempotencyKey);
    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it('retries the same values under the same key until Billing accepts them', async () => {
    vi.mocked(createUpgrade).mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useUpgrade(), { wrapper });

    await act(async () => {
      await result.current.upgrade(subscription, RESOURCES, 'customer@example.com');
    });
    await act(async () => {
      await result.current.upgrade(subscription, RESOURCES, 'customer@example.com');
    });

    const keys = vi.mocked(createUpgrade).mock.calls.map((call) => call[0].idempotencyKey);
    expect(keys[0]).toBe(keys[1]);
  });

  /** Принятая попытка не должна пережить себя: следующий апгрейд — новый запрос. */
  it('retires the key once Billing has accepted the upgrade', async () => {
    const { result } = renderHook(() => useUpgrade(), { wrapper });

    await act(async () => {
      await result.current.upgrade(subscription, RESOURCES, 'customer@example.com');
    });
    await act(async () => {
      await result.current.upgrade(subscription, RESOURCES, 'customer@example.com');
    });

    const keys = vi.mocked(createUpgrade).mock.calls.map((call) => call[0].idempotencyKey);
    expect(keys[0]).not.toBe(keys[1]);
  });
});
