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
  // Where the payment gateway returns the customer. Localized (unlike /callback)
  // because we build this URL ourselves and know which language they left from.
  checkoutReturn: 'checkout/return',
};

export function localizePath(lang: Lang, path: string) {
  const clean = path.replace(/^\//, '');
  return clean ? `/${lang}/${clean}` : `/${lang}`;
}

// Every "Order" CTA leads here: the configurator section on the pricing page.
export function orderPath(lang: Lang) {
  return `${localizePath(lang, routePaths.pricing)}#configurator`;
}
