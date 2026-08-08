/**
 * Short commit SHA of the build, substituted as a string literal by the
 * `define` in vite.config.ts. Global rather than an import because `define`
 * rewrites the identifier itself — there is no module to import it from.
 */
declare const __BUILD_SHA__: string;
