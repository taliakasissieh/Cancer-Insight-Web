/*
  Cancer Insight — research retrieval (server only).

  Two independent evidence sources are kept separate everywhere on the site:

  1. RESEARCH FEED — the newest records for a cancer from a third-party research API
     (Cure Cancer With AI), enriched with PubMed metadata. It supplies treatment-category
     tags. It is a *recent-records* feed, not a sample of the whole literature.

  2. PUBMED — record counts and Best Match / newest-first record lists from NCBI PubMed,
     always with the exact query so every number can be reproduced on pubmed.gov.
*/

import { unstable_cache } from 'next/cache';
import {
  DESIGN_BY_ID,
  DESIGNS,
  FREE_FULL_TEXT,
  RETRACTED_TERM,
  andTerms,
  pubmedSearchUrl,
  resolveCancer,
  resolveTreatment,
  yearRangeTerm,
} from './queries.js';
import { countRecords, fetchRecords, searchPapers } from './pubmed.js';
import { supportedTreatmentTags } from './tags.js';
import { getRelevantPapers } from './relevance.js';
import { dedupePapers, describePaperSet, treatmentTags } from './evidence.js';


export { RETRACTED_TERM };

export const FEED_SOURCE = {
  name: 'Cure Cancer With AI research API',
  url: 'https://www.curecancerwithai.com',
};

const FEED_URL = 'https://www.curecancerwithai.com/api/v1/research';
const FEED_CANDIDATES = 100;
const UA = 'CancerInsight/7.0 (educational research explorer; https://www.cancer-insight.com)';

export class UserFacingError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
    this.userFacing = true;
  }
}

export function requireCancer(raw) {
  const resolved = resolveCancer(raw);
  if (!resolved) {
    throw new UserFacingError(
      'Enter a specific cancer type — for example pancreatic, breast, leukemia or glioblastoma.'
    );
  }
  return resolved;
}

export function publicCancer(resolved) {
  return {
    input: resolved.input,
    id: resolved.id,
    slug: resolved.slug,
    label: resolved.label,
    known: resolved.known,
    feedCovered: Boolean(resolved.feed),
    term: resolved.term,
    pubmedUrl: pubmedSearchUrl(resolved.term),
  };
}

/* =========================================================================
   RESEARCH FEED
   ========================================================================= */

