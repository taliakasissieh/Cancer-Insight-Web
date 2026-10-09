/*
  Cancer Insight — cancer-relevance filtering for the research feed.

  The third-party research feed tags records with cancer types; this filter confirms that a
  record is actually about the searched cancer and records *why* it was kept, so the UI can
  show a factual "Why it's here" line instead of a generic sentence.
*/

import { CANCERS, resolveCancer } from './queries.js';
import { dedupePapers, paperAbstract, paperTitle } from './evidence.js';

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Word-boundary phrase matcher (so "ards" never matches "towards"). */
function phraseRegex(phrase) {
  const body = escapeRegExp(phrase.toLowerCase()).replace(/\\-|\s+/g, '[\\s-]+');
  return new RegExp(`(^|[^a-z0-9])${body}s?(?=$|[^a-z0-9])`, 'i');
}

const regexCache = new Map();
function matcher(phrase) {
  if (!regexCache.has(phrase)) regexCache.set(phrase, phraseRegex(phrase));
  return regexCache.get(phrase);
}

function firstMatch(text, phrases) {
  if (!text) return null;
  for (const p of phrases) if (matcher(p).test(text)) return p;
  return null;
}

function normText(v) {
  return String(Array.isArray(v) ? v.join(' ; ') : v || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/* Phrases identifying *other* cancers — used to drop records whose title is clearly about
   a different cancer and only mention the searched one in passing. */
const OTHER_CANCER_PHRASES = Object.entries(CANCERS).map(([id, c]) => ({
  id,
  feed: c.feed,
  phrases: c.phrases.filter(p => p.split(' ').length > 1 || p.length > 6),
}));

/* Entries that share a feed key are parent/subtype pairs (lung/NSCLC, brain/glioblastoma…). */
function isRelated(other, resolved) {
  return other.id === resolved.id || Boolean(other.feed && other.feed === resolved.feed);
}

const FALSE_LUNG_TOPICS = [
  'lung transplant',
  'lung transplantation',
  'pulmonary fibrosis',
  'acute respiratory distress syndrome',
  'acute lung injury',
  'pneumonia',
  'tuberculosis',
];

/**
 * Score one paper. Returns null when the paper should be excluded, otherwise
 * { score, matchedIn: [...], phrase }.
 */
export function scorePaper(paper, resolved, { allowAbstractOnly = false } = {}) {
  if (!resolved) return null;
  const phrases = resolved.phrases;
  const meshHeadings = resolved.mesh.map(m => m.toLowerCase());

  const title = normText(paperTitle(paper));
  const abstract = normText(paperAbstract(paper));
  const mesh = normText(paper?.mesh_terms);
  const keywords = normText(paper?.keywords);
  const feedTags = (Array.isArray(paper?.cancerTypes) ? paper.cancerTypes : [])
    .map(t => String(t).toLowerCase())
    .filter(Boolean);

  const titleHit = firstMatch(title, phrases);
  const meshHit = meshHeadings.find(h => mesh.includes(h)) || firstMatch(mesh, phrases) || null;
  const keywordHit = firstMatch(keywords, phrases);
  const abstractHit = firstMatch(abstract, phrases);
  const feedHit = Boolean(resolved.feed && feedTags.includes(resolved.feed));

  const abstractOk = abstractHit && (feedHit || allowAbstractOnly);
  if (!titleHit && !meshHit && !keywordHit && !abstractOk) return null;

  if (!titleHit) {
    const otherInTitle = OTHER_CANCER_PHRASES.some(
      o =>
        !isRelated(o, resolved) &&
        o.phrases.some(p => !phrases.includes(p) && matcher(p).test(title))
    );
    if (otherInTitle) return null;

    if (resolved.feed === 'lung' && FALSE_LUNG_TOPICS.some(t => matcher(t).test(title))) {
      return null;
    }
  }

  let score = 0;
  const matchedIn = [];
  if (titleHit) {
    score += 100;
    matchedIn.push('title');
  }
  if (meshHit) {
    score += 55;
    matchedIn.push('MeSH');
  }
  if (keywordHit) {
    score += 35;
    matchedIn.push('keywords');
  }
  if (abstractHit) {
    score += 10;
    matchedIn.push('abstract');
  }
  if (feedHit) {
    score += 20;
    matchedIn.push('feed tag');
  }

  return { score, matchedIn, phrase: titleHit || meshHit || keywordHit || abstractHit || '' };
}

/**
 * Keep the most relevant records (ties keep the feed's own order, i.e. newest first).
 * Each kept paper receives a `relevance` object describing the match.
 */
export function getRelevantPapers(rawPapers, cancerOrResolved, limit = 20, options = {}) {
  const resolved =
    typeof cancerOrResolved === 'string' ? resolveCancer(cancerOrResolved) : cancerOrResolved;
  if (!resolved) return [];

  const scored = dedupePapers(rawPapers || [])
    .map((paper, index) => ({ paper, index, match: scorePaper(paper, resolved, options) }))
    .filter(x => x.match)
    .sort((a, b) => b.match.score - a.match.score || a.index - b.index);

  return scored.slice(0, limit).map(({ paper, match }) => ({ ...paper, relevance: match }));
}
