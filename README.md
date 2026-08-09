# hotvds.com — storefront

The VDS/VPS storefront and customer account for hotvds.com. React + TypeScript + styled-components,
fully responsive, bilingual (RU/EN) with URL-based language routing. The visual direction is bright
and "optimistic" on purpose, as a contrast to the darker references it was benchmarked against
(vdsina.com, vultr.com, hetzner.com).

**This sells real plans.** It began as a design prototype on mock data and is no longer one: prices,
packages, subscriptions and invoices come from Billing at `bl.hotvds.com`, sign-in is a real ZITADEL
session, and confirming an order registers a payment. Treat every change to `src/api/` as a change
to a money path.

What is still mock, and where: `src/data/datacenters.ts` (locations and their rollout state) and
`src/data/instances.ts`. `src/data/tariffs.ts` supplies shape and copy, while the prices themselves
come from the catalogue. Several marketing pages ship structure with `__ТЕКСТ_ОТ_VICTOR__` where a
company fact belongs — see the note under Pages.

Known gaps live in `TODO.md`; security findings in `SECURITY-TODO.md` (branch `security-backlog`).

## Stack

- **Vite + React 19 + TypeScript**
- **styled-components** for styling, theme tokens in `src/theme/`
- **React Router** for routing, including `/:lang` language-prefixed URLs
- Self-hosted fonts via `@fontsource/*` (Manrope, Inter, JetBrains Mono) — no external font CDN

## Pages

| Route | Page |
|---|---|
| `/:lang` | Home — hero, value props, tariff teaser, datacenters, testimonials, FAQ |
| `/:lang/pricing` | Pricing & VPS configurator (live price calculator + tariff comparison) |
| `/:lang/datacenters` | The five locations, grouped live vs coming soon (from `src/data/datacenters.ts`) |
| `/:lang/status` | Location readiness and the serving build. Measures nothing — there is no monitoring |
| `/:lang/knowledge-base` | The FAQ answers already published on `/` and `/pricing`, plus guide stubs |
| `/:lang/api` | Scaffold — there is no public API yet |
| `/:lang/about`, `/:lang/blog`, `/:lang/partners`, `/:lang/contacts` | Scaffolds awaiting company facts |
| `/:lang/terms` | Terms of Service scaffold, shared with the checkout dialog |
| `/:lang/dashboard` | The customer's own servers, from Billing. Requires a session; no marketing chrome |
| `/:lang/dashboard/new` | Order another server without leaving the account — same configurator and `/checkout` as `/pricing` |
| `/:lang/dashboard/support` | Technical support. Opens the Chatwoot chat once it is configured |
| `/:lang/admin` | Staff view of storefront sign-ups. Gated by the `hotvds_admin` role |
| `/:lang/checkout`, `/:lang/checkout/return` | Order confirmation and payment-gateway return. No layout of their own |
| `/callback` | ZITADEL OIDC redirect. Deliberately outside `/:lang` — the registered redirect URI has no locale |

`:lang` is `en` or `ru`. `/` redirects to `/en` (default language). An unrecognized language segment
also redirects to `/en`; an unknown path *under* a valid language renders the localized not-found
page instead, keeping the visitor's language. See `src/i18n/paths.ts` and
`src/components/layout/LangGate.tsx`.

Adding a route means three places, not one: `routePaths` in `src/i18n/paths.ts`, a `<Route>` in
`src/routes.tsx`, and the nginx snippet in `deploy/nginx/` (plus the host — see that directory's
README). Miss the last and the page renders perfectly in a browser while answering 404 to crawlers;
`src/nginxRoutes.test.ts` fails when the two lists disagree.

Every marketing page above except the home and pricing pages ships its structure with the text
still missing, marked `__ТЕКСТ_ОТ_VICTOR__`. That is deliberate and follows `src/pages/TermsPage.tsx`:
company facts — the legal entity, its details, contact addresses, SLA figures — read as settled once
written down, so inventing them is worse than leaving a named gap. The footer is the site map, and
`src/components/layout/footerLinks.ts` is what pairs each footer label with its route.

## Design system

Tokens live in `src/theme/tokens.ts`:

- **Colors**: warm off-white backgrounds, coral/orange accent (`#FF5A1F`) for primary CTAs, deep
  indigo (`#2E3192`) for headings/technical credibility, mint (`#22C486`) for positive signals
  (uptime, "online" status).
- **Typography**: Manrope (headings/buttons), Inter (body), JetBrains Mono (CPU/RAM/SSD spec badges).
- **Breakpoints**: 480 / 768 / 1024 / 1280px, mobile-first, via the `media` helper in
  `src/theme/breakpoints.ts`.

## Pricing

