# Changelog

All notable changes to this project are documented in this file.

## 2026-08-08

### Added

**Customers can renew a server they already own.** The dashboard had no way to pay for an existing
server: buying the plan again hands the customer a *second* one, because the purchase policy is
`separate`. A per-card Renew button now drives Billing's `POST /api/v1/subscriptions/<id>/renewals`,
which creates the `SubscriptionRenewal` link the capture path needs, so the payment extends that
exact subscription rather than starting another.

- Billing locks the row, returns an existing unpaid renewal instead of duplicating it, and continues
  the term from the current `valid_until` rather than from today — so renewing early loses no paid
  time. Idempotency is scoped per subscription, so renewing server A never replays server B.
- One invoice per subscription, not one bill for all of them. Billing's capture path reads exactly
  one invoice line (`services.py:1106` `.get()`), so a combined "pay for all 10" invoice would be a
  change to the money path; renewing per server is not.
- **Configurable servers renew too.** The button was first gated to catalogue tariffs, because
  Billing could not price a configurable renewal at all — which excluded the customers who actually
  have servers, since every legacy-imported subscription is `VDS_CUSTOM_MONTHLY`. Billing can now
  (`create_renewal_quote`), so the gate is off. The price comes from the new read-only
  `GET /api/v1/subscriptions/{id}/renewal-preview`: the amount is not knowable client-side —
  `GET /subscriptions` returns no money data by design, and a Custom VDS has no catalogue price,
  only a pricing rule applied to the configuration it recorded. Billing still prices the invoice
  itself, so the previewed figure never decides what is charged.
- The remaining condition is Billing's own: active subscriptions only, since it answers
  `subscription_not_renewable` for anything else.

Two caveats worth keeping in view. This does not make real payment possible — YooKassa is still in
test mode on this install. And the renewal path ships with **no tests of its own**; the suite that
passes around it does not exercise it, so its correctness rests on review and on Billing's
guarantees rather than on CI.

**Every footer link now leads to a real page.** Nine of the eleven rendered as `to="#"`; the footer
is the site map, so those were pages nobody could reach. New routes: `/datacenters`, `/status`,
`/knowledge-base`, `/api`, `/about`, `/blog`, `/partners`, `/contacts`. "Контакты" and "Связаться с
нами" are two entrances to one `/contacts` page — a second route would be a second copy of the
contact details, and the two would drift.

- `/datacenters` and `/status` are real: both read `src/data/datacenters.ts`, the same array the
  home page and the configurator use, and the group counts are derived from it rather than typed
  into the copy. `/knowledge-base` gathers the FAQ answers already published on `/` and `/pricing`,
  so it makes no new claim.
- `/status` deliberately reports no uptime figure, no "all systems operational" and no incident
  history: there is no monitoring backend, and a percentage on a status page is a number customers
  hold you to. It states that it measures nothing, shows location readiness and the serving build.
  `StatusPage.test.tsx` fails if a percentage ever appears.
- The remaining pages ship structure with `__ТЕКСТ_ОТ_VICTOR__` placeholders, following
  `TermsPage`: the legal entity, its details, contact addresses and partner terms are commitments,
  not copy, and an invented support address is worse than a marked gap — someone would write to it.

**A localized not-found page.** `/:lang` had no fallback of its own, so a mistyped `/ru/datacentres`
fell through to the global catch-all and redirected to `/en`, discarding both the address and the
visitor's language. A splat inside the marketing layout now catches it with the header and footer
intact. It does not echo the requested address. Note this stays a *soft* 404 — nginx answers 200
with the SPA shell for any path.

### Changed

**Footer labels and destinations are matched by key, not by array position.** `footerLinkPaths` was
a parallel array indexed against the dictionary's `links`, so inserting a label in the middle
silently re-pointed every link after it — and compiled. `links` is now a keyed object and
`src/components/layout/footerLinks.ts` closes the map with `satisfies Record<FooterLinkKey, string>`:
a label with no destination fails the Record constraint, a destination with no label fails the
excess-property check. Verified by deleting a key and watching `tsc` reject it (TS1360). The
`to="#"` fallback is gone — an inert footer link is no longer expressible.

The footer copyright drops "— дизайн-прототип" / "— design prototype"; the site sells real plans.

## 2026-08-06

### Changed

**Staging and production are now separate environments.** They were not before: the `hotvds.com`
vhost carried `root /var/www/dev.hotvds.com/dist` — the very directory the staging workflow rsyncs
into. Both hostnames served the same files, so every merge to `main` published straight to
customers, `dev.hotvds.com` was only a second hostname with `noindex` headers rather than a place
to check anything, and `rsync --delete` overwrote the live site in place with no previous build
left to fall back to. Confirmed on the host, not inferred: both configs in
`/etc/nginx/sites-available/` held the same `root`, and both hostnames served byte-identical
bundles.

