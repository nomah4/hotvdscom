import { useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '../components/ui/Button';
import { useTranslation } from '../i18n/LanguageContext';
import { useAuth } from './AuthContext';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndices.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 15, 12, 0.5);
`;

const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: 32px 28px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.neutral[100]};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h4};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Hint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

/**
 * Sign-in prompt shown as a dialog over whatever page the visitor is already on
 * (e.g. clicking "Dashboard" from the homepage), instead of navigating them away
 * to a full "sign in required" page first.
 *
 * Only covers the nav-link entry point — a direct hit on /dashboard (typed URL,
 * bookmark, refresh) has no page underneath to show as a backdrop, so that path
 * still renders RequireAuth's full-page version. Two sign-in prompts sound like
 * duplication, but they solve different problems: this one preserves context,
 * that one is the only thing that CAN render when there's no context to preserve.
 */
export function AuthPromptModal() {
  const { promptReturnTo, closeAuthPrompt, login } = useAuth();
  const t = useTranslation('common');

  const isOpen = promptReturnTo !== null;

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthPrompt();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeAuthPrompt]);

  if (!isOpen) return null;

  return (
    <Backdrop
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthPrompt();
      }}
    >
      <Card role="dialog" aria-modal="true" aria-label={t.auth.signInRequired}>
        <CloseButton type="button" aria-label="Close" onClick={closeAuthPrompt}>
          ✕
        </CloseButton>
        <Title>{t.auth.signInRequired}</Title>
        <Hint>{t.auth.signInHint}</Hint>
        <Button type="button" $fullWidth onClick={() => void login(promptReturnTo ?? undefined)}>
          {t.buttons.login}
        </Button>
      </Card>
    </Backdrop>
  );
}
