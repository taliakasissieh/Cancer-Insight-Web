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
import { fmtInt } from '../../../lib/format';
import { resolveTreatment } from '../../../lib/queries';

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
  feed: {
    title: 'Recent research',
    blurb: 'Newest relevant records, with treatment tags',
  },
  bestmatch: {
    title: 'PubMed Best Match',
    blurb: 'Most relevant records across all years',
  },
};

export default function Papers({ data, saved, footprint }) {
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
    for (const p of base) for (const t of treatmentTags(p)) counts[t] = (counts[t] || 0) + 1;
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

  const active = [];
  if (f.q) active.push(['q', `Text: ${f.q}`]);
  if (f.evidence !== 'all')
    active.push(['evidence', EVIDENCE_FILTERS.find(x => x.id === f.evidence)?.label]);
  if (f.access === 'free') active.push(['access', 'Free full text']);
  if (f.access === 'abstract') active.push(['access', 'Has abstract']);
  if (f.treatment !== 'all') active.push(['treatment', `Tag: ${f.treatment}`]);
  if (f.from) active.push(['from', `From ${f.from}`]);
  if (f.to) active.push(['to', `To ${f.to}`]);
  if (f.savedOnly) active.push(['savedOnly', 'Saved only']);

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const clear = k => setF(prev => ({ ...prev, [k]: DEFAULTS[k] }));

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
    filters: active.map(a => a[1]).join('; ') || 'none',
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
          {panelOpen ? 'Hide filters' : `Filters${active.length ? ` (${active.length})` : ''}`}
        </button>
        <aside
          id="paper-filters"
          className={`filterPanel ${panelOpen ? 'isOpen' : ''}`}
          aria-label="Paper filters"
        >
          <div>
            <h2>Records to show</h2>
            <div className="sourceSwitch" style={{ marginTop: 8 }}>
              {Object.entries(SOURCES).map(([id, s]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={source === id}
                  onClick={() => setSource(id)}
                >
                  <strong>{s.title}</strong>
                  <span>{s.blurb}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            Search within these records
            <input
              type="search"
              value={f.q}
              onChange={e => set('q', e.target.value)}
              placeholder="Title, abstract, author, MeSH…"
            />
          </label>

          <label className="field">
            Evidence type
            <select
              value={f.evidence}
              onChange={e => {
                set('evidence', e.target.value);
                track('study_type_filter', { study_type: e.target.value });
              }}
            >
              {EVIDENCE_FILTERS.map(o => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Access
            <select value={f.access} onChange={e => set('access', e.target.value)}>
              <option value="any">Any</option>
              <option value="free">Free full text (PMC)</option>
              <option value="abstract">Has an abstract</option>
            </select>
          </label>

          {tagOptions.length > 0 && (
            <label className="field">
              Treatment tag
              <select value={f.treatment} onChange={e => set('treatment', e.target.value)}>
                <option value="all">Any treatment</option>
                {tagOptions.map(([t, n]) => (
                  <option key={t} value={t}>
                    {resolveTreatment(t)?.label || t} ({n})
                  </option>
                ))}
              </select>
            </label>
          )}

          {years.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label className="field">
                From
                <select value={f.from} onChange={e => set('from', e.target.value)}>
                  <option value="">Any</option>
                  {years.map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                To
                <select value={f.to} onChange={e => set('to', e.target.value)}>
                  <option value="">Any</option>
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
            Order
            <select value={f.sort} onChange={e => set('sort', e.target.value)}>
              <option value="source">
                {source === 'feed' ? 'Most relevant, then newest' : 'PubMed Best Match'}
              </option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>

          <label className="checkField">
            <input
              type="checkbox"
              checked={f.savedOnly}
              onChange={e => set('savedOnly', e.target.checked)}
            />
            Saved papers only
          </label>

          {active.length > 0 && (
            <button type="button" className="btn btnQuiet btnSmall" onClick={() => setF(DEFAULTS)}>
              Clear all filters
            </button>
          )}
        </aside>
      </div>

      <section aria-labelledby="papers-h">
        <div className="listToolbar">
          <div>
            <h2 id="papers-h" style={{ fontSize: '1.3rem', margin: 0 }}>
              {SOURCES[source].title}
            </h2>
            <p className="muted" aria-live="polite">
              {source === 'bestmatch' && best.status === 'loading'
                ? 'Loading PubMed Best Match…'
                : `Showing ${fmtInt(filtered.length)} of ${fmtInt(base.length)} records`}
              {source === 'bestmatch' && best.data?.count != null
                ? ` (top ${base.length} of ${fmtInt(best.data.count)} PubMed records)`
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
              title="For Zotero, EndNote or Mendeley"
            >
              <Icon name="download" size={16} />
              RIS citations
            </button>
            <button
              type="button"
              className="btn btnSecondary btnSmall"
              disabled={!filtered.length || busyExport}
              onClick={() => exportAs('pdf')}
            >
              <Icon name="doc" size={16} />
              {busyExport ? 'Preparing PDF…' : 'PDF report'}
            </button>
          </div>
        </div>

        {active.length > 0 && (
          <div className="activeFilters" aria-label="Active filters">
            {active.map(([k, label]) => (
              <button
                key={k + label}
                type="button"
                className="chip"
                onClick={() => clear(k)}
                aria-label={`Remove filter ${label}`}
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
              ? 'The research feed had few relevant records for this cancer, so the newest PubMed records were added. PubMed records have no treatment tags.'
              : 'The research feed does not cover this cancer, so these are the newest PubMed records. PubMed records have no treatment tags.'}
          </p>
        )}

        {source === 'bestmatch' && best.status === 'error' && (
          <div className="emptyState" style={{ marginTop: 16 }} role="alert">
            <h3>PubMed Best Match did not load</h3>
            <p>{best.error}</p>
            <button
              type="button"
              className="btn btnPrimary"
              onClick={() => setBest({ status: 'idle', data: null, error: '' })}
            >
              Try again
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
            <h3>No records match these filters</h3>
            <p>Remove a filter to see more of the {base.length} records.</p>
            <button type="button" className="btn btnSecondary" onClick={() => setF(DEFAULTS)}>
              Clear all filters
            </button>
          </div>
        )}

        <ol className="paperList" aria-label="Research records">
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
