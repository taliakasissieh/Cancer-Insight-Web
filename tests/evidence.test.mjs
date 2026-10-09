import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyEvidence,
  describePaperSet,
  matchesEvidenceFilter,
  dedupePapers,
} from '../lib/evidence.js';

test('RCTs count as clinical trials even without a "Clinical Trial" tag', () => {
  const c = classifyEvidence(['Journal Article', 'Randomized Controlled Trial']);
  assert.equal(c.id, 'rct');
  assert.equal(c.isTrial, true);
  assert.equal(c.family, 'primary');
});

test('protocols and veterinary trials are not clinical trials', () => {
  assert.equal(classifyEvidence(['Clinical Trial Protocol']).isTrial, false);
  assert.equal(classifyEvidence(['Clinical Trial, Veterinary']).isTrial, false);
});

test('phase is shown and syntheses outrank primary labels', () => {
  assert.equal(
    classifyEvidence(['Randomized Controlled Trial', 'Clinical Trial, Phase III']).label,
    'Randomized controlled trial · Phase III'
  );
  assert.equal(
    classifyEvidence(['Systematic Review', 'Meta-Analysis']).label,
    'Systematic review & meta-analysis'
  );
});

test('retractions are flagged; unindexed designs are not judged', () => {
  const r = classifyEvidence(['Journal Article', 'Retracted Publication']);
  assert.equal(r.retracted, true);
  assert.equal(classifyEvidence(['Journal Article']).family, 'unclassified');
  assert.equal(classifyEvidence([]).id, 'unknown');
});

test('filters use the shared classifier', () => {
  const rct = { publication_types: ['Randomized Controlled Trial'] };
  const review = { publication_types: ['Review'] };
  assert.equal(matchesEvidenceFilter(rct, 'trial'), true);
  assert.equal(matchesEvidenceFilter(review, 'trial'), false);
  assert.equal(matchesEvidenceFilter(review, 'synthesis'), true);
});

test('paper-set description keeps explicit denominators', () => {
  const papers = [
    { pubmedId: '1', publication_types: ['Randomized Controlled Trial'], pubmed_date: '2024 Jan', pmc_id: 'PMC1', pubmed_abstract: 'x' },
    { pubmedId: '1', publication_types: ['Review'] },
    { pubmedId: '2', publication_types: ['Review'], pubmed_date: '2019' },
    { pubmedId: '3', publication_types: [] },
  ];
  const d = describePaperSet(papers);
  assert.equal(d.total, 3);
  assert.equal(d.trials, 1);
  assert.equal(d.withTypes, 2);
  assert.equal(d.withPmc, 1);
  assert.equal(d.dated, 2);
  assert.deepEqual(d.byYear, { 2024: 1, 2019: 1 });
  assert.equal(dedupePapers(papers).length, 3);
});
