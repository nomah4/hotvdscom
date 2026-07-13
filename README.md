# hotvds.com — design prototype

A bright, "optimistic" VDS/VPS hosting design prototype, built as a contrast to the darker/stricter
references it was benchmarked against (vdsina.com, vultr.com, hetzner.com). React + TypeScript +
styled-components, fully responsive, bilingual (RU/EN) with URL-based language routing.

No backend — every page uses mock data (`src/data/*`). This is a design/frontend prototype, not a
production hosting control panel.

## Stack

- **Vite + React 19 + TypeScript**
- **styled-components** for styling, theme tokens in `src/theme/`
- **react-router-dom** for routing, including `/:lang` language-prefixed URLs
- Self-hosted fonts via `@fontsource/*` (Manrope, Inter, JetBrains Mono) — no external font CDN

## Pages

| Route | Page |
|---|---|
| `/:lang` | Home — hero, value props, tariff teaser, datacenters, testimonials, FAQ |
| `/:lang/pricing` | Pricing & VPS configurator (live price calculator + tariff comparison) |
| `/:lang/products/gpu-servers` | GPU server product page |
| `/:lang/dashboard` | Mock authenticated console (instances, billing) — no marketing chrome |

`:lang` is `en` or `ru`. `/` redirects to `/en` (default language). An unrecognized language segment
also redirects to `/en`. See `src/i18n/paths.ts` and `src/components/layout/LangGate.tsx`.

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
(shown grayed out with a "Launching soon" badge) across the home page, GPU product page, and the
pricing configurator's datacenter select.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build       # type-checks (tsc -b) then builds to dist/
npx tsc --noEmit -p tsconfig.app.json   # type-check only
```

## Deployment

Pushes to `main` auto-deploy to **dev.hotvds.com** via GitHub Actions
(`.github/workflows/deploy-dev.yml`): build → rsync `dist/` to the server over a dedicated,
rsync-only-restricted SSH deploy key (see `DEV_DEPLOY_SSH_KEY` / `DEV_DEPLOY_HOST` repo secrets).

Server-side: `dev.hotvds.com` is served by nginx from `/var/www/dev.hotvds.com/dist`
(`/etc/nginx/sites-available/dev.hotvds.com` on the host), with `X-Robots-Tag: noindex, nofollow`
and a blanket-disallow `robots.txt` so the staging environment doesn't get indexed.

**DNS caveat:** `dev.hotvds.com` is not yet a real public DNS record — it currently only resolves
on networks that have a private/VPN override for it. Add an A record for `dev.hotvds.com` →
the server IP in the `hotvds.com` Cloudflare zone for the site to be reachable publicly.
