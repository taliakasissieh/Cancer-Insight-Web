import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, citation, papersRis, papersCsv } from '../lib/client/exports.js';

test('CSV cells neutralise spreadsheet formulas', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell('+1'), `"'+1"`);
  assert.equal(csvCell('-2'), `"'-2"`);
  assert.equal(csvCell('@SUM(A1)'), `"'@SUM(A1)"`);
  assert.equal(csvCell('Normal title'), '"Normal title"');
  assert.equal(csvCell(['a', 'b']), '"a; b"');
});

const paper = {
  pubmedId: '123',
  pubmed_title: 'A trial of something',
  author_citation: ['Smith J', 'Doe A', 'Roe B', 'Poe C', 'Low D', 'Fox E', 'Ray F'],
  pubmed_journal_abbrev: 'J Test',
  pubmed_date: '2024 Jan',
  pubmed_volume: '12',
  pubmed_issue: '3',
  pubmed_pages: '45-67',
  doi: '10.1/xyz',
  publication_types: ['Journal Article', 'Retracted Publication'],
};

test('Vancouver citation truncates at six authors and flags retraction', () => {
  assert.equal(
    citation(paper),
    'Smith J, Doe A, Roe B, Poe C, Low D, Fox E, et al. A trial of something. [Retracted] J Test. 2024;12(3):45-67. doi:10.1/xyz. PMID: 123.'
  );
});

test('RIS and CSV exports include identifiers and provenance', () => {
  const ris = papersRis([paper]);
  assert.match(ris, /TY {2}- JOUR/);
  assert.match(ris, /AN {2}- PMID:123/);
  assert.match(ris, /N1 {2}- Retracted publication/);
  const csv = papersCsv([paper], { cancer: 'Test cancer', query: '"x"[tiab]' });
  assert.match(csv, /# pubmed_query/);
  assert.match(csv, /RETRACTED/);
});
