# EASY GAS — Client

The EASY GAS operator web app: React 19 + Vite + TypeScript, React Router v7,
TanStack Query v5, Tailwind CSS v4, lucide-react icons, sonner toasts. The
backend (`../server`) is authoritative for every authorization and safety
decision; this client renders server truth and collects input.

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
- `npm test` — runs both (7 unit + 43 component).
- `npm run test:e2e` — Playwright flows in `e2e/` (happy / blocked-completion /
  GPS). **Not run in CI here** (`@playwright/test` not installed, no browser+DB
  harness). Local setup (macOS/Linux and Windows PowerShell) is documented in
  `playwright.config.ts`. Never point at production; never send real SMS.

> Note: the Vitest dev toolchain (esbuild/vite) carries dev-only `npm audit`
> advisories. It is a test-only dependency and never part of the production build.
