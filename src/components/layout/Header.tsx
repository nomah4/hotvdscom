import { useState } from 'react';
import styled from 'styled-components';
import { Link, NavLink } from 'react-router-dom';
import { PageContainer } from './PageContainer';
import { Logo } from '../ui/Logo';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { Button } from '../ui/Button';
import { MobileNav } from './MobileNav';
import { useLang, useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../auth/AuthContext';
import { localizePath, orderPath, routePaths } from '../../i18n/paths';
import { media } from '../../theme/breakpoints';

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndices.header};
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 72px;
`;

const Nav = styled.nav`
  display: none;
  align-items: center;
  gap: 28px;

  ${media.laptop`
    display: flex;
  `}
`;

const NavItem = styled(NavLink)`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};

  &.active {
    color: ${({ theme }) => theme.colors.indigo[600]};
  }

  &:hover {
    color: ${({ theme }) => theme.colors.indigo[600]};
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DesktopOnly = styled.div`
  display: none;

  ${media.laptop`
    display: inline-flex;
  `}
`;

const HamburgerButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.neutral[100]};

  ${media.laptop`
    display: none;
  `}
`;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslation('common');
  const { lang } = useLang();
  const { isAuthenticated, login, logout, openAuthPrompt } = useAuth();

  const dashboardPath = localizePath(lang, routePaths.dashboard);
  const links = [
    { to: localizePath(lang, routePaths.home), label: t.nav.home },
    { to: localizePath(lang, routePaths.pricing), label: t.nav.pricing },
    { to: localizePath(lang, routePaths.gpuServers), label: t.nav.product },
    { to: dashboardPath, label: t.nav.dashboard },
  ];

  // Keeps the visitor on the page they're already on (dimmed behind the modal)
  // instead of navigating to /dashboard just to immediately swap it for a
  // full-page "sign in required" screen.
  const handleNavClick = (to: string) => (e: React.MouseEvent) => {
    if (to === dashboardPath && !isAuthenticated) {
      e.preventDefault();
      openAuthPrompt(dashboardPath);
    }
  };

  return (
    <>
      <Bar>
        <PageContainer>
          <Row>
            <Logo />
            <Nav>
              {links.map((link) => (
                <NavItem
                  key={link.to}
                  to={link.to}
                  end={link.to === localizePath(lang, routePaths.home)}
                  onClick={handleNavClick(link.to)}
                >
                  {link.label}
                </NavItem>
              ))}
            </Nav>
            <Actions>
              <DesktopOnly>
                <LanguageSwitcher />
              </DesktopOnly>
              <DesktopOnly>
                <Button
                  type="button"
                  $variant="ghost"
                  $size="sm"
                  onClick={() => void (isAuthenticated ? logout() : login())}
                >
                  {isAuthenticated ? t.buttons.logout : t.buttons.login}
                </Button>
              </DesktopOnly>
              <DesktopOnly>
                <Button as={Link} to={orderPath(lang)} $size="sm">
                  {t.buttons.order}
                </Button>
              </DesktopOnly>
              <HamburgerButton aria-label="Menu" onClick={() => setMenuOpen(true)}>
                ☰
              </HamburgerButton>
            </Actions>
          </Row>
        </PageContainer>
      </Bar>
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} links={links} />
    </>
  );
}
