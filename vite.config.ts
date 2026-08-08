// vitest's defineConfig, not vite's — it is the one that knows the `test` key.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

// The commit the bundle was built from, baked in as a literal so the running
// site can name itself. It is the same short SHA the prod deploy uses for the
// release directory, so what the footer shows and what `hotvds-prod-deploy
// current` reports line up. CI hands us GITHUB_SHA (its checkout is detached
// and shallow, but the env var is always right); a local build asks git; a
// source tarball with no .git has neither, hence the fallback.
function buildSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return 'unknown'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_SHA__: JSON.stringify(buildSha()),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
