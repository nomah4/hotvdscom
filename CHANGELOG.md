# Changelog

All notable changes to this project are documented in this file.

## 2026-07-13

### Added
- Initial hotvds.com design prototype: React + TypeScript + styled-components, 4 pages (Home,
  Pricing, GPU product, Dashboard), responsive at 480/768/1024/1280px breakpoints.
- Bright "optimistic" design system (coral accent, indigo headings, mint positive-signal color),
  deliberately distinct from vdsina.com/vultr.com/hetzner.com references.
- Bilingual RU/EN content via `src/i18n`, with `/en` and `/ru` URL-prefixed routing
  (`src/components/layout/LangGate.tsx`, `src/i18n/paths.ts`). `/` redirects to `/en` (default).
- Interactive VPS configurator (CPU/RAM/SSD sliders with live price calculation) on the Pricing page.
- Datacenter status system: Amsterdam is the primary/live location; Moscow, Frankfurt, Istanbul,
  and Singapore are shown grayed out as "coming soon" everywhere a datacenter is listed (home,
  GPU product page, pricing configurator's datacenter select).
- GitHub Actions auto-deploy (`.github/workflows/deploy-dev.yml`): every push to `main` builds the
  app and rsyncs `dist/` to `dev.hotvds.com` over a dedicated, directory-restricted SSH deploy key.
- `dev.hotvds.com` nginx vhost on the deploy server: serves the SPA with `try_files` fallback,
  sends `X-Robots-Tag: noindex, nofollow, noarchive`, and serves a blanket-disallow `robots.txt` —
  so the staging environment stays out of search indexes independent of the app's own build.

### Fixed
- Mobile menu overlay rendered semi-transparent (hero content bled through) because it was nested
  inside a header with `backdrop-filter`, which creates a CSS containing block for its
  `position: fixed` children — moved the mobile nav outside the header.
- Dashboard instance rows overflowed into the balance sidebar under `flex-wrap: nowrap` at narrower
  desktop widths (flex children refusing to shrink below content size) — switched to a wrapping
  layout with `min-width`/`max-width` and ellipsis truncation on the instance name.
- Production build (`tsc -b && vite build`) failed: the `styled-components` v6 theme augmentation
  file wasn't picked up by TypeScript because it shared a basename with `theme.ts` in the same
  directory — renamed to `src/styled.d.ts`. Also removed the conflicting `@types/styled-components`
  (a v5-era package) that shadowed styled-components' own bundled types.
- Bilingual dictionary typing required English strings to literally equal the Russian ones (`as
  const satisfies typeof ruDict` forced identical literal types) — added `DeepWiden<T>`
  (`src/i18n/deepWiden.ts`) so English copy only has to match the Russian dictionary's *shape*.
- Footer column links (Продукт/Компания/Поддержка) were plain `<li>` text with no `href` — now
  real links, wired to `/pricing` and `/products/gpu-servers` where a page exists.
- Ready-made tariff cards (Start/Basic/Pro/Business/Ultra) had prices hardcoded independently of
  the configurator's per-unit rates, so they could silently drift out of sync — both are now
  derived from the same `pricePerUnit` constants in `src/data/tariffs.ts`.
- Datacenter city/country names (and the dashboard's server region) always rendered in Russian
  regardless of the selected language — `DatacenterBadge` now takes the `Datacenter` object and
  picks `city`/`cityEn` itself based on the active language.

### Changed
- Pricing configurator base rate: 1 vCPU / 2 GB RAM / 10 GB NVMe = $10/mo (`pricePerUnit` in
  `src/data/tariffs.ts`); slider minimums adjusted to match (RAM from 2 GB, SSD from 10 GB).
- OS options in the configurator: added Ubuntu 26.04 (now default) and Debian 13 alongside the
  existing Ubuntu 24.04 / Debian 12 / CentOS Stream 9 / Windows Server 2022.
