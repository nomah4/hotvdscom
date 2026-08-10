# TODO

Known gaps, with enough context to pick them up cold. Security findings live in
`SECURITY-TODO.md` (branch `security-backlog`).

## Paid invoices are not becoming subscriptions

**The most serious open item, and it is on Billing's side.** A customer pays and
receives nothing: the invoice reaches `paid`, no subscription is created, no
server appears.

Established from `billing_db` on X1 (10.0.1.11) on 2026-08-09, not inferred:

- Three invoices paid that day — two `VDS_START_MONTHLY`, one
  `VDS_BASIC_MONTHLY`. **Zero new subscriptions created.**
- Across the whole database, **17 paid invoices have no subscription**
  (`source_invoice_id` unmatched), spread over every package: START 7, BASIC 3,
  PRO 3, BUSINESS 2, ULTRA 2. Earliest 2026-07-20, so this has been live for
  three weeks at least.

**This corrects an earlier diagnosis in this file.** The storefront's idempotency
key was a real defect and is fixed, but it was never the cause of "I cannot buy a
second identical server". A replayed key returns the original invoice and creates
no new row; the two same-package purchases on 9 August are two distinct rows with
distinct ids. No replay happened, before or after the fix.

**To finish:** the payment-capture path in Billing — why `paid` does not produce
a subscription. Not fixable from this repo.

**Billing's own reconciliation already flags this, and does not act on it.**
`billing.reconcile_recent_final_payments` runs every 15 minutes and reported
`{'checked': 10, 'in_sync': 3, 'auto_recovered': 0, 'state_updated': 0,
'issue': 7}` — it was `issue: 4` before the three purchases on 9 August and
`issue: 7` after, exactly +3. So the payments are detected as out of sync with
Billing's own state, and nothing recovers them.

That is the thread to pull: what `issue` means in that task, and why
`auto_recovered` is always 0.

Logs are at `/var/www/bl/shared/logs/` on X1 — `access.log`, `error.log`
(structured JSON with `request_id` and `correlation_id`), `worker.log`,
`beat.log`. An earlier version of this entry claimed there were none; that was
wrong, and came from checking `journalctl` and `/opt`, `/srv`, `/home` without
looking in `/var/www`.

Handoff document: https://claude.ai/code/artifact/fe0f706e-4069-4f61-8c42-a501e42e7d74

## Chat identity: the signing endpoint

The chat is live and every visitor in it is anonymous. Making a signed-in
customer recognisable needs one component that does not exist: somewhere
server-side to compute an HMAC.

**Why it cannot be done in the browser.** Chatwoot treats an identity as
verified only when `setUser` carries an `identifier_hash` — an HMAC-SHA256 of
the identifier, keyed with the inbox's HMAC key. Put that key in the bundle and
anyone can mint a signature for any identifier, which is the same as having no
signature at all. This storefront is a pure SPA with no backend of its own.

### What to build

An endpoint that takes the caller's ZITADEL access token and returns:

```json
{ "identifier": "<zitadel sub>", "identifier_hash": "<hex hmac-sha256>" }
```

Rules, in order of how badly each one breaks things:

1. **The identifier comes from the verified token, never from the request
   body.** An endpoint that signs whatever identifier it is handed produces
   valid signatures for false identities — no better than the unsigned call it
   replaces, and harder to notice because everything looks correct.
2. The identifier must be stable per user and never reused across users. The
   ZITADEL `sub` is that; email is not — addresses change hands.
3. `identifier_hash = HMAC_SHA256(inbox_hmac_key, identifier)`, hex-encoded.
4. The inbox HMAC key is a secret: it lives in Chatwoot under
   Settings → Inboxes → hotvds.com, and belongs in the server's secret store —
   never in this repo, never in a response body.

**Where it belongs:** Billing. It already validates ZITADEL tokens, so rule 1
comes for free. A small separate service is the alternative if adding a chat
concern to a money service is unwelcome. `njs` on the gateway is possible and
not advised — JWT validation there is easy to get subtly wrong and hard to see.

### What changes on this side once it exists

