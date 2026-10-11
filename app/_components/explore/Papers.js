'use client';

import { useEffect, useMemo, useState } from 'react';
import PaperItem from '../PaperItem';
import Icon from '../Icon';
import {
  EVIDENCE_FILTERS,
  matchesEvidenceFilter,
  paperAbstract,
  paperAuthors,
  paperJournal,
  paperKey,
  paperTitle,
  paperYear,
  treatmentTags,
} from '../../../lib/evidence';
import { cachedPost } from '../../../lib/client/api';
import { download, fileStem, papersCsv, papersRis } from '../../../lib/client/exports';
import { track } from '../../../lib/client/track';
import { localizeError } from '../../../lib/i18n/labels.js';
import { useI18n } from '../I18n';

const DEFAULTS = {
  q: '',
  evidence: 'all',
  access: 'any',
  treatment: 'all',
  from: '',
  to: '',
  savedOnly: false,
  sort: 'source',
};

const SOURCES = {
  feed: { title: 'papers.sourceFeed', blurb: 'papers.sourceFeedBlurb' },
  bestmatch: { title: 'papers.sourceBest', blurb: 'papers.sourceBestBlurb' },
};

export default function Papers({ data, saved, footprint }) {
  const { t, locale } = useI18n();
  const cancer = data.cancer.input;
  const [source, setSource] = useState('feed');
  const [best, setBest] = useState({ status: 'idle', data: null, error: '' });
  const [f, setF] = useState(DEFAULTS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [busyExport, setBusyExport] = useState(false);

  useEffect(() => {
    setF(DEFAULTS);
  }, [source, cancer]);

  useEffect(() => {
    if (source !== 'bestmatch' || best.status !== 'idle') return;
    setBest({ status: 'loading', data: null, error: '' });
    cachedPost('/api/papers', { cancer, sort: 'relevance', limit: 40 })
      .then(d => setBest({ status: 'ok', data: d, error: '' }))
      .catch(e => setBest({ status: 'error', data: null, error: e.message }));
  }, [source, best.status, cancer]);

  const base = source === 'feed' ? data.papers : best.data?.papers || [];

  const years = useMemo(
    () => [...new Set(base.map(paperYear).filter(Boolean))].sort((a, b) => a - b),
    [base]
  );
  const tagOptions = useMemo(() => {
    const counts = {};
    for (const p of base) for (const tag of treatmentTags(p)) counts[tag] = (counts[tag] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [base]);

  const filtered = useMemo(() => {
    const needle = f.q.trim().toLowerCase();
    let list = base.filter(p => {
      if (needle) {
        const hay = [
          paperTitle(p),
          paperAbstract(p),
          paperJournal(p),
          paperAuthors(p).join(' '),
          (p.mesh_terms || []).join(' '),
          (p.keywords || []).join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (!matchesEvidenceFilter(p, f.evidence)) return false;
      if (f.access === 'free' && !p.pmc_url) return false;
      if (f.access === 'abstract' && !paperAbstract(p)) return false;
      if (f.treatment !== 'all' && !treatmentTags(p).includes(f.treatment)) return false;
      const y = paperYear(p);
      if (f.from && (!y || y < Number(f.from))) return false;
      if (f.to && (!y || y > Number(f.to))) return false;
      if (f.savedOnly && !saved.isSaved(p)) return false;
      return true;
    });
    if (f.sort === 'newest')
      list = [...list].sort((a, b) => (paperYear(b) || 0) - (paperYear(a) || 0));
    if (f.sort === 'oldest')
      list = [...list].sort((a, b) => (paperYear(a) || 9999) - (paperYear(b) || 9999));
    return list;
  }, [base, f, saved]);

  const tagName = tag => {
    const v = t(`treatments.${tag}`);
    return v === `treatments.${tag}` ? tag : v;
  };
  const active = [];
  if (f.q) active.push(['q', t('papers.chipText', { q: f.q })]);
  if (f.evidence !== 'all') active.push(['evidence', t(`evidence.filters.${f.evidence}`)]);
  if (f.access === 'free') active.push(['access', t('papers.chipFree')]);
  if (f.access === 'abstract') active.push(['access', t('papers.chipAbstract')]);
  if (f.treatment !== 'all') active.push(['treatment', t('papers.chipTag', { tag: tagName(f.treatment) })]);
  if (f.from) active.push(['from', t('papers.chipFrom', { y: String(f.from) })]);
  if (f.to) active.push(['to', t('papers.chipTo', { y: String(f.to) })]);
  if (f.savedOnly) active.push(['savedOnly', t('papers.chipSaved')]);
  /* Export files stay in English (they are citations and data). */
  const activeEnglish = [];
  if (f.q) activeEnglish.push(`Text: ${f.q}`);
  if (f.evidence !== 'all')
    activeEnglish.push(EVIDENCE_FILTERS.find(x => x.id === f.evidence)?.label || f.evidence);
  if (f.access === 'free') activeEnglish.push('Free full text');
  if (f.access === 'abstract') activeEnglish.push('Has abstract');
  if (f.treatment !== 'all') activeEnglish.push(`Tag: ${f.treatment}`);
  if (f.from) activeEnglish.push(`From ${f.from}`);
  if (f.to) activeEnglish.push(`To ${f.to}`);
  if (f.savedOnly) activeEnglish.push('Saved only');

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const clear = k => setF(prev => ({ ...prev, [k]: DEFAULTS[k] }));

  /* English: it is written into export files. */
  const sourceLabel =
    source === 'feed'
      ? data.provenance.pubmed.used
        ? 'Recent research feed + newest PubMed records'
        : 'Recent research feed (PubMed metadata)'
      : 'PubMed Best Match';

  const exportMeta = () => ({
    cancer: data.cancer.label,
    query: data.cancer.term,
    source: sourceLabel,
    filters: activeEnglish.join('; ') || 'none',
  });

  async function exportAs(kind) {
    track('papers_export', { cancer_type: cancer, format: kind, paper_count: filtered.length });
    const stem = fileStem(data.cancer.label, 'papers');
    if (kind === 'csv') download(`${stem}.csv`, papersCsv(filtered, exportMeta()), 'text/csv');
    if (kind === 'ris')
      download(`${stem}.ris`, papersRis(filtered), 'application/x-research-info-systems');
    if (kind === 'pdf') {
      setBusyExport(true);
      try {
        const { downloadReport } = await import('../../../lib/client/report');
        await downloadReport({
          cancerLabel: data.cancer.label,
          papers: filtered,
          context: {
            ...exportMeta(),
            retrievedAt: source === 'feed' ? data.provenance.retrievedAt : best.data?.retrievedAt,
            footprint,
          },
        });
      } finally {
        setBusyExport(false);
      }
    }
  }

  return (
    <div className="papersLayout">
      <div>
        <button
          type="button"
          className="btn btnSecondary filterToggle"
          aria-expanded={panelOpen}
          aria-controls="paper-filters"
          onClick={() => setPanelOpen(o => !o)}
        >
          <Icon name="filter" size={16} />
          {panelOpen
            ? t('papers.hideFilters')
            : `${t('papers.showFilters')}${active.length ? ` (${active.length})` : ''}`}
        </button>
        <aside
          id="paper-filters"
          className={`filterPanel ${panelOpen ? 'isOpen' : ''}`}
          aria-label={t('papers.filtersLabel')}
        >
          <div>
            <h2>{t('papers.recordsToShow')}</h2>
            <div className="sourceSwitch" style={{ marginTop: 8 }}>
              {Object.entries(SOURCES).map(([id, s]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={source === id}
                  onClick={() => setSource(id)}
                >
                  <strong>{t(s.title)}</strong>
                  <span>{t(s.blurb)}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            {t('papers.searchWithin')}
            <input
              type="search"
              value={f.q}
              onChange={e => set('q', e.target.value)}
              placeholder={t('papers.searchPlaceholder')}
            />
          </label>

          <label className="field">
            {t('papers.evidenceType')}
            <select
              value={f.evidence}
              onChange={e => {
                set('evidence', e.target.value);
                track('study_type_filter', { study_type: e.target.value });
              }}
            >
              {EVIDENCE_FILTERS.map(o => (
                <option key={o.id} value={o.id}>
                  {t(`evidence.filters.${o.id}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            {t('papers.access')}
            <select value={f.access} onChange={e => set('access', e.target.value)}>
              <option value="any">{t('papers.any')}</option>
              <option value="free">{t('papers.accessFree')}</option>
              <option value="abstract">{t('papers.accessAbstract')}</option>
            </select>
          </label>

          {tagOptions.length > 0 && (
            <label className="field">
              {t('papers.treatmentTag')}
              <select value={f.treatment} onChange={e => set('treatment', e.target.value)}>
                <option value="all">{t('papers.anyTreatment')}</option>
                {tagOptions.map(([tag, n]) => (
                  <option key={tag} value={tag}>
                    {tagName(tag)} ({n})
                  </option>
                ))}
              </select>
            </label>
          )}

          {years.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label className="field">
                {t('papers.from')}
                <select value={f.from} onChange={e => set('from', e.target.value)}>
                  <option value="">{t('papers.any')}</option>
                  {years.map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                {t('papers.to')}
                <select value={f.to} onChange={e => set('to', e.target.value)}>
                  <option value="">{t('papers.any')}</option>
                  {years.map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <label className="field">
            {t('papers.order')}
            <select value={f.sort} onChange={e => set('sort', e.target.value)}>
              <option value="source">
                {source === 'feed' ? t('papers.orderSourceFeed') : t('papers.orderSourceBest')}
              </option>
              <option value="newest">{t('papers.newest')}</option>
              <option value="oldest">{t('papers.oldest')}</option>
            </select>
          </label>

          <label className="checkField">
            <input
              type="checkbox"
              checked={f.savedOnly}
              onChange={e => set('savedOnly', e.target.checked)}
            />
            {t('papers.savedOnly')}
          </label>

          {active.length > 0 && (
            <button type="button" className="btn btnQuiet btnSmall" onClick={() => setF(DEFAULTS)}>
              {t('papers.clearAll')}
            </button>
          )}
        </aside>
      </div>

      <section aria-labelledby="papers-h">
        <div className="listToolbar">
          <div>
            <h2 id="papers-h" style={{ fontSize: '1.3rem', margin: 0 }}>
              {t(SOURCES[source].title)}
            </h2>
            <p className="muted" aria-live="polite">
              {source === 'bestmatch' && best.status === 'loading'
                ? t('papers.loadingBest')
                : t('papers.showing', { n: filtered.length, total: base.length })}
              {source === 'bestmatch' && best.data?.count != null
                ? t('papers.topOf', { n: base.length, total: best.data.count })
                : ''}
            </p>
          </div>
          <div className="btnRow">
            <button
              type="button"
              className="btn btnSecondary btnSmall"
              disabled={!filtered.length}
              onClick={() => exportAs('csv')}
            >
              <Icon name="download" size={16} />
              CSV
            </button>
            <button
              type="button"
              className="btn btnSecondary btnSmall"
              disabled={!filtered.length}
              onClick={() => exportAs('ris')}
              title={t('papers.risTitle')}
            >
              <Icon name="download" size={16} />
              {t('papers.risCitations')}
            </button>
            <button
              type="button"
              className="btn btnSecondary btnSmall"
              disabled={!filtered.length || busyExport}
              onClick={() => exportAs('pdf')}
            >
              <Icon name="doc" size={16} />
              {busyExport ? t('papers.preparingPdf') : t('papers.pdfReport')}
            </button>
          </div>
        </div>
        {locale === 'ar' && <p className="small muted">{t('papers.exportsNote')}</p>}

        {active.length > 0 && (
          <div className="activeFilters" aria-label={t('papers.activeFilters')}>
            {active.map(([k, label]) => (
              <button
                key={k + label}
                type="button"
                className="chip"
                onClick={() => clear(k)}
                aria-label={t('papers.removeFilter', { label })}
              >
                {label}
                <Icon name="close" size={14} />
              </button>
            ))}
          </div>
        )}

        {source === 'feed' && data.provenance.pubmed.used && (
          <p className="notice small" style={{ marginTop: 14 }}>
            {data.provenance.feed.status === 'ok'
              ? t('papers.feedFewAdded')
              : t('papers.feedNotCovered')}
          </p>
        )}

        {source === 'bestmatch' && best.status === 'error' && (
          <div className="emptyState" style={{ marginTop: 16 }} role="alert">
            <h3>{t('papers.bestError')}</h3>
            <p>{localizeError(t, locale, best.error)}</p>
            <button
              type="button"
              className="btn btnPrimary"
              onClick={() => setBest({ status: 'idle', data: null, error: '' })}
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        {source === 'bestmatch' && best.status === 'loading' && (
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton" style={{ height: 120 }} />
            ))}
          </div>
        )}

        {!filtered.length && base.length > 0 && (
          <div className="emptyState" style={{ marginTop: 16 }}>
            <h3>{t('papers.noMatchTitle')}</h3>
            <p>{t('papers.noMatch', { n: base.length })}</p>
            <button type="button" className="btn btnSecondary" onClick={() => setF(DEFAULTS)}>
              {t('papers.clearAll')}
            </button>
          </div>
        )}

        <ol className="paperList" aria-label={t('papers.listLabel')}>
          {filtered.map(p => (
            <li key={paperKey(p)}>
              <PaperItem
                paper={p}
                saved={saved.isSaved(p)}
                onToggleSave={paper => {
                  const now = saved.toggle(paper, { cancer: data.cancer.label });
                  track(now ? 'paper_saved' : 'paper_unsaved', { paper_id: paper.pubmedId || '' });
                }}
              />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
