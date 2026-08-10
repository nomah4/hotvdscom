import { RUB_PER_USD } from '../api/config';

function localeForLang(lang: string): string {
  return lang === 'ru' ? 'ru-RU' : 'en-US';
}

export function formatMoneyMinor(amountMinor: number, currency: string, lang: string): string {
  const hasMinorUnits = Math.abs(amountMinor % 100) !== 0;
  return new Intl.NumberFormat(localeForLang(lang), {
    style: 'currency',
    currency,
    minimumFractionDigits: hasMinorUnits ? 2 : 0,
    maximumFractionDigits: hasMinorUnits ? 2 : 0,
  }).format(amountMinor / 100);
}

export function formatMoneyMajor(amountMajor: number, currency: string, lang: string): string {
  return formatMoneyMinor(Math.round(amountMajor * 100), currency, lang);
}

export type PriceEmphasis = 'marketing' | 'charge';

export interface DisplayPrice {
  primary: string;
  secondary: string | null;
}

/**
 * Billing only ever charges RUB (YooKassa cannot take USD). USD here is
 * informational and derived from that RUB amount by a fixed rate — never read
 * from a separate price source — so the displayed figures can never disagree
 * with what actually gets charged.
 *
 * The `~` on the USD figure marks it as approximate. The RUB figure carries no
 * marker: it is exact, and it is what the 54-ФЗ fiscal receipt states.
 *
 * At any surface where money is about to move (checkout, invoice, renewal),
 * RUB must be the primary figure — that is what `emphasis: 'charge'` gives you.
 */
export function displayPrice(
  amountMinor: number,
  currency: string,
  lang: string,
  // Deliberate default: a caller that forgets this argument gets roubles — the
  // figure actually charged — as the primary, not a marketing USD figure.
  emphasis: PriceEmphasis = 'charge',
): DisplayPrice {
  if (currency.toUpperCase() !== 'RUB') {
    // No RUB amount to derive USD from, and nothing else to convert against.
    return { primary: formatMoneyMinor(amountMinor, currency, lang), secondary: null };
  }

  if (lang === 'ru') {
    // Russian visitors only ever see roubles.
    return { primary: formatMoneyMinor(amountMinor, 'RUB', lang), secondary: null };
  }

  const rub = formatMoneyMinor(amountMinor, 'RUB', lang);
  const usdMinor = Math.round(amountMinor / RUB_PER_USD);
  const usd = `~${formatMoneyMinor(usdMinor, 'USD', lang)}`;

  return emphasis === 'marketing' ? { primary: usd, secondary: rub } : { primary: rub, secondary: usd };
}
