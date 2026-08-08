# hotvds.com — design prototype

A bright, "optimistic" VDS/VPS hosting design prototype, built as a contrast to the darker/stricter
references it was benchmarked against (vdsina.com, vultr.com, hetzner.com). React + TypeScript +
styled-components, fully responsive, bilingual (RU/EN) with URL-based language routing.

No backend — every page uses mock data (`src/data/*`). This is a design/frontend prototype, not a
production hosting control panel.

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
| `/:lang/dashboard` | Mock authenticated console (instances, billing) — no marketing chrome |

`:lang` is `en` or `ru`. `/` redirects to `/en` (default language). An unrecognized language segment
also redirects to `/en`; an unknown path *under* a valid language renders the localized not-found
page instead, keeping the visitor's language. See `src/i18n/paths.ts` and
`src/components/layout/LangGate.tsx`.

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

## Pricing model

`src/data/tariffs.ts` derives both the configurator's per-unit price *and* the five ready-made
tariff cards (Start/Basic/Pro/Business/Ultra) from the same `pricePerUnit` rates, so they can't
drift out of sync. Base config: 1 vCPU / 2 GB RAM / 10 GB NVMe = $10/mo.

## Datacenters

`src/data/datacenters.ts` — Amsterdam is the only `live` location; the rest are `comingSoon`
(shown grayed out with a "Launching soon" badge) across the home page and the pricing
configurator's datacenter select.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build       # type-checks (tsc -b) then builds to dist/
npx tsc --noEmit -p tsconfig.app.json   # type-check only
```

## Deployment

Two environments on one host (167.179.34.32), separate document roots, separate deploy keys.
An nginx `stream{}` SNI router (`/etc/nginx/stream.d/stream.conf`) sends both hostnames to
127.0.0.1:8443, where the two vhosts are told apart by `server_name`.

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
