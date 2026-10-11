'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import CountLink from '../CountLink';
import Icon from '../Icon';
import { useI18n } from '../I18n';
import { cachedGet } from '../../../lib/client/api';
import { download, toCsv } from '../../../lib/client/exports';
import { track } from '../../../lib/client/track';
import { fmtDateTime, fmtRatio, fmtShare } from '../../../lib/format';
import { richText } from '../../../lib/i18n/rich.js';
import { makeT } from '../../../lib/i18n/index.js';

/* Exported files stay in English so they work the same for everyone. */
const tEn = makeT('en');

function useWidth(initial) {
  const ref = useRef(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width);
      if (w > 0) setWidth(Math.max(280, w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

const logScale = (min, max, a, b) => v => {
  const c = Math.min(max, Math.max(min, v));
  return a + ((Math.log10(c) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))) * (b - a);
};

/* -------------------------------------------------------------------------
   Ratio plot: one row per cancer, research share ÷ burden share on a log scale.
   ------------------------------------------------------------------------- */

function RatioPlot({ rows, measure }) {
  const { t, locale } = useI18n();
  const [ref, W] = useWidth(760);
  const narrow = W < 560;
  const labelW = narrow ? Math.min(120, Math.round(W * 0.34)) : 190;
  const valueW = 56;
  const x0 = labelW + 8;
  const x1 = W - valueW - 8;
  const rowH = 28;
  const top = 8;
  const MIN = 0.1;
  const MAX = 10;
  const x = logScale(MIN, MAX, x0, x1);
  const ticks = narrow ? [0.1, 0.5, 1, 2, 10] : [0.1, 0.25, 0.5, 1, 2, 4, 10];
  const key = measure === 'cases' ? 'ratioCases' : 'ratioDeaths';
  const sorted = [...rows].sort((a, b) => (a[key] ?? Infinity) - (b[key] ?? Infinity));
  const plotBottom = top + sorted.length * rowH + 4;
  const H = plotBottom + (narrow ? 26 : 44);
  const measureWord = t(measure === 'cases' ? 'burden.casesWord' : 'burden.deathsWord');

  return (
    <div className="forest burdenPlot" ref={ref} dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="group" aria-label={t('burden.plotTitle', { measure: measureWord })}>
        <rect className="fpZone" x={x(MIN)} y={top} width={x(0.5) - x(MIN)} height={plotBottom - top} />
        {ticks.map(v => (
          <g key={v}>
            <line
              className={v === 1 ? 'fpNull' : 'fpGrid'}
              x1={x(v)}
              x2={x(v)}
              y1={top}
              y2={plotBottom}
              strokeDasharray={v === 1 ? undefined : '3 4'}
            />
            <text className="fpTick" x={x(v)} y={plotBottom + 16} textAnchor="middle">
              {v === 1 && !narrow ? t('burden.same') : `${v}×`}
            </text>
          </g>
        ))}
        {!narrow && (
          <>
            <text className="fpTick" x={x0} y={H - 4} textAnchor="start">
              {t('burden.lessResearch')}
            </text>
            <text className="fpTick" x={x1} y={H - 4} textAnchor="end">
              {t('burden.moreResearch')}
            </text>
          </>
        )}
        {sorted.map((r, i) => {
          const cy = top + i * rowH + rowH / 2;
          const v = r[key];
          const has = v != null && Number.isFinite(v);
          const low = has && v < 0.5;
          const name = narrow ? t(`cancersShort.${r.id}`) : t(`cancers.${r.id}`);
          const aria = `${t(`cancers.${r.id}`)}: ${has ? fmtRatio(v) : '—'}`;
          return (
            <a key={r.id} href={r.recordsUrl} target="_blank" rel="noopener noreferrer" aria-label={aria}>
              <g className="fpRow">
                <rect className="fpRowBg" x={0} y={cy - rowH / 2} width={W} height={rowH} fill="transparent" rx="4" />
                <text
                  className="fpLabel"
                  x={6}
                  y={cy + 4.5}
                  direction={locale === 'ar' ? 'rtl' : 'ltr'}
                  textAnchor={locale === 'ar' ? 'end' : 'start'}
                >
                  {name}
                </text>
                {has && (
                  <>
                    <line x1={x(1)} x2={x(v)} y1={cy} y2={cy} stroke={low ? 'var(--ochre)' : 'var(--rule-strong)'} strokeWidth="2" />
                    <circle cx={x(v)} cy={cy} r="5.5" fill={low ? 'var(--ochre-strong)' : 'var(--ink)'} />
                  </>
                )}
                <text className="fpValue" x={W - 4} y={cy + 4.5} textAnchor="end" fontWeight={low ? 700 : 400}>
                  {has ? fmtRatio(v) : '—'}
                </text>
              </g>
            </a>
          );
        })}
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Scatter: share of research (y) against share of burden (x), both log scales.
   ------------------------------------------------------------------------- */

function Scatter({ rows, measure, years }) {
  const { t, locale } = useI18n();
  const [ref, W] = useWidth(760);
  if (W < 620) return <div ref={ref} />;
  const H = Math.round(Math.min(560, W * 0.62));
  const pad = { l: 64, r: 24, t: 16, b: 52 };
  const MIN = 0.0005;
  const MAX = 0.4;
  const share = measure === 'cases' ? 'caseShare' : 'deathShare';
  const x = logScale(MIN, MAX, pad.l, W - pad.r);
  const y = logScale(MIN, MAX, H - pad.b, pad.t);
  const ticks = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3];
  const measureWord = t(measure === 'cases' ? 'burden.casesWord' : 'burden.deathsWord');

  // Place labels to the right of each dot, nudging down where two would overlap.
  const pts = rows
    .filter(r => r.researchShare != null)
    .map(r => ({ ...r, px: x(r[share]), py: y(r.researchShare) }))
    .sort((a, b) => a.py - b.py);
  const placed = [];
  for (const p of pts) {
    let ly = p.py + 4;
    for (const q of placed) {
      if (Math.abs(q.px - p.px) < 110 && Math.abs(q.ly - ly) < 13) ly = q.ly + 13;
    }
    placed.push({ ...p, ly });
  }

  return (
    <div className="burdenScatter" ref={ref} dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="group" aria-label={t('burden.scatterTitle', { measure: measureWord })}>
        {ticks.map(v => (
          <g key={v}>
            <line className="fpGrid" x1={x(v)} x2={x(v)} y1={pad.t} y2={H - pad.b} strokeDasharray="3 4" />
            <line className="fpGrid" x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} strokeDasharray="3 4" />
            <text className="fpTick" x={x(v)} y={H - pad.b + 16} textAnchor="middle">
              {fmtShare(v, v < 0.01 ? 1 : 0, locale)}
            </text>
            <text className="fpTick" x={pad.l - 6} y={y(v) + 4} textAnchor="end">
              {fmtShare(v, v < 0.01 ? 1 : 0, locale)}
            </text>
          </g>
        ))}
        <line className="fpNull" x1={x(MIN)} y1={y(MIN)} x2={x(MAX)} y2={y(MAX)} />
        <text className="fpTick" x={x(0.0012)} y={y(0.0012) - 8} textAnchor="start" transform={`rotate(${-Math.atan2(y(MIN) - y(MAX), x(MAX) - x(MIN)) * (180 / Math.PI)} ${x(0.0012)} ${y(0.0012) - 8})`}>
          {t('burden.scatterLine')}
        </text>
        {placed.map(p => {
          const low = p[measure === 'cases' ? 'ratioCases' : 'ratioDeaths'] < 0.5;
          return (
            <a key={p.id} href={p.recordsUrl} target="_blank" rel="noopener noreferrer" aria-label={`${t(`cancers.${p.id}`)}: ${fmtShare(p.researchShare, undefined, locale)} / ${fmtShare(p[share], undefined, locale)}`}>
              <circle cx={p.px} cy={p.py} r="5.5" fill={low ? 'var(--ochre-strong)' : 'var(--teal)'} />
              <text className="scatterLabel" x={p.px + 9} y={p.ly} direction={locale === 'ar' ? 'rtl' : 'ltr'} textAnchor={locale === 'ar' ? 'end' : 'start'}>
                {t(`cancersShort.${p.id}`)}
              </text>
            </a>
          );
        })}
        <text className="fpTick" x={(pad.l + W - pad.r) / 2} y={H - 8} textAnchor="middle">
          {t('burden.scatterX', { measure: measureWord })}
        </text>
        <text className="fpTick" transform={`translate(14 ${(pad.t + H - pad.b) / 2}) rotate(-90)`} textAnchor="middle">
          {t('burden.scatterY', { from: String(years.start), to: String(years.end) })}
        </text>
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Page body
   ------------------------------------------------------------------------- */

export default function BurdenView({ cancerCount }) {
  const { t, locale, num, path } = useI18n();
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });
  const [measure, setMeasure] = useState('deaths');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let live = true;
    setState({ status: 'loading', data: null, error: '' });
    cachedGet('/api/burden')
      .then(data => live && setState({ status: 'ok', data, error: '' }))
      .catch(error => live && setState({ status: 'error', data: null, error: error.message }));
    return () => {
      live = false;
    };
  }, [retry]);

  const d = state.data;
  const extremes = useMemo(() => {
    if (!d) return null;
    const ranked = d.rows.filter(r => r.ratioDeaths != null);
    return {
      low: ranked.slice(0, 3).map(r => t(`cancers.${r.id}`)),
      high: ranked.slice(-3).reverse().map(r => t(`cancers.${r.id}`)),
    };
  }, [d, t]);

  if (state.status === 'loading') {
    return (
      <div aria-busy="true" aria-live="polite">
        <p className="loadingLine">
          <span className="spinner" aria-hidden="true" />
          {t('burden.loading', { n: cancerCount })}
        </p>
        <div className="skeleton" style={{ height: 520, marginTop: 16 }} />
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="emptyState" role="alert">
        <p>{state.error}</p>
        <button type="button" className="btn btnPrimary" onClick={() => setRetry(r => r + 1)}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const years = d.years;
  const measureWord = t(measure === 'cases' ? 'burden.casesWord' : 'burden.deathsWord');
  const listJoin = items =>
    new Intl.ListFormat(locale === 'ar' ? 'ar' : 'en', { style: 'long', type: 'conjunction' }).format(items);

  function exportCsv() {
    const header = [
      tEn('burden.colCancer'),
      tEn('burden.colCases'),
      tEn('burden.colDeaths'),
      tEn('burden.colRecords', { from: String(years.start), to: String(years.end) }),
      tEn('burden.colRatioDeaths'),
      tEn('burden.colRatioCases'),
      'PubMed',
    ];
    const rows = d.rows.map(r => [
      tEn(`cancers.${r.id}`),
      r.cases,
      r.deaths,
      r.records,
      r.ratioDeaths?.toFixed(3),
      r.ratioCases?.toFixed(3),
      r.recordsUrl,
    ]);
    download(
      `cancer-insight_research_vs_burden_${d.generatedAt.slice(0, 10)}.csv`,
      toCsv([[`# ${d.burden.citation}`], header, ...rows]),
      'text/csv'
    );
    track('burden_csv', {});
  }

  return (
    <div className="stack">
      <div className="burdenControls">
        <div className="burdenMeasure">
          <span className="modeLabel" id="burden-measure-label">
            {t('burden.measure')}
          </span>
          <div className="modeSwitch" role="group" aria-labelledby="burden-measure-label">
            {['deaths', 'cases'].map(m => (
              <button key={m} type="button" aria-pressed={measure === m} onClick={() => setMeasure(m)}>
                {t(`burden.${m}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="btnRow" style={{ margin: 0 }}>
          <button type="button" className="btn btnSecondary" onClick={exportCsv}>
            <Icon name="download" size={16} />
            {t('burden.download')}
          </button>
          <a className="btn btnSecondary" href="/api/burden" target="_blank" rel="noopener noreferrer">
            JSON
          </a>
        </div>
      </div>

      {extremes && measure === 'deaths' && (
        <p className="burdenSummary">
          {t('burden.lowest', { list: listJoin(extremes.low) })}{' '}
          {t('burden.highest', { list: listJoin(extremes.high) })}
        </p>
      )}

      <section className="panel" aria-labelledby="ratio-h">
        <h2 id="ratio-h">{t('burden.plotTitle', { measure: measureWord })}</h2>
        <p className="panelNote">{t('burden.plotNote', { measure: measureWord })}</p>
        <RatioPlot rows={d.rows} measure={measure} />
      </section>

      <section className="panel scatterPanel" aria-labelledby="scatter-h">
        <h2 id="scatter-h">{t('burden.scatterTitle', { measure: measureWord })}</h2>
        <Scatter rows={d.rows} measure={measure} years={years} />
      </section>

      <section className="panel" aria-labelledby="burden-table-h">
        <h2 id="burden-table-h">{t('burden.tableTitle')}</h2>
        <div className="tableWrap">
          <table className="dataTable stickyFirst">
            <thead>
              <tr>
                <th scope="col">{t('burden.colCancer')}</th>
                <th scope="col" className="numCell">{t('burden.colCases')}</th>
                <th scope="col" className="numCell">{t('burden.colDeaths')}</th>
                <th scope="col" className="numCell">
                  {t('burden.colRecords', { from: String(years.start), to: String(years.end) })}
                </th>
                <th scope="col" className="numCell">{t('burden.colRatioDeaths')}</th>
                <th scope="col" className="numCell">{t('burden.colRatioCases')}</th>
              </tr>
            </thead>
            <tbody>
              {[...d.rows]
                .sort((a, b) => b.deaths - a.deaths)
                .map(r => (
                  <tr key={r.id}>
                    <th scope="row">
                      <Link href={path(`/cancers/${r.id}`)}>{t(`cancers.${r.id}`)}</Link>
                    </th>
                    <td className="numCell">
                      {num(r.cases)}
                      <div className="small muted">{t('burden.ofAll', { share: fmtShare(r.caseShare, undefined, locale) })}</div>
                    </td>
                    <td className="numCell">
                      {num(r.deaths)}
                      <div className="small muted">{t('burden.ofAll', { share: fmtShare(r.deathShare, undefined, locale) })}</div>
                    </td>
                    <td className="numCell">
                      <CountLink count={r.records} url={r.recordsUrl} />
                      <div className="small muted">
                        {t('burden.ofOncology', { share: fmtShare(r.researchShare, undefined, locale) })}
                      </div>
                    </td>
                    <td className="numCell">{fmtRatio(r.ratioDeaths, locale)}</td>
                    <td className="numCell">{fmtRatio(r.ratioCases, locale)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 12 }}>
          {t('burden.generated', {
            date: fmtDateTime(d.generatedAt, locale),
            transcribed: d.burden.transcribed,
          })}
        </p>
        <h3 className="groupHeading">{t('burden.excludedTitle')}</h3>
        <ul className="small cautionList">
          {d.excluded.map(e => (
            <li key={e.id}>
              <strong>{t(`cancers.${e.id}`)}</strong> — {t(`burden.excludedReason.${e.reason}`)}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="burden-method-h">
        <h2 id="burden-method-h">{t('burden.methodTitle')}</h2>
        <ul className="cautionList">
          <li>{t('burden.method1')}</li>
          <li>
            {richText(t('burden.method2', { from: String(years.start), to: String(years.end) }), {
              baseline: <CountLink count={d.baseline.count} url={d.baseline.url} />,
            })}
          </li>
          <li>{t('burden.method3')}</li>
          <li>{t('burden.method4')}</li>
        </ul>
        <p className="small" style={{ marginTop: 12 }}>
          <strong>{t('burden.citation')}:</strong>{' '}
          <span className="ltrData">{d.burden.citation}</span>{' '}
          <a href={d.burden.factSheetUrl} target="_blank" rel="noopener noreferrer">
            PDF
          </a>
        </p>
      </section>
    </div>
  );
}
