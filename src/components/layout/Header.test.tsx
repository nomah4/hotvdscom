import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { dictionaries } from '../../i18n/dictionaries';
import type { Lang } from '../../i18n/dictionaries';

// AuthProvider builds an oidc-client UserManager on mount, which is more than a
// nav test needs. Only the shape Header destructures matters here.
vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    openAuthPrompt: vi.fn(),
  }),
}));

const { Header } = await import('./Header');

describe('Header', () => {
  const langs: Lang[] = ['ru', 'en'];

  // `hidden: true` because jsdom does not resolve media queries: the desktop nav
  // keeps its mobile-first `display: none` and would otherwise be invisible to
  // role queries. Desktop and mobile nav render the same array, hence getAll.
  const link = (name: string) => screen.getAllByRole('link', { name, hidden: true })[0];

  it.each(langs)('[%s] shows Home, Pricing and Dashboard', (lang) => {
    renderWithProviders(<Header />, { lang });
    const t = dictionaries[lang].common.nav;

    expect(link(t.home)).toHaveAttribute('href', `/${lang}`);
    expect(link(t.pricing)).toHaveAttribute('href', `/${lang}/pricing`);
    expect(link(t.dashboard)).toHaveAttribute('href', `/${lang}/dashboard`);
  });

  it.each(langs)('[%s] offers no GPU servers entry', (lang) => {
    renderWithProviders(<Header />, { lang });

    expect(screen.queryByText(/gpu/i)).toBeNull();
    expect(screen.queryByRole('link', { name: /gpu/i, hidden: true })).toBeNull();
  });
});
