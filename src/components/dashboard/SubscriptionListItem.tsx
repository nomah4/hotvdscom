import styled from 'styled-components';
import type { InstanceStatus } from '../../data/instances';
import type { Subscription, SubscriptionStatus } from '../../api/subscriptions';
import type { Tariff } from '../../data/tariffs';
import { datacenters } from '../../data/datacenters';
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

const RenewButton = styled.button`
  align-self: center;
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.indigo[900]};
  background: ${({ theme }) => theme.colors.indigo[900]};
  color: #fff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.small};
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

// Renewal failures are shown on the card that failed, not as a page-level
// banner: with several servers listed, a detached message cannot say which one
// it belongs to.
const RenewError = styled.div`
  flex-basis: 100%;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.semantic.error};
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

function periodFromPackageCode(packageCode: string | null): 'monthly' | 'annual' | undefined {
  if (packageCode?.endsWith('_MONTHLY')) return 'monthly';
  if (packageCode?.endsWith('_ANNUAL')) return 'annual';
  return undefined;
}

function osDisplayName(value: string): string {
  return value
    .split('-')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}

interface SubscriptionListItemProps {
  subscription: Subscription;
  /** Catalogue match for the subscription's package_code, when the plan is still
   * offered — supplies the display name, term and specs. Absent for a package the
   * catalogue no longer lists, in which case the raw code is shown with no specs. */
  tariff?: Tariff;
  period?: 'monthly' | 'annual';
  /** Renewing this server. Omitted where renewal is not offered at all. */
  onRenew?: (subscription: Subscription, tariff: Tariff, period: 'monthly' | 'annual') => void;
  isRenewing?: boolean;
  /** Shown on this card only — see RenewError. */
  renewError?: string | null;
}

export function SubscriptionListItem({
  subscription,
  tariff,
  period,
  onRenew,
  isRenewing = false,
  renewError = null,
}: SubscriptionListItemProps) {
  const t = useTranslation('dashboard');
  const { lang } = useLang();
  const configuration = subscription.configuration ?? null;

  const planName = tariff?.name ?? (configuration ? t.subscriptions.customPlan : subscription.package_code ?? t.subscriptions.unknownPlan);
  const resolvedPeriod = period ?? periodFromPackageCode(subscription.package_code);
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
  const dc = configuration?.datacenter ? datacenters.find((item) => item.id === configuration.datacenter) : null;
  const datacenterName = dc ? (lang === 'ru' ? dc.city : dc.cityEn) : configuration?.datacenter;

  return (
    <Row>
      <NameCell>
        <Name>{planName}</Name>
        {resolvedPeriod && <Term>{t.subscriptions.term[resolvedPeriod]}</Term>}
      </NameCell>

      <StatusDot status={tone} label={t.subscriptions.statusLabels[subscription.status]} />

      {tariff ? (
        <SpecsCell>
          <SpecBadge label="CPU" value={`${tariff.cpu} vCPU`} />
          <SpecBadge label="RAM" value={`${tariff.ram} GB`} />
          <SpecBadge label="SSD" value={`${tariff.ssd} GB`} />
        </SpecsCell>
      ) : configuration ? (
        <SpecsCell>
          {configuration.cpu && <SpecBadge label="CPU" value={`${configuration.cpu} vCPU`} />}
          {configuration.ram_gb && <SpecBadge label="RAM" value={`${configuration.ram_gb} GB`} />}
          {configuration.ssd_gb && <SpecBadge label="SSD" value={`${configuration.ssd_gb} GB`} />}
          {configuration.os && <SpecBadge label="OS" value={osDisplayName(configuration.os)} />}
          {datacenterName && <SpecBadge label="DC" value={datacenterName} />}
        </SpecsCell>
      ) : null}

      <MetaCell>
        <ValidUntil>
          {t.subscriptions.validUntil}: {validUntil}
        </ValidUntil>
        {subscription.auto_renew && <AutoRenew>{t.subscriptions.autoRenew}</AutoRenew>}
      </MetaCell>

      {/* Renewal needs the catalogue tariff (Billing prices a renewal from a
          PackagePrice row, which a Custom VDS package does not have) and an
          active subscription (Billing refuses any other state). Both conditions
          are Billing's, not cosmetic — hiding the button is how the UI stays
          honest about what it can actually do. */}
      {onRenew && tariff && resolvedPeriod && subscription.status === 'active' && (
        <RenewButton
          type="button"
          onClick={() => onRenew(subscription, tariff, resolvedPeriod)}
          disabled={isRenewing}
        >
          {isRenewing ? t.subscriptions.renewing : t.subscriptions.renew}
        </RenewButton>
      )}

      {provisioningNote && <ProvisioningNote>{provisioningNote}</ProvisioningNote>}
      {renewError && <RenewError>{t.subscriptions.renewError}</RenewError>}
    </Row>
  );
}
