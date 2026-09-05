# Frontend Integration, Branding & UX — Phase 10E

This document describes the client-side work in Phase 10E: real EASY GAS branding, a
coherent design-token system, the **completed** Phase 10D safety integration in the
job-detail workflow, route code-splitting, route-level resilience, and the test
coverage that backs it. The server remains authoritative for every safety and
authorization decision — the frontend only renders server truth and collects input.

---

## 1. Brand system

- **`components/ui/Brand.tsx`** renders the **real** logo assets from `/public`
  (never regenerated, recolored, redrawn or stretched). Three inspected variants
  mapped to their true aspect ratios so there is **no layout shift**:
  - `wordmark` → `/easygas-side-text.png` (729×207) — horizontal lockup (header, auth).
  - `stacked` → `/easygas-bottom-text.png` (1024×1024) — monogram over "easy gas".
  - `mark` → `/easygas-none-text.png` (1024×1024) — the monogram alone (icon, 404, favicon).
- Intrinsic `width`/`height` come from each asset's ratio; `priority` loads above-the-fold
  logos eagerly, the rest lazily. `decorative` yields an empty `alt` + `aria-hidden`
  when a nearby text label already names the brand (so the logo is not announced twice).
- Applied to: auth screens (`AuthLayout`), the app header (`AppShell`), the full-screen
  loader (`FullScreenLoader`), the 404 page, and the browser tab (`index.html` favicon +
  apple-touch-icon).

## 2. Design tokens & shared components

- **`index.css`** defines a light-first palette as CSS custom properties on `:root`, with
  `.theme-dark` overrides for the auth backdrop. Tokens: brand **red** (existing) + brand
  **blue** accent (derived from the logo), plus semantic `surface/text/border/success/
  warning/danger/critical/focus/accent`. Every status token is a paired fg/bg and is always
  accompanied by an icon **and** text — **never colour alone** (WCAG-minded).
- A global `:focus-visible` outline (`--focus`) gives every interactive element a visible
  keyboard focus ring.
- Reusable primitives already in `components/ui`: `Button`, `Input`, `PasswordInput`,
  `Select`, `Checkbox`, `Alert`, `Modal`, `ConfirmDialog`, `Spinner`, `Brand`,
  `FullScreenLoader`. Dangerous actions use the distinct `danger-outline` button; CRITICAL
  risk uses the strongest `--critical` accent.

## 3. Shell & navigation (`pages/app/AppShell.tsx`)

- Branded header (wordmark), user name + role, logout.
- Permission-driven navigation (UX only — the backend enforces access). Active route is
  marked by `NavLink`'s automatic `aria-current="page"`. The nav is a labelled, horizontally
  scrollable rail on small screens with **≥44px touch targets**; the risk-policy warning
  banner sits directly beneath the header for approvers.

## 4. Completed Phase 10D safety integration (job detail)

This closes the Phase 10D acceptance debt — the safety widgets are now **wired into the
routed job-detail screen**, not left as unused components.

- **Assignment (`AssignmentPanel.tsx`, §12):** shows the responsible technician, the
  immutable assignment history, and — for `jobs.assign` holders — a reassign dialog whose
  candidates come from a branch-scoped server endpoint
  (`GET /jobs/:id/assignment/candidates`). Actual step performers are shown separately by
  the checklist. A conflict (terminal job, cross-branch, inactive technician) refetches the
  authoritative state.
- **Risk register (`RiskPanel.tsx`, §21):** current- and prior-cycle risks with the
  **server-computed** level / score / blocking / matrix version (the client never derives
  them). Blocking status is shown as the word "Bloklaydi" + icon (not colour alone). Create
  / resolve / override are gated per permission; override shows an audited-action warning.
  Unresolved blocking risks are surfaced as the count that stops completion.
- **GPS at job start (`StartJobModal.tsx`, §20):** GPS capture is embedded in the job-start
  action, requested **only on an explicit click**, with accuracy shown and denied /
  unavailable / timeout / low-accuracy handled. `gps.override` holders may record an
  override with a reason. GPS is evidence, not a completion gate — start is never blocked on
  it; the server re-validates.
