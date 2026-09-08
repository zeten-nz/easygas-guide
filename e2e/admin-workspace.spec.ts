import { test, expect, type APIRequestContext } from '@playwright/test';
import { USERS, loginAs, guardPage } from './helpers';

/**
 * Phase 11A admin workspace — full-stack browser journeys against the live server
 * harness. Exercises the redesigned shell, the employee directory pagination (with
 * >50 synthetic employees), profiles, the voluntary password-change path, and safe
 * template deletion, through the REAL UI + API. No production/developer data is
 * touched — the spec creates its own branch + synthetic employees via the API.
 */

const BRANCH_NAME = 'E2E AW Branch';
const EMPLOYEE_COUNT = 55; // > 50, so page-size 50 yields two pages and 25 yields three
const ADMIN2_LAST = 'IkkinchiAw';
const PUBLISHED_TEMPLATE = 'E2E AW Published';

/** Log in via the API and return a CSRF token for subsequent mutations. */
async function apiLogin(request: APIRequestContext): Promise<string> {
  const res = await request.post('/api/v1/auth/login', {
    data: { phone: USERS.ADMIN.phone, password: USERS.ADMIN.password, rememberMe: false },
  });
  expect(res.ok(), `admin API login failed: ${res.status()}`).toBeTruthy();
  return (await res.json()).csrfToken as string;
}

/** Seeds the branch + synthetic employees + a second admin. Idempotent (tolerates 409). */
async function seed(request: APIRequestContext): Promise<number> {
  const token = await apiLogin(request);
  const headers = { 'x-csrf-token': token };

  // Reuse the branch if it already exists (a prior project seeded it).
  const list = await (await request.get('/api/v1/branches')).json();
  let branch = (list.branches as { id: number; name: string }[]).find((b) => b.name === BRANCH_NAME);
  if (!branch) {
    const created = await request.post('/api/v1/branches', { headers, data: { name: BRANCH_NAME, region: 'Toshkent shahri' } });
    expect([201, 409]).toContain(created.status());
    branch = (await created.json()).branch;
  }
  const branchId = branch!.id;

  await request.post('/api/v1/users', {
    headers,
    data: {
      firstName: 'Ikkinchi',
      lastName: ADMIN2_LAST,
      phone: '+998911000200',
      region: 'Toshkent shahri',
      branchId: null,
      roleCode: 'ADMIN',
      password: 'EasyGasDev2026!',
    },
  });

  for (let i = 0; i < EMPLOYEE_COUNT; i++) {
    await request.post('/api/v1/users', {
      headers,
      data: {
        firstName: 'Xodim',
        lastName: `AW${String(i).padStart(2, '0')}`,
        phone: `+998911${String(100000 + i).padStart(6, '0')}`,
        region: 'Toshkent shahri',
        branchId,
        roleCode: 'USTA',
        password: 'EasyGasDev2026!',
      },
    });
  }

  // A PUBLISHED template (create → add a step → publish) so the UI can show that it
  // cannot be permanently deleted. Idempotent: skip if it already exists.
  const templates = (await (await request.get('/api/v1/checklist-templates')).json()).templates as { name: string }[];
  if (!templates.some((t) => t.name === PUBLISHED_TEMPLATE)) {
    const created = await request.post('/api/v1/checklist-templates', { headers, data: { name: PUBLISHED_TEMPLATE } });
    if (created.status() === 201) {
      const tpl = (await created.json()).template as { id: number; versions: { id: number }[] };
      const vId = tpl.versions[0].id;
      await request.post(`/api/v1/checklist-templates/${tpl.id}/versions/${vId}/steps`, { headers, data: { name: 'Tekshiruv' } });
      await request.post(`/api/v1/checklist-templates/${tpl.id}/versions/${vId}/publish`, { headers });
    }
  }
  return branchId;
}

