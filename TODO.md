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

## Repeat purchase: fixed, but Billing's side is unconfirmed

Fixed 2026-08-09. The order idempotency key is now retired as soon as Billing
accepts the purchase — in `confirm`, `confirmQuote` and `renew` alike — rather
than when `CheckoutReturnPage` observes the invoice settle. That closed all
three situations which used to leave it alive: payment outlasting the 30s poll,
the customer never reaching the return page, and `payment_url` coming back
missing (which threw before the key could be tied to an invoice, orphaning it
for the tab's lifetime).

`src/api/useCheckout.test.tsx` covers the *lifetime*, which is where the bug
lived; the key-building functions alone would have tested green throughout.
Verified by removing the fix and watching four of five fail, including a second
identical order receiving the same key.

**Cost accepted:** backing out of the gateway and confirming again now opens a
second invoice instead of replaying the first. The unpaid one expires; the
double-submit guard is the confirm button disabling while in flight. This was
the deliberate trade for "two orders must always give two servers".

**Still unconfirmed on Billing's side**, and worth answering before considering
this closed:

- Is the idempotency key scoped per customer or per installation? Global scoping
  would make two customers' keys collide in principle.
- How long does Billing remember a key? A short TTL changes how much of the
  original damage was possible.
- Does a replayed response return `payment_url` for an already-paid invoice?
  That would send a customer to pay a bill that is settled.
- From the logs of 2026-08-08: how many invoices and subscriptions were created,
  and was there any attempt to capture payment twice against one invoice?

Full write-up for handoff: https://claude.ai/code/artifact/fe0f706e-4069-4f61-8c42-a501e42e7d74

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
