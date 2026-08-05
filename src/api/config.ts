// Billing install this storefront sells from. None of these are secrets — they
// identify a catalogue, not a caller, and the same values are visible in every
// request the browser makes.
export const BILLING_API_BASE = 'https://bl.hotvds.com';
export const TENANT_ID = 'vivi23';

// Dedicated project for the hotvds.com storefront, kept separate from the
// install's default project so this catalogue and its revenue stay distinct from
// anything else the same Billing instance sells.
export const PROJECT_CODE = 'hotvds';

// Storefront display currency. Billing stores explicit prices per currency; the
// payment step still depends on the Payment Orchestrator having a gateway for
// the selected currency.
export const SUPPORTED_CURRENCIES = ['USD', 'RUB'] as const;
export type BillingCurrency = (typeof SUPPORTED_CURRENCIES)[number];
export const DEFAULT_CURRENCY: BillingCurrency = 'USD';

export function normalizeCurrency(value: string | null | undefined): BillingCurrency {
  const upper = value?.toUpperCase();
  return SUPPORTED_CURRENCIES.includes(upper as BillingCurrency)
    ? (upper as BillingCurrency)
    : DEFAULT_CURRENCY;
}

export interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

/** Turns Billing's `{"error": {...}}` envelope into a throwable Error. */
export async function toApiError(response: Response, fallback: string): Promise<Error> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    // Non-JSON error (proxy timeout, HTML error page) — fall through.
  }
  const code = body?.error?.code;
  const message = body?.error?.message;
  return new Error(code ? `${code}: ${message ?? fallback}` : `${fallback} (HTTP ${response.status})`);
}
