import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Button } from '../components/ui/Button';
import { useTranslation } from '../i18n/LanguageContext';
import { useAuth } from './AuthContext';

const Screen = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
  background: ${({ theme }) => theme.colors.background.secondary};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.h3};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Hint = styled.p`
  max-width: 44ch;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

/**
 * Gates a route behind sign-in (the Dashboard shows the caller's own instances
 * and billing; marketing pages stay public).
 *
 * Deliberately does NOT auto-redirect to the identity provider. Sign-in happens
 * on webtalk.one — a different domain with different branding — so bouncing a
 * visitor there without warning reads as a hijack, and it also hands them a back
 * button that lands straight back on this route and redirects again. The explicit
 * button keeps the jump user-initiated and explained.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, login } = useAuth();
  const t = useTranslation('common');

  if (isLoading) {
    // Session restore reads storage only, so this is a flash, not a spinner state.
    return <Screen aria-busy="true" />;
  }

  if (!isAuthenticated) {
    return (
      <Screen>
        <Title>{t.auth.signInRequired}</Title>
        <Hint>{t.auth.signInHint}</Hint>
        {/* No argument: login() defaults returnTo to the current location, so the
            user comes back to the page they were actually trying to reach. */}
        <Button type="button" onClick={() => void login()}>
          {t.buttons.login}
        </Button>
      </Screen>
    );
  }

  return <>{children}</>;
}
