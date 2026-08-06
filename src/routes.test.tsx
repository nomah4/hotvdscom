import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { theme } from './theme/theme';

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

  it('redirects the retired GPU product URL to the home page', async () => {
    renderAt('/ru/products/gpu-servers');

    // The catch-all sends unmatched paths to the default language home page.
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.queryByText(/gpu/i)).toBeNull();
  });

  it('redirects an unknown language segment to the default one', async () => {
    renderAt('/de');

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
