import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import styled from 'styled-components';
import { DashboardShell } from '../components/dashboard/DashboardShell';
import { Button } from '../components/ui/Button';
import { StatusDot } from '../components/ui/StatusDot';
import { useAuth } from '../auth/AuthContext';
import { useLang, useTranslation, interpolate } from '../i18n/LanguageContext';
import { usePageMeta } from '../i18n/usePageMeta';
import { localizePath, routePaths } from '../i18n/paths';
import {
  clearTopUpIdempotencyKey,
  createTopUp,
  parseMajorAmount,
  planBulkPayment,
  rememberPendingTopUp,
  topUpIdempotencyKey,
  useBalance,
  type BalanceEntry,
  type TopUp,
} from '../api/balance';
import {
  createRenewal,
  fetchPaymentMethods,
  fetchRenewalPreview,
  type RenewalPreview,
} from '../api/checkout';
import { DEFAULT_CURRENCY } from '../api/config';
import { isPaidFromBalance } from '../api/useCheckout';
import { useSubscriptions, type Subscription } from '../api/subscriptions';
import { findByPackageCode, useTariffs } from '../api/catalogue';
import { resolveSubscriptionTitle } from '../components/dashboard/subscriptionTitle';
import { formatMoneyMinor } from '../utils/money';
import { media } from '../theme/breakpoints';

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.h3};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h4};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const Amount = styled.span<{ $negative?: boolean }>`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 2.25rem;
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  color: ${({ theme, $negative }) =>
    $negative ? theme.colors.semantic.error : theme.colors.indigo[900]};
`;

const Note = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const WarnNote = styled(Note)`
  color: ${({ theme }) => theme.colors.semantic.error};
`;

const OkNote = styled(Note)`
  color: ${({ theme }) => theme.colors.mint[700]};
`;

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.semantic.error};
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Chip = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  color: ${({ theme, $active }) => ($active ? theme.colors.neutral[0] : theme.colors.indigo[600])};
  background: ${({ theme, $active }) => ($active ? theme.colors.indigo[600] : 'transparent')};
  border: 1.5px solid ${({ theme }) => theme.colors.indigo[200]};
`;

const AmountField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 260px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const AmountInput = styled.input`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.neutral[900]};
  font-size: ${({ theme }) => theme.fontSizes.body};
`;

const Rows = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const RowItem = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 12px 0;
  font-size: ${({ theme }) => theme.fontSizes.small};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[200]};

  &:last-child {
    border-bottom: none;
  }
`;

const PickRow = styled.label<{ $disabled: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 12px 0;
  font-size: ${({ theme }) => theme.fontSizes.small};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};

  &:last-child {
    border-bottom: none;
  }
`;

const PickName = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.indigo[900]};
  min-width: 140px;
`;

const PickPrice = styled.span`
  margin-left: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const Muted = styled.span`
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  ${media.tablet`
    align-items: flex-start;
  `}
