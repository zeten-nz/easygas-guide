import type { FullConfig } from '@playwright/test';

/**
 * Phase 10F E2E preflight (runs once, BEFORE any browser opens).
 *
 * Verifies the server harness actually seeded the fixtures the browser specs
 * depend on. If the wrong server was started/cloned — e.g. an OLD server `main`
 * from before Phase 10F merged, whose harness does not seed the per-flow jobs and
 * has no preflight endpoint — this fails the whole run immediately with a clear
 * message, instead of surfacing as 12 opaque "seeded job … not found" failures.
 *
 * Non-sensitive: it reads only booleans / counts / short plate codes.
 */
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000';

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const url = `${API}/api/v1/e2e/preflight`;

  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(
      `[e2e preflight] cannot reach the server harness at ${url}: ${err instanceof Error ? err.message : String(err)}. ` +
        `Is the Phase 10F server harness running (npm run test:e2e:serve)?`,
    );
  }

  if (res.status === 404) {
    throw new Error(
      `[e2e preflight] ${url} returned 404 — the server under test does NOT expose the Phase 10F preflight. ` +
        `You are almost certainly testing an OLD server (e.g. server 'main' before Phase 10F was merged). ` +
        `Run the full-stack E2E against the Phase 10F server (server PR branch, or server main AFTER it merges).`,
    );
  }

  const body = (await res.json().catch(() => ({}))) as {
    ready?: boolean;
    seededPlates?: number;
    expectedPlates?: number;
    missingPlates?: string[];
    publishedTemplate?: boolean;
    activeRiskPolicy?: boolean;
  };

  if (!res.ok || !body.ready) {
    throw new Error(
      `[e2e preflight] server fixtures are NOT ready (HTTP ${res.status}): ${JSON.stringify(body)}. ` +
        `Refusing to open the browser suite.`,
    );
  }

  console.log(
    `[e2e preflight] fixtures ready — ${body.seededPlates}/${body.expectedPlates} plates, ` +
      `template=${body.publishedTemplate}, policy=${body.activeRiskPolicy}.`,
  );
}
