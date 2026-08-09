import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { useLang } from '../i18n/LanguageContext';
import { checkoutPath, customCheckoutPath, localizePath, routePaths } from '../i18n/paths';
import type { BillingPeriod, Tariff } from '../data/tariffs';
import {
  createInvoice,
  createInvoiceFromQuote,
  createRenewal,
  fetchPaymentMethods,
  fetchRenewalPreview,
} from './checkout';
import type { CustomVdsConfiguration, Quote } from './checkout';
import type { Subscription } from './subscriptions';
import { DEFAULT_CURRENCY } from './config';

/**
 * The invoice the customer was last sent to pay.
 *
 * return_url has to be handed to Billing *before* it mints the invoice, so the
 * id cannot be in that URL. Stashing it here lets the return page read the
 * outcome back. sessionStorage rather than localStorage: it is scoped to this
 * tab and expires with it, and a stale id would only ever show an old result.
 */
const PENDING_INVOICE_KEY = 'hotvds.pendingInvoiceId';

interface PendingInvoice {
  invoiceId: string;
  /** Carried so clearing a settled purchase can also retire its idempotency key.
   * Older builds stored this as `packageCode`; keep reading that for migration. */
  idempotencyScope: string;
}

export function rememberPendingInvoice(invoiceId: string, idempotencyScope: string): void {
  try {
    sessionStorage.setItem(PENDING_INVOICE_KEY, JSON.stringify({ invoiceId, idempotencyScope }));
  } catch {
    // Private mode or storage disabled: the return page falls back to telling
    // the customer to check their dashboard.
  }
}

