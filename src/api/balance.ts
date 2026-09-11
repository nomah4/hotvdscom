import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  BILLING_API_BASE,
  DEFAULT_CURRENCY,
  PROJECT_CODE,
  TENANT_ID,
  toApiError,
} from './config';

/**
 * Account balance — money the customer has already paid us that has not been
 * spent on a service yet.
 *
 * The whole feature is dark on production until an operator turns it on, and
 * Billing says so by answering `404 {"error":{"code":"not_found"}}` to every
 * balance route. That is an ordinary answer, not a fault: `fetchBalance`
 * resolves to `null` for it and every caller must read `null` as "this install
 * has no balance", never as "something broke". An error banner over a feature
 * that was deliberately switched off is worse than silence — it tells the
 * customer their money is missing.
 */

export type BalanceEntryDirection = 'credit' | 'debit';

export type BalanceEntryType =
  | 'top_up'
  | 'invoice_payment'
  | 'admin_credit'
  | 'admin_debit'
  | 'chargeback_reversal'
  | 'refund';

/** One movement of the ledger. Read-only; the storefront never writes entries. */
export interface BalanceEntry {
  entry_id: string;
  created_at: string;
  direction: BalanceEntryDirection;
  entry_type: BalanceEntryType;
  amount_minor: number;
  /** The balance this entry left behind, so a row can be shown without summing. */
  balance_after_minor: number;
  invoice_id: string | null;
  top_up_id: string | null;
}

export type TopUpStatus = 'pending' | 'captured' | 'failed' | 'expired';

export interface TopUp {
  top_up_id: string;
  status: TopUpStatus;
  amount_minor: number;
  /** `null` once the top-up has settled — there is nowhere left to send anyone. */
  payment_url: string | null;
  expires_at: string | null;
  created_at?: string | null;
  captured_at?: string | null;
  /**
   * Subscriptions Billing renews from this top-up once it is captured, in this
   * order. Only present on `GET /balance/top-ups/<id>`.
   */
  intent?: string[] | null;
}

