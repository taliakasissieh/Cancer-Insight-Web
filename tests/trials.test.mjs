import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  apiQueryUrl,
  compactStudy,
  conditionFor,
  monthsBefore,
  onOrBefore,
  packCountries,
  summarizeTrials,
  trialsCsvRows,
} from '../lib/trials.js';
import { resolveCancer } from '../lib/queries.js';

/* Studies in the shape returned by https://clinicaltrials.gov/api/v2/studies with `fields`. */
function study({
  id,
  status = 'COMPLETED',
  type = 'INTERVENTIONAL',
  phases = ['PHASE2'],
  hasResults = false,
  start = '2015-03-01',
  primary = '2018-06',
  completion = '2018-12-31',
  updated = '2024-01-15',
  sponsor = 'OTHER',
  countries = ['United States'],
}) {
  return {
    hasResults,
    protocolSection: {
      identificationModule: { nctId: id },
      statusModule: {
        overallStatus: status,
        startDateStruct: { date: start },
        primaryCompletionDateStruct: primary ? { date: primary, type: 'ACTUAL' } : undefined,
        completionDateStruct: completion ? { date: completion, type: 'ACTUAL' } : undefined,
        lastUpdatePostDateStruct: { date: updated },
      },
      designModule: { studyType: type, phases },
      sponsorCollaboratorsModule: { leadSponsor: { class: sponsor } },
      contactsLocationsModule: { locations: countries.map(country => ({ country })) },
    },
  };
}

const TODAY = new Date('2026-10-11T00:00:00Z');

const STUDIES = [
  study({ id: 'NCT00000001', hasResults: true }),
  study({ id: 'NCT00000002' }), // completed 2018, no results → overdue
  study({ id: 'NCT00000003', primary: '2025-11', completion: '2026-01-10' }), // too recent
  study({ id: 'NCT00000004', status: 'RECRUITING', primary: '', completion: '', start: '2025-02', updated: '2026-09-30', countries: ['Jordan', 'Egypt', 'Jordan'] }),
  study({ id: 'NCT00000005', status: 'TERMINATED', phases: ['PHASE1', 'PHASE2'], sponsor: 'INDUSTRY' }),
  study({ id: 'NCT00000006', type: 'OBSERVATIONAL', phases: [], countries: ['France'] }),
  study({ id: 'NCT00000007', phases: ['PHASE1'], primary: '', completion: '2019-05' }), // falls back to completion date
  study({ id: 'NCT00000008', status: 'NOT_YET_RECRUITING', updated: '2026-10-01', phases: ['PHASE3'] }),
];

const rows = STUDIES.map(compactStudy);

test('compact rows keep only what the counts need', () => {
  const r = compactStudy(STUDIES[3]);
  assert.equal(r[0], 'NCT00000004');
  assert.equal(r[1], 'RECRUITING');
  assert.equal(r[3], 'I');
  assert.equal(r[5], '2025-02');
  assert.equal(r[8], '2026-09-30');
  assert.equal(r[10], 'Jordan|Egypt', 'countries are de-duplicated');
  assert.equal(compactStudy({ protocolSection: {} }), null);
});

test('partial dates are compared conservatively', () => {
  assert.equal(monthsBefore(TODAY, 24), '2024-10-11');
  assert.ok(onOrBefore('2018-06', '2024-10-11'));
  assert.ok(!onOrBefore('2024-10', '2024-10-11'), 'month without day counts as late in the month');
  assert.ok(!onOrBefore('', '2024-10-11'));
});

test('completed trials without posted results are counted only after the lag', () => {
  const s = summarizeTrials(rows, { today: TODAY, condition: 'Pancreatic cancer', totalCount: 8 });
  assert.equal(s.types.all, 8);
  assert.equal(s.types.interventional, 7);
  assert.equal(s.types.observational, 1);
  assert.equal(s.results.completed, 4);
  assert.equal(s.results.completedWithResults, 1);
  assert.equal(s.results.eligible, 3, 'NCT…03 completed too recently to count');
  assert.deepEqual(s.results.overdueIds.sort(), ['NCT00000002', 'NCT00000007']);
  assert.equal(s.results.overdue, 2);
  assert.ok(Math.abs(s.results.overdueShare - 2 / 3) < 1e-9);
});

test('status, phase, sponsor and country breakdowns cover interventional studies', () => {
  const s = summarizeTrials(rows, { today: TODAY });
  const status = Object.fromEntries(s.status.map(x => [x.id, x.count]));
  assert.equal(status.COMPLETED, 4);
  assert.equal(status.RECRUITING, 1);
  assert.equal(s.statusGroups.open, 2);
  assert.equal(s.statusGroups.stopped, 1);
  const phases = Object.fromEntries(s.phases.map(x => [x.id, x.count]));
  assert.equal(phases['PHASE1|PHASE2'], 1);
  assert.equal(phases.PHASE3, 1);
  assert.equal(s.sponsors.find(x => x.id === 'INDUSTRY').count, 1);
  assert.equal(s.countries.find(x => x.country === 'Jordan').count, 1);
  assert.ok(!s.countries.find(x => x.country === 'France'), 'observational studies are not counted');
  assert.deepEqual(s.recentOpenIds, ['NCT00000008', 'NCT00000004']);
  assert.equal(s.startYears.length, 15);
  assert.equal(s.startYears.at(-1).year, 2026);
});

test('packed country lists give the same counts', () => {
  const packed = packCountries(rows);
  assert.ok(packed.countryNames.includes('Jordan'));
  const a = summarizeTrials(rows, { today: TODAY });
  const b = summarizeTrials(packed.rows, { today: TODAY, countryNames: packed.countryNames });
  assert.deepEqual(a.countries, b.countries);
});

test('CSV lists every study and flags the ones counted as completed without results', () => {
  const csv = trialsCsvRows(rows, { today: TODAY });
  assert.equal(csv.length, rows.length + 1);
  const flagged = csv.slice(1).filter(r => r.at(-1) === 'yes').map(r => r[0]);
  assert.deepEqual(flagged.sort(), ['NCT00000002', 'NCT00000007']);
  assert.ok(csv[1][1].startsWith('https://clinicaltrials.gov/study/'));
});

test('condition terms and the data-API request are explicit', () => {
  assert.equal(conditionFor(resolveCancer('brain')), 'Brain Tumor');
  assert.equal(conditionFor(resolveCancer('pancreatic')), 'Pancreatic cancer');
  const url = new URL(apiQueryUrl('Pancreatic cancer'));
  assert.equal(url.searchParams.get('query.cond'), 'Pancreatic cancer');
  assert.equal(url.searchParams.get('pageSize'), '1000');
  assert.equal(url.searchParams.get('countTotal'), 'true');
  assert.ok(url.searchParams.get('fields').includes('HasResults'));
});
