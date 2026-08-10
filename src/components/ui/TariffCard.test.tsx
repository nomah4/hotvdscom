import { describe, expect, it } from 'vitest';
import { TariffCard } from './TariffCard';
import { renderWithProviders } from '../../test/renderWithProviders';
import { RUB_PER_USD } from '../../api/config';
import type { Tariff } from '../../data/tariffs';

/**
 * TariffCard is a marketing surface (`displayPrice(..., 'marketing')`), so a
 * USD headline is intentional on EN. What must never happen is that emphasis
 * reaching a RUB visitor, or the RUB figure silently disappearing on EN — this
 * pins both through the rendered DOM rather than through money.ts's own
 * (already-covered) arithmetic.
 *
 * The tariff price is built as RUB_PER_USD * 11 rather than a hardcoded 990,
 * so a future change to the fixed rate keeps producing a clean, unambiguous
 * whole-dollar figure instead of quietly making these assertions meaningless.
 */
function tariff(overrides: Partial<Tariff> = {}): Tariff {
  const priceMonthly = RUB_PER_USD * 11;
  return {
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
    ...overrides,
  };
}

describe('TariffCard', () => {
  it('[en] leads with the approximate USD figure, roubles present as a subordinate figure', () => {
    const { container } = renderWithProviders(<TariffCard tariff={tariff()} />, { lang: 'en' });
    const text = container.textContent ?? '';

    const rubDigits = String(RUB_PER_USD * 11);
    const dollarIndex = text.indexOf('$');
    const rubIndex = text.indexOf(rubDigits);

    expect(dollarIndex).toBeGreaterThan(-1);
    expect(text).toContain('~');
    expect(rubIndex).toBeGreaterThan(-1);
    // The USD figure is the headline on this marketing surface: it must read
    // before the rouble figure, not after it.
    expect(dollarIndex).toBeLessThan(rubIndex);
  });

  it('[ru] shows roubles only — no $ and no ~ anywhere in the card', () => {
    const { container } = renderWithProviders(<TariffCard tariff={tariff()} />, { lang: 'ru' });
    const text = container.textContent ?? '';

    // The "Russian visitors see no change" guarantee: nothing on this card may
    // hint at a dollar figure when lang is ru, regardless of the emphasis the
    // component asks for.
    expect(text).not.toContain('$');
    expect(text).not.toContain('~');
    expect(text).toContain(String(RUB_PER_USD * 11));
  });
});
