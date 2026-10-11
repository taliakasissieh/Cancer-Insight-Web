/* Cancer Insight — display formatting (isomorphic). Pass 'ar' for Arabic pages; Arabic keeps
   Western digits (ar-u-nu-latn), as is usual in scientific writing. */

const INTL = { en: 'en-US', ar: 'ar-u-nu-latn' };
const DATE_INTL = { en: 'en-GB', ar: 'ar-u-nu-latn' };

export function fmtInt(n, locale = 'en') {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString(INTL[locale] || INTL.en);
}

/** 0.0123 -> "1.2%"; small shares keep two decimals so they never round to 0. */
export function fmtShare(share, digits, locale = 'en') {
  if (share == null || !Number.isFinite(share)) return '—';
  const v = share * 100;
  const d = digits ?? (v !== 0 && Math.abs(v) < 1 ? 2 : 1);
  return locale === 'ar' ? `${v.toFixed(d)}٪` : `${v.toFixed(d)}%`;
}

/* In Arabic text the value is wrapped in left-to-right isolation marks so "0.83×" is not
   shown as "×0.83". */
export function fmtRatio(r, locale = 'en') {
  if (r == null || !Number.isFinite(r)) return '—';
  const text = `${r < 10 ? r.toFixed(2) : r.toFixed(1)}×`;
  return locale === 'ar' ? `\u2066${text}\u2069` : text;
}

export function fmtDate(iso, locale = 'en') {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(DATE_INTL[locale] || DATE_INTL.en, {
    day: 'numeric',
    month: locale === 'ar' ? 'long' : 'short',
    year: 'numeric',
  });
}

/** "2024-10" or "2024-10-11" → "Oct 2024" / "11 Oct 2024" (or Arabic). */
export function fmtPartialDate(value, locale = 'en') {
  const s = String(value || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return fmtDate(`${s}T12:00:00Z`, locale);
  if (/^\d{4}-\d{2}$/.test(s)) {
    return new Date(`${s}-15T12:00:00Z`).toLocaleDateString(DATE_INTL[locale] || DATE_INTL.en, {
      month: locale === 'ar' ? 'long' : 'short',
      year: 'numeric',
    });
  }
  return s;
}

export function fmtDateTime(iso, locale = 'en') {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const time = d.toLocaleTimeString(DATE_INTL[locale] || DATE_INTL.en, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  return `${fmtDate(iso, locale)}${locale === 'ar' ? '، ' : ', '}${time}`;
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