- `identifyInChat` in `src/support/chatwoot.ts` stops being an explanatory
  `null` and calls `setUser(identifier, { identifier_hash, email, name })`.
- `hotvds_identity` flips from `'unverified'` to `'verified'` — see
  `setChatSource`. The attribute exists so agents can see which they are talking
  to; it must not say `verified` until Chatwoot actually verified something.
- Conversations can then carry `subscription_id`, package and datacenter as
  custom attributes, which is what turns "my server is down" into a conversation
  that already knows which server.

### Already done, so nobody redoes it

`hmac_mandatory` is **true** on the inbox (set 2026-08-09). It was `false`, which
meant the widget's public API accepted `window.$chatwoot.setUser('anyone@example.com')`
from any visitor's console and dropped them into that contact's history. Our code
never called `setUser`, which protected nothing — the API is public regardless.

The consequence to keep in mind: until the endpoint exists, **no customer can be
identified at all**, because Chatwoot now rejects unsigned claims. That is the
intended state, and it is safer than the alternative.

### Also outstanding on the Chatwoot install

- Chat transcripts are personal data under 152-ФЗ; the terms covering that are
  still `__ТЕКСТ_ОТ_VICTOR__`.
- Agents, teams and business hours are not configured — the inbox has one
  administrator.

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

## A customer cannot name their own servers

Every server card is titled by its **plan**, never by the machine. `planName` in
`SubscriptionListItem` reads `tariff?.name`, falling back to "Custom VDS", then
to `package_code`. Nothing in that chain is per-server, so a customer who owns
several machines on one plan sees several identical cards.

This is not hypothetical and it is live today. `support@bot-t.com` has eight
servers, three of them identical 2 vCPU / 4 GB / 20 GB boxes — the operator
spreadsheet calls them "VPN-1", "VPN-2" and "VPN-3 for vpn.telegram.com", and
their dashboard renders three cards reading "Custom VDS · 2 vCPU / 4 GB / 20 GB"
with nothing whatsoever to tell them apart. `annadtd1@yandex.ru` has the same
problem across her three. Neither customer can answer "which one do I reboot?"

**The names already exist on our side and are unreachable.** The import recorded
`vm`, `ip`, `host` and `note` into `Subscription.operational_snapshot_json`, and
the spreadsheet's labels (`freeapi.bot-t.com`, `api.bot-t.com`, …) went into the
audit reason. But `subscription_summary()` in Billing's `services.py` returns
only `subscription_id`, `status`, `package_code`, `scope_type`, `valid_from`,
`valid_until`, `provisioning_status`, `auto_renew` and `configuration` —
`operational_snapshot_json` is **not serialized at all**. So the storefront could
not display a name today even if one were set, and there is no field a customer
could write to in the first place.

**To finish:** decide who owns the name, because the two answers are very
different amounts of work.

- *Read-only, admin-set.* Add a chosen **subset** of `operational_snapshot_json`
  to `subscription_summary()` and render it above the plan name. Smallest
  possible change. ⚠️ Serialize named keys, never the whole blob — it holds
  internal Proxmox identifiers (`vm2-167-179-34-8`) that are our infrastructure
  naming, not the customer's. The customer still cannot rename anything.
- *Customer-editable.* A real label needs a field, a `PATCH` endpoint on a money
  service, ownership enforcement (only the token subject may rename their own
  subscription — the same `external_user_id` check `subscriptions_view` already
  does), an audit entry, and a length/content limit. This is the first
  customer-originated **write** into Billing; every existing storefront call is a
  read or a purchase.

Until one of the two lands, do not invent a name client-side. A label derived
from position or from the specs would reorder itself whenever `list_user_subscriptions`
re-sorts (it orders by `-valid_until`), and a customer who reboots "server 2"
expecting yesterday's server 2 is the exact failure the placeholder controls
above are written to avoid.

Requested by Mikhail on 2026-08-10.

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

## Repeat purchase: the storefront half is fixed — but see the section above

Fixed 2026-08-09. **This was not the cause of the reported symptom** — that is
"Paid invoices are not becoming subscriptions" at the top of this file. The order idempotency key is now retired as soon as Billing
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
