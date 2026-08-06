import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { render } from '@testing-library/react';
import { theme } from '../theme/theme';
import { LanguageProvider } from '../i18n/LanguageContext';
import type { Lang } from '../i18n/dictionaries';

/**
 * Mounts a component with the providers every marketing component assumes:
 * a router (styled Links), the styled-components theme, and a language.
 *
 * Deliberately does NOT include AuthProvider — it constructs an oidc-client
 * UserManager and touches session storage on mount. Tests for components that
 * call useAuth should mock the auth module instead.
 */
interface RenderOptions {
  lang?: Lang;
  route?: string;
}

export function renderWithProviders(ui: ReactNode, { lang = 'ru', route = `/${lang}` }: RenderOptions = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>
        <LanguageProvider lang={lang}>{ui}</LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}
