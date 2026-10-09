import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsePubmedXml, cleanText, decodeEntities } from '../lib/pubmed-parse.js';

const xml = readFileSync(new URL('./fixtures/efetch-sample.xml', import.meta.url), 'utf8');
const records = parsePubmedXml(xml);

test('numeric entities in author names are decoded', () => {
  const p = records['42836590'];
  assert.match(p.pubmed_authors, /Laura K Kjær/);
  assert.match(p.pubmed_authors, /Morten Orebo Holmström/);
  assert.ok(p.author_list.includes('Danish Pancreas Group'));
});

test('scientific tokens are never split', () => {
  assert.match(records['42836590'].pubmed_abstract, /mRNA and lncRNA/);
  assert.match(records['41658402'].pubmed_title, /^MiniGPT-Pancreas/);
  assert.match(records['41658402'].pubmed_abstract, /ChatGPT-style/);
  assert.match(records['41658402'].pubmed_abstract, /siRNA and miRNA/);
});

test('structured abstracts keep labelled sections on separate lines', () => {
  const lines = records['42836590'].pubmed_abstract.split('\n');
  assert.equal(lines.length, 4);
  assert.match(lines[0], /^BACKGROUND: /);
  assert.match(lines[1], /^MATERIAL AND METHODS: /);
});

test('superscripts stay legible', () => {
  const p = records['41372636'];
  assert.match(p.pubmed_title, /KRAS\(G12D\)-Mutant/);
  assert.match(p.pubmed_abstract, /CD8\+ T cells/);
  assert.match(p.pubmed_abstract, /10\^-6 M/);
  assert.match(p.pubmed_abstract, /IC50/);
  assert.match(p.pubmed_abstract, /p < 0\.0001/);
});

test('identifiers, links, dates and types are parsed', () => {
  const a = records['42836590'];
  assert.equal(a.doi, '10.1002/iid3.70545');
  assert.equal(a.doi_url, 'https://doi.org/10.1002/iid3.70545');
  assert.equal(a.pmc_url, 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13640521/');
  assert.equal(a.pubmed_date, '2026 Oct');
  assert.equal(a.pubmed_year, 2026);
  assert.deepEqual(a.publication_types, ['Journal Article', 'Observational Study']);
  assert.ok(a.mesh_terms.includes('Pancreatic Neoplasms'));
  assert.ok(a.keywords.includes('pancreatic cancer'));
  assert.equal(records['41658402'].pubmed_date, '2026 Mar-Apr');
  assert.ok(records['41658402'].publication_types.includes('Retracted Publication'));
});

test('text helpers', () => {
  assert.equal(decodeEntities('A &amp; B &#x2265; 3 &lt;x&gt;'), 'A & B ≥ 3 <x>');
  assert.equal(cleanText('  survival ( OS ) was 12 % .  '), 'survival (OS) was 12%.');
});
