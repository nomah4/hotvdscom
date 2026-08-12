import { useState } from 'react';
import styled from 'styled-components';
import type { InstanceStatus } from '../../data/instances';
import type { Subscription, SubscriptionStatus } from '../../api/subscriptions';
import type { Tariff } from '../../data/tariffs';
import { datacenters } from '../../data/datacenters';
import { StatusDot } from '../ui/StatusDot';
import { SpecBadge } from '../ui/SpecBadge';
import { useServerControls } from '../../api/useServerControls';
import { resolveSubscriptionTitle } from './subscriptionTitle';
import { formatMoneyMinor } from '../../utils/money';
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

const NameRow = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
`;

/**
 * Карандаш видно всегда.
 *
 * Сначала он проявлялся по наведению — и это ровно та ошибка, о которой в этом
 * же файле написано у кнопки продления: affordance, о которой нельзя
 * догадаться, хуже её отсутствия. На сенсорном экране наведения нет вовсе,
 * так что функции там просто не существовало бы.
 *
 * Приглушённый серый, а не акцентный: это второстепенное действие рядом с
 * названием, а не то, ради чего открывают страницу.
 */
const RenameButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[400]};
  transition: color 120ms;

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.colors.indigo[600]};
  }
`;

const NameInput = styled.input`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.indigo[900]};
  border: 1px solid ${({ theme }) => theme.colors.indigo[400]};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 2px 6px;
  max-width: 100%;
  min-width: 0;
`;

const Term = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

/**
 * Идентификатор услуги.
 *
 * Появился вместе с переименованием и по его вине: имя клиента уникальности не
 * имеет — это личная метка, и две машины можно назвать одинаково. Когда клиент
 * пишет в поддержку «prod-api-01 не отвечает», найти сервер по имени нельзя, а
 * по этому — можно.
 *
 * Показываем восемь символов, полный — в подсказке и в выделении: строка из
 * тридцати шести знаков на карточке спорит за внимание с тем, ради чего
 * карточку открыли.
 */
const ServiceId = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.h6};
  color: ${({ theme }) => theme.colors.neutral[400]};
  user-select: all;
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

// Muted bordeaux rather than semantic.error (#E5484D): destructive, but this is
// a resting control on every card, not an alarm. A bright red row of them would
// read as five broken servers.
const DELETE_BORDEAUX = '#7C3239';

/**
 * Биты в секунду — в мегабиты, как их называют в тарифах и в договорах.
 *
 * Один знак после запятой ниже десяти и целые выше: «0.4» о чём-то говорит,
 * «12.7» на фоне сотни мегабит — уже нет.
 */
function formatMbits(bps: number): string {
  const mbits = bps / 1_000_000;
  return mbits < 10 ? mbits.toFixed(1) : String(Math.round(mbits));
}

/**
 * Top-right of the card: when the service runs out, and where the server lives.
 *
 * Stays in normal flow, pushed right by `margin-left: auto`. It was absolutely
 * positioned at first and that was wrong: the corner holds a chip and two lines,
 * not a single icon, so the flow content underneath ran straight into it and
 * overlapped the spec chips on a real card.
 */
const CornerCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  align-self: flex-start;
  margin-left: auto;
  gap: 4px;
