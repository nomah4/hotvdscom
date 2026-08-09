import { BILLING_API_BASE, DEFAULT_CURRENCY, PROJECT_CODE, TENANT_ID, toApiError } from './config';

export interface PaymentMethod {
  method_code: string;
  display_name: string;
  currency: string;
}

export interface Invoice {
  invoice_id: string;
  status: 'draft' | 'pending_payment' | 'paid' | 'expired' | 'cancelled' | 'voided';
  amount_minor: number;
  currency: string;
  expires_at: string;
  payment_status: string | null;
  payment_url: string | null;
  method_code: string | null;
  subscription_id: string | null;
}

export interface CustomVdsConfiguration {
  cpu: number;
  ram_gb: number;
  ssd_gb: number;
  os: string;
  datacenter: string;
}

export interface Quote {
  quote_id: string;
  status: 'active' | 'consumed' | 'expired' | 'voided';
  package_code: string;
  amount_minor: number;
  currency: string;
  configuration: CustomVdsConfiguration;
  expires_at: string;
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Payment methods Billing (via the Payment Orchestrator) will accept for this
 * amount and currency. Queried rather than hardcoded: which gateway is live is
 * operator configuration, and it changes without the storefront being rebuilt.
 */
export async function fetchPaymentMethods(
  accessToken: string,
  amountMinor: number,
  currency: string = DEFAULT_CURRENCY,
): Promise<PaymentMethod[]> {
  const url = new URL(`${BILLING_API_BASE}/api/v1/payment-methods`);
  url.searchParams.set('tenant_id', TENANT_ID);
  url.searchParams.set('amount_minor', String(amountMinor));
  url.searchParams.set('currency', currency);

  const response = await fetch(url.toString(), { headers: authHeaders(accessToken) });
  if (!response.ok) {
    throw await toApiError(response, 'Could not load payment methods');
  }
  const data = (await response.json()) as { methods: PaymentMethod[] };
  return data.methods;
}

export async function createQuote(input: {
  packageCode: string;
  configuration: CustomVdsConfiguration;
  currency?: string;
}): Promise<Quote> {
  const response = await fetch(`${BILLING_API_BASE}/api/v1/public/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenant_id: TENANT_ID,
      project_code: PROJECT_CODE,
      package_code: input.packageCode,
      currency: input.currency ?? DEFAULT_CURRENCY,
      configuration: input.configuration,
    }),
  });

  if (!response.ok) {
    throw await toApiError(response, 'Could not calculate this configuration');
  }
  return (await response.json()) as Quote;
}

export interface CreateInvoiceInput {
  accessToken: string;
  packageCode: string;
  methodCode: string;
  returnUrl: string;
  /** Required by gateways that issue a fiscal receipt (YooKassa, 54-ФЗ). Taken
   * from the signed-in user's profile — contact detail only; Billing derives the
   * actual identity from the token, never from the body. */
  customerEmail: string;
  currency?: string;
  /** Pass a stable value to retry a failed attempt without risking a second
   * charge; omit to start a genuinely new purchase. */
  idempotencyKey?: string;
}

/**
 * Opens a purchase: Billing prices the package server-side, registers a payment
 * with the gateway and hands back a `payment_url` to send the customer to.
 *
 * The amount is never supplied by this caller — Billing reads it from the
 * catalogue — so nothing the browser can edit changes what gets charged.
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const response = await fetch(`${BILLING_API_BASE}/api/v1/invoices`, {
    method: 'POST',
    headers: {
      ...authHeaders(input.accessToken),
      // Billing rejects the request without this and replays the original
      // response for a repeated key, which is what stops a double-submit or a
      // retry after a dropped connection from creating a second invoice.
      'X-Idempotency-Key': input.idempotencyKey ?? crypto.randomUUID(),
    },
    body: JSON.stringify({
      tenant_id: TENANT_ID,
      project_code: PROJECT_CODE,
      package_code: input.packageCode,
      currency: input.currency ?? DEFAULT_CURRENCY,
      method_code: input.methodCode,
      return_url: input.returnUrl,
      customer_email: input.customerEmail,
      // external_user_id is deliberately omitted: under Bearer auth Billing takes
      // the identity from the token subject, and sending a value that disagrees
      // is rejected outright.
    }),
  });

  if (!response.ok) {
    throw await toApiError(response, 'Could not start the purchase');
  }
  return (await response.json()) as Invoice;
}

export interface CreateInvoiceFromQuoteInput {
  accessToken: string;
  quoteId: string;
  methodCode: string;
  returnUrl: string;
  customerEmail: string;
  idempotencyKey?: string;
}

export async function createInvoiceFromQuote(input: CreateInvoiceFromQuoteInput): Promise<Invoice> {
  const response = await fetch(`${BILLING_API_BASE}/api/v1/invoices/from-quote`, {
    method: 'POST',
    headers: {
      ...authHeaders(input.accessToken),
      'X-Idempotency-Key': input.idempotencyKey ?? crypto.randomUUID(),
    },
    body: JSON.stringify({
      tenant_id: TENANT_ID,
      project_code: PROJECT_CODE,
      quote_id: input.quoteId,
      method_code: input.methodCode,
      return_url: input.returnUrl,
      customer_email: input.customerEmail,
    }),
  });

  if (!response.ok) {
    throw await toApiError(response, 'Could not start the purchase');
  }
  return (await response.json()) as Invoice;
}

export interface Renewal {
  renewal_id: string;
  invoice_id: string | null;
  status: string;
  amount_minor: number | null;
  currency: string | null;
  expires_at: string | null;
  payment_url: string | null;
}

export interface RenewalPreview {
  subscription_id: string;
  package_code: string;
  pricing_model: 'fixed_price' | 'configurable';
  amount_minor: number;
  currency: string;
  billing_period: string;
  valid_until: string | null;
  renewable: boolean;
  status: string;
  breakdown: unknown[] | null;
}

/**
 * What renewing this server would cost, read from Billing without creating
 * anything.
 *
 * Needed because the price is not knowable client-side: `GET /subscriptions`
 * returns no money data by design, and a Custom VDS has no catalogue price at
 * all — its amount comes from a pricing rule applied to the configuration the
 * customer actually bought. Also supplies the figure the payment-method lookup
 * needs, which is amount-scoped.
 */
export async function fetchRenewalPreview(
  accessToken: string,
  subscriptionId: string,
  currency: string = DEFAULT_CURRENCY,
): Promise<RenewalPreview> {
  const url = new URL(
    `${BILLING_API_BASE}/api/v1/subscriptions/${subscriptionId}/renewal-preview`,
  );
  url.searchParams.set('currency', currency);

  const response = await fetch(url.toString(), { headers: authHeaders(accessToken) });
  if (!response.ok) {
    throw await toApiError(response, 'Could not price this renewal');
  }
  return (await response.json()) as RenewalPreview;
}

export interface CreateRenewalInput {
  accessToken: string;
  subscriptionId: string;
  methodCode: string;
  returnUrl: string;
  /** Where the gateway sends the fiscal receipt. Required in practice on a
   * fiscalized install: PO refuses a payment carrying neither email nor phone
   * (54-FZ), and Billing surfaces that refusal as a 502 — which is exactly why
   * every renewal failed between 2026-08-07 and 2026-08-09. */
  customerEmail: string;
  currency?: string;
  idempotencyKey?: string;
}

/**
 * Extends ONE existing subscription — the renewal path, not a fresh purchase.
 *
 * Why this and not `createInvoice(package_code)`: under the `separate` purchase
 * policy a plain package purchase always creates a NEW subscription (a new
 * server), because `resolve_capture_target_subscription` only extends an
 * existing row when the invoice is tied to a `SubscriptionRenewal`. This
 * endpoint creates that link, so paying it adds time to this exact server
 * instead of handing the customer another one.
 *
 * Billing prices it from the subscription's own package and refuses a
 * subscription the token's subject does not own (422 `user_mismatch`), so
 * neither the amount nor the target is the browser's to choose. A subscription
 * that is not `active` is refused too (422 `subscription_not_renewable`) — an
 * expired one has to be bought again rather than renewed.
 *
 * One invoice covers one subscription by design: Billing's capture path reads
 * exactly one invoice line (`invoice.lines...get()`), so renewing several
 * servers means several renewals, not one combined bill.
 */
export async function createRenewal(input: CreateRenewalInput): Promise<Renewal> {
  const response = await fetch(
    `${BILLING_API_BASE}/api/v1/subscriptions/${input.subscriptionId}/renewals`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(input.accessToken),
        // Required — Billing 400s without it. A stable value makes a
        // double-click replay the same renewal instead of opening a second one,
        // and Billing additionally returns the existing unpaid renewal for this
        // subscription rather than creating a duplicate.
        'X-Idempotency-Key': input.idempotencyKey ?? crypto.randomUUID(),
      },
      body: JSON.stringify({
        tenant_id: TENANT_ID,
        project_code: PROJECT_CODE,
        currency: input.currency ?? DEFAULT_CURRENCY,
        method_code: input.methodCode,
        return_url: input.returnUrl,
        customer_email: input.customerEmail,
        // external_user_id omitted on purpose: under Bearer auth Billing takes
        // the identity from the token subject and rejects a disagreeing value.
        // customer_email is different in kind — contact detail for the receipt,
        // never identity, so the customer may change it without it affecting
        // whose subscription is being renewed.
      }),
    },
  );

  if (!response.ok) {
    throw await toApiError(response, 'Could not start the renewal');
  }
  return (await response.json()) as Renewal;
}

/** Reads back one invoice. Billing scopes this to the token's own invoices and
 * answers 404 for anyone else's, so an id is not worth guessing. */
export async function fetchInvoice(accessToken: string, invoiceId: string): Promise<Invoice> {
  const response = await fetch(`${BILLING_API_BASE}/api/v1/invoices/${invoiceId}`, {
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw await toApiError(response, 'Could not load the invoice');
  }
  return (await response.json()) as Invoice;
}
