import { test, expect, type APIRequestContext } from '@playwright/test';
import { USERS, loginAs, guardPage, csrfToken } from './helpers';

/**
 * Phase 11B — product & service catalogue + reference data, full-stack browser
 * journeys. Seeds reference data + >25 products via the API (no production data),
 * then drives the REAL UI + API: the price base (search/filter/pagination), a
 * product create → price edit → history → archive flow, a service create, the
 * read-only (catalog.view) vs manage (catalog.manage) split, no-access refusal,
 * and in-use reference protection. Runs on chromium + the Pixel-5 mobile project.
 */
const CO = 'E2E Cat Co';
const CAT = 'E2E Cat Filtrlar'; // holds exactly PRODUCT_COUNT seeded products (count is asserted)
const OTHER_CAT = 'E2E Cat Boshqa'; // UI-created products land here, so CAT's count stays stable across runs
const BRAND = 'E2E Cat Brand';
const UNIT_CODE = 'E2E-U';
const SVC_CAT = 'E2E Cat Montaj';
const PRODUCT_COUNT = 30;

async function apiLogin(request: APIRequestContext): Promise<string> {
  const res = await request.post('/api/v1/auth/login', {
    data: { phone: USERS.ADMIN.phone, password: USERS.ADMIN.password, rememberMe: false },
  });
  expect(res.ok(), `admin API login: ${res.status()}`).toBeTruthy();
  return (await res.json()).csrfToken as string;
}

async function ensureRef(
  request: APIRequestContext,
  headers: Record<string, string>,
  kind: string,
  body: Record<string, unknown>,
  matchField: string,
  matchValue: string,
): Promise<number> {
  await request.post(`/api/v1/reference/${kind}`, { headers, data: body }); // tolerate 409
  const list = await (await request.get(`/api/v1/reference/${kind}?search=${encodeURIComponent(matchValue)}&limit=50`)).json();
  const found = (list.items as Record<string, unknown>[]).find((i) => String(i[matchField]).toLowerCase() === matchValue.toLowerCase());
  expect(found, `reference ${kind} ${matchValue} resolved`).toBeTruthy();
  return found!.id as number;
}

async function seed(request: APIRequestContext): Promise<void> {
  const token = await apiLogin(request);
  const headers = { 'x-csrf-token': token };
  const companyId = await ensureRef(request, headers, 'companies', { name: CO }, 'name', CO);
  const categoryId = await ensureRef(request, headers, 'product-categories', { name: CAT }, 'name', CAT);
  await ensureRef(request, headers, 'product-categories', { name: OTHER_CAT }, 'name', OTHER_CAT);
  await ensureRef(request, headers, 'brands', { name: BRAND }, 'name', BRAND);
  await ensureRef(request, headers, 'units', { name: 'dona', code: UNIT_CODE }, 'code', UNIT_CODE);
  await ensureRef(request, headers, 'service-categories', { name: SVC_CAT }, 'name', SVC_CAT);

  // >100 brands so a selector's first page (20) cannot reach them all — the
  // combobox regression selects one beyond the first pages via server search.
  for (let i = 0; i < 120; i++) {
    await request.post('/api/v1/reference/brands', { headers, data: { name: `E2E Brend ${String(i).padStart(3, '0')}` } });
  }

  for (let i = 0; i < PRODUCT_COUNT; i++) {
    await request.post('/api/v1/products', {
      headers,
      data: { code: `E2E-P${String(i).padStart(2, '0')}`, name: `E2E Mahsulot ${String(i).padStart(2, '0')}`, companyId, categoryId, priceMinor: (i + 1) * 100000 },
    });
  }
}

/** Pick a value in a RefCombobox: open it (by its label), search, click the option. */
async function pickCombo(
  scope: import('@playwright/test').Page | import('@playwright/test').Locator,
  label: string,
  optionName: string,
  exact = true,
) {
  await scope.getByLabel(label, { exact }).click();
  await scope.getByPlaceholder('Qidiruv…').fill(optionName);
  await scope.getByRole('option', { name: optionName, exact: false }).first().click();
}

