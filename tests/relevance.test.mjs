import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRelevantPapers, scorePaper } from '../lib/relevance.js';
import { resolveCancer } from '../lib/queries.js';

const lung = resolveCancer('lung');
const pancreatic = resolveCancer('pancreatic');

test('word boundaries: "ards" topic list no longer matches "towards"', () => {
  const paper = {
    pubmed_title: 'Towards better outcomes in thoracic oncology',
    mesh_terms: ['Lung Neoplasms'],
  };
  assert.ok(scorePaper(paper, lung));
});

test('records whose title is about another cancer are dropped', () => {
  const paper = {
    pubmed_title: 'Adjuvant therapy in breast cancer',
    pubmed_abstract: 'Patients with breast cancer and lung cancer history',
    cancerTypes: ['lung'],
  };
  assert.equal(scorePaper(paper, lung), null);
});

test('subtype searches keep parent-cancer titles', () => {
  const nsclc = resolveCancer('nsclc');
  const paper = {
    pubmed_title: 'Immunotherapy in lung cancer',
    mesh_terms: ['Carcinoma, Non-Small-Cell Lung'],
  };
  assert.ok(scorePaper(paper, nsclc));
});

test('relevance explains where the match came from', () => {
  const [kept] = getRelevantPapers(
    [
      {
        pubmedId: '9',
        pubmed_title: 'Pancreatic cancer surgery outcomes',
        cancerTypes: ['pancreatic'],
      },
    ],
    pancreatic
  );
  assert.deepEqual(kept.relevance.matchedIn, ['title', 'feed tag']);
  assert.equal(kept.relevance.phrase, 'pancreatic cancer');
});

test('abstract-only matches need a feed tag unless explicitly allowed', () => {
  const p = {
    pubmed_title: 'A new imaging agent',
    pubmed_abstract: 'Tested in pancreatic cancer models.',
  };
  assert.equal(scorePaper(p, pancreatic), null);
  assert.ok(scorePaper(p, pancreatic, { allowAbstractOnly: true }));
});
