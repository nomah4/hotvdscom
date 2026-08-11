import { useCallback, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  deleteServer,
  fetchServerCredentials,
  rebootServer,
  restoreServer,
  setServerPower,
  type ServerCredentials,
} from './subscriptions';

/**
 * Which control is mid-flight, so the card can disable the row rather than let
 * a customer queue three reboots while the first is still travelling.
 */
export type PendingControl = 'power' | 'reboot' | 'delete' | 'restore' | 'credentials';

export interface UseServerControlsResult {
  pending: PendingControl | null;
  /** Machine-readable failure code from Billing, or a local one. */
  error: string | null;
  credentials: ServerCredentials | null;
  /** The engine holds no password for this machine — an answer, not a failure. */
  credentialsMissing: boolean;
  setPower: (powerIntent: 'on' | 'off') => Promise<void>;
  reboot: () => Promise<void>;
  remove: () => Promise<void>;
  restore: () => Promise<void>;
  revealCredentials: () => Promise<void>;
  hideCredentials: () => void;
  clearError: () => void;
}

/**
 * The five buttons on one server's card.
 *
 * State is per card rather than per page: with several servers listed, a shared
 * "something failed" cannot say which one it belongs to, and a shared spinner
 * would freeze every row over one slow request.
 *
 * `onChanged` re-reads the subscription list. Every action changes what the
 * card should be showing — power state, or whether the machine is now marked
 * for deletion — and the card cannot re-read the list on its own.
 */
export function useServerControls(
  subscriptionId: string,
  onChanged?: () => void,
): UseServerControlsResult {
  const { accessToken } = useAuth();
  const [pending, setPending] = useState<PendingControl | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<ServerCredentials | null>(null);
  const [credentialsMissing, setCredentialsMissing] = useState(false);

  const run = useCallback(
    async (control: PendingControl, call: (token: string) => Promise<unknown>) => {
      if (!accessToken) {
        setError('not_signed_in');
        return;
      }
      setPending(control);
      setError(null);
      try {
        await call(accessToken);
        onChanged?.();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'server_action_failed');
      } finally {
        setPending(null);
      }
    },
    [accessToken, onChanged],
  );

  const setPower = useCallback(
    (powerIntent: 'on' | 'off') =>
      run('power', (token) => setServerPower(token, subscriptionId, powerIntent)),
    [run, subscriptionId],
  );

  const reboot = useCallback(
    () => run('reboot', (token) => rebootServer(token, subscriptionId)),
    [run, subscriptionId],
  );

  const remove = useCallback(
    () => run('delete', (token) => deleteServer(token, subscriptionId)),
    [run, subscriptionId],
  );

  const restore = useCallback(
    () => run('restore', (token) => restoreServer(token, subscriptionId)),
    [run, subscriptionId],
  );

  /**
   * Reveal the password, treating "there isn't one" as a normal outcome.
   *
   * Machines adopted from the hypervisor were built by hand and the engine
   * never held their password. Showing an error for that would tell the
   * customer something is broken when nothing is.
   */
  const revealCredentials = useCallback(async () => {
    if (!accessToken) {
      setError('not_signed_in');
      return;
    }
    setPending('credentials');
    setError(null);
    setCredentialsMissing(false);
    try {
      const secret = await fetchServerCredentials(accessToken, subscriptionId);
      setCredentials(secret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.startsWith('no_credentials')) {
        setCredentialsMissing(true);
      } else {
        setError(message || 'credentials_failed');
      }
    } finally {
      setPending(null);
    }
  }, [accessToken, subscriptionId]);

  const hideCredentials = useCallback(() => {
    setCredentials(null);
    setCredentialsMissing(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    pending,
    error,
    credentials,
    credentialsMissing,
    setPower,
    reboot,
    remove,
    restore,
    revealCredentials,
    hideCredentials,
    clearError,
  };
}
