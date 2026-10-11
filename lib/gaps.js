/*
  Cancer Insight — Research Gap Atlas, Method 3.0

  WHAT CHANGED FROM V2 (and why)
  V2 measured coverage inside a small retrieved sample. Its denominators mixed relevance-ranked
  records, year-stratified records and treatment-enriched records, so design/topic shares and the
  "recent literature" signal were partly products of the sampling design.

  Method 3.0 measures coverage across the whole PubMed index:

    share(cancer, measure)    = records(cancer AND measure) / records(cancer)
    share(oncology, measure)  = records(oncology AND measure) / records(oncology)
    relative representation   = share(cancer) / share(oncology)

  A measure is reported as LOWER REPRESENTATION when the ratio is below 0.5 and as MUCH LOWER
  below 0.33 — i.e. the cancer's literature contains less than half (a third) of the share seen
  across oncology. That is a description of the indexed literature, never proof of a scientific
  or clinical research gap.

  Every number is a PubMed record count with its exact query, so each one can be reproduced.
  The year-stratified sample from V2 is kept as an INSPECTABLE SAMPLE: it shows real example
  records and metadata completeness, and it does not feed any signal.
*/

import {
  ATLAS_DESIGN_IDS,
  ATLAS_METHOD_VERSION,
  ATLAS_THRESHOLDS,
  BASELINE_TERM,
  DESIGN_BY_ID,
  FREE_FULL_TEXT,
  THEMES,
  TREATMENTS,
  andTerms,
  pubmedSearchUrl,
  yearRangeTerm,
  yearWindows,
} from './queries.js';
import { countRecords, fetchRecords, searchIds } from './pubmed.js';
import { publicCancer, requireCancer } from './research.js';
import { getRelevantPapers } from './relevance.js';
import { classifyEvidence, describePaperSet, paperAbstract, paperTitle } from './evidence.js';

export const METHOD_VERSION = ATLAS_METHOD_VERSION;
export const THRESHOLDS = ATLAS_THRESHOLDS;

const SAMPLE_PER_WINDOW = 12;
const ATLAS_DESIGNS = ATLAS_DESIGN_IDS;

/* Oncology-wide reference counts captured from PubMed on 9 Oct 2026 with the exact queries
   in lib/queries.js. Used ONLY for a measure whose live baseline count cannot be retrieved;
   the response marks every measure that used it. */
export const BASELINE_SNAPSHOT = {
  date: '2026-10-09',
  year: 2026,
  total: 5902084,
  counts: {
    'clinical-trial': 175674,
    rct: 79055,
    'systematic-review': 60686,
    'meta-analysis': 50493,
    'quality-of-life': 137770,
    toxicity: 422865,
    recurrence: 467616,
    resistance: 207389,
    biomarkers: 486015,
    pediatric: 260469,
    'older-adults': 79024,
    survivorship: 46183,
    disparities: 52908,
    'free-full-text': 2356629,
    'recent-share': 740617,
  },
};

const CAUTIONS = {
  design:
    'Publication types are assigned during PubMed indexing and are often missing for the newest records. A lower share describes the indexed literature; it does not show that more trials or reviews are needed, feasible or ethical.',
  concept:
    'Theme matching uses MeSH headings and title/abstract wording. It can miss synonyms and counts any record that mentions the theme. Lower representation is a prompt for investigation, not proof of a research gap.',
  population:
    'Population matching uses title/abstract wording, so it counts studies that name the population — not every study that enrolled it. Low representation can reflect who develops this cancer.',
  access:
    'This is an access signal, not a scientific evidence gap. It describes how much of the literature has a free full-text version linked from PubMed; other free copies may exist.',
  time: 'Recent share is affected by publication delays and indexing speed. A lower share can describe a long-established literature rather than declining research.',
};

