'use client';

import { useEffect, useMemo, useState } from 'react';
import CountLink from '../CountLink';
import PaperItem from '../PaperItem';
import QueryBox from '../QueryBox';
import Icon from '../Icon';
import { cachedPost } from '../../../lib/client/api';
import { track } from '../../../lib/client/track';
import { fmtInt, fmtShare, lowerFirst } from '../../../lib/format';
import { DEFAULT_TREATMENT_KEYS, resolveTreatment } from '../../../lib/queries';
import { paperKey, treatmentTags } from '../../../lib/evidence';

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

function rowsFor(d) {
  if (!d) return [];
  return [
    ...d.designs.map(x => ({
      id: x.id,
      label: x.label,
      count: x.count,
      url: x.url,
      share: x.share,
    })),
    {
      id: 'recent',
      label: `Published ${d.recent.label}`,
      count: d.recent.count,
      url: d.recent.url,
      share: d.recent.share,
    },
    {
      id: 'fft',
      label: 'Free full text available',
      count: d.freeFullText.count,
      url: d.freeFullText.url,
      share: d.freeFullText.share,
    },
  ];
}

function Caution() {
  return (
    <p className="notice noticeWarn small">
      <strong>Read as literature, not as results.</strong> These numbers show how much has been
      published and in which study designs. A treatment with more records, more trials or more
      recent papers is not shown to be more effective, safer or more suitable for anyone.
    </p>
  );
}

