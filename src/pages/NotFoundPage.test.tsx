import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { NotFoundPage } from './NotFoundPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { dictionaries } from '../i18n/dictionaries';
import type { Lang } from '../i18n/dictionaries';

describe('NotFoundPage', () => {
  const langs: Lang[] = ['ru', 'en'];

  it.each(langs)('[%s] keeps the visitor in their own language', (lang) => {
    renderWithProviders(<NotFoundPage />, { lang, route: `/${lang}/no-such-page` });

    // The whole point of moving the 404 inside /:lang: the old global catch-all
    // bounced everyone to /en regardless of where they came from.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      dictionaries[lang].common.notFound.title,
    );
  });

  it.each(langs)('[%s] links back to the home page of that language', (lang) => {
    renderWithProviders(<NotFoundPage />, { lang, route: `/${lang}/no-such-page` });

    expect(screen.getByRole('link', { name: dictionaries[lang].common.notFound.backHome })).toHaveAttribute(
      'href',
      `/${lang}`,
    );
  });

  it('does not echo the address that was requested', () => {
    renderWithProviders(<NotFoundPage />, { lang: 'ru', route: '/ru/<script>alert(1)</script>' });

    // Reflecting the visitor's own string buys nothing and is one more thing to
    // get right. Asserting it stays out keeps a future "helpful" tweak honest.
    expect(screen.queryByText(/script|alert/i)).toBeNull();
  });
});
