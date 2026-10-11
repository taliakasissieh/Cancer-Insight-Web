/*
  Cancer Insight — clinical-trial registrations from ClinicalTrials.gov (API v2).

  One query per cancer: every study whose condition matches the cancer (ClinicalTrials.gov expands
  condition synonyms itself). All matching records are downloaded with a small set of fields and
  counted here, so every figure comes from the same list — and that list can be downloaded as CSV,
  one row per trial, to check any number.

  Headline measure — "completed without posted results":
    interventional studies with status COMPLETED, whose primary completion date (or, if missing,
    completion date) is at least RESULTS_LAG_MONTHS before today, and with no results posted on
    ClinicalTrials.gov. This is NOT proof that results were never shared: many trials publish in
    journals instead, and many (e.g. phase 1, or trials outside U.S. law) are not required to post
    results on ClinicalTrials.gov.
*/

export const CTGOV_API = 'https://clinicaltrials.gov/api/v2/studies';
export const CTGOV_WEB = 'https://clinicaltrials.gov';
export const RESULTS_LAG_MONTHS = 24;
export const PAGE_SIZE = 1000;
export const MAX_PAGES = 40;

export const FIELDS = [
  'NCTId',
  'OverallStatus',
  'Phase',
  'StudyType',
  'HasResults',
  'StartDate',
  'PrimaryCompletionDate',
  'CompletionDate',
  'LastUpdatePostDate',
  'LeadSponsorClass',
  'LocationCountry',
];

/* Status groups used throughout the site. */
export const STATUS_GROUPS = {
  RECRUITING: 'open',
  NOT_YET_RECRUITING: 'open',
  ENROLLING_BY_INVITATION: 'open',
  ACTIVE_NOT_RECRUITING: 'active',
  COMPLETED: 'completed',
  TERMINATED: 'stopped',
  WITHDRAWN: 'stopped',
  SUSPENDED: 'stopped',
  UNKNOWN: 'unknown',
};

export const STATUS_ORDER = [
  'RECRUITING',
  'NOT_YET_RECRUITING',
  'ENROLLING_BY_INVITATION',
  'ACTIVE_NOT_RECRUITING',
  'COMPLETED',
  'TERMINATED',
  'SUSPENDED',
  'WITHDRAWN',
  'UNKNOWN',
];

export const PHASE_ORDER = [
  'EARLY_PHASE1',
  'PHASE1',
  'PHASE1|PHASE2',
  'PHASE2',
  'PHASE2|PHASE3',
  'PHASE3',
  'PHASE4',
  'NA',
];

export const SPONSOR_ORDER = ['INDUSTRY', 'NIH', 'FED', 'OTHER_GOV', 'NETWORK', 'OTHER', 'INDIV', 'UNKNOWN'];

/* Condition words sent to ClinicalTrials.gov when the catalogue label is not the usual term. */
const CONDITION_OVERRIDES = {
  brain: 'Brain Tumor',
  skin: 'Skin Cancer',
  nsclc: 'Non-small Cell Lung Cancer',
  hepatocellular: 'Hepatocellular Carcinoma',
  myeloma: 'Multiple Myeloma',
  sarcoma: 'Sarcoma',
  leukemia: 'Leukemia',
  lymphoma: 'Lymphoma',
  melanoma: 'Melanoma',
  glioblastoma: 'Glioblastoma',
  neuroblastoma: 'Neuroblastoma',
  mesothelioma: 'Mesothelioma',
};

export function conditionFor(resolved) {
  if (!resolved) return '';
  if (resolved.id && CONDITION_OVERRIDES[resolved.id]) return CONDITION_OVERRIDES[resolved.id];
  return resolved.label || resolved.input || '';
}

export function searchPageUrl(condition, extra = {}) {
  const url = new URL(`${CTGOV_WEB}/search`);
  url.searchParams.set('cond', condition);
  for (const [k, v] of Object.entries(extra)) if (v) url.searchParams.set(k, v);
  return url.toString();
}

export function studyUrl(nctId) {
  return `${CTGOV_WEB}/study/${encodeURIComponent(nctId)}`;
}

/** The exact data-API request behind the list (first page). */
export function apiQueryUrl(condition, { pageSize = PAGE_SIZE, pageToken = '' } = {}) {
  const url = new URL(CTGOV_API);
  url.searchParams.set('query.cond', condition);
  url.searchParams.set('fields', FIELDS.join(','));
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('countTotal', 'true');
  url.searchParams.set('format', 'json');
  if (pageToken) url.searchParams.set('pageToken', pageToken);
  return url.toString();
}

