import { useCallback, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLang } from '../i18n/LanguageContext';
import { localizePath, routePaths } from '../i18n/paths';
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

export function rememberPendingInvoice(invoiceId: string): void {
  try {
    sessionStorage.setItem(PENDING_INVOICE_KEY, invoiceId);
  } catch {
    // Private mode or storage disabled: the return page falls back to telling
    // the customer to check their dashboard.
  }
}

export function readPendingInvoice(): string | null {
  try {
    return sessionStorage.getItem(PENDING_INVOICE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingInvoice(): void {
  try {
    sessionStorage.removeItem(PENDING_INVOICE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

interface UseCheckoutResult {
  /** package_code currently being purchased, or null when idle. Lets a caller
   * show a spinner on the one button that was pressed rather than all of them. */
  pendingPackageCode: string | null;
  error: string | null;
  buy: (tariff: Tariff, period: BillingPeriod) => Promise<void>;
  clearError: () => void;
}

/**
 * Drives "press Order" end to end: sign the customer in if they are not already,
 * open an invoice against the catalogue, then hand them to the payment gateway.
 *
 * The browser never states a price. It names a package; Billing looks up what
 * that costs and registers the payment. Editing anything client-side changes
 * which plan is bought, not what it costs.
 */
export function useCheckout(): UseCheckoutResult {
  const { isAuthenticated, accessToken, user, login } = useAuth();
  const { lang } = useLang();
  const [pendingPackageCode, setPendingPackageCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = useCallback(
    async (tariff: Tariff, period: BillingPeriod) => {
      const packageCode = tariff.packageCode[period];

      // Not signed in: send them to the identity provider and bring them back to
      // this page, rather than failing the purchase. They press Order again once
      // they land — deliberately not auto-resuming, since returning from an
      // external login straight into a payment redirect is disorienting.
      if (!isAuthenticated || !accessToken) {
        await login(`${window.location.pathname}${window.location.search}`);
        return;
      }

      const email = user?.profile?.email;
      if (!email) {
        // The gateway needs an address for the fiscal receipt and we only ever
        // take it from the verified profile, so stop rather than invent one.
        setError('missing_email');
        return;
      }

      setPendingPackageCode(packageCode);
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
          // First configured method wins. A chooser belongs here once this
          // install offers more than one; today it offers exactly one.
          methodCode: methods[0].method_code,
          returnUrl,
          customerEmail: email,
          currency: tariff.currency,
        });

        if (!invoice.payment_url) {
          throw new Error('no_payment_url');
        }
        rememberPendingInvoice(invoice.invoice_id);
        // Leaves the SPA for the gateway's hosted page; the customer comes back
        // to returnUrl, where CheckoutReturnPage reads the outcome.
        window.location.assign(invoice.payment_url);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'checkout_failed');
        setPendingPackageCode(null);
      }
    },
    [isAuthenticated, accessToken, user, login, lang],
  );

  return {
    pendingPackageCode,
    error,
    buy,
    clearError: useCallback(() => setError(null), []),
  };
}
