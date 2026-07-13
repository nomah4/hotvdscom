import styled from 'styled-components';
import { PageContainer } from '../components/layout/PageContainer';
import { Logo } from '../components/ui/Logo';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { Sidebar } from '../components/dashboard/Sidebar';
import { InstanceListItem } from '../components/dashboard/InstanceListItem';
import { BillingWidget } from '../components/dashboard/BillingWidget';
import { useTranslation, interpolate } from '../i18n/LanguageContext';
import { instances } from '../data/instances';
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

const InstanceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Aside = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  ${media.laptop`
    width: 320px;
    flex-shrink: 0;
  `}
`;

const FooterNote = styled.div`
  padding: 20px 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

export function DashboardPage() {
  const t = useTranslation('dashboard');

  const avgUptime = (instances.reduce((sum, i) => sum + i.uptime, 0) / instances.length).toFixed(2);
  const activeCount = instances.filter((i) => i.status !== 'stopped').length;

  return (
    <Page>
      <TopBar>
        <PageContainer>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Logo />
            <UserChip>
              <WelcomeText>{t.topbar.welcome}, Алексей</WelcomeText>
              <LanguageSwitcher />
              <Avatar>А</Avatar>
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
                  <StatLabel>{t.stats.activeInstances}</StatLabel>
                  <StatValue>{activeCount}</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>{t.stats.avgUptime}</StatLabel>
                  <StatValue>{avgUptime}%</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>{t.stats.monthSpend}</StatLabel>
                  <StatValue>$28.40</StatValue>
                </StatCard>
              </StatRow>

              <div>
                <SectionTitle>{t.instances.title}</SectionTitle>
                <InstanceList style={{ marginTop: 16 }}>
                  {instances.map((instance) => (
                    <InstanceListItem key={instance.id} instance={instance} />
                  ))}
                </InstanceList>
              </div>
            </Main>
            <Aside>
              <BillingWidget />
            </Aside>
          </Layout>
        </PageContainer>
      </Body>

      <FooterNote>{interpolate(t.footer, { year: new Date().getFullYear() })}</FooterNote>
    </Page>
  );
}
