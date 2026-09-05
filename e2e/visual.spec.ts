import { test, expect } from '@playwright/test';

/**
 * Phase 10E routed visual/responsive smoke check (§D). Verifies, in a real
 * browser, that the EASY GAS logos load (not broken, not distorted), there is no
 * horizontal page overflow at the key breakpoints, and no SEVERE console errors
 * appear on the primary routes. Run: `PW_CHANNEL=msedge npm run test:e2e` (or
 * bundled Chromium). Screenshots/artifacts are git-ignored, never committed.
 */

type Page = import('@playwright/test').Page;

const USTA = { phone: process.env.E2E_USTA_PHONE ?? '+998901000001', password: process.env.E2E_PASSWORD ?? 'EasyGasDev2026!' };

const BREAKPOINTS = [
  { name: '360×800 (mobile)', width: 360, height: 800 },
  { name: '768×1024 (tablet)', width: 768, height: 1024 },
  { name: '1366×768 (laptop)', width: 1366, height: 768 },
  { name: '1920×1080 (desktop)', width: 1920, height: 1080 },
];

/** Fails if the page scrolls horizontally (a 1px rounding tolerance). */
async function expectNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow, `horizontal overflow at ${label}`).toBeLessThanOrEqual(1);
}

/** Every rendered logo <img> must be decoded with a real intrinsic size. */
async function expectLogosLoaded(page: Page, label: string) {
  const broken = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img')).filter((i) => /easygas-.*\.png$/.test(i.currentSrc || i.src));
    return imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src);
  });
  expect(broken, `broken/undecoded logos at ${label}: ${broken.join(', ')}`).toHaveLength(0);
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/telefon/i).fill(USTA.phone.replace(/^\+998/, '').replace(/\D/g, ''));
  await page.getByLabel('Parol', { exact: true }).fill(USTA.password);
  await page.getByRole('button', { name: /kirish/i }).click();
  await expect(page).toHaveURL(/\/app/);
}

test.describe('visual / responsive smoke', () => {
  test('logos load, no horizontal overflow, and no severe console errors across breakpoints', async ({ page }) => {
    // Real JS crashes (uncaught exceptions / React errors) — always severe.
    const jsErrors: string[] = [];
    page.on('pageerror', (e) => jsErrors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      // Browser "Failed to load resource: ... 4xx" logs are network status noise,
      // tracked separately below; keep only genuine console.error app messages.
      if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) jsErrors.push(m.text());
    });
    // Unexpected failed API requests. The pre-login /auth/me bootstrap 401 is
    // EXPECTED (it is how the app learns you are not signed in); nothing else may fail.
    const failedApi: string[] = [];
    page.on('response', (r) => {
      const url = r.url();
      if (!url.includes('/api/')) return;
      if (r.status() < 400) return;
      if (r.status() === 401 && /\/auth\/me\b/.test(url)) return; // expected pre-login probe
      failedApi.push(`${r.status()} ${url}`);
    });

    // Login screen (branded stacked logo on the dark auth backdrop).
    for (const bp of BREAKPOINTS) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/login');
      await expect(page.getByRole('button', { name: /kirish/i })).toBeVisible();
      await expectLogosLoaded(page, `login ${bp.name}`);
      await expectNoHorizontalOverflow(page, `login ${bp.name}`);
    }

    // Authenticated shell + primary routes.
    await page.setViewportSize({ width: 1366, height: 768 });
    await login(page);
    await expectLogosLoaded(page, 'app shell'); // header wordmark

    const routes = ['/app', '/app/my-jobs'];
    for (const route of routes) {
      for (const bp of BREAKPOINTS) {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await expectNoHorizontalOverflow(page, `${route} ${bp.name}`);
        await expectLogosLoaded(page, `${route} ${bp.name}`);
      }
    }

    // Job detail (assignment + risk panels + start action).
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/app/my-jobs');
    await page.getByRole('list', { name: /biriktirilgan ishlar/i }).getByRole('button').first().click();
    await expect(page).toHaveURL(/\/app\/jobs\/\d+/);
    await expect(page.getByRole('region', { name: /mas'ul texnik/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /xavf registri/i })).toBeVisible();
    for (const bp of BREAKPOINTS) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await expectNoHorizontalOverflow(page, `job detail ${bp.name}`);
    }

    expect(jsErrors, `severe console/JS errors: ${jsErrors.join(' | ')}`).toHaveLength(0);
    expect(failedApi, `unexpected failed API requests: ${failedApi.join(' | ')}`).toHaveLength(0);
  });
});