`;

const PRESETS_MINOR = [50000, 100000, 300000, 500000];

/** Renewals Billing will take money for. Mirrors PAYABLE_SUBSCRIPTION_STATUSES. */
const PAYABLE_STATUSES = new Set<Subscription['status']>(['active', 'past_due', 'expired']);

/** Billing's error code out of the `code: message` envelope `toApiError` builds. */
function errorCode(message: string): string {
  return message.split(':')[0].trim();
}

export function BalancePage() {
  const t = useTranslation('dashboard');
  const { lang } = useLang();
  const { accessToken, user } = useAuth();
  const [params] = useSearchParams();
  usePageMeta(t.balance.meta.title, t.balance.meta.description);

  const { balance, isLoading, error, refetch } = useBalance();
  const { subscriptions, isLoading: subsLoading, error: subsError, refetch: refetchSubs } =
    useSubscriptions();
  const { tariffs } = useTariffs();

  // Prefilled by the checkout hint (`?amount=`) and by a bulk-pay link
  // (`?intent=`). Read once into state rather than each render: the customer
  // edits the field afterwards, and re-reading would undo their typing.
  const [amountText, setAmountText] = useState(() => {
    const amount = Number(params.get('amount'));
    return Number.isInteger(amount) && amount > 0 ? (amount / 100).toFixed(2) : '';
  });
  const [prefilledIntent] = useState<string[]>(() => {
    const raw = params.get('intent');
    return raw ? raw.split(',').map((id) => id.trim()).filter(Boolean) : [];
  });

  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [isToppingUp, setIsToppingUp] = useState(false);

  // Selection order is the customer's tick order, not the list order — it
  // becomes the top-up's `intent`, and Billing renews along it while the money
  // lasts. An ordered array, never a Set.
  const [selectedIds, setSelectedIds] = useState<string[]>(prefilledIntent);
  const [previews, setPreviews] = useState<Record<string, RenewalPreview | 'failed'>>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkDone, setBulkDone] = useState<string | null>(null);

  const payable = useMemo(
    () => subscriptions.filter((s) => PAYABLE_STATUSES.has(s.status)),
    [subscriptions],
  );

  // One preview per payable row, lazily and independently: a configurable plan
  // has no catalogue price at all, so this is the only way to know what renewing
  // it costs. A row whose preview fails is shown, marked, and unselectable —
  // guessing its price would put a number the customer might pay next to a
  // server we cannot price.
  // A ref, not the `previews` state, guards against asking twice: keying off
  // the state would put it in the dependency list, and every arriving preview
  // would re-run the effect.
  const requested = useRef(new Set<string>());
  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    for (const subscription of payable) {
      const id = subscription.subscription_id;
      if (requested.current.has(id)) continue;
      requested.current.add(id);
      fetchRenewalPreview(accessToken, id, DEFAULT_CURRENCY)
        .then((preview) => {
          if (active) setPreviews((current) => ({ ...current, [id]: preview }));
        })
        .catch(() => {
          if (active) setPreviews((current) => ({ ...current, [id]: 'failed' }));
        });
    }
    return () => {
      active = false;
    };
  }, [accessToken, payable]);

  const titleLabels = {
    customPlan: t.subscriptions.customPlan,
    unknownPlan: t.subscriptions.unknownPlan,
  };
  const titleFor = (subscription: Subscription) =>
    resolveSubscriptionTitle(
      subscription,
      (subscription.package_code ? findByPackageCode(tariffs, subscription.package_code) : null)?.tariff,
      titleLabels,
    ).title;

  const priceOf = (id: string): number | null => {
    const preview = previews[id];
    return preview && preview !== 'failed' ? preview.amount_minor : null;
  };

  const currency = balance?.currency ?? DEFAULT_CURRENCY;
  const money = useCallback(
    (minor: number) => formatMoneyMinor(minor, currency, lang),
    [currency, lang],
  );

  const toggle = (id: string) => {
    setBulkError(null);
    setBulkDone(null);
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((other) => other !== id) : [...current, id],
    );
  };

  const plan = planBulkPayment(
    selectedIds
      .map((id) => ({ subscriptionId: id, amountMinor: priceOf(id) }))
      // A selected row whose price never arrived cannot be part of a total.
      .filter((row): row is { subscriptionId: string; amountMinor: number } => row.amountMinor !== null),
    balance?.amount_minor ?? 0,
  );

  const amountMinor = parseMajorAmount(amountText);

  /** Billing's refusal, in words the customer can act on. */
  const topUpErrorText = (code: string): string => {
    switch (code) {
      case 'amount_below_minimum':
        return interpolate(t.balance.topUp.belowMinimum, {
          amount: money(balance?.min_top_up_minor ?? 0),
        });
      case 'amount_below_payment_method_minimum':
        return t.balance.topUp.methodRefused;
      case 'currency_not_supported':
        return t.balance.topUp.currencyNotSupported;
      case 'customer_email_missing':
        return t.balance.topUp.emailMissing;
      case 'payment_orchestrator_unavailable':
        return t.balance.topUp.gatewayUnavailable;
      default:
        return t.balance.topUp.failed;
    }
  };

  /**
   * Opens a top-up and hands the customer to the gateway.
   *
   * `intent` is the servers to renew afterwards, in tick order — Billing does
   * the renewing itself once the money lands, so nothing here calls `/renewals`
   * after a top-up.
   */
  const startTopUp = async (minor: number, intent: string[]) => {
    if (!accessToken) return;
    setIsToppingUp(true);
    setTopUpError(null);
    try {
      const methods = await fetchPaymentMethods(accessToken, minor, currency);
      if (methods.length === 0) throw new Error('no_payment_methods');

      const returnUrl = new URL(
        localizePath(lang, routePaths.balanceReturn),
        window.location.origin,
      ).toString();
      const topUp = await createTopUp({
        accessToken,
        amountMinor: minor,
        // First configured method wins, as everywhere else in this storefront:
        // which gateway is live is operator configuration.
        methodCode: methods[0].method_code,
        returnUrl,
        intent,
        currency,
        idempotencyKey: topUpIdempotencyKey(`${minor}:${currency}:${intent.join(',')}`),
      });

      // Billing has the top-up; the key has done its job. Retired before the
      // payment_url check, which can throw — see useCheckout.ts for the bug
      // that taught us to retire it here rather than on the return page.
      clearTopUpIdempotencyKey();

      if (!topUp.payment_url) throw new Error('no_payment_url');
      rememberPendingTopUp(topUp.top_up_id);
      window.location.assign(topUp.payment_url);
    } catch (err: unknown) {
      setTopUpError(topUpErrorText(err instanceof Error ? errorCode(err.message) : ''));
      setIsToppingUp(false);
    }
  };

  /**
   * Renews each selected server in turn, expecting the balance to settle every
   * one.
   *
   * Sequential, and it stops at the first renewal Billing did NOT pay from the
   * balance: that renewal is now an open invoice waiting for a card, and
   * carrying on would leave a trail of them behind the customer's back. Which
   * server it stopped on is named, because "some of them worked" is not
   * something anyone can act on.
   */
  const payFromBalance = async (ids: string[]) => {
    if (!accessToken) return;
    const receiptEmail = (user?.profile?.email ?? '').trim();
    if (!receiptEmail) {
      setBulkError(t.balance.topUp.emailMissing);
      return;
    }
    setBulkBusy(true);
    setBulkError(null);
    setBulkDone(null);
    const returnUrl = new URL(
      localizePath(lang, routePaths.checkoutReturn),
      window.location.origin,
    ).toString();

    let done = 0;
    try {
      for (const id of ids) {
        const methods = await fetchPaymentMethods(accessToken, priceOf(id) ?? 0, currency);
        if (methods.length === 0) throw new Error('no_payment_methods');
        const renewal = await createRenewal({
          accessToken,
          subscriptionId: id,
          methodCode: methods[0].method_code,
          returnUrl,
          // Still required even though no card is involved: the balance paying
          // for a service issues its own fiscal receipt, and Billing refuses a
          // renewal with nowhere to send one. Taken from the verified profile —
          // this page has no per-server email field, unlike the renewal modal.
          customerEmail: receiptEmail,
          currency,
        });
        if (!isPaidFromBalance(renewal)) {
          const failed = payable.find((s) => s.subscription_id === id);
          setBulkError(
            interpolate(t.balance.bulk.partialFailure, {
              done,
              server: failed ? titleFor(failed) : id,
            }),
          );
          return;
        }
        done += 1;
      }
      setBulkDone(interpolate(t.balance.bulk.success, { count: done }));
      setSelectedIds([]);
    } catch {
      setBulkError(t.balance.bulk.failed);
    } finally {
      setBulkBusy(false);
      refetch();
      refetchSubs();
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <Note>{t.balance.loading}</Note>
      </DashboardShell>
    );
  }

  // Feature off on this install. Deliberately not an error: Billing answers 404
  // to every balance route until an operator turns it on, and a customer told
  // their balance "failed to load" would reasonably think their money is gone.
  if (!balance) {
    return (
      <DashboardShell>
        <PageTitle>{t.balance.title}</PageTitle>
        <Card>
          <CardTitle>{error ? t.balance.title : t.balance.offTitle}</CardTitle>
          <Note>{error ? t.balance.error : t.balance.offBody}</Note>
          <div>
            <Button as={Link} to={localizePath(lang, routePaths.dashboard)} $variant="secondary" $size="sm">
              {t.balance.return.toDashboard}
            </Button>
          </div>
        </Card>
      </DashboardShell>
    );
  }

  const presets = PRESETS_MINOR.filter((minor) => minor >= balance.min_top_up_minor);
  const maxMinor = balance.max_top_up_minor;
  const amountTooLow = amountMinor !== null && amountMinor < balance.min_top_up_minor;
  const amountTooHigh = amountMinor !== null && maxMinor !== null && amountMinor > maxMinor;
  const amountUsable = amountMinor !== null && !amountTooLow && !amountTooHigh;

  return (
    <DashboardShell>
      <PageTitle>{t.balance.title}</PageTitle>

      <Card>
        <Label>{t.balance.current}</Label>
        <Amount $negative={balance.amount_minor < 0}>
          {money(balance.amount_minor)}
        </Amount>
        {balance.negative && <WarnNote>{t.balance.negativeNote}</WarnNote>}
        <Note>
          {interpolate(t.balance.minTopUp, { amount: money(balance.min_top_up_minor) })}
          {maxMinor !== null && ` ${interpolate(t.balance.maxTopUp, { amount: money(maxMinor) })}`}
        </Note>
      </Card>

      <Card>
        <CardTitle>{t.balance.topUp.title}</CardTitle>
        <Chips>
          {presets.map((minor) => (
            <Chip
              key={minor}
              type="button"
              $active={amountMinor === minor}
              onClick={() => {
                setTopUpError(null);
                setAmountText((minor / 100).toFixed(2));
              }}
            >
              {money(minor)}
            </Chip>
          ))}
        </Chips>
        <AmountField>
          {t.balance.topUp.amountLabel}
          <AmountInput
            type="text"
            inputMode="decimal"
            value={amountText}
            disabled={isToppingUp}
            onChange={(event) => {
              setTopUpError(null);
              setAmountText(event.target.value);
            }}
          />
        </AmountField>
        {amountTooLow && (
          <ErrorText>
            {interpolate(t.balance.topUp.belowMinimum, { amount: money(balance.min_top_up_minor) })}
          </ErrorText>
        )}
        {amountTooHigh && maxMinor !== null && (
          <ErrorText>
            {interpolate(t.balance.topUp.aboveMaximum, { amount: money(maxMinor) })}
          </ErrorText>
        )}
        <Note>{t.balance.topUp.note}</Note>
        {topUpError && <ErrorText>{topUpError}</ErrorText>}
        <div>
          <Button
            type="button"
            disabled={!amountUsable || isToppingUp}
            onClick={() => void startTopUp(amountMinor ?? 0, prefilledIntent)}
          >
            {isToppingUp
              ? t.balance.topUp.submitting
              : interpolate(t.balance.topUp.submit, {
                  amount: amountUsable ? money(amountMinor) : '',
                })}
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>{t.balance.bulk.title}</CardTitle>
        <Note>{t.balance.bulk.subtitle}</Note>
        {subsLoading ? (
          <Note>{t.balance.bulk.loading}</Note>
        ) : subsError ? (
          <ErrorText>{t.balance.bulk.error}</ErrorText>
        ) : payable.length === 0 ? (
          <Note>{t.balance.bulk.empty}</Note>
        ) : (
          <>
            <Rows as="div">
              {payable.map((subscription) => {
                const id = subscription.subscription_id;
                const price = priceOf(id);
                const unpriceable = previews[id] === 'failed';
                return (
                  <PickRow key={id} $disabled={unpriceable}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(id)}
                      disabled={unpriceable || bulkBusy}
                      onChange={() => toggle(id)}
                    />
                    <PickName>{titleFor(subscription)}</PickName>
                    <StatusDot
                      status={subscription.status === 'active' ? 'online' : 'critical'}
                      label={t.subscriptions.statusLabels[subscription.status]}
                    />
                    <Muted>
                      {subscription.valid_until
                        ? interpolate(t.balance.bulk.validUntil, {
                            date: new Date(subscription.valid_until).toLocaleDateString(lang, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }),
                          })
                        : '—'}
                    </Muted>
                    <PickPrice>
                      {price !== null ? (
                        money(price)
                      ) : unpriceable ? (
                        <Muted>{t.balance.bulk.priceUnavailable}</Muted>
                      ) : (
                        <Muted>…</Muted>
                      )}
                    </PickPrice>
                  </PickRow>
                );
              })}
            </Rows>

            {plan.kind !== 'empty' && (
              <Footer>
                <Note>
                  {interpolate(t.balance.bulk.selected, {
                    count: plan.subscriptionIds.length,
                    total: money(plan.totalMinor),
                    balance: money(balance.amount_minor),
                  })}
                </Note>
                {plan.kind === 'from_balance' ? (
                  <Button
                    type="button"
                    disabled={bulkBusy}
                    onClick={() => void payFromBalance(plan.subscriptionIds)}
                  >
                    {bulkBusy
                      ? t.balance.bulk.paying
                      : interpolate(t.balance.bulk.payFromBalance, {
                          total: money(plan.totalMinor),
                          count: plan.subscriptionIds.length,
                        })}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      disabled={isToppingUp}
                      onClick={() => void startTopUp(plan.shortfallMinor, plan.subscriptionIds)}
                    >
                      {isToppingUp
                        ? t.balance.topUp.submitting
                        : interpolate(t.balance.bulk.topUpAndRenew, {
                            shortfall: money(plan.shortfallMinor),
                            count: plan.subscriptionIds.length,
                          })}
                    </Button>
                    <Note>{t.balance.bulk.topUpNote}</Note>
                  </>
                )}
                {bulkError && <ErrorText>{bulkError}</ErrorText>}
                {bulkDone && <OkNote>{bulkDone}</OkNote>}
              </Footer>
            )}
          </>
        )}
      </Card>

      {balance.top_ups.some((topUp) => topUp.status === 'pending') && (
        <Card>
          <CardTitle>{t.balance.pending.title}</CardTitle>
          <Rows>
            {balance.top_ups
              .filter((topUp) => topUp.status === 'pending')
              .map((topUp: TopUp) => (
                <RowItem key={topUp.top_up_id}>
                  <span>{money(topUp.amount_minor)}</span>
                  <Muted>{t.balance.pending.statusLabels[topUp.status]}</Muted>
                  {topUp.payment_url && (
                    // A pending top-up's payment page is still live, and the
                    // customer's money is not on the balance until they finish
                    // there. Anything else would make them start a second one.
                    <a href={topUp.payment_url} rel="noreferrer">
                      {t.balance.pending.continue}
                    </a>
                  )}
                </RowItem>
              ))}
          </Rows>
        </Card>
      )}

      <Card>
        <CardTitle>{t.balance.history.title}</CardTitle>
        {balance.entries.length === 0 ? (
          <Note>{t.balance.history.empty}</Note>
        ) : (
          <Rows>
            {balance.entries.map((entry: BalanceEntry) => (
              <RowItem key={entry.entry_id}>
                <Muted>
                  {new Date(entry.created_at).toLocaleDateString(lang, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Muted>
                <span>{t.balance.history.types[entry.entry_type]}</span>
                {/* Signed from `direction`, not from the amount: Billing sends
                    every amount positive and says which way it moved. */}
                <span>
                  {entry.direction === 'credit' ? '+' : '−'}
                  {money(entry.amount_minor)}
                </span>
                <Muted>
                  {interpolate(t.balance.history.balanceAfter, {
                    amount: money(entry.balance_after_minor),
                  })}
                </Muted>
              </RowItem>
            ))}
          </Rows>
        )}
      </Card>
    </DashboardShell>
  );
}
