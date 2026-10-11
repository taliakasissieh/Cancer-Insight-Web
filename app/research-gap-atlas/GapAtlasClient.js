'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CancerSearch from '../_components/CancerSearch';
import CountLink from '../_components/CountLink';
import ForestPlot from '../_components/ForestPlot';
import QueryBox from '../_components/QueryBox';
import Icon from '../_components/Icon';
import { postJson } from '../../lib/client/api';
import { download, fileStem, toCsv } from '../../lib/client/exports';
import { track } from '../../lib/client/track';
import { fmtDateTime, fmtInt, fmtRatio, fmtShare, lowerFirst } from '../../lib/format';

const GROUPS = [
  { id: 'design', label: 'Study design' },
  { id: 'theme', label: 'Research themes' },
  { id: 'population', label: 'Population focus' },
  { id: 'access', label: 'Access' },
  { id: 'time', label: 'Recency' },
];

const STATUS_TEXT = {
  'much-lower': 'Much lower',
  lower: 'Lower',
  similar: 'Similar',
  higher: 'Higher',
  context: 'Expected (population)',
  insufficient: 'Too few records',
  unavailable: 'Unavailable',
};

function StatusPill({ status }) {
  return <span className={`statusPill status-${status}`}>{STATUS_TEXT[status] || status}</span>;
}

function periodLabel(w) {
  return w.id === 'historical' ? `Before ${w.end + 1}` : `${w.start}–${w.end}`;
}

