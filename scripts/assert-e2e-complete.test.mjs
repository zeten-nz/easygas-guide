// Unit tests for the Phase 10F E2E result guard (scripts/assert-e2e-complete.mjs).
//   node --test scripts/assert-e2e-complete.test.mjs
//
// Fixtures are minimal Playwright-JSON-report shapes exercising each category the
// guard must classify: all-pass, zero-discovered, zero-executed, failures, skips,
// flaky, interrupted, global-setup error, and malformed/missing reports.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, collect } from './assert-e2e-complete.mjs';

/** Build a suites tree of N specs whose single result has the given status. */
function suitesOf(statuses) {
  return [
    {
      title: 'e2e',
      specs: statuses.map((status, i) => ({
        title: `spec ${i}`,
        ok: status === 'passed',
        tests: [{ status: status === 'passed' ? 'expected' : status, results: [{ status }] }],
      })),
      suites: [],
    },
  ];
}

test('all pass → ok', () => {
  const report = { stats: { expected: 12, unexpected: 0, flaky: 0, skipped: 0 }, suites: suitesOf(Array(12).fill('passed')) };
  const r = evaluate(report);
  assert.equal(r.ok, true, r.reasons.join('; '));
  assert.equal(r.summary.discovered, 12);
  assert.equal(r.summary.executed, 12);
});

test('all failed → fails with the FAILED count, not "zero executed"', () => {
  // This is the exact regression: expected:0, unexpected:12.
  const report = { stats: { expected: 0, unexpected: 12, flaky: 0, skipped: 0 }, suites: suitesOf(Array(12).fill('failed')) };
  const r = evaluate(report);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((m) => /12 spec\(s\) failed/.test(m)), r.reasons.join('; '));
  assert.ok(!r.reasons.some((m) => /zero specs executed/.test(m)), 'must not claim zero executed when specs failed');
  assert.equal(r.summary.executed, 12);
  assert.equal(r.summary.failed, 12);
});

test('zero discovered → fails "zero specs discovered"', () => {
  const report = { stats: { expected: 0, unexpected: 0, flaky: 0, skipped: 0 }, suites: [] };
  const r = evaluate(report);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((m) => /zero specs discovered/.test(m)), r.reasons.join('; '));
});

test('all skipped → fails "zero specs executed" AND "skipped"', () => {
  const report = { stats: { expected: 0, unexpected: 0, flaky: 0, skipped: 5 }, suites: suitesOf(Array(5).fill('skipped')) };
  const r = evaluate(report);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((m) => /zero specs executed/.test(m)), r.reasons.join('; '));
  assert.ok(r.reasons.some((m) => /skipped/.test(m)), r.reasons.join('; '));
});

test('some failures → fails with the actual failed count', () => {
  const report = { stats: { expected: 9, unexpected: 3, flaky: 0, skipped: 0 }, suites: suitesOf([...Array(9).fill('passed'), ...Array(3).fill('failed')]) };
  const r = evaluate(report);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((m) => /3 spec\(s\) failed/.test(m)), r.reasons.join('; '));
});

test('one skip on an otherwise green run → fails (gate forbids skips)', () => {
  const report = { stats: { expected: 11, unexpected: 0, flaky: 0, skipped: 1 }, suites: suitesOf([...Array(11).fill('passed'), 'skipped']) };
  const r = evaluate(report);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((m) => /1 spec\(s\) skipped/.test(m)), r.reasons.join('; '));
});

test('flaky → fails (nondeterministic on a safety gate)', () => {
  const report = { stats: { expected: 11, unexpected: 0, flaky: 1, skipped: 0 }, suites: suitesOf(Array(12).fill('passed')) };
  const r = evaluate(report);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((m) => /flaky/.test(m)), r.reasons.join('; '));
});

test('interrupted result → fails "interrupted/incomplete"', () => {
  const report = { stats: { expected: 11, unexpected: 0, flaky: 0, skipped: 0 }, suites: suitesOf([...Array(11).fill('passed'), 'interrupted']) };
  const r = evaluate(report);
  assert.equal(r.ok, false);
  assert.equal(r.summary.interrupted, 1);
  assert.ok(r.reasons.some((m) => /interrupted\/incomplete/.test(m)), r.reasons.join('; '));
});

test('global setup error → fails', () => {
  const report = { stats: { expected: 0, unexpected: 0, flaky: 0, skipped: 0 }, suites: suitesOf(Array(3).fill('passed')), errors: [{ message: 'preflight failed' }] };
  const r = evaluate(report);
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((m) => /global error/.test(m)), r.reasons.join('; '));
});

test('malformed / missing report → fails', () => {
  for (const bad of [null, undefined, {}, { foo: 1 }, 42, 'nope']) {
    const r = evaluate(bad);
    assert.equal(r.ok, false, `expected failure for ${JSON.stringify(bad)}`);
    assert.ok(r.reasons.some((m) => /malformed or missing/.test(m)), r.reasons.join('; '));
  }
});

test('collect falls back to stats when the suite tree is absent', () => {
  const s = collect({ stats: { expected: 4, unexpected: 1, flaky: 0, skipped: 2 } });
  assert.equal(s.discovered, 7);
  assert.equal(s.executed, 5);
  assert.equal(s.skipped, 2);
});