`;

// The one date that decides whether the customer still has a server — and, since
// the separate Renew button is gone, the control that extends it. Indigo rather
// than the accent colour: it is a fact first and a button second, and painting it
// like a CTA would make every card shout.
const ValidUntilChip = styled.button<{ $clickable: boolean }>`
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
  /* Rendered as a plain span when renewal is not on offer, so the hover
     affordance never appears on something that cannot be clicked. */
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};

  ${({ $clickable, theme }) =>
    $clickable &&
    `
    &:hover {
      border-color: ${theme.colors.accent[500]};
      background: ${theme.colors.accent[50]};
    }
  `}

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
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
  margin-left: auto;
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

  &:hover:not(:disabled) {
    border-color: ${DELETE_BORDEAUX};
    background: rgba(124, 50, 57, 0.06);
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

// The card's last line: the machine controls at the left, the bin at the far
// right. The distance is the point — delete is the only irreversible action on
// the card and should not sit a few pixels from "Reboot".
const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex-basis: 100%;
`;

/**
 * `$tone="go"` paints the button mint, `undefined` leaves it neutral.
 *
 * The power button carries the tone, so its colour states what pressing it would
 * do: green to start a server that is down, grey to stop one that is up. That
 * makes the row itself readable at a glance — a green button in the list means
 * something is not running. Reboot stays neutral in both states; it is the same
 * action either way.
 */
const ControlButton = styled.button<{ $tone?: 'go' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'go' ? theme.colors.mint[400] : theme.colors.neutral[300])};
  background: ${({ theme, $tone }) =>
    $tone === 'go' ? theme.colors.mint[100] : theme.colors.background.primary};
  color: ${({ theme, $tone }) => ($tone === 'go' ? theme.colors.mint[700] : theme.colors.neutral[800])};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.small};
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    border-color: ${({ theme, $tone }) =>
      $tone === 'go' ? theme.colors.mint[600] : theme.colors.indigo[400]};
    color: ${({ theme, $tone }) => ($tone === 'go' ? theme.colors.mint[700] : theme.colors.indigo[900])};
  }

  /* The whole row goes flat while any control is travelling. One request at a
     time per machine: a customer who can queue three reboots gets three. */
  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

// Shown only after the customer asks for it, and only until they close the
// card's reveal. The password is not rendered into the list by default — a
// dashboard left open on a screen should not be a credential on a screen.
const CredentialsBox = styled.div`
  flex-basis: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.neutral[100]};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[800]};
  word-break: break-all;
`;

// A failed control names the server it belongs to by sitting on its card, for
// the same reason renewal errors do.
const ControlError = styled.div`
  flex-basis: 100%;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.semantic.error};
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
  /** Re-read the subscription list after a control changes the machine. */
  onServerChanged?: () => void;
  /**
   * Переименование. Передаётся только когда биллинг умеет — тогда и только
   * тогда появляется карандаш. Без него карточка выглядит ровно как раньше.
   */
  onRename?: (subscription: Subscription, displayName: string) => Promise<void>;
}

