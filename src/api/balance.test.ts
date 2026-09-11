import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  clearTopUpIdempotencyKey,
  createTopUp,
  fetchBalance,
  fetchTopUp,
  parseMajorAmount,
  planBulkPayment,
  topUpIdempotencyKey,
} = await import('./balance');

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function requestInit(callIndex = 0): RequestInit {
  return vi.mocked(globalThis.fetch).mock.calls[callIndex][1] ?? {};
}

describe('fetchBalance', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * The one behaviour the whole feature rests on. Billing answers 404 to every
   * balance route until an operator switches the feature on, so a storefront
   * that treated 404 as an error would show "could not load your balance" to
   * every customer on an install that simply does not have balances — which
   * reads as "your money is missing".
   */
  it('reads a 404 as "feature off" and resolves to null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'not_found' } }, 404)),
    );

    await expect(fetchBalance('token')).resolves.toBeNull();
  });

  it('returns the balance when Billing has the feature on', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ amount_minor: 125000, currency: 'RUB', min_top_up_minor: 10000 }),
      ),
    );

    const balance = await fetchBalance('token');

    expect(balance?.amount_minor).toBe(125000);
    // Identity comes from the Bearer token; sending external_user_id is refused.
    const url = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(url).toContain('tenant_id=vivi23');
    expect(url).toContain('project_code=hotvds');
    expect(url).not.toContain('external_user_id');
  });

  /** A genuine failure must stay a failure — only 404 is special. */
  it('still throws on any other error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'boom' } }, 500)));

    await expect(fetchBalance('token')).rejects.toThrow(/boom/);
  });
});

describe('createTopUp', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ top_up_id: 'top_1', status: 'pending', payment_url: 'https://pay.local/1' }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Billing 400s without the header, and it is the only thing standing between
   * a double-click and two charges. */
  it('sends the idempotency key as a header', async () => {
    await createTopUp({
      accessToken: 'token',
      amountMinor: 100000,
      methodCode: 'card',
      returnUrl: 'https://hotvds.com/ru/dashboard/balance/return',
      idempotencyKey: 'key-1',
    });

    expect(new Headers(requestInit().headers).get('X-Idempotency-Key')).toBe('key-1');
  });

  it('sends the amount, the method, the return url and the intent in tick order', async () => {
    await createTopUp({
      accessToken: 'token',
      amountMinor: 250000,
      methodCode: 'card',
      returnUrl: 'https://hotvds.com/ru/dashboard/balance/return',
      intent: ['sub-b', 'sub-a'],
      idempotencyKey: 'key-2',
    });

    expect(JSON.parse(String(requestInit().body))).toEqual({
      tenant_id: 'vivi23',
      project_code: 'hotvds',
      amount_minor: 250000,
      currency: 'RUB',
      method_code: 'card',
      return_url: 'https://hotvds.com/ru/dashboard/balance/return',
      // Billing renews along this list in order, so it must survive the trip
      // exactly as the customer ticked it — not sorted, not deduplicated.
      intent: ['sub-b', 'sub-a'],
    });
  });

  it('always sends an intent list, empty when there is nothing to renew', async () => {
    await createTopUp({
      accessToken: 'token',
      amountMinor: 50000,
      methodCode: 'card',
      returnUrl: 'https://hotvds.com/ru/dashboard/balance/return',
    });

    expect(JSON.parse(String(requestInit().body)).intent).toEqual([]);
  });
});

describe('fetchTopUp', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * Deliberately NOT the same as `fetchBalance`: on this route a 404 means "no
   * such top-up, or not yours", and a return page that quietly rendered nothing
   * would leave the customer unsure whether their money arrived.
   */
  it('propagates a 404 instead of swallowing it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'not_found' } }, 404)),
    );

    await expect(fetchTopUp('token', 'top_1')).rejects.toThrow(/not_found/);
  });

  it('returns the top-up with its intent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ top_up_id: 'top_1', status: 'captured', intent: ['sub-a'] }),
      ),
    );

    await expect(fetchTopUp('token', 'top_1')).resolves.toMatchObject({
      status: 'captured',
      intent: ['sub-a'],
    });
  });
});