/* -------------------------------------------------------------------------
   Parsing — one compact row per study.
   ------------------------------------------------------------------------- */

const STUDY_TYPE_CODE = { INTERVENTIONAL: 'I', OBSERVATIONAL: 'O', EXPANDED_ACCESS: 'E' };

function isoPart(value) {
  const s = String(value || '').trim();
  return /^\d{4}(-\d{2}){0,2}$/.test(s) ? s : '';
}

/* Month precision is enough for start and completion dates and keeps the cached list small. */
function isoMonth(value) {
  return isoPart(value).slice(0, 7);
}

/**
 * Row layout (kept small so the full list for a large cancer stays under the 2 MB cache limit):
 * [nctId, status, phases ("PHASE1|PHASE2"), type (I/O/E), hasResults (1/0), start (YYYY-MM),
 *  primaryCompletion (YYYY-MM), completion (YYYY-MM), lastUpdate (YYYY-MM-DD), sponsorClass,
 *  countries ("Jordan|Egypt", or indices into a country list once packed — see packCountries)]
 */
export function compactStudy(study) {
  const p = study?.protocolSection || {};
  const id = p.identificationModule?.nctId;
  if (!id) return null;
  const s = p.statusModule || {};
  const d = p.designModule || {};
  const phases = Array.isArray(d.phases) ? d.phases.filter(Boolean) : [];
  const countries = [
    ...new Set(
      (p.contactsLocationsModule?.locations || [])
        .map(l => String(l?.country || '').trim())
        .filter(Boolean)
    ),
  ];
  return [
    String(id),
    String(s.overallStatus || 'UNKNOWN'),
    phases.join('|'),
    STUDY_TYPE_CODE[d.studyType] || '',
    study?.hasResults ? 1 : 0,
    isoMonth(s.startDateStruct?.date),
    isoMonth(s.primaryCompletionDateStruct?.date),
    isoMonth(s.completionDateStruct?.date),
    isoPart(s.lastUpdatePostDateStruct?.date),
    String(p.sponsorCollaboratorsModule?.leadSponsor?.class || 'UNKNOWN'),
    countries.join('|'),
  ];
}

/** Replace country names with indices into one shared list (long lists repeat the same names). */
export function packCountries(rows) {
  const names = [];
  const index = new Map();
  const packed = rows.map(r => {
    const ids = String(r[10] || '')
      .split('|')
      .filter(Boolean)
      .map(name => {
        if (!index.has(name)) {
          index.set(name, names.length);
          names.push(name);
        }
        return index.get(name);
      });
    const copy = r.slice();
    copy[10] = ids.join('|');
    return copy;
  });
  return { countryNames: names, rows: packed };
}

function countryList(row, countryNames) {
  const parts = String(row[10] || '').split('|').filter(Boolean);
  return countryNames ? parts.map(i => countryNames[Number(i)]).filter(Boolean) : parts;
}

export const ROW = {
  id: 0,
  status: 1,
  phases: 2,
  type: 3,
  hasResults: 4,
  start: 5,
  primaryCompletion: 6,
  completion: 7,
  lastUpdate: 8,
  sponsor: 9,
  countries: 10,
};

/* -------------------------------------------------------------------------
   Aggregation (pure — tested in tests/trials.test.mjs).
   ------------------------------------------------------------------------- */

