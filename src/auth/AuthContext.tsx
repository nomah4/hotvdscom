import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from 'oidc-client-ts';
import { ADMIN_ROLE, ZITADEL_ROLES_CLAIM } from './config';
import { userManager, type SigninState } from './userManager';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  roles: string[];
  isAdmin: boolean;
  displayName: string;
  accessToken: string | null;
  /** Sends the user to ZITADEL; `returnTo` is where they come back to. */
  login: (returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Where to send the user back to once the sign-in prompt modal's login button
   * is used, or `null` when the modal is closed. Modelled as data (not a plain
   * boolean) so a single piece of state answers both "is it open" and "where does
   * it lead" — the nav links that open it don't navigate first, so there is no
   * route to read this back from.
   */
  promptReturnTo: string | null;
  openAuthPrompt: (returnTo: string) => void;
  closeAuthPrompt: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// The claim is an object keyed by role name; the values describe which org granted
// it, which we don't need. Missing claim simply means "no roles".
function rolesOf(user: User | null): string[] {
  const claim = user?.profile?.[ZITADEL_ROLES_CLAIM];
  if (!claim || typeof claim !== 'object') return [];
  return Object.keys(claim as Record<string, unknown>);
}

function isExpired(user: User | null): boolean {
  return !user || user.expired === true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [promptReturnTo, setPromptReturnTo] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // Restore an existing session on first paint. getUser() reads storage only —
    // it does not hit the network, so this is cheap.
    userManager
      .getUser()
      .then((restored) => {
        if (active) setUser(isExpired(restored) ? null : restored);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const onLoaded = (next: User) => setUser(next);
    const onCleared = () => setUser(null);

    userManager.events.addUserLoaded(onLoaded);
    userManager.events.addUserUnloaded(onCleared);
    userManager.events.addAccessTokenExpired(onCleared);
    userManager.events.addSilentRenewError(onCleared);

    return () => {
      active = false;
      userManager.events.removeUserLoaded(onLoaded);
      userManager.events.removeUserUnloaded(onCleared);
      userManager.events.removeAccessTokenExpired(onCleared);
      userManager.events.removeSilentRenewError(onCleared);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const roles = rolesOf(user);
    const profile = user?.profile;

    return {
      user,
      isLoading,
      isAuthenticated: !isExpired(user),
      roles,
      isAdmin: roles.includes(ADMIN_ROLE),
      displayName: profile?.name ?? profile?.preferred_username ?? profile?.email ?? '',
      accessToken: user?.access_token ?? null,
      login: (returnTo?: string) => {
        const state: SigninState = {
          returnTo: returnTo ?? `${window.location.pathname}${window.location.search}`,
        };
        return userManager.signinRedirect({ state });
      },
      logout: () => userManager.signoutRedirect(),
      promptReturnTo,
      openAuthPrompt: setPromptReturnTo,
      closeAuthPrompt: () => setPromptReturnTo(null),
    };
  }, [user, isLoading, promptReturnTo]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