function readPendingRecord(): PendingInvoice | null {
  try {
    const raw = sessionStorage.getItem(PENDING_INVOICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingInvoice> & { packageCode?: string };
    const scope = parsed.idempotencyScope ?? parsed.packageCode ?? '';
    return parsed.invoiceId ? { invoiceId: parsed.invoiceId, idempotencyScope: scope } : null;
  } catch {
    // Unreadable or written by an older build that stored a bare id string.
    return null;
  }
}

export function readPendingInvoice(): string | null {
  return readPendingRecord()?.invoiceId ?? null;
}

/** Called once a purchase has settled. Retires the idempotency key too, so the
 * next genuine purchase of the same plan opens a new invoice rather than
 * replaying the finished one. */
export function clearPendingInvoice(): void {
  const record = readPendingRecord();
  try {
    sessionStorage.removeItem(PENDING_INVOICE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
  if (record?.idempotencyScope) clearOrderIdempotencyKey(record.idempotencyScope);
}

/**
 * One idempotency key per in-flight attempt to open a purchase — not per click,
 * and deliberately NOT per plan for longer than that attempt.
 *
 * Billing replays the original response for a repeated key, so the key is what
 * stops a retry after a dropped connection from registering a second payment.
 * It is retired the moment Billing has accepted the purchase, because the key
 * must never outlive the attempt that created it: ordering the same server twice
 * has to produce two servers.
 *
 * That is not how it worked until 2026-08-09. The key was scoped to
 * package/currency/configuration and retired only when CheckoutReturnPage saw
 * the invoice settle, so a customer buying a second identical server in the same
 * tab sent the same key and Billing replayed the first invoice — no second
 * server. Three separate situations left the key alive: payment taking longer
 * than the return page's 30s poll, the customer never reaching the return page,
 * and `payment_url` coming back missing (which threw before the key could be
 * associated with an invoice at all, orphaning it for the tab's lifetime).
 *
 * sessionStorage rather than a ref because the confirm page can remount
 * mid-attempt.
 */
const IDEMPOTENCY_KEY_PREFIX = 'hotvds.checkoutKey.';

export function orderIdempotencyKey(packageCode: string): string {
  const storageKey = `${IDEMPOTENCY_KEY_PREFIX}${packageCode}`;
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    sessionStorage.setItem(storageKey, fresh);
    return fresh;
  } catch {
    // Storage disabled: fall back to a per-call key. Double-submit protection is
    // lost, which is why the confirm button is also disabled while in flight.
    return crypto.randomUUID();
  }
}

/**
 * Retires the key. Call as soon as Billing has accepted the purchase — before
 * anything that can throw — so the next purchase of the same plan can never be
 * replayed as this one.
 *
 * Safe to call twice: CheckoutReturnPage still calls it via clearPendingInvoice
 * when a purchase settles, which by then is a no-op.
 */
export function clearOrderIdempotencyKey(idempotencyScope: string): void {
  try {
    sessionStorage.removeItem(`${IDEMPOTENCY_KEY_PREFIX}${idempotencyScope}`);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

export function customVdsIntentKey(packageCode: string, configuration: CustomVdsConfiguration, currency: string): string {
  return [
    'custom',
    packageCode,
    currency,
    configuration.cpu,
    configuration.ram_gb,
    configuration.ssd_gb,
    configuration.os,
    configuration.datacenter,
  ].join(':');
}

/**
 * Pressing "Order" on a plan card. Navigation only — no network call, no auth
 * check, and above all no invoice.
 *
 * Ordering used to run the whole purchase straight off this click, which meant a
 * single misclick opened a real invoice and registered a payment with the
 * gateway before the customer had seen a total or agreed to anything. The click
 * now just carries the chosen package to the confirmation page.
 */
export function useOrderIntent(): (tariff: Tariff, period: BillingPeriod) => void {
  const navigate = useNavigate();
  const { lang } = useLang();

  return useCallback(
    (tariff: Tariff, period: BillingPeriod) => {
      navigate(checkoutPath(lang, tariff.packageCode[period], tariff.currency));
    },
    [navigate, lang],
  );
}

export function useCustomOrderIntent(): (
  packageCode: string,
  configuration: CustomVdsConfiguration,
  currency: string,
) => void {
  const navigate = useNavigate();
  const { lang } = useLang();

  return useCallback(
    (packageCode: string, configuration: CustomVdsConfiguration, currency: string) => {
      navigate(customCheckoutPath(lang, packageCode, configuration, currency));
    },
    [navigate, lang],
  );
}

interface UseCheckoutResult {
  isSubmitting: boolean;
  error: string | null;
  /** Opens the invoice and leaves for the gateway. Call only once the customer
   * has confirmed — this is the point money starts moving. */
  confirm: (tariff: Tariff, period: BillingPeriod) => Promise<void>;
  confirmQuote: (quote: Quote, idempotencyScope: string) => Promise<void>;
  clearError: () => void;
}

/**
 * The second half of a purchase, run from the confirmation page: open an invoice
 * against the catalogue and hand the customer to the payment gateway.
 *
 * The browser never states a price. It names a package; Billing looks up what
 * that costs and registers the payment. Editing anything client-side changes
 * which plan is bought, not what it costs.
 */
export function useCheckout(): UseCheckoutResult {
  const { accessToken, user } = useAuth();
  const { lang } = useLang();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(
    async (tariff: Tariff, period: BillingPeriod) => {
      const packageCode = tariff.packageCode[period];

      // The page renders a sign-in button instead of Confirm when there is no
      // session, so reaching here without a token means the session lapsed
      // between render and click.
      if (!accessToken) {
        setError('not_signed_in');
        return;
      }

      const email = user?.profile?.email;
      if (!email) {
        // The gateway needs an address for the fiscal receipt and we only ever
        // take it from the verified profile, so stop rather than invent one.
        setError('missing_email');
        return;
      }

      setIsSubmitting(true);
      setError(null);
      try {
        const amountMinor = Math.round((period === 'annual' ? tariff.priceYearly : tariff.priceMonthly) * 100);
        const methods = await fetchPaymentMethods(accessToken, amountMinor, tariff.currency);
        if (methods.length === 0) {
          throw new Error('no_payment_methods');
        }

        const returnUrl = new URL(
          localizePath(lang, routePaths.checkoutReturn),
          window.location.origin,
        ).toString();
        const idempotencyScope = `${packageCode}:${tariff.currency}`;
        const invoice = await createInvoice({
          accessToken,
          packageCode,
          // First configured method wins. A chooser belongs on the confirmation
          // page once this install offers more than one; today it offers one.
          methodCode: methods[0].method_code,
          returnUrl,
          customerEmail: email,
          currency: tariff.currency,
          idempotencyKey: orderIdempotencyKey(idempotencyScope),
        });

        // Billing has the purchase; the key has done its job and must not
        // outlive it. Retired here rather than on the return page because the
        // return page is not guaranteed to run — and before the payment_url
        // check below, which can throw and would otherwise strand the key with
        // no invoice record to find it by.
        clearOrderIdempotencyKey(idempotencyScope);

        if (!invoice.payment_url) {
          throw new Error('no_payment_url');
        }
        rememberPendingInvoice(invoice.invoice_id, idempotencyScope);
        // Leaves the SPA for the gateway's hosted page; the customer comes back
        // to returnUrl, where CheckoutReturnPage reads the outcome.
        window.location.assign(invoice.payment_url);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'checkout_failed');
        setIsSubmitting(false);
      }
    },
    [accessToken, user, lang],
  );

  const confirmQuote = useCallback(
    async (quote: Quote, idempotencyScope: string) => {
      if (!accessToken) {
        setError('not_signed_in');
        return;
      }

      const email = user?.profile?.email;
      if (!email) {
        setError('missing_email');
        return;
      }

      setIsSubmitting(true);
      setError(null);
      try {
        const methods = await fetchPaymentMethods(accessToken, quote.amount_minor, quote.currency);
        if (methods.length === 0) {
          throw new Error('no_payment_methods');
        }

        const returnUrl = new URL(
          localizePath(lang, routePaths.checkoutReturn),
          window.location.origin,
        ).toString();
        const invoice = await createInvoiceFromQuote({
          accessToken,
          quoteId: quote.quote_id,
          methodCode: methods[0].method_code,
          returnUrl,
          customerEmail: email,
          idempotencyKey: orderIdempotencyKey(idempotencyScope),
        });

        // See confirm(): retired as soon as Billing accepts, before the throw.
        clearOrderIdempotencyKey(idempotencyScope);

        if (!invoice.payment_url) {
          throw new Error('no_payment_url');
        }
        rememberPendingInvoice(invoice.invoice_id, idempotencyScope);
        window.location.assign(invoice.payment_url);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'checkout_failed');
        setIsSubmitting(false);
      }
    },
    [accessToken, user, lang],
  );

  return {
    isSubmitting,
    error,
    confirm,
    confirmQuote,
    clearError: useCallback(() => setError(null), []),
  };
}

interface UseRenewalResult {
  /** The subscription currently being sent to the gateway, so only its own
   * button shows a busy state while the others stay usable. */
  renewingId: string | null;
  error: string | null;
  /** Which subscription `error` belongs to, so a list of servers can show the
   * failure on the card that actually failed. */
  errorSubscriptionId: string | null;
  renew: (subscription: Subscription) => Promise<void>;
  clearError: () => void;
}

/**
 * Renewing one existing server from the dashboard.
 *
 * Deliberately NOT routed through the confirmation page the way a first purchase
 * is: the customer already owns this server at this price, so there is no new
 * plan or total to agree to — this is "add another term to what I already have".
 * The amount still comes from Billing, never from here.
 *
 * One server per press by design. Billing bills one subscription per invoice
 * (its capture path reads exactly one invoice line), so a "renew all" button
 * would have to open several invoices and walk the customer through the gateway
 * once per server — worse than letting them renew the one they came for.
 *
 * Works for both fixed plans and Custom VDS. The price comes from Billing's
 * renewal-preview, which is the only way to know it: `GET /subscriptions` returns
 * no money data, and a configurable package has no catalogue price — its amount
 * is a pricing rule applied to the configuration the customer actually bought.
 */
export function useRenewal(): UseRenewalResult {
  const { accessToken } = useAuth();
  const { lang } = useLang();
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorSubscriptionId, setErrorSubscriptionId] = useState<string | null>(null);

  const renew = useCallback(
    async (subscription: Subscription) => {
      if (!accessToken) {
        setError('not_signed_in');
        setErrorSubscriptionId(subscription.subscription_id);
        return;
      }

      setRenewingId(subscription.subscription_id);
      setError(null);
      setErrorSubscriptionId(null);
      try {
        // Ask Billing what this renewal costs before anything else: the
        // payment-method lookup is amount-scoped, so a guessed total risks
        // choosing a method that cannot take the real one. Billing prices the
        // invoice itself regardless — this figure never sets what is charged.
        const preview = await fetchRenewalPreview(
          accessToken,
          subscription.subscription_id,
          DEFAULT_CURRENCY,
        );
        const currency = preview.currency;
        const methods = await fetchPaymentMethods(accessToken, preview.amount_minor, currency);
        if (methods.length === 0) {
          throw new Error('no_payment_methods');
        }

        const returnUrl = new URL(
          localizePath(lang, routePaths.checkoutReturn),
          window.location.origin,
        ).toString();
        // Scoped to the subscription, not the package: renewing server A must
        // never replay server B's renewal, even on the same plan.
        const idempotencyScope = `renewal:${subscription.subscription_id}`;
        const renewal = await createRenewal({
          accessToken,
          subscriptionId: subscription.subscription_id,
          methodCode: methods[0].method_code,
          returnUrl,
          currency,
          idempotencyKey: orderIdempotencyKey(idempotencyScope),
        });

        // Same treatment, though renewal was never exposed to the original bug:
        // its key is scoped to one subscription, and Billing itself returns an
        // existing unpaid renewal rather than duplicating. Retiring it here keeps
        // one rule for all three purchase paths instead of an exception someone
        // has to remember.
        clearOrderIdempotencyKey(idempotencyScope);

        if (!renewal.payment_url || !renewal.invoice_id) {
          throw new Error('no_payment_url');
        }
        rememberPendingInvoice(renewal.invoice_id, idempotencyScope);
        window.location.assign(renewal.payment_url);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'renewal_failed');
        setErrorSubscriptionId(subscription.subscription_id);
        setRenewingId(null);
      }
    },
    [accessToken, lang],
  );

  return {
    renewingId,
    error,
    errorSubscriptionId,
    renew,
    clearError: useCallback(() => {
      setError(null);
      setErrorSubscriptionId(null);
    }, []),
  };
}
