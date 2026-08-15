# TODO

Known gaps, with enough context to pick them up cold. Security findings live in
`SECURITY-TODO.md` (branch `security-backlog`).

## Прод витрины отстаёт от `main`, и теперь это ломает кнопки

Прод отдаёт сборку из **`47e75f0`** (ветка `feat/rename-servers`, ручной выкат 2026-08-12), а
`main` ушёл вперёд на два PR. Оба нужны прямо сейчас:

- **#42 `fix(vds): send an idempotency key with every machine action`.** Биллинг требует
  `X-Idempotency-Key` для `power`, `reboot`, `delete` и `restore` с `d18b525`; прод-сборка его не
  шлёт. До 15 августа это было безобидно — у клиентов не было машин. **Теперь есть**, и все
  четыре кнопки отвечают `400 missing_idempotency_key`.
- **#41** — цены в USD англоязычным. В прод-бандле строки `USD` нет вовсе.

- [ ] Выкатить `main` в прод (`Deploy hotvds.com (production)`, `workflow_dispatch`)
- [ ] Решить, что делать с практикой выката с фичевых веток: прод и `main` разошлись 12 августа
      именно так

## 2026-08-15: клиентские машины появились на боевом железе

Четыре оплаченных заказа собраны на `pve-58665`, 13 продлений расшились. Разбор и остаток —
в `../provisioning-engine/TODO.md`, раздел «2026-08-15». Отсюда важно одно: **кабинет перестал
быть витриной обещаний**. Всё, что там нарисовано кнопкой, теперь действует на настоящую машину
настоящего клиента.

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

**Поправка от 2026-08-15: подписки создаются.** Все четыре оплаченных счёта этого дня дали
подписку сразу же, включая тот, что пришёл в 08:50 без чьего-либо участия. Симптом «клиент платит
и не получает ничего» с 11 августа держался на другом: подписка была, а машины не было —
провижен отказывал. Это разобрано и починено, см. `../provisioning-engine/TODO.md`.

Что от этого пункта остаётся:

- [ ] **17 исторических счетов без подписки** (с 20 июля) — их никто не разбирал, и они по-прежнему
      висят в `billing_core_reconciliationissue` как `subscription_active_without_po_capture`
      вместе с 17 импортированными. Разделить одно от другого и закрыть с пометкой
- [ ] **`auto_recovered` всё ещё 0** — почему сверка видит расхождение и ничего не делает,
      по-прежнему не выяснено

## Гигиена очередей в биллинге

Найдено 2026-08-15 при разборе. Ничего не горит, но каждый пункт — шум, в котором тонет настоящее.

- [ ] **36 открытых `manualreviewcase`.** Два `resource_mismatch` закрываются как решённые
      (каталог выровнен, машины собраны), 14 `unknown_package_code` — тоже (конфигурируемый тариф
      заведён 15 августа), 17 `subscription_active_without_po_capture` — артефакт импорта партии
      `legacy-prod-2026-08-11`, закрывать с пометкой
- [ ] **3 `payment_state_mismatch`** — платежи ЮMoney, зависшие в `pending` с 20 июля и
      10 августа (4400, 4400 и 900 ₽). Клиент ушёл со страницы оплаты, а PO так и не перевёл их в
      финальное состояние. Это не запись, которую надо закрыть, а дырка в PO: платёж без срока
      жизни живёт вечно
- [ ] **Подписка `cc77a7d2` из партии `ui-smoke-test-2026-08-06`** — `expired`, но `pr` до
      15 августа исправно пытался её провизить. Её «конфигурация» описывает уже существующую
      машину `vm2-167-179-34-16`, которая в движке принадлежит другой подписке. Закрыть, а не
      чинить: вторая машина ей не нужна

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

**Сделано 2026-08-12.** `display_name` на подписке, `POST /server/display-name`,
карандаш на карточке; заголовком стало имя клиента, тариф ушёл во вторую строку,
а окно продления показывает и то и другое. Ниже — спецификация, по которой это
строилось; оставлена как запись решений, а не как задача.

The dashboard titles every card with the **plan** name — `SubscriptionListItem.tsx`
computes `tariff?.name ?? customPlan ?? package_code ?? unknownPlan` and renders
it as the heading. Two servers on the same plan are therefore identical on
screen apart from their expiry date, and there is no way to tell "prod" from
"staging". The design always assumed per-server names: `src/data/instances.ts`
still carries the mock `prod-api-01`, `staging-web`, `db-replica-02` it was
prototyped with. The real data model never got the field.

Decided: the name is stored in Billing, not in the browser. A name kept in
`localStorage` disappears on the customer's second device and after a cache
clear, which for a hosting panel reads as lost data. Decided too: the customer's
name becomes the card title and the plan moves to a secondary line under it —
the plan name is a separate thing, not something the name replaces.

### What to build in Billing

A nullable `display_name` (`varchar(64)`) on Subscription. **It holds the string
the customer typed.** It is never derived from the package, never defaulted from
`Package.display_name`, and never written by anything but the endpoint below —
`ApiPackage.display_name` already exists and means "the plan's name", so a
denormalised copy of the plan name would look right in every response and be a
read-only field that does nothing.

Not inside `configuration`: that object is *priced* — `createQuote` sends it and
Billing computes money from it. Free customer text does not belong on the object
a price is derived from.

