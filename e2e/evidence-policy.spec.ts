import { test, expect } from '@playwright/test';
import { USERS, loginAs, guardPage, csrfToken, plateFor, gotoJobByPlate } from './helpers';

/**
 * Phase 11C — completed-job EVIDENCE review + RISK-POLICY UX, on BOTH configured
 * projects (chromium + Pixel-5), no skips. Fixtures are seeded by the server
 * harness: E2E-EVI-<proj> (COMPLETED with a photo) and E2E-EVR-<proj> (COMPLETED
 * → REOPENED, so it carries cycle-1 historical evidence + a cycle-2 current photo).
 * The authorized-activation test operates only on an ISOLATED per-project fixture
 * version whose definition equals v1, so the domain stays governed identically.
 */
const V1_DEF = {
  algorithm: 'severity_x_likelihood',
  allowedSeverity: [1, 2, 3, 4],
  allowedLikelihood: [1, 2, 3, 4],
  thresholds: [{ min: 12, level: 'CRITICAL' }, { min: 8, level: 'HIGH' }, { min: 4, level: 'MEDIUM' }, { min: 0, level: 'LOW' }],
  blockingLevels: ['CRITICAL'],
  sourceOverrides: { STOP_REJECTED: 'CRITICAL' },
  severity4MinLevel: 'HIGH',
};

