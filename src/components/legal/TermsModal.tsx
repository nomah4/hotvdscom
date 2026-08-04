import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { useLang, useTranslation } from '../../i18n/LanguageContext';
import { localizePath, routePaths } from '../../i18n/paths';
import { TermsContent } from './TermsContent';

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
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 640px;
  /* The dialog itself never grows past the viewport; the clause list inside it
     scrolls. A terms document is long, and a modal that pushes its own close
     button off-screen is a trap. */
  max-height: min(80vh, 720px);
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h4};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.neutral[100]};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const Body = styled.div`
  overflow-y: auto;
  padding: 24px 28px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px 28px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The terms shown over the checkout page instead of navigating away from it.
 *
 * Why a dialog here and a route elsewhere: at checkout the customer is mid-purchase
 * with a plan chosen and a total on screen. Sending them to another page — or, as
 * before, to another tab — to read what they are agreeing to costs them that context
 * and makes coming back the customer's problem. The /terms route stays exactly as it
 * was: it is linked from elsewhere, it is what a shared or bookmarked link resolves
 * to, and an offer that binds on acceptance needs a permanent address of its own.
 * The footer link leads there, so nothing is reachable only from inside a dialog.
 *
 * Content comes from TermsContent, shared with the page, so the two can never drift.
 */
export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  const t = useTranslation('legal');
  const { lang } = useLang();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    // Move focus into the dialog, so a keyboard user is not left tabbing through
    // the checkout form behind it.
    closeRef.current?.focus();

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Backdrop
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card role="dialog" aria-modal="true" aria-label={t.terms.title}>
        <Header>
          <Title>{t.terms.title}</Title>
          <CloseButton ref={closeRef} type="button" aria-label={t.terms.close} onClick={onClose}>
            ✕
          </CloseButton>
        </Header>
        <Body>
          <TermsContent />
        </Body>
        <Footer>
          <Link to={localizePath(lang, routePaths.terms)} target="_blank" rel="noreferrer">
            {t.terms.openFullPage}
          </Link>
        </Footer>
      </Card>
    </Backdrop>
  );
}
