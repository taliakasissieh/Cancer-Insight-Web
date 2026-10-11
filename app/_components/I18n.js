'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import {
  dirFor,
  formatNumber,
  intlLocale,
  localePath,
  makeT,
  normalizeLocale,
} from '../../lib/i18n/index.js';
import { richText } from '../../lib/i18n/rich.js';

const I18nContext = createContext(null);

function buildValue(locale) {
  const l = normalizeLocale(locale);
  const t = makeT(l);
  return {
    locale: l,
    dir: dirFor(l),
    intl: intlLocale(l),
    t,
    /** Translate a template whose {placeholders} are React nodes (links, emphasis). */
    rich: (key, parts) => richText(t(key), parts),
    path: p => localePath(l, p),
    num: (n, options) => formatNumber(l, n, options),
  };
}

export function I18nProvider({ locale = 'en', children }) {
  const value = useMemo(() => buildValue(locale), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Current language helpers. Falls back to English outside a provider. */
export function useI18n() {
  return useContext(I18nContext) || buildValue('en');
}

/**
 * Keeps <html lang dir> in step with the language of the page after client-side navigation
 * between English and Arabic (the server sends lang="en"; the Arabic layout also sets it inline
 * before first paint).
 */
export function HtmlLang({ locale }) {
  useEffect(() => {
    const l = normalizeLocale(locale);
    document.documentElement.lang = l;
    document.documentElement.dir = dirFor(l);
  }, [locale]);
  return null;
}
