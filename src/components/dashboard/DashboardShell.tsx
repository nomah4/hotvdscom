import type { ReactNode } from 'react';
import styled from 'styled-components';
import { PageContainer } from '../layout/PageContainer';
import { Logo } from '../ui/Logo';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { Button } from '../ui/Button';
import { BuildStamp } from '../ui/BuildStamp';
import { Sidebar } from './Sidebar';
import { useTranslation, interpolate } from '../../i18n/LanguageContext';
import { useAuth } from '../../auth/AuthContext';
import { media } from '../../theme/breakpoints';

/**
 * The signed-in chrome — top bar, sidebar, footer — shared by every page behind
 * RequireAuth. Extracted when the admin sign-ups view moved off the customer
 * dashboard onto its own route, so the two pages cannot drift apart visually.
 */

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background.secondary};
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  background: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const UserChip = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent[500]};
  color: ${({ theme }) => theme.colors.neutral[0]};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const WelcomeText = styled.span`
  display: none;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};

  ${media.mobile`
    display: inline;
  `}
`;

const AdminBadge = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 0.6875rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  color: ${({ theme }) => theme.colors.accent[600]};
  background: ${({ theme }) => theme.colors.accent[50]};
`;

const Body = styled.div`
  flex: 1;
  padding-block: 32px;
`;

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  ${media.laptop`
    flex-direction: row;
    align-items: flex-start;
  `}
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
`;

const FooterNote = styled.div`
  padding: 20px 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

export function DashboardShell({ children }: { children: ReactNode }) {
  const t = useTranslation('dashboard');
  const tc = useTranslation('common');
  // Reached only via RequireAuth, so `user` is always populated here — but the
  // fallbacks keep this safe to render standalone (e.g. in a test).
  const { displayName, isAdmin, logout } = useAuth();
  const name = displayName || 'User';
  const initial = name.charAt(0).toUpperCase();

  return (
    <Page>
      <TopBar>
        <PageContainer>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Logo />
            <UserChip>
              <WelcomeText>
                {t.topbar.welcome}, {name}
              </WelcomeText>
              {isAdmin && <AdminBadge>{t.topbar.admin}</AdminBadge>}
              <LanguageSwitcher />
              <Avatar>{initial}</Avatar>
              <Button type="button" $variant="ghost" $size="sm" onClick={() => void logout()}>
                {tc.buttons.logout}
              </Button>
            </UserChip>
          </div>
        </PageContainer>
      </TopBar>

      <Body>
        <PageContainer>
          <Layout>
            <Sidebar />
            <Main>{children}</Main>
          </Layout>
        </PageContainer>
      </Body>

      <FooterNote>
        {interpolate(t.footer, { year: new Date().getFullYear() })} · <BuildStamp />
      </FooterNote>
    </Page>
  );
}
