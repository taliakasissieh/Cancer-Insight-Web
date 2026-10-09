import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCancer,
  resolveTreatment,
  sanitizeCancerInput,
  buildCancerTerm,
  pubmedSearchUrl,
  yearWindows,
} from '../lib/queries.js';

test('natural inputs resolve to the research-feed vocabulary', () => {
  const cases = {
    'pancreatic cancer': ['pancreatic', 'pancreatic'],
    Pancreas: ['pancreatic', 'pancreatic'],
    'colon cancer': ['colorectal', 'colorectal'],
    gastric: ['stomach', 'stomach'],
    'Lung Cancer': ['lung', 'lung'],
    NSCLC: ['nsclc', 'lung'],
    'non-small cell lung cancer': ['nsclc', 'lung'],
    'brain tumour': ['brain', 'brain'],
    leukaemia: ['leukemia', 'leukemia'],
    'skin cancer': ['skin', null],
    myeloma: ['myeloma', null],
  };
  for (const [input, [id, feed]] of Object.entries(cases)) {
    const r = resolveCancer(input);
    assert.ok(r, input);
    assert.equal(r.id, id, input);
    assert.equal(r.feed, feed, input);
  }
});

test('labels never duplicate the word cancer', () => {
  for (const input of ['breast cancer', 'breast', 'leukemia', 'melanoma', 'appendix']) {
    const { label } = resolveCancer(input);
    assert.ok(!/cancer cancer/i.test(label), label);
  }
  assert.equal(resolveCancer('leukemia').label, 'Leukemia');
  assert.equal(resolveCancer('appendix').label, 'Appendix cancer');
});

test('generic inputs build a phrase query; bare "cancer" is rejected', () => {
  const r = resolveCancer('appendix cancer');
  assert.equal(r.known, false);
  assert.match(r.term, /"appendix cancer"\[tiab\]/);
  assert.equal(resolveCancer('cancer'), null);
  assert.equal(resolveCancer(''), null);
  assert.equal(resolveCancer('x'), null);
});

test('input sanitising strips query syntax', () => {
  assert.equal(sanitizeCancerInput('lung") OR ("x'), 'lung or x');
  assert.equal(sanitizeCancerInput('  Breast   CANCER '), 'breast cancer');
  assert.ok(sanitizeCancerInput('a'.repeat(200)).length <= 60);
});

test('cancer term combines MeSH and title/abstract phrases', () => {
  assert.equal(
    buildCancerTerm(['Pancreatic Neoplasms'], ['pancreatic cancer']),
    '("Pancreatic Neoplasms"[mh] OR "pancreatic cancer"[tiab])'
  );
  assert.match(pubmedSearchUrl('a b'), /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\?term=a%20b$/);
});

test('treatments resolve to PubMed terms, unknown tags fall back to a phrase', () => {
  assert.equal(resolveTreatment('Radiation').label, 'Radiation therapy');
  assert.equal(resolveTreatment('radiotherapy').id, 'radiation');
  const custom = resolveTreatment('gene therapy');
  assert.equal(custom.known, false);
  assert.equal(custom.term, '"gene therapy"[tiab]');
});

test('year windows are contiguous and non-overlapping', () => {
  const w = yearWindows(2026);
  assert.deepEqual(
    w.map(x => [x.start, x.end]),
    [
      [2024, 2026],
      [2019, 2023],
      [2009, 2018],
      [1900, 2008],
    ]
  );
});
