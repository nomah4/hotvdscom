import { WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts';

// Identity provider: webtalk.one (ZITADEL). The billing services (bl/pr) validate
// tokens from this same issuer via RFC 7662 introspection, so the storefront and
// billing agree on who the user is without sharing any secret.
export const ZITADEL_AUTHORITY = 'https://webtalk.one';

// Public identifier of the "HotVDS Web" application (User Agent / PKCE).
// Not a secret: it ships in the bundle by design.
export const ZITADEL_CLIENT_ID = '382573124727668738';

// webtalk.one project. Requesting the ":aud" scope below puts this id into the
// token audience, which is what bl accepts (STOREFRONT_BEARER_ACCEPTED_AUDIENCES).
export const ZITADEL_PROJECT_ID = '357344073557737475';

// ZITADEL puts granted project roles here, shaped { "<role>": { "<orgId>": "<domain>" } }.
export const ZITADEL_ROLES_CLAIM = 'urn:zitadel:iam:org:project:roles';

// UI-only marker. Billing does NOT enforce this role — it authorises by token
// identity (each user sees only their own data). Never gate anything that
// actually needs to be secure on this alone.
export const ADMIN_ROLE = 'hotvds_admin';

export const oidcSettings: UserManagerSettings = {
  authority: ZITADEL_AUTHORITY,
  client_id: ZITADEL_CLIENT_ID,

  // Derived from the current origin so the same build works on localhost,
  // dev.hotvds.com and hotvds.com. All three are registered in ZITADEL.
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,

  response_type: 'code',

  // offline_access is what actually yields a refresh token; ticking "Refresh Token"
  // on the app only permits it. The project ":aud" scope is required or bl rejects
  // the token with audience_mismatch.
  scope: [
    'openid',
    'profile',
    'email',
    'offline_access',
    `urn:zitadel:iam:org:project:id:${ZITADEL_PROJECT_ID}:aud`,
  ].join(' '),

  // localStorage keeps the session across browser restarts (deliberate: a
  // storefront shouldn't ask customers to sign in on every visit). Blast radius is
  // bounded — a stolen token only reaches that one user's own billing data.
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  stateStore: new WebStorageStateStore({ store: window.localStorage }),

  automaticSilentRenew: true,

  // ZITADEL issues opaque access tokens, so profile fields (name/email) come from
  // the userinfo endpoint rather than being decodable in the browser.
  loadUserInfo: true,
};
