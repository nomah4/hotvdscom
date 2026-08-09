# nginx configuration

Copies of what is actually serving hotvds.com and dev.hotvds.com, kept here so
the config has a history, a diff and a review — it had none of that while it
lived only on the host.

**These files are not deployed by anything.** No workflow and no script installs
them; the production deploy key is pinned to a forced command that can only
publish `dist/`, roll back, and list releases. Changing a file here changes
nothing until someone applies it by hand (below). Treat the repo copy as the
record, and re-pull after any change made on the host.

| File | Installed at |
|---|---|
| `hotvds.com.conf` | `/etc/nginx/sites-available/hotvds.com` |
| `dev.hotvds.com.conf` | `/etc/nginx/sites-available/dev.hotvds.com` |
| `snippets-hotvds-spa-routes.conf` | `/etc/nginx/snippets/hotvds-spa-routes.conf` |
| `stream.conf` | `/etc/nginx/stream.d/stream.conf` |
| `conf.d-admin-proxy.conf` | `/etc/nginx/conf.d/admin-proxy.conf` |

Both vhosts listen on `127.0.0.1:8443`; the `stream{}` SNI router in
`stream.conf` is what fronts them and tells them apart by `server_name`.

The storefront is not the only thing this nginx serves. `conf.d-admin-proxy.conf`
terminates TLS for `bl` / `po` / `pr` / `chat.hotvds.com` and proxies each to a
VM on the private segment — see `../gateway/README.md` for the machine those
names resolve to and what else it does.

## Applying a change

```sh
scp deploy/nginx/hotvds.com.conf root@167.179.34.32:/etc/nginx/sites-available/hotvds.com
ssh root@167.179.34.32 'nginx -t && systemctl reload nginx'
```

`nginx -t` before every reload, not after. A config that fails to parse leaves
the running nginx untouched, so a failed test costs nothing and a skipped one
can drop both sites.

Backups of the pre-2026-08-08 state are on the host at `/root/*.nginx.*` and
`/root/dev.hotvds.com.enabled.*`.

## Watch out: `sites-enabled` was not a symlink

Until 2026-08-08 `/etc/nginx/sites-enabled/dev.hotvds.com` was a **regular
file**, not a symlink into `sites-available`, and the two had drifted — the
enabled copy listened on `127.0.0.1:8443` behind the SNI router while
`sites-available` still said `443`. Editing `sites-available` changed nothing
served, silently. That cost a debugging round the day it was found.

Both hosts are symlinks now. If you ever edit a vhost and `nginx -T` does not
show your change, check that first:

```sh
ssh root@167.179.34.32 'ls -la /etc/nginx/sites-enabled/'
```

`nginx -T` dumps the *effective* configuration and is the only trustworthy
answer to "what is actually running".

## The SPA routing snippet

`snippets-hotvds-spa-routes.conf` exists because `try_files $uri $uri/
/index.html` answers **200 for every path**. A mistyped or retired URL then
looks to a crawler like a real page that happens to say "not found" — a soft
404, which gets indexed.

The snippet lists the routes the app actually has. Those are served normally;
anything else still gets the app — so the visitor keeps a usable, localized
not-found page with the site map in its footer — but with a real 404 status.

Two details are load-bearing:

- `error_page 404 =404 /index.html` — the explicit `=404` is required. A bare
  `error_page 404 /index.html` serves the shell but relabels the response 200,
  which is the exact bug being fixed. This was observed, not assumed.
- The `error_page` sits inside `location /` rather than at server level, so a
  missing `/assets/*` file keeps its own small 404 instead of shipping the whole
  HTML document.

### The route list is a second source of truth

The alternation in the snippet mirrors `routePaths` in `src/i18n/paths.ts`. Add
a route there without adding it here and that page answers 404 while still
rendering correctly — the worst kind of wrong, because it looks fine in a
browser and only hurts in search results.

`src/nginxRoutes.test.ts` compares the two and fails when they disagree, so the
drift is caught in CI rather than in Search Console. When it fails, update the
snippet, apply it to the host, and re-pull the file here.
