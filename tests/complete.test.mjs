import test from 'node:test';
import assert from 'node:assert/strict';
import { isComplete } from '../lib/complete.js';

test('a response with every count is complete', () => {
  assert.ok(isComplete({ total: { count: 10, url: 'u' }, cells: [{ status: 'lower', ratio: 0.4 }] }));
  assert.ok(isComplete({ rows: [{ records: 5, deaths: 3 }], note: null }));
});

test('failed counts make a response incomplete', () => {
  assert.ok(!isComplete({ total: { count: null, url: 'u' } }));
  assert.ok(!isComplete({ cells: [{ status: 'lower' }, { status: 'unavailable' }] }));
  assert.ok(!isComplete({ designs: [{ id: 'rct', ok: false }] }));
});

test('a null that is not a failed count does not count as missing', () => {
  assert.ok(isComplete({ results: { overdueShare: null }, earliestYear: null }));
});

test('a burden row whose PubMed count failed is incomplete', () => {
  assert.ok(!isComplete({ rows: [{ id: 'lung', records: null, recordsUrl: 'u' }] }));
  assert.ok(isComplete({ rows: [{ id: 'lung', records: 12, recordsUrl: 'u' }] }));
});
