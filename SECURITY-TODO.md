# Security backlog

Open security work, most urgent first. Recorded 2026-08-07 from a review of the admin sign-ups
feature (`af4338a..303ce15`, PRs #11–#15) and the auth surface it touches.

Ordering is by expected damage divided by cost to fix, not by severity alone — which is why a
one-line comment fix and a "please confirm the nginx config" check sit above findings that are
technically more serious. Nothing here is a live exploit: item 1 is an amplifier that turns a
token leak into an account takeover, and items 2–3 decide how likely that leak is.

Each item states what is wrong, why it matters, and what "done" looks like. Urgency labels:
**now** (before the next production tag), **next** (within the next few working sessions),
**background** (real, but no deadline pressure).

---

## 1. Every user's access token is now valid against ZITADEL's own APIs — **now**

`src/auth/config.ts:61` adds `urn:zitadel:iam:org:project:id:zitadel:aud` to
`oidcSettings.scope`. There is one `oidcSettings` for the whole app, so this is not "a scope for
the admin page" — it is a scope for every customer who signs in.

Two consequences, neither of which existed before this commit:

- **A stolen token now reaches the identity, not just the billing data.** Tokens and the
  `offline_access` refresh token live in `localStorage` (`src/auth/config.ts:67-68`), so any XSS on
  hotvds.com yields a token that ZITADEL's self-service API accepts — `zitadel.auth.v1.AuthService`
  and friends (`ChangeMyEmail`, `RemoveMyAuthFactorOTP`, `RemoveMyPasswordless`). Change the email,
  drop the second factor, request a reset: permanent takeover of an account that is also the
  user's webtalk forum identity. The exact method set depends on the ZITADEL version and the
  instance's self-service settings and should be confirmed against this deployment — the shape of
  the problem does not.
- **`bl` now receives tokens that work against ZITADEL.** `src/api/checkout.ts`,
  `src/api/subscriptions.ts` and `src/pages/CheckoutReturnPage.tsx` all send this same token to
  `bl.hotvds.com`. Before, a token recovered from bl's logs or memory bought one customer's billing
  records. Now it buys operations on their identity account.

**Done looks like:** the browser never holds a token with the `zitadel` audience.

The right fix is to move `ListAuthorizations` behind a backend endpoint on `bl` that calls ZITADEL
under a service account, and drop the scope from the storefront entirely. The admin sign-ups list
is a server-side concern that ended up in the browser because there was no backend to put it in.

If that has to wait, the interim is to keep the scope out of `oidcSettings` and mint the wider
token only on `/admin`: a direct `POST /oauth/v2/token` with `grant_type=refresh_token` and the
extra audience scope, held in a `useRef` for the lifetime of the page and never written to
`localStorage`. That bounds the exposure to one route and one tab instead of every session.

## 2. Confirm a Content-Security-Policy is actually served — **now**

Nothing in this repository sets one: `index.html` has no meta CSP, `deploy/hotvds-prod-deploy`
only publishes static files, and the nginx vhosts are not tracked here. With bearer tokens in
`localStorage`, CSP is the main thing standing between an injected script and a stolen session —
and after item 1, between an injected script and a stolen account.

**Done looks like:** the response headers from `hotvds.com` and `dev.hotvds.com` are recorded in
this repo (README deployment section) with a CSP that at minimum constrains `script-src`, plus
`X-Frame-Options`/`frame-ancestors` and `Referrer-Policy`. If the vhosts are going to carry
security headers, the config belongs in `deploy/` alongside the deploy script rather than living
only on the host.

## 3. The blast-radius comment in `auth/config.ts` is now false — **now**

`src/auth/config.ts:64-66` still reads "a stolen token only reaches that one user's own billing
data". Item 1 made that untrue in the same commit that added the scope. This is a two-minute fix
filed separately because the failure mode is specific: the next person to reason about token
storage will read that line as current and conclude the risk is already bounded.

**Done looks like:** the comment describes what a stolen token actually reaches today, and says so
next to the `localStorage` decision it is justifying.

## 4. Storefront admins get project-wide read across the shared webtalk project — **next**

The module comment in `src/api/signups.ts:10-12` records this as a caveat; it is worth treating as
a finding. To see `/admin`, a staff member needs a ZITADEL manager role, and the project ("webtalk")
spans the forum apps, the billing APIs and this storefront. So the grant that lets someone review
hosting sign-ups also lets them read grants across the forum — the storefront cannot scope it down,
because the scoping would have to happen in ZITADEL.

**Done looks like:** either the storefront moves to its own ZITADEL project, or the manager role
handed to hosting staff is narrowed to the smallest ZITADEL permission that satisfies
`ListAuthorizations`, with the resulting reach written down. Which of the two depends on whether
hosting and forum are administered by the same people — decide that first.

## 5. The sign-ups list silently truncates — **next**

`fetchSignups` (`src/api/signups.ts:78-80`) sends no pagination, so ZITADEL returns its default
page (100) and the UI presents it as the complete answer. Worse, the `hotvds_` prefix filter runs
in code *after* the fetch (`signups.ts:96`), so the cut happens before filtering: a project with
enough forum grants can push storefront customers off the first page entirely and the list will
look empty rather than truncated.

This is a security item and not just a bug because the page's whole purpose is answering "who has
access" — an access review that quietly omits rows is worse than no access review.

**Done looks like:** the query pages through all results (or filters by role server-side if a
future ZITADEL version allows the OR), and the count shown to the user is the true total.

## 6. `tar` extraction in the deploy script — **background**

`deploy/hotvds-prod-deploy:67` runs `tar -xzf - -C "$staging"` on a client-supplied stream. GNU tar
already strips leading `/` and refuses `..` members, and whoever supplies the stream already holds
the production deploy key, so the practical risk is low. `--no-same-owner --no-same-permissions` is
cheap defence in depth for the day that key is shared more widely than it is today.

## 7. `/admin` has no test coverage — **background**

`src/routes.test.tsx` does not mention the route. The non-admin redirect in
`src/pages/AdminPage.tsx:17` is convenience rather than access control, so a regression there is
not a breach — but it is the only thing keeping a customer from landing on a page that then tells
them they are forbidden, and it is untested.

**Done looks like:** a test that a signed-in non-admin hitting `/:lang/admin` is redirected to the
dashboard, and that the sidebar entry is absent for them.

---

## Already recorded elsewhere

Two deployment items from the 2026-08-06 work are still open; see the "Still outstanding" note in
`CHANGELOG.md` rather than duplicating them here:

- the staging deploy key is `rrsync`-restricted but connects as `root`, unlike production's
  unprivileged `hotvds-deploy` user;
- `deploy-prod.yml` declares `environment: production`, but that environment does not exist in the
  repository settings, so a production deploy needs no reviewer approval.

## Checked and found sound

Recorded so the next review does not re-derive it. The client-side admin gate is correctly
documented as routing convenience, with ZITADEL as the real check and a fail-closed 403 path
(`src/api/signups.ts:86-88`). The sign-ups table is XSS-safe: React escapes the cells, the Billing
deep link is built with `URLSearchParams`, and the external link carries `rel="noopener noreferrer"`.
`returnTo` in `src/pages/CallbackPage.tsx:64` is built by the app from `location.pathname`, so
there is no open redirect. The `AbortController` in `SignupList` is torn down correctly.