function Profile({ state, cancerLabel, feedPapers, saved }) {
  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div aria-busy="true">
        <p className="loadingLine">
          <span className="spinner" aria-hidden="true" />
          Counting PubMed records and finding the most relevant examples…
        </p>
        <div className="skeleton" style={{ height: 260, marginTop: 12 }} />
      </div>
    );
  }
  if (state.status === 'error') {
    return <p className="notice noticeError">{state.error}</p>;
  }
  const d = state.data;
  const rows = rowsFor(d);
  const subject = lowerFirst(cancerLabel);
  return (
    <div className="stack">
      <section className="panel" aria-labelledby="tp-h">
        <h2 id="tp-h">
          {d.treatment.label} in {subject} research
        </h2>
        <p className="footprintLead" style={{ fontSize: '1.15rem' }}>
          <CountLink count={d.total.count} url={d.total.url} /> PubMed records mention{' '}
          {lowerFirst(d.treatment.label)} — {fmtShare(d.total.shareOfCancer)} of all{' '}
          <CountLink count={d.cancerTotal.count} url={d.cancerTotal.url} /> {subject} records.
        </p>
        <div className="tableWrap">
          <table className="dataTable">
            <caption className="visuallyHidden">
              Study designs among PubMed records on {d.treatment.label} in {subject}
            </caption>
            <thead>
              <tr>
                <th scope="col">Among these records</th>
                <th scope="col" className="numCell">
                  Records
                </th>
                <th scope="col" className="numCell">
                  Share
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
                  <td className="numCell">{fmtShare(r.share)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <QueryBox term={d.query.term} title="PubMed query for this treatment" />
      </section>

      {feedPapers.length > 0 && (
        <section aria-labelledby="tp-feed-h">
          <div className="sectionHead">
            <div>
              <h3 id="tp-feed-h">Tagged in the recent research feed</h3>
              <p className="muted small">
                {feedPapers.length} of the recent records carry this treatment tag.
              </p>
            </div>
          </div>
          <ol className="paperList">
            {feedPapers.map(p => (
              <li key={paperKey(p)}>
                <PaperItem
                  paper={p}
                  headingLevel={4}
                  saved={saved.isSaved(p)}
                  onToggleSave={paper => saved.toggle(paper, { cancer: cancerLabel })}
                />
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="tp-ex-h">
        <div className="sectionHead">
          <div>
            <h3 id="tp-ex-h">Most relevant PubMed records</h3>
            <p className="muted small">
              PubMed Best Match for the query above, across all years. These are examples, not a
              summary of the evidence.
            </p>
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
                  onToggleSave={paper => saved.toggle(paper, { cancer: cancerLabel })}
                />
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">PubMed returned no records for this combination.</p>
        )}
      </section>
    </div>
  );
}

function Compare({ a, b, cancerLabel }) {
  const da = a.data;
  const db = b.data;
  const ready = da && db;
  const ra = rowsFor(da);
  const rb = rowsFor(db);
  if (a.status === 'error' || b.status === 'error') {
    return <p className="notice noticeError">{a.error || b.error}</p>;
  }
  if (!ready) {
    return (
      <div aria-busy="true">
        <p className="loadingLine">
          <span className="spinner" aria-hidden="true" />
          Counting PubMed records for both treatments…
        </p>
        <div className="skeleton" style={{ height: 300, marginTop: 12 }} />
      </div>
    );
  }
  const subject = lowerFirst(cancerLabel);
  return (
    <div className="stack">
      <section className="panel" aria-labelledby="cmp-h">
        <h2 id="cmp-h">
          {da.treatment.label} and {lowerFirst(db.treatment.label)} in {subject} research
        </h2>
        <p className="panelNote">
          Counts are PubMed records that mention each treatment within {subject} records. A record
          can mention both. Shares are of each treatment’s own records.
        </p>
        <div className="tableWrap">
          <table className="dataTable">
            <caption className="visuallyHidden">Comparison of PubMed literature</caption>
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col" className="numCell">
                  {da.treatment.label}
                </th>
                <th scope="col" className="numCell">
                  {db.treatment.label}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Records mentioning the treatment</th>
                <td className="numCell">
                  <CountLink count={da.total.count} url={da.total.url} />
                  <div className="small muted">
                    {fmtShare(da.total.shareOfCancer)} of {subject}
                  </div>
                </td>
                <td className="numCell">
                  <CountLink count={db.total.count} url={db.total.url} />
                  <div className="small muted">
                    {fmtShare(db.total.shareOfCancer)} of {subject}
                  </div>
                </td>
              </tr>
              {ra.map((r, i) => (
                <tr key={r.id}>
                  <th scope="row">{r.label}</th>
                  <td className="numCell">
                    <CountLink count={r.count} url={r.url} />
                    <div className="small muted">{fmtShare(r.share)}</div>
                  </td>
                  <td className="numCell">
                    <CountLink count={rb[i]?.count} url={rb[i]?.url} />
                    <div className="small muted">{fmtShare(rb[i]?.share)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="profileGrid" style={{ marginTop: 12 }}>
          <QueryBox term={da.query.term} title={`Query: ${da.treatment.label}`} />
          <QueryBox term={db.query.term} title={`Query: ${db.treatment.label}`} />
        </div>
      </section>

      <div className="profileGrid">
        {[da, db].map(d => (
          <section key={d.treatment.id} aria-label={`Example records for ${d.treatment.label}`}>
            <h3>Example records: {lowerFirst(d.treatment.label)}</h3>
            <p className="muted small">
              Top PubMed Best Match records. They are not paired across columns.
            </p>
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
  const cancer = data.cancer.input;
  const options = useMemo(() => {
    const feed = Object.fromEntries(data.treatments);
    const keys = [...new Set([...data.treatments.map(t => t[0]), ...DEFAULT_TREATMENT_KEYS])];
    return keys
      .map(k => ({ key: k, label: resolveTreatment(k)?.label || k, feedCount: feed[k] || 0 }))
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
        <h2>Treatment literature</h2>
        <p>
          See how much PubMed research mentions each treatment category for{' '}
          {lowerFirst(data.cancer.label)}, which study designs it includes, and the most relevant
          records. Compare two categories side by side.
        </p>
      </div>

      <div className="modeSwitch" role="group" aria-label="Mode">
        <button type="button" aria-pressed={mode === 'profile'} onClick={() => setMode('profile')}>
          One treatment
        </button>
        <button
          type="button"
          aria-pressed={mode === 'compare'}
          onClick={() => {
            setMode('compare');
            track('treatment_comparison', { cancer_type: cancer });
          }}
        >
          Compare two
        </button>
      </div>

      {mode === 'profile' ? (
        <div role="group" aria-label="Treatment category" className="treatmentPicker">
          {options.map(o => (
            <button
              key={o.key}
              type="button"
              className="chip"
              aria-pressed={o.key === selected}
              onClick={() => choose(o.key)}
            >
              {o.label}
              {o.feedCount > 0 && (
                <span className="chipCount" title="Records tagged in the recent research feed">
                  {o.feedCount}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="profileGrid" style={{ maxWidth: 640, marginBottom: 8 }}>
          <label className="field">
            First treatment
            <select value={selected} onChange={e => choose(e.target.value)}>
              {options.map(o => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Second treatment
            <select value={other} onChange={e => setOther(e.target.value)}>
              {options
                .filter(o => o.key !== selected)
                .map(o => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}
      {mode === 'profile' && data.treatments.length > 0 && (
        <p className="small muted" style={{ marginTop: 4 }}>
          Numbers beside a category count records tagged with it in the recent research feed (
          {fmtInt(data.papers.length)} records).
        </p>
      )}

      <div style={{ margin: '16px 0 24px' }}>
        <Caution />
      </div>

      {mode === 'profile' ? (
        <Profile
          state={primary}
          cancerLabel={data.cancer.label}
          feedPapers={feedPapers}
          saved={saved}
        />
      ) : (
        <Compare a={primary} b={secondary} cancerLabel={data.cancer.label} />
      )}

      <p className="small muted" style={{ marginTop: 24 }}>
        <Icon name="info" size={14} /> Treatment categories are matched with PubMed terms (MeSH and
        title/abstract wording). Open any query to see exactly what was counted.
      </p>
    </div>
  );
}
