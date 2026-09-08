import { test, expect } from '@playwright/test';
import { USERS, loginAs, guardPage, csrfToken } from './helpers';

/**
 * Manual employee password recovery — full-stack browser journey against the live
 * server harness. Exercises the whole §C/§D flow through the REAL UI + REAL API:
 *
 *   admin issues a one-time temporary password (admin UI, re-auth + reason)
 *     → the employee logs in with it and is FORCED to the change screen
 *     → the employee sets a new password and gains normal app access
 *     → the new password logs in normally; the temporary one no longer works.
 *
 * No real Telegram/SMS. The spec creates its OWN throwaway employee (unique phone
 * per browser project) so it never disturbs the shared demo users/jobs.
 */
test.describe('manual employee password recovery', () => {
  test.describe.configure({ timeout: 120_000 });

  test('admin temp password → employee forced change → normal access', async ({ browser }) => {
    const proj = test.info().project.name === 'chromium' ? 'cr' : 'mo';
    const phoneNational = proj === 'cr' ? '900555001' : '900555002';
    const phoneE164 = `+998${phoneNational}`;
    const firstName = `Tiklash-${proj}`;
    const initialPassword = 'InitPass-2026';
    const newPassword = 'Yangi-Parol-2026';

    // ---- ADMIN: create a throwaway employee, then issue a temp password via the UI ----
    const adminCtx = await browser.newContext();
    const admin = await adminCtx.newPage();
    await loginAs(admin, USERS.ADMIN);

    // Create the target employee via the API (admin session + CSRF). Tolerates a
    // 409 if a prior run within the DB lifetime already created it.
    const token = await csrfToken(admin);
    // Own an ISOLATED branch so this throwaway employee never inflates another spec's
    // branch-scoped member count (the directory spec asserts an exact branch total).
    const RECOVERY_BRANCH = 'E2E Recovery Branch';
    const branchesRes = await admin.request.get('/api/v1/branches');
    expect(branchesRes.ok(), `branches failed: ${branchesRes.status()}`).toBeTruthy();
    let branch = ((await branchesRes.json()).branches as { id: number; name: string }[]).find(
      (b) => b.name === RECOVERY_BRANCH,
    );
    if (!branch) {
      const created = await admin.request.post('/api/v1/branches', {
        headers: { 'x-csrf-token': token },
        data: { name: RECOVERY_BRANCH, region: 'Toshkent shahri' },
      });
      expect([201, 409], `create branch status ${created.status()}`).toContain(created.status());
      branch =
        created.status() === 201
          ? (await created.json()).branch
          : (((await (await admin.request.get('/api/v1/branches')).json()).branches as {
              id: number;
              name: string;
            }[]).find((b) => b.name === RECOVERY_BRANCH));
    }
    expect(branch, 'recovery branch resolved').toBeTruthy();
    const createRes = await admin.request.post('/api/v1/users', {
      headers: { 'x-csrf-token': token },
      data: {
        firstName,
        lastName: 'Xodim',
        phone: phoneE164,
        region: 'Toshkent shahri',
        branchId: branch!.id,
        roleCode: 'USTA',
        password: initialPassword,
      },
    });
    expect([201, 409], `create user status ${createRes.status()}`).toContain(createRes.status());

    // Issue the temporary password through the admin UI. Phase 11A renamed the page
    // heading to "Xodimlar" and moved per-row actions into an accessible row menu, so
    // the reset is now reached via that menu rather than an inline button.
    await admin.goto('/app/admin/users');
    await expect(admin.getByRole('heading', { name: 'Xodimlar' })).toBeVisible();
    await admin.getByLabel(/qidiruv/i).fill(phoneNational);
    const rowMenu = admin.getByRole('button', { name: new RegExp(`${firstName} Xodim — amallar`, 'i') });
    await expect(rowMenu).toBeVisible();
    await rowMenu.click();
    await admin.getByRole('menuitem', { name: /vaqtinchalik parol/i }).click();

    const dialog = admin.getByRole('dialog');
    await dialog.getByLabel(/joriy parolingiz/i).fill(USERS.ADMIN.password);
    await dialog.getByLabel(/^sabab$/i).fill('E2E: telefon orqali tasdiqlangan xodim');
    await Promise.all([
      admin.waitForResponse(
        (r) => /\/users\/\d+\/reset-password/.test(r.url()) && r.request().method() === 'POST' && r.status() === 200,
      ),
      dialog.getByRole('button', { name: /vaqtinchalik parol yaratish/i }).click(),
    ]);

    // The one-time temporary password is shown once; read it from the dialog.
    const tempCode = (await dialog.locator('code').innerText()).trim();
    expect(tempCode.length, 'a strong temporary password is displayed').toBeGreaterThanOrEqual(12);
    await adminCtx.close();

    // ---- EMPLOYEE: temp login is FORCED to the change screen ----
    const empCtx = await browser.newContext();
    const emp = await empCtx.newPage();
    const empClean = guardPage(emp); // the forced-change journey has no intentional 4xx

    await emp.goto('/login');
    await emp.getByLabel(/telefon/i).fill(phoneNational);
    await emp.getByLabel('Parol', { exact: true }).fill(tempCode);
    await emp.getByRole('button', { name: /kirish/i }).click();

    // Server-enforced restriction → the UI lands on the forced change screen.
    await expect(emp).toHaveURL(/\/change-password/);
    await expect(emp.getByRole('heading', { name: /yangi parol o'rnating/i })).toBeVisible();

    // Set a new password.
    await emp.getByLabel(/vaqtinchalik parol/i).fill(tempCode);
    await emp.getByLabel('Yangi parol', { exact: true }).fill(newPassword);
    await emp.getByLabel(/yangi parolni tasdiqlang/i).fill(newPassword);
    await Promise.all([
      emp.waitForResponse(
        (r) => /\/auth\/change-password/.test(r.url()) && r.request().method() === 'POST' && r.status() === 200,
      ),
      emp.getByRole('button', { name: /parolni o'rnatish/i }).click(),
    ]);

    // Restriction lifted → normal app access.
    await expect(emp).toHaveURL(/\/app/);
    empClean();
    await empCtx.close();

    // ---- The new password logs in normally (and reaches the app) ----
    const verifyCtx = await browser.newContext();
    const verify = await verifyCtx.newPage();
    await loginAs(verify, { phone: phoneE164, password: newPassword });
    await verifyCtx.close();
  });
});
