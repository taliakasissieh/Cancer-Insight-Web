'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CancerSearch from '../CancerSearch';
import CountLink from '../CountLink';
import ForestPlot from '../ForestPlot';
import QueryBox from '../QueryBox';
import Icon from '../Icon';
import { useI18n } from '../I18n';
import { postJson } from '../../../lib/client/api';
import { download, fileStem, toCsv } from '../../../lib/client/exports';
import { track } from '../../../lib/client/track';
import { fmtDateTime, fmtRatio, fmtShare, lowerFirst } from '../../../lib/format';
import { cancerName, evidenceLabel, localizeError } from '../../../lib/i18n/labels.js';
import { classifyEvidence } from '../../../lib/evidence';
import { richText } from '../../../lib/i18n/rich.js';

const GROUP_IDS = ['design', 'theme', 'population', 'access', 'time'];

function useAtlasText() {
  const { t, locale } = useI18n();
  /* Cancer name inside a sentence (English lower-cases it; Arabic does not). */
  const inSentence = cancer => {
    const name = cancerName(t, cancer);
    return locale === 'ar' ? name : lowerFirst(name);
  };
  const measureLabel = m => {
    if (m.id === 'recent-share') {
      const years = String(m.label).match(/(\d{4})\D+(\d{4})/);
      return years ? t('measures.label.recent-share', { from: years[1], to: years[2] }) : m.label;
    }
    const key = `measures.label.${m.id}`;
    return t(key) === key ? m.label : t(key);
  };
  const measureShort = m => {
    const key = `measures.short.${m.id}`;
    return t(key) === key ? m.short : t(key);
  };
  return { t, locale, inSentence, measureLabel, measureShort };
}

function StatusPill({ status }) {
  const { t } = useI18n();
  const key = `atlas.status.${status}`;
  return <span className={`statusPill status-${status}`}>{t(key) === key ? status : t(key)}</span>;
}

function periodLabel(w, t) {
  return w.id === 'historical' ? t('atlas.before', { year: String(w.end + 1) }) : `${w.start}–${w.end}`;
}

