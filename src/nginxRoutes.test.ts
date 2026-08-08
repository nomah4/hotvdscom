import { describe, expect, it } from 'vitest';
// `?raw` rather than node:fs: it needs no @types/node (tsconfig.app.json scopes
// types to vite/client) and goes through the same transform in test and build.
import snippet from '../deploy/nginx/snippets-hotvds-spa-routes.conf?raw';
import { routePaths } from './i18n/paths';

/**
 * nginx serves the app with a real 404 for any path that is not a known route
 * (deploy/nginx/snippets-hotvds-spa-routes.conf). That list is a second copy of
 * `routePaths`, and nothing but this test keeps the two in step.
 *
 * Drift here is the worst kind of wrong: adding a route and forgetting the
 * snippet gives a page that renders perfectly in a browser and answers 404 to
 * crawlers, so it silently never gets indexed. Nobody notices by looking.
 *
 * The config is not deployed from this repo — see deploy/nginx/README.md — so a
 * green test means "the committed config is right", not "the host is". Applying
 * it is still a manual step.
 */
describe('nginx SPA route list', () => {
  function segmentsInSnippet(): string[] {
    // The single `location ~ ^/(callback/?|(ru|en)(/(a|b|c))?/?)?$` line; the
    // inner alternation is the route list.
    const line = snippet.split('\n').find((l: string) => l.trimStart().startsWith('location ~'));
    expect(line, 'no regex location in the snippet').toBeDefined();

    const alternation = line!.match(/\(ru\|en\)\(\/\(([^)]+)\)\)/);
    expect(alternation, `could not read the route list out of: ${line}`).not.toBeNull();

    return alternation![1].split('|');
  }

  it('covers every route the app declares', () => {
    // The home route is the empty segment — `/ru` itself, which the regex
    // already allows by making the whole group optional.
    const declared = Object.values(routePaths).filter(Boolean).sort();

    expect(segmentsInSnippet().slice().sort()).toEqual(declared);
  });

  it('lists the routes sorted, so a diff stays readable', () => {
    const listed = segmentsInSnippet();

    expect(listed).toEqual(listed.slice().sort());
  });

  it('keeps the explicit =404, without which the fix does nothing', () => {
    // A bare `error_page 404 /index.html` serves the shell and relabels the
    // response 200 — observed on the host, not assumed.
    expect(snippet).toMatch(/error_page\s+404\s+=404\s+\/index\.html;/);
  });
});
