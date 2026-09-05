import { defineConfig } from 'vitest/config';

/**
 * Phase 10D component-test setup (jsdom + React Testing Library). Scoped to
 * `*.test.tsx` so the pure-logic `*.test.ts` suites keep running on the lean
 * tsx + node:test runner (npm run test:unit). JSX is transformed by esbuild's
 * automatic runtime (no @vitejs/plugin-react — avoids the dual-vite type clash).
 * Note: vitest's dev toolchain carries dev-only advisories; it never ships in
 * the production build.
 */
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.tsx'],
    css: false,
  },
});