async function fetchFeedRaw(feedKey) {
  const apiKey = process.env.CANCER_RESEARCH_API_KEY;
  if (!apiKey) throw new Error('feed-not-configured');

  const url = new URL(FEED_URL);
  url.searchParams.set('cancerType', feedKey);
  url.searchParams.set('limit', String(FEED_CANDIDATES));
  url.searchParams.set('offset', '0');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}`, 'User-Agent': UA },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Research feed error:', res.status, body.slice(0, 300));
    throw new Error(`feed-http-${res.status}`);
  }

  const payload = await res.json();
  return Array.isArray(payload?.data) ? payload.data : [];
}

const cachedFeed = unstable_cache(fetchFeedRaw, ['ci-research-feed-v1'], { revalidate: 60 * 60 });

async function loadFeed(resolved) {
  if (!resolved.feed) return { status: 'not-covered', papers: [] };
  try {
    const papers = await cachedFeed(resolved.feed);
    return { status: papers.length ? 'ok' : 'empty', papers };
  } catch (error) {
    const reason = String(error?.message || '');
    return {
      status: reason === 'feed-not-configured' ? 'not-configured' : 'unavailable',
      papers: [],
    };
  }
}

function normalizeFeedPaper(p) {
  return {
    ...p,
    pubmedId: String(p?.pubmedId || p?.pmid || p?.pubmed_id || ''),
    treatmentTypes: treatmentTags(p),
    publication_types: Array.isArray(p?.publication_types) ? p.publication_types : [],
    evidenceSource: 'feed',
  };
}

function countTags(papers) {
  const counts = {};
  for (const p of papers) for (const t of treatmentTags(p)) counts[t] = (counts[t] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/**
 * Main search. Returns up to 20 recent, cancer-relevant records with full provenance.
 * Falls back to PubMed (newest first) when the feed does not cover the cancer or fails,
 * so a search never dead-ends.
 */
export async function searchCancer(raw, { limit = 20 } = {}) {
  const resolved = requireCancer(raw);
  const feed = await loadFeed(resolved);

  let relevant = [];
  if (feed.papers.length) {
    const base = dedupePapers(feed.papers.map(normalizeFeedPaper));
    const records = await fetchRecords(base.map(p => p.pubmedId));
    const enriched = base.map(p => {
      const pm = records[p.pubmedId] || {};
      const merged = { ...p, ...pm, treatmentTypes: p.treatmentTypes, evidenceSource: 'feed' };
      return { ...merged, treatmentTypes: supportedTreatmentTags(merged) };
    });
    relevant = getRelevantPapers(enriched, resolved, limit);
  }

  let pubmedFill = null;
  if (relevant.length < Math.min(8, limit)) {
    pubmedFill = await searchPapers(resolved.term, { retmax: limit, sort: 'pub_date' });
    const seen = new Set(relevant.map(p => p.pubmedId).filter(Boolean));
    const extra = pubmedFill.papers
      .filter(p => !seen.has(p.pubmedId))
      .map(p => ({ ...p, evidenceSource: 'pubmed-newest', treatmentTypes: [] }));
    relevant = [...relevant, ...extra].slice(0, limit);
  }

  if (!relevant.length) {
    const unreachable = pubmedFill && !pubmedFill.ok;
    throw new UserFacingError(
      unreachable
        ? 'The research sources could not be reached right now. Please try again in a minute.'
        : `No research records were found for “${resolved.input}”. Try a broader cancer type.`,
      unreachable ? 503 : 404
    );
  }

  const fromFeed = relevant.filter(p => p.evidenceSource === 'feed').length;
  const fromPubmed = relevant.length - fromFeed;

  return {
    cancer: publicCancer(resolved),
    papers: relevant,
    treatments: countTags(relevant),
    profile: describePaperSet(relevant),
    provenance: {
      retrievedAt: new Date().toISOString(),
      order: 'newest records first',
      feed: {
        name: FEED_SOURCE.name,
        url: FEED_SOURCE.url,
        status: feed.status,
        candidates: feed.papers.length,
        kept: fromFeed,
      },
      pubmed: pubmedFill
        ? {
            used: fromPubmed > 0,
            kept: fromPubmed,
            sort: 'newest first',
            term: resolved.term,
            url: pubmedSearchUrl(resolved.term),
          }
        : { used: false, kept: 0 },
    },
  };
}

/* =========================================================================
   PUBMED RECORD LISTS (Papers view: "Best Match across all years")
   ========================================================================= */

export async function pubmedPaperSet(raw, { sort = 'relevance', limit = 20 } = {}) {
  const resolved = requireCancer(raw);
  const result = await searchPapers(resolved.term, { retmax: limit, sort });
  if (!result.ok) {
    throw new UserFacingError('PubMed could not be reached right now. Please try again.', 503);
  }
  const source = sort === 'pub_date' ? 'pubmed-newest' : 'pubmed-best-match';
  return {
    cancer: publicCancer(resolved),
    sort: sort === 'pub_date' ? 'newest first' : 'Best Match',
    count: result.count,
    papers: result.papers.map(p => ({ ...p, evidenceSource: source })),
    profile: describePaperSet(result.papers),
    retrievedAt: new Date().toISOString(),
  };
}

/* =========================================================================
   LITERATURE FOOTPRINT (Overview → Evidence landscape)
   Whole-PubMed counts for the cancer query: per publication year and per design.
   ========================================================================= */

export async function literatureFootprint(raw, { years = 11 } = {}) {
  const resolved = requireCancer(raw);
  const currentYear = new Date().getUTCFullYear();
  const yearList = Array.from({ length: years }, (_, i) => currentYear - years + 1 + i);

  const [total, freeText, retracted, ...rest] = await Promise.all([
    countRecords(resolved.term),
    countRecords(andTerms(resolved.term, FREE_FULL_TEXT.term)),
    countRecords(andTerms(resolved.term, RETRACTED_TERM)),
    ...yearList.map(y => countRecords(andTerms(resolved.term, yearRangeTerm(y, y)))),
    ...DESIGNS.map(d => countRecords(andTerms(resolved.term, d.term))),
  ]);

  const yearCounts = rest.slice(0, yearList.length);
  const designCounts = rest.slice(yearList.length);
  const share = n => (total.count && n != null ? n / total.count : null);

  return {
    cancer: publicCancer(resolved),
    generatedAt: new Date().toISOString(),
    total: { count: total.count, url: total.url, term: total.term, warnings: total.warnings },
    freeFullText: { count: freeText.count, share: share(freeText.count), url: freeText.url },
    retracted: { count: retracted.count, url: retracted.url },
    years: yearList.map((year, i) => ({
      year,
      count: yearCounts[i].count,
      url: yearCounts[i].url,
      partial: year === currentYear,
    })),
    designs: DESIGNS.map((d, i) => ({
      id: d.id,
      label: d.label,
      short: d.short,
      count: designCounts[i].count,
      share: share(designCounts[i].count),
      url: designCounts[i].url,
    })),
    notes: [
      'Counts are PubMed records matching the cancer query and include every record type (articles, reviews, letters and so on).',
      'PubMed has indexed more journals over time, so rising yearly counts reflect both research activity and indexing coverage.',
      `The current year (${currentYear}) is incomplete and recent records are still being indexed.`,
      'Publication types are assigned during indexing; the newest records may not have them yet, so design counts for recent years are lower bounds.',
    ],
  };
}

/* =========================================================================
   TREATMENT EVIDENCE PROFILE (Treatments view)
   ========================================================================= */

const TREATMENT_MEASURES = [
  'clinical-trial',
  'rct',
  'systematic-review',
  'meta-analysis',
  'review',
];

export async function treatmentProfile(
  rawCancer,
  rawTreatment,
  { limit = 8, sort = 'relevance' } = {}
) {
  const resolved = requireCancer(rawCancer);
  const treatment = resolveTreatment(rawTreatment);
  if (!treatment) throw new UserFacingError('Choose a treatment category.');

  const currentYear = new Date().getUTCFullYear();
  const pairTerm = andTerms(resolved.term, treatment.term);
  const recentTerm = andTerms(pairTerm, yearRangeTerm(currentYear - 4, currentYear));

  const [cancerTotal, total, recent, freeText, ...designCounts] = await Promise.all([
    countRecords(resolved.term),
    countRecords(pairTerm),
    countRecords(recentTerm),
    countRecords(andTerms(pairTerm, FREE_FULL_TEXT.term)),
    ...TREATMENT_MEASURES.map(id => countRecords(andTerms(pairTerm, DESIGN_BY_ID[id].term))),
  ]);

  const examples = await searchPapers(pairTerm, {
    retmax: Math.max(1, Math.min(20, Number(limit) || 8)),
    sort,
  });

  const share = (n, d) => (n != null && d ? n / d : null);

  return {
    cancer: publicCancer(resolved),
    treatment: { id: treatment.id, label: treatment.label, term: treatment.term },
    generatedAt: new Date().toISOString(),
    query: { term: pairTerm, url: pubmedSearchUrl(pairTerm) },
    cancerTotal: { count: cancerTotal.count, url: cancerTotal.url },
    total: {
      count: total.count,
      url: total.url,
      shareOfCancer: share(total.count, cancerTotal.count),
    },
    recent: {
      label: `${currentYear - 4}–${currentYear}`,
      count: recent.count,
      url: recent.url,
      share: share(recent.count, total.count),
    },
    freeFullText: {
      count: freeText.count,
      url: freeText.url,
      share: share(freeText.count, total.count),
    },
    designs: TREATMENT_MEASURES.map((id, i) => ({
      id,
      label: DESIGN_BY_ID[id].label,
      short: DESIGN_BY_ID[id].short,
      count: designCounts[i].count,
      url: designCounts[i].url,
      share: share(designCounts[i].count, total.count),
    })),
    examples: {
      sort: sort === 'pub_date' ? 'newest first' : 'Best Match',
      papers: examples.papers.map(p => ({ ...p, evidenceSource: 'pubmed-best-match' })),
    },
  };
}

/* =========================================================================
   RETRACTION WATCH (cancer profiles, Overview)
   PubMed marks retracted papers with the publication type "Retracted Publication".
   ========================================================================= */

export async function retractionWatch(raw, { limit = 6 } = {}) {
  const resolved = requireCancer(raw);
  const term = andTerms(resolved.term, RETRACTED_TERM);
  const [total, retracted, newest] = await Promise.all([
    countRecords(resolved.term),
    countRecords(term),
    searchPapers(term, { retmax: Math.max(1, Math.min(20, Number(limit) || 6)), sort: 'pub_date' }),
  ]);
  return {
    cancer: publicCancer(resolved),
    generatedAt: new Date().toISOString(),
    query: { term, url: pubmedSearchUrl(term) },
    total: { count: total.count, url: total.url },
    retracted: {
      count: retracted.count,
      url: retracted.url,
      perTenThousand:
        retracted.count != null && total.count ? (retracted.count / total.count) * 10000 : null,
    },
    newest: (newest.ok ? newest.papers : []).map(p => ({
      pmid: p.pubmedId || p.pmid || '',
      title: p.pubmed_title || p.title || '',
      journal: p.pubmed_journal || '',
      year: p.pubmed_year || null,
      url: p.pubmed_url || '',
      doi: p.doi || '',
    })),
  };
}
