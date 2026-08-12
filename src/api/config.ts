// Billing install this storefront sells from. None of these are secrets — they
// identify a catalogue, not a caller, and the same values are visible in every
// request the browser makes.
export const BILLING_API_BASE = 'https://bl.hotvds.com';
export const TENANT_ID = 'vivi23';

// Dedicated project for the hotvds.com storefront, kept separate from the
// install's default project so this catalogue and its revenue stay distinct from
// anything else the same Billing instance sells.
export const PROJECT_CODE = 'hotvds';

// Billing may store prices for more currencies than this storefront can charge
// today. Keep USD in the catalogue for the future USD gateway, but only expose
// currencies that have a working payment path.
export const SUPPORTED_CURRENCIES = ['USD', 'RUB'] as const;
export type BillingCurrency = (typeof SUPPORTED_CURRENCIES)[number];
export const STOREFRONT_CURRENCIES = ['RUB'] as const satisfies readonly BillingCurrency[];
export const DEFAULT_CURRENCY: BillingCurrency = 'RUB';

export function normalizeCurrency(
  value: string | null | undefined,
  allowedCurrencies: readonly BillingCurrency[] = STOREFRONT_CURRENCIES,
): BillingCurrency {
  const upper = value?.toUpperCase();
  return allowedCurrencies.includes(upper as BillingCurrency)
    ? (upper as BillingCurrency)
    : DEFAULT_CURRENCY;
}

export interface ApiErrorBody {
  /**
   * Биллинг присылает конверт, движок — голую строку кода.
   *
   * Ошибки машины биллинг ретранслирует как есть, не переписывая под свой
   * словарь, так что обе формы приходят на один и тот же вызов.
   */
  error?: { code?: string; message?: string } | string;
}

/** Turns Billing's `{"error": {...}}` envelope into a throwable Error. */
export async function toApiError(response: Response, fallback: string): Promise<Error> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    // Non-JSON error (proxy timeout, HTML error page) — fall through.
  }
  const envelope = typeof body?.error === 'string' ? { code: body.error } : body?.error;
  const code = envelope?.code;
  const message = typeof envelope === 'object' ? envelope.message : undefined;
  return new Error(code ? `${code}: ${message ?? fallback}` : `${fallback} (HTTP ${response.status})`);
}
