'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CountLink from '../CountLink';
import Icon from '../Icon';
import { useI18n } from '../I18n';
import { cachedGet } from '../../../lib/client/api';
import { download, toCsv } from '../../../lib/client/exports';
import { track } from '../../../lib/client/track';
import { fmtRatio, fmtShare } from '../../../lib/format';

const GROUP_ORDER = ['design', 'theme', 'population', 'access', 'time'];
const CONCURRENCY = 2;

/* Diverging steps: equal lightness on each arm (checked for contrast with the text on top). */
export const STEPS = [
  { id: 'muchLower', max: 0.33, bg: '#8a4f05', fg: '#ffffff' },
  { id: 'lower', max: 0.5, bg: '#d29a4f', fg: '#12304a' },
  { id: 'slightlyLower', max: 0.8, bg: '#f2dcbb', fg: '#12304a' },
  { id: 'similar', max: 1.25, bg: '#eef2f5', fg: '#12304a' },
  { id: 'slightlyHigher', max: 2, bg: '#cfe3ee', fg: '#12304a' },
  { id: 'higher', max: 3, bg: '#7fb0c8', fg: '#12304a' },
  { id: 'muchHigher', max: Infinity, bg: '#245f7c', fg: '#ffffff' },
];

/** A row is complete when PubMed returned every count it needs. */
export function rowComplete(row) {
  return row?.total != null && Array.isArray(row.cells) && row.cells.every(c => c.status !== 'unavailable');
}

export function stepFor(ratio) {
  if (ratio == null || !Number.isFinite(ratio)) return null;
  return STEPS.find(s => ratio < s.max) || STEPS.at(-1);
}

function measureLabel(t, col, which = 'label') {
  if (col.id === 'recent-share') {
    const m = String(col.label).match(/(\d{4})\D+(\d{4})/);
    return which === 'label' && m
      ? t('measures.label.recent-share', { from: m[1], to: m[2] })
      : t('measures.short.recent-share');
  }
  return t(`measures.${which}.${col.id}`);
}

