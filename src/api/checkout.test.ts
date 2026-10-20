import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { changedResources, createUpgrade, fetchUpgradePreview } = await import('./checkout');

const CURRENT = { cpu: 2, ram_gb: 8, ssd_gb: 40 };

function ok(body: unknown = {}): Response {
  return { ok: true, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe('upgrade requests send only the changed dimensions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(ok())));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('changedResources keeps only differing keys, and everything without a baseline', () => {
    expect(changedResources({ cpu: 2, ram_gb: 16, ssd_gb: 40 }, CURRENT)).toEqual({ ram_gb: 16 });
    expect(changedResources({ cpu: 4, ram_gb: 8, ssd_gb: 80 }, CURRENT)).toEqual({ cpu: 4, ssd_gb: 80 });
    expect(changedResources({ cpu: 2, ram_gb: 16, ssd_gb: 40 }, null)).toEqual({
      cpu: 2,
      ram_gb: 16,
      ssd_gb: 40,
    });
  });

  it('preview query carries only the changed keys', async () => {
    await fetchUpgradePreview('t', 'sub-1', { cpu: 2, ram_gb: 16, ssd_gb: 40 }, 'RUB', CURRENT);

    const url = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(url.searchParams.get('ram_gb')).toBe('16');
    expect(url.searchParams.has('cpu')).toBe(false);
    expect(url.searchParams.has('ssd_gb')).toBe(false);
    expect(url.searchParams.get('currency')).toBe('RUB');
  });

  it('POST body carries only the changed keys', async () => {
    await createUpgrade({
      accessToken: 't',
      subscriptionId: 'sub-1',
      resources: { cpu: 2, ram_gb: 16, ssd_gb: 80 },
      current: CURRENT,
      methodCode: 'card',
      returnUrl: 'https://x/return',
      customerEmail: 'a@b.c',
    });

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.configuration).toEqual({ ram_gb: 16, ssd_gb: 80 });
  });
});
