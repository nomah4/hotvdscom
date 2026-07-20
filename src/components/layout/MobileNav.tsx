import styled from 'styled-components';
import { Link, NavLink } from 'react-router-dom';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { Button } from '../ui/Button';
import { useLang, useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../auth/AuthContext';
import { localizePath, orderPath, routePaths } from '../../i18n/paths';

const Overlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndices.mobileNav};
  background: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  flex-direction: column;
  padding: 24px 20px 32px;
  transform: translateX(${({ $open }) => ($open ? '0' : '100%')});
  transition: transform 0.25s ease;
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
`;

const TopRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.neutral[100]};
  font-size: 1.25rem;
`;

const LinkList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 32px;
`;

const LinkItem = styled(NavLink)`
  padding: 14px 4px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.25rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.indigo[900]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[200]};

  &.active {
    color: ${({ theme }) => theme.colors.accent[500]};
  }
`;

const Bottom = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  links: { to: string; label: string }[];
}

export function MobileNav({ open, onClose, links }: MobileNavProps) {
  const t = useTranslation('common');
  const { lang } = useLang();
  const { isAuthenticated, login, logout, openAuthPrompt } = useAuth();
  const homePath = localizePath(lang, routePaths.home);
  const dashboardPath = localizePath(lang, routePaths.dashboard);

  // Same gating as the desktop header (see Header.tsx): stay on the current page,
  // dimmed behind the modal, rather than opening the mobile menu just to redirect
  // straight to a "sign in required" screen. Closes the slide-out menu first so
  // the modal isn't rendered on top of it.
  const handleNavClick = (to: string) => (e: React.MouseEvent) => {
    if (to === dashboardPath && !isAuthenticated) {
      e.preventDefault();
      onClose();
      openAuthPrompt(dashboardPath);
      return;
    }
    onClose();
  };

  return (
    <Overlay $open={open} aria-hidden={!open}>
      <TopRow>
        <CloseButton aria-label="Close menu" onClick={onClose}>
          ✕
        </CloseButton>
      </TopRow>
      <LinkList>
        {links.map((link) => (
          <LinkItem key={link.to} to={link.to} end={link.to === homePath} onClick={handleNavClick(link.to)}>
            {link.label}
          </LinkItem>
        ))}
      </LinkList>
      <Bottom>
        <LanguageSwitcher />
        {/* The desktop header's sign-in control is hidden below the laptop
            breakpoint, so without this entry there is no way to sign in on a phone. */}
        <Button
          type="button"
          $variant="secondary"
          $fullWidth
          onClick={() => {
            onClose();
            void (isAuthenticated ? logout() : login());
          }}
        >
          {isAuthenticated ? t.buttons.logout : t.buttons.login}
        </Button>
        <Button as={Link} to={orderPath(lang)} $fullWidth onClick={onClose}>
          {t.buttons.order}
        </Button>
      </Bottom>
    </Overlay>
  );
}