**Billing prices everything; the browser never states an amount.** The catalogue supplies the five
ready-made plans (`useTariffs`), and a configured VDS is priced by asking Billing for a quote
(`createQuote`) rather than by multiplying anything client-side. Editing a request from the console
changes *which* package is bought, not what it costs — the invoice is priced server-side from the
package code.

`src/data/tariffs.ts` still supplies the shape and copy the cards are rendered from, and the
per-unit rates it carries are what the configurator shows *while a quote is in flight*. Only
`STOREFRONT_CURRENCIES` in `src/api/config.ts` is chargeable today (RUB); the catalogue holds more.

## Datacenters

`src/data/datacenters.ts` — Amsterdam is the only `live` location; the rest are `comingSoon`
(shown grayed out with a "Launching soon" badge) across the home page and the pricing
configurator's datacenter select.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build       # type-checks (tsc -b) then builds to dist/
npm test            # Vitest — the same suite CI runs
npm run lint        # oxlint
npx tsc --noEmit -p tsconfig.app.json   # type-check only
```

Several tests exist to catch what the type system cannot: that every footer link resolves to a
registered route, that RU and EN dictionaries stay structurally identical, that the nginx route list
matches `routePaths`, that the status page never prints a percentage, and that a checkout
idempotency key does not outlive the purchase that created it. If one of those fails, read its doc
comment before changing the assertion — each records a bug that actually shipped.

## Live chat and support

`src/support/chatwoot.ts` holds two empty constants. Fill in `CHATWOOT_BASE_URL` and
`CHATWOOT_WEBSITE_TOKEN` and the Chatwoot widget appears on the marketing pages and in the account's
Support section with no code change; leave either blank and no third-party script loads at all.
Neither is a secret — the website token identifies an inbox.

The chat is anonymous, and stays that way until there is somewhere server-side to sign an
`identifier_hash`. See the file's own note and `TODO.md` for why passing an unsigned identity would
be worse than staying anonymous.

## Deployment

Two environments on one host (167.179.34.32), separate document roots, separate deploy keys.
An nginx `stream{}` SNI router (`/etc/nginx/stream.d/stream.conf`) sends both hostnames to
127.0.0.1:8443, where the two vhosts are told apart by `server_name`.

That host is a gateway, and the storefront is one of six things on it: the same nginx fronts
Billing, the Payment Orchestrator, Provisioning and Chatwoot, each on its own VM on a private
segment. `deploy/gateway/README.md` documents the machine, its NAT and what that means for us.

### Staging — dev.hotvds.com

Every push to `main` deploys automatically (`.github/workflows/deploy-dev.yml`): build → rsync
`dist/` over an SSH key restricted to `rrsync -wo /var/www/dev.hotvds.com/dist`
(`DEV_DEPLOY_SSH_KEY` / `DEV_DEPLOY_HOST`). Served from `/var/www/dev.hotvds.com/dist`, with
`X-Robots-Tag: noindex, nofollow` and a blanket-disallow `robots.txt` so staging stays unindexed.

### Production — hotvds.com

Never deploys on a push. Ships on a `v*` tag or a manual **Run workflow**
(`.github/workflows/deploy-prod.yml`), which re-runs lint, types, tests, and build before
publishing. `dist/` goes over as a tar stream to an SSH key whose forced command is
`/usr/local/bin/hotvds-prod-deploy` (`deploy/hotvds-prod-deploy` in this repo) — that key gets no
shell and can only run `deploy` / `rollback` / `list` / `current`. Secrets: `PROD_DEPLOY_SSH_KEY` /
`PROD_DEPLOY_HOST`, connecting as the unprivileged `hotvds-deploy` user.

Layout, so a bad release can be undone in a second rather than rebuilt:

```
/var/www/hotvds.com/releases/<utc-timestamp>-<ref>/   last 10 deploys
/var/www/hotvds.com/current -> releases/<...>         nginx root
```

The upload is unpacked to a staging directory and checked for `index.html` and `assets/` before
the symlink is swapped, so a truncated build cannot replace a working site.

```bash
ssh -i <key> hotvds-deploy@<host> list       # releases, newest first, live one marked
ssh -i <key> hotvds-deploy@<host> rollback   # repoint current/ at the previous release
```

> Before 2026-08-06 the production vhost had `root /var/www/dev.hotvds.com/dist` — the same
> directory as staging — so every merge to `main` went straight to customers with no staging step.

**DNS caveat:** `dev.hotvds.com` is not yet a real public DNS record — it currently only resolves
on networks that have a private/VPN override for it. Add an A record for `dev.hotvds.com` →
the server IP in the `hotvds.com` Cloudflare zone for the site to be reachable publicly.