function measureDefinitions(currentYear) {
  return [
    ...ATLAS_DESIGNS.map(id => ({
      id,
      group: 'design',
      category: 'Study design',
      label: DESIGN_BY_ID[id].label,
      short: DESIGN_BY_ID[id].short,
      term: DESIGN_BY_ID[id].term,
      caution: CAUTIONS.design,
    })),
    ...THEMES.map(t => ({
      id: t.id,
      group: t.kind === 'population' ? 'population' : 'theme',
      category: t.kind === 'population' ? 'Population focus' : 'Research theme',
      label: t.label,
      short: t.short,
      term: t.term,
      caution: t.kind === 'population' ? CAUTIONS.population : CAUTIONS.concept,
    })),
    {
      id: FREE_FULL_TEXT.id,
      group: 'access',
      category: 'Access',
      label: FREE_FULL_TEXT.label,
      short: FREE_FULL_TEXT.short,
      term: FREE_FULL_TEXT.term,
      caution: CAUTIONS.access,
    },
    {
      id: 'recent-share',
      group: 'time',
      category: 'Recency',
      label: `Published ${currentYear - 2}–${currentYear}`,
      short: 'Last 3 years',
      term: yearRangeTerm(currentYear - 2, currentYear),
      caution: CAUTIONS.time,
    },
  ];
}

function contextFor(measureId, population, label) {
  if (measureId === 'pediatric' && population === 'adult') {
    return `${label} occurs predominantly in adults, so a low share of studies focused on children and adolescents is expected. It is shown for completeness and is not treated as a signal.`;
  }
  if (measureId === 'older-adults' && population === 'pediatric') {
    return `${label} occurs predominantly in children, so a low share of studies focused on older adults is expected. It is shown for completeness and is not treated as a signal.`;
  }
  return '';
}

function classify(ratio) {
  if (ratio == null || !Number.isFinite(ratio)) return 'unavailable';
  if (ratio < THRESHOLDS.muchLower) return 'much-lower';
  if (ratio < THRESHOLDS.lower) return 'lower';
  if (ratio > THRESHOLDS.higher) return 'higher';
  return 'similar';
}

const pct = v => (v == null ? '—' : `${(v * 100).toFixed(v < 0.01 ? 2 : 1)}%`);
const fmt = n => (n == null ? '—' : Number(n).toLocaleString('en-US'));

function signalText(m, cancerLabel) {
  let title;
  if (m.group === 'access') title = 'Free full text is less often available than across oncology';
  else if (m.group === 'time')
    title = 'Recent records make up a smaller share than across oncology';
  else if (m.group === 'population')
    title = `Studies focused on ${m.label.toLowerCase()} make up a smaller share than across oncology`;
  else if (m.group === 'theme')
    title = `Research on ${m.label.toLowerCase()} makes up a smaller share than across oncology`;
  else title = `${m.label} make up a smaller share than across oncology`;

  const subject = cancerLabel.charAt(0).toLowerCase() + cancerLabel.slice(1);
  const summary = `${pct(m.share)} of ${subject} records (${fmt(m.count)} of ${fmt(
    m.total
  )}) match “${m.short}”, compared with ${pct(m.baselineShare)} of oncology records — ${m.ratio.toFixed(
    2
  )}× the oncology-wide share.`;
  return { title, summary };
}

function evidenceRecord(paper, windowId) {
  const c = classifyEvidence(paper?.publication_types);
  return {
    pmid: paper?.pubmedId || '',
    title: paperTitle(paper),
    journal: paper?.pubmed_journal || '',
    date: paper?.pubmed_date || '',
    year: paper?.pubmed_year || null,
    url: paper?.pubmed_url || '',
    doi: paper?.doi || '',
    pmcUrl: paper?.pmc_url || '',
    evidenceType: c.label,
    evidenceFamily: c.family,
    retracted: c.retracted,
    publicationTypes: c.types,
    hasAbstract: Boolean(paperAbstract(paper)),
    matchedIn: paper?.relevance?.matchedIn || [],
    source: 'PubMed',
    retrievalMethod: 'Best Match within publication-year window',
    retrievalWindow: windowId,
  };
}

