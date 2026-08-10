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

export interface SubscriptionConfiguration {
  cpu?: number;
  ram_gb?: number;
  ssd_gb?: number;
  os?: string;
  datacenter?: string;
}

/**
 * The machine behind a subscription, as the provisioning engine knows it.
 *
 * Optional because Billing does not send it yet: the engine exposes
 * `GET /api/v1/servers/{source_subscription_id}` and Billing has to proxy it
 * into this response. Until it does, every field here is absent and the
 * dashboard keeps showing a dash — which is the honest answer, not a bug.
 *
 * Contract on the engine's side: provisioning-engine/docs/billing-integration.md
 */
/** What the hypervisor reports about the machine right now. */
export type MachineStatus = 'running' | 'stopped' | 'paused' | 'rebooting' | 'unknown';

export interface SubscriptionMachine {
  status?: MachineStatus | null;
  /** Share of one core, 0..1 — not a percentage. */
  cpu_load?: number | null;
  mem_bytes?: number | null;
  /** The address the machine reports about itself via the guest agent. */
  agent_ipv4?: string | null;
  observed_at?: string | null;
}

export interface SubscriptionServer {
  /** The white IPv4 the customer connects to. */
  public_ip?: string | null;
  /** Engine-side service state: pending | provisioning | active | suspended | failed | deleted. */
  state?: string | null;
  /** What the customer asked for: `on` or `off`. Not the same as the state above. */
  power_intent?: string | null;
  /** Derived from state and intent — what *should* be true, not what is. */
  running?: boolean | null;
  /**
   * What the hypervisor actually reports. Deliberately separate from `running`
   * and from the subscription's own status: the service can be active, the
   * customer can want the machine on, and the machine can still be down. That
   * case is exactly why this exists, and collapsing the three into one status
   * would hide it.
   */
  machine?: SubscriptionMachine | null;
  hostname?: string | null;
}

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
  configuration?: SubscriptionConfiguration | null;
  server?: SubscriptionServer | null;
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
