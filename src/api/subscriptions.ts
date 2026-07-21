import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { BILLING_API_BASE, PROJECT_CODE, TENANT_ID, toApiError } from './config';

// Mirrors Subscription.Status in the Billing model
// (services/billing/app/billing_core/models.py).
export type SubscriptionStatus =
  | 'pending_activation'
  | 'active'
  | 'past_due'
  | 'expired'
  | 'cancelled'
  | 'revoked';

// Mirrors Subscription.ProvisioningStatus. Until the VDS provisioning adapter
// exists (Phase 4), every real subscription sits at `pending` — the server is
// paid for but nothing downstream has built it yet.
export type ProvisioningStatus = 'pending' | 'delayed' | 'succeeded' | 'failed';

/** One row of GET /api/v1/subscriptions. Read-only: no money or ledger data —
 * Billing deliberately keeps those off this endpoint. */
export interface Subscription {
  subscription_id: string;
  status: SubscriptionStatus;
  /** Catalogue code, e.g. `VDS_PRO_MONTHLY`. Nullable if the package was removed. */
  package_code: string | null;
  scope_type: string | null;
  valid_from: string | null;
  valid_until: string | null;
  provisioning_status: ProvisioningStatus;
  auto_renew: boolean;
}

interface SubscriptionsResponse {
  tenant_id: string;
  project_code: string;
  external_user_id: string;
  subscriptions: Subscription[];
}

/**
 * A signed-in user's subscriptions for this storefront's project.
 *
 * `external_user_id` is deliberately not sent: under Bearer auth Billing derives
 * the identity from the token subject and rejects a mismatching value, so the
 * browser can only ever read its own subscriptions — the id is not worth
 * guessing.
 */
export async function fetchSubscriptions(accessToken: string): Promise<Subscription[]> {
  const url = new URL(`${BILLING_API_BASE}/api/v1/subscriptions`);
  url.searchParams.set('tenant_id', TENANT_ID);
  url.searchParams.set('project_code', PROJECT_CODE);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw await toApiError(response, 'Could not load your subscriptions');
  }
  const data = (await response.json()) as SubscriptionsResponse;
  return data.subscriptions;
}

interface UseSubscriptionsResult {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Live subscription list for the signed-in user. Re-fetches when the access
 * token changes (sign-in / token refresh). With no token it resolves to an empty
 * list rather than erroring — the dashboard only mounts behind RequireAuth, but
 * this keeps the hook safe to call before the session settles.
 */
export function useSubscriptions(): UseSubscriptionsResult {
  const { accessToken } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setSubscriptions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    fetchSubscriptions(accessToken)
      .then((rows) => {
        if (active) setSubscriptions(rows);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  return { subscriptions, isLoading, error };
}
