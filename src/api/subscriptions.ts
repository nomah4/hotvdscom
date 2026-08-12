import { useCallback, useEffect, useState } from 'react';
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
  /**
   * Скорость между двумя последними опросами гипервизора, бит/с.
   *
   * `null` — не ноль: ноль значит «трафика не было», а `null` — «сказать
   * нечего» (первый замер после создания или после перезагрузки, обнулившей
   * счётчик гостя).
   */
  rx_bps?: number | null;
  tx_bps?: number | null;
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

/**
 * What this plan costs per billing period.
 *
 * The only money on this endpoint, and deliberately narrow: a recurring price
 * is not a charge. When money actually moves the renewal preview prices it
 * again and is the authority — it may legitimately differ if the catalogue was
 * repriced between the page load and the click.
 *
 * Absent when Billing cannot price the plan (withdrawn from the catalogue) and
 * for subscriptions that are no longer live.
 */
export interface SubscriptionPrice {
  amount_minor: number;
  currency: string;
  billing_period: string;
}

/**
 * One row of GET /api/v1/subscriptions. Read-only, and almost money-free:
 * `price` is the recurring cost of the plan, which the dashboard needs to
 * answer "how much am I paying". No ledger, no invoices, no payments — Billing
 * keeps those off this endpoint.
 */
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
  price?: SubscriptionPrice | null;
  /**
   * Имя, которое клиент дал услуге. `null` — не давал.
   *
   * Необязательное в типе, потому что старый биллинг ключа не присылает вовсе,
   * и по его наличию витрина понимает, поддерживается ли переименование.
   */
  display_name?: string | null;
}

/**
 * Умеет ли этот биллинг переименование.
 *
 * Проверяется по сырому JSON до сужения к типу: `undefined` в поле
 * необязательного свойства неотличим от `null`, а разница здесь существенна —
 * `null` значит «имени нет», отсутствие ключа значит «эндпоинта нет».
 * Карандаш, включённый против отсутствующего эндпоинта, отвечал бы клиенту
 * ошибкой на каждое нажатие.
 */
function detectRenameSupport(rows: unknown): boolean {
  return (
    Array.isArray(rows) &&
    rows.length > 0 &&
    rows.every((row) => typeof row === 'object' && row !== null && 'display_name' in row)
  );
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
export interface SubscriptionsPage {
  rows: Subscription[];
  /** См. detectRenameSupport: отсутствие ключа — это «биллинг ещё не умеет». */
  canRename: boolean;
}

export async function fetchSubscriptions(accessToken: string): Promise<SubscriptionsPage> {
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
  return { rows: data.subscriptions, canRename: detectRenameSupport(data.subscriptions) };
}

/**
 * Переименовать услугу.
 *
 * `POST`, а не `PUT`: биллинг отдаёт `GET, POST, OPTIONS`, и preflight на `PUT`
 * умер бы в браузере сетевой ошибкой без тела.
 *
 * Возвращает **сохранённое** имя, а не отправленное: обрезка и нормализация
 * происходят на сервере, и показать надо то, что там теперь лежит.
 */
export async function renameSubscription(
  accessToken: string,
  subscriptionId: string,
  displayName: string,
): Promise<string | null> {
  const response = await fetch(
    `${BILLING_API_BASE}/api/v1/subscriptions/${subscriptionId}/display-name`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: TENANT_ID, project_code: PROJECT_CODE, display_name: displayName }),
    },
  );
  if (!response.ok) {
    throw await toApiError(response, 'Could not rename the server');
  }
  const data = (await response.json()) as { display_name: string | null };
  return data.display_name;
}

/**
 * What the customer can do to their own machine.
 *
 * Billing settles who owns the subscription and relays the rest through
 * Provisioning to the engine, so the browser never addresses a machine
 * directly — it names a subscription and asks for an action.
 */
export type ServerAction = 'power' | 'reboot' | 'delete' | 'restore';

/** Root's password, held encrypted by the engine and handed to its owner. */
export interface ServerCredentials {
  username?: string | null;
  password?: string | null;
  ipv4?: string | null;
}

