'use client';

import { useEffect, useMemo, useState } from 'react';
import CountLink from '../CountLink';
import PaperItem from '../PaperItem';
import QueryBox from '../QueryBox';
import Icon from '../Icon';
import { useI18n } from '../I18n';
import { cachedPost } from '../../../lib/client/api';
import { track } from '../../../lib/client/track';
import { fmtShare, lowerFirst } from '../../../lib/format';
import { DEFAULT_TREATMENT_KEYS, resolveTreatment } from '../../../lib/queries';
import { paperKey, treatmentTags } from '../../../lib/evidence';
import { cancerName, localizeError } from '../../../lib/i18n/labels.js';
import { richText } from '../../../lib/i18n/rich.js';

function useTreatmentProfile(cancer, key) {
  const [state, setState] = useState({ status: 'idle', data: null, error: '' });
  useEffect(() => {
    if (!key) return;
    let live = true;
    setState({ status: 'loading', data: null, error: '' });
    cachedPost('/api/treatment', { cancer, treatment: key, limit: 6 })
      .then(d => live && setState({ status: 'ok', data: d, error: '' }))
      .catch(e => live && setState({ status: 'error', data: null, error: e.message }));
    return () => {
      live = false;
    };
  }, [cancer, key]);
  return state;
}

/* Names in the page language. English keeps lower-case inside sentences. */
function useNames() {
  const { t, locale } = useI18n();
  const treatment = (key, inSentence = false) => {
    const id = resolveTreatment(key)?.id || key;
    const dictKey = `treatments.${id}`;
    const label = t(dictKey) === dictKey ? resolveTreatment(key)?.label || key : t(dictKey);
    return inSentence && locale !== 'ar' ? lowerFirst(label) : label;
  };
  const cancer = (c, inSentence = true) => {
    const name = cancerName(t, c);
    return inSentence && locale !== 'ar' ? lowerFirst(name) : name;
  };
  return { treatment, cancer };
}

function rowsFor(d, t) {
  if (!d) return [];
  return [
    ...d.designs.map(x => ({
      id: x.id,
      label: t(`measures.label.${x.id}`),
      count: x.count,
      url: x.url,
      share: x.share,
    })),
    {
      id: 'recent',
      label: t('tx.recentRow', { range: d.recent.label }),
      count: d.recent.count,
      url: d.recent.url,
      share: d.recent.share,
    },
    {
      id: 'fft',
      label: t('tx.fftRow'),
      count: d.freeFullText.count,
      url: d.freeFullText.url,
      share: d.freeFullText.share,
    },
  ];
}

function Caution() {
  const { t } = useI18n();
  return (
    <p className="notice noticeWarn small">
      <strong>{t('tx.cautionStrong')}</strong> {t('tx.cautionBody')}
    </p>
  );
}

