// Phase 10F full-stack gate guard.
//
// Reads the Playwright JSON report and FAILS the CI run if any spec was skipped
// or if zero specs actually executed — so the full-stack browser safety workflow
// can never pass silently by skipping specs or discovering none. Run after the
// Playwright step with `if: always()` so it also runs when the tests failed.
//
//   node scripts/assert-e2e-complete.mjs [test-results.json]
import { existsSync, readFileSync } from 'node:fs';

const path = process.argv[2] ?? 'test-results.json';
if (!existsSync(path)) {
  console.error(`::error::${path} not found — the E2E run produced no JSON report`);
  process.exit(1);
}

const stats = JSON.parse(readFileSync(path, 'utf8')).stats ?? {};
console.log('Playwright stats:', JSON.stringify(stats));

const expected = stats.expected ?? 0;
const skipped = stats.skipped ?? 0;

if (expected === 0) {
  console.error('::error::zero specs executed — the full-stack safety workflow ran nothing');
  process.exit(1);
}
if (skipped > 0) {
  console.error(`::error::${skipped} spec(s) skipped — the full-stack safety workflow must run every spec`);
  process.exit(1);
}
console.log(`OK: ${expected} specs executed, 0 skipped.`);
