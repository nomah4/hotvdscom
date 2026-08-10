import { describe, expect, it, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';

vi.mock('../../api/catalogue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/catalogue')>();
  return { ...actual, useConfigurableVds: vi.fn() };
});

vi.mock('../../api/checkout', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/checkout')>();
  return { ...actual, createQuote: vi.fn() };
});

const { useConfigurableVds } = await import('../../api/catalogue');
const { createQuote } = await import('../../api/checkout');
const { PricingSlider } = await import('./PricingSlider');
const { renderWithProviders } = await import('../../test/renderWithProviders');
const { RUB_PER_USD } = await import('../../api/config');

// Same "clean multiple of RUB_PER_USD" trick as TariffCard.test.tsx and
// CheckoutPage.test.tsx: the quote amount is derived from the fixed rate
// rather than a hardcoded 990, so a future rate change keeps producing an
// unambiguous whole-dollar USD figure instead of quietly invalidating this.
const amountMajor = RUB_PER_USD * 11;
const amountMinor = amountMajor * 100;

const customPackage = {
  packageCode: { monthly: 'TEST_CUSTOM_MONTHLY', annual: 'TEST_CUSTOM_ANNUAL' },
  currency: 'RUB',
  schema: { dimensions: {}, options: {} },
  uiSchema: {},
  displayName: 'Custom VDS',
};

/**
 * PricingSlider is a marketing surface (`displayPrice(..., 'marketing')`), so
 * the live quote should lead with the approximate USD figure and carry the
 * roubles amount underneath it, same as TariffCard. The quote itself comes
 * from `createQuote`, fired 350ms after the last slider/select change — the
 * waits below cross that debounce for real rather than mocking it away.
 */
describe('PricingSlider', () => {
  beforeEach(() => {
    vi.mocked(useConfigurableVds).mockReturnValue({
      customPackage,
      isLoading: false,
      error: null,
    } as never);
    vi.mocked(createQuote).mockResolvedValue({
      quote_id: 'quote-1',
      status: 'active',
      package_code: 'TEST_CUSTOM_MONTHLY',
      amount_minor: amountMinor,
      currency: 'RUB',
      configuration: { cpu: 4, ram_gb: 8, ssd_gb: 80, os: 'ubuntu-24.04', datacenter: 'ams' },
      expires_at: new Date().toISOString(),
    } as never);
  });

  it(
    '[en] leads with the approximate USD figure, roubles present as a subordinate figure',
    async () => {
      const { container } = renderWithProviders(<PricingSlider />, { lang: 'en' });

      await waitFor(() => expect(createQuote).toHaveBeenCalled(), { timeout: 2000 });

      const rubDigits = String(amountMajor);
      await waitFor(
        () => {
          const text = container.textContent ?? '';
          expect(text).toContain(rubDigits);
        },
        { timeout: 2000 },
      );

      const text = container.textContent ?? '';
      const dollarIndex = text.indexOf('$');
      const rubIndex = text.indexOf(rubDigits);

      expect(dollarIndex).toBeGreaterThan(-1);
      expect(text).toContain('~');
      expect(rubIndex).toBeGreaterThan(-1);
      expect(dollarIndex).toBeLessThan(rubIndex);
    },
    5000,
  );

  it(
    '[ru] shows roubles only — no $ and no ~ anywhere once the quote loads',
    async () => {
      const { container } = renderWithProviders(<PricingSlider />, { lang: 'ru' });

      await waitFor(() => expect(createQuote).toHaveBeenCalled(), { timeout: 2000 });

      const rubDigits = String(amountMajor);
      await waitFor(
        () => {
          const text = container.textContent ?? '';
          expect(text).toContain(rubDigits);
        },
        { timeout: 2000 },
      );

      const text = container.textContent ?? '';
      expect(text).not.toContain('$');
      expect(text).not.toContain('~');
    },
    5000,
  );
});
