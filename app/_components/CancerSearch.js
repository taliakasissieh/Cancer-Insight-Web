'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import Icon from './Icon';
import { CANCERS, EXAMPLE_CANCERS, resolveCancer } from '../../lib/queries';

const SUGGESTIONS = [...new Set(Object.values(CANCERS).map(c => c.label))].sort();

/**
 * Cancer search box. Without `onSearch` it navigates to /explore (or `target`).
 */
export default function CancerSearch({
  initialValue = '',
  onSearch,
  target = '/explore',
  compact = false,
  showExamples = true,
  buttonLabel = 'Explore research',
  autoFocus = false,
  label = 'Cancer type',
  hideLabel = true,
}) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  useEffect(() => setValue(initialValue), [initialValue]);

  function go(raw) {
    const resolved = resolveCancer(raw);
    if (!resolved) {
      setError('Enter a specific cancer type, for example pancreatic, breast or leukemia.');
      return;
    }
    setError('');
    if (onSearch) onSearch(resolved.input);
    else router.push(`${target}?cancer=${encodeURIComponent(resolved.input)}`);
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
            {label}
          </label>
          <Icon name="search" size={20} />
          <input
            id={`${id}-input`}
            className="searchInput"
            type="search"
            list={`${id}-list`}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Search a cancer type, e.g. pancreatic"
            autoComplete="off"
            spellCheck="false"
            autoFocus={autoFocus}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            maxLength={60}
          />
          <datalist id={`${id}-list`}>
            {SUGGESTIONS.map(s => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <button className="btn btnPrimary" type="submit">
          {buttonLabel}
        </button>
      </form>
      {error && (
        <p id={`${id}-error`} className="formError" role="alert">
          {error}
        </p>
      )}
      {showExamples && (
        <div className="exampleRow">
          <span>Try</span>
          {EXAMPLE_CANCERS.map(c => (
            <button key={c} type="button" className="chip" onClick={() => go(c)}>
              {resolveCancer(c).label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
