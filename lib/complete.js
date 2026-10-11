/*
  Cancer Insight — did every count in a response arrive? (pure; used to decide caching)
*/

/**
 * True when no count in the response failed. Failed counts are reported as `count: null`
 * (with its search `url`), `records: null` (burden rows), `ok: false` or
 * `status: 'unavailable'` (see countRecords, the atlas measures and the burden table).
 */
export function isComplete(value, depth = 0) {
  if (value == null || typeof value !== 'object' || depth > 8) return true;
  if (Array.isArray(value)) return value.every(v => isComplete(v, depth + 1));
  if (value.ok === false || value.status === 'unavailable') return false;
  if ('count' in value && value.count === null && 'url' in value) return false;
  if ('records' in value && value.records === null && 'recordsUrl' in value) return false;
  return Object.values(value).every(v => isComplete(v, depth + 1));
}
