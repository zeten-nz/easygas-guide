// EASY GAS client bundle-size budget (Phase 10F).
// Fails CI if the main entry chunk or total JS exceeds budget (gzipped).
// Run after `npm run build`. Budgets have headroom over the current baseline
// (main ~125 KB gzip, total ~200 KB gzip) so ordinary changes pass, but a large
// regression (e.g. an accidental un-split heavy dependency) trips the gate.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const ASSETS = join(process.cwd(), 'dist', 'assets');
const MAIN_BUDGET_KB = 175; // gzipped, main index chunk
const TOTAL_BUDGET_KB = 320; // gzipped, all JS

let files;
try {
  files = readdirSync(ASSETS).filter((f) => f.endsWith('.js'));
} catch {
  console.error(`bundle-budget: ${ASSETS} not found — run "npm run build" first`);
  process.exit(1);
}

const gzKb = (buf) => gzipSync(buf).length / 1024;
let total = 0;
let mainKb = 0;
for (const f of files) {
  const kb = gzKb(readFileSync(join(ASSETS, f)));
  total += kb;
  if (/^index-.*\.js$/.test(f)) mainKb = Math.max(mainKb, kb);
}

const problems = [];
if (mainKb > MAIN_BUDGET_KB) problems.push(`main chunk ${mainKb.toFixed(1)}KB gz > budget ${MAIN_BUDGET_KB}KB`);
if (total > TOTAL_BUDGET_KB) problems.push(`total JS ${total.toFixed(1)}KB gz > budget ${TOTAL_BUDGET_KB}KB`);

console.log(`Bundle: main index chunk ${mainKb.toFixed(1)}KB gz (budget ${MAIN_BUDGET_KB}), total JS ${total.toFixed(1)}KB gz (budget ${TOTAL_BUDGET_KB}), ${files.length} chunks`);
if (problems.length) {
  console.error('bundle-budget FAILED:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('bundle-budget OK');
