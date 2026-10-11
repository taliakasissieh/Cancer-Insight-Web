'use client';

import { useEffect, useMemo, useState } from 'react';
import ShareList from '../ShareList';
import YearChart from '../YearChart';
import Icon from '../Icon';
import { useI18n } from '../I18n';
import { cachedPost } from '../../../lib/client/api';
import { download, fileStem, toCsv } from '../../../lib/client/exports';
import { track } from '../../../lib/client/track';
import { fmtDateTime, fmtPartialDate, fmtShare } from '../../../lib/format';
import { searchPageUrl, studyUrl } from '../../../lib/trials';

const GROUP_ORDER = ['open', 'active', 'completed', 'stopped', 'unknown'];

/* Registered phase combinations without a label of their own are shown as registered. */
function phaseLabel(t, id) {
  const key = `trials.phase.${id}`;
  const label = t(key);
  return label === key ? String(id).replace(/\|/g, '/') : label;
}

function useTrials(cancer) {
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setState({ status: 'loading', data: null, error: '' });
    cachedPost('/api/trials', { cancer })
      .then(data => {
        if (!live) return;
        setState({ status: 'ok', data, error: '' });
        track('trials_view', { cancer_type: cancer, studies: data.types.all });
      })
      .catch(error => live && setState({ status: 'error', data: null, error: error.message }));
    return () => {
      live = false;
    };
  }, [cancer, retry]);
  return [state, () => setRetry(r => r + 1)];
}

