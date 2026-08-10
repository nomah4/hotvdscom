import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { dictionaries } from '../../i18n/dictionaries';
import type { Lang } from '../../i18n/dictionaries';

// AuthProvider builds an oidc-client UserManager on mount, which is more than a
// nav test needs. Only the shape Header destructures matters here — mutable so a
// test can flip the session on without re-mocking the module.
const mockAuth = {
  isAuthenticated: false,
  displayName: '',
  isAdmin: false,
  login: vi.fn(),
  logout: vi.fn(),
  openAuthPrompt: vi.fn(),
};

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

const { Header } = await import('./Header');

describe('Header', () => {
  const langs: Lang[] = ['ru', 'en'];

  beforeEach(() => {
    mockAuth.isAuthenticated = false;
    mockAuth.displayName = '';
    mockAuth.isAdmin = false;
    vi.clearAllMocks();
  });

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

  // Signing in from the storefront is a request for the account, not for the
  // marketing page the visitor happened to be reading.
  it.each(langs)('[%s] sends sign-in back to the dashboard, not the current page', (lang) => {
    renderWithProviders(<Header />, { lang });

    // getAll: the desktop header and the mobile menu each render a sign-in button.
    fireEvent.click(
      screen.getAllByRole('button', { name: dictionaries[lang].common.buttons.login, hidden: true })[0],
    );

    expect(mockAuth.login).toHaveBeenCalledWith(`/${lang}/dashboard`);
  });

  it.each(langs)('[%s] greets a signed-in visitor by name, linking to the dashboard', (lang) => {
    mockAuth.isAuthenticated = true;
    mockAuth.displayName = 'Ada Lovelace';
    renderWithProviders(<Header />, { lang });

    const welcome = dictionaries[lang].dashboard.topbar.welcome;
    expect(screen.getByText(`${welcome}, Ada Lovelace`)).toBeInTheDocument();
    // The name doubles as the way in: same destination as the nav entry.
    expect(link(dictionaries[lang].common.nav.dashboard)).toHaveAttribute('href', `/${lang}/dashboard`);
  });

  it('shows no name while signed out', () => {
    renderWithProviders(<Header />, { lang: 'ru' });

    expect(screen.queryByText(new RegExp(dictionaries.ru.dashboard.topbar.welcome))).toBeNull();
  });
});
