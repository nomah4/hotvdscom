import { Link } from 'react-router';
import styled from 'styled-components';
import { DashboardShell } from '../components/dashboard/DashboardShell';
import { SubscriptionListItem } from '../components/dashboard/SubscriptionListItem';
import { Button } from '../components/ui/Button';
import { useLang, useTranslation } from '../i18n/LanguageContext';
import { useSubscriptions } from '../api/subscriptions';
import { findByPackageCode, useTariffs } from '../api/catalogue';
import { localizePath, routePaths } from '../i18n/paths';
import { media } from '../theme/breakpoints';

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

export function DashboardPage() {
  const t = useTranslation('dashboard');
  const { lang } = useLang();

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
    <DashboardShell>
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
    </DashboardShell>
  );
}
