import { UserManager } from 'oidc-client-ts';
import { oidcSettings } from './config';

// Single shared instance: AuthContext subscribes to its events and CallbackPage
// completes the redirect against it. Two instances would keep separate state and
// silently lose the session.
export const userManager = new UserManager(oidcSettings);

// Where to land after a successful sign-in, carried through the round trip to
// ZITADEL so "Buy" -> login -> back to the same product actually works.
export interface SigninState {
  returnTo?: string;
}
