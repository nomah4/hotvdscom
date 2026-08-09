# TODO

Known gaps, with enough context to pick them up cold. Security findings live in
`SECURITY-TODO.md` (branch `security-backlog`).

## Chatwoot is wired but not configured, and the chat is anonymous

`src/support/chatwoot.ts` holds two empty constants. Fill in `CHATWOOT_BASE_URL`
and `CHATWOOT_WEBSITE_TOKEN` and the widget appears on the marketing pages and
in the account's Support section with no code change; leave either blank and no
third-party script loads at all. Neither is a secret — the website token
identifies an inbox, the way `BILLING_API_BASE` identifies a catalogue.

Add the new route to `deploy/nginx/snippets-hotvds-spa-routes.conf` **and** the
host whenever one is added here, or the page answers 404 to crawlers while
rendering fine in a browser. `src/nginxRoutes.test.ts` catches it — it did,
during this change.

**The blocker for step two: the chat cannot say who the customer is.** Chatwoot
only *validates* an identity when `setUser` carries an `identifier_hash`, an
HMAC of the identifier signed with the inbox key. That key cannot be in the
browser, and this storefront is a pure SPA with no backend of its own, so there
is nowhere to sign it.

Calling `setUser` without the hash is not a smaller version of the same thing:
Chatwoot would accept whatever email the page claims, so a customer could open
the console, claim someone else's address, and land in that person's
conversation history in the agent inbox. Anonymous chat is strictly safer than
that.

**To finish:** put the signing somewhere server-side — Billing, or a small
endpoint beside it — that takes the ZITADEL token and returns the identifier and
its hash. Then `identifyInChat` in `chatwoot.ts` becomes real, and the
conversation can carry `subscription_id` and package as custom attributes, which
is what turns "my server is down" into a conversation that already knows which
server.

Also unresolved: chat transcripts are personal data under 152-ФЗ, and the terms
covering that are still `__ТЕКСТ_ОТ_VICTOR__`.

## Ordering a fixed plan never asks for OS or datacenter

Buying a catalogue plan (Start/Basic/Pro/…) posts only `package_code` to
`/api/v1/invoices` — see `createInvoice` in `src/api/checkout.ts`. The
configurator's custom path sends a full configuration; the fixed path sends
none. So a fixed-plan subscription comes back from Billing with
`configuration: null`, and its dashboard card can show no OS and no datacenter
while a Custom VDS card shows both.

`SubscriptionListItem` no longer *hides* them — it used to read OS and
datacenter only in the branch for packages missing from the catalogue, so even a
fixed plan that did record them showed neither. That is fixed. The remaining gap
is upstream: nothing collects the values in the first place.

**To finish:** decide where a fixed plan gets its OS and location. Either the
checkout page asks before confirming (a real UI change on the money path), or
Billing assigns defaults and returns them in `configuration`. Until one of the
two happens, those servers cannot be provisioned meaningfully either — nobody
has said what to install or where.

## Server telemetry and controls are placeholders

The instance card shows IP address, CPU load and network as dashes, and its
power / reboot / delete buttons answer "not connected yet" rather than acting.
Both are deliberate: `Subscription` carries no address and no metrics, there is
no power API, and the provisioning adapter (Phase 4) that would own all of it
does not exist — every real subscription sits at `provisioning_status: pending`.

The buttons are styled as live controls on purpose, so the card shows its
eventual shape. They must never report success they did not achieve: a customer
who believes a reboot happened will wait for a server that never went down, and
one who believes a delete happened will be billed for a server they think is
gone.

**To finish:** with provisioning in place, wire power/reboot/delete to real
endpoints (delete needs a confirmation step — it is the only irreversible one),
read the IP from the subscription, and take load and network from whatever
monitoring lands alongside. `isRunning` in `SubscriptionListItem` is currently
inferred from `status === 'active' && provisioning_status === 'succeeded'`
because there is no power state to read; replace it with the real one.

## Account balance is not connected

The dashboard shows a **Balance** tile with a dash and "not connected yet"
(`src/pages/DashboardPage.tsx`). It is a placeholder because there is nothing to
read: the storefront can reach `/invoices`, `/invoices/from-quote`,
`/payment-methods`, `/public/packages`, `/public/quotes`, `/subscriptions`,
`/subscriptions/{id}/renewals` and `/subscriptions/{id}/renewal-preview`, and
none of them carry an account balance.

**To finish:** confirm whether Billing exposes a balance endpoint. If it does,
add a fetch alongside `src/api/subscriptions.ts`, render the amount with the
existing `formatMoneyMinor`, and drop `t.stats.balanceUnavailable`. If it does
not, the tile should not ship a number — decide whether balance is a Billing
feature worth building or whether the tile comes out.

Do not fill this from `BillingWidget` (below). A plausible figure here is a
claim about the customer's own money.

## `BillingWidget` is dead code with invented figures

`src/components/dashboard/BillingWidget.tsx` renders a hardcoded `$48.20`
balance and a `1 авг · $28.00` next invoice — the latter in Russian regardless
of the selected language. It came from the design-prototype commit (`89e8bef`)
and was deliberately unmounted in `57b8705` ("Phase 5a: Dashboard reads real
subscriptions") precisely so invented balance figures would not sit next to real
data. The file was left behind rather than deleted, so nothing renders it today.

**To finish:** delete the component, or keep it only if the balance work above
gives it real numbers to show. It is harmless while unreferenced and wrong the
moment someone reuses it.

## Repeat purchase of an identical server replays the first order

Ordering a second identical server in the same browser tab can return the
*first* invoice and subscription instead of creating a new one, so no second
server appears. Reproduced on dev 2026-08-08; no data was lost.

The idempotency key sent to Billing is built only from *what* is being bought —
`PKG:CUR` for catalogue plans (`src/api/useCheckout.ts`), and
`custom:PKG:CUR:cpu:ram:ssd:os:dc` for a configured one — with nothing per
purchase. That is intentional, so backing out of the gateway and confirming
again replays one invoice rather than opening two. The hole is *retirement*: the
key is dropped only by `CheckoutReturnPage`, and only if it observes the invoice
settle. It survives when

- payment takes longer than `MAX_POLLS × POLL_INTERVAL_MS` (30s) and the poll
  exits while the invoice is still `pending`, which skips the clearing branch;
- the customer never reaches the return page but keeps the tab open;
- `createInvoice` succeeds and `payment_url` is missing — the throw happens
  after the key is minted, before `rememberPendingInvoice`, orphaning it beyond
  the reach of `clearPendingInvoice`.

Renewal is unaffected: it namespaces its key as `renewal:<subscription_id>`.

**To finish:** likely retire the key when the customer is handed to the gateway
rather than on return, which closes all three cases because it no longer depends
on the customer coming back. That trades away replay-on-Back protection, leaving
the in-flight button disable as the double-submit guard — decide whether that is
acceptable before changing a money path. Workaround meanwhile: a new tab gets a
fresh `sessionStorage`, and therefore a fresh key.

## nginx config is applied by hand

Fixed 2026-08-08: unknown paths now answer a real 404 while still rendering the
localized not-found page. See `deploy/nginx/README.md`.

What remains is the process, not the bug. The configs in `deploy/nginx/` are a
*record*, not a deployment — nothing installs them, and the production deploy
key cannot (its forced command only publishes `dist/`). A change there is not
live until someone scp's it and reloads, and a change made on the host is not in
the repo until someone pulls it back.

`src/nginxRoutes.test.ts` keeps the route list in the snippet in step with
`routePaths`, so at least that drift fails in CI. Nothing yet detects the repo
copy and the host disagreeing in other ways.
