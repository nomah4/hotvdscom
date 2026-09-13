import { afterEach, describe, expect, it, vi } from 'vitest';

const { createTelegramLinkToken, fetchTelegramLink, unlinkTelegram } = await import('./telegram');

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

const LINK = {
  enabled: true,
  bot_username: 'hotvds_bot',
  linked: true,
  telegram_username: 'ivan',
  linked_at: '2026-09-01T00:00:00Z',
};

describe('fetchTelegramLink', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * The one behaviour the whole card rests on. Billing answers 404 to every
   * Telegram route until an operator switches the feature on, so treating it
   * as an error would show a failure banner on every install that simply does
   * not have Telegram — worse than showing no card at all.
   */
  it('reads a 404 as "feature off" and resolves to null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'not_found' } }, 404)),
    );

    await expect(fetchTelegramLink('token')).resolves.toBeNull();
  });

  it('returns the link when Billing has the feature on', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(LINK)));

    await expect(fetchTelegramLink('token')).resolves.toMatchObject({
      linked: true,
      telegram_username: 'ivan',
    });
  });

  it('sends the bearer token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(LINK)));

    await fetchTelegramLink('token-1');

    expect(new Headers(requestInit().headers).get('Authorization')).toBe('Bearer token-1');
  });

  /** A genuine failure must stay a failure — only 404 is special. */
  it('still throws on any other error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'boom' } }, 500)));

    await expect(fetchTelegramLink('token')).rejects.toThrow(/boom/);
  });
});

describe('createTelegramLinkToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the deep link to send the customer to', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          deep_link: 'https://t.me/hotvds_bot?start=abc',
          token: 'abc',
          expires_at: '2026-09-13T00:10:00Z',
        }),
      ),
    );

    await expect(createTelegramLinkToken('token')).resolves.toMatchObject({
      deep_link: 'https://t.me/hotvds_bot?start=abc',
    });
  });

  /** Asking for a new token while already linked is working from a stale
   * card — swallowing this would send the customer to start a link Billing
   * will refuse to finish. */
  it('propagates 409 already_linked rather than swallowing it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'already_linked' } }, 409)),
    );

    await expect(createTelegramLinkToken('token')).rejects.toThrow(/already_linked/);
  });

  it('posts with no body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ deep_link: 'https://t.me/x', token: 't', expires_at: '2026-09-13T00:10:00Z' }),
      ),
    );

    await createTelegramLinkToken('token');

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).body).toBeUndefined();
  });
});

describe('unlinkTelegram', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a DELETE', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ linked: false })));

    await unlinkTelegram('token');

    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(url).toContain('/telegram/link');
    expect((init as RequestInit).method).toBe('DELETE');
  });

  it('throws on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'boom' } }, 500)));

    await expect(unlinkTelegram('token')).rejects.toThrow(/boom/);
  });
});
