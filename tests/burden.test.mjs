import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BURDEN_EXCLUDED,
  BURDEN_MAP,
  GLOBOCAN,
  GLOBOCAN_SITES,
  burdenFor,
  compareResearchWithBurden,
  researchYears,
} from '../lib/burden.js';
import { CANCERS, resolveCancer } from '../lib/queries.js';

test('every catalogue cancer is either mapped to GLOBOCAN or explicitly excluded', () => {
  for (const id of Object.keys(CANCERS)) {
    assert.ok(BURDEN_MAP[id] || BURDEN_EXCLUDED[id], `${id} is neither mapped nor excluded`);
    assert.ok(!(BURDEN_MAP[id] && BURDEN_EXCLUDED[id]), `${id} is both mapped and excluded`);
  }
  for (const id of Object.keys(BURDEN_MAP)) assert.ok(resolveCancer(id)?.known, id);
});

test('GLOBOCAN 2024 figures match the published world totals and percentages', () => {
  // Lung is printed as 12.8% of new cases and 19.1% of deaths.
  assert.equal(Math.round((GLOBOCAN_SITES.Lung[0] / GLOBOCAN.totals.cases) * 1000) / 10, 12.8);
  assert.equal(Math.round((GLOBOCAN_SITES.Lung[1] / GLOBOCAN.totals.deaths) * 1000) / 10, 19.1);
  // Pancreas: 6th cause of cancer death (5.0%).
  assert.equal(Math.round((GLOBOCAN_SITES.Pancreas[1] / GLOBOCAN.totals.deaths) * 1000) / 10, 5.0);
  const sum = Object.values(GLOBOCAN_SITES).reduce((a, [c]) => a + c, 0);
  assert.ok(sum < GLOBOCAN.totals.cases, 'listed sites are a subset of all cancers');
});

test('lymphoma combines Hodgkin and non-Hodgkin lymphoma', () => {
  const b = burdenFor('lymphoma');
  assert.equal(b.cases, 562793 + 84495);
  assert.equal(b.deaths, 234903 + 19515);
  assert.equal(burdenFor('skin'), null);
});

test('ratios compare research share with burden share', () => {
  const rows = compareResearchWithBurden(
    [
      { id: 'pancreatic', label: 'Pancreatic cancer', count: 1000, url: 'u1' },
      { id: 'breast', label: 'Breast cancer', count: 10000, url: 'u2' },
      { id: 'skin', label: 'Skin cancer', count: 500, url: 'u3' },
    ],
    { count: 100000 }
  );
  assert.equal(rows.length, 2, 'unmapped cancers are left out');
  const p = rows.find(r => r.id === 'pancreatic');
  assert.ok(Math.abs(p.researchShare - 0.01) < 1e-12);
  assert.ok(Math.abs(p.ratioDeaths - 0.01 / (490786 / 9762507)) < 1e-9);
  assert.equal(rows[0].id, 'pancreatic', 'sorted from least to most research relative to deaths');
});

test('research years are the last five complete years', () => {
  assert.deepEqual(researchYears(new Date('2026-10-11T00:00:00Z')), { start: 2021, end: 2025 });
});
