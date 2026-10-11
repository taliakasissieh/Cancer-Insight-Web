'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import Icon from './Icon';
import { useI18n } from './I18n';
import { CANCERS, EXAMPLE_CANCERS, resolveCancer } from '../../lib/queries';
import { hasArabic, resolveArabicCancer } from '../../lib/i18n/arabic-search.js';

const SUGGESTIONS = [...new Set(Object.values(CANCERS).map(c => c.label))].sort();

/** Arabic names resolve to catalogue ids; everything else goes through resolveCancer. */
function resolveInput(raw) {
  if (hasArabic(raw)) {
    const id = resolveArabicCancer(raw);
    return id ? resolveCancer(id) : null;
  }
  return resolveCancer(raw);
}

/**
 * Cancer search box. Without `onSearch` it navigates to /explore (or `target`).
 */
export default function CancerSearch({
  initialValue = '',
  onSearch,
  target = '/explore',
  compact = false,
  showExamples = true,
  buttonLabel,
  autoFocus = false,
  label,
  hideLabel = true,
}) {
  const { t, locale, path } = useI18n();
  const router = useRouter();
  const id = useId();
  /* On the Arabic site, show catalogue cancers by their Arabic name. */
  function displayValue(v) {
    if (locale !== 'ar' || !v || hasArabic(v)) return v;
    const r = resolveCancer(v);
    return r?.known ? t(`cancers.${r.id}`) : v;
  }
  const [value, setValue] = useState(() => displayValue(initialValue));
  const [error, setError] = useState('');

  useEffect(() => setValue(displayValue(initialValue)), [initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions =
    locale === 'ar' ? Object.keys(CANCERS).map(id => t(`cancers.${id}`)) : SUGGESTIONS;

  function go(raw) {
    const resolved = resolveInput(raw);
    if (!resolved) {
      setError(t('search.error'));
      return;
    }
    setError('');
    const q = resolved.known && hasArabic(raw) ? resolved.id : resolved.input;
    if (onSearch) onSearch(q);
    else router.push(`${path(target)}?cancer=${encodeURIComponent(q)}`);
  }

  return (
    <div className={compact ? 'searchCompact' : ''}>
      <form
        className="searchForm"
        role="search"
        onSubmit={e => {
          e.preventDefault();
          go(value);
        }}
      >
        <div className="searchInputWrap">
          <label htmlFor={`${id}-input`} className={hideLabel ? 'visuallyHidden' : 'field'}>
            {label || t('search.label')}
          </label>
          <Icon name="search" size={20} />
          <input
            id={`${id}-input`}
            className="searchInput"
            type="search"
            list={`${id}-list`}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={t('search.placeholder')}
            autoComplete="off"
            spellCheck="false"
            autoFocus={autoFocus}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            maxLength={60}
          />
          <datalist id={`${id}-list`}>
            {suggestions.map(s => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <button className="btn btnPrimary" type="submit">
          {buttonLabel || t('search.explore')}
        </button>
      </form>
      {error && (
        <p id={`${id}-error`} className="formError" role="alert">
          {error}
        </p>
      )}
      {showExamples && (
        <div className="exampleRow">
          <span>{t('search.try')}</span>
          {EXAMPLE_CANCERS.map(c => (
            <button key={c} type="button" className="chip" onClick={() => go(c)}>
              {t(`cancers.${resolveCancer(c).id}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
