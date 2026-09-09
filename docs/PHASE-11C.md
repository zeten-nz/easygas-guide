# Phase 11C (client) — Evidence Review UX & Understandable Risk Policy

Routed workflows built on the existing 11A/11B shell (Pagination, `useTableParams`
URL state, Inputs/Select, DropdownMenu, Alerts, Buttons, and the **centered
single-scroll Modal** — the Phase 11B fix). No bottom-anchored/sticky modal footer
was reintroduced.

## A. Completed-job evidence entry point

- **Jobs list** (`/app/jobs`, `JobsPage`) gained **date-range** filters (`dateFrom`/
  `dateTo`) and a **responsible-technician** filter (`TechnicianFilter`) — a bounded,
  server-backed, debounced searchable combobox over `GET /jobs/technicians` (never a
  fetch-all), resolving the selected name by id so it shows after reload. All filters
  are URL-synced (`useTableParams`): branch scope, pagination reset and Back
  navigation are preserved. A "Tugallangan ishlar" nav shortcut deep-links to
  `/app/jobs?status=COMPLETED`. The technician filter targets the RESPONSIBLE
  technician (`jobs.assigned_technician_id`), never the photo uploader / step performer.
- All filters live in the URL (`useTableParams`), so opening a job and pressing
  browser **Back restores the filtered page**.

## B. Job photo gallery (embedded in JobDetail)

`JobEvidenceGallery` (`src/pages/jobs/JobEvidenceGallery.tsx`) renders inside
`JobDetailPage` once work has begun. It reads `GET /jobs/:id/photos` and shows
**truthful, server-computed** provenance — it never infers cycle/performer from the
current job:

- Grouped by **completed cycle** (authoritative snapshot history) then step, with a
  separate "Joriy va boshqa dalillar" group for current / superseded evidence.
- Each tile shows the step, a **role badge** (Yakunlangan tsikl / Joriy / Eskirgan
  urinish / **Tarixiy (aniqlanmagan)** / Tekshirilmagan (eski) / Muvaffaqiyatsiz), the
  **uploader** (labelled "Yuklagan" — deliberately not the step performer or assigned
  technician), timestamp, attempt, and cycle(s). A photo spanning several completed
  cycles shows all of them ("1, 2-tsikllar"); when a value is genuinely unknown it says
  **"Ma'lumot mavjud emas"** / "Tsikl: joriy/aniqlanmagan" rather than inventing one.
  All role/provenance is server-computed (see server `PHASE-11C.md`); the client never
  infers a cycle or labels unmatched evidence "current".
- Only **READY** photos are openable; unverified/pending/failed rows show their state
  and are not clickable (colour is always paired with an icon + words).
- Thumbnails reserve their box (`aspect-square`), **lazy-load**, and paginate
  incrementally ("Yana yuklash"). Loading / empty / error(+retry) states are handled.
- **Bandwidth note:** the backend stores no thumbnails, so tiles load the original
  lazily rather than fetching every full-resolution image upfront. This is an honest
  limitation, not a derivative pipeline (out of scope for 11C).

## B. Accessible photo viewer

`PhotoViewer` (`src/pages/jobs/PhotoViewer.tsx`) — a full-screen lightbox opened from a
READY tile. All interactive controls are in the **top bar + vertically-centred side
arrows** (never a bottom-flush footer, per the 11B mobile visual-viewport lesson):

- Caption (step / uploader / time / attempt / cycle), previous/next within the
  selected gallery context, zoom in/out/reset (+ double-tap), drag-to-pan when zoomed.
- Close button + **Escape**, **keyboard** nav (←/→, +/-/0), **focus trap + restore**,
  `aria-modal` dialog, loading/error states. It does not hijack browser zoom or block
  touch scrolling.
- Images stream from the authorized backend endpoint (no signed URLs), so a load
  failure means the object is unavailable — a **bounded manual retry** re-requests it
  (no auto-reload loop). No signed URLs are ever persisted.

## C/D. Risk policy — explanation, real matrix, preview, history, approval

`RiskPolicyPage` (`/app/admin/risk-policy`, `risk.matrix.approve` = SIFAT/ADMIN),
redesigned:

- **Plain-language explainer** (Uzbek): risk event ↔ job, the matrix as the rule,
  severity, likelihood, blocking levels, and why an approved policy is required —
  understandable without reading §21, with the doc reference kept secondary. It does
  not claim legal certification or job safety.
- **Real matrix visualization** (`RiskMatrixTable`) rendered from the server's computed
  `cells` (no thresholds hardcoded in React, no matrix duplicated client-side). An
  accessible `<table>` with a caption and per-cell aria-labels; every cell states its
  level in words + a blocking marker (colour supplements, never replaces, the label);
  scrolls horizontally on narrow screens.
- **Scoring rule, thresholds, source overrides, and affected operations** shown from the
  server definition; states covered: **no ACTIVE**, DRAFT, ACTIVE, RETIRED, and a safe
  error state (no silent fallback matrix if loading fails).
- **Provenance vs lifecycle**: v1's "provisional" origin is shown as provenance and
  explicitly distinguished from approval — an approved provisional-origin version is
  not labelled "unapproved".
- **Illustrative preview**: severity/likelihood/source selectors call
  `GET /risk-policy/versions/:v/preview` (the shared server evaluator); the result is
  labelled an example, names the version, and — for a non-ACTIVE version — notes that
  production assessment still needs an ACTIVE policy. No risk event / activation.
- **History**: every version with approver name (id fallback), timestamp, rationale and
  status; select any version to view it; a **compare** highlights threshold / blocking /
  override / status differences.
- **Approval UX**: activating a DRAFT opens the shared centered Modal, **naming the
  version**, explaining the operational effects (becomes the governing policy; the
  current ACTIVE is retired; blocking-level risks block completion/quality), and
  requiring a rationale; on success or a concurrent-activation conflict it refetches.
  A **retire** control warns when retiring the only ACTIVE would leave the domain
  fail-closed. No dual-approval rule or role change was invented.

## Tests

- **Component** (`vitest`): `RiskPolicyPage` (explanation, real matrix labels + blocking
  text, permissioned controls, illustrative preview, no-fallback error), `RiskMatrixTable`
  (accessible labels + blocking), `JobEvidenceGallery` (loading/empty/roles + only-READY
  clickable), `PhotoViewer` (dialog/focus, Escape + close, arrow-key nav, conditional
  next control). Full suite **24 files / 77 tests** green; lint + `tsc -b` + build clean;
  bundle budget OK (main ~121 KB gz / total ~251 KB gz).
- **Browser E2E** (`e2e/evidence-policy.spec.ts`, both chromium + Pixel-5 projects):
  completed-job list → job → gallery → viewer → **Back restores filters**; reopened-job
  previous-cycle vs current evidence; viewer next/previous/keyboard/close; unavailable
  image (bounded retry) and listing-error (retry) states; policy explanation/matrix/
  history/preview; a non-approver cannot reach the screen; and an **authorized
  activation of an isolated fixture policy** (which also exercises the shared centered
  dialog on the mobile visual viewport). Fixtures are seeded by the server harness
  (`E2E-EVI-<proj>`, `E2E-EVR-<proj>`) through the real workflow — no faked status.

## Remaining limitations

- No image thumbnails/derivatives (bounded/lazy originals, stated above).
- The technician filter lists technicians who have jobs in scope; a now-inactive
  technician with historical jobs is still offered (source `jobs.assigned_technician_id`).
- Cross-repo: needs the Phase 11C server endpoints — **merge server first, then client**.
  Base refs: client `de0dc1f`, server `4df8c91`.
