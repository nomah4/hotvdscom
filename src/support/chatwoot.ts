/**
 * Chatwoot live chat, running on its own VM at chat.hotvds.com (10.0.1.14),
 * fronted by the gateway's SNI router like every other backend.
 *
 * Neither value is a secret. The website token identifies which inbox a message
 * belongs to, exactly like BILLING_API_BASE identifies a catalogue, and it is
 * visible in every request the widget makes.
 *
 * The inbox's *HMAC* key is a different thing and is a secret: it is what would
 * let Chatwoot verify a claimed identity. It must never appear in this file or
 * anywhere else the browser can read — see identifyInChat below. It lives in
 * Chatwoot under Settings → Inboxes → hotvds.com.
 *
 * Blanking either constant switches the widget off completely, including the
 * third-party script, which is the way to disable chat without a revert.
 */
// Annotated `string` rather than left to inference on purpose: as literal types
// these would narrow, and `isChatConfigured`'s comparison against '' would become
// a compile error — taking the "blank them to switch chat off" path with it.
export const CHATWOOT_BASE_URL: string = 'https://chat.hotvds.com';
export const CHATWOOT_WEBSITE_TOKEN: string = 'B4yyYVime7EvnsUCA9wwoiz4';

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