export function SubscriptionListItem({
  subscription,
  tariff,
  period,
  onRenew,
  isRenewing = false,
  renewError = null,
  onServerChanged,
  onRename,
}: SubscriptionListItemProps) {
  const t = useTranslation('dashboard');
  const { lang } = useLang();
  const configuration = subscription.configuration ?? null;
  const server = subscription.server ?? null;
  const price = subscription.price ?? null;
  const machine = server?.machine ?? null;
  const controls = useServerControls(subscription.subscription_id, onServerChanged);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameSaving, setRenameSaving] = useState(false);
  const [renameFailed, setRenameFailed] = useState(false);

  /**
   * Сохранить имя и только потом показать его.
   *
   * Без оптимистичного обновления намеренно: имя, оставшееся на экране после
   * неудачного сохранения, — это заголовок, которого у сервера нет. Клиент
   * потом ищет сервер по имени, которого никто не сохранял.
   */
  const commitRename = async (value: string) => {
    if (!onRename || renameSaving) return;
    const next = value.trim();
    if (next === (subscription.display_name ?? '')) {
      setIsRenaming(false);
      return;
    }
    setRenameSaving(true);
    setRenameFailed(false);
    try {
      await onRename(subscription, next);
      setIsRenaming(false);
    } catch {
      // Ловим здесь, а не выше: вызов идёт из обработчика события через `void`,
      // и без этого отказ превращается в необработанное отклонение промиса —
      // клиент не увидел бы ничего, а поле осталось бы открытым молча.
      setRenameFailed(true);
    } finally {
      setRenameSaving(false);
    }
  };

  /**
   * Whether the customer wants the machine up.
   *
   * Their wish, not the machine's state — the two are separate on purpose, and
   * the button has to name what pressing it would do. A machine that is down
   * because the service is suspended still has a standing wish of "on", and
   * offering "Start" there would be a button that cannot work.
   *
   * With no server block yet there is nothing to read, so this falls back to
   * the old inference from the subscription's own flags.
   */
  const powerIsOn = server?.power_intent
    ? server.power_intent === 'on'
    : subscription.status === 'active' && subscription.provisioning_status === 'succeeded';

  /**
   * The engine has a machine for this subscription — otherwise nothing to control.
   *
   * A destroyed one counts as absent. Billing stops sending those, but the card
   * must not depend on that: a row of power and password buttons over a machine
   * that exists on no hypervisor is worse than the plain statement that there
   * is no server, and every one of them would fail.
   */
  const hasServer = server !== null && server.state !== 'deleted';

  /**
   * The customer pressed delete and an operator has not confirmed it yet.
   *
   * The only state where the controls change shape rather than just going flat:
   * a machine on its way out offers "Restore" and nothing else, because every
   * other button would be asking it to come back to life halfway.
   */
  const isPendingDeletion = server?.state === 'pending_deletion';

  const busy = controls.pending !== null;

  /**
   * Успел ли движок хоть раз опросить эту машину.
   *
   * `status: 'unknown'` — это ответ «ещё не спрашивали», а не состояние
   * машины: движок ставит его до первого опроса. Отличать его от настоящего
   * состояния нужно, иначе карточка либо объясняет очевидное, либо молчит там,
   * где пустая таблица требует объяснения.
   */
  const hasTelemetry = Boolean(
    machine && ((machine.status && machine.status !== 'unknown') || typeof machine.cpu_load === 'number'),
  );

  /**
   * Active subscriptions only: Billing answers `subscription_not_renewable` for
   * every other state, so offering renewal there would be a promise the server
   * breaks. Works for Custom VDS as well as fixed plans — Billing prices a
   * configurable renewal from the configuration this subscription recorded.
   *
   * Gates both entry points, so the clickable date and the button can never
   * disagree about whether renewal is on offer.
   */
  const canRenew = Boolean(onRenew) && subscription.status === 'active';

  const { title, planName: planUnderTitle } = resolveSubscriptionTitle(subscription, tariff, {
    customPlan: t.subscriptions.customPlan,
    unknownPlan: t.subscriptions.unknownPlan,
  });
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
      {/* Status first, above the name: it is the one thing a customer scanning a
          list of servers is looking for, and the top-left corner is where they
          look first. */}
      <NameCell>
        <StatusDot status={tone} label={t.subscriptions.statusLabels[subscription.status]} />
        {isRenaming ? (
          <NameInput
            autoFocus
            defaultValue={subscription.display_name ?? ''}
            maxLength={64}
            aria-label={t.subscriptions.rename.label}
            disabled={renameSaving}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void commitRename(event.currentTarget.value);
              if (event.key === 'Escape') setIsRenaming(false);
            }}
            onBlur={(event) => void commitRename(event.currentTarget.value)}
          />
        ) : (
          <NameRow>
            <Name>{title}</Name>
            {onRename && (
              <RenameButton
                type="button"
                onClick={() => setIsRenaming(true)}
                aria-label={t.subscriptions.rename.label}
                title={t.subscriptions.rename.hint}
              >
                ✎
              </RenameButton>
            )}
          </NameRow>
        )}
        {/* Тариф второй строкой — только когда имя клиента вытеснило его из
            заголовка. Иначе он повторял бы сам себя. */}
        {planUnderTitle && <Term>{planUnderTitle}</Term>}
        <ServiceId title={subscription.subscription_id}>
          {t.subscriptions.serviceId}: {subscription.subscription_id.slice(0, 8)}
        </ServiceId>
        {/* Цена рядом со сроком, а не в углу: «Ежемесячно» без суммы —
            половина ответа на вопрос «сколько я плачу». Отсутствует, когда
            биллинг тариф оценить не может; тогда остаётся один срок, и это
            честнее выдуманного числа. */}
        {resolvedPeriod && (
          <Term>
            {t.subscriptions.term[resolvedPeriod]}
            {price && ` · ${formatMoneyMinor(price.amount_minor, price.currency, lang)}`}
          </Term>
        )}
      </NameCell>

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

      {/* Top right: when the service runs out, the button that pushes that date
          back, then where the server lives. Renew sits directly under the date
          it extends — the two are one thought, and separating them left the
          button in a row of unrelated power controls. */}
      <CornerCell>
        {/* The date is the renew control — there is no separate button. The
            chip therefore has to advertise itself: `title` on hover, a pointer
            cursor, and an accent border that only appears when it is actually
            clickable. Without those it is a date that silently charges money,
            which is worse than an extra button. While the purchase is opening it
            switches to the "renewing" label, so the one control still reports
            its own progress. */}
        <ValidUntilChip
          as={canRenew ? 'button' : 'span'}
          type={canRenew ? 'button' : undefined}
          $clickable={canRenew}
          onClick={canRenew ? () => onRenew!(subscription) : undefined}
          disabled={canRenew ? isRenewing : undefined}
          title={canRenew ? t.subscriptions.renewHint : undefined}
        >
          {canRenew && isRenewing ? (
            t.subscriptions.renewing
          ) : (
            <>
              {t.subscriptions.validUntil}: <ValidUntilValue>{validUntil}</ValidUntilValue>
            </>
          )}
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
      </CornerCell>

      <TelemetryCell>
        {/* Всё в этом блоке приходит от движка провижининга через Billing. Пока
            Billing не проксирует данные, полей нет и остаются прочерки — честный
            ответ, а не заглушка: выдуманный адрес или выдуманная загрузка это
            ложь о чужой машине. */}
        <TelemetryItem>
          {t.subscriptions.machine.title}:{' '}
          <TelemetryValue>
            {machine?.status && machine.status !== 'unknown'
              ? t.subscriptions.machine[machine.status]
              : t.subscriptions.telemetry.noData}
          </TelemetryValue>
        </TelemetryItem>
        <TelemetryItem>
          {t.subscriptions.telemetry.ip}:{' '}
          <TelemetryValue>
            {subscription.server?.public_ip ?? t.subscriptions.telemetry.noData}
          </TelemetryValue>
        </TelemetryItem>
        <TelemetryItem>
          {t.subscriptions.telemetry.cpu}:{' '}
          <TelemetryValue>
            {/* cpu_load — доля одного ядра, 0..1. Показываем процентами, но
                считаем от того, что прислали, а не подгоняем под красивое. */}
            {typeof machine?.cpu_load === 'number'
              ? `${Math.round(machine.cpu_load * 100)}%`
              : t.subscriptions.telemetry.noData}
          </TelemetryValue>
        </TelemetryItem>
        <TelemetryItem>
          {t.subscriptions.telemetry.network}:{' '}
          <TelemetryValue>
            {/* Мгновенная скорость между двумя опросами, не расход за период.
                Ноль — это измерение (машина простаивает), поэтому проверяем
                тип, а не истинность: `0 || dash` показал бы прочерк там, где
                ответ есть. */}
            {typeof machine?.rx_bps === 'number' && typeof machine?.tx_bps === 'number'
              ? `↓ ${formatMbits(machine.rx_bps)} ↑ ${formatMbits(machine.tx_bps)} ${t.subscriptions.telemetry.mbits}`
              : t.subscriptions.telemetry.noData}
          </TelemetryValue>
        </TelemetryItem>
        {/* Только когда показывать действительно нечего. Раньше подпись стояла
            безусловно и после появления телеметрии оказалась под живыми
            цифрами, сообщая, что данных нет. Прочерк в отдельной строке и так
            читается как «нет данных» — объяснять нужно лишь пустую таблицу
            целиком. */}
        {!hasTelemetry && <TelemetryNote>{t.subscriptions.telemetry.note}</TelemetryNote>}
      </TelemetryCell>

      {/* Bottom row: actions left to right by how often they are wanted, with
          the irreversible one pushed to the far corner away from the rest. */}
      <ActionRow>
        {!hasServer ? (
          // Nothing to control until the engine has built the machine. Saying so
          // beats offering buttons that can only fail.
          <ControlNotice>{t.subscriptions.controls.noServer}</ControlNotice>
        ) : isPendingDeletion ? (
          // On its way out: one way back, and no other control that would ask a
          // half-deleted machine to do something.
          <>
            <ControlButton
              type="button"
              onClick={() => void controls.restore()}
              disabled={busy}
              $tone="go"
            >
              <span aria-hidden>↩</span>
              {t.subscriptions.controls.restore}
            </ControlButton>
            <ControlNotice>{t.subscriptions.controls.pendingDeletion}</ControlNotice>
          </>
        ) : (
          <>
            {/* The power button's colour states what pressing it would do: green
                to start a machine that is down, grey to stop one that is up. */}
            <ControlButton
              type="button"
              onClick={() => void controls.setPower(powerIsOn ? 'off' : 'on')}
              disabled={busy}
              $tone={powerIsOn ? undefined : 'go'}
            >
              <span aria-hidden>{powerIsOn ? '⏹' : '▶'}</span>
              {powerIsOn ? t.subscriptions.controls.powerOff : t.subscriptions.controls.powerOn}
            </ControlButton>
            <ControlButton type="button" onClick={() => void controls.reboot()} disabled={busy}>
              <span aria-hidden>⟳</span>
              {t.subscriptions.controls.reboot}
            </ControlButton>
            <ControlButton
              type="button"
              onClick={() =>
                controls.credentials || controls.credentialsMissing
                  ? controls.hideCredentials()
                  : void controls.revealCredentials()
              }
              disabled={busy}
            >
              <span aria-hidden>🔑</span>
              {controls.credentials || controls.credentialsMissing
                ? t.subscriptions.controls.hidePassword
                : t.subscriptions.controls.showPassword}
            </ControlButton>

            {/* Two presses, not one. Deletion is the only action on this card
                the customer cannot take back by themselves, and the cost of an
                accidental click is not symmetric with the cost of an extra one. */}
            {confirmingDelete ? (
              <>
                <ControlButton
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(false);
                    void controls.remove();
                  }}
                  disabled={busy}
                >
                  {t.subscriptions.controls.deleteConfirm}
                </ControlButton>
                <ControlButton type="button" onClick={() => setConfirmingDelete(false)} disabled={busy}>
                  {t.subscriptions.controls.deleteCancel}
                </ControlButton>
              </>
            ) : (
              <DeleteButton
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={busy}
                aria-label={t.subscriptions.controls.delete}
                title={t.subscriptions.controls.delete}
              >
                🗑
              </DeleteButton>
            )}
          </>
        )}
      </ActionRow>

      {controls.credentials && (
        <CredentialsBox>
          <span>
            {t.subscriptions.controls.username}: {controls.credentials.username ?? '—'}
          </span>
          <span>
            {t.subscriptions.controls.password}: {controls.credentials.password ?? '—'}
          </span>
        </CredentialsBox>
      )}
      {/* An imported machine has no stored password. That is an answer, not a
          fault: the customer keeps using the access they already have. */}
      {controls.credentialsMissing && (
        <ControlNotice>{t.subscriptions.controls.noPassword}</ControlNotice>
      )}
      {renameFailed && <ControlError>{t.subscriptions.rename.failed}</ControlError>}
      {controls.error && <ControlError>{t.subscriptions.controls.failed}</ControlError>}
      {provisioningNote && <ProvisioningNote>{provisioningNote}</ProvisioningNote>}
      {renewError && <RenewError>{t.subscriptions.renewError}</RenewError>}
    </Row>
  );
}
