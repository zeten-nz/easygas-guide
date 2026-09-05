import { defineConfig, devices } from '@playwright/test';

/**
 * Phase 10E Playwright config — reproducible from a clean clone.
 *
 * `@playwright/test` is a pinned devDependency, so `npm ci` installs the runner
 * and `npm run test:e2e -- --list` works with no extra steps. The `webServer`
 * block below starts BOTH tiers automatically for `npm run test:e2e`:
 *
 *   1) the API E2E harness (server repo) — `npm run test:e2e:serve`, which sets
 *      up the isolated *_test database, installs a FAKE console SMS provider and
 *      the in-memory storage provider (no real Eskiz / S3 / SMS), activates the
 *      provisional v1 risk policy, seeds a demo assigned job, and listens on :4000
 *      (the port Vite proxies /api to). It refuses any non-*_test database.
 *   2) the Vite dev server on :5173.
 *
 * Browser: Playwright uses its bundled Chromium by default (install once with
 * `npm run test:e2e:install`). To run against an ALREADY-INSTALLED system browser
 * instead — no download — set PW_CHANNEL=chrome or PW_CHANNEL=msedge.
 *
 * Windows PowerShell (manual two-terminal alternative to the automatic webServer):
 *   Terminal 1:  cd ..\server ; npm run test:e2e:serve
 *   Terminal 2:  cd client ; npm run dev
 *   Terminal 3:  cd client ; $env:PW_CHANNEL='msedge' ; npm run test:e2e
 *
 * Never point at production; never send real SMS.
 */
const CHANNEL = process.env.PW_CHANNEL; // 'chrome' | 'msedge' | undefined (bundled chromium)
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const REUSE = !process.env.CI;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'line' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Video capture needs Playwright's bundled ffmpeg; keep it opt-in (PW_VIDEO=1)
    // so a run against a SYSTEM browser (PW_CHANNEL) needs no Playwright download.
    video: process.env.PW_VIDEO ? 'retain-on-failure' : 'off',
    // Deterministic geolocation for the happy path (Tashkent).
    geolocation: { latitude: 41.311081, longitude: 69.240562, accuracy: 10 },
    permissions: ['geolocation'],
    ...(CHANNEL ? { channel: CHANNEL } : {}),
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...(CHANNEL ? { channel: CHANNEL } : {}) } },
    { name: 'mobile', use: { ...devices['Pixel 5'], ...(CHANNEL ? { channel: CHANNEL } : {}) } },
  ],
  // Automatic one-command harness. Set PW_NO_SERVER=1 to manage the servers
  // yourself (e.g. when they are already running).
  webServer: process.env.PW_NO_SERVER
    ? undefined
    : [
        {
          command: 'npm run test:e2e:serve',
          cwd: '../server',
          url: 'http://127.0.0.1:4000/api/v1/health',
          reuseExistingServer: REUSE,
          timeout: 180_000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
        {
          command: 'npm run dev',
          url: BASE_URL,
          reuseExistingServer: REUSE,
          timeout: 120_000,
        },
      ],
});
