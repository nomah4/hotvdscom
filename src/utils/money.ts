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
