import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatUZS, minorToSom, somToMinor } from './money';

test('formatUZS distinguishes unknown, zero, and grouped values', () => {
  assert.equal(formatUZS(null), 'Belgilanmagan');
  assert.equal(formatUZS(undefined), 'Belgilanmagan');
  assert.equal(formatUZS(0), "0 so'm");
  assert.equal(formatUZS(150000000), "1 500 000 so'm"); // 1,500,000.00 UZS
  assert.equal(formatUZS(100), "1 so'm");
});

test('formatUZS renders a tiyin remainder with two decimals', () => {
  assert.equal(formatUZS(150050), "1 500,50 so'm");
});

test('somToMinor / minorToSom are exact inverses for whole som', () => {
  assert.equal(somToMinor(1500000), 150000000);
  assert.equal(minorToSom(150000000), 1500000);
  assert.equal(minorToSom(null), null);
  assert.equal(somToMinor(0), 0);
});