test.describe('admin workspace', () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(async ({ playwright, baseURL }) => {
    const request = await playwright.request.newContext({ baseURL });
    await seed(request);
    await request.dispose();
  });

  test('directory pagination + profile + Back restores the filtered view', async ({ page }) => {
    const clean = guardPage(page);
    await loginAs(page, USERS.ADMIN);

    await page.goto('/app/admin/users');
    await expect(page.getByRole('heading', { name: 'Xodimlar' })).toBeVisible();

    // Scope to the synthetic branch → a deterministic total of 55.
    await page.getByLabel("Filial bo'yicha filtr").selectOption({ label: BRANCH_NAME });
    await expect(page.getByText(/Jami\s*55\s*xodim/)).toBeVisible();

    // Page 2 via next.
    await page.getByLabel('Keyingi sahifa').click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/26–50 ko'rsatilmoqda/)).toBeVisible();

    // Page size 50 → two pages, resets to page 1.
    await page.getByLabel(/qatorlar soni/i).selectOption('50');
    await expect(page).toHaveURL(/pageSize=50/);
    await expect(page.getByText(/1–50 ko'rsatilmoqda/)).toBeVisible();

    // Open an employee's profile by clicking their name (the profile heading is the
    // same employee — asserted by the shared "Xodim AW" prefix, robust to which row
    // is first after the page-size refetch).
    await page.getByRole('link', { name: /^Xodim AW/ }).first().click();
    await expect(page).toHaveURL(/\/app\/admin\/users\/\d+$/);
    await expect(page.getByRole('heading', { level: 2, name: /^Xodim AW/ })).toBeVisible();

    // Back restores the directory with its branch filter + page state intact.
    await page.goBack();
    await expect(page).toHaveURL(/branchId=/);
    await expect(page.getByLabel("Filial bo'yicha filtr")).not.toHaveValue('');

    // "Another administrator remains visible" — from a fresh all-branches directory,
    // search the second admin (branch-null, so it must not be scoped to a branch).
    await page.goto('/app/admin/users');
    await page.getByLabel('Qidiruv').fill(ADMIN2_LAST);
    await expect(page.getByRole('link', { name: `Ikkinchi ${ADMIN2_LAST}` }).first()).toBeVisible();

    clean();
  });

  test('own profile opens from the account menu and links to the password change', async ({ page }) => {
    const clean = guardPage(page);
    await loginAs(page, USERS.ADMIN);

    await page.getByRole('button', { name: 'Hisob menyusi' }).click();
    await page.getByRole('menuitem', { name: 'Mening profilim' }).click();
    await expect(page).toHaveURL(/\/app\/profile$/);
    await expect(page.getByRole('heading', { name: 'Mening profilim' })).toBeVisible();

    await page.getByRole('button', { name: /parolni o'zgartirish/i }).click();
    await expect(page).toHaveURL(/\/change-password$/);
    await expect(page.getByRole('heading', { name: "Parolni o'zgartirish" })).toBeVisible();
    clean();
  });

  test('create a draft template and delete it through the UI', async ({ page }) => {
    const clean = guardPage(page);
    await loginAs(page, USERS.ADMIN);
    const proj = test.info().project.name === 'chromium' ? 'cr' : 'mo';

    await page.goto('/app/admin/templates');
    await page.getByRole('button', { name: /yangi shablon/i }).click();
    const draftName = `E2E AW Draft ${proj} ${Date.now()}`;
    await page.getByLabel('Shablon nomi').fill(draftName);
    await page.getByRole('button', { name: /^yaratish$/i }).click();
    await expect(page.getByRole('heading', { name: draftName })).toBeVisible();

    // Deletable → delete it and land back on a usable list without it.
    await page.getByRole('button', { name: /shablonni o'chirish/i }).click();
    await Promise.all([
      page.waitForResponse(
        (r) => /\/checklist-templates\/\d+$/.test(r.url()) && r.request().method() === 'DELETE' && r.status() === 200,
      ),
      page.getByRole('dialog').getByRole('button', { name: "O'chirish" }).click(),
    ]);
    await expect(page).toHaveURL(/\/app\/admin\/templates$/);
    await expect(page.getByRole('link', { name: draftName })).toHaveCount(0);
    clean();
  });

  test('a published template cannot be permanently deleted (archive instead)', async ({ page }) => {
    const clean = guardPage(page);
    await loginAs(page, USERS.ADMIN);

    await page.goto('/app/admin/templates');
    await page.getByRole('link', { name: PUBLISHED_TEMPLATE }).click();
    await expect(page.getByRole('heading', { name: PUBLISHED_TEMPLATE })).toBeVisible();
    // No delete affordance, and the explanation is shown.
    await expect(page.getByRole('button', { name: /shablonni o'chirish/i })).toHaveCount(0);
    await expect(page.getByText(/o'chirib bo'lmaydi/i)).toBeVisible();
    clean();
  });

  test('mobile drawer navigation + no page-level horizontal overflow at key widths', async ({ page }) => {
    await loginAs(page, USERS.ADMIN);
    await page.goto('/app/admin/users');

    // Mobile: the drawer opens from the hamburger and exposes the nav.
    await page.setViewportSize({ width: 360, height: 780 });
    await page.getByRole('button', { name: 'Menyu', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: 'Navigatsiya' });
    await expect(drawer.getByRole('link', { name: 'Xodimlar' })).toBeVisible();
    await drawer.getByRole('button', { name: 'Menyuni yopish' }).click();
    await expect(drawer).toBeHidden();

    for (const width of [360, 768, 1366, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
});
