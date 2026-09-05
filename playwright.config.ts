import { defineConfig, devices } from '@playwright/test';

/**
 * Phase 10D Playwright config. NOT executed in this environment (no browser /
 * app+DB harness here). To run locally:
 *   1) cd server && npm run test:setup   # isolated *_test DB + v1 matrix active
 *   2) start the API against the test DB and the Vite dev server
 *   3) cd client && npm i -D @playwright/test && npx playwright install chromium
 *   4) BASE_URL=http://localhost:5173 npx playwright test
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
