/*
  Cancer Insight — ClinicalTrials.gov retrieval (server only). Counting lives in lib/trials.js.

  ClinicalTrials.gov asks API users to keep to roughly 50 requests a minute. One cancer needs one
  request per 1,000 studies, and the downloaded list is cached for a day, so a visitor rarely
  triggers more than a handful of requests.
*/

import { stableCache } from './cache.js';
import {
  CTGOV_API,
  FIELDS,
  MAX_PAGES,
  PAGE_SIZE,
  apiQueryUrl,
  compactStudy,
  packCountries,
  conditionFor,
  searchPageUrl,
  studyUrl,
  summarizeTrials,
} from './trials.js';

const UA =
  'CancerInsight/7.0 (educational research explorer; https://www.cancer-insight.com; cancerinsight.contact@gmail.com)';
const DAY = 60 * 60 * 24;
const TIME_BUDGET_MS = 45000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getJson(url, { attempts = 3 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`ctgov-http-${res.status}`);
        await sleep(1500 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`ctgov-http-${res.status}`);
      return await res.json();
    } catch (error) {
      lastError = error;
      if (String(error?.message || '').startsWith('ctgov-http-4')) break;
      await sleep(800 * (attempt + 1));
    }
  }
  throw lastError || new Error('ctgov-unavailable');
}

async function fetchTrialRowsRaw(condition) {
  const started = Date.now();
  const rows = [];
  let totalCount = null;
  let pageToken = '';
  let pages = 0;

  do {
    const page = await getJson(apiQueryUrl(condition, { pageToken }));
    if (totalCount == null && Number.isFinite(Number(page?.totalCount))) {
      totalCount = Number(page.totalCount);
    }
    for (const study of page?.studies || []) {
      const row = compactStudy(study);
      if (row) rows.push(row);
    }
    pageToken = page?.nextPageToken || '';
    pages += 1;
  } while (pageToken && pages < MAX_PAGES && Date.now() - started < TIME_BUDGET_MS);

  const packed = packCountries(rows);
  return {
    condition,
    totalCount: totalCount ?? rows.length,
    rows: packed.rows,
    countryNames: packed.countryNames,
    truncated: Boolean(pageToken),
    retrievedAt: new Date().toISOString(),
  };
}

export const fetchTrialRows = stableCache(fetchTrialRowsRaw, ['ci-ctgov-rows-v1'], {
  revalidate: DAY,
});

async function fetchTitlesRaw(idsKey) {
  const ids = idsKey.split(',').filter(Boolean);
  if (!ids.length) return [];
  const url = new URL(CTGOV_API);
  url.searchParams.set('filter.ids', ids.join(','));
  url.searchParams.set('fields', 'NCTId,BriefTitle,Phase,OverallStatus,LastUpdatePostDate,LocationCountry');
  url.searchParams.set('pageSize', String(ids.length));
  url.searchParams.set('format', 'json');
  const data = await getJson(url.toString(), { attempts: 2 });
  const byId = new Map(
    (data?.studies || []).map(s => {
      const p = s?.protocolSection || {};
      const id = p.identificationModule?.nctId;
      const countries = new Set(
        (p.contactsLocationsModule?.locations || []).map(l => l?.country).filter(Boolean)
      );
      return [
        id,
        {
          id,
          title: p.identificationModule?.briefTitle || '',
          phases: (p.designModule?.phases || []).join('|') || 'NA',
          status: p.statusModule?.overallStatus || '',
          lastUpdate: p.statusModule?.lastUpdatePostDateStruct?.date || '',
          countries: countries.size,
          url: studyUrl(id),
        },
      ];
    })
  );
  return ids.map(id => byId.get(id)).filter(Boolean);
}

const fetchTitles = stableCache(fetchTitlesRaw, ['ci-ctgov-titles-v1'], { revalidate: DAY });

export class TrialsUnavailableError extends Error {
  constructor() {
    super('ClinicalTrials.gov could not be reached right now. Please try again in a minute.');
    this.status = 503;
    this.userFacing = true;
    this.code = 'trials-unavailable';
  }
}

/** Full trial profile for a resolved cancer. */
export async function trialProfile(resolved) {
  const condition = conditionFor(resolved);
  let data;
  try {
    data = await fetchTrialRows(condition);
  } catch (error) {
    console.error('ClinicalTrials.gov error:', error?.message || error);
    throw new TrialsUnavailableError();
  }

  const summary = summarizeTrials(data.rows, {
    condition,
    totalCount: data.totalCount,
    countryNames: data.countryNames,
  });
  let recentOpen = [];
  try {
    recentOpen = await fetchTitles(summary.recentOpenIds.join(','));
  } catch {
    recentOpen = [];
  }

  return {
    source: {
      name: 'ClinicalTrials.gov',
      url: 'https://clinicaltrials.gov',
      condition,
      searchUrl: searchPageUrl(condition),
      apiUrl: apiQueryUrl(condition, { pageSize: PAGE_SIZE }),
      fields: FIELDS,
      retrievedAt: data.retrievedAt,
      truncated: data.truncated || !summary.complete,
    },
    ...summary,
    recentOpen,
  };
}

export { fetchTrialRowsRaw };
