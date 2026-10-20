import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../api/catalogue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/catalogue')>();
  return { ...actual, useTariffs: vi.fn() };
});

vi.mock('../api/useCheckout', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/useCheckout')>();
  return { ...actual, useCheckout: vi.fn() };
});

vi.mock('../api/checkout', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/checkout')>();
  return { ...actual, createQuote: vi.fn() };
});

const { useAuth } = await import('../auth/AuthContext');
const { createQuote } = await import('../api/checkout');
const { dictionaries } = await import('../i18n/dictionaries');
const { useTariffs } = await import('../api/catalogue');
const { useCheckout } = await import('../api/useCheckout');
const { CheckoutPage } = await import('./CheckoutPage');
const { renderWithProviders } = await import('../test/renderWithProviders');
const { RUB_PER_USD } = await import('../api/config');

const priceMonthly = RUB_PER_USD * 11;

const testTariff = {
  id: 'test-tariff',
  name: 'Test Plan',
  cpu: 2,
  ram: 4,
  ssd: 80,
  traffic: '4 TB',
  priceMonthly,
  priceYearly: priceMonthly * 12,
  currency: 'RUB',
  packageCode: { monthly: 'TEST_MONTHLY', annual: 'TEST_ANNUAL' },
};

/**
 * Checkout is where money is about to move, so `displayPrice` is called with
 * `emphasis: 'charge'`: roubles must lead, because that is what actually gets
 * charged and what the 54-ФЗ fiscal receipt states. A test that only checks
 * the total is *present* would keep passing if this were ever flipped to
 * 'marketing' — this pins which figure is the headline.
 */
describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { profile: { email: 'customer@example.com' } },
      login: vi.fn(),
      isLoading: false,
    } as never);
    vi.mocked(useTariffs).mockReturnValue({ tariffs: [testTariff], isLoading: false, error: null } as never);
    vi.mocked(useCheckout).mockReturnValue({
      confirm: vi.fn(),
      confirmQuote: vi.fn(),
      isSubmitting: false,
      error: null,
    } as never);
  });

  it('[en] shows the roubles amount as the headline, ahead of the USD figure', () => {
    const { container } = renderWithProviders(<CheckoutPage />, {
      lang: 'en',
      route: '/en/checkout?package=TEST_MONTHLY&currency=RUB',
    });

    const rubDigits = String(priceMonthly);
    const text = container.textContent ?? '';
    const rubIndex = text.indexOf(rubDigits);
    const dollarIndex = text.indexOf('$');

    expect(rubIndex).toBeGreaterThan(-1);
    expect(dollarIndex).toBeGreaterThan(-1);
    expect(rubIndex).toBeLessThan(dollarIndex);
  });

  it('[en] leaves the roubles total exact and marks the USD figure approximate', () => {
    renderWithProviders(<CheckoutPage />, {
      lang: 'en',
      route: '/en/checkout?package=TEST_MONTHLY&currency=RUB',
    });

    const rubDigits = String(priceMonthly);
    expect(screen.getByText(new RegExp(rubDigits)).textContent ?? '').not.toContain('~');
    expect(screen.getByText(/~\$/)).toBeInTheDocument();
  });

  it('[ru] shows roubles only — no $ and no ~ anywhere on the page', () => {
    const { container } = renderWithProviders(<CheckoutPage />, {
      lang: 'ru',
      route: '/ru/checkout?package=TEST_MONTHLY&currency=RUB',
    });
    const text = container.textContent ?? '';

    expect(text).not.toContain('$');
    expect(text).not.toContain('~');
    expect(text).toContain(String(priceMonthly));
  });

  describe('custom VDS quote', () => {
    const route = '/en/checkout?package=VDS_CUSTOM_MONTHLY&cpu=1&ram_gb=2&ssd_gb=10&os=ubuntu-24.04&datacenter=ams&currency=RUB';
    const quote = (id: string) => ({
      quote_id: id,
      status: 'active' as const,
      package_code: 'VDS_CUSTOM_MONTHLY',
      amount_minor: 90000,
      currency: 'RUB',
      configuration: { cpu: 1, ram_gb: 2, ssd_gb: 10, os: 'ubuntu-24.04', datacenter: 'ams' },
      expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    });

    it('fetches a fresh quote when Billing refuses an expired one, instead of a dead-end failure', async () => {
      vi.mocked(createQuote).mockReset();
      vi.mocked(createQuote).mockResolvedValueOnce(quote('q-old') as never).mockResolvedValueOnce(quote('q-new') as never);
      const clearError = vi.fn();
      vi.mocked(useCheckout).mockReturnValue({
        confirm: vi.fn(),
        confirmQuote: vi.fn(),
        isSubmitting: false,
        error: 'quote_expired: Quote has expired',
        clearError,
      } as never);
      renderWithProviders(<CheckoutPage />, { lang: 'en', route });

      await waitFor(() => expect(vi.mocked(createQuote)).toHaveBeenCalledTimes(2));
      expect(clearError).toHaveBeenCalled();
    });

    it('keeps the generic failure for any other checkout error', async () => {
      vi.mocked(createQuote).mockReset();
      vi.mocked(createQuote).mockResolvedValue(quote('q-1') as never);
      vi.mocked(useCheckout).mockReturnValue({
        confirm: vi.fn(),
        confirmQuote: vi.fn(),
        isSubmitting: false,
        error: 'no_payment_methods',
        clearError: vi.fn(),
      } as never);
      renderWithProviders(<CheckoutPage />, { lang: 'en', route });

      expect(await screen.findByText(dictionaries.en.pricing.checkout.failed)).toBeInTheDocument();
      expect(vi.mocked(createQuote)).toHaveBeenCalledTimes(1);
    });
  });
});