export default function Trials({ cancer, label }) {
  const { t, locale } = useI18n();
  const [state, retry] = useTrials(cancer);

  if (state.status === 'loading') {
    return (
      <div aria-busy="true" aria-live="polite">
        <p className="loadingLine">
          <span className="spinner" aria-hidden="true" />
          {t('trials.loading')}
        </p>
        <div className="overviewGrid" style={{ marginTop: 20 }}>
          <div className="skeleton" style={{ height: 320 }} />
          <div className="skeleton" style={{ height: 320 }} />
        </div>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="emptyState" role="alert">
        <h2>{t('trials.title')}</h2>
        <p>{state.error}</p>
        <button type="button" className="btn btnPrimary" onClick={retry}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const d = state.data;
  if (!d.types.all) {
    return (
      <div className="emptyState">
        <h2>{t('trials.title')}</h2>
        <p>{t('trials.noTrials')}</p>
        <a className="btn btnSecondary" href={d.source.searchUrl} target="_blank" rel="noopener noreferrer">
          {t('trials.openSearch')}
        </a>
      </div>
    );
  }

  const csvHref = `/api/trials?cancer=${encodeURIComponent(cancer)}&format=csv`;

  return (
    <div className="stack">
      <section className="panel trialsHead" aria-labelledby="trials-h">
        <h2 id="trials-h">{t('trials.title')}</h2>
        <p className="footprintLead">
          {t('trials.lead', { all: d.types.all, interventional: d.types.interventional })}
        </p>
        <p className="panelNote">
          {t('trials.source', {
            condition: d.source.condition,
            date: fmtDateTime(d.source.retrievedAt, locale),
          })}{' '}
          {t('trials.scope')}
        </p>
        {d.source.truncated && (
          <p className="notice noticeWarn small">
            {t('trials.truncated', { counted: d.counted, total: d.totalCount })}
          </p>
        )}
        <div className="btnRow">
          <a
            className="btn btnSecondary"
            href={d.source.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="external" size={16} />
            {t('trials.openSearch')}
          </a>
          <a
            className="btn btnSecondary"
            href={csvHref}
            download
            onClick={() => track('trials_csv', { cancer_type: cancer })}
          >
            <Icon name="download" size={16} />
            {t('trials.downloadAll')}
          </a>
        </div>
      </section>

      <div className="overviewGrid">
        <div className="stack">
          <StatusPanel d={d} />
          <PhasePanel d={d} />
          <section className="panel" aria-labelledby="trial-years-h">
            <h2 id="trial-years-h">{t('trials.years.title')}</h2>
            <p className="panelNote">
              {t('trials.years.note', {
                from: String(d.startYears[0]?.year ?? ''),
                to: String(d.startYears.at(-1)?.year ?? ''),
              })}
            </p>
            <YearChart
              years={d.startYears.map((y, i, all) => ({
                ...y,
                partial: i === all.length - 1,
              }))}
              label={t('trials.years.title')}
              unit={t('trials.years.unit')}
            />
          </section>
        </div>

        <div className="stack">
          <ResultsPanel d={d} label={label} />
          <SponsorPanel d={d} />
          <CountryPanel d={d} />
          <OpenTrialsPanel d={d} />
        </div>
      </div>

      <p className="notice small">
        <Icon name="info" size={16} /> {t('trials.method')} {t('common.educationalOnly')}
      </p>
    </div>
  );
}

function StatusPanel({ d }) {
  const { t } = useI18n();
  const n = d.types.interventional;
  const rows = GROUP_ORDER.map(id => ({
    id,
    label: t(`trials.groups.${id}`),
    count: d.statusGroups[id] || 0,
    share: n ? (d.statusGroups[id] || 0) / n : null,
  })).filter(r => r.count > 0);
  return (
    <section className="panel" aria-labelledby="trial-status-h">
      <h2 id="trial-status-h">{t('trials.stand.title')}</h2>
      <p className="panelNote">{t('trials.stand.note', { n })}</p>
      <ShareList rows={rows} site="ctgov" />
      <details className="small" style={{ marginTop: 10 }}>
        <summary>{t('trials.stand.details')}</summary>
        <ShareList
          site="ctgov"
          rows={d.status.map(s => ({
            id: s.id,
            label: t(`trials.status.${s.id}`),
            count: s.count,
            share: n ? s.count / n : null,
          }))}
        />
      </details>
    </section>
  );
}

function PhasePanel({ d }) {
  const { t } = useI18n();
  const n = d.types.interventional;
  return (
    <section className="panel" aria-labelledby="trial-phase-h">
      <h2 id="trial-phase-h">{t('trials.phase.title')}</h2>
      <p className="panelNote">{t('trials.phase.note')}</p>
      <ShareList
        site="ctgov"
        rows={d.phases.map(p => ({
          id: p.id,
          label: phaseLabel(t, p.id),
          count: p.count,
          share: n ? p.count / n : null,
        }))}
      />
    </section>
  );
}

function ResultsPanel({ d, label }) {
  const { t, locale } = useI18n();
  const r = d.results;
  const cutoff = fmtPartialDate(r.cutoff, locale);

  function downloadIds() {
    const rows = [
      ['# Source', 'ClinicalTrials.gov', d.source.condition],
      ['# Definition', t('trials.results.definition', { months: r.lagMonths })],
      ['# Retrieved', d.source.retrievedAt],
      ['nct_id', 'url'],
      ...r.overdueIds.map(id => [id, studyUrl(id)]),
    ];
    download(`${fileStem(label, 'trials_without_posted_results')}.csv`, toCsv(rows), 'text/csv');
    track('trials_overdue_csv', { count: r.overdueIds.length });
  }

  return (
    <section className="panel resultsPanel" aria-labelledby="trial-results-h">
      <h2 id="trial-results-h">{t('trials.results.title')}</h2>
      {r.eligible === 0 ? (
        <p>{t('trials.results.noneEligible', { cutoff })}</p>
      ) : r.overdue === 0 ? (
        <p>{t('trials.results.none', { cutoff })}</p>
      ) : (
        <>
          <p className="bigStat">
            <span className="bigStatValue">{fmtShare(r.overdueShare, 0, locale)}</span>
            <span className="bigStatLabel">{t('trials.results.share', { cutoff })}</span>
          </p>
          <p>{t('trials.results.lead', { overdue: r.overdue, eligible: r.eligible, cutoff })}</p>
          {r.overdueByPhase.length > 1 && (
            <>
              <h3 className="groupHeading">{t('trials.results.byPhase')}</h3>
              <ShareList
                site="ctgov"
                rows={r.overdueByPhase.map(p => ({
                  id: p.id,
                  label: phaseLabel(t, p.id),
                  count: p.count,
                  share: r.overdue ? p.count / r.overdue : null,
                }))}
              />
            </>
          )}
          <div className="btnRow">
            <button type="button" className="btn btnSecondary" onClick={downloadIds}>
              <Icon name="download" size={16} />
              {t('trials.results.download')}
            </button>
          </div>
        </>
      )}
      <p className="small muted">{t('trials.results.definition', { months: r.lagMonths })}</p>
      <ul className="cautionList small">
        <li>{t('trials.results.c1')}</li>
        <li>{t('trials.results.c2')}</li>
        <li>{t('trials.results.c3')}</li>
      </ul>
    </section>
  );
}

function SponsorPanel({ d }) {
  const { t } = useI18n();
  const n = d.types.interventional;
  return (
    <section className="panel" aria-labelledby="trial-sponsor-h">
      <h2 id="trial-sponsor-h">{t('trials.sponsors.title')}</h2>
      <p className="panelNote">{t('trials.sponsors.note')}</p>
      <ShareList
        site="ctgov"
        rows={d.sponsors.map(s => ({
          id: s.id,
          label: t(`trials.sponsors.${s.id}`),
          count: s.count,
          share: n ? s.count / n : null,
        }))}
      />
    </section>
  );
}

function CountryPanel({ d }) {
  const { t } = useI18n();
  const [country, setCountry] = useState('');
  const n = d.types.interventional;
  const top = d.countries.slice(0, 10);
  const sorted = useMemo(
    () => [...d.countries].sort((a, b) => a.country.localeCompare(b.country)),
    [d.countries]
  );
  const picked = d.countries.find(c => c.country === country);
  return (
    <section className="panel" aria-labelledby="trial-country-h">
      <h2 id="trial-country-h">{t('trials.countries.title')}</h2>
      <p className="panelNote">
        {t('trials.countries.note')} {t('trials.countries.total', { n: d.countries.length })}.
      </p>
      <ShareList
        site="ctgov"
        rows={top.map(c => ({
          id: c.country,
          label: <span dir="ltr">{c.country}</span>,
          count: c.count,
          url: searchPageUrl(d.source.condition, { country: c.country }),
          share: n ? c.count / n : null,
        }))}
      />
      {sorted.length > 10 && (
        <div className="countryFind">
          <label className="field">
            <span>{t('trials.countries.find')}</span>
            <select value={country} onChange={e => setCountry(e.target.value)} dir="ltr">
              <option value="">{t('trials.countries.choose')}</option>
              {sorted.map(c => (
                <option key={c.country} value={c.country}>
                  {c.country}
                </option>
              ))}
            </select>
          </label>
          {picked && (
            <p className="small" aria-live="polite">
              {t('trials.countries.result', { n: picked.count, country: picked.country })}{' '}
              <a
                href={searchPageUrl(d.source.condition, { country: picked.country })}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('trials.countries.open', { country: picked.country })}
              </a>
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function OpenTrialsPanel({ d }) {
  const { t, locale } = useI18n();
  return (
    <section className="panel" aria-labelledby="trial-open-h">
      <h2 id="trial-open-h">{t('trials.open.title')}</h2>
      <p className="panelNote">{t('trials.open.note')}</p>
      {d.recentOpen.length === 0 ? (
        <p className="muted">{t('trials.open.none')}</p>
      ) : (
        <ol className="trialList">
          {d.recentOpen.map(trial => (
            <li key={trial.id}>
              <a href={trial.url} target="_blank" rel="noopener noreferrer" className="ltrData">
                {trial.title || trial.id}
              </a>
              <span className="trialMeta">
                <span dir="ltr">{trial.id}</span> · {t(`trials.status.${trial.status}`)} ·{' '}
                {phaseLabel(t, trial.phases)} ·{' '}
                {t('trials.open.countries', { n: trial.countries })}
                {trial.lastUpdate && (
                  <> · {t('trials.open.updated', { date: fmtPartialDate(trial.lastUpdate, locale) })}</>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
