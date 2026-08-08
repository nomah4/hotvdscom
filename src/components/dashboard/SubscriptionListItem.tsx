import { useState } from 'react';
import styled from 'styled-components';
import type { InstanceStatus } from '../../data/instances';
import type { Subscription, SubscriptionStatus } from '../../api/subscriptions';
import type { Tariff } from '../../data/tariffs';
import { datacenters } from '../../data/datacenters';
import { StatusDot } from '../ui/StatusDot';
import { SpecBadge } from '../ui/SpecBadge';
import { useLang, useTranslation } from '../../i18n/LanguageContext';
import { media } from '../../theme/breakpoints';

const Row = styled.div`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
  /* Right padding leaves room for the delete button pinned in the corner. */
  padding: 20px 56px 20px 20px;
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

const AutoRenew = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

// Coral, not indigo: SpecBadge paints the CPU/RAM/SSD chips indigo[900], so an
// indigo button sat in the same card reading as one more spec rather than the
// action. Accent is the design system's primary-action colour and is used
// nowhere else on this card.
const RenewButton = styled.button`
  align-self: center;
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.accent[500]};
  background: ${({ theme }) => theme.colors.accent[500]};
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

// Muted bordeaux rather than semantic.error (#E5484D): destructive, but this is
// a resting control on every card, not an alarm. A bright red row of them would
// read as five broken servers.
const DELETE_BORDEAUX = '#7C3239';

/**
 * Top-right corner: where the server *is* (datacenter, OS) and the one
 * destructive action.
 *
 * Placement is deliberately not absolute on small screens — an absolutely
 * positioned corner overlaps the plan name once the card is narrow enough, and
 * this card wraps a lot. Below tablet it simply flows as another wrapped group;
 * from tablet up, where there is room, it pins to the corner.
 */
const CornerCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  ${media.tablet`
    position: absolute;
    top: 12px;
    right: 12px;
    flex-wrap: nowrap;
  `}
`;

// Plain text, not SpecBadge: OS and datacenter say *where the server lives*,
// which is a different kind of fact from the hardware it is made of. Painting
// them as chips put them in the same visual class as CPU/RAM/SSD and made the
// spec row read as five equal things.
const CornerStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  text-align: right;
`;

// The one date that decides whether the customer still has a server, so it gets
// a chip of its own rather than another grey line. Tinted indigo instead of
// coral: coral is the Renew action next to it, and the two must not read as the
// same thing.
const ValidUntilChip = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.indigo[50]};
  border: 1px solid ${({ theme }) => theme.colors.indigo[100]};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.indigo[600]};
  white-space: nowrap;
`;

const ValidUntilValue = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const CornerLine = styled.span`
  display: inline-flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
  white-space: nowrap;
`;

const CornerValue = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.neutral[700]};
`;

const DeleteButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid transparent;
  background: transparent;
  color: ${DELETE_BORDEAUX};
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    border-color: ${DELETE_BORDEAUX};
    background: rgba(124, 50, 57, 0.06);
  }
`;

const ControlsCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ControlButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.neutral[800]};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.small};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.indigo[400]};
    color: ${({ theme }) => theme.colors.indigo[900]};
  }
`;

// Telemetry the storefront does not have. Rendered as labelled dashes rather
// than omitted, so the card shows what it will show — but never a number.
const TelemetryCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  flex-basis: 100%;
  padding-top: 12px;
  border-top: 1px dashed ${({ theme }) => theme.colors.neutral[200]};
`;

const TelemetryItem = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const TelemetryValue = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

const TelemetryNote = styled.span`
  flex-basis: 100%;
  font-size: ${({ theme }) => theme.fontSizes.h6};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