function Profile({ state, cancer, feedPapers, saved }) {
  const { t, locale } = useI18n();
  const names = useNames();
  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div aria-busy="true">
        <p className="loadingLine">
          <span className="spinner" aria-hidden="true" />
          {t('tx.loading')}
        </p>
        <div className="skeleton" style={{ height: 260, marginTop: 12 }} />
      </div>
    );
  }
  if (state.status === 'error') {
    return <p className="notice noticeError">{localizeError(t, locale, state.error)}</p>;
  }
  const d = state.data;
  const rows = rowsFor(d, t);
  const subject = names.cancer(cancer);
  const tName = names.treatment(d.treatment.id);
  return (
    <div className="stack">
      <section className="panel" aria-labelledby="tp-h">
        <h2 id="tp-h">{t('tx.profileTitle', { treatment: tName, cancer: subject })}</h2>
        <p className="footprintLead" style={{ fontSize: '1.15rem' }}>
          {richText(
            t('tx.profileLead', {
              treatment: names.treatment(d.treatment.id, true),
              share: fmtShare(d.total.shareOfCancer, undefined, locale),
              cancer: subject,
            }),
            {
              count: <CountLink count={d.total.count} url={d.total.url} />,
              total: <CountLink count={d.cancerTotal.count} url={d.cancerTotal.url} />,
            }
          )}
        </p>
        <div className="tableWrap">
          <table className="dataTable">
            <caption className="visuallyHidden">
              {t('tx.caption', { treatment: tName, cancer: subject })}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t('tx.among')}</th>
                <th scope="col" className="numCell">
                  {t('tx.records')}
                </th>
                <th scope="col" className="numCell">
                  {t('tx.share')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <th scope="row">{r.label}</th>
                  <td className="numCell">
                    <CountLink count={r.count} url={r.url} />
                  </td>
                  <td className="numCell">{fmtShare(r.share, undefined, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <QueryBox term={d.query.term} title={t('tx.queryTitle')} />
      </section>

      {feedPapers.length > 0 && (
        <section aria-labelledby="tp-feed-h">
          <div className="sectionHead">
            <div>
              <h3 id="tp-feed-h">{t('tx.taggedTitle')}</h3>
              <p className="muted small">{t('tx.taggedNote', { n: feedPapers.length })}</p>
            </div>
          </div>
          <ol className="paperList">
            {feedPapers.map(p => (
              <li key={paperKey(p)}>
                <PaperItem
                  paper={p}
                  headingLevel={4}
                  saved={saved.isSaved(p)}
                  onToggleSave={paper => saved.toggle(paper, { cancer: cancer.label })}
                />
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="tp-ex-h">
        <div className="sectionHead">
          <div>
            <h3 id="tp-ex-h">{t('tx.examplesTitle')}</h3>
            <p className="muted small">{t('tx.examplesNote')}</p>
          </div>
        </div>
        {d.examples.papers.length ? (
          <ol className="paperList">
            {d.examples.papers.map(p => (
              <li key={paperKey(p)}>
                <PaperItem
                  paper={p}
                  headingLevel={4}
                  saved={saved.isSaved(p)}
                  onToggleSave={paper => saved.toggle(paper, { cancer: cancer.label })}
                />
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">{t('tx.noRecords')}</p>
        )}
      </section>
    </div>
  );
}

function Compare({ a, b, cancer }) {
  const { t, locale } = useI18n();
  const names = useNames();
  const da = a.data;
  const db = b.data;
  const ready = da && db;
  const ra = rowsFor(da, t);
  const rb = rowsFor(db, t);
  if (a.status === 'error' || b.status === 'error') {
    return <p className="notice noticeError">{localizeError(t, locale, a.error || b.error)}</p>;
  }
  if (!ready) {
    return (
      <div aria-busy="true">
        <p className="loadingLine">
          <span className="spinner" aria-hidden="true" />
          {t('tx.compareLoading')}
        </p>
        <div className="skeleton" style={{ height: 300, marginTop: 12 }} />
      </div>
    );
  }
  const subject = names.cancer(cancer);
  const nameA = names.treatment(da.treatment.id);
  const nameB = names.treatment(db.treatment.id);
  return (
    <div className="stack">
      <section className="panel" aria-labelledby="cmp-h">
        <h2 id="cmp-h">
          {t('tx.compareTitle', {
            a: nameA,
            b: names.treatment(db.treatment.id, true),
            cancer: subject,
          })}
        </h2>
        <p className="panelNote">{t('tx.compareNote', { cancer: subject })}</p>
        <div className="tableWrap">
          <table className="dataTable">
            <caption className="visuallyHidden">{t('tx.compareCaption')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('tx.measure')}</th>
                <th scope="col" className="numCell">
                  {nameA}
                </th>
                <th scope="col" className="numCell">
                  {nameB}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{t('tx.mentioning')}</th>
                <td className="numCell">
                  <CountLink count={da.total.count} url={da.total.url} />
                  <div className="small muted">
                    {t('tx.ofCancer', {
                      share: fmtShare(da.total.shareOfCancer, undefined, locale),
                      cancer: subject,
                    })}
                  </div>
                </td>
                <td className="numCell">
                  <CountLink count={db.total.count} url={db.total.url} />
                  <div className="small muted">
                    {t('tx.ofCancer', {
                      share: fmtShare(db.total.shareOfCancer, undefined, locale),
                      cancer: subject,
                    })}
                  </div>
                </td>
              </tr>
              {ra.map((r, i) => (
                <tr key={r.id}>
                  <th scope="row">{r.label}</th>
                  <td className="numCell">
                    <CountLink count={r.count} url={r.url} />
                    <div className="small muted">{fmtShare(r.share, undefined, locale)}</div>
                  </td>
                  <td className="numCell">
                    <CountLink count={rb[i]?.count} url={rb[i]?.url} />
                    <div className="small muted">{fmtShare(rb[i]?.share, undefined, locale)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="profileGrid" style={{ marginTop: 12 }}>
          <QueryBox term={da.query.term} title={t('tx.queryFor', { treatment: nameA })} />
          <QueryBox term={db.query.term} title={t('tx.queryFor', { treatment: nameB })} />
        </div>
      </section>

      <div className="profileGrid">
        {[da, db].map(d => (
          <section
            key={d.treatment.id}
            aria-label={t('tx.examplesFor', { treatment: names.treatment(d.treatment.id) })}
          >
            <h3>{t('tx.examplesForTitle', { treatment: names.treatment(d.treatment.id, true) })}</h3>
            <p className="muted small">{t('tx.examplesForNote')}</p>
            <ol className="paperList">
              {d.examples.papers.slice(0, 3).map(p => (
                <li key={paperKey(p)}>
                  <PaperItem paper={p} headingLevel={4} showWhy={false} />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function Treatments({ data, saved, treatment, onTreatmentChange }) {
  const { t } = useI18n();
  const names = useNames();
  const cancer = data.cancer.input;
  const options = useMemo(() => {
    const feed = Object.fromEntries(data.treatments);
    const keys = [...new Set([...data.treatments.map(x => x[0]), ...DEFAULT_TREATMENT_KEYS])];
    return keys
      .map(k => ({ key: k, feedCount: feed[k] || 0 }))
      .sort((x, y) => y.feedCount - x.feedCount);
  }, [data.treatments]);

  const selected = options.some(o => o.key === resolveTreatment(treatment)?.id)
    ? resolveTreatment(treatment).id
    : options[0]?.key;
  const [mode, setMode] = useState('profile');
  const [other, setOther] = useState(options.find(o => o.key !== selected)?.key || '');

  useEffect(() => {
    if (other === selected) setOther(options.find(o => o.key !== selected)?.key || '');
  }, [selected, other, options]);

  const primary = useTreatmentProfile(cancer, selected);
  const secondary = useTreatmentProfile(cancer, mode === 'compare' ? other : '');

  const feedPapers = data.papers.filter(p => treatmentTags(p).includes(selected));

  function choose(key) {
    onTreatmentChange(key);
    track('treatment_selected', { cancer_type: cancer, treatment: key });
  }

  return (
    <div>
      <div className="viewIntro">
        <h2>{t('tx.title')}</h2>
        <p>{t('tx.intro', { cancer: names.cancer(data.cancer) })}</p>
      </div>

      <div className="modeSwitch" role="group" aria-label={t('tx.modeLabel')}>
        <button type="button" aria-pressed={mode === 'profile'} onClick={() => setMode('profile')}>
          {t('tx.one')}
        </button>
        <button
          type="button"
          aria-pressed={mode === 'compare'}
          onClick={() => {
            setMode('compare');
            track('treatment_comparison', { cancer_type: cancer });
          }}
        >
          {t('tx.compare')}
        </button>
      </div>

      {mode === 'profile' ? (
        <div role="group" aria-label={t('tx.category')} className="treatmentPicker">
          {options.map(o => (
            <button
              key={o.key}
              type="button"
              className="chip"
              aria-pressed={o.key === selected}
              onClick={() => choose(o.key)}
            >
              {names.treatment(o.key)}
              {o.feedCount > 0 && (
                <span className="chipCount" title={t('tx.feedCountTitle')}>
                  {o.feedCount}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="profileGrid" style={{ maxWidth: 640, marginBottom: 8 }}>
          <label className="field">
            {t('tx.first')}
            <select value={selected} onChange={e => choose(e.target.value)}>
              {options.map(o => (
                <option key={o.key} value={o.key}>
                  {names.treatment(o.key)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {t('tx.second')}
            <select value={other} onChange={e => setOther(e.target.value)}>
              {options
                .filter(o => o.key !== selected)
                .map(o => (
                  <option key={o.key} value={o.key}>
                    {names.treatment(o.key)}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}
      {mode === 'profile' && data.treatments.length > 0 && (
        <p className="small muted" style={{ marginTop: 4 }}>
          {t('tx.feedCountNote', { n: data.papers.length })}
        </p>
      )}

      <div style={{ margin: '16px 0 24px' }}>
        <Caution />
      </div>

      {mode === 'profile' ? (
        <Profile state={primary} cancer={data.cancer} feedPapers={feedPapers} saved={saved} />
      ) : (
        <Compare a={primary} b={secondary} cancer={data.cancer} />
      )}

      <p className="small muted" style={{ marginTop: 24 }}>
        <Icon name="info" size={14} /> {t('tx.footer')}
      </p>
    </div>
  );
}
