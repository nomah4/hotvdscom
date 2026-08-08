import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { dictionaries } from '../../i18n/dictionaries';
import { routePaths } from '../../i18n/paths';
import type { Lang } from '../../i18n/dictionaries';

// AuthProvider builds an oidc-client UserManager on mount; the sidebar only
// reads isAdmin.
vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ isAdmin: false }),
}));

const { Sidebar } = await import('./Sidebar');

describe('Sidebar', () => {
  const langs: Lang[] = ['ru', 'en'];

  it.each(langs)('[%s] links New server at its own route', (lang) => {
    renderWithProviders(<Sidebar />, { lang });
    const t = dictionaries[lang].dashboard.sidebar;

    // Entries with no `to` render as a disabled button rather than a link —
    // Billing and Settings are in that state. Asserting the *link* role is what
    // separates "wired up" from "rendered but inert".
    expect(screen.getByRole('link', { name: new RegExp(t.newServer) })).toHaveAttribute(
      'href',
      `/${lang}/${routePaths.newServer}`,
    );
  });

  it('places New server directly after Instances', () => {
    const { container } = renderWithProviders(<Sidebar />, { lang: 'ru' });
    const t = dictionaries.ru.dashboard.sidebar;
    // Entries are links or disabled buttons depending on whether a page exists,
    // so read them off the DOM in render order rather than by role.
    const labels = Array.from(container.querySelectorAll('aside > *')).map((el) => el.textContent ?? '');

    const instances = labels.findIndex((text) => text.includes(t.instances));
    const newServer = labels.findIndex((text) => text.includes(t.newServer));

    expect(instances).toBeGreaterThanOrEqual(0);
    expect(newServer).toBe(instances + 1);
  });
});
