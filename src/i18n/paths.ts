import type { Lang } from './dictionaries';

export const SUPPORTED_LANGS: Lang[] = ['en', 'ru'];
export const DEFAULT_LANG: Lang = 'en';

export function isLang(value: string | undefined): value is Lang {
  return value === 'en' || value === 'ru';
}

// Relative route segments shared by routes.tsx and every internal link.
export const routePaths = {
  home: '',
  pricing: 'pricing',
  gpuServers: 'products/gpu-servers',
  dashboard: 'dashboard',
  // Order confirmation. Nothing is charged and no invoice exists until the
  // customer confirms here.
  checkout: 'checkout',
  // Where the payment gateway returns the customer. Localized (unlike /callback)
  // because we build this URL ourselves and know which language they left from.
  checkoutReturn: 'checkout/return',
  terms: 'terms',
};

export function localizePath(lang: Lang, path: string) {
  const clean = path.replace(/^\//, '');
  return clean ? `/${lang}/${clean}` : `/${lang}`;
}

// Every "Order" CTA leads here: the configurator section on the pricing page.
export function orderPath(lang: Lang) {
  return `${localizePath(lang, routePaths.pricing)}#configurator`;
}

/**
 * Confirmation page for one plan.
 *
 * `package_code` is the only parameter: it already encodes the term
 * (VDS_PRO_MONTHLY / VDS_PRO_ANNUAL — see PACKAGE_CODE_RE in api/catalogue.ts),
 * so carrying the period separately would be a second source of truth that can
 * disagree with the first. The price is deliberately not in the URL — the page
 * re-reads it from the catalogue, so a shared or hand-edited link cannot show a
 * stale or forged total.
 */
export function checkoutPath(lang: Lang, packageCode: string) {
  return `${localizePath(lang, routePaths.checkout)}?package=${encodeURIComponent(packageCode)}`;
}