// Answer to pressing any control. Deliberately not "done" or "rebooting" — the
// button did nothing, and a card that claims otherwise would have the customer
// waiting for a server that never comes back.
const ControlNotice = styled.div`
  flex-basis: 100%;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.semantic.warning};
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
  onRenew?: (subscription: Subscription) => void;
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
  const [controlsPressed, setControlsPressed] = useState(false);
  const configuration = subscription.configuration ?? null;

  /**
   * Whether the server is up — as far as anything here can tell.
   *
   * There is no power state to read: Billing tracks a subscription, not a
   * machine, and the provisioning adapter that would own start/stop does not
   * exist yet. So this is inferred from the two flags we do have, which is why
   * every real subscription currently reads as "not running": provisioning sits
   * at `pending` for all of them.
   */
  const isRunning = subscription.status === 'active' && subscription.provisioning_status === 'succeeded';

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
      <CornerCell>
        <CornerStack>
          <ValidUntilChip>
            {t.subscriptions.validUntil}: <ValidUntilValue>{validUntil}</ValidUntilValue>
          </ValidUntilChip>
          {configuration?.os && (
            <CornerLine>
              OS <CornerValue>{osDisplayName(configuration.os)}</CornerValue>
            </CornerLine>
          )}
          {datacenterName && (
            <CornerLine>
              DC <CornerValue>{datacenterName}</CornerValue>
            </CornerLine>
          )}
          {subscription.auto_renew && <AutoRenew>{t.subscriptions.autoRenew}</AutoRenew>}
        </CornerStack>
        <DeleteButton
          type="button"
          onClick={() => setControlsPressed(true)}
          aria-label={t.subscriptions.controls.delete}
          title={t.subscriptions.controls.delete}
        >
          🗑
        </DeleteButton>
      </CornerCell>

      <NameCell>
        <Name>{planName}</Name>
        {resolvedPeriod && <Term>{t.subscriptions.term[resolvedPeriod]}</Term>}
      </NameCell>

      <StatusDot status={tone} label={t.subscriptions.statusLabels[subscription.status]} />

      {/* Hardware only. OS and datacenter moved to the corner: they describe
          where the server lives rather than what it is made of, and they used to
          hang off the `else` branch, so a fixed plan that recorded them showed
          neither — two cards for the same server read differently depending on
          whether its package was still in the catalogue. */}
      <SpecsCell>
        {tariff ? (
          <>
            <SpecBadge label="CPU" value={`${tariff.cpu} vCPU`} />
            <SpecBadge label="RAM" value={`${tariff.ram} GB`} />
            <SpecBadge label="SSD" value={`${tariff.ssd} GB`} />
          </>
        ) : (
          <>
            {configuration?.cpu && <SpecBadge label="CPU" value={`${configuration.cpu} vCPU`} />}
            {configuration?.ram_gb && <SpecBadge label="RAM" value={`${configuration.ram_gb} GB`} />}
            {configuration?.ssd_gb && <SpecBadge label="SSD" value={`${configuration.ssd_gb} GB`} />}
          </>
        )}
      </SpecsCell>

      {/* Active subscriptions only: Billing refuses to renew any other state
          (`subscription_not_renewable`), so offering the button there would be a
          promise the server breaks. Works for Custom VDS as well as fixed plans —
          Billing prices a configurable renewal from the configuration this
          subscription already recorded. */}
      {onRenew && subscription.status === 'active' && (
        <RenewButton type="button" onClick={() => onRenew(subscription)} disabled={isRenewing}>
          {isRenewing ? t.subscriptions.renewing : t.subscriptions.renew}
        </RenewButton>
      )}

      {/* Power and reboot. Styled as live controls, and they are — they just
          cannot reach a machine yet, so pressing one says so instead of
          reporting an action that did not happen. The power icon and label
          follow `isRunning`. */}
      <ControlsCell>
        <ControlButton type="button" onClick={() => setControlsPressed(true)}>
          <span aria-hidden>{isRunning ? '⏹' : '▶'}</span>
          {isRunning ? t.subscriptions.controls.powerOff : t.subscriptions.controls.powerOn}
        </ControlButton>
        <ControlButton type="button" onClick={() => setControlsPressed(true)}>
          <span aria-hidden>⟳</span>
          {t.subscriptions.controls.reboot}
        </ControlButton>
      </ControlsCell>

      <TelemetryCell>
        <TelemetryItem>
          {t.subscriptions.telemetry.ip}: <TelemetryValue>{t.subscriptions.telemetry.noData}</TelemetryValue>
        </TelemetryItem>
        <TelemetryItem>
          {t.subscriptions.telemetry.cpu}: <TelemetryValue>{t.subscriptions.telemetry.noData}</TelemetryValue>
        </TelemetryItem>
        <TelemetryItem>
          {t.subscriptions.telemetry.network}: <TelemetryValue>{t.subscriptions.telemetry.noData}</TelemetryValue>
        </TelemetryItem>
        <TelemetryNote>{t.subscriptions.telemetry.note}</TelemetryNote>
      </TelemetryCell>

      {controlsPressed && <ControlNotice>{t.subscriptions.controls.unavailable}</ControlNotice>}
      {provisioningNote && <ProvisioningNote>{provisioningNote}</ProvisioningNote>}
      {renewError && <RenewError>{t.subscriptions.renewError}</RenewError>}
    </Row>
  );
}
