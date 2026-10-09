'use client';

/*
  Saved papers — stored only in this browser (localStorage).
  v2 stores a small metadata snapshot so saved papers can be shown across searches.
  The previous version stored IDs only ('ci-bookmarks'); those IDs are kept and their
  metadata is looked up from PubMed when the Saved view is opened.
*/

import { useCallback, useEffect, useState } from 'react';
import { paperKey } from '../evidence.js';

const KEY = 'ci-saved-v2';
const LEGACY_KEY = 'ci-bookmarks';
const EVENT = 'ci-saved-change';

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked — saving is best-effort */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function readLegacyIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]');
    return Array.isArray(raw) ? raw.map(String).filter(id => /^\d+$/.test(id)) : [];
  } catch {
    return [];
  }
}

export function clearLegacyIds(ids) {
  try {
    const remaining = readLegacyIds().filter(id => !ids.includes(id));
    if (remaining.length) localStorage.setItem(LEGACY_KEY, JSON.stringify(remaining));
    else localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

const SNAPSHOT_FIELDS = [
  'pubmedId',
  'pubmed_title',
  'title',
  'pubmed_journal',
  'pubmed_journal_abbrev',
  'journal',
  'pubmed_date',
  'publicationDate',
  'pubmed_year',
  'pubmed_volume',
  'pubmed_issue',
  'pubmed_pages',
  'pubmed_authors',
  'author_citation',
  'publication_types',
  'doi',
  'doi_url',
  'pmc_id',
  'pmc_url',
  'pubmed_url',
  'treatmentTypes',
  'evidenceSource',
];

export function snapshot(paper) {
  const out = {};
  for (const f of SNAPSHOT_FIELDS) if (paper?.[f] != null && paper[f] !== '') out[f] = paper[f];
  return out;
}

export function useSaved() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isSaved = useCallback(paper => items.some(i => i.key === paperKey(paper)), [items]);

  const toggle = useCallback((paper, context = {}) => {
    const key = paperKey(paper);
    if (!key) return false;
    const list = read();
    const exists = list.some(i => i.key === key);
    const next = exists
      ? list.filter(i => i.key !== key)
      : [
          {
            key,
            savedAt: new Date().toISOString(),
            cancer: context.cancer || '',
            paper: snapshot(paper),
          },
          ...list,
        ];
    write(next);
    return !exists;
  }, []);

  const remove = useCallback(key => write(read().filter(i => i.key !== key)), []);
  const addMany = useCallback(entries => {
    const list = read();
    const keys = new Set(list.map(i => i.key));
    write([...list, ...entries.filter(e => e.key && !keys.has(e.key))]);
  }, []);

  return { items, isSaved, toggle, remove, addMany };
}