```
PUT /api/v1/subscriptions/{subscription_id}/display-name
Authorization: Bearer <access token>

{ "tenant_id": "vivi23", "project_code": "hotvds", "display_name": "prod-api-01" }
```

A dedicated sub-resource rather than `PATCH /subscriptions/{id}`: a generic
PATCH opens a write surface onto a money object, and the next caller sends
`valid_until` or `package_code` in the same body. This route has one
authorization rule — the token subject owns the subscription — and no field
allowlist to maintain. `tenant_id` / `project_code` are redundant but every
existing write sends them; validate them against the subscription so a
cross-tenant id fails loudly rather than passing quietly.

**Do not require `X-Idempotency-Key`.** A PUT of one scalar is idempotent
already, and a stale key on an idempotent write is actively harmful: Billing
replays the stored response, so the customer's *second* rename returns 200 with
the *first* name and the dashboard shows a save that did not happen. If the
idempotency middleware is global, exempt this route.

Validation, in order: reject a non-string, non-null body (400
`invalid_display_name`); trim; **empty after trim stores `NULL`** — an emptied
box is how a person says "remove the name", which is also why there is no
`DELETE` route; normalise to NFC, or composed and decomposed `й` are two names
that render identically; cap at **64 code points** (DNS-label convention, fits
the card's 240px name cell, and `prod-api-01` is 11). Reject control characters
(`U+0000–001F`, `U+007F–009F`), `U+2028`/`U+2029`, and bidi controls
(`U+202A–202E`, `U+2066–2069`) — the last let a stored name render as something
other than what it is, on a page that also renders money. Allow everything else:
this is a bilingual storefront and «Прод-база» is normal input, not an edge
case. Do not reject `<`, `>`, `&` — React escapes on render; the matching
obligation is that Billing escapes the value if it ever reaches an HTML email or
the admin panel. No uniqueness constraint: this is a personal label,
`subscription_id` stays the identifier.

**Return the stored, normalised value** — `{subscription_id, display_name}` —
not an echo and not `204`. Trimming and NFC happen server-side, so an echo
leaves the browser showing a string the server does not have. This is what lets
the storefront patch its one row instead of refetching the list; choosing `204`
costs a refetch.

Errors in the usual `{"error": {code, message}}` envelope: 400
`invalid_display_name`, 404 `subscription_not_found`, 422 `user_mismatch`, 422
`tenant_mismatch` / `project_mismatch`. `user_mismatch` at 422 matches what
`createRenewal` already returns for the same condition, so one mapping covers
both paths.

`GET /api/v1/subscriptions` must return `display_name` on **every** row, `null`
when unset — serialised as `null`, not omitted, because the storefront detects
support by the key's presence (below). **The field must not appear in `GET`
before `PUT` is live**, or the rename control switches itself on against an
endpoint that 404s.

Out of scope, stated so it is not added helpfully: `display_name` does not go on
invoices, receipts or `renewal-preview` — an invoice is a legal document and a
customer-editable string does not belong on one. Renewal extends the existing
subscription row, so the name survives on its own; but if any capture path
*recreates* a subscription rather than extending it, the name has to be carried
across. Worth checking, given the top item in this file.

### What changes on this side once it exists

Nothing needs to be redeployed to turn it on — the storefront should read the
capability off the response shape (`rows.every(r => 'display_name' in r)`,
checked on the raw JSON before it is narrowed to `Subscription`) and gate the
control the way renewal is already gated: `useSubscriptions` exposes
`canRename`, `DashboardPage` passes `onRename` only when it is true, and
`SubscriptionListItem` renders the pencil only when `onRename` is present. On
today's Billing that means no pencil, no note, no disabled affordance — the card
renders exactly as it does now. Unlike the balance tile, there is nothing here
the customer is owed an explanation for.

Two things are worth doing in the same change:

- The `planName` fallback chain is duplicated in `SubscriptionListItem.tsx` and
  `DashboardPage.tsx`, with a comment on each saying the two must never
  disagree. Adding a second rule on top of a duplicated chain triples the
  exposure — resolve title and secondary line in one pure module.
- `RenewalConfirmModal` names the server by its plan. Once a card can be titled
  "prod-api-01", the confirm step for a **charge** would stop showing which plan
  is being paid for unless the modal gains a separate plan row.

No optimistic update: the title changes only from the 200 response body.
A rename that failed must not leave a name on screen the server does not have.

**Unconfirmed, and not checkable from this repo:** whether `PUT` survives CORS
and the reverse proxy on `bl.hotvds.com` — every request today is GET or POST,
and a preflight missing `PUT` surfaces in the browser as a network error with no
body rather than a clean 405 (fallback: `POST` on the same path); whether the
idempotency middleware is global; whether `GET /api/v1/subscriptions/{id}`
exists and needs the field too. The 64-character cap is a reasoned convention,
not a measurement.

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

Расхождение и правда накопилось: к 2026-08-12 `stream.conf` отставал на три
записи, а `admin-proxy.conf` — файл, обслуживающий `bl`, `po`, `pr`, `chat`,
`pv` и теперь `console`, — не был здесь вовсе. Оба подтянуты с хоста. Это
второй раз за четыре дня, и ручная сверка от третьего не спасёт: нужна либо
роль в ansible, либо проверка в CI, которая ходит на шлюз и сравнивает.
