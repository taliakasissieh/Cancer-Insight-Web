/*
  Cancer Insight — evidence-type classification.

  One classifier for the whole platform (paper cards, filters, exports, PDF reports,
  analytics and the Gap Atlas sample) so that "clinical trial" always means the same thing.

  Classification uses PubMed publication-type metadata only. It describes what kind of
  record a paper is; it is NOT a quality or certainty-of-evidence rating.
*/

const TRIAL_TYPES = new Set([
  'clinical trial',
  'clinical trial, phase i',
  'clinical trial, phase ii',
  'clinical trial, phase iii',
  'clinical trial, phase iv',
  'controlled clinical trial',
  'randomized controlled trial',
  'pragmatic clinical trial',
  'equivalence trial',
  'adaptive clinical trial',
]);

const COMMENTARY_TYPES = new Set(['editorial', 'comment', 'letter', 'news', 'newspaper article']);
const GUIDELINE_TYPES = new Set([
  'guideline',
  'practice guideline',
  'consensus development conference',
  'consensus development conference, nih',
]);
const REVIEW_TYPES = new Set(['review', 'scoping review', 'systematic review']);

export const EVIDENCE_TYPES = {
  'meta-analysis': { label: 'Meta-analysis', family: 'synthesis' },
  'systematic-review': { label: 'Systematic review', family: 'synthesis' },
  rct: { label: 'Randomized controlled trial', family: 'primary' },
  trial: { label: 'Clinical trial', family: 'primary' },
  guideline: { label: 'Guideline', family: 'guidance' },
  review: { label: 'Review', family: 'synthesis' },
  observational: { label: 'Observational study', family: 'primary' },
  'case-report': { label: 'Case report', family: 'primary' },
  protocol: { label: 'Trial protocol', family: 'other' },
  preprint: { label: 'Preprint', family: 'other' },
  commentary: { label: 'Editorial, comment or letter', family: 'commentary' },
  article: { label: 'Journal article', family: 'unclassified' },
  unknown: { label: 'Type not available', family: 'unclassified' },
};

export const EVIDENCE_FAMILIES = {
  primary: {
    label: 'Primary research',
    description: 'Trials, observational studies and case reports.',
  },
  synthesis: {
    label: 'Evidence synthesis',
    description: 'Reviews, systematic reviews and meta-analyses.',
  },
  guidance: { label: 'Guidance', description: 'Practice guidelines and consensus statements.' },
  commentary: { label: 'Commentary', description: 'Editorials, comments and letters.' },
  other: { label: 'Other', description: 'Protocols and preprints.' },
  unclassified: {
    label: 'Design not indexed',
    description:
      'Indexed only as "Journal Article". Many original studies — including laboratory and clinical research — carry no more specific publication type, so this is not a judgement about the paper.',
  },
};

/** Filter options shown in the Papers view, in display order. */
export const EVIDENCE_FILTERS = [
  { id: 'all', label: 'All evidence types' },
  { id: 'trial', label: 'Clinical trials (incl. RCTs)' },
  { id: 'rct', label: 'Randomized controlled trials' },
  { id: 'observational', label: 'Observational studies' },
  { id: 'synthesis', label: 'Reviews & syntheses' },
  { id: 'systematic', label: 'Systematic reviews & meta-analyses' },
  { id: 'guideline', label: 'Guidelines' },
  { id: 'case-report', label: 'Case reports' },
  { id: 'commentary', label: 'Editorials, comments & letters' },
  { id: 'unclassified', label: 'Design not indexed' },
];

