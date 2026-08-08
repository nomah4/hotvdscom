import { describe, expect, it } from 'vitest';
import { cleanup, screen, within } from '@testing-library/react';
import { Footer } from './Footer';
import { renderWithProviders } from '../../test/renderWithProviders';
import { dictionaries } from '../../i18n/dictionaries';
import { routePaths } from '../../i18n/paths';
import type { Lang } from '../../i18n/dictionaries';

/**
 * The footer is the site map: it is the only place most of these pages are
 * linked from, so a link that goes nowhere is a page nobody can reach.
 *
 * These tests no longer guard the old index-pairing bug — labels and paths are
 * now matched by key and closed with `satisfies`, so a missing destination is a
 * compile error. What is left is what types cannot see: that the paths were
 * actually registered as routes, and that both languages agree.
 */
describe('Footer', () => {
  const langs: Lang[] = ['ru', 'en'];

  function footerHrefs(lang: Lang) {
    // Auto-cleanup runs between tests, not between renders inside one — and the
    // ordering test below renders both languages in a single test.
    cleanup();
    renderWithProviders(<Footer />, { lang });
    return screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
      .filter((href): href is string => href !== null);
  }

  it.each(langs)('[%s] points every link at a segment declared in routePaths', (lang) => {
    const segments = new Set(Object.values(routePaths));

    for (const href of footerHrefs(lang)) {
      // The brand logo links home, which is the empty segment.
      expect(segments).toContain(href.replace(`/${lang}`, '').replace(/^\//, ''));
    }
  });

  it.each(langs)('[%s] leaves no link inert', (lang) => {
    const links = footerHrefs(lang).filter((href) => href !== `/${lang}`);

    expect(links.length).toBeGreaterThan(0);
    // `to="#"` used to be how a label with no page was rendered; react-router
    // resolved it against the current location, so an inert link looked like a
    // working one pointing at the page you were already on.
    for (const href of links) {
      expect(href).not.toBe('#');
    }
  });

  it.each(langs)('[%s] sends both contact entrances to the same page', (lang) => {
    renderWithProviders(<Footer />, { lang });
    const t = dictionaries[lang].common.footer.columns;

    // Two entrances, one page — a second route would be a second copy of the
    // contact details, and the two would drift.
    const contacts = screen.getByRole('link', { name: t.company.links.contacts });
    const contactUs = screen.getByRole('link', { name: t.support.links.contactUs });

    expect(contacts).toHaveAttribute('href', `/${lang}/${routePaths.contacts}`);
    expect(contactUs).toHaveAttribute('href', `/${lang}/${routePaths.contacts}`);
  });

  it('renders the same links in the same order in both languages', () => {
    // Key order in the dictionary *is* display order. The parity test sorts keys
    // before comparing, so reordering one language and not the other slips past
    // it — the two footers would then read differently top to bottom.
    const [ru, en] = langs.map((lang) => footerHrefs(lang).map((href) => href.replace(/^\/(ru|en)/, '')));

    expect(ru).toEqual(en);
  });

  it.each(langs)('[%s] pairs each product label with its own href', (lang) => {
    renderWithProviders(<Footer />, { lang });
    const t = dictionaries[lang].common.footer.columns.product;
    const column = screen.getByRole('heading', { name: t.title }).parentElement!;

    expect(within(column).getByRole('link', { name: t.links.pricing })).toHaveAttribute(
      'href',
      `/${lang}/${routePaths.pricing}`,
    );
    expect(within(column).getByRole('link', { name: t.links.datacenters })).toHaveAttribute(
      'href',
      `/${lang}/${routePaths.datacenters}`,
    );
    expect(within(column).getByRole('link', { name: t.links.api })).toHaveAttribute('href', `/${lang}/${routePaths.api}`);
  });

  it.each(langs)('[%s] no longer calls itself a prototype', (lang) => {
    renderWithProviders(<Footer />, { lang });

    expect(screen.getByText(/©/)).not.toHaveTextContent(/прототип|prototype/i);
  });

  it.each(langs)('[%s] advertises no GPU servers', (lang) => {
    renderWithProviders(<Footer />, { lang });

    expect(screen.queryByText(/gpu/i)).toBeNull();
  });
});
