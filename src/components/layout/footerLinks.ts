import { routePaths } from '../../i18n/paths';
import type { common as ruCommon } from '../../i18n/dictionaries/ru/common';

type FooterColumns = typeof ruCommon.footer.columns;
export type FooterLinkKey = { [C in keyof FooterColumns]: keyof FooterColumns[C]['links'] }[keyof FooterColumns];

/**
 * Where each footer label goes, keyed by that label's own key in the dictionary.
 *
 * This used to live in Footer.tsx as an array matched to the labels *by
 * position*, which meant inserting a label in the middle silently re-pointed
 * every link after it — and compiled. Keyed and closed by `satisfies`, a label
 * with no destination now fails the Record constraint and a destination with no
 * label fails the excess-property check. Neither can ship.
 *
 * Its own module rather than an export from Footer.tsx so that file keeps
 * exporting only its component, which is what Fast Refresh needs to hot-swap a
 * footer edit without reloading the page.
 */
export const footerLinkPaths = {
  pricing: routePaths.pricing,
  datacenters: routePaths.datacenters,
  api: routePaths.api,
  about: routePaths.about,
  blog: routePaths.blog,
  partners: routePaths.partners,
  contacts: routePaths.contacts,
  terms: routePaths.terms,
  knowledgeBase: routePaths.knowledgeBase,
  status: routePaths.status,
  // Deliberately the same page as `contacts` above: two entrances in the footer,
  // one set of contact details. A second route would be a second copy to keep in
  // step, and it would not stay in step.
  contactUs: routePaths.contacts,
} satisfies Record<FooterLinkKey, string>;
