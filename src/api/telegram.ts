import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { BILLING_API_BASE, toApiError } from './config';

/**
 * Telegram notifications — an opt-in channel next to email, dark on this
 * install until an operator switches it on. Exactly like `balance.ts`,
 * Billing answers `404 {"error":{"code":"not_found"}}` to every route below
 * while the feature is off, and that is an ordinary answer, not a fault:
 * every function here resolves to `null` for it, and callers must read `null`
 * as "not offered here", never as "something broke". Linking itself finishes
 * outside the site — the customer presses Start in Telegram, Billing's own
 * webhook records the link, and this page only learns about it by asking
 * `GET /telegram/link` again.
 */

/**
 * The five event codes Billing can notify on. Not offered to the customer as
 * a choice here — which events actually fire is an operator decision made in
 * Billing's own admin settings, not per account — so nothing in this file
 * writes them. Kept only because `events` still arrives on the link object
 * below and this names its shape for anyone reading it.
 */
export const TELEGRAM_EVENT_CODES = [
  'subscription_expiring_soon',
  'subscription_expired',
  'balance_top_up_captured',
  'payment_success_activation_pending',
  'vip_active',
] as const;

export type TelegramEventCode = (typeof TELEGRAM_EVENT_CODES)[number];

export interface TelegramLink {
  enabled: boolean;
  bot_username: string;
  linked: boolean;
  telegram_username: string | null;
  linked_at: string | null;
  /**
   * Which events are on, as decided by the operator in Billing — not
   * something the customer chooses here. Optional and unused: this storefront
   * has no per-event control, so a Billing that omits the key (or changes its
   * shape) must not break the card.
   */
  events?: Record<string, boolean>;
}

export interface TelegramLinkToken {
  deep_link: string;
  token: string;
  expires_at: string;
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * The signed-in customer's Telegram link, or `null` when Billing has the
 * feature off.
 *
 * Also the only way this page learns that a deep link was followed: linking
 * completes in Telegram itself, so a caller polls this after sending the
 * customer to `deep_link`.
 */
export async function fetchTelegramLink(accessToken: string): Promise<TelegramLink | null> {
  const response = await fetch(`${BILLING_API_BASE}/api/v1/telegram/link`, {
    headers: authHeaders(accessToken),
  });
  // Feature off — see the module comment. Not distinguishable from a genuine
  // 404 by status alone, which is why it is handled before toApiError.
  if (response.status === 404) return null;
  if (!response.ok) {
    throw await toApiError(response, 'Could not load Telegram settings');
  }
  return (await response.json()) as TelegramLink;
}

/**
 * Opens a fresh link token to send the customer to Telegram with.
 *
 * `409 already_linked` propagates as an ordinary error rather than becoming
 * `null`: a caller asking for a new token while already linked is working
 * from a stale card, and swallowing that would send the customer to start a
 * link that Billing will refuse to finish.
 */
export async function createTelegramLinkToken(accessToken: string): Promise<TelegramLinkToken> {
  const response = await fetch(`${BILLING_API_BASE}/api/v1/telegram/link-token`, {
    method: 'POST',
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw await toApiError(response, 'Could not start linking Telegram');
  }
  return (await response.json()) as TelegramLinkToken;
}

export async function unlinkTelegram(accessToken: string): Promise<void> {
  const response = await fetch(`${BILLING_API_BASE}/api/v1/telegram/link`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw await toApiError(response, 'Could not disconnect Telegram');
  }
}

interface UseTelegramLinkResult {
  /** `null` when Billing has the feature off — never an error state. */
  data: TelegramLink | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Live Telegram link state for the signed-in customer, shaped like `useBalance`.
 *
 * With no token it resolves to `null` rather than erroring, for the same
 * reason as `useBalance`: "signed out" and "feature off" both mean "show
 * nothing" to every caller.
 */
export function useTelegramLink(): UseTelegramLinkResult {
  const { accessToken } = useAuth();
  const [data, setData] = useState<TelegramLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const refetch = useCallback(() => setReloadCount((count) => count + 1), []);

  useEffect(() => {
    if (!accessToken) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    fetchTelegramLink(accessToken)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (!active) return;
        // A real failure — the 404 never reaches here. Keep the card quiet
        // rather than showing stale settings next to an error.
        setData(null);
        setError(err instanceof Error ? err.message : 'telegram_failed');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, reloadCount]);

  return { data, isLoading, error, refetch };
}