export interface Balance {
  external_user_id: string;
  currency: string;
  /** Signed: negative after a chargeback or a reversal. */
  amount_minor: number;
  min_top_up_minor: number;
  /** `null` means the install sets no ceiling. */
  max_top_up_minor: number | null;
  negative: boolean;
  /** Last 20, newest first. */
  entries: BalanceEntry[];
  /** Last 10, newest first. */
  top_ups: TopUp[];
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * The signed-in customer's balance, or `null` when Billing has the feature off.
 *
 * `external_user_id` is deliberately not sent, exactly as on `/subscriptions`:
 * under Bearer auth Billing derives identity from the token subject and refuses
 * a disagreeing value, so a browser can only ever read its own balance.
 */
export async function fetchBalance(accessToken: string): Promise<Balance | null> {
  const url = new URL(`${BILLING_API_BASE}/api/v1/balance`);
  url.searchParams.set('tenant_id', TENANT_ID);
  url.searchParams.set('project_code', PROJECT_CODE);

  const response = await fetch(url.toString(), { headers: authHeaders(accessToken) });
  // Feature off — see the module comment. Not an error, and not distinguishable
  // from one by status alone, which is why it is handled before toApiError.
  if (response.status === 404) return null;
  if (!response.ok) {
    throw await toApiError(response, 'Could not load your balance');
  }
  return (await response.json()) as Balance;
}

export interface CreateTopUpInput {
  accessToken: string;
  amountMinor: number;
  /** From `fetchPaymentMethods` for this amount — which gateway is live is
   * operator configuration, never a constant in the storefront. */
  methodCode: string;
  returnUrl: string;
  /**
   * Subscriptions to renew once the money lands, in the order the customer
   * picked them. Billing does the renewing itself — the storefront must not
   * call `/renewals` after a top-up, or the servers get paid for twice.
   */
  intent?: string[];
  currency?: string;
  idempotencyKey?: string;
}

/**
 * Opens a top-up and hands back a `payment_url` to send the customer to.
 *
 * The amount IS supplied by the caller here, unlike an invoice — a top-up has
 * no catalogue entry to price it from. That is safe in the only direction that
 * matters: the customer can only choose how much of their own money to put in,
 * and Billing still prices every service itself when the balance pays for one.
 */
export async function createTopUp(input: CreateTopUpInput): Promise<TopUp> {
  const response = await fetch(`${BILLING_API_BASE}/api/v1/balance/top-ups`, {
    method: 'POST',
    headers: {
      ...authHeaders(input.accessToken),
      // Billing rejects the request without this and replays the original
      // response for a repeated key — the only thing standing between a
      // double-click and two charges.
      'X-Idempotency-Key': input.idempotencyKey ?? crypto.randomUUID(),
    },
    body: JSON.stringify({
      tenant_id: TENANT_ID,
      project_code: PROJECT_CODE,
      amount_minor: input.amountMinor,
      currency: input.currency ?? DEFAULT_CURRENCY,
      method_code: input.methodCode,
      return_url: input.returnUrl,
      // Always sent, empty included: Billing reads "no particular servers, use
      // the balance as it likes" from an empty list, and omitting the key would
      // make the two cases indistinguishable in a request log.
      intent: input.intent ?? [],
    }),
  });

  if (!response.ok) {
    throw await toApiError(response, 'Could not start the top-up');
  }
  return (await response.json()) as TopUp;
}

/**
 * Reads one top-up back. A 404 propagates as an error rather than becoming
 * `null`: on this route it means "not yours / no such id", and a return page
 * that quietly rendered nothing would leave the customer unsure whether their
 * money arrived.
 */
export async function fetchTopUp(accessToken: string, topUpId: string): Promise<TopUp> {
  const response = await fetch(`${BILLING_API_BASE}/api/v1/balance/top-ups/${topUpId}`, {
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw await toApiError(response, 'Could not load the top-up');
  }
  return (await response.json()) as TopUp;
}

/**
 * One idempotency key per in-flight attempt to open a top-up — retired the
 * moment Billing accepts it.
 *
 * Same reasoning as `orderIdempotencyKey` in useCheckout.ts, and deliberately
 * NOT the same storage key: a top-up and a purchase are different money, and
 * sharing a slot would let one retire the other's key mid-attempt.
 *
 * The stored value carries the attempt's scope (amount + intent) alongside the
 * key. A customer who fails to reach the gateway, changes the amount and tries
 * again is making a *different* attempt — replaying the first response would
 * top them up by the old amount — so a changed scope mints a fresh key while an
 * identical retry still reuses one.
 */
const TOP_UP_KEY_STORAGE = 'hotvds.topUpKey';

export function topUpIdempotencyKey(scope: string): string {
  try {
    const raw = sessionStorage.getItem(TOP_UP_KEY_STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw) as { scope?: string; key?: string };
      if (parsed.scope === scope && parsed.key) return parsed.key;
    }
    const fresh = crypto.randomUUID();
    sessionStorage.setItem(TOP_UP_KEY_STORAGE, JSON.stringify({ scope, key: fresh }));
    return fresh;
  } catch {
    // Storage disabled: fall back to a per-call key. Double-submit protection is
    // lost, which is why the button is also disabled while the call is in flight.
    return crypto.randomUUID();
  }
}

/** Call as soon as Billing has accepted the top-up, before anything that can
 * throw — a key that outlives its attempt replays it. */
export function clearTopUpIdempotencyKey(): void {
  try {
    sessionStorage.removeItem(TOP_UP_KEY_STORAGE);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

/**
 * The top-up the customer was last sent to pay, for the return page to read
 * back — the same problem `rememberPendingInvoice` solves: `return_url` is
 * handed to Billing before it mints the id, so the id cannot be in that URL.
 */
const PENDING_TOP_UP_KEY = 'hotvds.pendingTopUpId';

export function rememberPendingTopUp(topUpId: string): void {
  try {
    sessionStorage.setItem(PENDING_TOP_UP_KEY, topUpId);
  } catch {
    // Private mode: the return page falls back to sending them to the balance
    // page, where the top-up is listed anyway.
  }
}

export function readPendingTopUp(): string | null {
  try {
    return sessionStorage.getItem(PENDING_TOP_UP_KEY);
  } catch {
    return null;
  }
}

export function clearPendingTopUp(): void {
  try {
    sessionStorage.removeItem(PENDING_TOP_UP_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

/**
 * A major-unit amount the customer typed → minor units, or `null` when it is not
 * a usable number.
 *
 * Accepts a comma as the decimal separator: the field is labelled in rubles on a
 * Russian-language page, and someone typing "1500,50" has not made a mistake.
 * Rejects anything past two decimals rather than rounding it, because rounding
 * would charge a figure the customer never typed; `Math.round` is there only to
 * keep float arithmetic from turning 10.07 into 1006 minor units.
 */
export function parseMajorAmount(value: string): number | null {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const minor = Math.round(Number(normalized) * 100);
  return minor > 0 ? minor : null;
}

/** One selected server on the bulk-pay list, priced by Billing's preview. */
export interface BulkPaymentRow {
  subscriptionId: string;
  amountMinor: number;
}

export type BulkPaymentPlan =
  | { kind: 'empty' }
  /** Enough on the balance: renew each id in turn, Billing settles from balance. */
  | { kind: 'from_balance'; totalMinor: number; subscriptionIds: string[] }
  /** Short: one top-up for the difference, carrying the ids as its intent. */
  | { kind: 'top_up'; totalMinor: number; shortfallMinor: number; subscriptionIds: string[] };

/**
 * Which of the two bulk-pay paths a selection takes.
 *
 * Pure and separate from the page on purpose: this is the decision that spends
 * the customer's money, and it has to be checkable without mounting React.
 *
 * The order of `subscriptionIds` is the order the customer ticked them, not the
 * order they are listed — it becomes the top-up's `intent`, and Billing renews
 * along that list as far as the money reaches. Reordering it silently would
 * renew a different server than the one they picked first.
 *
 * A negative balance raises the shortfall above the total, which is correct:
 * the debt has to be cleared before any of it buys a renewal.
 */
export function planBulkPayment(selected: BulkPaymentRow[], balanceMinor: number): BulkPaymentPlan {
  if (selected.length === 0) return { kind: 'empty' };

  const totalMinor = selected.reduce((sum, row) => sum + row.amountMinor, 0);
  const subscriptionIds = selected.map((row) => row.subscriptionId);

  if (balanceMinor >= totalMinor) {
    return { kind: 'from_balance', totalMinor, subscriptionIds };
  }
  return { kind: 'top_up', totalMinor, shortfallMinor: totalMinor - balanceMinor, subscriptionIds };
}

interface UseBalanceResult {
  /** `null` when Billing has the feature off — never an error state. */
  balance: Balance | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Live balance for the signed-in user, shaped like `useSubscriptions`.
 *
 * With no token it resolves to `null` rather than erroring: the checkout page
 * calls this while signed out, and "no session" and "feature off" both mean the
 * same thing to every caller — show nothing.
 */
export function useBalance(): UseBalanceResult {
  const { accessToken } = useAuth();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const refetch = useCallback(() => setReloadCount((count) => count + 1), []);

  useEffect(() => {
    if (!accessToken) {
      setBalance(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    fetchBalance(accessToken)
      .then((result) => {
        if (active) setBalance(result);
      })
      .catch((err: unknown) => {
        if (!active) return;
        // A real failure — the 404 never reaches here. Keep the amount out of
        // sight rather than showing a stale one next to an error.
        setBalance(null);
        setError(err instanceof Error ? err.message : 'balance_failed');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, reloadCount]);

  return { balance, isLoading, error, refetch };
}
