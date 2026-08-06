import { ZITADEL_AUTHORITY, ZITADEL_PROJECT_ID } from '../auth/config';

/**
 * Who has been given access to this storefront, read straight from ZITADEL.
 *
 * The browser calls ZITADEL directly with the signed-in admin's own token —
 * nothing is proxied through Billing, which knows only about people who reached
 * checkout and holds no names or emails at all.
 *
 * Scope caveat, deliberate and worth knowing: ZITADEL has one project
 * ("webtalk") covering the forum apps, the billing APIs and this storefront, so
 * a manager role granted for this page is a project-wide grant. This query is
 * scoped to the project — it is not scoped by role. That is deliberate for now
 * (2026-08-06): it is still unconfirmed whether a plain customer who registers
 * and logs into hotvds without ever being granted a role even produces an
 * authorization record here at all, or whether ZITADEL only creates one when a
 * role is explicitly assigned. Showing every role alongside each person, rather
 * than filtering to one role, is how that question gets answered instead of
 * guessed at.
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
    // Deliberately not also filtering by role_key here — see the module comment.
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
  return (body.authorizations ?? []).map(toSignup);
}
