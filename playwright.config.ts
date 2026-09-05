import { defineConfig, devices } from '@playwright/test';

/**
 * Phase 10D/10E Playwright config. NOT executed in this environment (no browser /
 * app+DB harness, and @playwright/test is not installed here — so no run is
 * claimed as passing). The specs are written against the REAL routes and run
 * locally once the harness is up.
 *
 * Run locally (macOS/Linux):
 *   1) cd server && npm run test:setup   # isolated *_test DB + v1 matrix active
 *   2) start the API against the test DB and the Vite dev server
 *   3) cd client && npm i -D @playwright/test && npx playwright install chromium
 *   4) BASE_URL=http://localhost:5173 npx playwright test
 *
 * Run locally (Windows PowerShell):
 *   1) cd server ; npm run test:setup
 *   2) # start the API (test DB) and, in another terminal, `cd client ; npm run dev`
 *   3) cd client ; npm i -D `@playwright/test ; npx playwright install chromium
 *   4) $env:BASE_URL='http://localhost:5173' ; npx playwright test
 *
 * Never point at production; never send real SMS.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    // Deterministic geolocation for the happy path (Tashkent).
    geolocation: { latitude: 41.311081, longitude: 69.240562, accuracy: 10 },
    permissions: ['geolocation'],
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
