'use client';

import Link from 'next/link';
import CountLink from '../CountLink';
import EvidenceMix from '../EvidenceMix';
import ShareList from '../ShareList';
import YearChart from '../YearChart';
import Icon from '../Icon';
import { fmtDateTime, fmtInt, fmtShare } from '../../../lib/format';
import { resolveTreatment } from '../../../lib/queries';

const DESIGN_ORDER = [
  'clinical-trial',
  'rct',
  'observational',
  'case-report',
  'review',
  'systematic-review',
  'meta-analysis',
  'guideline',
];

function FeedStatus({ provenance }) {
  const { feed, pubmed } = provenance;
  if (feed.status === 'ok' && !pubmed.used) {
    return (
      <>
        {feed.kept} of the {feed.candidates} newest records from the{' '}
        <a href={feed.url} target="_blank" rel="noopener noreferrer">
          {feed.name}
        </a>{' '}
        passed Cancer Insight’s relevance check.
      </>
    );
  }
  if (feed.status === 'ok' && pubmed.used) {
    return (
      <>
        {feed.kept} relevant records came from the {feed.name}; {pubmed.kept} more are the newest
        PubMed records for this query.
      </>
    );
  }
  const reason =
    {
      'not-covered': 'The research feed does not cover this cancer, so',
      unavailable: 'The research feed could not be reached, so',
      'not-configured': 'The research feed is not configured on this server, so',
      empty: 'The research feed returned no records, so',
    }[feed.status] || 'So';
  return <>{reason} these are the newest PubMed records matching the query above.</>;
}

export default function Overview({ data, footprint, onNavigate }) {
  const fp = footprint.data;
  const p = data.profile;
  const designs = fp
    ? DESIGN_ORDER.map(id => fp.designs.find(d => d.id === id)).filter(Boolean)
    : [];
  const years =
    p.earliestYear && p.latestYear
      ? p.earliestYear === p.latestYear
        ? `${p.latestYear}`
        : `${p.earliestYear}–${p.latestYear}`
      : '—';

  return (
    <div className="overviewGrid">
      <div className="stack">
        <section className="panel" aria-labelledby="footprint-h">
          <h2 id="footprint-h">The whole PubMed literature</h2>
          {footprint.status === 'loading' && (
            <>
              <p className="loadingLine" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                Counting PubMed records year by year…
              </p>
              <div className="skeleton" style={{ height: 200, marginTop: 12 }} />
            </>
          )}
          {footprint.status === 'error' && (
            <p className="notice noticeWarn">
              PubMed counts are unavailable right now: {footprint.error}
            </p>
          )}
          {fp && (
            <>
              <p className="footprintLead">
                <CountLink count={fp.total.count} url={fp.total.url} /> records match this cancer in
                PubMed.
              </p>
              <p className="panelNote">
                Records per publication year, {fp.years[0].year}–{fp.years.at(-1).year}. Each bar
                opens its PubMed search. The hatched bar is the current, incomplete year.
              </p>
              <YearChart years={fp.years} />
              <details className="small" style={{ marginTop: 8 }}>
                <summary>What these counts do and don’t mean</summary>
                <ul style={{ margin: '8px 0 0', paddingLeft: '1.1em' }}>
                  {fp.notes.map(n => (
                    <li key={n}>{n}</li>
                  ))}
                  <li>
                    More records on a topic does not mean better evidence or better treatments.
                  </li>
                </ul>
              </details>
            </>
          )}
        </section>

        {fp && (
          <section className="panel" aria-labelledby="designs-h">
            <h2 id="designs-h">Study designs across PubMed</h2>
            <p className="panelNote">
              Records indexed with each publication type, as a share of all {fmtInt(fp.total.count)}
              . Types overlap (an RCT is also a clinical trial; a systematic review is also a
              review) and many records carry no specific type.
            </p>
            <ShareList rows={designs} />
            {fp.freeFullText?.count != null && (
              <p className="small" style={{ margin: '16px 0 0' }}>
                <CountLink count={fp.freeFullText.count} url={fp.freeFullText.url} /> records (
                {fmtShare(fp.freeFullText.share)}) link to a free full text.
              </p>
            )}
          </section>
        )}
      </div>

      <div className="stack">
        <section className="panel" aria-labelledby="feed-h">
          <h2 id="feed-h">Recent research</h2>
          <p className="panelNote">
            <FeedStatus provenance={data.provenance} /> Retrieved{' '}
            {fmtDateTime(data.provenance.retrievedAt)}.
          </p>
          <h3 className="groupHeading">What kinds of records they are</h3>
          <EvidenceMix byFamily={p.byFamily} total={p.total} />
          <dl className="factList" style={{ marginTop: 16 }}>
            <dt>Published</dt>
            <dd className="num">{years}</dd>
            <dt>With abstract</dt>
            <dd className="num">
              {p.withAbstract} of {p.total}
            </dd>
            <dt>Free full text</dt>
            <dd className="num">
              {p.withPmc} of {p.total}
            </dd>
            <dt>Journals</dt>
            <dd className="num">{p.journalCount}</dd>
            {p.retracted > 0 && (
              <>
                <dt>Retracted</dt>
                <dd className="num" style={{ color: 'var(--rose)', fontWeight: 700 }}>
                  {p.retracted}
                </dd>
              </>
            )}
          </dl>
          {data.treatments.length > 0 && (
            <>
              <h3 className="groupHeading" style={{ marginTop: 18 }}>
                Treatment tags in these records
              </h3>
              <div className="treatmentPicker">
                {data.treatments.map(([t, n]) => (
                  <a
                    key={t}
                    className="chip"
                    href={`/explore?cancer=${encodeURIComponent(data.cancer.input)}&view=treatments&treatment=${encodeURIComponent(t)}`}
                    onClick={e => {
                      e.preventDefault();
                      onNavigate({ view: 'treatments', treatment: t });
                    }}
                  >
                    {resolveTreatment(t)?.label || t}
                    <span className="chipCount">{n}</span>
                  </a>
                ))}
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                Tags come from the research feed and describe these {p.total} records only.
              </p>
            </>
          )}
          <div className="btnRow" style={{ marginTop: 18 }}>
            <button
              type="button"
              className="btn btnPrimary"
              onClick={() => onNavigate({ view: 'papers' })}
            >
              Read the papers
            </button>
          </div>
        </section>

        <section aria-labelledby="next-h">
          <h2 id="next-h" className="visuallyHidden">
            Go further
          </h2>
          <div className="nextSteps">
            <Link
              className="nextStep"
              href={`/research-gap-atlas?cancer=${encodeURIComponent(data.cancer.input)}`}
            >
              <strong>Map research coverage</strong>
              <span>
                See which designs and themes are less represented than across oncology overall.
              </span>
            </Link>
            <button
              type="button"
              className="nextStep"
              style={{ textAlign: 'left', width: '100%', cursor: 'pointer', font: 'inherit' }}
              onClick={() => onNavigate({ view: 'treatments' })}
            >
              <strong>Compare treatment literature</strong>
              <span>How many records, trials and reviews exist for each treatment category.</span>
            </button>
          </div>
        </section>

        <p className="notice small">
          <Icon name="info" size={16} /> Counts describe published research. They are not a measure
          of how well a treatment works and are not medical advice.
        </p>
      </div>
    </div>
  );
}
