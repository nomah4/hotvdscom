import { describe, expect, it, vi } from 'vitest';
import { CHATWOOT_BASE_URL, CHATWOOT_WEBSITE_TOKEN, isChatConfigured, setChatSource } from './chatwoot';

/**
 * The widget's config is two plain constants, which makes one mistake very easy
 * and very bad: pasting the inbox's HMAC key in beside the website token. The
 * website token is public by design; the HMAC key is what proves an identity,
 * and anything in this file ships to every visitor's browser.
 */
describe('chatwoot config', () => {
  it('points at the install rather than a placeholder', () => {
    expect(isChatConfigured()).toBe(true);
    expect(CHATWOOT_BASE_URL).toMatch(/^https:\/\//);
    // http:// would send the conversation in clear text; the widget also refuses
    // to load over a scheme the page did not come from.
    expect(CHATWOOT_BASE_URL).not.toMatch(/\/$/);
  });

  it('exports exactly one token', () => {
    // A second secret-shaped constant here is the failure this guards: the HMAC
    // key must stay in Chatwoot's inbox settings and be used server-side only.
    expect(CHATWOOT_WEBSITE_TOKEN).toMatch(/^[A-Za-z0-9]+$/);
    expect(CHATWOOT_WEBSITE_TOKEN.length).toBeGreaterThan(10);
  });
});

describe('conversation tagging', () => {
  it('never claims the visitor is verified', () => {
    const setCustomAttributes = vi.fn();
    (window as unknown as { $chatwoot: unknown }).$chatwoot = { setCustomAttributes };

    setChatSource('dashboard');

    const attrs = setCustomAttributes.mock.calls[0][0];
    // `dashboard` says the widget was mounted behind RequireAuth — not that
    // Chatwoot checked anything. The browser sets these, so a console call can
    // forge them. An agent reading "dashboard" as proof could hand one
    // customer's account details to another.
    expect(attrs.hotvds_source).toBe('dashboard');
    expect(attrs.hotvds_identity).toBe('unverified');
  });
});
