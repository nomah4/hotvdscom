import { describe, expect, it, vi, beforeEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { theme } from './theme/theme';
import { dictionaries } from './i18n/dictionaries';
import { footerLinkPaths } from './components/layout/footerLinks';

vi.mock('./auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    openAuthPrompt: vi.fn(),
    authPromptTarget: null,
    closeAuthPrompt: vi.fn(),
  }),
}));

const { AppRoutes } = await import('./routes');

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider theme={theme}>
        <AppRoutes />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('routing', () => {
  beforeEach(() => {
    // The home page pulls the live catalogue on mount; it renders its error
    // branch when this rejects, which is all these tests need.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline in tests')));
  });

  it('shows the retired GPU product URL a not-found page, in its own language', async () => {
    renderAt('/ru/products/gpu-servers');

    // Used to redirect to /en, throwing away both the address and the visitor's
    // language. Now the splat inside the marketing layout catches it.
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      dictionaries.ru.common.notFound.title,
    );
    // The page must not echo what was requested — that is the only reason a
    // page about a URL containing "gpu-servers" can pass this.
    expect(screen.queryByText(/gpu/i)).toBeNull();
  });

  it('redirects an unknown language segment to the default one', async () => {
    renderAt('/de');

    // LangGate rejects the segment before any child route matches, so this is a
    // redirect to /en and not the not-found page.
    expect(await screen.findByRole('heading', { level: 1 })).not.toHaveTextContent(
      dictionaries.en.common.notFound.title,
    );
  });

  it.each(['ru', 'en'] as const)('[%s] mounts a real page behind every footer link', async (lang) => {
    // The end-to-end successor to the old index-pairing test: label → key →
    // routePaths segment → registered <Route> → a page that renders. A typo in a
    // slug or a forgotten route shows up here as the not-found page, where it
    // used to be a silent redirect to /en.
    const segments = Object.values(dictionaries[lang].common.footer.columns).flatMap((column) =>
      Object.keys(column.links),
    );

    expect(segments.length).toBeGreaterThan(0);

    for (const key of segments) {
      cleanup();
      renderAt(`/${lang}/${footerLinkPaths[key as keyof typeof footerLinkPaths]}`);

      const heading = await screen.findByRole('heading', { level: 1 });
      expect(heading, key).not.toHaveTextContent(dictionaries[lang].common.notFound.title);
    }
  });

  it('mounts the in-account order page at its own route', async () => {
    // `dashboard/new` sits under the same /:lang parent as `dashboard`; if the
    // route were missing or its slug typed wrong, the splat would answer instead
    // and the sidebar link would quietly lead to a 404.
    renderAt('/ru/dashboard/new');

    expect(await screen.findByRole('heading', { level: 1 })).not.toHaveTextContent(
      dictionaries.ru.common.notFound.title,
    );
  });

  it('does not let the not-found splat swallow a more specific route', async () => {
    // Splats score lowest in react-router's ranking, so the authenticated routes
    // declared outside the marketing layout still win. Worth asserting rather
    // than reasoning about: getting this wrong hides the dashboard behind a 404.
    renderAt('/ru/dashboard');

    expect(await screen.findByRole('heading', { level: 1 })).not.toHaveTextContent(
      dictionaries.ru.common.notFound.title,
    );
  });
});
