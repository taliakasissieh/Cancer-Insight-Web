/*
  Cancer Insight — languages.

  English lives at the site root and Arabic under /ar. Dictionaries are plain objects; a value is
  either a string with {placeholders} or a function of the variables (used where Arabic grammar
  depends on a number). Missing Arabic keys fall back to English, and tests/i18n.test.mjs checks
  that both dictionaries define the same keys.
*/

import en from './en.js';
import ar from './ar.js';

export const LOCALES = ['en', 'ar'];
export const DEFAULT_LOCALE = 'en';
const DICTIONARIES = { en, ar };

export function normalizeLocale(value) {
  return value === 'ar' ? 'ar' : 'en';
}

export function dirFor(locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** BCP 47 tag for Intl. Arabic keeps Western digits, as is usual in scientific writing. */
export function intlLocale(locale) {
  return locale === 'ar' ? 'ar-u-nu-latn' : 'en-US';
}

function lookup(dict, key) {
  let node = dict;
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object' || !(part in node)) return undefined;
    node = node[part];
  }
  return node;
}

/* Numbers passed as variables are formatted for the language (pass years as strings). */
function fill(template, vars, locale) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const v = vars[name];
    if (v === undefined || v === null) return match;
    if (typeof v === 'number') return formatNumber(locale, v);
    return String(v);
  });
}

export function translate(locale, key, vars) {
  let value = lookup(DICTIONARIES[normalizeLocale(locale)], key);
  if (value === undefined) value = lookup(en, key);
  if (value === undefined) return key;
  if (typeof value === 'function') return value(vars || {});
  if (typeof value === 'string') return fill(value, vars, normalizeLocale(locale));
  return value;
}

/** Translation function bound to one locale: t('nav.explore'), t('x.y', { n: 3 }). */
export function makeT(locale) {
  return (key, vars) => translate(locale, key, vars);
}

/** Add the /ar prefix to an internal path when needed. */
export function localePath(locale, path = '/') {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (normalizeLocale(locale) !== 'ar') return p;
  if (p === '/') return '/ar';
  if (p.startsWith('/?')) return `/ar${p.slice(1)}`;
  return `/ar${p}`;
}

/** Remove the /ar prefix (for matching the current page in navigation). */
export function stripLocale(pathname = '/') {
  if (pathname === '/ar') return '/';
  if (pathname.startsWith('/ar/')) return pathname.slice(3);
  return pathname;
}

export function localeFromPath(pathname = '/') {
  return pathname === '/ar' || pathname.startsWith('/ar/') ? 'ar' : 'en';
}

export function formatNumber(locale, value, options) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return new Intl.NumberFormat(intlLocale(locale), options).format(Number(value));
}

/** hreflang alternates for a page that exists in both languages. */
export function languageAlternates(path) {
  return {
    en: localePath('en', path),
    ar: localePath('ar', path),
    'x-default': localePath('en', path),
  };
}

export function dictionaryKeys(locale) {
  const out = [];
  const walk = (node, prefix) => {
    for (const [k, v] of Object.entries(node)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object') walk(v, key);
      else out.push(key);
    }
  };
  walk(DICTIONARIES[normalizeLocale(locale)], '');
  return out;
}
