import type { ReactNode } from 'react';
import styled from 'styled-components';
import { PageContainer } from '../layout/PageContainer';
import { Logo } from '../ui/Logo';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { Button } from '../ui/Button';
import { BuildStamp } from '../ui/BuildStamp';
import { UserChip } from '../ui/UserChip';
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

const Account = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
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
  const { logout } = useAuth();

  return (
    <Page>
      <TopBar>
        <PageContainer>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Logo />
            <Account>
              <UserChip />
              <LanguageSwitcher />
              <Button type="button" $variant="ghost" $size="sm" onClick={() => void logout()}>
                {tc.buttons.logout}
              </Button>
            </Account>
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
