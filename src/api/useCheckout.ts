import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLang } from '../i18n/LanguageContext';
import { checkoutPath, localizePath, routePaths } from '../i18n/paths';
import type { BillingPeriod, Tariff } from '../data/tariffs';
import { createInvoice, fetchPaymentMethods } from './checkout';

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
  /** Carried so clearing a settled purchase can also retire its idempotency key
   * — the return page knows the invoice, not the package it was for. */
  packageCode: string;
}

export function rememberPendingInvoice(invoiceId: string, packageCode: string): void {
  try {
    sessionStorage.setItem(PENDING_INVOICE_KEY, JSON.stringify({ invoiceId, packageCode }));
  } catch {
    // Private mode or storage disabled: the return page falls back to telling
    // the customer to check their dashboard.
  }
}

function readPendingRecord(): PendingInvoice | null {
  try {
    const raw = sessionStorage.getItem(PENDING_INVOICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingInvoice>;
    return parsed.invoiceId ? { invoiceId: parsed.invoiceId, packageCode: parsed.packageCode ?? '' } : null;
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
  if (record?.packageCode) clearOrderIdempotencyKey(record.packageCode);
}

/**
 * One idempotency key per intent to buy a given package, not per click.
 *
 * Billing replays the original response for a repeated key, so reusing it is
 * what makes a double-click — or a browser Back out of the gateway followed by
 * another Confirm — return the invoice that already exists instead of opening a
 * second one and registering a second payment. A fresh uuid per call would
 * defeat the mechanism entirely.
 *
 * sessionStorage rather than a ref: the key has to survive a page reload and the
 * round trip through the gateway, both of which remount the component.
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

/** Drops the key once a purchase has been handed to the gateway, so a later,
 * genuinely new purchase of the same plan is not replayed as the old one. */
export function clearOrderIdempotencyKey(packageCode: string): void {
  try {
    sessionStorage.removeItem(`${IDEMPOTENCY_KEY_PREFIX}${packageCode}`);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
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
      navigate(checkoutPath(lang, tariff.packageCode[period]));
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
        const invoice = await createInvoice({
          accessToken,
          packageCode,
          // First configured method wins. A chooser belongs on the confirmation
          // page once this install offers more than one; today it offers one.
          methodCode: methods[0].method_code,
          returnUrl,
          customerEmail: email,
          currency: tariff.currency,
          idempotencyKey: orderIdempotencyKey(packageCode),
        });

        if (!invoice.payment_url) {
          throw new Error('no_payment_url');
        }
        rememberPendingInvoice(invoice.invoice_id, packageCode);
        // The key is deliberately NOT cleared here. Backing out of the gateway
        // and confirming again must replay this same invoice, not open a second
        // one; CheckoutReturnPage retires it when the purchase settles.
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

  return {
    isSubmitting,
    error,
    confirm,
    clearError: useCallback(() => setError(null), []),
  };
}