async function postServerAction<T>(
  accessToken: string,
  subscriptionId: string,
  path: string,
  body: Record<string, unknown>,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(
    `${BILLING_API_BASE}/api/v1/subscriptions/${subscriptionId}/server/${path}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw await toApiError(response, fallbackMessage);
  }
  return (await response.json()) as T;
}

/**
 * Turn the machine on or off.
 *
 * This records a wish, not a switch: the engine keeps what the customer wants
 * separate from what the service allows, and a suspended service stays down
 * whatever the wish says.
 */
export function setServerPower(
  accessToken: string,
  subscriptionId: string,
  powerIntent: 'on' | 'off',
): Promise<SubscriptionServer> {
  return postServerAction(
    accessToken,
    subscriptionId,
    'power',
    { power_intent: powerIntent },
    'Could not change the power state',
  );
}

export function rebootServer(accessToken: string, subscriptionId: string): Promise<SubscriptionServer> {
  return postServerAction(accessToken, subscriptionId, 'reboot', {}, 'Could not reboot the server');
}

/**
 * Mark the machine for deletion — an operator still has to confirm it.
 *
 * Nothing is destroyed by this call and nothing is destroyed on a timer: the
 * machine stops and leaves the list, and the disk waits for a human. That is
 * what makes the undo below meaningful.
 */
export function deleteServer(accessToken: string, subscriptionId: string): Promise<SubscriptionServer> {
  return postServerAction(accessToken, subscriptionId, 'delete', {}, 'Could not delete the server');
}

/** The customer changed their mind, which is what the delay is for. */
export function restoreServer(accessToken: string, subscriptionId: string): Promise<SubscriptionServer> {
  return postServerAction(accessToken, subscriptionId, 'restore', {}, 'Could not restore the server');
}

/** Разовая ссылка на консоль и момент, после которого она мертва. */
export interface ConsoleLink {
  url: string;
  expires_at: string;
}

/**
 * Попросить разовую ссылку на консоль машины.
 *
 * Ссылка живёт около минуты и открывается один раз, поэтому запрашивается в
 * момент нажатия, а не заранее вместе со списком: выданная впрок, она к нажатию
 * уже недействительна.
 */
export function requestServerConsole(
  accessToken: string,
  subscriptionId: string,
): Promise<ConsoleLink> {
  return postServerAction(
    accessToken,
    subscriptionId,
    'console',
    {},
    'Could not open the console',
  );
}

/**
 * Дописать к ссылке язык, на котором человек читает кабинет.
 *
 * Консоль живёт на своём домене и о нашем выборе языка ничего не знает; сама
 * она догадывается по `Accept-Language`, а это язык системы, а не тот, что
 * человек выбрал у нас. Выбранный точнее — поэтому передаём.
 */
export function withLanguage(url: string, lang: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('lang', lang);
    return parsed.toString();
  } catch {
    // Ссылку строит движок; если она однажды окажется не ссылкой, лучше отдать
    // её как есть и дать браузеру сказать своё, чем упасть на кнопке.
    return url;
  }
}

/**
 * Reveal the machine's password.
 *
 * A 404 is an ordinary answer, not a fault: machines adopted from the
 * hypervisor were built by hand and the engine never held their password. The
 * caller has to say so rather than showing an error.
 */
export function fetchServerCredentials(
  accessToken: string,
  subscriptionId: string,
): Promise<ServerCredentials> {
  return postServerAction(
    accessToken,
    subscriptionId,
    'credentials',
    {},
    'Could not read the credentials',
  );
}

interface UseSubscriptionsResult {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
  /** Показывать ли карандаш. Пока биллинг не отдаёт ключ — не показывать. */
  canRename: boolean;
  /** Re-read the list — used after an action changes a machine's state. */
  refetch: () => void;
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
  const [canRename, setCanRename] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumped by refetch. A machine's state changes as a result of a button, and
  // the card that owns the button cannot re-read the list on its own.
  const [reloadCount, setReloadCount] = useState(0);
  const refetch = useCallback(() => setReloadCount((count) => count + 1), []);

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
      .then((page) => {
        if (!active) return;
        setSubscriptions(page.rows);
        setCanRename(page.canRename);
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
  }, [accessToken, reloadCount]);

  return { subscriptions, isLoading, error, canRename, refetch };
}
