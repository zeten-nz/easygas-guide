// Phase 10F full-stack gate guard.
//
// Reads the Playwright JSON report and decides whether the full-stack browser
// safety suite ran to a clean, complete result. It fails (exit 1) — with an
// ACCURATE reason — when specs were discovered-but-not-run, failed, skipped,
// flaky, interrupted, or when the report is missing/malformed. Run after the
// Playwright step with `if: always()` so it also runs when the tests failed.
//
//   node scripts/assert-e2e-complete.mjs [test-results.json]
//
// Playwright's JSON `stats` is { expected, unexpected, flaky, skipped } — where
// `expected` == passed and `unexpected` == failed. We additionally walk `suites`
// to count DISCOVERED specs and INTERRUPTED results, and treat top-level `errors`
// (e.g. a failed global setup / preflight) as a hard failure. The earlier version
// only looked at `expected`, so a run where all 12 specs FAILED (expected:0,
// unexpected:12) was mis-reported as "zero specs executed".
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Derive discovered/executed/interrupted counts from a Playwright JSON report. */
export function collect(report) {
  const stats = (report && report.stats) || {};
  const expected = stats.expected ?? 0; // passed as expected
  const unexpected = stats.unexpected ?? 0; // failed
  const flaky = stats.flaky ?? 0;
  const skipped = stats.skipped ?? 0;

  let discovered = 0;
  let interrupted = 0;
  const walk = (suites = []) => {
    for (const suite of suites) {
      for (const spec of suite.specs ?? []) {
        discovered += 1;
        for (const t of spec.tests ?? []) {
          for (const r of t.results ?? []) {
            if (r.status === 'interrupted') interrupted += 1;
          }
        }
      }
      walk(suite.suites ?? []);
    }
  };
  walk((report && report.suites) || []);

  // If the report carried no navigable suite tree, fall back to the stats totals.
  if (discovered === 0) discovered = expected + unexpected + flaky + skipped;

  const globalErrors = Array.isArray(report && report.errors) ? report.errors.length : 0;
  const executed = expected + unexpected + flaky; // skipped specs are NOT executed

  return { discovered, executed, expected, passed: expected, unexpected, failed: unexpected, flaky, skipped, interrupted, globalErrors };
}

/**
 * Evaluate a parsed report. Returns { ok, reasons, summary }. `ok` is true only
 * when every discovered spec executed and passed (no fail/skip/flaky/interrupt).
 */
export function evaluate(report) {
  if (!report || typeof report !== 'object' || (!report.stats && !report.suites)) {
    return { ok: false, reasons: ['malformed or missing Playwright report'], summary: null };
  }
  const s = collect(report);
  const reasons = [];

  if (s.discovered === 0) reasons.push('zero specs discovered');
  if (s.globalErrors > 0) reasons.push(`${s.globalErrors} global error(s) (e.g. global setup / preflight failed)`);
  if (s.interrupted > 0) reasons.push(`${s.interrupted} spec(s) interrupted/incomplete`);
  if (s.failed > 0) reasons.push(`${s.failed} spec(s) failed`);
  if (s.flaky > 0) reasons.push(`${s.flaky} spec(s) flaky (nondeterministic — not allowed on the safety gate)`);
  if (s.discovered > 0 && s.executed === 0) reasons.push('zero specs executed');
  if (s.skipped > 0) reasons.push(`${s.skipped} spec(s) skipped (the full safety gate forbids skips)`);

  return { ok: reasons.length === 0, reasons, summary: s };
}

/** One-line human summary of the counts. */
export function formatSummary(s) {
  if (!s) return 'no summary (report unreadable)';
  return `discovered=${s.discovered} executed=${s.executed} passed=${s.passed} failed=${s.failed} flaky=${s.flaky} skipped=${s.skipped} interrupted=${s.interrupted} globalErrors=${s.globalErrors}`;
}

/** Load + evaluate a report file; returns { ok, reasons, summary } (never throws). */
export function evaluateFile(path) {
  if (!existsSync(path)) {
    return { ok: false, reasons: [`report not found at ${path} — the E2E run produced no JSON report`], summary: null };
  }
  let report;
  try {
    report = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    return { ok: false, reasons: [`report at ${path} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`], summary: null };
  }
  return evaluate(report);
}

// ---- CLI ----
function isDirectRun() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isDirectRun()) {
  const path = process.argv[2] ?? 'test-results.json';
  const { ok, reasons, summary } = evaluateFile(path);
  console.log(`Playwright: ${formatSummary(summary)}`);
  if (ok) {
    console.log(`OK: ${summary.executed} specs executed, all passed, 0 skipped.`);
    process.exit(0);
  }
  for (const r of reasons) console.error(`::error::${r}`);
  process.exit(1);
}
