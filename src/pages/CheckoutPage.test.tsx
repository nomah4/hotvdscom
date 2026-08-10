import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

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

const { useAuth } = await import('../auth/AuthContext');
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
});