- Production serves `/var/www/hotvds.com/current`, a symlink into timestamped release directories
  (last 10 kept). Staging keeps `/var/www/dev.hotvds.com/dist` and is otherwise untouched. An
  nginx `stream{}` SNI router (`/etc/nginx/stream.d/stream.conf`) still sends both hostnames to
  127.0.0.1:8443, where `server_name` tells the two vhosts apart.
- The cutover seeded the new root with a byte-identical copy of what was already live, so not one
  served byte changed at the switch. Backups of the vhost and `authorized_keys` are on the host at
  `/root/backup-*.20260806055354`.
- `deploy-prod.yml` ships production, and never runs on a push: it triggers on a `v*` tag or a
  manual dispatch, and re-runs lint, types, tests, and build first, because a tag can point at a
  commit no pull request ever saw. `main` still auto-deploys to staging via `deploy-dev.yml`.
- Rollback is a symlink swap rather than a rebuild from an old commit:
  `ssh -i <key> hotvds-deploy@<host> rollback`. `list` shows the releases with the live one marked.
- The production deploy key is pinned to a forced command (`deploy/hotvds-prod-deploy`, installed
  at `/usr/local/bin/`) and runs as the unprivileged `hotvds-deploy` user, so it gets no shell and
  can only deploy, roll back, or list. The build arrives as a tar stream on stdin, is unpacked to a
  staging directory outside `releases/`, and is checked for `index.html` and `assets/` before the
  symlink moves — a truncated upload leaves the running site untouched instead of replacing it
  with a 404. Verified on the host: `id`, `rm -rf /var/www`, and an interactive login are all
  refused; a path-traversal attempt in the release label is sanitised away.
- `hotvds.com` serves a real `robots.txt`. Previously `/robots.txt` fell through `try_files` and
  answered 200 with the SPA shell.
- Still outstanding: the staging deploy key remains `rrsync`-restricted but connects as `root`,
  unlike production's unprivileged user; and `deploy-prod.yml` declares `environment: production`
  but that environment is not configured in repository settings, so no reviewer approval is
  required before a production deploy.

### Added
- Test suite — Vitest + Testing Library + jsdom, `npm test` / `npm run test:watch` — and a `CI`
  workflow running lint, type check, tests, and build on every pull request. Until now the only
  automated check was `tsc --noEmit` inside the deploy workflow, which fires on push to `main`, so
  a branch merged with nothing verified and types were checked on the way to the server rather
  than before the merge. `deploy-dev.yml` now runs the tests before shipping too.
- The tests deliberately target what the type system cannot reach:
  - `Footer` pairs labels to paths **by array index**, and neither array is length-typed, so
    deleting an entry from one silently re-points the remaining links at the wrong pages.
  - The EN dictionaries are `satisfies DeepWiden<typeof ru*>`, which catches a missing key but not
    a missing array *element* — one dropped FAQ item ships a page that says different things per
    language. Compared structurally instead, array lengths included.
  - A guard that no trial or GPU claim reappears in the dictionaries, and that the retired GPU URL
    resolves through the catch-all to the home page.
- Two environment quirks worth knowing before writing more tests, both commented at the assertion
  that depends on them: react-router resolves `to="#"` against the current location, so the
  footer's inert links render with the current path rather than a literal `#`; and jsdom does not
  evaluate media queries, so the desktop nav keeps its mobile-first `display: none` and needs
  `hidden: true` to be queryable.

### Removed
- GPU server product page (`/:lang/products/gpu-servers`) and everything wiring it up: the route,
  the `product` i18n namespace, the mock `gpuTiers` table, and the header/footer nav entries.
  Nothing GPU-shaped crosses the Billing API — `ApiPackageMetadata` carries only cpu/ram/ssd/traffic
  — so the page advertised NVIDIA T4/L4/A100 plans that could not be bought; both of its
  "Order a GPU server" buttons dropped the visitor into the ordinary VDS configurator. The old URL
  now falls through to the catch-all redirect. Also drops the never-read `gpuAvailable` field from
  `src/data/datacenters.ts`.
- The "first 7 days free, no card required" trial offer, from the home page FAQ and the bottom CTA
  banner. Checkout charges immediately via Billing/YooKassa and no trial exists on the backend, so
  the claim was not deliverable. The banner's button is now "Запустить сервер" / "Launch a server".
  The separate 7-day *refund* answer on the pricing page is unaffected and stays.

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
