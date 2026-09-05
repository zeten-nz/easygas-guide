# Frontend Full-Stack Browser E2E — Phase 10F

Real-browser, full-stack Playwright coverage of the EASY GAS safety workflow. These specs drive the
**actual UI and API** against a live server harness — they are **not** backend HTTP tests and **not**
component tests, both of which live elsewhere and do not count as browser E2E.

---

## What runs

| Spec | Purpose |
|---|---|
| `e2e/workflow.spec.ts` | The five complete safety journeys (below). |
| `e2e/visual.spec.ts` | Logos load, no horizontal overflow, no severe console errors across breakpoints; opens the dedicated **`E2E-VIW`** job (never a mutated workflow job). |
| `e2e/helpers.ts` | Shared login / navigation / signature / checklist / GPS / CSRF / error-guard helpers. Accessible locators only (roles, labels, text) — never brittle CSS. |

### The five journeys (`workflow.spec.ts`)

1. **Happy path** — USTA logs in, opens the seeded job, sees the responsible technician, starts with
   granted GPS, assigns the published checklist, completes every step through the UI, reads the
   signable summary + canonical digest, signs on the real canvas, confirms the signature is bound to
   the digest; MASTER closes the job and views the immutable, digest-sealed completion snapshot. This
   journey is additionally guarded for **no severe console errors / no unexpected failed API calls**.
2. **Blocking risk** — a server-computed **CRITICAL, blocking** risk (severity 4 × likelihood 4)
   refuses completion: the close control is disabled, `KRITIK`/`Bloklaydi` show as text, and the
   server itself returns **422 `COMPLETION_BLOCKED`** (checked with a valid CSRF token, so the
   refusal is the completion gate — not the CSRF layer). An authorized MASTER resolves the risk; the
   customer then signs the summary reflecting the resolved state and MASTER closes.
3. **Reopen** — from a completed job SIFAT reopens with a mandatory reason; the cycle increments, the
   prior signature no longer authorizes the new cycle (a **fresh** signature is required), MASTER
   sends to quality review, SIFAT confirms → a **second** sealed snapshot. Both cycle snapshots
   persist with **distinct digests** (verified via the API) — the first completion is kept as
   immutable history.
4. **Assignment** — an unauthorized role (USTA) sees **no** reassign control and the server refuses
   its `POST /jobs/:id/assign` with **403 `FORBIDDEN`** (valid CSRF token → the 403 is RBAC, not
   CSRF); an authorized MASTER reassigns to another eligible technician and the history records it.
5. **GPS states** — granted (captured + recorded), denied (classified error, no fabricated
   coordinate), low-accuracy (warned, not sent as an acceptable capture), and an **authorized
   override** with a mandatory reason (MASTER, `gps.override`). A "stale" fix is **not**
   browser-reproducible (the platform stamps the position time as *now*) and is covered by the
   server `gps.e2e` suite.

**Profiles:** essential journeys run on **desktop Chrome** and **Pixel 5** (touch, mobile viewport,
mobile GPS permission). Reopen runs on **both** profiles too — each flow has its own per-`(flow ×
project)` seeded job, so **no spec is skipped**.

---

## The harness (server repo)

`npm run test:e2e:serve` (in `../server`) = `test:e2e:reset` then the API harness:

- Isolated **`easygas_test`** database, **fail-closed** to any non-`*_test` name.
- `test:e2e:reset` **drops + recreates** the test DB, migrates, seeds, and activates the provisional
  **v1 risk matrix** — so every run starts from an **identical** fixture set (no leakage between
  runs).
- **Fake console SMS** (no Eskiz), **in-memory storage** (no S3), in-memory Redis under `NODE_ENV=test`.
- Seeds one **published** checklist template and a **pool of DRAFT jobs** — one per `(flow × project)`
  — assigned to the demo USTA. It seeds only **prerequisites**; every status transition is driven by
  the test through the real UI/API (no direct final-status SQL writes).
- Listens on `:4000` (the port Vite proxies `/api` to).

Playwright's `webServer` block starts this harness + Vite automatically and gates on
`/api/v1/health` before any spec runs.

---

## Running locally

```bash
# One command (Playwright starts the ../server harness + Vite for you):
cd client
npm run test:e2e                      # bundled Chromium (npm run test:e2e:install once)
PW_CHANNEL=msedge npm run test:e2e    # against system Edge — no browser download

# Two-terminal alternative (PowerShell):
#   Terminal 1:  cd ..\server ; npm run test:e2e:serve
#   Terminal 2:  cd client ; npm run dev
#   Terminal 3:  cd client ; $env:PW_CHANNEL='msedge' ; $env:PW_NO_SERVER='1' ; npm run test:e2e
```

Run the **complete** suite **twice** to confirm there is no fixture leakage — the per-run DB reset
plus per-`(flow × project)` jobs make the two passes identical.

Never point at production; never send real SMS; artifacts (`test-results/`, `test-results.json`,
`playwright-report/`) are git-ignored and never committed.

---

## In CI (`e2e-fullstack`, both public repos)

The tokenless cross-repo `e2e-fullstack` workflow runs this suite on GitHub-hosted Actions (client
PR × server main, and the mirror server PR × client main). It **fails loudly** on: zero specs
discovered, **any** spec skipped/failed/flaky/interrupted or zero executed
(`scripts/assert-e2e-complete.mjs` over the Playwright JSON report — reporting the *real* reason,
e.g. "N failed"), a backend that never becomes ready, failed migrations, an inactive risk policy, or
unexpected severe console/API errors. See `server/docs/CI-RELEASE-10F.md` §C and §G.

**Preflight & the coordinated cross-repo order.** Playwright's `global-setup` (`e2e/global-setup.ts`)
hits the harness's unauthenticated `GET /api/v1/e2e/preflight` before any browser opens; if the
server under test lacks the Phase 10F fixtures (e.g. an OLD server `main` from before 10F merged —
no preflight route → 404) it fails fast with a clear message instead of 12 opaque "job not found"
failures. Because the check tests **the other repo's `main`**, the coordinated recovery order is:
merge the **server** Phase 10F first, then the client hotfix E2E (now against the updated server
`main`) goes green — no stale ref is hard-coded, and `workflow_dispatch` can target a branch
explicitly when needed.

> **Status:** run end-to-end **locally** (twice, both profiles, all specs green). The branch is
> unpushed, so there is no GitHub Actions run yet — _locally validated, awaiting first GitHub run._
