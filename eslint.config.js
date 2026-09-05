import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // App-code linting only. Test/e2e tooling (vitest, Playwright) is excluded —
  // it uses jest-dom ambient matchers and (Playwright) an optional dep installed
  // locally, neither of which the app's strict rules should evaluate.
  globalIgnores(['dist', 'e2e', 'playwright.config.ts', 'vitest.config.ts', 'src/test', 'src/**/*.test.tsx']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
