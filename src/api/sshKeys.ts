import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { BILLING_API_BASE, PROJECT_CODE, TENANT_ID, toApiError } from './config';

/**
 * The customer's SSH public keys, kept in their Billing profile (ADR-0010).
 *
 * Every new server of this customer gets all of them through cloud-init. Keys
 * reach a machine only when it is created: adding one here does not put it on
 * servers that already exist, and removing one does not take it off them —
 * the card says so, because it is the first thing anyone would assume.
 */

export interface SshKey {
  id: string;
  name: string;
  key_type: string;
  fingerprint: string;
  public_key: string;
  created_at: string;
}

export interface SshKeyList {
  keys: SshKey[];
  max_keys: number;
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Scoped to this storefront's tenant and project, for the reason telegram.ts
 * gives: Billing's installation defaults are not this project on production,
 * and a key stored there would never reach this storefront's orders.
 */
function sshKeysUrl(path = ''): string {
  const url = new URL(`${BILLING_API_BASE}/api/v1/ssh-keys${path}`);
  url.searchParams.set('tenant_id', TENANT_ID);
  url.searchParams.set('project_code', PROJECT_CODE);
  return url.toString();
}

export async function fetchSshKeys(accessToken: string): Promise<SshKeyList> {
  const response = await fetch(sshKeysUrl(), { headers: authHeaders(accessToken) });
  if (!response.ok) {
    throw await toApiError(response, 'Could not load SSH keys');
  }
  return (await response.json()) as SshKeyList;
}

/**
 * Billing validates the key and answers with a code the card turns into a
 * sentence: `ssh_key_is_private`, `ssh_key_invalid`, `ssh_key_too_weak`,
 * `ssh_key_exists`, `ssh_key_limit`.
 */
export async function addSshKey(accessToken: string, name: string, publicKey: string): Promise<SshKey> {
  const response = await fetch(sshKeysUrl(), {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ name, public_key: publicKey }),
  });
  if (!response.ok) {
    throw await toApiError(response, 'Could not add the SSH key');
  }
  return (await response.json()) as SshKey;
}

export async function deleteSshKey(accessToken: string, id: string): Promise<void> {
  const response = await fetch(sshKeysUrl(`/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw await toApiError(response, 'Could not delete the SSH key');
  }
}

interface UseSshKeysResult {
  data: SshKeyList | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Shaped like `useTelegramLink`: signed out resolves to `null`, not an error. */
export function useSshKeys(): UseSshKeysResult {
  const { accessToken } = useAuth();
  const [data, setData] = useState<SshKeyList | null>(null);
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

    fetchSshKeys(accessToken)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setData(null);
        setError(err instanceof Error ? err.message : 'ssh_keys_failed');
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
