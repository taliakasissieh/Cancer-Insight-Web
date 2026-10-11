'use client';

/*
  PDF research report. jsPDF (~350 kB) is loaded only when a report is requested.
  Every report states what was retrieved, from where, when, and with which query/filters.
*/

import {
  EVIDENCE_TYPES,
  classifyEvidence,
  describePaperSet,
  paperAbstract,
  paperAuthors,
  paperDate,
  paperJournal,
  paperTitle,
  treatmentTags,
} from '../evidence.js';
import { SOURCE_LABELS, fmtDateTime, fmtInt, fmtShare } from '../format.js';
import { fileStem } from './exports.js';

const NAVY = [18, 48, 74];
const TEAL = [11, 122, 128];
const TEAL_BRIGHT = [31, 168, 166];
const MUTED = [90, 113, 130];
const RULE = [213, 226, 233];
const WASH = [234, 243, 248];
const ROSE = [163, 38, 58];

const GREEK = {
  α: 'alpha',
  β: 'beta',
  γ: 'gamma',
  δ: 'delta',
  κ: 'kappa',
  λ: 'lambda',
  μ: 'u',
  σ: 'sigma',
  τ: 'tau',
  ω: 'omega',
};

function pdfText(value) {
  return String(value ?? '')
    .replace(/[‐-―−]/g, '-')
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”‟]/g, '"')
    .replace(/…/g, '...')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[    ]/g, ' ')
    .replace(/[αβγδκλμστω]/g, ch => GREEK[ch] || ch)
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export async function downloadReport({ cancerLabel, papers, context = {} }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 16;
  const CW = W - M * 2;
  const BOTTOM = 280;
  let y = 0;

  const set = (size, style = 'normal', color = NAVY) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const lines = (text, width = CW) => doc.splitTextToSize(pdfText(text), width);
  const ensure = h => {
    if (y + h > BOTTOM) {
      doc.addPage();
      y = 20;
    }
  };
  const para = (
    text,
    { size = 9, style = 'normal', color = NAVY, width = CW, x = M, gap = 1.5 } = {}
  ) => {
    set(size, style, color);
    const ls = lines(text, width);
    const lh = size * 0.42;
    ensure(ls.length * lh);
    doc.text(ls, x, y);
    y += ls.length * lh + gap;
  };
  const heading = text => {
    ensure(14);
    y += 3;
    set(13, 'bold', NAVY);
    doc.text(pdfText(text), M, y);
    y += 2.5;
    doc.setDrawColor(...TEAL_BRIGHT);
    doc.setLineWidth(0.6);
    doc.line(M, y, M + 24, y);
    y += 6;
  };

  /* Cover band */
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 38, 'F');
  doc.setFillColor(...TEAL_BRIGHT);
  doc.roundedRect(M, 11, 11, 11, 2.2, 2.2, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(M + 4.8, 13.2, 1.4, 6.6, 'F');
  doc.rect(M + 2.2, 15.8, 6.6, 1.4, 'F');
  set(15, 'bold', [255, 255, 255]);
  doc.text('Cancer Insight', M + 15, 18.5);
  set(8.5, 'normal', [198, 222, 232]);
  doc.text('Research report - educational use only, not medical advice', M + 15, 24);

  y = 52;
  set(22, 'bold', NAVY);
  doc.text(pdfText(cancerLabel), M, y);
  y += 8;
  para(`Generated ${fmtDateTime(new Date().toISOString())} from cancer-insight.com`, {
    size: 9,
    color: MUTED,
  });
  y += 2;

  /* Provenance box */
  const prov = [
    ['Records in this report', fmtInt(papers.length)],
    ['Source', context.source || 'Mixed'],
    ...(context.retrievedAt ? [['Retrieved', fmtDateTime(context.retrievedAt)]] : []),
    ...(context.filters ? [['Filters applied', context.filters]] : []),
    ...(context.query ? [['PubMed query', context.query]] : []),
  ];
  const provLines = prov.map(([k, v]) => ({ k, v: lines(v, CW - 48) }));
  const boxH = provLines.reduce((h, r) => h + Math.max(1, r.v.length) * 3.8 + 2, 6);
  ensure(boxH);
  doc.setFillColor(...WASH);
  doc.setDrawColor(...RULE);
  doc.roundedRect(M, y, CW, boxH, 2, 2, 'FD');
  let py = y + 6;
  for (const r of provLines) {
    set(8, 'bold', MUTED);
    doc.text(r.k, M + 4, py);
    set(8, 'normal', NAVY);
    doc.text(r.v, M + 44, py);
    py += Math.max(1, r.v.length) * 3.8 + 2;
  }
  y += boxH + 6;

  /* PubMed footprint */
  const fp = context.footprint;
  if (fp?.total?.count != null) {
    heading('Size of the PubMed literature');
    const rct = fp.designs?.find(d => d.id === 'rct');
    const sr = fp.designs?.find(d => d.id === 'systematic-review');
    para(
      `PubMed indexes ${fmtInt(fp.total.count)} records matching the query above. ` +
        (rct
          ? `${fmtInt(rct.count)} (${fmtShare(rct.share)}) are indexed as randomized controlled trials`
          : '') +
        (sr ? ` and ${fmtInt(sr.count)} (${fmtShare(sr.share)}) as systematic reviews. ` : '. ') +
        (fp.freeFullText?.count != null
          ? `${fmtShare(fp.freeFullText.share)} have a free full-text version linked from PubMed.`
          : ''),
      { size: 9 }
    );
    para(
      'These counts describe the indexed literature as a whole, not the records listed in this report.',
      {
        size: 8,
        color: MUTED,
      }
    );
  }

  /* Composition of the included records */
  const d = describePaperSet(papers);
  heading('What kinds of records are included');
  const order = Object.keys(EVIDENCE_TYPES).filter(id => d.byType[id]);
  for (const id of order) {
    ensure(6);
    set(9, 'normal', NAVY);
    doc.text(EVIDENCE_TYPES[id].label, M, y);
    const bw = 70;
    const bx = M + 70;
    doc.setFillColor(...RULE);
    doc.rect(bx, y - 2.6, bw, 3, 'F');
    doc.setFillColor(...TEAL);
    doc.rect(bx, y - 2.6, Math.max(1, (d.byType[id] / d.total) * bw), 3, 'F');
    set(9, 'bold', NAVY);
    doc.text(`${d.byType[id]} of ${d.total}`, M + CW, y, { align: 'right' });
    y += 5.5;
  }
  para(
    `${d.withAbstract} of ${d.total} have an abstract; ${d.withPmc} of ${d.total} have a free full text in PubMed Central. Evidence types come from PubMed publication-type metadata and are not quality ratings.`,
    { size: 8, color: MUTED }
  );
  if (d.retracted) {
    para(`${d.retracted} record(s) are marked as retracted publications.`, {
      size: 9,
      style: 'bold',
      color: ROSE,
    });
  }
  if (d.treatments.length) {
    para(
      `Treatment tags from the research feed: ${d.treatments.map(([t, n]) => `${t} (${n})`).join(', ')}. Tag counts describe these records only and say nothing about which treatment works better.`,
      { size: 8.5 }
    );
  }

  /* Records */
  heading('Records');
  papers.forEach((p, i) => {
    const c = classifyEvidence(p.publication_types);
    const title = lines(`${i + 1}. ${paperTitle(p) || 'Untitled record'}`, CW);
    const authors = paperAuthors(p);
    const meta = [
      paperJournal(p),
      paperDate(p),
      authors.length ? authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' et al.' : '') : '',
    ]
      .filter(Boolean)
      .join('  |  ');
    const abs = paperAbstract(p).replace(/\n/g, ' ');
    const absText = abs.length > 600 ? `${abs.slice(0, 597).trimEnd()}...` : abs;
    const absLines = absText ? lines(absText, CW - 4) : [];
    const need = title.length * 4.6 + 12 + absLines.length * 3.6;
    ensure(Math.min(need, 90));

    set(10, 'bold', NAVY);
    doc.text(title, M, y);
    y += title.length * 4.6;
    para(meta, { size: 7.8, color: MUTED, gap: 0.8 });
    para(
      `${c.label}${c.retracted ? ' - RETRACTED' : ''}   Source: ${SOURCE_LABELS[p.evidenceSource] || 'Cancer Insight'}${
        treatmentTags(p).length ? `   Tags: ${treatmentTags(p).join(', ')}` : ''
      }`,
      { size: 7.8, style: 'bold', color: c.retracted ? ROSE : TEAL, gap: 1 }
    );
    if (absLines.length) para(absText, { size: 8, x: M + 2, width: CW - 4, gap: 1 });
    const links = [
      p.pubmed_url && ['PubMed', p.pubmed_url],
      p.pmc_url && ['Free full text (PMC)', p.pmc_url],
      p.doi && [`DOI ${p.doi}`, `https://doi.org/${p.doi}`],
    ].filter(Boolean);
    if (links.length) {
      ensure(5);
      set(8, 'normal', TEAL);
      let lx = M;
      for (const [label, url] of links) {
        const text = pdfText(label);
        doc.textWithLink(text, lx, y, { url });
        lx += doc.getTextWidth(text) + 6;
      }
      y += 4;
    }
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.2);
    doc.line(M, y, M + CW, y);
    y += 5;
  });

  /* Interpretation */
  heading('How to read this report');
  para(
    'Cancer Insight is an independent educational research explorer. This report lists retrieved research records and their metadata. Record counts, evidence types and treatment tags describe the literature; they do not show that any treatment is more effective, safer or more appropriate, and newer or more numerous studies are not stronger evidence. Read the original sources and discuss personal medical decisions with a qualified clinician.',
    { size: 8.5 }
  );

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.2);
    doc.line(M, 286, W - M, 286);
    set(7, 'normal', MUTED);
    doc.text(
      'Cancer Insight - educational use only, not medical advice - cancer-insight.com',
      M,
      290.5
    );
    doc.text(`Page ${i} of ${pages}`, W - M, 290.5, { align: 'right' });
  }

  doc.setProperties({
    title: `Cancer Insight - ${pdfText(cancerLabel)} research report`,
    subject: `${pdfText(cancerLabel)} research records`,
    author: 'Cancer Insight',
    creator: 'cancer-insight.com',
  });
  doc.save(`${fileStem(cancerLabel, 'report')}.pdf`);
}
