import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  deleteServer,
  fetchServerCredentials,
  rebootServer,
  requestServerConsole,
  restoreServer,
  setServerPower,
} = await import('./subscriptions');

const machineActions = [
  ['power', () => setServerPower('customer-token', 'sub-1', 'on')],
  ['reboot', () => rebootServer('customer-token', 'sub-1')],
  ['delete', () => deleteServer('customer-token', 'sub-1')],
  ['restore', () => restoreServer('customer-token', 'sub-1')],
  ['credentials', () => fetchServerCredentials('customer-token', 'sub-1')],
  ['console', () => requestServerConsole('customer-token', 'sub-1')],
] as const;

function response(): Response {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({}),
  } as unknown as Response;
}

function requestHeaders(callIndex: number): Headers {
  const fetchMock = vi.mocked(globalThis.fetch);
  const options = fetchMock.mock.calls[callIndex][1];
  return new Headers(options?.headers);
}

describe('subscription machine actions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(response())));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Billing requires an idempotency key for state-changing actions, and using it
   * consistently also keeps every machine-action request on one contract. */
  it('sends a non-empty idempotency key for every machine action', async () => {
    for (const [, invoke] of machineActions) {
      await invoke();
    }

    machineActions.forEach(([action], index) => {
      expect(requestHeaders(index).get('X-Idempotency-Key'), action).toBeTruthy();
    });
  });

  /** Separate clicks are separate customer intents, so a later request must not
   * replay the result of an earlier request for the same action. */
  it('uses a fresh idempotency key for repeated calls', async () => {
    await rebootServer('customer-token', 'sub-1');
    await rebootServer('customer-token', 'sub-1');

    const firstKey = requestHeaders(0).get('X-Idempotency-Key');
    const secondKey = requestHeaders(1).get('X-Idempotency-Key');

    expect(firstKey).toBeTruthy();
    expect(secondKey).toBeTruthy();
    expect(secondKey).not.toBe(firstKey);
  });

  /** Adding replay protection must not drop the bearer token that authorizes the
   * customer to operate this subscription. */
  it('keeps the bearer authorization header', async () => {
    await deleteServer('customer-token', 'sub-1');

    expect(requestHeaders(0).get('Authorization')).toBe('Bearer customer-token');
  });
});
