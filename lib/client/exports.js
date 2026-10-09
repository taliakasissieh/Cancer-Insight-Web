'use client';

import {
  classifyEvidence,
  paperAbstract,
  paperAuthors,
  paperDate,
  paperJournal,
  paperTitle,
  paperYear,
  treatmentTags,
} from '../evidence.js';
import { SOURCE_LABELS, slugify } from '../format.js';

export function download(filename, text, type) {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CSV cell with spreadsheet formula-injection protection (= + - @ tab CR). */
export function csvCell(value) {
  let s = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows) {
  return '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
}

export function fileStem(cancerLabel, suffix) {
  const date = new Date().toISOString().slice(0, 10);
  return `cancer-insight_${slugify(cancerLabel)}_${suffix}_${date}`;
}

export function papersCsv(papers, meta = {}) {
  const header = [
    'pmid',
    'title',
    'authors',
    'journal',
    'publication_date',
    'year',
    'evidence_type',
    'publication_types',
    'treatment_tags',
    'source',
    'why_included',
    'doi',
    'pubmed_url',
    'pmc_url',
    'abstract',
  ];
  const rows = papers.map(p => {
    const c = classifyEvidence(p.publication_types);
    return [
      p.pubmedId || '',
      paperTitle(p),
      paperAuthors(p).join(', '),
      paperJournal(p),
      paperDate(p),
      paperYear(p) || '',
      c.label + (c.retracted ? ' (RETRACTED)' : ''),
      c.types.join('; '),
      treatmentTags(p).join('; '),
      SOURCE_LABELS[p.evidenceSource] || p.evidenceSource || '',
      p.relevance?.matchedIn?.length ? `matched in ${p.relevance.matchedIn.join(', ')}` : '',
      p.doi || '',
      p.pubmed_url || '',
      p.pmc_url || '',
      paperAbstract(p).replace(/\n/g, ' '),
    ];
  });
  const provenance = [
    ['# Cancer Insight export'],
    ['# generated', new Date().toISOString()],
    ...(meta.cancer ? [['# cancer', meta.cancer]] : []),
    ...(meta.query ? [['# pubmed_query', meta.query]] : []),
    ...(meta.source ? [['# source', meta.source]] : []),
    ...(meta.filters ? [['# filters', meta.filters]] : []),
    [
      '# note',
      'Educational research export. Not medical advice. Counts describe retrieved records, not treatment effectiveness.',
    ],
  ];
  return toCsv([...provenance, header, ...rows]);
}

/** RIS for Zotero, EndNote, Mendeley. */
export function papersRis(papers) {
  const lines = [];
  for (const p of papers) {
    const c = classifyEvidence(p.publication_types);
    lines.push('TY  - JOUR');
    for (const a of paperAuthors(p)) lines.push(`AU  - ${a}`);
    lines.push(`TI  - ${paperTitle(p)}`);
    if (paperJournal(p)) lines.push(`T2  - ${paperJournal(p)}`);
    if (p.pubmed_journal_abbrev) lines.push(`J2  - ${p.pubmed_journal_abbrev}`);
    if (paperYear(p)) lines.push(`PY  - ${paperYear(p)}`);
    if (paperDate(p)) lines.push(`DA  - ${paperDate(p)}`);
    if (p.pubmed_volume) lines.push(`VL  - ${p.pubmed_volume}`);
    if (p.pubmed_issue) lines.push(`IS  - ${p.pubmed_issue}`);
    if (p.pubmed_pages) lines.push(`SP  - ${p.pubmed_pages}`);
    if (p.doi) lines.push(`DO  - ${p.doi}`);
    if (p.pubmed_url) lines.push(`UR  - ${p.pubmed_url}`);
    if (p.pubmedId) lines.push(`AN  - PMID:${p.pubmedId}`);
    const abs = paperAbstract(p);
    if (abs) lines.push(`AB  - ${abs.replace(/\n/g, ' ')}`);
    for (const t of c.types) lines.push(`KW  - ${t}`);
    if (c.retracted) lines.push('N1  - Retracted publication');
    lines.push('ER  - ', '');
  }
  return lines.join('\r\n');
}

/** Vancouver-style plain-text citation. */
export function citation(p) {
  const authors =
    Array.isArray(p.author_citation) && p.author_citation.length
      ? p.author_citation
      : paperAuthors(p);
  const names = authors.slice(0, 6).join(', ') + (authors.length > 6 ? ', et al' : '');
  const title = paperTitle(p).replace(/\.?$/, '.');
  const journal = p.pubmed_journal_abbrev || paperJournal(p);
  const year = paperYear(p);
  let where = journal ? `${journal}. ` : '';
  if (year) where += `${year}`;
  if (p.pubmed_volume) where += `;${p.pubmed_volume}`;
  if (p.pubmed_issue) where += `(${p.pubmed_issue})`;
  if (p.pubmed_pages) where += `:${p.pubmed_pages}`;
  if (where && !where.endsWith('.')) where += '.';
  const ids = [p.doi ? `doi:${p.doi}` : '', p.pubmedId ? `PMID: ${p.pubmedId}` : '']
    .filter(Boolean)
    .join('. ');
  const retracted = classifyEvidence(p.publication_types).retracted ? ' [Retracted]' : '';
  return [names ? `${names}.` : '', title + retracted, where, ids ? `${ids}.` : '']
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
