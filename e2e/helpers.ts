import { expect, type Page, test } from '@playwright/test';

/**
 * Shared Phase 10F full-stack E2E helpers. Roles are the demo users seeded by the
 * server harness; jobs are the per-(flow × project) DRAFT jobs it seeds. Locators
 * are accessible (roles/labels/text), never brittle CSS.
 */
export const USERS = {
  USTA: { phone: '+998901000001', password: 'EasyGasDev2026!' },
  MASTER: { phone: '+998901000002', password: 'EasyGasDev2026!' },
  SIFAT: { phone: '+998901000004', password: 'EasyGasDev2026!' },
  ADMIN: { phone: '+998901000005', password: 'EasyGasDev2026!' },
};

const FLOW_CODE: Record<string, string> = { HAPPY: 'HAP', BLOCK: 'BLK', ASSIGN: 'ASG', GPS: 'GPS', VIEW: 'VIW', REOPEN: 'RE' };

/** The seeded plate for a flow on the current browser project (cr=chromium, mo=mobile).
 *  Every flow — reopen included — has its own per-project job, so no spec is skipped. */
export function plateFor(flow: string): string {
  const code = FLOW_CODE[flow] ?? flow;
  const proj = test.info().project.name === 'chromium' ? 'cr' : 'mo';
  return `E2E-${code}-${proj}`;
}

export async function loginAs(page: Page, u: { phone: string; password: string }): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/telefon/i).fill(u.phone.replace(/^\+998/, '').replace(/\D/g, ''));
  await page.getByLabel('Parol', { exact: true }).fill(u.password);
  await page.getByRole('button', { name: /kirish/i }).click();
  await expect(page).toHaveURL(/\/app/);
}

/**
 * Attaches severe-error guards to a page and returns an assertion to run at the
 * end of a CLEAN journey (one with no intentional 4xx). Fails the test if an
 * uncaught JS error / React crash occurs, a genuine console.error is logged, or
 * an unexpected API request fails — the pre-login /auth/me 401 probe excepted.
 * (Refusal flows that deliberately exercise 4xx do not use this.)
 */
export function guardPage(page: Page): () => void {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    const u = r.url();
    if (!u.includes('/api/')) return;
    if (r.status() < 400) return;
    if (r.status() === 401 && /\/auth\/me\b/.test(u)) return; // expected pre-login probe
    errors.push(`api: ${r.status()} ${u}`);
  });
  return () => expect(errors, `unexpected severe browser/API errors: ${errors.join(' | ')}`).toHaveLength(0);
}

/**
 * Reads the session-bound CSRF token the API delivers on every authenticated
 * response (Phase 10A). Raw API POSTs in the specs must carry it as
 * `x-csrf-token`, otherwise they are rejected at the CSRF layer (403 CSRF_TOKEN)
 * before reaching RBAC/business logic — which would make a "server refuses X"
 * assertion pass for the wrong reason.
 */
export async function csrfToken(page: Page): Promise<string> {
  const res = await page.request.get('/api/v1/auth/me');
  const token = res.headers()['x-csrf-token'];
  expect(token, 'auth/me must deliver an x-csrf-token').toBeTruthy();
  return token;
}

/** Resolves a seeded job's id by plate via the API (shares the session cookie), then opens it. */
export async function gotoJobByPlate(page: Page, plate: string): Promise<number> {
  const res = await page.request.get('/api/v1/jobs?limit=100');
  expect(res.ok(), `jobs list failed: ${res.status()}`).toBeTruthy();
  const jobs = (await res.json()).jobs as { id: number; plateNumber: string }[];
  const job = jobs.find((j) => j.plateNumber === plate);
  expect(job, `seeded job with plate ${plate} not found`).toBeTruthy();
  await page.goto(`/app/jobs/${job!.id}`);
  await expect(page.getByRole('heading', { name: new RegExp(`Ish #${job!.id}`) })).toBeVisible();
  return job!.id;
}

/** Draws a stroke on the signature canvas (pointer events) and saves it. */
export async function signOnCanvas(page: Page): Promise<void> {
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('signature canvas has no box');
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3, { steps: 12 });
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.6, { steps: 12 });
  await page.mouse.up();
  const save = page.getByRole('button', { name: /imzoni saqlash/i });
  await expect(save).toBeEnabled(); // ink registered
  await Promise.all([
    page.waitForResponse((r) => /\/signature$/.test(r.url()) && r.request().method() === 'POST' && r.status() < 400),
    save.click(),
  ]);
}

/** Opens the start dialog, captures the (config-granted) GPS, and starts the job. */
export async function startJobWithGrantedGps(page: Page): Promise<void> {
  await page.getByRole('button', { name: /ishni boshlash/i }).first().click();
  const dialog = page.getByRole('dialog');
  const gps = dialog.getByRole('button', { name: /joylashuvni olish/i });
  await expect(gps).toBeVisible();
  await gps.click();
  await expect(page.getByText(/o'rnatish joyi qayd etildi/i)).toBeVisible();
  await dialog.getByRole('button', { name: /ishni boshlash/i }).click();
  await expect(page.getByText('Jarayonda').first()).toBeVisible();
}

/** Assigns the seeded published template and completes both steps via the UI. */
export async function assignChecklistAndComplete(page: Page): Promise<void> {
  await page.getByLabel('Shablon tanlash').selectOption({ label: 'E2E Checklist (v1)' });
  await page.getByRole('button', { name: /^biriktirish$/i }).click();
  await expect(page.getByText(/0 \/ 2 bajarildi/)).toBeVisible();
  await completeAllSteps(page);
  await expect(page.getByText(/2 \/ 2 bajarildi/)).toBeVisible();
}

/** Completes every non-STOP checklist step through the UI, progress-driven. */
export async function completeAllSteps(page: Page): Promise<void> {
  for (let i = 0; i < 20; i++) {
    const progress = await page.getByText(/\d+ \/ \d+ bajarildi/).first().textContent();
    const m = progress?.match(/(\d+)\s*\/\s*(\d+)/);
    if (m && m[1] === m[2]) return; // all steps done
    const btn = page.getByRole('button', { name: /bajarildi deb belgilash/i });
    await expect(btn.first()).toBeVisible();
    const before = m ? Number(m[1]) : 0;
    await Promise.all([
      page.waitForResponse((r) => /\/checklist\/steps\/\d+\/complete/.test(r.url()) && r.request().method() === 'POST' && r.status() < 400),
      btn.first().click(),
    ]);
    // Wait for the UI to reflect the advanced count (deterministic; no sleep).
    await expect(page.getByText(new RegExp(`${before + 1} / \\d+ bajarildi`))).toBeVisible();
  }
  throw new Error('completeAllSteps: checklist did not reach completion');
}
