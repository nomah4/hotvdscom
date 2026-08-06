import { HOTVDS_ROLE_PREFIX, ZITADEL_AUTHORITY, ZITADEL_PROJECT_ID } from '../auth/config';

/**
 * Who has been given access to this storefront, read straight from ZITADEL.
 *
 * The browser calls ZITADEL directly with the signed-in admin's own token —
 * nothing is proxied through Billing, which knows only about people who reached
 * checkout and holds no names or emails at all.
 *
 * Scope caveat, deliberate and worth knowing: ZITADEL has one project
 * ("webtalk") covering the forum apps, the billing APIs and this storefront, so
 * a manager role granted for this page is a project-wide grant.
 *
 * How someone ends up in this list, confirmed by testing on 2026-08-06: ZITADEL
 * records no authorization for a user who merely registers and logs in. Only an
 * explicitly granted role creates one. A ZITADEL Action now grants
 * CUSTOMER_ROLE on authentication through this storefront — it checks the auth
 * request's application id, so a forum-only login is skipped — which is what
 * makes customers appear here at all. Anyone who signed up before that Action
 * existed needs the role granted by hand or they stay invisible.
 *
 * The query is scoped to the project, then filtered by role prefix in code:
 * ZITADEL's repeated filters are ANDed, so one request cannot express
 * "hotvds_admin OR hotvds_customer".
 */

const LIST_AUTHORIZATIONS_URL = `${ZITADEL_AUTHORITY}/zitadel.authorization.v2.AuthorizationService/ListAuthorizations`;

export interface Signup {
  id: string;
  /** When the role was granted — the closest thing ZITADEL has to "signed up at". */
  grantedAt: string;
  userId: string;
  displayName: string;
  loginName: string;
  roles: string[];
}

interface ZitadelAuthorization {
  id?: string;
  creationDate?: string;
  project?: { id?: string };
  user?: { id?: string; displayName?: string; preferredLoginName?: string };
  roles?: { key?: string }[];
}

export class SignupsPermissionError extends Error {}

function toSignup(raw: ZitadelAuthorization): Signup {
  return {
    id: raw.id ?? '',
    grantedAt: raw.creationDate ?? '',
    userId: raw.user?.id ?? '',
    displayName: raw.user?.displayName ?? '',
    loginName: raw.user?.preferredLoginName ?? '',
    roles: (raw.roles ?? []).map((role) => role.key ?? '').filter(Boolean),
  };
}

export async function fetchSignups(accessToken: string, signal?: AbortSignal): Promise<Signup[]> {
  const response = await fetch(LIST_AUTHORIZATIONS_URL, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      // Required by ZITADEL's Connect-protocol endpoints; omitting it is a 400.
      'Connect-Protocol-Version': '1',
    },
    // AuthorizationsSearchFilter is a oneof — each entry wraps a nested filter
    // message, not a bare scalar. Confirmed against ZITADEL's own .proto source
    // (authorization.proto / filter.proto): project_id takes an IDFilter{id}. A
    // flat {"projectId": "..."} fails protobuf-JSON unmarshalling with "proto:
    // syntax error" — the caller gets no field-name hint, just a token-position
    // error, so this shape isn't discoverable by guessing from the response.
    //
    // Role filtering happens in code below, not here — see the module comment.
    body: JSON.stringify({
      filters: [{ projectId: { id: ZITADEL_PROJECT_ID } }],
    }),
  });

  // The caller holds a valid session but lacks the ZITADEL manager role this
  // query needs. Distinguished from other failures so the page can say so
  // plainly instead of showing a generic error.
  if (response.status === 401 || response.status === 403) {
    throw new SignupsPermissionError('Not permitted to read sign-ups');
  }
  if (!response.ok) {
    throw new Error(`Could not load sign-ups (HTTP ${response.status})`);
  }

  const body = (await response.json()) as { authorizations?: ZitadelAuthorization[] };
  return (body.authorizations ?? [])
    .map(toSignup)
    .filter((signup) => signup.roles.some((role) => role.startsWith(HOTVDS_ROLE_PREFIX)))
    // Newest first: the question this page answers is "who has come to hosting",
    // and the most recent arrivals are the ones being waited on.
    .sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));
}