/** Compare partial ISO dates ("2021", "2021-05", "2021-05-14") against a full ISO date. */
export function onOrBefore(partial, isoDate) {
  if (!partial) return false;
  const [y, m = '12', d = '28'] = partial.split('-');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` <= isoDate;
}

export function monthsBefore(date, months) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

function bump(map, key, by = 1) {
  map.set(key, (map.get(key) || 0) + by);
}

function ordered(map, order) {
  const out = order.filter(k => map.has(k)).map(id => ({ id, count: map.get(id) }));
  for (const [id, count] of map) if (!order.includes(id)) out.push({ id, count });
  return out;
}

export function summarizeTrials(
  rows,
  { today = new Date(), condition = '', totalCount = null, countryNames = null } = {}
) {
  const cutoff = monthsBefore(today, RESULTS_LAG_MONTHS);
  const currentYear = today.getUTCFullYear();
  const firstYear = currentYear - 14;

  const byType = { I: 0, O: 0, E: 0, other: 0 };
  const status = new Map();
  const phases = new Map();
  const sponsors = new Map();
  const countries = new Map();
  const startYears = new Map();
  let completed = 0;
  let completedWithResults = 0;
  let eligible = 0;
  const overdueIds = [];
  const overdueByPhase = new Map();
  const recentOpen = [];

  for (const r of rows) {
    const type = r[ROW.type] || 'other';
    byType[type in byType ? type : 'other'] += 1;
    if (type !== 'I') continue;

    const st = r[ROW.status];
    bump(status, st);
    bump(phases, r[ROW.phases] || 'NA');
    bump(sponsors, r[ROW.sponsor] || 'UNKNOWN');
    for (const c of countryList(r, countryNames)) bump(countries, c);

    const startYear = Number(String(r[ROW.start]).slice(0, 4));
    if (startYear >= firstYear && startYear <= currentYear) bump(startYears, startYear);

    if (st === 'COMPLETED') {
      completed += 1;
      if (r[ROW.hasResults]) completedWithResults += 1;
      const done = r[ROW.primaryCompletion] || r[ROW.completion];
      if (onOrBefore(done, cutoff)) {
        eligible += 1;
        if (!r[ROW.hasResults]) {
          overdueIds.push(r[ROW.id]);
          bump(overdueByPhase, r[ROW.phases] || 'NA');
        }
      }
    }
    if (STATUS_GROUPS[st] === 'open') recentOpen.push(r);
  }

  const interventional = byType.I;
  const statusList = ordered(status, STATUS_ORDER).map(s => ({
    ...s,
    group: STATUS_GROUPS[s.id] || 'unknown',
  }));
  const groupTotals = statusList.reduce((acc, s) => {
    acc[s.group] = (acc[s.group] || 0) + s.count;
    return acc;
  }, {});

  const years = [];
  for (let y = firstYear; y <= currentYear; y += 1) years.push({ year: y, count: startYears.get(y) || 0 });

  recentOpen.sort((a, b) => String(b[ROW.lastUpdate]).localeCompare(String(a[ROW.lastUpdate])));

  return {
    condition,
    totalCount: totalCount ?? rows.length,
    counted: rows.length,
    complete: totalCount == null || rows.length >= totalCount,
    types: {
      all: rows.length,
      interventional,
      observational: byType.O,
      expandedAccess: byType.E,
    },
    status: statusList,
    statusGroups: {
      open: groupTotals.open || 0,
      active: groupTotals.active || 0,
      completed: groupTotals.completed || 0,
      stopped: groupTotals.stopped || 0,
      unknown: groupTotals.unknown || 0,
    },
    phases: ordered(phases, PHASE_ORDER),
    sponsors: ordered(sponsors, SPONSOR_ORDER),
    countries: [...countries.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country)),
    startYears: years,
    results: {
      lagMonths: RESULTS_LAG_MONTHS,
      cutoff,
      completed,
      completedWithResults,
      eligible,
      overdue: overdueIds.length,
      overdueShare: eligible ? overdueIds.length / eligible : null,
      overdueByPhase: ordered(overdueByPhase, PHASE_ORDER),
      overdueIds,
    },
    recentOpenIds: recentOpen.slice(0, 8).map(r => r[ROW.id]),
  };
}

/** CSV of every counted study, with the categories used on the page, for checking any number. */
export function trialsCsvRows(rows, { today = new Date(), countryNames = null } = {}) {
  const cutoff = monthsBefore(today, RESULTS_LAG_MONTHS);
  const header = [
    'nct_id',
    'url',
    'study_type',
    'overall_status',
    'status_group',
    'phases',
    'has_results',
    'start_date',
    'primary_completion_date',
    'completion_date',
    'last_update_posted',
    'lead_sponsor_class',
    'countries',
    'completed_without_results_after_lag',
  ];
  const typeName = { I: 'INTERVENTIONAL', O: 'OBSERVATIONAL', E: 'EXPANDED_ACCESS' };
  const out = [header];
  for (const r of rows) {
    const done = r[ROW.primaryCompletion] || r[ROW.completion];
    const overdue =
      r[ROW.type] === 'I' &&
      r[ROW.status] === 'COMPLETED' &&
      !r[ROW.hasResults] &&
      onOrBefore(done, cutoff);
    out.push([
      r[ROW.id],
      studyUrl(r[ROW.id]),
      typeName[r[ROW.type]] || '',
      r[ROW.status],
      STATUS_GROUPS[r[ROW.status]] || 'unknown',
      r[ROW.phases] || 'NA',
      r[ROW.hasResults] ? 'yes' : 'no',
      r[ROW.start],
      r[ROW.primaryCompletion],
      r[ROW.completion],
      r[ROW.lastUpdate],
      r[ROW.sponsor],
      countryList(r, countryNames).join('; '),
      overdue ? 'yes' : 'no',
    ]);
  }
  return out;
}
