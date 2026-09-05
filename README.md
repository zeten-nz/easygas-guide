# EASY GAS — Client

The EASY GAS operator web app: React 19 + Vite + TypeScript, React Router v7,
TanStack Query v5, Tailwind CSS v4, lucide-react icons, sonner toasts. The
backend (`../server`) is authoritative for every authorization and safety
decision; this client renders server truth and collects input.

## Documentation

The canonical, git-tracked project status lives in the server repo:
**[../server/docs/PROJECT_STATUS.md](../server/docs/PROJECT_STATUS.md)**.

- **CI & release** — this client's CI (`client-ci`) and the cross-repo full-stack E2E
  workflow are documented in
  [../server/docs/CI-RELEASE-10F.md](../server/docs/CI-RELEASE-10F.md) (see §B and §C).
- Frontend/UX detail: [docs/FRONTEND-UX-10E.md](docs/FRONTEND-UX-10E.md).

## Scripts

- `npm run dev` — Vite dev server (proxies `/api/v1` per `VITE_API_URL`).
- `npm run build` — typecheck (`tsc -b`) + production build. Routes are
  code-split, so the build emits a small main chunk plus on-demand route chunks.
- `npm run lint` — ESLint.
- `npm test` — `test:unit` then `test:component` (see Testing).

## Architecture

- **Routing & code-splitting** — `src/app/router.tsx` lazy-loads non-critical
  routes (`React.lazy` + `Suspense`); the shell, guards, and first screens
  (login, home, 404) are eager. A `RouteErrorBoundary` + `RouteFallback` wrap the
  routed outlet, so a failed lazy-chunk fetch after a deploy offers a reload.
- **Auth & security** — session/CSRF tokens are held **in memory only**
  (`src/api/client.ts`), never in `localStorage`; CSRF adoption is
  rotation-sequence guarded. A definitive 401 fires `easygas:session-expired`,
  which clears cached auth so the guards redirect once (no loop).
- **Design system** — light-first CSS custom properties in `src/index.css`
  (brand red + blue accent, semantic status tokens paired fg/bg, never colour
  alone), reusable primitives in `src/components/ui` (`Brand`, `Button`, `Input`,
  `PasswordInput`, `Select`, `Modal`/`ConfirmDialog` with a focus trap, `Alert`,
  …).
- **Branding** — `src/components/ui/Brand.tsx` renders the real logo assets from
  `/public` at their true aspect ratios (no CLS, never recolored/redrawn).
- **Safety domain (Phase 10D, integrated in 10E)** — the job-detail screen wires
  assignment, the risk register, GPS-at-start, the signable summary + digest-bound
  signature (with stale re-sign), and the immutable completion snapshot. See
  [docs/FRONTEND-UX-10E.md](docs/FRONTEND-UX-10E.md).

## Testing

- `npm run test:unit` — pure safety-critical logic (tsx + node:test): GPS capture
  states, risk-form validation, completion-blocker mapping, stale-signature
  handling, CSRF rotation ordering.
- `npm run test:component` — component/integration tests (Vitest + jsdom + RTL):
  branding, my-jobs states, assignment permissions/candidates, server-calculated
  risk (text not colour), GPS override, signable summary + digest binding + stale
  re-sign, completion snapshot, dialog focus trap, route error boundary, session
  expiry, risk-policy warning. Test files are typechecked via `tsconfig.test.json`
  (the production build excludes them).
- `npm test` — runs both (7 unit + 44 component).
- `npm run test:e2e` — Playwright browser flows in `e2e/` (safety happy path,
  blocked-completion entry, GPS granted/denied, and a responsive/visual smoke
  check). `@playwright/test` is a **pinned devDependency** (so `npm ci` installs
  it and `npm run test:e2e -- --list` works from a clean clone). The
  `webServer` block auto-starts BOTH tiers: the API E2E harness
  (`../server` → `npm run test:e2e:serve`: isolated `*_test` DB, fake SMS,
  in-memory storage, ACTIVE v1 policy, a seeded assigned job) and the Vite dev
  server. Run against bundled Chromium (install once via
  `npm run test:e2e:install`) or a **system browser** with no download via
  `PW_CHANNEL=msedge npm run test:e2e`. Windows PowerShell commands are in
  `playwright.config.ts`. Never point at production; never send real SMS.

## Dependency audit

`npm audit --omit=dev` (production) is **0 vulnerabilities**. The full
`npm audit` reports dev-only Vitest/Vite/esbuild advisories fixable only by a
Vitest major upgrade (not applied here — dev-only, never shipped). See
`docs/FRONTEND-UX-10E.md` §11.

> Note: the Vitest dev toolchain (esbuild/vite) carries dev-only `npm audit`
> advisories. It is a test-only dependency and never part of the production build.