export default function CancerMap() {
  const { t, locale, path } = useI18n();
  const [index, setIndex] = useState(null);
  const [rows, setRows] = useState({});
  const [errors, setErrors] = useState({});
  const [sort, setSort] = useState('name');
  const [indexError, setIndexError] = useState('');
  const started = useRef(false);

  /* attempt > 1 asks again for rows that failed or came back with counts PubMed could not
     return under load; the different address skips every cache that holds the earlier answer. */
  const load = useCallback((ids, { attempt = 1, concurrency = CONCURRENCY } = {}) => {
    let cursor = 0;
    const incomplete = [];
    const worker = async () => {
      while (cursor < ids.length) {
        const id = ids[cursor++];
        const url = `/api/map?cancer=${encodeURIComponent(id)}${attempt > 1 ? `&attempt=${attempt}` : ''}`;
        try {
          const row = await cachedGet(url);
          if (!rowComplete(row)) incomplete.push(id);
          setRows(r => ({ ...r, [id]: row }));
          setErrors(e => {
            const next = { ...e };
            delete next[id];
            return next;
          });
        } catch (error) {
          incomplete.push(id);
          setErrors(e => ({ ...e, [id]: error.message }));
        }
      }
    };
    return Promise.all(Array.from({ length: concurrency }, worker)).then(() => incomplete);
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    cachedGet('/api/map')
      .then(idx => {
        setIndex(idx);
        track('cancer_map_view', {});
        /* Fill the table from the top, in the order it is shown (by name, in this language). */
        const byName = idx.cancers
          .map(c => c.id)
          .sort((x, y) => t(`cancers.${x}`).localeCompare(t(`cancers.${y}`), locale));
        return load(byName);
      })
      /* One automatic second pass, one row at a time, for anything that did not complete. */
      .then(incomplete => (incomplete?.length ? load(incomplete, { attempt: 2, concurrency: 1 }) : null))
      .catch(error => setIndexError(error.message));
  }, [load, t, locale]);

  const columns = useMemo(() => {
    if (!index) return [];
    return GROUP_ORDER.flatMap(g => index.columns.filter(c => c.group === g));
  }, [index]);

  const groups = useMemo(
    () =>
      GROUP_ORDER.map(g => ({ id: g, span: columns.filter(c => c.group === g).length })).filter(
        g => g.span
      ),
    [columns]
  );

  const order = useMemo(() => {
    if (!index) return [];
    const list = index.cancers.map(c => c.id);
    const name = id => t(`cancers.${id}`);
    if (sort === 'name') return list.sort((a, b) => name(a).localeCompare(name(b), locale));
    if (sort === 'records') return list.sort((a, b) => (rows[b]?.total ?? -1) - (rows[a]?.total ?? -1));
    const ratio = id => rows[id]?.cells.find(c => c.id === sort)?.ratio ?? Infinity;
    return list.sort((a, b) => ratio(a) - ratio(b));
  }, [index, rows, sort, t, locale]);

  const done = Object.keys(rows).length;
  const total = index?.cancers.length || 0;
  /* Rows that have either arrived or failed; the build is over when every row has settled. */
  const settled = index ? index.cancers.filter(c => rows[c.id] || errors[c.id]).length : 0;
  const missing = index
    ? index.cancers.map(c => c.id).filter(id => errors[id] || (rows[id] && !rowComplete(rows[id])))
    : [];
  const [retrying, setRetrying] = useState(false);
  const retryMissing = () => {
    setRetrying(true);
    load(missing, { attempt: Date.now(), concurrency: 1 }).finally(() => setRetrying(false));
  };

  const lowest = useMemo(() => {
    const out = [];
    for (const [id, row] of Object.entries(rows)) {
      for (const c of row.cells) {
        if (c.status === 'lower' || c.status === 'much-lower') out.push({ cancer: id, ...c });
      }
    }
    return out.sort((a, b) => a.ratio - b.ratio).slice(0, 8);
  }, [rows]);

  if (indexError) {
    return (
      <div className="emptyState" role="alert">
        <p>{indexError}</p>
      </div>
    );
  }
  if (!index) {
    return <div className="skeleton" style={{ height: 480 }} />;
  }

  function exportCsv() {
    const header = [
      'cancer',
      'pubmed_records',
      ...columns.map(c => `${c.id}_ratio`),
      ...columns.map(c => `${c.id}_status`),
    ];
    const body = order
      .filter(id => rows[id])
      .map(id => {
        const r = rows[id];
        const cell = cid => r.cells.find(c => c.id === cid);
        return [
          index.cancers.find(c => c.id === id)?.label || id,
          r.total,
          ...columns.map(c => cell(c.id)?.ratio?.toFixed(3) ?? ''),
          ...columns.map(c => cell(c.id)?.status ?? ''),
        ];
      });
    download(
      `cancer-insight_all_cancer_map_${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv([[`# Research Gap Atlas method ${index.methodVersion}; ratio = cancer share / oncology share`], header, ...body]),
      'text/csv'
    );
    track('cancer_map_csv', { rows: body.length });
  }

  return (
    <div className="stack">
      <div className="mapControls">
        <label className="field mapSort">
          <span>{t('map.sortBy')}</span>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="name">{t('map.sortName')}</option>
            <option value="records">{t('map.sortRecords')}</option>
            {columns.map(c => (
              <option key={c.id} value={c.id}>
                {measureLabel(t, c, 'label')}
              </option>
            ))}
          </select>
        </label>
        <div className="btnRow" style={{ margin: 0 }}>
          <button type="button" className="btn btnSecondary" onClick={exportCsv} disabled={!done}>
            <Icon name="download" size={16} />
            {t('map.download')}
          </button>
        </div>
      </div>

      {settled < total && (
        <div aria-live="polite">
          <p className="loadingLine" style={{ margin: 0 }}>
            <span className="spinner" aria-hidden="true" />
            {t('map.progress', { done, total })}
          </p>
          <div className="progressBar" aria-hidden="true">
            <span style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
          </div>
          <p className="small muted" style={{ margin: '6px 0 0' }}>
            {t('map.progressNote')}
          </p>
        </div>
      )}
      {settled >= total && missing.length > 0 && (
        <div className="notice small" aria-live="polite">
          <p style={{ margin: 0 }}>{t('map.incomplete', { n: missing.length })}</p>
          <button
            type="button"
            className="btn btnSecondary btnSmall"
            style={{ marginTop: 8 }}
            onClick={retryMissing}
            disabled={retrying}
          >
            {retrying ? t('common.loading') : t('map.retry')}
          </button>
        </div>
      )}

      <MapLegend />

      <div className="tableWrap mapWrap">
        <table className="mapTable">
          <thead>
            <tr>
              <th scope="col" rowSpan={2} className="mapCancerCol">
                {t('map.colCancer')}
              </th>
              <th scope="col" rowSpan={2} className="mapRecordsCol">
                {t('map.colRecords')}
              </th>
              {groups.map(g => (
                <th key={g.id} scope="colgroup" colSpan={g.span} className="mapGroup">
                  {t(`measures.groups.${g.id}`)}
                </th>
              ))}
            </tr>
            <tr>
              {columns.map(c => (
                <th key={c.id} scope="col" className="mapMeasure" title={measureLabel(t, c, 'label')}>
                  <button
                    type="button"
                    className={`mapSortBtn ${sort === c.id ? 'isActive' : ''}`}
                    onClick={() => setSort(c.id)}
                    aria-pressed={sort === c.id}
                  >
                    {measureLabel(t, c, 'short')}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.map(id => {
              const row = rows[id];
              const name = t(`cancers.${id}`);
              return (
                <tr key={id}>
                  <th scope="row" className="mapCancerCol">
                    <Link href={path(`/cancers/${id}`)}>{name}</Link>
                  </th>
                  <td className="mapRecordsCol num">
                    {row ? (
                      <CountLink count={row.total} url={row.totalUrl} />
                    ) : errors[id] ? (
                      <span className="muted small">{t('map.rowError')}</span>
                    ) : (
                      <span className="mapPending" aria-hidden="true" />
                    )}
                  </td>
                  {columns.map(c => {
                    const cell = row?.cells.find(x => x.id === c.id);
                    if (!cell) return <td key={c.id} className="mapCell isPending" />;
                    return <MapCell key={c.id} cell={cell} cancer={name} measure={measureLabel(t, c, 'label')} />;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {lowest.length > 0 && (
        <section className="panel" aria-labelledby="map-lowest-h">
          <h2 id="map-lowest-h">{t('map.lowestTitle')}</h2>
          <p className="panelNote">{t('map.lowestNote')}</p>
          <ol className="lowestList">
            {lowest.map(l => {
              const col = columns.find(c => c.id === l.id);
              return (
                <li key={`${l.cancer}-${l.id}`}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    {t('map.lowestItem', {
                      measure: col ? measureLabel(t, col, 'label') : l.id,
                      cancer: t(`cancers.${l.cancer}`),
                    })}
                  </a>{' '}
                  <span className="num">{fmtRatio(l.ratio, locale)}</span>{' '}
                  <span className="muted small">
                    ({fmtShare(l.share, undefined, locale)} / {fmtShare(l.baselineShare, undefined, locale)})
                  </span>{' '}
                  <Link className="small" href={path(`/research-gap-atlas?cancer=${encodeURIComponent(l.cancer)}`)}>
                    {t('map.openAtlas')}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="panel" aria-labelledby="map-how-h">
        <h2 id="map-how-h">{t('map.howTitle')}</h2>
        <ul className="cautionList">
          <li>{t('map.how1')}</li>
          <li>{t('map.how2')}</li>
          <li>{t('map.how3')}</li>
          <li>{t('map.how4')}</li>
        </ul>
      </section>
    </div>
  );
}

function MapCell({ cell, cancer, measure }) {
  const { t, locale, num } = useI18n();
  const context = cell.status === 'context';
  const unavailable = cell.status === 'unavailable';
  const insufficient = cell.status === 'insufficient';
  const step = context || insufficient || unavailable ? null : stepFor(cell.ratio);
  const value = unavailable
    ? '?'
    : cell.ratio != null
      ? cell.ratio < 10
        ? cell.ratio.toFixed(2)
        : cell.ratio.toFixed(1)
      : '—';
  const note = context
    ? t('map.cellContext')
    : insufficient
      ? t('map.cellInsufficient')
      : unavailable
        ? t('map.cellUnavailable')
        : '';
  const label = unavailable
    ? `${cancer}, ${measure}: ${note}`
    : `${t('map.cell', {
        cancer,
        measure,
        ratio: fmtRatio(cell.ratio, locale),
        count: num(cell.count),
      })}${note ? ` (${note})` : ''}`;
  return (
    <td
      className={`mapCell ${context ? 'isContext' : ''} ${insufficient ? 'isInsufficient' : ''} ${unavailable ? 'isUnavailable' : ''}`}
      style={step ? { background: step.bg, color: step.fg } : undefined}
    >
      <a href={cell.url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} style={step ? { color: step.fg } : undefined}>
        {value}
      </a>
    </td>
  );
}

function MapLegend() {
  const { t } = useI18n();
  return (
    <div className="mapLegend" aria-label={t('map.legendTitle')}>
      <span className="mapLegendTitle">{t('map.legendTitle')}</span>
      <ul>
        {STEPS.map(s => (
          <li key={s.id}>
            <i style={{ background: s.bg }} aria-hidden="true" />
            <span>{t(`map.legend.${s.id}`)}</span>
          </li>
        ))}
        <li>
          <i className="keyContext" aria-hidden="true" />
          {t('map.legend.context')}
        </li>
        <li>
          <i className="keyInsufficient" aria-hidden="true" />
          {t('map.legend.insufficient')}
        </li>
        <li>
          <i className="keyUnavailable" aria-hidden="true">
            ?
          </i>
          {t('map.legend.unavailable')}
        </li>
      </ul>
    </div>
  );
}
