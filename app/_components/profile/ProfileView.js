'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import YearChart from '../YearChart';
import Icon from '../Icon';
import { useI18n } from '../I18n';
import { cachedGet, cachedPost } from '../../../lib/client/api';
import { fmtRatio, fmtShare } from '../../../lib/format';
import { burdenFor } from '../../../lib/burden';

function useData(loader, key) {
  const [state, setState] = useState({ status: 'loading', data: null });
  useEffect(() => {
    let live = true;
    loader()
      .then(data => live && setState({ status: 'ok', data }))
      .catch(() => live && setState({ status: 'error', data: null }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

function Pending() {
  return <div className="skeleton" style={{ height: 120 }} aria-hidden="true" />;
}

export default function ProfileView({ id }) {
  const { t, locale, path } = useI18n();
  const name = t(`cancers.${id}`);
  const q = encodeURIComponent(id);

  const footprint = useData(() => cachedPost('/api/footprint', { cancer: id }), `fp-${id}`);
  const trials = useData(() => cachedPost('/api/trials', { cancer: id }), `tr-${id}`);
  const map = useData(() => cachedGet(`/api/map?cancer=${q}`), `map-${id}`);
  const retractions = useData(() => cachedGet(`/api/retractions?cancer=${q}`), `rt-${id}`);
  const burden = useData(() => cachedGet('/api/burden'), 'burden');

  /* The cards below are plain render helpers (called, not mounted as components), so they can
     share this component's state without being re-created as new component types. */
  return (
    <div className="overviewGrid">
      <div className="stack">
        {LiteratureCard({ state: footprint })}
        {CoverageCard({ state: map })}
        {RetractionsCard({ state: retractions })}
      </div>
      <div className="stack">
        <BurdenCard id={id} name={name} state={burden} />
        {TrialsCard({ state: trials })}
        <section className="panel" aria-labelledby="profile-tools-h">
          <h2 id="profile-tools-h">{t('profile.goFurther')}</h2>
          <div className="nextSteps">
            {[
              [`/explore?cancer=${q}&view=papers`, 'profile.toolPapers'],
              [`/explore?cancer=${q}&view=treatments`, 'profile.toolTreatments'],
              [`/explore?cancer=${q}&view=trials`, 'profile.toolTrials'],
              [`/research-gap-atlas?cancer=${q}`, 'profile.toolAtlas'],
              [`/explore?cancer=${q}&view=images`, 'profile.toolImages'],
            ].map(([href, key]) => (
              <Link key={key} className="nextStep" href={path(href)}>
                <strong>{t(key)}</strong>
              </Link>
            ))}
          </div>
        </section>
        <p className="notice small">
          <Icon name="info" size={16} /> <strong>{t('common.educationalOnly')}</strong>{' '}
          {t('footer.legal')}
        </p>
      </div>
    </div>
  );

  function LiteratureCard({ state }) {
    const fp = state.data;
    let recent = null;
    if (fp) {
      const complete = fp.years.filter(y => !y.partial).slice(-5);
      if (complete.length === 5 && complete.every(y => y.count != null)) {
        recent = {
          n: complete.reduce((a, y) => a + y.count, 0),
          from: String(complete[0].year),
          to: String(complete.at(-1).year),
        };
      }
    }
    return (
      <section className="panel" aria-labelledby="profile-lit-h">
        <h2 id="profile-lit-h">{t('profile.literatureTitle')}</h2>
        {state.status === 'loading' && <Pending />}
        {state.status === 'error' && <p className="muted">{t('profile.unavailable')}</p>}
        {fp && (
          <>
            <p className="footprintLead">{t('profile.literatureTotal', { n: fp.total.count })}</p>
            <p className="small" style={{ marginTop: -4 }}>
              <a href={fp.total.url} target="_blank" rel="noopener noreferrer">
                {t('count.open', { site: 'PubMed' })}
              </a>
            </p>
            {recent && <p className="panelNote">{t('profile.literatureRecent', recent)}</p>}
            <YearChart years={fp.years} />
          </>
        )}
      </section>
    );
  }

  function CoverageCard({ state }) {
    const row = state.data;
    const low = row
      ? row.cells.filter(c => c.status === 'lower' || c.status === 'much-lower').sort((a, b) => a.ratio - b.ratio)
      : [];
    return (
      <section className="panel" aria-labelledby="profile-cov-h">
        <h2 id="profile-cov-h">{t('profile.coverageTitle')}</h2>
        {state.status === 'loading' && <Pending />}
        {state.status === 'error' && <p className="muted">{t('profile.unavailable')}</p>}
        {row && (
          <>
            {low.length === 0 ? (
              <p>{t('profile.coverageNone')}</p>
            ) : (
              <>
                <p className="panelNote">{t('profile.coverageIntro')}</p>
                <ul className="signalMini">
                  {low.map(c => (
                    <li key={c.id}>
                      <a href={c.url} target="_blank" rel="noopener noreferrer">
                        {t(`measures.label.${c.id}`)}
                      </a>
                      <span className="num">{fmtRatio(c.ratio, locale)}</span>
                      <span className="muted small">
                        {fmtShare(c.share, undefined, locale)} / {fmtShare(c.baselineShare, undefined, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Link className="btn btnSecondary" href={path(`/research-gap-atlas?cancer=${q}`)}>
              {t('profile.coverageMore')}
            </Link>
          </>
        )}
      </section>
    );
  }

  function RetractionsCard({ state }) {
    const d = state.data;
    return (
      <section className="panel" aria-labelledby="profile-ret-h">
        <h2 id="profile-ret-h">{t('profile.retractionsTitle')}</h2>
        {state.status === 'loading' && <Pending />}
        {state.status === 'error' && <p className="muted">{t('profile.unavailable')}</p>}
        {d && (
          <>
            {!d.retracted.count ? (
              <p>{t('profile.retractionsNone')}</p>
            ) : (
              <>
                <p>
                  {t('profile.retractionsCount', {
                    n: d.retracted.count,
                    rate: (d.retracted.perTenThousand ?? 0).toFixed(1),
                  })}{' '}
                  <a href={d.retracted.url} target="_blank" rel="noopener noreferrer">
                    {t('count.open', { site: 'PubMed' })}
                  </a>
                </p>
                {d.newest.length > 0 && (
                  <>
                    <h3 className="groupHeading">{t('profile.retractionsNewest')}</h3>
                    <ul className="retractedList">
                      {d.newest.map(p => (
                        <li key={p.pmid}>
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="ltrData">
                            {p.title || p.pmid}
                          </a>
                          <span className="trialMeta ltrData">
                            {[p.journal, p.year].filter(Boolean).join(' · ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
            <p className="small muted" style={{ margin: '10px 0 0' }}>
              {t('profile.retractionsNote')}
            </p>
          </>
        )}
      </section>
    );
  }

  function TrialsCard({ state }) {
    const d = state.data;
    return (
      <section className="panel" aria-labelledby="profile-trials-h">
        <h2 id="profile-trials-h">{t('profile.trialsTitle')}</h2>
        {state.status === 'loading' && <Pending />}
        {state.status === 'error' && <p className="muted">{t('profile.unavailable')}</p>}
        {d && (
          <>
            <p>{t('profile.trialsSummary', { all: d.types.all, open: d.statusGroups.open })}</p>
            {d.results.overdueShare != null && (
              <p className="bigStat">
                <span className="bigStatValue">{fmtShare(d.results.overdueShare, 0, locale)}</span>
                <span className="bigStatLabel">{t('profile.trialsResults', { share: '' }).trim()}</span>
              </p>
            )}
            {d.countries.length > 0 && (
              <p className="small">
                {t('profile.trialsCountries', {
                  list: d.countries
                    .slice(0, 4)
                    .map(c => c.country)
                    .join(locale === 'ar' ? '، ' : ', '),
                })}
              </p>
            )}
            <Link className="btn btnSecondary" href={path(`/explore?cancer=${q}&view=trials`)}>
              {t('profile.trialsMore')}
            </Link>
          </>
        )}
      </section>
    );
  }
}

function BurdenCard({ id, name, state }) {
  const { t, locale, path, num } = useI18n();
  const b = burdenFor(id);
  const row = state.data?.rows?.find(r => r.id === id);
  return (
    <section className="panel" aria-labelledby="profile-burden-h">
      <h2 id="profile-burden-h">{t('burden.profileTitle')}</h2>
      {!b ? (
        <p>{t('burden.profileNone', { cancer: name })}</p>
      ) : (
        <>
          <dl className="factList">
            <dt>{t('burden.colDeaths')}</dt>
            <dd className="num">
              {num(b.deaths)} <span className="muted small">({fmtShare(b.deathShare, undefined, locale)})</span>
            </dd>
            <dt>{t('burden.colCases')}</dt>
            <dd className="num">
              {num(b.cases)} <span className="muted small">({fmtShare(b.caseShare, undefined, locale)})</span>
            </dd>
            {row && (
              <>
                <dt>{t('burden.colRatioDeaths')}</dt>
                <dd className="num">{fmtRatio(row.ratioDeaths, locale)}</dd>
              </>
            )}
          </dl>
          <Link className="btn btnSecondary" href={path('/research-vs-burden')} style={{ marginTop: 12 }}>
            {t('burden.seeAll')}
          </Link>
        </>
      )}
    </section>
  );
}
