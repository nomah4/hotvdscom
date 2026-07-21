import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { PageContainer } from '../components/layout/PageContainer';
import { Logo } from '../components/ui/Logo';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { Sidebar } from '../components/dashboard/Sidebar';
import { SubscriptionListItem } from '../components/dashboard/SubscriptionListItem';
import { Button } from '../components/ui/Button';
import { useLang, useTranslation, interpolate } from '../i18n/LanguageContext';
import { useAuth } from '../auth/AuthContext';
import { useSubscriptions } from '../api/subscriptions';
import { findByPackageCode, useTariffs } from '../api/catalogue';
import { localizePath, routePaths } from '../i18n/paths';
import { media } from '../theme/breakpoints';

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

const StatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  ${media.tablet`
    grid-template-columns: repeat(3, 1fr);
  `}
`;

const StatCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const StatLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const StatValue = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h4};
`;

const ServerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// Shared frame for the loading / error / empty states, so the list area keeps
// the same footprint whether or not there are servers to show.
const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 40px 24px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px dashed ${({ theme }) => theme.colors.neutral[300]};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const ErrorMessage = styled(Message)`
  border-style: solid;
  border-color: ${({ theme }) => theme.colors.semantic.error};
  color: ${({ theme }) => theme.colors.semantic.error};
`;

const FooterNote = styled.div`
  padding: 20px 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

export function DashboardPage() {
  const t = useTranslation('dashboard');
  const tc = useTranslation('common');
  const { lang } = useLang();
  // Reached only via RequireAuth, so `user` is always populated here — but the
  // fallbacks keep this file safe to reuse standalone (e.g. in a future test).
  const { displayName, isAdmin, logout } = useAuth();
  const name = displayName || 'User';
  const initial = name.charAt(0).toUpperCase();

  const { subscriptions, isLoading, error } = useSubscriptions();
  // Catalogue is enrichment only: it turns a package_code into a plan name and
  // specs. A failure here must not blank the dashboard, so its error is ignored —
  // subscriptions still render, just with the raw code and no spec badges.
  const { tariffs } = useTariffs();

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  // Earliest upcoming renewal among active subscriptions — the next date the user
  // will be charged. "—" when nothing is active.
  const nextRenewal = subscriptions
    .filter((s) => s.status === 'active' && s.valid_until)
    .map((s) => s.valid_until as string)
    .sort()[0];
  const nextRenewalLabel = nextRenewal
    ? new Date(nextRenewal).toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

  return (
    <Page>
      <TopBar>
        <PageContainer>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Logo />
            <UserChip>
              <WelcomeText>{t.topbar.welcome}, {name}</WelcomeText>
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
            <Main>
              <StatRow>
                <StatCard>
                  <StatLabel>{t.stats.activeServers}</StatLabel>
                  <StatValue>{activeCount}</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>{t.stats.nextRenewal}</StatLabel>
                  <StatValue>{nextRenewalLabel}</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>{t.stats.totalPlans}</StatLabel>
                  <StatValue>{subscriptions.length}</StatValue>
                </StatCard>
              </StatRow>

              <div>
                <SectionTitle>{t.subscriptions.title}</SectionTitle>
                <ServerList style={{ marginTop: 16 }}>
                  {isLoading ? (
                    <Message>{t.subscriptions.loading}</Message>
                  ) : error ? (
                    <ErrorMessage>{t.subscriptions.error}</ErrorMessage>
                  ) : subscriptions.length === 0 ? (
                    <Message>
                      {t.subscriptions.empty}
                      <Button as={Link} to={localizePath(lang, routePaths.pricing)} $size="sm">
                        {t.subscriptions.emptyCta}
                      </Button>
                    </Message>
                  ) : (
                    subscriptions.map((subscription) => {
                      const match = subscription.package_code
                        ? findByPackageCode(tariffs, subscription.package_code)
                        : null;
                      return (
                        <SubscriptionListItem
                          key={subscription.subscription_id}
                          subscription={subscription}
                          tariff={match?.tariff}
                          period={match?.period}
                        />
                      );
                    })
                  )}
                </ServerList>
              </div>
            </Main>
          </Layout>
        </PageContainer>
      </Body>

      <FooterNote>{interpolate(t.footer, { year: new Date().getFullYear() })}</FooterNote>
    </Page>
  );
}