test.describe('11C evidence + policy', () => {
  test.describe.configure({ timeout: 120_000 });

  test('completed-job evidence: list → job → gallery → viewer → Back restores filters', async ({ page }) => {
    const clean = guardPage(page);
    await loginAs(page, USERS.SIFAT);
    const plate = plateFor('EVI');

    await page.goto('/app/jobs');
    await page.getByLabel("Holat bo'yicha filtr").selectOption('COMPLETED');
    // Search by the seeded customer name (the job search normalises out plate
    // dashes, so a dashed-plate search never matches). status=COMPLETED narrows
    // to the EVI jobs (EVR is REOPENED); the row is then picked by its plate.
    await page.getByLabel('Ish qidirish').fill('Evidence');
    await expect(page).toHaveURL(/status=COMPLETED/);
    // Wait for the DEBOUNCED search to commit to the URL before navigating away
    // (otherwise JobsPage unmounts and the pending debounce is cleared, so Back
    // would not restore the search).
    await expect(page).toHaveURL(/search=Evidence/);

    const row = page.getByRole('button', { name: new RegExp(plate) });
    await expect(row).toBeVisible();
    await row.click();
    await expect(page.getByRole('heading', { name: /Ish #\d+/ })).toBeVisible();

    // The "Fotolar" gallery is embedded in the job detail.
    await expect(page.getByRole('heading', { name: 'Fotolar' })).toBeVisible();
    const tile = page.getByRole('button', { name: /Rasmni ochish/i }).first();
    await expect(tile).toBeVisible();
    await tile.click();

    const viewer = page.getByRole('dialog');
    await expect(viewer).toBeVisible();
    await page.getByRole('button', { name: /Yopish/i }).click();
    await expect(viewer).toBeHidden();

    // Browser Back returns to the filtered list with URL state intact.
    await page.goBack();
    await expect(page).toHaveURL(/status=COMPLETED/);
    await expect(page.getByLabel("Holat bo'yicha filtr")).toHaveValue('COMPLETED');
    await expect(page.getByLabel('Ish qidirish')).toHaveValue('Evidence');
    clean();
  });

  test('reopened job distinguishes previous-cycle completed evidence from current', async ({ page }) => {
    const clean = guardPage(page);
    await loginAs(page, USERS.SIFAT);
    await gotoJobByPlate(page, plateFor('EVR'));

    await expect(page.getByRole('heading', { name: 'Fotolar' })).toBeVisible();
    // Historical completed cycle + current working evidence are separate groups.
    await expect(page.getByText(/1-tsikl \(yakunlangan\)/)).toBeVisible();
    await expect(page.getByText(/Joriy va boshqa dalillar/)).toBeVisible();
    // Truthful, distinct role badges.
    await expect(page.getByText('Yakunlangan tsikl').first()).toBeVisible();
    await expect(page.getByText('Joriy', { exact: true }).first()).toBeVisible();
    clean();
  });

  test('photo viewer: next/previous, keyboard, and close (accessible)', async ({ page }) => {
    const clean = guardPage(page);
    await loginAs(page, USERS.SIFAT);
    await gotoJobByPlate(page, plateFor('EVR')); // 2 accessible photos (cycle1 + cycle2)

    await page.getByRole('button', { name: /Rasmni ochish/i }).first().click();
    const viewer = page.getByRole('dialog');
    await expect(viewer).toBeVisible();
    await expect(viewer.getByText(/1 \/ 2/)).toBeVisible();

    await viewer.getByRole('button', { name: /Keyingi rasm/i }).click();
    await expect(viewer.getByText(/2 \/ 2/)).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(viewer.getByText(/1 \/ 2/)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    clean();
  });

  test('photo viewer handles an unavailable image with a bounded manual retry', async ({ page }) => {
    // Deliberate 404 flow — no guardPage (it would flag the intentional 4xx).
    await loginAs(page, USERS.SIFAT);
    await page.route('**/photos/*/file*', (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
    await gotoJobByPlate(page, plateFor('EVI'));
    await page.getByRole('button', { name: /Rasmni ochish/i }).first().click();
    const viewer = page.getByRole('dialog');
    await expect(viewer.getByText(/Rasmni yuklab bo'lmadi/)).toBeVisible();
    await expect(viewer.getByRole('button', { name: /Qayta urinish/i })).toBeVisible();
    await page.unroute('**/photos/*/file*');
  });

  test('gallery shows an error state with retry when the listing fails', async ({ page }) => {
    // Deliberate 5xx on the job-photos LISTING — no guardPage (intentional error).
    await loginAs(page, USERS.SIFAT);
    await page.route(/\/jobs\/\d+\/photos(\?|$)/, (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":{"code":"X","message":"x"}}' }));
    await gotoJobByPlate(page, plateFor('EVI'));
    await expect(page.getByText(/Fotolarni yuklab bo'lmadi/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Qayta urinish/i })).toBeVisible();
    await page.unroute(/\/jobs\/\d+\/photos(\?|$)/);
  });

  test('risk policy: explanation, REAL matrix, history and illustrative preview', async ({ page }) => {
    const clean = guardPage(page);
    await loginAs(page, USERS.SIFAT);
    await page.goto('/app/admin/risk-policy');

    await expect(page.getByRole('heading', { name: 'Xavf siyosati' })).toBeVisible();
    await expect(page.getByText(/Xavf siyosati nima\?/)).toBeVisible();
    // Real server-provided matrix (words + blocking text, not colour alone).
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText('Kritik').first()).toBeVisible();
    await expect(page.getByText(/Bloklovchi/).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Versiyalar tarixi/ })).toBeVisible();
    // Illustrative preview runs against the server evaluator.
    await expect(page.getByText(/Namuna baholash/)).toBeVisible();
    await expect(page.getByText(/Natija \(namuna\)/)).toBeVisible();
    clean();
  });

  test('a non-approver cannot reach the risk-policy screen', async ({ page }) => {
    await loginAs(page, USERS.USTA);
    await page.goto('/app/admin/risk-policy');
    // PermissionRoute redirects a non-approver away — the screen never renders.
    await expect(page.getByRole('heading', { name: 'Xavf siyosati' })).toHaveCount(0);
  });

  test('authorized activation of an isolated fixture policy (shared dialog usable on mobile)', async ({ page }) => {
    await loginAs(page, USERS.ADMIN);
    const token = await csrfToken(page);
    const proj = test.info().project.name === 'chromium' ? 'cr' : 'mo';
    const version = `e2e-act-${proj}`;
    // Isolated fixture DRAFT with the v1-equivalent definition (idempotent).
    await page.request.post('/api/v1/risk-policy/versions', { headers: { 'x-csrf-token': token }, data: { version, definition: V1_DEF } });

    const clean = guardPage(page);
    await page.goto('/app/admin/risk-policy');
    await page.getByLabel('Versiya:').selectOption(version);
    await page.getByRole('button', { name: /Bu versiyani faollashtirish/ }).click();

    // Shared centered Modal (Phase 11B) — its confirm control must be reachable on
    // the mobile visual viewport too. The confirmation names the exact version.
    const modal = page.getByRole('dialog');
    // The `<b>` naming the version (exact) — not the confirm button, which also
    // contains the version string ("…ni faollashtirish").
    await expect(modal.getByText(version, { exact: true })).toBeVisible();
    await modal.getByLabel(/Tasdiqlash asosi/).fill('E2E test activation of an isolated fixture');
    await modal.getByRole('button', { name: new RegExp(`${version}ni faollashtirish`) }).click();
    await expect(modal).toBeHidden();

    // The isolated fixture version is now the ACTIVE policy — confirmed by the
    // success toast (a definitely-visible signal; the version <option> label also
    // flips to "Faol (tasdiqlangan)").
    await expect(page.getByText(new RegExp(`${version} faollashtirildi`))).toBeVisible();
    clean();
  });
});
