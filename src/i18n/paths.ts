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
  dashboard: 'dashboard',
  // Staff view of who has been granted access to the storefront. Gated by the
  // hotvds_admin role in the UI, and by ZITADEL's own permission check on the
  // data behind it.
  admin: 'admin',
  // Ordering from inside the account, so a customer who already has servers
  // never has to go back out to the storefront to buy another. Same configurator
  // and the same /checkout as the public pricing page — only the chrome differs.
  newServer: 'dashboard/new',
  // Technical support inside the account. Chat lives in Chatwoot on its own
  // machine; this page is the way in and the place that says what support
  // covers.
  support: 'dashboard/support',
  // Order confirmation. Nothing is charged and no invoice exists until the
  // customer confirms here.
  checkout: 'checkout',
  // Where the payment gateway returns the customer. Localized (unlike /callback)
  // because we build this URL ourselves and know which language they left from.
  checkoutReturn: 'checkout/return',
  terms: 'terms',

  // Everything the footer links to. Each one is a real page — the footer is the
  // site map, so a segment listed here without a <Route> in routes.tsx is a
  // visitor sent to the not-found page by their own navigation.
  datacenters: 'datacenters',
  api: 'api',
  about: 'about',
  blog: 'blog',
  partners: 'partners',
  // Reached from two footer columns: "Контакты" under Company and "Связаться с
  // нами" under Support. One page, two entrances — deliberately not two routes.
  contacts: 'contacts',
  knowledgeBase: 'knowledge-base',
  status: 'status',
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
export function checkoutPath(lang: Lang, packageCode: string, currency?: string) {
  const params = new URLSearchParams({ package: packageCode });
  if (currency) params.set('currency', currency);
  return `${localizePath(lang, routePaths.checkout)}?${params.toString()}`;
}

export interface CustomCheckoutConfiguration {
  cpu: number;
  ram_gb: number;
  ssd_gb: number;
  os: string;
  datacenter: string;
}

export function customCheckoutPath(
  lang: Lang,
  packageCode: string,
  configuration: CustomCheckoutConfiguration,
  currency?: string,
) {
  const params = new URLSearchParams({
    package: packageCode,
    cpu: String(configuration.cpu),
    ram_gb: String(configuration.ram_gb),
    ssd_gb: String(configuration.ssd_gb),
    os: configuration.os,
    datacenter: configuration.datacenter,
  });
  if (currency) params.set('currency', currency);
  return `${localizePath(lang, routePaths.checkout)}?${params.toString()}`;
}
