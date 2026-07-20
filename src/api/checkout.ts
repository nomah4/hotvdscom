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
  currency = DEFAULT_CURRENCY,
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