function Signal({ s, measure, cancer }) {
  const { t, locale, inSentence, measureLabel, measureShort } = useAtlasText();
  const b = s.basis;
  const group = measure?.group || 'theme';
  const label = measure ? measureLabel(measure) : s.title;
  const inText = locale === 'ar' ? label : group === 'design' ? label : lowerFirst(label);
  return (
    <li className="signal" data-level={s.level}>
      <div className="signalTop">
        <span className="signalLevel">{t(`atlas.level.${s.level}`)}</span>
        <span className="muted">{t(`measures.groups.${group}`)}</span>
      </div>
      <h3>{t(`atlas.signalTitle.${group}`, { measure: inText })}</h3>
      <p>
        {t('atlas.signalSummary', {
          share: fmtShare(b.share, undefined, locale),
          cancer: inSentence(cancer),
          count: b.count,
          total: b.total,
          short: measure ? measureShort(measure) : '',
          baselineShare: fmtShare(b.baselineShare, undefined, locale),
          ratio: fmtRatio(b.ratio, locale),
        })}
      </p>
      <details>
        <summary>{t('atlas.whyShown')}</summary>
        <div className="signalBasis">
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th scope="col">{t('atlas.literature')}</th>
                  <th scope="col" className="numCell">
                    {t('atlas.matching')}
                  </th>
                  <th scope="col" className="numCell">
                    {t('atlas.allRecords')}
                  </th>
                  <th scope="col" className="numCell">
                    {t('atlas.share')}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">{cancerName(t, cancer)}</th>
                  <td className="numCell">
                    <CountLink count={b.count} url={s.url} />
                  </td>
                  <td className="numCell">
                    <CountLink count={b.total} />
                  </td>
                  <td className="numCell">{fmtShare(b.share, undefined, locale)}</td>
                </tr>
                <tr>
                  <th scope="row">{t('atlas.allOncology')}</th>
                  <td className="numCell">
                    <CountLink count={b.baselineCount} url={s.baselineUrl} />
                  </td>
                  <td className="numCell">
                    <CountLink count={b.baselineTotal} />
                  </td>
                  <td className="numCell">{fmtShare(b.baselineShare, undefined, locale)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="small" style={{ margin: 0 }}>
            {t('atlas.ratioLine', {
              share: fmtShare(b.share, undefined, locale),
              baselineShare: fmtShare(b.baselineShare, undefined, locale),
              ratio: fmtRatio(b.ratio, locale),
              threshold: fmtRatio(b.threshold, locale),
            })}
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            {t(`atlas.caution.${group}`)}
          </p>
        </div>
      </details>
    </li>
  );
}

export default function GapAtlasClient() {
  const { t, locale, inSentence, measureLabel } = useAtlasText();
  const { path } = useI18n();
  const [cancer, setCancer] = useState('');
  const [state, setState] = useState({ status: 'idle', data: null, error: '' });
  const token = useRef(0);
  const resultsRef = useRef(null);
  const base = path('/research-gap-atlas');

  const run = useCallback(
    async (input, { push = true } = {}) => {
      const my = ++token.current;
      setCancer(input);
      setState({ status: 'loading', data: null, error: '' });
      if (push) {
        const url = `${base}?cancer=${encodeURIComponent(input)}`;
        if (url !== window.location.pathname + window.location.search) {
          window.history.pushState(null, '', url);
        }
      }
      track('gap_atlas_search', { cancer_type: input });
      try {
        const data = await postJson('/api/gaps', { cancer: input });
        if (token.current !== my) return;
        setState({ status: 'ok', data, error: '' });
        document.title = `${t('atlas.docTitle', { cancer: cancerName(t, data.cancer) })} | Cancer Insight`;
        track('gap_atlas_success', { cancer_type: input, signal_count: data.signals.length });
        requestAnimationFrame(() => {
          const el = resultsRef.current;
          if (!el) return;
          el.focus({ preventScroll: true });
          const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        });
      } catch (error) {
        if (token.current !== my) return;
        setState({ status: 'error', data: null, error: localizeError(t, locale, error.message) });
        track('gap_atlas_error', { cancer_type: input });
      }
    },
    [base, t, locale]
  );

  useEffect(() => {
    const read = () => {
      const c = new URLSearchParams(window.location.search).get('cancer');
      if (c) run(c.slice(0, 60), { push: false });
      else {
        token.current++;
        setCancer('');
        setState({ status: 'idle', data: null, error: '' });
      }
    };
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [run]);

  const d = state.data;
  const groups = GROUP_IDS.map(id => ({ id, label: t(`measures.groups.${id}`) }));
  const measureById = d ? Object.fromEntries(d.measures.map(m => [m.id, m])) : {};

  /* Exports stay in English: they are data files meant to be cited and shared. */
  function exportCsv() {
    const rows = [
      ['# Cancer Insight Research Gap Atlas', `Method ${d.methodVersion}`],
      ['# generated', d.generatedAt],
      ['# cancer', d.cancer.label],
      ['# cancer_query', d.cancer.term],
      ['# oncology_baseline_query', d.baseline.term],
      [
        '# note',
        'A lower share is a prompt for investigation, not proof of a research gap. Not medical advice.',
      ],
      [
        'group',
        'measure',
        'status',
        'cancer_records_matching',
        'cancer_records_total',
        'cancer_share',
        'oncology_records_matching',
        'oncology_records_total',
        'oncology_share',
        'ratio',
        'measure_query',
        'pubmed_url',
        'oncology_pubmed_url',
        'baseline_source',
      ],
      ...d.measures.map(m => [
        m.group,
        m.label,
        m.status,
        m.count,
        m.total,
        m.share,
        m.baselineCount,
        m.baselineTotal,
        m.baselineShare,
        m.ratio,
        m.definition,
        m.url,
        m.baselineUrl,
        m.baselineSource,
      ]),
    ];
    download(`${fileStem(d.cancer.label, 'gap-atlas')}.csv`, toCsv(rows), 'text/csv');
    track('gap_atlas_export', { cancer_type: cancer, format: 'csv' });
  }

  function exportJson() {
    download(
      `${fileStem(d.cancer.label, 'gap-atlas')}.json`,
      JSON.stringify(d, null, 2),
      'application/json'
    );
    track('gap_atlas_export', { cancer_type: cancer, format: 'json' });
  }

  return (
    <>
      <section className="pageHead" aria-labelledby="atlas-title">
        <div className="pageHeadInner">
          <div className="atlasHeadGrid">
            <div>
              <h1 id="atlas-title">{t('atlas.title')}</h1>
              <p className="lede">{t('atlas.lede')}</p>
              <CancerSearch
                onSearch={c => run(c)}
                initialValue={cancer}
                buttonLabel={t('search.buildAtlas')}
              />
            </div>
            <aside className="atlasPromise" aria-label={t('atlas.howLabel')}>
              <p>
                <strong>{t('atlas.promise1Strong')}</strong> {t('atlas.promise1')}
              </p>
              <p>
                <strong>{t('atlas.promise2Strong')}</strong> {t('atlas.promise2')}
              </p>
              <p>
                <strong>{t('atlas.promise3Strong')}</strong> {t('atlas.promise3')}{' '}
                <Link href={path('/methodology#gap-atlas')}>{t('common.readMethod')}</Link>.
              </p>
              <p style={{ marginBottom: 0 }}>
                <Link href={path('/cancer-map')}>{t('atlas.mapLink')}</Link>
              </p>
            </aside>
          </div>
        </div>
      </section>

      <div className="viewBody">
        {state.status === 'idle' && (
          <div className="emptyState">
            <h2>{t('atlas.idleTitle')}</h2>
            <p>{t('atlas.idle')}</p>
          </div>
        )}

        {state.status === 'loading' && (
          <div aria-busy="true" aria-live="polite">
            <p className="loadingLine">
              <span className="spinner" aria-hidden="true" />
              {t('atlas.loading', { cancer: inSentence(cancer) })}
            </p>
            <div className="skeleton" style={{ height: 420, marginTop: 16 }} />
          </div>
        )}

        {state.status === 'error' && (
          <div className="emptyState" role="alert">
            <h2>{t('atlas.errorTitle')}</h2>
            <p>{state.error}</p>
            <button
              type="button"
              className="btn btnPrimary"
              onClick={() => run(cancer, { push: false })}
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        {d && (
          <div ref={resultsRef} tabIndex={-1} style={{ outline: 'none' }}>
            <div className="resultIntro">
              <div>
                <h2>{t('atlas.resultTitle', { cancer: cancerName(t, d.cancer) })}</h2>
                <p className="muted" style={{ margin: 0 }}>
                  {richText(
                    t('atlas.basedOn', {
                      cancer: inSentence(d.cancer),
                      date: fmtDateTime(d.generatedAt, locale),
                      version: d.methodVersion,
                    }),
                    {
                      count: <CountLink count={d.totals.records} url={d.totals.url} />,
                      baseline: <CountLink count={d.baseline.total} url={d.baseline.url} />,
                    }
                  )}
                  {d.baseline.source !== 'live' && d.baseline.snapshotDate
                    ? t('atlas.snapshotNote', { date: d.baseline.snapshotDate })
                    : ''}
                </p>
              </div>
              <div className="btnRow">
                <button type="button" className="btn btnSecondary btnSmall" onClick={exportCsv}>
                  <Icon name="download" size={16} />
                  {t('atlas.measuresCsv')}
                </button>
                <button type="button" className="btn btnSecondary btnSmall" onClick={exportJson}>
                  <Icon name="download" size={16} />
                  {t('atlas.evidenceJson')}
                </button>
                <Link
                  className="btn btnQuiet btnSmall"
                  href={path(`/explore?cancer=${encodeURIComponent(d.cancer.input)}`)}
                >
                  {t('atlas.explorePapers')}
                </Link>
              </div>
            </div>

            <QueryBox term={d.cancer.term} title={t('atlas.queryTitle')} />

            <section className="section" aria-labelledby="signals-h">
              <div className="sectionHead">
                <div>
                  <h2 id="signals-h">{t('atlas.signalsTitle')}</h2>
                  <p className="muted">
                    {t('atlas.signalsNote', { ratio: fmtRatio(d.thresholds.lower, locale) })}
                  </p>
                </div>
              </div>
              {d.totals.records < d.thresholds.minRecords ? (
                <div className="emptyState">
                  <h3>{t('atlas.tooFewTitle')}</h3>
                  <p>{t('atlas.tooFew', { n: d.totals.records, min: d.thresholds.minRecords })}</p>
                </div>
              ) : d.signals.length ? (
                <ul className="signalList">
                  {d.signals.map(s => (
                    <Signal key={s.id} s={s} measure={measureById[s.measureId]} cancer={d.cancer} />
                  ))}
                </ul>
              ) : (
                <div className="emptyState">
                  <h3>{t('atlas.noneTitle')}</h3>
                  <p>
                    {t('atlas.none', {
                      n: d.measures.length,
                      ratio: fmtRatio(d.thresholds.lower, locale),
                    })}
                  </p>
                </div>
              )}
              {d.contextNotes.length > 0 && (
                <div className="notice small" style={{ marginTop: 14 }}>
                  {d.contextNotes.map(n => (
                    <p key={n.id}>
                      {t(`atlas.context.${n.id}`, { cancer: cancerName(t, d.cancer) })}
                    </p>
                  ))}
                </div>
              )}
            </section>

            <section className="section" aria-labelledby="profile-h">
              <div className="sectionHead">
                <div>
                  <h2 id="profile-h">{t('atlas.profileTitle')}</h2>
                  <p className="muted">{t('atlas.profileNote')}</p>
                </div>
              </div>
              <div className="panel">
                <ForestPlot
                  rows={d.measures.map(m => ({
                    ...m,
                    label: measureLabel(m),
                    short: t(`measures.short.${m.id}`),
                  }))}
                  groups={groups}
                  idPrefix="atlas"
                  title={t('atlas.plotTitle', { cancer: cancerName(t, d.cancer) })}
                />
              </div>
              <details style={{ marginTop: 12 }}>
                <summary>{t('common.showTable')}</summary>
                <div className="tableWrap" style={{ marginTop: 10 }}>
                  <table className="dataTable">
                    <caption className="visuallyHidden">{t('atlas.tableCaption')}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{t('atlas.measure')}</th>
                        <th scope="col" className="numCell">
                          {cancerName(t, d.cancer)}
                        </th>
                        <th scope="col" className="numCell">
                          {t('atlas.share')}
                        </th>
                        <th scope="col" className="numCell">
                          {t('atlas.oncology')}
                        </th>
                        <th scope="col" className="numCell">
                          {t('atlas.share')}
                        </th>
                        <th scope="col" className="numCell">
                          {t('atlas.ratio')}
                        </th>
                        <th scope="col">{t('atlas.reading')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.measures.map(m => (
                        <tr key={m.id}>
                          <th scope="row">
                            {measureLabel(m)}
                            <div className="small muted">{t(`measures.groups.${m.group}`)}</div>
                          </th>
                          <td className="numCell">
                            <CountLink count={m.count} url={m.url} />
                          </td>
                          <td className="numCell">{fmtShare(m.share, undefined, locale)}</td>
                          <td className="numCell">
                            <CountLink count={m.baselineCount} url={m.baselineUrl} />
                          </td>
                          <td className="numCell">{fmtShare(m.baselineShare, undefined, locale)}</td>
                          <td className="numCell">{fmtRatio(m.ratio, locale)}</td>
                          <td>
                            <StatusPill status={m.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>

            <section className="section" aria-labelledby="time-h">
              <h2 id="time-h">{t('atlas.periodsTitle')}</h2>
              <p className="muted" style={{ maxWidth: '72ch' }}>
                {t('atlas.periodsNote')}
              </p>
              <div className="windowBars">
                {d.timeWindows.map(w => (
                  <div key={w.id} className="windowBar">
                    <span>{periodLabel(w, t)}</span>
                    <strong>
                      <CountLink count={w.records} url={w.url} />
                    </strong>
                    <span>
                      {w.perYear != null
                        ? t('atlas.perYear', { n: Math.round(w.perYear) })
                        : t('atlas.inTotal')}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" aria-labelledby="treat-h">
              <h2 id="treat-h">{t('atlas.treatmentsTitle')}</h2>
              <p className="muted" style={{ maxWidth: '72ch' }}>
                {t('atlas.treatmentsNote')}
              </p>
              <div className="tableWrap">
                <table className="dataTable" style={{ maxWidth: 720 }}>
                  <thead>
                    <tr>
                      <th scope="col">{t('atlas.treatmentCol')}</th>
                      <th scope="col" className="numCell">
                        {t('atlas.records')}
                      </th>
                      <th scope="col" className="numCell">
                        {t('atlas.shareOf', { cancer: inSentence(d.cancer) })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.treatments.map(tr => (
                      <tr key={tr.id}>
                        <th scope="row">
                          {t(`treatments.${tr.id}`) === `treatments.${tr.id}`
                            ? tr.label
                            : t(`treatments.${tr.id}`)}
                        </th>
                        <td className="numCell">
                          <CountLink count={tr.count} url={tr.url} />
                        </td>
                        <td className="numCell">{fmtShare(tr.share, undefined, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="section" aria-labelledby="sample-h">
              <h2 id="sample-h">{t('atlas.sampleTitle')}</h2>
              <p style={{ maxWidth: '72ch' }}>
                {t('atlas.sampleIntro')} {t('atlas.sampleMethod')}
              </p>
              <p className="notice small" style={{ maxWidth: '78ch' }}>
                {t('atlas.sampleNotice')}
              </p>
              <div className="tableWrap" style={{ marginTop: 14 }}>
                <table className="dataTable">
                  <caption className="visuallyHidden">{t('atlas.sampleCaption')}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t('atlas.period')}</th>
                      <th scope="col" className="numCell">
                        {t('atlas.pubmedRecords')}
                      </th>
                      <th scope="col" className="numCell">
                        {t('atlas.requested')}
                      </th>
                      <th scope="col" className="numCell">
                        {t('atlas.retrievedCol')}
                      </th>
                      <th scope="col" className="numCell">
                        {t('atlas.kept')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.sample.perWindow.map(w => (
                      <tr key={w.id}>
                        <th scope="row">{periodLabel(w, t)}</th>
                        <td className="numCell">
                          <CountLink count={w.totalRecords} url={w.url} />
                        </td>
                        <td className="numCell">{w.requested}</td>
                        <td className="numCell">{w.retrieved}</td>
                        <td className="numCell">{w.kept}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <dl className="factList" style={{ marginTop: 16 }}>
                <dt>{t('atlas.withAbstract')}</dt>
                <dd className="num">
                  {t('common.of', { a: d.sample.stats.withAbstract, b: d.sample.stats.total })}
                </dd>
                <dt>{t('atlas.withType')}</dt>
                <dd className="num">
                  {t('common.of', { a: d.sample.stats.withSpecificType, b: d.sample.stats.total })}
                </dd>
                <dt>{t('atlas.withPmc')}</dt>
                <dd className="num">
                  {t('common.of', { a: d.sample.stats.withPmc, b: d.sample.stats.total })}
                </dd>
                <dt>{t('atlas.withDoi')}</dt>
                <dd className="num">
                  {t('common.of', { a: d.sample.stats.withDoi, b: d.sample.stats.total })}
                </dd>
                <dt>{t('atlas.retracted')}</dt>
                <dd className="num">{d.sample.stats.retracted}</dd>
              </dl>
              <details style={{ marginTop: 14 }}>
                <summary>{t('atlas.viewSample', { n: d.sample.papers.length })}</summary>
                <ul className="sampleList">
                  {d.sample.papers.map(p => {
                    const w = d.sample.perWindow.find(x => x.id === p.retrievalWindow);
                    return (
                      <li key={`${p.retrievalWindow}-${p.pmid}`}>
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="ltrData">
                            {p.title || t('paper.untitled')}
                          </a>
                        ) : (
                          p.title
                        )}
                        <div className="sampleMeta">
                          <span>{evidenceLabel(t, classifyEvidence(p.publicationTypes))}</span>
                          {p.retracted && (
                            <span style={{ color: 'var(--rose)', fontWeight: 700 }}>
                              {t('atlas.retracted')}
                            </span>
                          )}
                          {p.journal && <span className="ltrData">{p.journal}</span>}
                          {p.date && <span>{p.date}</span>}
                          <span>
                            {t('atlas.sampledFrom', {
                              period: w ? periodLabel(w, t) : p.retrievalWindow,
                            })}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </section>

            <section className="section" aria-labelledby="claims-h">
              <h2 id="claims-h">{t('atlas.claimsTitle')}</h2>
              <div className="claims panel">
                <div>
                  <h3>{t('atlas.canShow')}</h3>
                  <ul>
                    <li>{t('atlas.can1')}</li>
                    <li>{t('atlas.can2')}</li>
                    <li>{t('atlas.can3')}</li>
                  </ul>
                </div>
                <div>
                  <h3>{t('atlas.cannotShow')}</h3>
                  <ul>
                    <li>{t('atlas.cannot1')}</li>
                    <li>{t('atlas.cannot2')}</li>
                    <li>{t('atlas.cannot3')}</li>
                  </ul>
                </div>
              </div>
              <details style={{ marginTop: 14 }}>
                <summary>{t('atlas.limitationsTitle')}</summary>
                <ul style={{ marginTop: 8 }}>
                  {['lim1', 'lim2', 'lim3', 'lim4', 'lim5'].map(k => (
                    <li key={k}>{t(`atlas.${k}`)}</li>
                  ))}
                </ul>
              </details>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
