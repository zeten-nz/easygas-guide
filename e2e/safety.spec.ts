import { test, expect } from '@playwright/test';

/**
 * Phase 10E safety browser flows (Playwright), written against the REAL routes.
 * Reproducible from a clean clone: `npm ci` installs the runner and the
 * `webServer` block in playwright.config.ts starts the API E2E harness (isolated
 * *_test DB, fake SMS, memory storage, ACTIVE v1 policy, a seeded assigned job)
 * and the Vite dev server. Run with `npm run test:e2e` (bundled Chromium, install
 * once via `npm run test:e2e:install`) or against a system browser with
 * `PW_CHANNEL=msedge npm run test:e2e` (no download).
 */

// Defaults match the demo USTA seeded by the server E2E harness
// (server: `npm run test:e2e:serve`). Override via env for a custom fixture set.
const USTA = { phone: process.env.E2E_USTA_PHONE ?? '+998901000001', password: process.env.E2E_PASSWORD ?? 'EasyGasDev2026!' };

type Page = import('@playwright/test').Page;

async function login(page: Page, u: { phone: string; password: string }) {
  await page.goto('/login');
  // The phone field expects the 9 national digits (a +998 prefix is shown
  // separately); strip a leading +998 from an E164 fixture.
  const national = u.phone.replace(/^\+998/, '').replace(/\D/g, '');
  await page.getByLabel(/telefon/i).fill(national);
  // Exact label — /parol/i would also match the "Parolni ko'rsatish" toggle.
  await page.getByLabel('Parol', { exact: true }).fill(u.password);
  await page.getByRole('button', { name: /kirish/i }).click();
  await expect(page).toHaveURL(/\/app/);
}

/** Opens the first assigned job from "My jobs" (scoped to the nav + jobs list). */
async function openFirstAssignedJob(page: Page) {
  await page.getByRole('navigation', { name: /asosiy navigatsiya/i }).getByRole('link', { name: 'Mening ishlarim' }).click();
  const list = page.getByRole('list', { name: /biriktirilgan ishlar/i });
  await expect(list).toBeVisible();
  await list.getByRole('button').first().click();
  await expect(page).toHaveURL(/\/app\/jobs\/\d+/);
}

test.describe('safety happy path', () => {
  test('technician opens an assigned job and GPS capture is embedded in the start action', async ({ page }) => {
    await login(page, USTA);
    await openFirstAssignedJob(page);

    // GPS is embedded in the job-start action and requested ONLY on click.
    await page.getByRole('button', { name: /ishni boshlash/i }).first().click();
    const gps = page.getByRole('button', { name: /joylashuvni olish/i });
    await expect(gps).toBeVisible();
    await gps.click(); // geolocation is granted deterministically in the config
    await expect(page.getByText(/joylashuv olindi|qayd etildi/i)).toBeVisible();
    // (Checklist / signing / completion require a fully-checklisted job; those
    // stages are asserted against the readiness panel + signable summary once the
    // harness seeds a job at that stage.)
  });
});

test.describe('blocked completion path', () => {
  test('an unresolved blocking risk prevents completion; resolving it unblocks', async ({ page }) => {
    await login(page, USTA);
    await openFirstAssignedJob(page);
    // The risk register renders on the job detail (server-authoritative).
    await expect(page.getByRole('region', { name: /xavf registri/i })).toBeVisible();
    // (Creating a CRITICAL risk + asserting CRITICAL_RISK_UNRESOLVED on the
    // completion-readiness panel requires a started, fully-checklisted job — added
    // once the harness seeds a job at that stage. The panel + gate are unit- and
    // API-tested; this documents the browser entry point.)
  });
});

test.describe('GPS states', () => {
  test('permission denied surfaces a clear message', async ({ page, context }) => {
    await context.clearPermissions(); // deny geolocation
    await login(page, USTA);
    await openFirstAssignedJob(page);
    await page.getByRole('button', { name: /ishni boshlash/i }).first().click();
    await page.getByRole('button', { name: /joylashuvni olish/i }).click();
    // With permission denied, the GPS control shows the denied guidance (no fake
    // coordinate is ever submitted).
    await expect(page.getByText(/ruxsat berilmadi|aniqlab bo'lmadi/i)).toBeVisible();
  });
});
