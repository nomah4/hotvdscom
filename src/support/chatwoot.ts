/**
 * Chatwoot live chat.
 *
 * Empty here on purpose: the Chatwoot install lives on its own machine that does
 * not exist yet. Fill both values in and the widget appears — on the marketing
 * pages and in the account — with no code change. Leave either blank and nothing
 * loads at all, which is why an unconfigured build ships no third-party script.
 *
 * Neither value is a secret. The website token identifies which inbox a message
 * belongs to, exactly like BILLING_API_BASE identifies a catalogue; it is visible
 * in every request the widget makes. The *HMAC* key used for identity validation
 * is a secret and must never appear here — see identifyInChat below.
 */
export const CHATWOOT_BASE_URL = '';
export const CHATWOOT_WEBSITE_TOKEN = '';

export function isChatConfigured(): boolean {
  return CHATWOOT_BASE_URL !== '' && CHATWOOT_WEBSITE_TOKEN !== '';
}

interface ChatwootSdk {
  run(options: { websiteToken: string; baseUrl: string }): void;
}

interface ChatwootApi {
  toggle(state?: 'open' | 'close'): void;
  setLocale(locale: string): void;
}

declare global {
  interface Window {
    chatwootSDK?: ChatwootSdk;
    $chatwoot?: ChatwootApi;
    chatwootSettings?: Record<string, unknown>;
  }
}

const SCRIPT_ID = 'chatwoot-sdk';

/**
 * Loads the widget once per page load.
 *
 * Idempotent by script id rather than by a module-level flag: React StrictMode
 * runs effects twice in development, and two copies of the SDK means two chat
 * bubbles.
 */
export function loadChat(locale: string): void {
  if (!isChatConfigured()) return;
  if (typeof document === 'undefined') return;

  if (document.getElementById(SCRIPT_ID)) {
    window.$chatwoot?.setLocale(locale);
    return;
  }

  window.chatwootSettings = { locale, position: 'right', type: 'expanded_bubble' };

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`;
  script.defer = true;
  script.async = true;
  script.onload = () => {
    window.chatwootSDK?.run({ websiteToken: CHATWOOT_WEBSITE_TOKEN, baseUrl: CHATWOOT_BASE_URL });
  };
  document.head.appendChild(script);
}

/** Opens the chat if it is loaded. Safe to call when it is not. */
export function openChat(): void {
  window.$chatwoot?.toggle('open');
}

/**
 * Deliberately absent: telling Chatwoot who the visitor is.
 *
 * Chatwoot's `setUser` only *validates* an identity when the call carries an
 * `identifier_hash` — an HMAC of the identifier signed with the inbox's key. The
 * key cannot live in the browser, and this storefront is a pure SPA with no
 * backend of its own, so there is nowhere to sign it yet.
 *
 * Calling `setUser` without the hash would let Chatwoot accept whatever email the
 * page claims. One customer could then open the console, claim another's address,
 * and land in that person's conversation history in the agent inbox. An anonymous
 * chat is a smaller thing than that.
 *
 * So identity waits for somewhere server-side to compute the signature (Billing,
 * or a small endpoint beside it). Tracked in TODO.md.
 */
export const identifyInChat = null;
