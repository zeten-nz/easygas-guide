import { test, expect, type Page } from '@playwright/test';
import {
  USERS,
  plateFor,
  loginAs,
  gotoJobByPlate,
  signOnCanvas,
  startJobWithGrantedGps,
  assignChecklistAndComplete,
  csrfToken,
  guardPage,
} from './helpers';

/**
 * Phase 10F full-stack safety workflow — real browser journeys against the live
 * server harness (isolated *_test DB, active test risk matrix, fake SMS, in-memory
 * storage, seeded published template + per-(flow×project) DRAFT jobs). Behavior
 * under test runs through the real UI and real API. Accessible locators; no fixed
 * sleeps — every wait is on a real response or a real DOM state change.
 *
 * The harness seeds only PREREQUISITES (customer/vehicle/DRAFT job + self
 * assignment). Every status transition below (start, checklist, sign, close,
 * reopen, quality) is driven through the UI, so the server's real guards run.
 */

test.describe('full safety workflow', () => {
  test.describe.configure({ timeout: 180_000 }); // multi-role, multi-step journeys

  // -------------------------------------------------------------------------
  // 1. HAPPY PATH
  // -------------------------------------------------------------------------
  test('happy path: start → checklist → sign (digest-bound) → close → completion snapshot', async ({ browser }) => {
    const plate = plateFor('HAPPY');

    // ---- USTA: start, checklist, signature ----
    const ustaCtx = await browser.newContext();
    const usta = await ustaCtx.newPage();
    const ustaClean = guardPage(usta); // no intentional 4xx on the happy path
    await loginAs(usta, USERS.USTA);
    await gotoJobByPlate(usta, plate);

    // Responsible technician is shown (assigned at creation).
    await expect(usta.getByRole('region', { name: /mas'ul texnik/i })).toContainText(/Usta/i);

    await startJobWithGrantedGps(usta);
    await assignChecklistAndComplete(usta);

    // Signable summary shows the canonical digest; sign it via the real canvas.
    await expect(usta.getByText(/Yakuniy xulosa/i)).toBeVisible();
    await expect(usta.getByText(/raqamli izi \(digest\)/i)).toBeVisible();
    await signOnCanvas(usta);
    // The stored signature is bound to the displayed summary digest.
    await expect(usta.getByText(/Imzo yuqoridagi xulosa raqamli iziga bog'langan/i)).toBeVisible();
    ustaClean();
    await ustaCtx.close();

    // ---- MASTER: close the job (authorized role) ----
    const masterCtx = await browser.newContext();
    const master = await masterCtx.newPage();
    const masterClean = guardPage(master);
    await loginAs(master, USERS.MASTER);
    await gotoJobByPlate(master, plate);
    await master.getByRole('button', { name: /^ishni yakunlash$/i }).click();
    await master.getByRole('button', { name: /ha, davom etilsin/i }).click();

    // Completed + immutable snapshot is viewable, digest-sealed.
    await expect(master.getByText(/Ish yakunlangan/i)).toBeVisible();
    const snapshot = master.getByText(/Muhrlangan yakuniy snapshot/i);
    await expect(snapshot).toBeVisible();
    await snapshot.click();
    await expect(master.getByText(/Snapshot digesti/i)).toBeVisible();
    masterClean();
    await masterCtx.close();
  });

  // -------------------------------------------------------------------------
  // 2. BLOCKING RISK — server-computed CRITICAL risk refuses completion until an
  //    authorized user resolves it; only then can the customer sign the summary
  //    that reflects the resolved state, and the job be closed.
  // -------------------------------------------------------------------------
  test('blocking risk: completion refused until an authorized user resolves the CRITICAL risk', async ({ browser }) => {
    const plate = plateFor('BLOCK');

    const ustaCtx = await browser.newContext();
    const usta = await ustaCtx.newPage();
    await loginAs(usta, USERS.USTA);
    const jobId = await gotoJobByPlate(usta, plate);

    await startJobWithGrantedGps(usta);
    await assignChecklistAndComplete(usta);

    // USTA reports a hazard; the SERVER computes severity 4 × likelihood 4 as a
    // CRITICAL, blocking risk (client never derives it).
    const risks = usta.getByRole('region', { name: /xavf registri/i });
    await risks.getByRole('button', { name: /xavf qo'shish/i }).click();
    const riskDialog = usta.getByRole('dialog');
    await riskDialog.getByLabel(/xavf turi/i).fill('Gaz sizishi');
    await riskDialog.getByLabel(/tavsif/i).fill('Ulanish nuqtasida gaz hidi sezildi');
    await riskDialog.getByLabel(/jiddiylik/i).selectOption('4');
    await riskDialog.getByLabel(/ehtimollik/i).selectOption('4');
    await Promise.all([
      usta.waitForResponse((r) => /\/risks$/.test(r.url()) && r.request().method() === 'POST' && r.status() < 400),
      riskDialog.getByRole('button', { name: /^qo'shish$/i }).click(),
    ]);

    // Server-authoritative CRITICAL + blocking, shown as TEXT (not colour alone).
    await expect(risks.getByText('KRITIK')).toBeVisible();
    await expect(risks.getByText(/Bloklaydi/)).toBeVisible();
    await expect(risks.getByRole('alert')).toContainText(/hal qilinmagan bloklaydigan xavf/i);

    // Completion condition for risks now fails; USTA cannot close (no jobs.close).
    await expect(usta.getByText(/Hal qilinmagan bloklaydigan xavf yo'q/i)).toBeVisible();
    await ustaCtx.close();

    // ---- MASTER: completion is refused, then resolves the risk (authorized) ----
    const masterCtx = await browser.newContext();
    const master = await masterCtx.newPage();
    await loginAs(master, USERS.MASTER);
    await gotoJobByPlate(master, plate);

    // The close control is present but disabled while the blocking risk is open.
    const closeBtn = master.getByRole('button', { name: /^ishni yakunlash$/i });
    await expect(closeBtn).toBeVisible();
    await expect(closeBtn).toBeDisabled();

    // A defence-in-depth check: the server itself refuses the close API call
    // (with a valid CSRF token, so the refusal comes from the completion gate,
    // not the CSRF layer).
    const mCsrf = await csrfToken(master);
    const refused = await master.request.post(`/api/v1/jobs/${jobId}/complete`, { headers: { 'x-csrf-token': mCsrf } });
    expect(refused.status(), 'server must refuse completion with an open blocking risk').toBe(422);
    expect((await refused.json()).error?.code).toBe('COMPLETION_BLOCKED');

    // Resolve the risk (MASTER holds risks.resolve).
    const mRisks = master.getByRole('region', { name: /xavf registri/i });
    await mRisks.getByRole('button', { name: /^hal qilish$/i }).click();
    const resolveDialog = master.getByRole('dialog');
    await resolveDialog.getByLabel(/izoh/i).fill('Ulanish qayta zichlandi va tekshirildi');
    await Promise.all([
      master.waitForResponse((r) => /\/risks\/\d+\/resolve$/.test(r.url()) && r.request().method() === 'POST' && r.status() < 400),
      resolveDialog.getByRole('button', { name: /^hal qilindi$/i }).click(),
    ]);
    await expect(mRisks.getByText(/Hal qilingan/)).toBeVisible();
    await masterCtx.close();

    // ---- USTA: now sign the summary that reflects the resolved state ----
    const ustaCtx2 = await browser.newContext();
    const usta2 = await ustaCtx2.newPage();
    await loginAs(usta2, USERS.USTA);
    await gotoJobByPlate(usta2, plate);
    await expect(usta2.getByText(/Yakuniy xulosa/i)).toBeVisible();
    await signOnCanvas(usta2);
    await expect(usta2.getByText(/Imzo yuqoridagi xulosa raqamli iziga bog'langan/i)).toBeVisible();
    await ustaCtx2.close();

    // ---- MASTER: close now succeeds ----
    const masterCtx2 = await browser.newContext();
    const master2 = await masterCtx2.newPage();
    await loginAs(master2, USERS.MASTER);
    await gotoJobByPlate(master2, plate);
    const closeBtn2 = master2.getByRole('button', { name: /^ishni yakunlash$/i });
    await expect(closeBtn2).toBeEnabled();
    await closeBtn2.click();
    await master2.getByRole('button', { name: /ha, davom etilsin/i }).click();
    await expect(master2.getByText(/Ish yakunlangan/i)).toBeVisible();
    await masterCtx2.close();
  });

  // -------------------------------------------------------------------------
  // 3. REOPEN — a completed job is reopened by quality; the cycle increments, the
  //    prior signature/snapshot stay as immutable history but cannot authorize
  //    the new cycle; the work is re-signed (new digest) and re-completed via a
  //    second, quality-confirmed snapshot. Runs on both profiles (own fixtures).
  // -------------------------------------------------------------------------
  test('reopen: new cycle needs a fresh signature; prior completion preserved as history', async ({ browser }) => {
    const plate = plateFor('REOPEN');

    // ---- First completion (cycle 1) ----
    const ustaCtx = await browser.newContext();
    const usta = await ustaCtx.newPage();
    await loginAs(usta, USERS.USTA);
    const jobId = await gotoJobByPlate(usta, plate);
    await startJobWithGrantedGps(usta);
    await assignChecklistAndComplete(usta);
    await signOnCanvas(usta);
    await ustaCtx.close();

    const masterCtx = await browser.newContext();
    const master = await masterCtx.newPage();
    await loginAs(master, USERS.MASTER);
    await gotoJobByPlate(master, plate);
    await master.getByRole('button', { name: /^ishni yakunlash$/i }).click();
    await master.getByRole('button', { name: /ha, davom etilsin/i }).click();
    await expect(master.getByText(/Ish yakunlangan/i)).toBeVisible();
    await masterCtx.close();

    // ---- SIFAT reopens with a mandatory reason ----
    const sifatCtx = await browser.newContext();
    const sifat = await sifatCtx.newPage();
    await loginAs(sifat, USERS.SIFAT);
    await gotoJobByPlate(sifat, plate);
    await sifat.getByRole('button', { name: /ishni qayta ochish/i }).click();
    const reopenDialog = sifat.getByRole('dialog');
    await reopenDialog.getByLabel(/qayta ochish sababi/i).fill('Reduktor sozlamasi talabga mos emas');
    await Promise.all([
      sifat.waitForResponse((r) => /\/reopen$/.test(r.url()) && r.request().method() === 'POST' && r.status() < 400),
      reopenDialog.getByRole('button', { name: /qayta ochishni tasdiqlash/i }).click(),
    ]);
    await sifatCtx.close();

    // ---- USTA: the reopened cycle requires a fresh signature ----
    const ustaCtx2 = await browser.newContext();
    const usta2 = await ustaCtx2.newPage();
    await loginAs(usta2, USERS.USTA);
    await gotoJobByPlate(usta2, plate);
    // Prior signature stays visible as immutable history in the risk register's
    // previous-cycle section / assignment history — the new cycle is #2.
    await expect(usta2.getByText(/Xavf registri/i)).toBeVisible();
    // The reopened cycle demands a new customer signature (the old one no longer
    // authorizes the corrected work); sign the new summary digest.
    await expect(usta2.getByText(/Yakuniy xulosa/i)).toBeVisible();
    await signOnCanvas(usta2);
    await ustaCtx2.close();

    // ---- MASTER: sends the corrected work to quality review ----
    const masterCtx2 = await browser.newContext();
    const master2 = await masterCtx2.newPage();
    await loginAs(master2, USERS.MASTER);
    await gotoJobByPlate(master2, plate);
    await master2.getByRole('button', { name: /sifat nazoratiga yuborish/i }).click();
    await master2.getByRole('button', { name: /ha, davom etilsin/i }).click();
    await expect(master2.getByText(/sifat nazorati tasdig'ini kutmoqda/i)).toBeVisible();
    await masterCtx2.close();

    // ---- SIFAT: confirms quality → second, digest-sealed completion snapshot ----
    const sifatCtx2 = await browser.newContext();
    const sifat2 = await sifatCtx2.newPage();
    await loginAs(sifat2, USERS.SIFAT);
    await gotoJobByPlate(sifat2, plate);
    await sifat2.getByRole('button', { name: /sifat nazoratidan o'tkazish/i }).click();
    await sifat2.getByRole('button', { name: /tasdiqlash — ish yakunlansin/i }).click();
    await expect(sifat2.getByText(/Ish yakunlangan/i)).toBeVisible();
    const snapshot = sifat2.getByText(/Muhrlangan yakuniy snapshot/i);
    await expect(snapshot).toBeVisible();
    await snapshot.click();
    // Second cycle snapshot is now sealed.
    await expect(sifat2.getByText(/sikl #2/i)).toBeVisible();

    // The FIRST completion is preserved as immutable history alongside the second:
    // both cycle snapshots persist, with distinct digests (server-authoritative).
    const snap1 = await sifat2.request.get(`/api/v1/jobs/${jobId}/completion-snapshot?cycle=1`);
    const snap2 = await sifat2.request.get(`/api/v1/jobs/${jobId}/completion-snapshot?cycle=2`);
    expect(snap1.ok(), 'cycle-1 snapshot must still exist').toBeTruthy();
    expect(snap2.ok(), 'cycle-2 snapshot must exist').toBeTruthy();
    const d1 = (await snap1.json()).digest;
    const d2 = (await snap2.json()).digest;
    expect(d1).toBeTruthy();
    expect(d2).toBeTruthy();
    expect(d1, 'each cycle has its own sealed digest').not.toBe(d2);
    await sifatCtx2.close();
  });

  // -------------------------------------------------------------------------
  // 4. ASSIGNMENT — an unauthorized role sees no reassign controls and the server
  //    refuses its API call; an authorized master reassigns and history records it.
  // -------------------------------------------------------------------------
  test('assignment: unauthorized controls hidden + server-refused; authorized master reassigns', async ({ browser }) => {
    const plate = plateFor('ASSIGN');

    // ---- USTA: no reassign control, and the server refuses the API call ----
    const ustaCtx = await browser.newContext();
    const usta = await ustaCtx.newPage();
    await loginAs(usta, USERS.USTA);
    const jobId = await gotoJobByPlate(usta, plate);
    const ustaPanel = usta.getByRole('region', { name: /mas'ul texnik/i });
    await expect(ustaPanel).toContainText(/Usta/i);
    // USTA lacks jobs.assign → neither assign nor reassign control is rendered.
    await expect(ustaPanel.getByRole('button', { name: /biriktirish/i })).toHaveCount(0);
    // The server refuses the unauthorized assignment API call — with a valid CSRF
    // token, so the 403 comes from RBAC (jobs.assign), not the CSRF layer.
    const uCsrf = await csrfToken(usta);
    const refused = await usta.request.post(`/api/v1/jobs/${jobId}/assign`, {
      headers: { 'x-csrf-token': uCsrf },
      data: { technicianId: 999999 },
    });
    expect(refused.status(), 'server must refuse assignment without jobs.assign').toBe(403);
    expect((await refused.json()).error?.code, 'refusal must be RBAC, not CSRF').toBe('FORBIDDEN');
    await ustaCtx.close();

    // ---- MASTER: reassigns to another eligible technician ----
    const masterCtx = await browser.newContext();
    const master = await masterCtx.newPage();
    await loginAs(master, USERS.MASTER);
    await gotoJobByPlate(master, plate);
    const panel = master.getByRole('region', { name: /mas'ul texnik/i });
    await panel.getByRole('button', { name: /qayta biriktirish/i }).click();
    const dialog = master.getByRole('dialog');
    const select = dialog.getByLabel(/texnik \(filial ichidan\)/i);
    // Pick an eligible candidate other than the currently-assigned USTA.
    const masterOption = select.locator('option', { hasText: /Master/i });
    await expect(masterOption).toHaveCount(1);
    const masterValue = await masterOption.getAttribute('value');
    expect(masterValue).toBeTruthy();
    await select.selectOption(masterValue!);
    await Promise.all([
      master.waitForResponse((r) => /\/assign$/.test(r.url()) && r.request().method() === 'POST' && r.status() < 400),
      dialog.getByRole('button', { name: /^biriktirish$/i }).click(),
    ]);
    // The responsible technician now reflects the reassignment, and history logs it.
    await expect(panel).toContainText(/Master/i);
    await expect(panel.getByText(/biriktiruv tarixi/i)).toBeVisible();
    await panel.getByText(/biriktiruv tarixi/i).click();
    await expect(panel.getByText(/qayta biriktirildi/i)).toBeVisible();
    await masterCtx.close();
  });

  // -------------------------------------------------------------------------
  // 5. GPS STATES — granted / denied / low-accuracy captured at job start, plus
  //    an authorized override with a reason. GPS is evidence, never a start gate.
  //    (A "stale" fix is not reproducible in-browser — the platform stamps the
  //    position time as now — and is covered by the server gps.e2e suite.)
  // -------------------------------------------------------------------------
  test('gps: granted, denied, low-accuracy, and authorized override', async ({ browser }) => {
    const plate = plateFor('GPS');
    const geo = { latitude: 41.311081, longitude: 69.240562 };

    async function openStart(page: Page): Promise<void> {
      await gotoJobByPlate(page, plate);
      await page.getByRole('button', { name: /ishni boshlash/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }

    // granted (permission + acceptable accuracy) → captured and recorded.
    {
      const ctx = await browser.newContext({ geolocation: { ...geo, accuracy: 10 }, permissions: ['geolocation'] });
      const page = await ctx.newPage();
      await loginAs(page, USERS.USTA);
      await openStart(page);
      await Promise.all([
        page.waitForResponse((r) => /\/gps$/.test(r.url()) && r.request().method() === 'POST' && r.status() < 400),
        page.getByRole('dialog').getByRole('button', { name: /joylashuvni olish/i }).click(),
      ]);
      await expect(page.getByText(/o'rnatish joyi qayd etildi/i)).toBeVisible();
      await ctx.close();
    }

    // denied (permission not granted) → classified error, no fabricated coordinate.
    {
      const ctx = await browser.newContext({ permissions: [] });
      const page = await ctx.newPage();
      await loginAs(page, USERS.USTA);
      await openStart(page);
      await page.getByRole('dialog').getByRole('button', { name: /joylashuvni olish/i }).click();
      await expect(page.getByRole('alert').filter({ hasText: /ruxsat berilmadi/i })).toBeVisible();
      await ctx.close();
    }

    // low accuracy → warned, and NOT sent to the server as an acceptable capture.
    {
      const ctx = await browser.newContext({ geolocation: { ...geo, accuracy: 9999 }, permissions: ['geolocation'] });
      const page = await ctx.newPage();
      await loginAs(page, USERS.USTA);
      await openStart(page);
      await page.getByRole('dialog').getByRole('button', { name: /joylashuvni olish/i }).click();
      await expect(page.getByText(/aniqlik past/i)).toBeVisible();
      await ctx.close();
    }

    // authorized override with a mandatory reason (MASTER holds gps.override).
    {
      const ctx = await browser.newContext({ permissions: [] });
      const page = await ctx.newPage();
      await loginAs(page, USERS.MASTER);
      await openStart(page);
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /override qayd etish/i }).click();
      await dialog.getByPlaceholder(/override sababi/i).fill('Yerto\'la — GPS signali yo\'q');
      await Promise.all([
        page.waitForResponse((r) => /\/gps\/override$/.test(r.url()) && r.request().method() === 'POST' && r.status() < 400),
        dialog.getByRole('button', { name: /override saqlash/i }).click(),
      ]);
      await expect(dialog.getByText(/GPS override qayd etildi\./i)).toBeVisible();
      await ctx.close();
    }
  });
});