export function normalizeTypes(publicationTypes) {
  const list = Array.isArray(publicationTypes)
    ? publicationTypes
    : publicationTypes
      ? String(publicationTypes).split(/[;|]/)
      : [];
  return [
    ...new Set(
      list
        .map(t =>
          String(t || '')
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    ),
  ];
}

/**
 * Classify a record from its PubMed publication types.
 * Returns { id, label, family, tags[], phase, retracted, flags[], types[] }.
 */
export function classifyEvidence(publicationTypes) {
  const types = normalizeTypes(publicationTypes);
  const has = t => types.includes(t);

  const isMeta = has('meta-analysis');
  const isSystematic = has('systematic review');
  const isRct = has('randomized controlled trial');
  const isTrial = types.some(t => TRIAL_TYPES.has(t));
  const isGuideline = types.some(t => GUIDELINE_TYPES.has(t));
  const isReview = types.some(t => REVIEW_TYPES.has(t));
  const isObservational = has('observational study');
  const isCase = has('case reports');
  const isProtocol = has('clinical trial protocol');
  const isPreprint = has('preprint');
  const isCommentary = types.some(t => COMMENTARY_TYPES.has(t));

  const phaseType = types.find(t => /^clinical trial, phase (i|ii|iii|iv)$/.test(t));
  const phase = phaseType ? `Phase ${phaseType.split('phase ')[1].toUpperCase()}` : '';

  let id = 'unknown';
  if (isMeta) id = 'meta-analysis';
  else if (isSystematic) id = 'systematic-review';
  else if (isRct) id = 'rct';
  else if (isTrial) id = 'trial';
  else if (isGuideline) id = 'guideline';
  else if (isReview) id = 'review';
  else if (isObservational) id = 'observational';
  else if (isCase) id = 'case-report';
  else if (isProtocol) id = 'protocol';
  else if (isPreprint) id = 'preprint';
  else if (isCommentary) id = 'commentary';
  else if (types.length) id = 'article';

  let label = EVIDENCE_TYPES[id].label;
  if (isMeta && isSystematic) label = 'Systematic review & meta-analysis';
  if ((id === 'rct' || id === 'trial') && phase)
    label = `${label}, ${phase.replace('Phase', 'phase')}`;

  const tags = [];
  if (has('multicenter study')) tags.push('Multicenter');
  if (has('comparative study')) tags.push('Comparative');
  if (has('validation study')) tags.push('Validation study');

  const flags = [];
  const retracted = has('retracted publication');
  if (retracted) flags.push('retracted');
  if (has('retraction of publication')) flags.push('retraction-notice');
  if (has('published erratum')) flags.push('erratum');
  if (has('expression of concern')) flags.push('expression-of-concern');

  return {
    id,
    label,
    family: EVIDENCE_TYPES[id].family,
    isTrial,
    isRct,
    isSynthesis: isMeta || isSystematic || isReview,
    phase,
    tags,
    flags,
    retracted,
    types,
  };
}

export function matchesEvidenceFilter(paper, filterId) {
  if (!filterId || filterId === 'all') return true;
  const c = classifyEvidence(paper?.publication_types);
  switch (filterId) {
    case 'trial':
      return c.isTrial;
    case 'rct':
      return c.isRct;
    case 'observational':
      return c.id === 'observational';
    case 'synthesis':
      return c.isSynthesis;
    case 'systematic':
      return c.id === 'meta-analysis' || c.id === 'systematic-review';
    case 'guideline':
      return c.id === 'guideline';
    case 'case-report':
      return c.id === 'case-report';
    case 'commentary':
      return c.id === 'commentary';
    case 'unclassified':
      return c.family === 'unclassified';
    default:
      return true;
  }
}

/* -------------------------------------------------------------------------
   Shared paper helpers
   ------------------------------------------------------------------------- */

export function pick(paper, ...keys) {
  for (const k of keys) {
    const v = paper?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

export function paperTitle(p) {
  return String(pick(p, 'pubmed_title', 'title') || '').trim();
}

export function paperAbstract(p) {
  return String(pick(p, 'pubmed_abstract', 'abstract') || '').trim();
}

export function paperJournal(p) {
  return String(pick(p, 'pubmed_journal', 'journal') || '').trim();
}

export function paperDate(p) {
  return String(pick(p, 'pubmed_date', 'publicationDate') || '').trim();
}

export function paperYear(p) {
  const m = paperDate(p).match(/\b(1[89]|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

export function paperAuthors(p) {
  const a = p?.pubmed_authors || p?.authors;
  if (Array.isArray(a)) return a.filter(Boolean);
  return String(a || '')
    .split(/,\s*/)
    .map(s => s.trim())
    .filter(Boolean);
}

export function paperKey(p) {
  const raw = p?.pubmedId || p?.pmid || p?.doi || paperTitle(p) || p?.id || '';
  return String(raw).trim().toLowerCase();
}

export function dedupePapers(papers = []) {
  const seen = new Set();
  const out = [];
  for (const p of papers || []) {
    const k = paperKey(p);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

export function treatmentTags(p) {
  const raw = p?.treatmentTypes;
  const list = Array.isArray(raw) ? raw : raw ? String(raw).split(/[,;|]/) : [];
  return [
    ...new Set(
      list
        .map(t =>
          String(t || '')
            .trim()
            .toLowerCase()
            .replace(/[_-]/g, ' ')
            .replace(/\s+/g, ' ')
        )
        .filter(Boolean)
    ),
  ];
}

/**
 * Describe a set of papers. Every statistic carries its own denominator so the UI can say
 * "n of N" honestly (e.g. study design is only meaningful among records with publication types).
 */
export function describePaperSet(papers = []) {
  const list = dedupePapers(papers);
  const byType = {};
  const byFamily = {};
  const byYear = {};
  const journals = {};
  const treatments = {};

  let withTypes = 0;
  let withAbstract = 0;
  let withPmc = 0;
  let withDoi = 0;
  let withPmid = 0;
  let dated = 0;
  let trials = 0;
  let rcts = 0;
  let retracted = 0;

  for (const p of list) {
    const c = classifyEvidence(p?.publication_types);
    if (c.types.length) withTypes++;
    byType[c.id] = (byType[c.id] || 0) + 1;
    byFamily[c.family] = (byFamily[c.family] || 0) + 1;
    if (c.isTrial) trials++;
    if (c.isRct) rcts++;
    if (c.retracted) retracted++;

    if (paperAbstract(p)) withAbstract++;
    if (p?.pmc_id) withPmc++;
    if (p?.doi) withDoi++;
    if (p?.pubmedId || p?.pmid) withPmid++;

    const y = paperYear(p);
    if (y) {
      dated++;
      byYear[y] = (byYear[y] || 0) + 1;
    }

    const j = paperJournal(p);
    if (j) journals[j] = (journals[j] || 0) + 1;

    for (const t of treatmentTags(p)) treatments[t] = (treatments[t] || 0) + 1;
  }

  const years = Object.keys(byYear).map(Number);

  return {
    total: list.length,
    withTypes,
    withAbstract,
    withPmc,
    withDoi,
    withPmid,
    dated,
    trials,
    rcts,
    retracted,
    byType,
    byFamily,
    byYear,
    earliestYear: years.length ? Math.min(...years) : null,
    latestYear: years.length ? Math.max(...years) : null,
    journalCount: Object.keys(journals).length,
    topJournals: Object.entries(journals)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8),
    treatments: Object.entries(treatments).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
  };
}