- **Completion (`CompletionSection.tsx`, §22–23):** the readiness checklist now includes the
  **blocking-risk** condition. Before signing, the customer reviews the server-built
  **signable summary** (`SignableSummaryCard.tsx`) and its canonical **digest**; the
  signature is submitted bound to that digest. A stale summary
  (`SIGNATURE_STALE` / `SUMMARY_STALE`) refetches the fresh summary and forces a re-sign —
  never a silent accept. Completed jobs show the immutable, digest-sealed **completion
  snapshot** (`CompletionSnapshotView`), honest about legacy jobs with no snapshot.

## 5. Route code-splitting (§K)

`app/router.tsx` lazy-loads every non-critical route with `React.lazy` + `Suspense`
(fallback: `RouteFallback`). Only the shell, guards, and the first screens (login, home,
404) are eager.

| Bundle | Before | After |
| --- | --- | --- |
| main JS chunk | **652.19 kB** (gzip 188.32 kB) | **397.71 kB** (gzip 125.12 kB) |
| 500 kB build warning | present | **gone** |
| JobDetailPage | in main | own 71.17 kB chunk (gzip 17.13 kB), loaded on demand |
| admin / templates / job flows | in main | separate on-demand chunks |

## 6. Resilience & session UX (§L)

- **`RouteErrorBoundary`** wraps the routed outlet (app + guest). A failed lazy-chunk fetch
  after a deploy offers a **reload**; any other render error offers an in-place **retry**.
  It never renders a stack trace or internal path.
- **`NotFoundPage`** — a branded 404 for unknown `/app` routes (not a silent redirect).
- **Session expiry:** the API client fires `easygas:session-expired` on a definitive 401;
  `auth-context` clears cached auth (route guards then redirect **once** — no loop) and shows
  a toast. Transient/offline failures (no response) never trigger this, so unsaved work
  survives a flaky network.

## 7. Dialog accessibility (§I)

`Modal` (and `ConfirmDialog`, which wraps it) is `role="dialog"` + `aria-modal="true"`,
traps Tab/Shift+Tab inside, moves focus in on open and **restores focus to the trigger** on
close, and closes on Escape. The focus effect keys off `open` only (latest `onClose` via a
ref) so it does not steal focus on every keystroke.

## 8. Tests (§M)

Run with `npm test` (7 pure-logic `*.test.ts` via tsx + node:test, then 44 component
`*.test.tsx` via vitest + jsdom + RTL). Component coverage:

- Brand: real asset + meaningful/empty alt + no-CLS dimensions.
- My assigned jobs: loading / list / empty / legacy / **error-state + retry** (no unhandled
  rejection) states.
- Assignment: permission gating, current technician, history, branch-scoped candidates.
- Risk: server-calculated level/blocking as **text** (not colour), current vs prior cycle,
  create gating, blocking-count banner, **error state**.
- GPS: click-only (no auto-request), success/denied/low-accuracy (feature + logic suites),
  override-with-reason (StartJobModal).
- Completion: blocking-risk condition row, signable summary + digest shown, signature bound
  to the digest, stale → re-sign refetch, immutable snapshot + legacy-honest fallback.
- Dialog: role/aria, focus-in, Tab trap, Escape close, focus restore.
- Error boundary: chunk-error reload + generic retry, no stack trace leaked.
- Session expiry: 401 event clears the user (no redirect loop).
- Risk-policy: unapproved-policy warning + approver-only controls.

**MyJobsPage error state (real routed test).** `MyJobsPage.test.tsx` renders the actual
routed screen with a rejecting `myJobs` request and asserts the user-friendly error state +
retry affordance, that retry re-invokes the request and the list then renders (the
`keepPreviousData` path stays correct — no stale error), and — via a scoped
`unhandledRejection` listener asserted empty — that **no unhandled promise rejection**
occurs. The harness fix was in the test, not a global suppression: a single
`mockRejectedValueOnce` driven to a settled state (fresh `QueryClient` per render + the
`QueryCache` `onError` sink in `test/utils`, `retry: false`) is cleanly handled, whereas a
*permanent* `mockRejectedValue` under `keepPreviousData` spawned repeated floating
rejections. No global unhandled-rejection handling is used.

