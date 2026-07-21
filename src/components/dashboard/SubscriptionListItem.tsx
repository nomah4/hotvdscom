import styled from 'styled-components';
import type { InstanceStatus } from '../../data/instances';
import type { Subscription, SubscriptionStatus } from '../../api/subscriptions';
import type { Tariff } from '../../data/tariffs';
import { StatusDot } from '../ui/StatusDot';
import { SpecBadge } from '../ui/SpecBadge';
import { useLang, useTranslation } from '../../i18n/LanguageContext';

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
  padding: 20px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const NameCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
  max-width: 240px;
`;

const Name = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.indigo[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Term = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const SpecsCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MetaCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: auto;
  text-align: right;
`;

const ValidUntil = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};
  white-space: nowrap;
`;

const AutoRenew = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

// A provisioning note only shows while the server is not yet built. It is a full
// row so it reads as a status line under the plan, not a spec.
const ProvisioningNote = styled.div`
  flex-basis: 100%;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.semantic.warning};
`;

// Subscription lifecycle → the three visual tones StatusDot already paints.
// Billing has six states; the dashboard only needs "healthy / needs attention /
// gone", so several states collapse onto one dot colour while the text label
// (statusLabels) keeps the exact state.
const STATUS_TONE: Record<SubscriptionStatus, InstanceStatus> = {
  active: 'online',
  pending_activation: 'degraded',
  past_due: 'degraded',
  expired: 'stopped',
  cancelled: 'stopped',
  revoked: 'stopped',
};

interface SubscriptionListItemProps {
  subscription: Subscription;
  /** Catalogue match for the subscription's package_code, when the plan is still
   * offered — supplies the display name, term and specs. Absent for a package the
   * catalogue no longer lists, in which case the raw code is shown with no specs. */
  tariff?: Tariff;
  period?: 'monthly' | 'annual';
}

export function SubscriptionListItem({ subscription, tariff, period }: SubscriptionListItemProps) {
  const t = useTranslation('dashboard');
  const { lang } = useLang();

  const planName = tariff?.name ?? subscription.package_code ?? t.subscriptions.unknownPlan;
  const tone = STATUS_TONE[subscription.status];
  const validUntil = subscription.valid_until
    ? new Date(subscription.valid_until).toLocaleDateString(lang, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  // A note only when the server is not (yet) usable. `succeeded` has no key, so
  // an active, provisioned server shows nothing here.
  const provisioningNote =
    subscription.provisioning_status !== 'succeeded'
      ? t.subscriptions.provisioning[subscription.provisioning_status]
      : null;

  return (
    <Row>
      <NameCell>
        <Name>{planName}</Name>
        {period && <Term>{t.subscriptions.term[period]}</Term>}
      </NameCell>

      <StatusDot status={tone} label={t.subscriptions.statusLabels[subscription.status]} />

      {tariff && (
        <SpecsCell>
          <SpecBadge label="CPU" value={`${tariff.cpu} vCPU`} />
          <SpecBadge label="RAM" value={`${tariff.ram} GB`} />
          <SpecBadge label="SSD" value={`${tariff.ssd} GB`} />
        </SpecsCell>
      )}

      <MetaCell>
        <ValidUntil>
          {t.subscriptions.validUntil}: {validUntil}
        </ValidUntil>
        {subscription.auto_renew && <AutoRenew>{t.subscriptions.autoRenew}</AutoRenew>}
      </MetaCell>

      {provisioningNote && <ProvisioningNote>{provisioningNote}</ProvisioningNote>}
    </Row>
  );
}
