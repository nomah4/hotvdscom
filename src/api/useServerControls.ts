import { useCallback, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLang } from '../i18n/LanguageContext';
import {
  changeServerIp,
  deleteServer,
  fetchServerCredentials,
  rebootServer,
  requestServerConsole,
  restoreServer,
  setServerPower,
  withLanguage,
  type IpChangeResult,
  type ServerCredentials,
} from './subscriptions';

/**
 * Which control is mid-flight, so the card can disable the row rather than let
 * a customer queue three reboots while the first is still travelling.
 */
export type PendingControl =
  | 'power'
  | 'reboot'
  | 'delete'
  | 'restore'
  | 'credentials'
  | 'console'
  | 'ip';

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
  openConsole: () => Promise<void>;
  /**
   * Сменить адрес на подтверждённый клиентом.
   *
   * Возвращает ответ движка, а не `void`, в отличие от остальных действий: окну
   * подтверждения нужно знать, перезагрузилась ли машина, — от этого зависит,
   * что клиенту делать дальше. `null` — не вышло, причина в `error`.
   */
  changeIp: (address: string) => Promise<IpChangeResult | null>;
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
  const { lang } = useLang();
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
   * Открыть консоль в новой вкладке.
   *
   * Вкладка открывается **до** запроса, пустой, и потом ей подставляется адрес.
   * После `await` браузер уже не считает открытие следствием нажатия и гасит
   * его как всплывающее окно — а ссылка одноразовая, второй раз по ней не
   * зайти.
   *
   * Связь с открывшей вкладкой разрывается вручную, а не флагом `noopener`:
   * с ним `window.open` по спецификации возвращает `null`, и ссылку на вкладку
   * подставить уже некуда — выглядит это ровно как заблокированное окно.
   * `opener = null` на пустой вкладке делает то же самое и оставляет ссылку.
   */
  const openConsole = useCallback(async () => {
    if (!accessToken) {
      setError('not_signed_in');
      return;
    }
    const tab = window.open('about:blank', '_blank');
    if (tab) {
      tab.opener = null;
    }
    setPending('console');
    setError(null);
    try {
      const link = await requestServerConsole(accessToken, subscriptionId);
      // Язык — тот, на котором человек читает кабинет. Консоль на своём домене
      // догадалась бы по системному, а он бывает другим.
      const target = withLanguage(link.url, lang);
      if (!target) {
        // Ссылка не https или не разобралась — вкладку никуда не отправляем.
        tab?.close();
        setError('console_failed');
      } else if (tab) {
        tab.location.href = target;
      } else {
        // Всплывающие окна запрещены. Ссылка одноразовая и живёт минуту, так
        // что показать её текстом бессмысленно — честнее сказать, что мешает.
        setError('popup_blocked');
      }
    } catch (err: unknown) {
      tab?.close();
      setError(err instanceof Error ? err.message : 'console_failed');
    } finally {
      setPending(null);
    }
  }, [accessToken, lang, subscriptionId]);

  const changeIp = useCallback(
    async (address: string): Promise<IpChangeResult | null> => {
      if (!accessToken) {
        setError('not_signed_in');
        return null;
      }
      setPending('ip');
      setError(null);
      try {
        const result = await changeServerIp(accessToken, subscriptionId, address);
        // Список перечитывается сразу: на карточке стоит старый адрес, и он
        // теперь ведёт в никуда.
        onChanged?.();
        return result;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'ip_change_failed');
        return null;
      } finally {
        setPending(null);
      }
    },
    [accessToken, onChanged, subscriptionId],
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
    openConsole,
    changeIp,
    revealCredentials,
    hideCredentials,
    clearError,
  };
}
