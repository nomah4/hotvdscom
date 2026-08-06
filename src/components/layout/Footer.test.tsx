import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Footer } from './Footer';
import { renderWithProviders } from '../../test/renderWithProviders';
import { dictionaries } from '../../i18n/dictionaries';
import type { Lang } from '../../i18n/dictionaries';

/**
 * The footer pairs a label from the dictionary with a path from footerLinkPaths
 * *by array index*. Neither array is length-typed, so deleting an entry from one
 * and not the other compiles cleanly and silently re-points the remaining links
 * at the wrong pages. These tests are the only thing that catches that.
 */
describe('Footer', () => {
  const langs: Lang[] = ['ru', 'en'];

  it.each(langs)('[%s] pairs each product label with its own href', (lang) => {
    renderWithProviders(<Footer />, { lang });
    const t = dictionaries[lang].common.footer.columns.product;
    const column = screen.getByRole('heading', { name: t.title }).parentElement!;
    const [pricing, datacenters, api] = t.links;

    expect(within(column).getByRole('link', { name: pricing })).toHaveAttribute('href', `/${lang}/pricing`);
    // Pages that don't exist yet must stay inert rather than borrowing a
    // neighbour's href. Their `to="#"` is resolved by the router against the
    // current location, so the rendered href is the page you're already on.
    expect(within(column).getByRole('link', { name: datacenters })).toHaveAttribute('href', `/${lang}`);
    expect(within(column).getByRole('link', { name: api })).toHaveAttribute('href', `/${lang}`);
  });

  it.each(langs)('[%s] links Terms of Service, the one real company link', (lang) => {
    renderWithProviders(<Footer />, { lang });
    const t = dictionaries[lang].common.footer.columns.company;
    const terms = t.links[t.links.length - 1];

    expect(screen.getByRole('link', { name: terms })).toHaveAttribute('href', `/${lang}/terms`);
  });

  it.each(langs)('[%s] advertises no GPU servers', (lang) => {
    renderWithProviders(<Footer />, { lang });

    expect(screen.queryByText(/gpu/i)).toBeNull();
  });
});