## 9. End-to-end (§N) — reproducible and executed

`@playwright/test` is a **pinned devDependency**, so `npm ci` installs the runner and
`npm run test:e2e -- --list` works from a clean clone (scripts: `test:e2e`,
`test:e2e:headed`, `test:e2e:ui`, `test:e2e:install`). The `webServer` block starts BOTH
tiers automatically for `npm run test:e2e`:

- **API E2E harness** (`server: npm run test:e2e:serve` → `tests/e2e-server.ts`): sets up the
  isolated `*_test` DB (refuses any non-`*_test` DB), installs a **fake console SMS** provider
  and the **in-memory storage** provider (no real Eskiz / S3 / SMS), activates the provisional
  v1 risk policy, seeds a demo assigned job, and serves on `:4000` (the port Vite proxies
  `/api` to). Redis is the in-memory implementation under `NODE_ENV=test`. It sets a
  strictly-non-production, per-request `E2E_DISABLE_RATE_LIMIT` so the same demo user can log
  in across many tests/re-runs (the real limiters stay covered by `tests/ratelimit.e2e`).
- **Vite dev server** on `:5173`.

Browsers: Playwright's bundled Chromium (install once via `npm run test:e2e:install`), or a
system browser with **no download** via `PW_CHANNEL=msedge` / `PW_CHANNEL=chrome`. Video
capture is opt-in (`PW_VIDEO=1`) so a system-browser run needs no bundled ffmpeg. Windows
PowerShell run commands are in `playwright.config.ts`.

Specs (`e2e/safety.spec.ts`, `e2e/visual.spec.ts`) target the **real routes**: login (real
phone-formatting + password), open the assigned job, GPS embedded in the start action
(granted + permission-denied), the risk register region, and a responsive/visual smoke check
(logos load undistorted, no horizontal overflow, no severe JS errors, no unexpected failed
API requests at 360 / 768 / 1366 / 1920 and the Pixel-5 profile). **Executed** against the
installed system Edge (`PW_CHANNEL=msedge`): **8/8 passing** (4 specs × chromium + mobile
projects), repeatably. Artifacts (`test-results/`, `playwright-report/`) are git-ignored.

## 10. Security & privacy posture (§P)

- Session and CSRF tokens live **only in memory** (`api/client.ts`); nothing sensitive is in
  `localStorage`. CSRF adoption is monotonic (rotation-sequence guarded).
- No client-authoritative risk/score/blocking, completion gate, or digest — all server-computed.
- Branch scoping and RBAC are server-enforced; the UI permission checks are UX-only.
- No GPS coordinates or signature bytes are logged; the signable summary shows a **masked**
  customer phone.
- No `alert()`/`confirm()`; destructive actions use accessible confirm dialogs. No
  `dangerouslySetInnerHTML`. Auth errors stay generic (no account enumeration).

## 11. Dependency audit

- **Production dependencies** (`npm audit --omit=dev`): **0 vulnerabilities**.
- **Full tree** (`npm audit`, dev + prod): **5** — all in the Vitest/Vite/esbuild **dev**
  toolchain (`vitest` CRITICAL, `vite` HIGH, `@vitest/mocker` / `esbuild` / `vite-node`
  MODERATE). Every one is fixable **only** by `vitest@5.0.0`, a SemVer-**major** breaking
  change; it is intentionally **not** applied here (a deliberate test-toolchain upgrade, not
  an acceptance fix) because these are dev-only and never ship in the production bundle. The
  earlier Playwright advisories were resolved by pinning `@playwright/test` to `^1.63.0` (a
  non-breaking, in-1.x upgrade). Production and full-tree results are different by design and
  are reported separately above.

## 12. Server change in this phase

One justified server addition unblocked the assignment UI: a branch-scoped candidate list
(`assignment.service.listCandidates` + `GET /jobs/:id/assignment/candidates`, gated by
`jobs.assign`) so a MASTER can pick a technician **without** the broad `users.view`
permission, plus assignment fields (`assignedTechnicianId/Name`, `assignmentStatus`,
`cycle`) on the job detail. No business logic moved to the client.