describe('topUpIdempotencyKey', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('reuses one key while the attempt is unchanged', () => {
    expect(topUpIdempotencyKey('100000:RUB:')).toBe(topUpIdempotencyKey('100000:RUB:'));
  });

  /** Changing the amount is a different attempt. Replaying the first response
   * would top the customer up by the old figure. */
  it('mints a fresh key when the amount changes', () => {
    const first = topUpIdempotencyKey('100000:RUB:');

    expect(topUpIdempotencyKey('300000:RUB:')).not.toBe(first);
  });

  it('does not share storage with the checkout keys', () => {
    topUpIdempotencyKey('100000:RUB:');

    expect(sessionStorage.getItem('hotvds.topUpKey')).not.toBeNull();
    expect(sessionStorage.getItem('hotvds.checkoutKey.VDS_PRO_MONTHLY:RUB')).toBeNull();
  });

  it('retires the key once Billing has accepted the top-up', () => {
    topUpIdempotencyKey('100000:RUB:');

    clearTopUpIdempotencyKey();

    expect(sessionStorage.getItem('hotvds.topUpKey')).toBeNull();
  });
});

describe('parseMajorAmount', () => {
  it('reads a plain and a comma-separated amount', () => {
    expect(parseMajorAmount('1500')).toBe(150000);
    // A Russian-language page labels the field in rubles; a comma is not a typo.
    expect(parseMajorAmount('1500,50')).toBe(150050);
    expect(parseMajorAmount('1 500.50')).toBe(150050);
  });

  it('avoids the float trap that turns 10.07 into 1006 minor units', () => {
    expect(parseMajorAmount('10.07')).toBe(1007);
  });

  /** Rejected rather than rounded: rounding would charge a figure the customer
   * never typed. */
  it('refuses more than two decimals, a negative, a zero and anything non-numeric', () => {
    expect(parseMajorAmount('10.005')).toBeNull();
    expect(parseMajorAmount('-100')).toBeNull();
    expect(parseMajorAmount('0')).toBeNull();
    expect(parseMajorAmount('')).toBeNull();
    expect(parseMajorAmount('1e3')).toBeNull();
  });
});

/**
 * The decision that spends the customer's money, kept pure so it can be checked
 * without mounting a page.
 */
describe('planBulkPayment', () => {
  const rows = [
    { subscriptionId: 'sub-b', amountMinor: 180000 },
    { subscriptionId: 'sub-a', amountMinor: 120000 },
  ];

  it('pays from the balance when it covers the total', () => {
    expect(planBulkPayment(rows, 300000)).toEqual({
      kind: 'from_balance',
      totalMinor: 300000,
      subscriptionIds: ['sub-b', 'sub-a'],
    });
  });

  it('tops up only the shortfall, carrying the ids in tick order', () => {
    // Tick order, not list order: it becomes the top-up's `intent`, and Billing
    // renews along it while the money lasts. Sorting it would renew a different
    // server first than the one the customer picked first.
    expect(planBulkPayment(rows, 100000)).toEqual({
      kind: 'top_up',
      totalMinor: 300000,
      shortfallMinor: 200000,
      subscriptionIds: ['sub-b', 'sub-a'],
    });
  });

  it('treats an exactly-covering balance as covered', () => {
    // Billing settles all-or-nothing at `balance >= price`; an off-by-one here
    // would send a customer to a gateway for money they already have with us.
    expect(planBulkPayment(rows, 300000).kind).toBe('from_balance');
  });

  /** A debt has to be cleared before any of the money buys a renewal, so the
   * shortfall is larger than the total rather than equal to it. */
  it('adds a negative balance to the shortfall', () => {
    expect(planBulkPayment(rows, -50000)).toMatchObject({
      kind: 'top_up',
      totalMinor: 300000,
      shortfallMinor: 350000,
    });
  });

  it('has nothing to decide with an empty selection', () => {
    expect(planBulkPayment([], 500000)).toEqual({ kind: 'empty' });
  });
});
