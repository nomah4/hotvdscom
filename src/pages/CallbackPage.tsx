import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { userManager, type SigninState } from '../auth/userManager';
import { DEFAULT_LANG } from '../i18n/paths';

const Screen = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  background: ${({ theme }) => theme.colors.background.secondary};
`;

const Message = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.body};
  color: ${({ theme }) => theme.colors.neutral[700]};
`;

const ErrorMessage = styled(Message)`
  color: ${({ theme }) => theme.colors.semantic.error};
  max-width: 42ch;
`;

const RetryLink = styled.a`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.accent[500]};
`;

/**
 * Lands the OIDC redirect from ZITADEL and exchanges the authorization code.
 *
 * Mounted at the top level (`/callback`, no `:lang` prefix) because the redirect
 * URI registered in ZITADEL has no locale segment — routing it under `/:lang`
 * would drop it into the catch-all and discard `?code=`.
 *
 * Not localized on purpose: it renders outside LangGate, so no LanguageProvider
 * is in scope here. It is a sub-second transition screen.
 */
export function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // An authorization code is single-use. StrictMode runs effects twice in dev, so
  // without this guard the second run exchanges an already-spent code and fails
  // with "Errors.User.Code.Invalid" — in dev only, which is a confusing way to
  // lose an afternoon.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    userManager
      .signinCallback(window.location.href)
      .then((user) => {
        const state = user?.state as SigninState | undefined;
        const target = state?.returnTo;
        // Never bounce back to /callback, or a refresh would loop.
        const safe = target && !target.startsWith('/callback') ? target : `/${DEFAULT_LANG}`;
        navigate(safe, { replace: true });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Sign-in could not be completed.');
      });
  }, [navigate]);

  if (error) {
    return (
      <Screen>
        <ErrorMessage>{error}</ErrorMessage>
        <RetryLink href={`/${DEFAULT_LANG}`}>Return to hotvds.com</RetryLink>
      </Screen>
    );
  }

  return (
    <Screen>
      <Message>Signing you in…</Message>
    </Screen>
  );
}