test.describe('catalog', () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(async ({ playwright, baseURL }) => {
    const request = await playwright.request.newContext({ baseURL });
    await seed(request);
    await request.dispose();
  });

  test('price base: filter + pagination + a product create → price edit → history → archive', async ({ page }) => {
    const clean = guardPage(page);
    await loginAs(page, USERS.ADMIN);

    await page.goto('/app/catalog/products');
    await expect(page.getByRole('heading', { name: 'Narx bazasi' })).toBeVisible();

    // Filter to the seeded category (searchable combobox) → deterministic set, paginated (>25).
    await pickCombo(page, "Kategoriya bo'yicha filtr", CAT);
    await expect(page.getByText(new RegExp(`Jami\\s*${PRODUCT_COUNT}\\s*mahsulot`))).toBeVisible();
    await page.getByLabel('Keyingi sahifa').click();
    await expect(page).toHaveURL(/page=2/);

    // Create a product through the UI. Reference fields are searchable comboboxes.
    const proj = test.info().project.name === 'chromium' ? 'cr' : 'mo';
    const code = `E2E-NEW-${proj}-${Date.now()}`;
    await page.getByRole('button', { name: /yangi mahsulot/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Kod (SKU)').fill(code);
    await dialog.getByLabel('Nomi', { exact: true }).fill(`E2E Yangi ${proj}`);
    await pickCombo(dialog, 'Kompaniya', CO);
    await pickCombo(dialog, 'Kategoriya', OTHER_CAT);
    await dialog.getByLabel(/Narx \(so'm\)/).fill('1500000');
    await dialog.getByRole('button', { name: /^yaratish$/i }).click();
    await expect(dialog).toBeHidden();

    // Find & open it from a FRESH, unfiltered list (it lives in OTHER_CAT, and the
    // category filter above is still set to CAT).
    await page.goto('/app/catalog/products');
    await page.getByLabel('Qidiruv').fill(code);
    const nameLink = page.getByRole('link', { name: `E2E Yangi ${proj}` }).first();
    await expect(nameLink).toBeVisible();
    await nameLink.click();
    await expect(page.getByRole('heading', { name: `E2E Yangi ${proj}` })).toBeVisible();
    await expect(page.getByText("1 500 000 so'm").first()).toBeVisible();

    // Edit the price → the history section records old → new.
    await page.getByRole('button', { name: /tahrirlash/i }).click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByLabel(/Narx \(so'm\)/).fill('1750000');
    await editDialog.getByRole('button', { name: /^saqlash$/i }).click();
    await expect(editDialog).toBeHidden();
    await expect(page.getByText(/1 500 000 so'm\s*→\s*1 750 000 so'm/)).toBeVisible();

    // Archive it, then find it via the archived filter.
    await page.getByRole('button', { name: /arxivlash/i }).click();
    await expect(page.getByText('Arxivlangan').first()).toBeVisible();
    await page.goto('/app/catalog/products');
    await page.getByLabel('Holat bo\'yicha filtr').selectOption('ARCHIVED');
    await page.getByLabel('Qidiruv').fill(code);
    await expect(page.getByRole('link', { name: `E2E Yangi ${proj}` }).first()).toBeVisible();

    clean();
  });

  test('service create through the Xizmatlar tab', async ({ page }) => {
    const clean = guardPage(page);
    await loginAs(page, USERS.ADMIN);
    await page.goto('/app/catalog/products');
    await page.getByRole('link', { name: 'Xizmatlar' }).click();
    await expect(page).toHaveURL(/\/app\/catalog\/services/);

    const code = `E2E-S-${test.info().project.name === 'chromium' ? 'cr' : 'mo'}-${Date.now()}`;
    await page.getByRole('button', { name: /yangi xizmat/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Kod', { exact: true }).fill(code);
    await dialog.getByLabel('Nomi', { exact: true }).fill('E2E Yangi xizmat');
    await pickCombo(dialog, 'Kategoriya', SVC_CAT);
    await dialog.getByLabel(/Narx \(so'm\)/).fill('300000');
    await dialog.getByRole('button', { name: /^yaratish$/i }).click();
    await expect(dialog).toBeHidden();
    await page.getByLabel('Qidiruv').fill(code);
    await expect(page.getByRole('link', { name: 'E2E Yangi xizmat' }).first()).toBeVisible();
    clean();
  });

  test('reference combobox: select a value beyond the first 100, and display an archived selection', async ({ page }) => {
    const clean = guardPage(page);
    const proj = test.info().project.name === 'chromium' ? 'cr' : 'mo';
    await loginAs(page, USERS.ADMIN);

    // (A) Select a brand well beyond the first page(s) via server-backed search
    // (there are 120 seeded brands; a first-page-of-20 list could never reach it).
    const farBrand = `E2E Brend ${proj === 'cr' ? '110' : '111'}`;
    const codeA = `E2E-B100-${proj}-${Date.now()}`;
    await page.goto('/app/catalog/products');
    await page.getByRole('button', { name: /yangi mahsulot/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Kod (SKU)').fill(codeA);
    await dialog.getByLabel('Nomi', { exact: true }).fill(`E2E B100 ${proj}`);
    await pickCombo(dialog, 'Kompaniya', CO);
    await pickCombo(dialog, 'Kategoriya', OTHER_CAT);
    await pickCombo(dialog, 'Brend (ixtiyoriy)', farBrand);
    await dialog.getByRole('button', { name: /^yaratish$/i }).click();
    await expect(dialog).toBeHidden();

    // Reopen (edit) → the far brand (outside the current results) is displayed correctly.
    await page.goto('/app/catalog/products');
    await page.getByLabel('Qidiruv').fill(codeA);
    await page.getByRole('link', { name: `E2E B100 ${proj}` }).first().click();
    await page.getByRole('button', { name: /tahrirlash/i }).click();
    await expect(page.getByRole('dialog').getByLabel('Brend (ixtiyoriy)')).toContainText(farBrand);
    await page.getByRole('dialog').getByRole('button', { name: /bekor qilish/i }).click();

    // (B) A product whose brand is later ARCHIVED still displays it on edit (readable),
    // while the search list only offers ACTIVE values (never re-selectable). Uses a
    // throwaway brand so it can't pollute the seeded set across projects.
    const token = await csrfToken(page);
    const h = { 'x-csrf-token': token };
    const archBrand = `E2E ArchBrand ${proj} ${Date.now()}`;
    const brandId = (await (await page.request.post('/api/v1/reference/brands', { headers: h, data: { name: archBrand } })).json()).item.id;
    const co = (await (await page.request.get(`/api/v1/reference/companies?search=${encodeURIComponent(CO)}`)).json()).items[0].id;
    const cat = (await (await page.request.get(`/api/v1/reference/product-categories?search=${encodeURIComponent(OTHER_CAT)}`)).json()).items[0].id;
    const codeB = `E2E-ARCH-${proj}-${Date.now()}`;
    const created = await page.request.post('/api/v1/products', { headers: h, data: { code: codeB, name: `E2E Arch ${proj}`, companyId: co, categoryId: cat, brandId } });
    expect(created.ok(), `create product: ${created.status()}`).toBeTruthy();
    await page.request.post(`/api/v1/reference/brands/${brandId}/archive`, { headers: h });

    await page.goto('/app/catalog/products');
    await page.getByLabel('Qidiruv').fill(codeB);
    await page.getByRole('link', { name: `E2E Arch ${proj}` }).first().click();
    await page.getByRole('button', { name: /tahrirlash/i }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog.getByLabel('Brend (ixtiyoriy)')).toContainText(archBrand);
    await expect(editDialog.getByText('(arxivlangan)')).toBeVisible();
    clean();
  });

  test('catalog.view-only role (SIFAT) sees the price base but NO management actions', async ({ page }) => {
    const clean = guardPage(page);
    await loginAs(page, USERS.SIFAT);
    await page.goto('/app/catalog/products');
    await expect(page.getByRole('heading', { name: 'Narx bazasi' })).toBeVisible();
    await expect(page.getByRole('button', { name: /yangi mahsulot/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /amallar/i })).toHaveCount(0);
    clean();
  });

  test('a role without catalog.view cannot reach the price base', async ({ page }) => {
    await loginAs(page, USERS.USTA);
    await page.goto('/app/catalog/products');
    // The permission route keeps the USTA out of the price base (no heading).
    await expect(page.getByRole('heading', { name: 'Narx bazasi' })).toHaveCount(0);
  });

  test('in-use reference cannot be deleted — archive is offered instead', async ({ page }) => {
    const clean = guardPage(page);
    await loginAs(page, USERS.ADMIN);
    await page.goto('/app/reference');
    await expect(page.getByRole('heading', { name: "Ma'lumotnomalar" })).toBeVisible();
    // Companies tab is active by default; the seeded company is used by products.
    await page.getByLabel(`${CO} — amallar`).first().click();
    // Delete is disabled for an in-use value (archive instead).
    const del = page.getByRole('menuitem', { name: /o'chirish/i }).first();
    await expect(del).toBeVisible();
    await expect(del).toBeDisabled();
    clean();
  });
});
