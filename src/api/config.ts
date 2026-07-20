// Billing install this storefront sells from. None of these are secrets — they
// identify a catalogue, not a caller, and the same values are visible in every
// request the browser makes.
export const BILLING_API_BASE = 'https://bl.hotvds.com';
export const TENANT_ID = 'vivi23';

// Dedicated project for the hotvds.com storefront, kept separate from the
// install's default project so this catalogue and its revenue stay distinct from
// anything else the same Billing instance sells.
export const PROJECT_CODE = 'hotvds';

// The only currency with a configured payment gateway on this install. Billing
// itself is multi-currency (a package may carry several prices), so this is a
// storefront default rather than a limit — widen it once a gateway that settles
// another currency exists.
export const DEFAULT_CURRENCY = 'RUB';

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
