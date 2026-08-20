import { useState } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { DashboardShell } from '../components/dashboard/DashboardShell';
import { RenewalConfirmModal } from '../components/dashboard/RenewalConfirmModal';
import { SubscriptionListItem } from '../components/dashboard/SubscriptionListItem';
import { Button } from '../components/ui/Button';
import { useLang, useTranslation } from '../i18n/LanguageContext';
import { renameSubscription, useSubscriptions, type Subscription } from '../api/subscriptions';
import { resolvePlanName, resolveSubscriptionTitle } from '../components/dashboard/subscriptionTitle';
import { useAuth } from '../auth/AuthContext';
import { useRenewal } from '../api/useCheckout';
import { findByPackageCode, useTariffs } from '../api/catalogue';
import { localizePath, routePaths } from '../i18n/paths';
import { media } from '../theme/breakpoints';

const StatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  ${media.tablet`
    grid-template-columns: repeat(4, 1fr);
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

// Says why the value is a dash. Without it the balance tile reads as a balance
// of zero sitting next to three tiles that are genuinely computed — which is a
// statement about the customer's money, and the wrong one.
const StatNote = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.h6};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h4};
`;

const ServerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HistorySection = styled.details`
  margin-top: 28px;
`;

const HistorySummary = styled.summary`
  cursor: pointer;
  color: ${({ theme }) => theme.colors.neutral[600]};

  h2 {
    display: inline;
    margin-left: 8px;
  }
`;

const ACTIVE_STATUSES = new Set<Subscription['status']>([
  'active',
  'pending_activation',
  'past_due',
]);

export function splitDashboardSubscriptions(subscriptions: Subscription[]) {
  return {
    active: subscriptions.filter((subscription) => ACTIVE_STATUSES.has(subscription.status)),
    history: subscriptions.filter((subscription) => !ACTIVE_STATUSES.has(subscription.status)),
  };
}

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
  const { accessToken } = useAuth();
  const { lang } = useLang();

  const { subscriptions, isLoading, error, canRename, refetch } = useSubscriptions();
  // Catalogue is enrichment only: it turns a package_code into a plan name and
  // specs. A failure here must not blank the dashboard, so its error is ignored —
  // subscriptions still render, just with the raw code and no spec badges.
  const { tariffs } = useTariffs();
  const { renew, renewingId, error: renewError, errorSubscriptionId, clearError } = useRenewal();

  // Which server the customer is confirming a renewal for. Clicking the expiry
  // chip opens this instead of charging immediately — see RenewalConfirmModal for
  // why that step exists rather than the click going straight to the gateway.
  const [renewTarget, setRenewTarget] = useState<Subscription | null>(null);
  const { active: activeSubscriptions, history: historySubscriptions } =
    splitDashboardSubscriptions(subscriptions);

  const closeRenewal = () => {
    setRenewTarget(null);
    clearError();
  };

  // Одна цепочка на всё приложение (см. subscriptionTitle.ts). Раньше она была
  // написана здесь и в карточке, и обе копии сопровождал комментарий, что они
  // не должны разойтись.
  const titleLabels = {
    customPlan: t.subscriptions.customPlan,
    unknownPlan: t.subscriptions.unknownPlan,
  };
  const tariffFor = (subscription: Subscription) =>
    (subscription.package_code ? findByPackageCode(tariffs, subscription.package_code) : null)?.tariff;
  const planNameFor = (subscription: Subscription): string =>
    resolvePlanName(subscription, tariffFor(subscription), titleLabels);
  const titleFor = (subscription: Subscription): string =>
    resolveSubscriptionTitle(subscription, tariffFor(subscription), titleLabels).title;

  /**
   * Переименование. Список перечитывается целиком, а не правится на месте:
   * ответ содержит сохранённое имя, но соседние поля карточки за это время
   * могли измениться, а перечитывание уже есть и стоит один запрос.
   */
  const rename = async (subscription: Subscription, displayName: string) => {
    if (!accessToken) return;
    await renameSubscription(accessToken, subscription.subscription_id, displayName);
    refetch();
  };

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
          <StatLabel>{t.stats.totalServices}</StatLabel>
          <StatValue>{subscriptions.length}</StatValue>
        </StatCard>
        {/* Placeholder on purpose. Billing exposes no balance endpoint — the
            storefront can reach invoices, subscriptions, packages, quotes,
            payment methods and renewals, and none of them carry an account
            balance. A plausible figure here would be a claim about the
            customer's money, so the tile states that it is not connected rather
            than inventing one. Tracked in TODO.md. */}
        <StatCard>
          <StatLabel>{t.stats.balance}</StatLabel>
          <StatValue>—</StatValue>
          <StatNote>{t.stats.balanceUnavailable}</StatNote>
        </StatCard>
      </StatRow>

      <div>
        <SectionTitle>{t.subscriptions.title}</SectionTitle>
        <ServerList style={{ marginTop: 16 }}>
          {isLoading ? (
            <Message>{t.subscriptions.loading}</Message>
          ) : error ? (
            <ErrorMessage>{t.subscriptions.error}</ErrorMessage>
          ) : activeSubscriptions.length === 0 ? (
            <Message>
              {t.subscriptions.empty}
              <Button as={Link} to={localizePath(lang, routePaths.pricing)} $size="sm">
                {t.subscriptions.emptyCta}
              </Button>
            </Message>
          ) : (
            activeSubscriptions.map((subscription) => {
              const match = subscription.package_code
                ? findByPackageCode(tariffs, subscription.package_code)
                : null;
              return (
                <SubscriptionListItem
                  key={subscription.subscription_id}
                  subscription={subscription}
                  tariff={match?.tariff}
                  period={match?.period}
                  onRenew={setRenewTarget}
                  isRenewing={renewingId === subscription.subscription_id}
                  onServerChanged={refetch}
                  onRename={canRename ? rename : undefined}
                  renewError={
                    // While the modal is open it shows the failure itself, so the
                    // card stays quiet — otherwise the same message appears twice.
                    renewTarget === null && errorSubscriptionId === subscription.subscription_id
                      ? renewError
                      : null
                  }
                />
              );
            })
          )}
        </ServerList>

        {!isLoading && !error && historySubscriptions.length > 0 && (
          <HistorySection>
            <HistorySummary>
              <SectionTitle>{t.subscriptions.historyTitle}</SectionTitle>
            </HistorySummary>
            <ServerList style={{ marginTop: 16 }}>
              {historySubscriptions.map((subscription) => {
                const match = subscription.package_code
                  ? findByPackageCode(tariffs, subscription.package_code)
                  : null;
                const isTerminal =
                  subscription.status === 'revoked' || subscription.status === 'cancelled';
                return (
                  <SubscriptionListItem
                    key={subscription.subscription_id}
                    subscription={subscription}
                    tariff={match?.tariff}
                    period={match?.period}
                    onRenew={isTerminal ? undefined : setRenewTarget}
                    isRenewing={renewingId === subscription.subscription_id}
                    onServerChanged={isTerminal ? undefined : refetch}
                    onRename={isTerminal || !canRename ? undefined : rename}
                    readOnly={isTerminal}
                    renewError={
                      renewTarget === null && errorSubscriptionId === subscription.subscription_id
                        ? renewError
                        : null
                    }
                  />
                );
              })}
            </ServerList>
          </HistorySection>
        )}
      </div>

      {renewTarget && (
        <RenewalConfirmModal
          subscription={renewTarget}
          planName={planNameFor(renewTarget)}
          serverTitle={titleFor(renewTarget)}
          isSubmitting={renewingId === renewTarget.subscription_id}
          submitError={
            errorSubscriptionId === renewTarget.subscription_id
              ? t.subscriptions.renewError
              : null
          }
          onClose={closeRenewal}
          onConfirm={(customerEmail) => void renew(renewTarget, customerEmail)}
        />
      )}
    </DashboardShell>
  );
}
