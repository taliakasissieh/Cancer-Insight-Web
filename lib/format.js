/* Cancer Insight — display formatting (isomorphic). */

export function fmtInt(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('en-US');
}

/** 0.0123 -> "1.2%"; small shares keep two decimals so they never round to 0. */
export function fmtShare(share, digits) {
  if (share == null || !Number.isFinite(share)) return '—';
  const v = share * 100;
  const d = digits ?? (v !== 0 && Math.abs(v) < 1 ? 2 : 1);
  return `${v.toFixed(d)}%`;
}

export function fmtRatio(r) {
  if (r == null || !Number.isFinite(r)) return '—';
  return `${r < 10 ? r.toFixed(2) : r.toFixed(1)}×`;
}

export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${fmtDate(iso)}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}`;
}

export function plural(n, one, many = `${one}s`) {
  return `${fmtInt(n)} ${Number(n) === 1 ? one : many}`;
}

export function lowerFirst(s) {
  const t = String(s || '');
  return t.charAt(0).toLowerCase() + t.slice(1);
}

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export const SOURCE_LABELS = {
  feed: 'Recent research feed',
  'pubmed-newest': 'PubMed, newest first',
  'pubmed-best-match': 'PubMed Best Match',
  saved: 'Saved paper',
};
