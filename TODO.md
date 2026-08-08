# TODO

Known gaps, with enough context to pick them up cold. Security findings live in
`SECURITY-TODO.md` (branch `security-backlog`).

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

## Soft 404

`NotFoundPage` renders for unknown paths under a valid language, but nginx
answers 200 with the SPA shell for any path, so crawlers are never told a page
is missing. Fixing it is server-side work, outside this repo.