function Signal({ s, cancerLabel }) {
  const b = s.basis;
  return (
    <li className="signal" data-level={s.level}>
      <div className="signalTop">
        <span className="signalLevel">
          {s.level === 'much-lower' ? 'Much lower representation' : 'Lower representation'}
        </span>
        <span className="muted">{s.category}</span>
      </div>
      <h3>{s.title}</h3>
      <p>{s.summary}</p>
      <details>
        <summary>Why this is shown</summary>
        <div className="signalBasis">
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th scope="col">Literature</th>
                  <th scope="col" className="numCell">
                    Matching
                  </th>
                  <th scope="col" className="numCell">
                    All records
                  </th>
                  <th scope="col" className="numCell">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">{cancerLabel}</th>
                  <td className="numCell">
                    <CountLink count={b.count} url={s.url} />
                  </td>
                  <td className="numCell">{fmtInt(b.total)}</td>
                  <td className="numCell">{fmtShare(b.share)}</td>
                </tr>
                <tr>
                  <th scope="row">All oncology</th>
                  <td className="numCell">
                    <CountLink count={b.baselineCount} url={s.baselineUrl} />
                  </td>
                  <td className="numCell">{fmtInt(b.baselineTotal)}</td>
                  <td className="numCell">{fmtShare(b.baselineShare)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="small" style={{ margin: 0 }}>
            Ratio: {fmtShare(b.share)} ÷ {fmtShare(b.baselineShare)} ={' '}
            <strong>{fmtRatio(b.ratio)}</strong>, below the {fmtRatio(b.threshold)} threshold.
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            {s.caution}
          </p>
        </div>
      </details>
    </li>
  );
}

export default function GapAtlasClient() {
  const [cancer, setCancer] = useState('');
  const [state, setState] = useState({ status: 'idle', data: null, error: '' });
  const token = useRef(0);
  const resultsRef = useRef(null);

  const run = useCallback(async (input, { push = true } = {}) => {
    const my = ++token.current;
    setCancer(input);
    setState({ status: 'loading', data: null, error: '' });
    if (push) {
      const url = `/research-gap-atlas?cancer=${encodeURIComponent(input)}`;
      if (url !== window.location.pathname + window.location.search) {
        window.history.pushState(null, '', url);
      }
    }
    track('gap_atlas_search', { cancer_type: input });
    try {
      const data = await postJson('/api/gaps', { cancer: input });
      if (token.current !== my) return;
      setState({ status: 'ok', data, error: '' });
      document.title = `${data.cancer.label} research coverage | Cancer Insight`;
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
      setState({ status: 'error', data: null, error: error.message });
      track('gap_atlas_error', { cancer_type: input });
    }
  }, []);

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
              <h1 id="atlas-title">Research Gap Atlas</h1>
              <p className="lede">
                See which study designs and research themes make up a smaller share of a cancer’s
                PubMed literature than of oncology overall — and check every count yourself.
              </p>
              <CancerSearch
                onSearch={c => run(c)}
                initialValue={cancer}
                buttonLabel="Build atlas"
              />
            </div>
            <aside className="atlasPromise" aria-label="How to read the atlas">
              <p>
                <strong>Shares, not totals.</strong> Large and small literatures are compared by
                proportion, so a common cancer does not look better covered just because it is
                common.
              </p>
              <p>
                <strong>A prompt, not proof.</strong> A lower share can reflect biology,
                epidemiology or indexing rather than neglect. The atlas never claims a real research
                gap.
              </p>
              <p style={{ marginBottom: 0 }}>
                <strong>Reproducible.</strong> Every number opens the PubMed search that produced
                it. <Link href="/methodology#gap-atlas">Read the method</Link>.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <div className="viewBody">
        {state.status === 'idle' && (
          <div className="emptyState">
            <h2>Choose a cancer to build its atlas</h2>
            <p>
              The atlas runs about 45 PubMed count searches. The first run for a cancer usually
              takes 5–15 seconds; results are then cached for a day.
            </p>
          </div>
        )}

        {state.status === 'loading' && (
          <div aria-busy="true" aria-live="polite">
            <p className="loadingLine">
              <span className="spinner" aria-hidden="true" />
              Counting PubMed records for {cancer} and for oncology overall. The first run usually
              takes 5–15 seconds.
            </p>
            <div className="skeleton" style={{ height: 420, marginTop: 16 }} />
          </div>
        )}

        {state.status === 'error' && (
          <div className="emptyState" role="alert">
            <h2>The atlas could not be built</h2>
            <p>{state.error}</p>
            <button
              type="button"
              className="btn btnPrimary"
              onClick={() => run(cancer, { push: false })}
            >
              Try again
            </button>
          </div>
        )}

        {d && (
          <div ref={resultsRef} tabIndex={-1} style={{ outline: 'none' }}>
            <div className="resultIntro">
              <div>
                <h2>{d.cancer.label}: research coverage</h2>
                <p className="muted" style={{ margin: 0 }}>
                  Based on <CountLink count={d.totals.records} url={d.totals.url} />{' '}
                  {lowerFirst(d.cancer.label)} records and{' '}
                  <CountLink count={d.baseline.total} url={d.baseline.url} /> oncology records in
                  PubMed. Generated {fmtDateTime(d.generatedAt)} with method {d.methodVersion}.
                  {d.baseline.source !== 'live' && d.baseline.snapshotDate
                    ? ` Some oncology counts used the ${d.baseline.snapshotDate} reference snapshot because live counts were unavailable.`
                    : ''}
                </p>
              </div>
              <div className="btnRow">
                <button type="button" className="btn btnSecondary btnSmall" onClick={exportCsv}>
                  <Icon name="download" size={16} />
                  Measures CSV
                </button>
                <button type="button" className="btn btnSecondary btnSmall" onClick={exportJson}>
                  <Icon name="download" size={16} />
                  Evidence JSON
                </button>
                <Link
                  className="btn btnQuiet btnSmall"
                  href={`/explore?cancer=${encodeURIComponent(d.cancer.input)}`}
                >
                  Explore the papers
                </Link>
              </div>
            </div>

            <QueryBox term={d.cancer.term} title="PubMed query for this cancer" />

            <section className="section" aria-labelledby="signals-h">
              <div className="sectionHead">
                <div>
                  <h2 id="signals-h">Lower-representation signals</h2>
                  <p className="muted">
                    Measures where this cancer’s share is below {fmtRatio(d.thresholds.lower)} the
                    oncology-wide share.
                  </p>
                </div>
              </div>
              {d.totals.records < d.thresholds.minRecords ? (
                <div className="emptyState">
                  <h3>Too few records to compare</h3>
                  <p>
                    PubMed has {fmtInt(d.totals.records)} records for this query. Below{' '}
                    {fmtInt(d.thresholds.minRecords)} records, shares move too much with a handful
                    of papers to be compared with oncology, so no signals are shown. The counts
                    below are still accurate and can be opened on PubMed.
                  </p>
                </div>
              ) : d.signals.length ? (
                <ul className="signalList">
                  {d.signals.map(s => (
                    <Signal key={s.id} s={s} cancerLabel={d.cancer.label} />
                  ))}
                </ul>
              ) : (
                <div className="emptyState">
                  <h3>No measure fell below the threshold</h3>
                  <p>
                    None of the {d.measures.length} measures is under {fmtRatio(d.thresholds.lower)}{' '}
                    the oncology-wide share. That does not mean this literature has no gaps — only
                    that these measures did not flag any.
                  </p>
                </div>
              )}
              {d.contextNotes.length > 0 && (
                <div className="notice small" style={{ marginTop: 14 }}>
                  {d.contextNotes.map(n => (
                    <p key={n.id}>{n.note}</p>
                  ))}
                </div>
              )}
            </section>

            <section className="section" aria-labelledby="profile-h">
              <div className="sectionHead">
                <div>
                  <h2 id="profile-h">Representation profile</h2>
                  <p className="muted">
                    Each marker is this cancer’s share divided by the oncology-wide share; 1× means
                    the same share. Select a row to open its PubMed search.
                  </p>
                </div>
              </div>
              <div className="panel">
                <ForestPlot
                  rows={d.measures}
                  groups={GROUPS}
                  idPrefix="atlas"
                  title={`${d.cancer.label}: representation relative to oncology`}
                />
              </div>
              <details style={{ marginTop: 12 }}>
                <summary>Show every number as a table</summary>
                <div className="tableWrap" style={{ marginTop: 10 }}>
                  <table className="dataTable">
                    <caption className="visuallyHidden">All measures</caption>
                    <thead>
                      <tr>
                        <th scope="col">Measure</th>
                        <th scope="col" className="numCell">
                          {d.cancer.label}
                        </th>
                        <th scope="col" className="numCell">
                          Share
                        </th>
                        <th scope="col" className="numCell">
                          Oncology
                        </th>
                        <th scope="col" className="numCell">
                          Share
                        </th>
                        <th scope="col" className="numCell">
                          Ratio
                        </th>
                        <th scope="col">Reading</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.measures.map(m => (
                        <tr key={m.id}>
                          <th scope="row">
                            {m.label}
                            <div className="small muted">{m.category}</div>
                          </th>
                          <td className="numCell">
                            <CountLink count={m.count} url={m.url} />
                          </td>
                          <td className="numCell">{fmtShare(m.share)}</td>
                          <td className="numCell">
                            <CountLink count={m.baselineCount} url={m.baselineUrl} />
                          </td>
                          <td className="numCell">{fmtShare(m.baselineShare)}</td>
                          <td className="numCell">{fmtRatio(m.ratio)}</td>
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
              <h2 id="time-h">Records by publication period</h2>
              <p className="muted" style={{ maxWidth: '72ch' }}>
                PubMed records for this cancer in each period. Yearly averages make periods of
                different length comparable. PubMed’s journal coverage has grown over time, so
                rising numbers reflect indexing as well as research activity.
              </p>
              <div className="windowBars">
                {d.timeWindows.map(w => (
                  <div key={w.id} className="windowBar">
                    <span>{periodLabel(w)}</span>
                    <strong>
                      <CountLink count={w.records} url={w.url} />
                    </strong>
                    <span>
                      {w.perYear != null
                        ? `about ${fmtInt(Math.round(w.perYear))} a year`
                        : 'records in total'}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" aria-labelledby="treat-h">
              <h2 id="treat-h">Treatment categories</h2>
              <p className="muted" style={{ maxWidth: '72ch' }}>
                PubMed records that mention each category. These are never flagged as gaps: whether
                a treatment is relevant depends on the biology of each cancer, and more records do
                not mean a better treatment.
              </p>
              <div className="tableWrap">
                <table className="dataTable" style={{ maxWidth: 720 }}>
                  <thead>
                    <tr>
                      <th scope="col">Treatment category</th>
                      <th scope="col" className="numCell">
                        Records
                      </th>
                      <th scope="col" className="numCell">
                        Share of {lowerFirst(d.cancer.label)} records
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.treatments.map(t => (
                      <tr key={t.id}>
                        <th scope="row">{t.label}</th>
                        <td className="numCell">
                          <CountLink count={t.count} url={t.url} />
                        </td>
                        <td className="numCell">{fmtShare(t.share)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="section" aria-labelledby="sample-h">
              <h2 id="sample-h">Evidence behind this atlas</h2>
              <p style={{ maxWidth: '72ch' }}>
                The figures above are counts across all of PubMed. To make the queries inspectable,
                the atlas also draws a small sample of real records. {d.sample.method}
              </p>
              <p className="notice small" style={{ maxWidth: '78ch' }}>
                The sample illustrates and audits the queries. It does not feed any signal, and its
                spread across periods is set by design, not by publication volume.
              </p>
              <div className="tableWrap" style={{ marginTop: 14 }}>
                <table className="dataTable">
                  <caption className="visuallyHidden">Sample retrieval by period</caption>
                  <thead>
                    <tr>
                      <th scope="col">Period</th>
                      <th scope="col" className="numCell">
                        PubMed records
                      </th>
                      <th scope="col" className="numCell">
                        Requested
                      </th>
                      <th scope="col" className="numCell">
                        Retrieved
                      </th>
                      <th scope="col" className="numCell">
                        Kept after relevance check
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.sample.perWindow.map(w => (
                      <tr key={w.id}>
                        <th scope="row">{periodLabel(w)}</th>
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
                <dt>Sampled records with an abstract</dt>
                <dd className="num">
                  {d.sample.stats.withAbstract} of {d.sample.stats.total}
                </dd>
                <dt>With a specific publication type</dt>
                <dd className="num">
                  {d.sample.stats.withSpecificType} of {d.sample.stats.total}
                </dd>
                <dt>With a free full text in PMC</dt>
                <dd className="num">
                  {d.sample.stats.withPmc} of {d.sample.stats.total}
                </dd>
                <dt>With a DOI</dt>
                <dd className="num">
                  {d.sample.stats.withDoi} of {d.sample.stats.total}
                </dd>
                <dt>Retracted</dt>
                <dd className="num">{d.sample.stats.retracted}</dd>
              </dl>
              <details style={{ marginTop: 14 }}>
                <summary>View the {d.sample.papers.length} sampled records</summary>
                <ul className="sampleList">
                  {d.sample.papers.map(p => (
                    <li key={`${p.retrievalWindow}-${p.pmid}`}>
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noopener noreferrer">
                          {p.title || 'Untitled record'}
                        </a>
                      ) : (
                        p.title
                      )}
                      <div className="sampleMeta">
                        <span>{p.evidenceType}</span>
                        {p.retracted && (
                          <span style={{ color: 'var(--rose)', fontWeight: 700 }}>Retracted</span>
                        )}
                        {p.journal && <span>{p.journal}</span>}
                        {p.date && <span>{p.date}</span>}
                        <span>Sampled from the {p.retrievalWindow} period</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            </section>

            <section className="section" aria-labelledby="claims-h">
              <h2 id="claims-h">What this atlas can and cannot claim</h2>
              <div className="claims panel">
                <div>
                  <h3>It can show</h3>
                  <ul>
                    <li>how this cancer’s indexed literature divides across designs and themes;</li>
                    <li>where that division differs markedly from oncology overall;</li>
                    <li>the exact PubMed query and count behind every figure.</li>
                  </ul>
                </div>
                <div>
                  <h3>It cannot show</h3>
                  <ul>
                    <li>that a real scientific or clinical research gap exists;</li>
                    <li>that a topic deserves more research or funding;</li>
                    <li>that any treatment is better, worse or appropriate for anyone.</li>
                  </ul>
                </div>
              </div>
              <details style={{ marginTop: 14 }}>
                <summary>Known limitations</summary>
                <ul style={{ marginTop: 8 }}>
                  {d.limitations.map(l => (
                    <li key={l}>{l}</li>
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
