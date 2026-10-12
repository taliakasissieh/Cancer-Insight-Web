/*
  Cancer Insight — NCBI E-utilities client (server only).

  - Follows NCBI usage policy: identifies the tool and a contact e-mail, stays under
    3 requests/second (or 9/second when NCBI_API_KEY is configured), retries politely.
  - Caches counts and records with Next.js' data cache so repeated questions do not
    hit NCBI again.
  - Parses PubMed XML without altering scientific text (no token "repairs").
*/

import { stableCache } from './cache.js';
import { pubmedSearchUrl } from './queries.js';
import { parsePubmedXml } from './pubmed-parse.js';

export { cleanText, decodeEntities, parsePubmedXml } from './pubmed-parse.js';

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const TOOL = 'cancer-insight';
const CONTACT = 'cancerinsight.contact@gmail.com';
const UA = `CancerInsight/7.0 (educational research explorer; https://www.cancer-insight.com; ${CONTACT})`;

const DAY = 60 * 60 * 24;

const arr = x => (x == null ? [] : Array.isArray(x) ? x : [x]);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function apiKey() {
  return process.env.NCBI_API_KEY || '';
}

/* -------------------------------------------------------------------------
   Rate limiting — one shared schedule per server instance.
   ------------------------------------------------------------------------- */

let nextSlotAt = 0;

function reserveSlot() {
  const spacing = apiKey() ? 115 : 350;
  const now = Date.now();
  const at = Math.max(now, nextSlotAt);
  nextSlotAt = at + spacing;
  return at - now;
}

export function eutilsUrl(endpoint, params = {}) {
  const url = new URL(`${EUTILS}/${endpoint}.fcgi`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  url.searchParams.set('tool', TOOL);
  url.searchParams.set('email', CONTACT);
  const key = apiKey();
  if (key) url.searchParams.set('api_key', key);
  return url.toString();
}

class NcbiError extends Error {}

async function ncbiRequest(endpoint, params, { attempts = 4, timeoutMs = 15000 } = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const wait = reserveSlot();
    if (wait > 0) await sleep(wait);

    let response;
    try {
      response = await fetch(eutilsUrl(endpoint, params), {
        headers: { 'User-Agent': UA },
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(400 * attempt);
      continue;
    }

    if (response.status === 429 || response.status >= 500) {
      lastError = new NcbiError(`NCBI ${endpoint} HTTP ${response.status}`);
      /* Several server instances can share one API key, so back off with jitter (and honour
         Retry-After) instead of retrying in step with the other instances. */
      const retryAfter = Number(response.headers.get('retry-after'));
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 5000)
        : 600 * attempt + Math.random() * 600;
      if (attempt < attempts) await sleep(backoff);
      continue;
    }

    if (!response.ok) throw new NcbiError(`NCBI ${endpoint} HTTP ${response.status}`);
    return response;
  }

  throw lastError || new NcbiError(`NCBI ${endpoint} failed`);
}

function summarizeWarnings(list) {
  if (!list) return [];
  const out = [];
  for (const key of ['quotedphrasesnotfound', 'phrasesignored', 'phrasesnotfound']) {
    const v = list[key];
    if (Array.isArray(v) && v.length) out.push(`${key}: ${v.join(', ')}`);
  }
  return out;
}

/* -------------------------------------------------------------------------
   COUNTS
   ------------------------------------------------------------------------- */

async function fetchCount(term) {
  const res = await ncbiRequest('esearch', {
    db: 'pubmed',
    term,
    retmode: 'json',
    retmax: 0,
  });
  const json = await res.json();
  const es = json?.esearchresult;
  if (!es || es.ERROR || es.count === undefined) {
    throw new NcbiError(es?.ERROR || json?.error || 'Invalid ESearch response');
  }
  return {
    count: Number(es.count),
    translation: String(es.querytranslation || ''),
    warnings: summarizeWarnings(es.warninglist),
  };
}

const cachedCount = stableCache(fetchCount, ['ci-pubmed-count-v1'], { revalidate: DAY });

/**
 * Number of PubMed records matching `term`. Never throws: on failure returns
 * { count: null, ok: false } so the UI can show "unavailable" instead of a wrong number.
 */
export async function countRecords(term) {
  const url = pubmedSearchUrl(term);
  try {
    const result = await cachedCount(term);
    return { term, url, ok: true, ...result };
  } catch (error) {
    console.error('PubMed count failed:', error?.message || error);
    return { term, url, ok: false, count: null, translation: '', warnings: [] };
  }
}

/* -------------------------------------------------------------------------
   ID SEARCH
   sort: 'relevance' (PubMed Best Match) | 'pub_date' (newest first)
   ------------------------------------------------------------------------- */

async function fetchIds(term, retmax, sort) {
  const res = await ncbiRequest('esearch', {
    db: 'pubmed',
    term,
    retmode: 'json',
    retmax,
    sort,
  });
  const json = await res.json();
  const es = json?.esearchresult;
  if (!es || es.ERROR) throw new NcbiError(es?.ERROR || 'Invalid ESearch response');
  return {
    count: Number(es.count || 0),
    ids: (es.idlist || []).map(String),
    translation: String(es.querytranslation || ''),
  };
}

const cachedIds = stableCache(fetchIds, ['ci-pubmed-ids-v1'], { revalidate: DAY / 2 });

export async function searchIds(term, { retmax = 20, sort = 'relevance' } = {}) {
  const safeMax = Math.max(1, Math.min(100, Number(retmax) || 20));
  const safeSort = sort === 'pub_date' ? 'pub_date' : 'relevance';
  return cachedIds(term, safeMax, safeSort);
}

async function fetchRecordsRaw(idsKey) {
  const ids = idsKey.split(',').filter(Boolean);
  if (!ids.length) return {};
  const res = await ncbiRequest(
    'efetch',
    { db: 'pubmed', retmode: 'xml', id: ids.join(',') },
    { timeoutMs: 25000 }
  );
  const xml = await res.text();
  if (!xml.includes('<PubmedArticleSet')) throw new NcbiError('Unexpected EFetch response');
  return parsePubmedXml(xml);
}

const cachedRecords = stableCache(fetchRecordsRaw, ['ci-pubmed-records-v2'], {
  revalidate: DAY * 7,
});

/** Fetch PubMed metadata for up to 200 PMIDs. Returns { [pmid]: paper }. Never throws. */
export async function fetchRecords(ids) {
  const unique = [
    ...new Set(
      arr(ids)
        .map(id => String(id || '').trim())
        .filter(id => /^\d+$/.test(id))
    ),
  ];
  if (!unique.length) return {};
  const out = {};
  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    try {
      Object.assign(out, await cachedRecords(chunk.join(',')));
    } catch (error) {
      console.error('PubMed EFetch failed:', error?.message || error);
    }
  }
  return out;
}

/** Search + fetch in one step, preserving PubMed's order. */
export async function searchPapers(term, { retmax = 20, sort = 'relevance' } = {}) {
  try {
    const { ids, count, translation } = await searchIds(term, { retmax, sort });
    const records = await fetchRecords(ids);
    return {
      ok: true,
      count,
      translation,
      papers: ids.map(id => records[id]).filter(Boolean),
    };
  } catch (error) {
    console.error('PubMed search failed:', error?.message || error);
    return { ok: false, count: null, translation: '', papers: [] };
  }
}
