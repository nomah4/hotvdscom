import { describe, expect, it } from 'vitest';
import { displayPrice } from './money';

/**
 * USD here is never a second price source — it is arithmetic on the RUB
 * amount actually charged (RUB_PER_USD = 90, see src/api/config.ts). These
 * tests pin that arithmetic and the emphasis/lang branching around it, not
 * the exact Intl.NumberFormat string shape, which varies by runtime and by
 * locale (RUB in en-US renders as "RUB 990", not the "990 ₽" of ru-RU).
 */
describe('displayPrice', () => {
  it.each(['marketing', 'charge'] as const)('[ru, %s] shows roubles only', (emphasis) => {
    const result = displayPrice(99000, 'RUB', 'ru', emphasis);

    expect(result.primary).toContain('990');
    expect(result.secondary).toBeNull();
  });

  it("[en, marketing] leads with the approximate USD figure, roubles as secondary", () => {
    const result = displayPrice(99000, 'RUB', 'en', 'marketing');

    expect(result.primary).toContain('~');
    expect(result.primary).toContain('$');
    expect(result.secondary).not.toBeNull();
    expect(result.secondary).toContain('990');
  });

  it('[en, charge] leads with the exact roubles figure, approximate USD as secondary', () => {
    const result = displayPrice(99000, 'RUB', 'en', 'charge');

    expect(result.primary).not.toContain('~');
    expect(result.primary).toContain('990');
    expect(result.secondary).toContain('~');
    expect(result.secondary).toContain('$');
  });

  it('defaults to charge emphasis when the argument is omitted — roubles stay primary', () => {
    const withDefault = displayPrice(99000, 'RUB', 'en');
    const withExplicitCharge = displayPrice(99000, 'RUB', 'en', 'charge');

    expect(withDefault).toEqual(withExplicitCharge);
    expect(withDefault.primary).not.toContain('~');
  });

  it('passes a non-RUB currency through unconverted', () => {
    const result = displayPrice(1150, 'USD', 'en', 'marketing');

    expect(result.primary).toContain('$11.50');
    expect(result.secondary).toBeNull();
  });

  it.each([
    // formatMoneyMinor drops the decimals when the converted USD amount is a
    // whole number of dollars (its own hasMinorUnits check, applied to the
    // *converted* minor units) — so these come out "$11", not "$11.00".
    [99000, '$11'],
    [198000, '$22'],
    [1224000, '$136'],
    // Real value in the live catalogue today — regression pin. Not a whole
    // dollar amount, so this one does keep its decimals: "$0.11".
    [1000, '$0.11'],
  ])('converts %i RUB minor units to %s at the fixed rate', (amountMinor, expectedUsd) => {
    const result = displayPrice(amountMinor, 'RUB', 'en', 'marketing');

    expect(result.primary).toBe(`~${expectedUsd}`);
  });
});