async function inspectableSample(resolved, windows) {
  const searches = await Promise.all(
    windows.map(async w => {
      const term = andTerms(resolved.term, yearRangeTerm(w.start, w.end));
      try {
        const r = await searchIds(term, { retmax: SAMPLE_PER_WINDOW, sort: 'relevance' });
        return { window: w, term, ids: r.ids, count: r.count };
      } catch {
        return { window: w, term, ids: [], count: null };
      }
    })
  );

  const records = await fetchRecords(searches.flatMap(s => s.ids));
  const kept = [];
  const perWindow = [];

  for (const s of searches) {
    const retrieved = s.ids.map(id => records[id]).filter(Boolean);
    const relevant = getRelevantPapers(retrieved, resolved, SAMPLE_PER_WINDOW, {
      allowAbstractOnly: true,
    });
    perWindow.push({
      id: s.window.id,
      label: s.window.label,
      start: s.window.start,
      end: s.window.end,
      term: s.term,
      url: pubmedSearchUrl(s.term),
      totalRecords: s.count,
      requested: SAMPLE_PER_WINDOW,
      retrieved: retrieved.length,
      kept: relevant.length,
    });
    for (const p of relevant) kept.push({ paper: p, windowId: s.window.id });
  }

  const stats = describePaperSet(kept.map(x => x.paper));
  return {
    method:
      'PubMed Best Match: the top records inside each publication-year window, then checked for cancer relevance (title, MeSH, keywords or abstract). Equal numbers are requested per window, so the sample is deliberately spread across time and is NOT proportional to publication volume.',
    perWindow,
    papers: kept.map(x => evidenceRecord(x.paper, x.windowId)),
    stats: {
      total: stats.total,
      withAbstract: stats.withAbstract,
      withSpecificType: stats.total - (stats.byFamily.unclassified || 0),
      withPmc: stats.withPmc,
      withDoi: stats.withDoi,
      retracted: stats.retracted,
      byFamily: stats.byFamily,
    },
  };
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  error.userFacing = true;
  return error;
}

export async function analyzeResearchGaps(rawCancer) {
  const resolved = requireCancer(rawCancer);
  const currentYear = new Date().getUTCFullYear();
  const measures = measureDefinitions(currentYear);
  const windows = yearWindows(currentYear);
  const treatmentEntries = Object.entries(TREATMENTS);

  const [total, baselineTotal, ...rest] = await Promise.all([
    countRecords(resolved.term),
    countRecords(BASELINE_TERM),
    ...measures.map(m => countRecords(andTerms(resolved.term, m.term))),
    ...measures.map(m => countRecords(andTerms(BASELINE_TERM, m.term))),
    ...treatmentEntries.map(([, t]) => countRecords(andTerms(resolved.term, t.term))),
  ]);

  const cancerCounts = rest.slice(0, measures.length);
  const baselineCounts = rest.slice(measures.length, measures.length * 2);
  const treatmentCounts = rest.slice(measures.length * 2);

  if (total.count == null) {
    throw httpError('PubMed could not be reached right now. Please try again in a minute.', 503);
  }
  if (total.count === 0) {
    throw httpError(`PubMed returned no records for “${resolved.input}”.`, 404);
  }

  const snapshotUsable = id => id !== 'recent-share' || BASELINE_SNAPSHOT.year === currentYear;
  const baselineTotalCount = baselineTotal.count ?? BASELINE_SNAPSHOT.total;

  const results = measures.map((m, i) => {
    const count = cancerCounts[i].count;
    let bCount = baselineCounts[i].count;
    let baselineSource = 'live';
    let bTotal = baselineTotalCount;
    if (bCount == null || baselineTotal.count == null) {
      if (snapshotUsable(m.id)) {
        bCount = BASELINE_SNAPSHOT.counts[m.id];
        bTotal = BASELINE_SNAPSHOT.total;
        baselineSource = 'snapshot';
      } else {
        bCount = null;
        baselineSource = 'unavailable';
      }
    }

    const share = count != null ? count / total.count : null;
    const baselineShare = bCount != null && bTotal ? bCount / bTotal : null;
    const ratio = share != null && baselineShare ? share / baselineShare : null;
    const expected = baselineShare != null ? baselineShare * total.count : null;
    const context = contextFor(m.id, resolved.population, resolved.label);

    let status = classify(ratio);
    if (status !== 'unavailable') {
      if (
        total.count < THRESHOLDS.minRecords ||
        (expected != null && expected < THRESHOLDS.minExpected)
      ) {
        status = 'insufficient';
      } else if (context && (status === 'lower' || status === 'much-lower')) {
        status = 'context';
      }
    }

    return {
      id: m.id,
      group: m.group,
      category: m.category,
      label: m.label,
      short: m.short,
      definition: m.term,
      count,
      total: total.count,
      share,
      baselineCount: bCount,
      baselineTotal: bTotal,
      baselineShare,
      baselineSource,
      ratio,
      status,
      url: cancerCounts[i].url,
      baselineUrl: pubmedSearchUrl(andTerms(BASELINE_TERM, m.term)),
      caution: m.caution,
      context: status === 'context' ? context : '',
    };
  });

  const sources = new Set(results.map(r => r.baselineSource));
  const baseline = {
    term: BASELINE_TERM,
    url: pubmedSearchUrl(BASELINE_TERM),
    total: baselineTotalCount,
    source: sources.size === 1 ? [...sources][0] : 'mixed',
    snapshotDate: sources.has('snapshot') ? BASELINE_SNAPSHOT.date : null,
  };

  const signals = results
    .filter(m => m.status === 'lower' || m.status === 'much-lower')
    .sort((a, b) => a.ratio - b.ratio)
    .map(m => ({
      id: `${m.group}-${m.id}`,
      measureId: m.id,
      category: m.category,
      level: m.status,
      ...signalText(m, resolved.label),
      basis: {
        count: m.count,
        total: m.total,
        share: m.share,
        baselineCount: m.baselineCount,
        baselineTotal: m.baselineTotal,
        baselineShare: m.baselineShare,
        ratio: m.ratio,
        threshold: m.status === 'much-lower' ? THRESHOLDS.muchLower : THRESHOLDS.lower,
      },
      url: m.url,
      baselineUrl: m.baselineUrl,
      caution: m.caution,
    }));

  const sample = await inspectableSample(resolved, windows);

  const timeWindows = sample.perWindow.map(w => {
    const span = Math.max(1, Math.min(w.end, currentYear) - w.start + 1);
    return {
      id: w.id,
      label: w.label,
      start: w.start,
      end: w.end,
      records: w.totalRecords,
      perYear: w.totalRecords != null && w.id !== 'historical' ? w.totalRecords / span : null,
      url: w.url,
    };
  });

  return {
    methodVersion: METHOD_VERSION,
    generatedAt: new Date().toISOString(),
    cancer: publicCancer(resolved),
    totals: { records: total.count, url: total.url, warnings: total.warnings || [] },
    baseline,
    thresholds: THRESHOLDS,
    measures: results,
    signals,
    contextNotes: results
      .filter(m => m.status === 'context')
      .map(m => ({ id: m.id, label: m.label, note: m.context })),
    timeWindows,
    treatments: treatmentEntries
      .map(([id, t], i) => ({
        id,
        label: t.label,
        definition: t.term,
        count: treatmentCounts[i].count,
        share: treatmentCounts[i].count != null ? treatmentCounts[i].count / total.count : null,
        url: treatmentCounts[i].url,
      }))
      .sort((a, b) => (b.count ?? -1) - (a.count ?? -1)),
    sample,
    methodology: {
      summary:
        'Method 3.0 compares the share of a cancer’s PubMed records that match each study design, research theme, access filter and recency window with the same share across all oncology records. Measures below half (or a third) of the oncology-wide share are reported as lower (or much lower) representation.',
      interpretation:
        'A signal describes how the indexed literature is distributed. It is not proof that a real scientific or clinical research gap exists, it does not rank treatments, and it is not medical advice.',
      notCounted:
        'Treatment categories are described but never flagged: whether a treatment is relevant depends on the biology of each cancer, so a low count cannot be read as a gap.',
    },
    limitations: [
      'PubMed indexes most, but not all, biomedical journals; conference abstracts, trial registries and grey literature are not included.',
      'Publication types and MeSH headings are added during indexing and can lag behind the newest records.',
      'Title/abstract wording catches records that mention a theme, including some where it is a minor point.',
      'The oncology baseline is broad (any record about any neoplasm); comparisons describe relative emphasis, not adequacy.',
      'Counts change as PubMed grows; results are dated and cached for up to 24 hours.',
    ],
  };
}
