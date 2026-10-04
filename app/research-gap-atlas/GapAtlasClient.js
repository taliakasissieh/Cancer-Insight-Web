'use client';

import { useEffect, useMemo, useState } from 'react';

function title(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function trackEvent(name, params = {}) {
  if (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function'
  ) {
    window.gtag('event', name, params);
  }
}

function saveBlob(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function StrengthBadge({ strength }) {
  return (
    <span className={`gapStrength gapStrength-${strength || 'watch'}`}>
      {strength === 'strong'
        ? 'Strong signal'
        : strength === 'moderate'
          ? 'Moderate signal'
          : 'Watch signal'}
    </span>
  );
}

function CoverageBar({ label, count, total, percent, note }) {
  const width = Math.min(100, Math.max(0, Number(percent) || 0));

  return (
    <div className="gapCoverageRow">
      <div className="gapCoverageTop">
        <strong>{label}</strong>
        <span>
          {count}/{total} · {percent}%
        </span>
      </div>

      <div className="gapCoverageTrack" aria-hidden="true">
        <div
          className="gapCoverageFill"
          style={{ width: `${width}%` }}
        />
      </div>

      {note && <div className="gapCoverageNote">{note}</div>}
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div className="gapMetric">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

export default function GapAtlasClient() {
  const [cancer, setCancer] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const initialCancer = params.get('cancer');

    if (initialCancer) {
      setCancer(initialCancer);
      runAnalysis(initialCancer);
    }
  }, []);

  async function runAnalysis(forcedCancer) {
    const query = String(forcedCancer || cancer).trim();

    if (!query) {
      setError('Enter a cancer type to analyze.');
      return;
    }

    setBusy(true);
    setError('');
    setResult(null);

    trackEvent('gap_atlas_search', {
      cancer_type: query.toLowerCase(),
    });

    try {
      const response = await fetch('/api/gaps', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ cancer: query }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error || 'Gap analysis failed.');
      }

      setResult(json);

      if (typeof window !== 'undefined') {
        const next = new URL(window.location.href);
        next.searchParams.set('cancer', query.toLowerCase());
        window.history.replaceState({}, '', next.toString());
      }

      trackEvent('gap_atlas_success', {
        cancer_type: query.toLowerCase(),
        paper_count: json?.dataset?.paperCount || 0,
        signal_count: json?.signals?.length || 0,
      });
    } catch (e) {
      setError(e?.message || 'Something went wrong.');
      trackEvent('gap_atlas_error', {
        cancer_type: query.toLowerCase(),
      });
    } finally {
      setBusy(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    runAnalysis();
  }

  const strongest = useMemo(() => {
    if (!result?.signals) return [];
    return result.signals.filter(x => x.strength === 'strong');
  }, [result]);

  function exportCsv() {
    if (!result) return;

    const rows = [
      [
        'category',
        'signal',
        'strength',
        'summary',
        'matched',
        'total',
        'percent',
        'caution',
      ],
      ...result.signals.map(signal => [
        signal.category,
        signal.title,
        signal.strength,
        signal.summary,
        signal.basis?.matched ?? '',
        signal.basis?.total ?? '',
        signal.basis?.percent ?? '',
        signal.caution,
      ]),
    ];

    const csv = rows
      .map(row => row.map(csvEscape).join(','))
      .join('\n');

    saveBlob(
      `cancer_insight_${result.cancer.replace(/\s+/g, '_')}_gap_atlas.csv`,
      csv,
      'text/csv'
    );

    trackEvent('gap_atlas_export', {
      cancer_type: result.cancer,
      format: 'csv',
    });
  }

  function exportJson() {
    if (!result) return;

    saveBlob(
      `cancer_insight_${result.cancer.replace(/\s+/g, '_')}_gap_atlas.json`,
      JSON.stringify(result, null, 2),
      'application/json'
    );

    trackEvent('gap_atlas_export', {
      cancer_type: result.cancer,
      format: 'json',
    });
  }

  return (
    <main className="gapPage">
      <div className="gapContainer">
        <a className="backLink" href="/">
          ← Back to Cancer Insight
        </a>

        <section className="gapHero">
          <div>
            <div className="gapEyebrow">CANCER INSIGHT EXPERIMENTAL RESEARCH TOOL</div>
            <h1>Cancer Research Gap Atlas</h1>
            <p className="gapLead">
              Explore where research appears thin, concentrated, inaccessible, or
              underrepresented inside a retrieved cancer-literature dataset — with
              every signal explained by transparent rules.
            </p>

            <div className="gapHeroPills">
              <span>Transparent rules</span>
              <span>PubMed-linked evidence</span>
              <span>No treatment ranking</span>
              <span>Exportable results</span>
            </div>
          </div>

          <div className="gapHeroCard">
            <strong>What makes this different?</strong>
            <p>
              Normal search tools show what exists. The Gap Atlas asks a second
              question: <b>what appears underrepresented in the retrieved evidence?</b>
            </p>
            <p>
              It does not claim a true scientific gap automatically. It creates
              reproducible signals that researchers can investigate.
            </p>
          </div>
        </section>

        <section className="gapSearchPanel">
          <form onSubmit={submit} className="gapSearchForm">
            <label>
              Cancer type
              <input
                value={cancer}
                onChange={e => setCancer(e.target.value)}
                placeholder="For example: brain, breast, lung, leukemia..."
              />
            </label>

            <button className="primary" type="submit" disabled={busy}>
              {busy ? 'Building Gap Atlas…' : 'Build Research Gap Atlas'}
            </button>
          </form>

          <p className="gapSearchHint">
            The analysis uses a broader research set than the standard 20-paper
            search and enriches it with treatment-focused PubMed evidence where
            available.
          </p>
        </section>

        {error && <div className="error">{error}</div>}

        {busy && (
          <div className="gapLoading">
            <div className="gapSpinner" />
            <div>
              <strong>Mapping the research landscape…</strong>
              <span>
                Retrieving papers, checking study types, topics, treatment
                distribution, recency, access, and metadata completeness.
              </span>
            </div>
          </div>
        )}

        {result && (
          <>
            <section className="gapResultHeader">
              <div>
                <div className="gapEyebrow">RESEARCH LANDSCAPE</div>
                <h2>{title(result.cancer)} Cancer</h2>
                <p>
                  Analysis generated from {result.dataset.paperCount} unique papers.
                  Signals describe this retrieved dataset only.
                </p>
              </div>

              <div className="gapActions">
                <button className="gapSecondaryButton" onClick={exportCsv}>
                  Export Signals CSV
                </button>
                <button className="gapSecondaryButton" onClick={exportJson}>
                  Export Evidence JSON
                </button>
              </div>
            </section>

            <div className="gapMetricGrid">
              <Metric
                label="Papers analyzed"
                value={result.dataset.paperCount}
                sub={`${result.dataset.confidence} dataset-size label`}
              />
              <Metric
                label="Gap signals"
                value={result.signals.length}
                sub={`${strongest.length} strong signals`}
              />
              <Metric
                label="Treatment categories"
                value={result.dataset.treatmentCount}
                sub="retrieved tags"
              />
              <Metric
                label="Recent papers"
                value={`${result.dataset.recentPercent}%`}
                sub={`${result.dataset.recentStartYear}–present`}
              />
              <Metric
                label="Journals"
                value={result.dataset.journalCount}
                sub="represented"
              />
              <Metric
                label="Year range"
                value={
                  result.dataset.earliestYear && result.dataset.latestYear
                    ? `${result.dataset.earliestYear}–${result.dataset.latestYear}`
                    : '—'
                }
                sub="available metadata"
              />
            </div>

            <section className="gapSection">
              <div className="gapSectionHeading">
                <div>
                  <div className="gapEyebrow">SIGNAL DETECTION</div>
                  <h2>Potential Research Gap Signals</h2>
                </div>
                <a className="sourceButton" href="/methodology#research-gap-atlas">
                  How signals are calculated
                </a>
              </div>

              <div className="gapWarning">
                <b>Important:</b> a signal is not proof of a real-world scientific or
                clinical gap. It means that a predefined type of evidence or topic is
                relatively scarce in this retrieved dataset.
              </div>

              {result.signals.length ? (
                <div className="gapSignalGrid">
                  {result.signals.map(signal => (
                    <article className="gapSignalCard" key={signal.id}>
                      <div className="gapSignalTop">
                        <span className="gapCategory">{signal.category}</span>
                        <StrengthBadge strength={signal.strength} />
                      </div>

                      <h3>{signal.title}</h3>
                      <p>{signal.summary}</p>

                      <details>
                        <summary>Why was this flagged?</summary>
                        <div className="gapDetailsBody">
                          {signal.basis?.total !== undefined && (
                            <p>
                              <b>Dataset basis:</b> {signal.basis.matched} of{' '}
                              {signal.basis.total}
                              {signal.basis.percent !== undefined
                                ? ` (${signal.basis.percent}%)`
                                : ''}
                            </p>
                          )}

                          {signal.basis?.benchmark !== undefined && (
                            <p>
                              <b>Comparison basis:</b> {signal.basis.matched} papers
                              versus {signal.basis.benchmark} for{' '}
                              {title(signal.basis.benchmarkTreatment)}.
                            </p>
                          )}

                          <p className="gapCaution">{signal.caution}</p>
                        </div>
                      </details>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="emptyState">
                  <strong>No predefined low-coverage signals were triggered</strong>
                  <span>
                    This does not mean the research field has no gaps. It only means
                    none of the current transparent rules crossed their thresholds.
                  </span>
                </div>
              )}
            </section>

            <section className="gapTwoCol">
              <div className="gapPanel">
                <div className="gapEyebrow">STUDY DESIGN</div>
                <h2>Study-Type Coverage</h2>
                <p className="muted">
                  Based on publication-type metadata available in the retrieved
                  records.
                </p>

                {result.studyDesign.map(item => (
                  <CoverageBar
                    key={item.id}
                    label={item.label}
                    count={item.count}
                    total={item.total}
                    percent={item.percent}
                  />
                ))}
              </div>

              <div className="gapPanel">
                <div className="gapEyebrow">TOPIC COVERAGE</div>
                <h2>Research Theme Visibility</h2>
                <p className="muted">
                  Keyword signals across titles, abstracts, keywords, and MeSH text.
                </p>

                {result.topics.map(item => (
                  <CoverageBar
                    key={item.id}
                    label={item.label}
                    count={item.count}
                    total={item.total}
                    percent={item.percent}
                  />
                ))}
              </div>
            </section>

            <section className="gapTwoCol">
              <div className="gapPanel">
                <div className="gapEyebrow">TREATMENT LANDSCAPE</div>
                <h2>Retrieved Treatment Distribution</h2>

                {result.treatments.length ? (
                  result.treatments.map(item => {
                    const max = result.treatments[0]?.count || 1;
                    const width = Math.max(2, (item.count / max) * 100);

                    return (
                      <div className="gapTreatmentRow" key={item.name}>
                        <div className="gapTreatmentTop">
                          <span>{title(item.name)}</span>
                          <b>{item.count}</b>
                        </div>
                        <div className="gapCoverageTrack">
                          <div
                            className="gapCoverageFill"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="muted">No treatment tags were available.</p>
                )}
              </div>

              <div className="gapPanel">
                <div className="gapEyebrow">PUBLICATION TIMELINE</div>
                <h2>Research Activity by Year</h2>

                {result.timeline.length ? (
                  <div className="gapTimeline">
                    {result.timeline.slice(-15).map(item => {
                      const max = Math.max(
                        1,
                        ...result.timeline.slice(-15).map(x => x.count)
                      );
                      const height = Math.max(8, (item.count / max) * 100);

                      return (
                        <div className="gapYearColumn" key={item.year}>
                          <span className="gapYearCount">{item.count}</span>
                          <div className="gapYearBarBox">
                            <div
                              className="gapYearBar"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <span className="gapYearLabel">{String(item.year).slice(-2)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="muted">No publication-year data was available.</p>
                )}
              </div>
            </section>

            <section className="gapSection">
              <div className="gapSectionHeading">
                <div>
                  <div className="gapEyebrow">EVIDENCE PROVENANCE</div>
                  <h2>Evidence Behind This Atlas</h2>
                </div>
              </div>

              <div className="gapWarning">
                This is a sampled evidence set, not an exhaustive systematic review.
                V2 combines relevance-ranked records with PubMed records sampled
                across publication-year windows and treatment-focused searches.
              </div>

              <details>
                <summary>
                  View retrieved evidence ({result.evidence?.length || 0} papers)
                </summary>
                <div className="gapDetailsBody">
                  {(result.evidence || []).map((paper, index) => (
                    <p key={paper.id || index}>
                      <b>{paper.title || 'Untitled record'}</b>
                      {paper.date ? ` · ${paper.date}` : ''}
                      {paper.journal ? ` · ${paper.journal}` : ''}
                      {paper.retrievalWindow ? ` · ${paper.retrievalWindow} window` : ''}
                      {paper.url ? (
                        <>
                          {' · '}
                          <a href={paper.url} target="_blank" rel="noreferrer">
                            PubMed
                          </a>
                        </>
                      ) : null}
                    </p>
                  ))}
                </div>
              </details>

              <p className="muted">
                Sampling method: {result.retrieval?.samplingMethod || 'retrieved evidence set'}.
                {' '}Dated records: {result.dataset.datedPaperCount}/{result.dataset.paperCount}.
              </p>
            </section>

            <section className="gapMethodPanel">
              <div>
                <div className="gapEyebrow">TRANSPARENCY FIRST</div>
                <h2>What the Atlas can — and cannot — claim</h2>
              </div>

              <div className="gapMethodGrid">
                <div>
                  <h3>It can show</h3>
                  <ul>
                    <li>which predefined topics appear rarely in the dataset,</li>
                    <li>which study types are uncommon in available metadata,</li>
                    <li>how treatment-tagged literature is distributed,</li>
                    <li>how recent the retrieved literature is, and</li>
                    <li>where access or metadata completeness is limited.</li>
                  </ul>
                </div>

                <div>
                  <h3>It cannot prove</h3>
                  <ul>
                    <li>that the worldwide literature truly lacks research,</li>
                    <li>that a treatment is better or worse,</li>
                    <li>that a low-volume topic deserves more funding,</li>
                    <li>that missing keywords mean a topic was not studied, or</li>
                    <li>what treatment any patient should receive.</li>
                  </ul>
                </div>
              </div>

              <p className="gapMethodFootnote">
                Method version {result.methodVersion}. {result.methodology.datasetNote}
              </p>
            </section>
          </>
        )}

        <footer className="legalFooter">
          <a href="/">Cancer Insight</a>
          <a href="/research-gap-atlas">Research Gap Atlas</a>
          <a href="/methodology">Methodology</a>
          <a href="/faq">FAQ</a>
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/contact">Contact</a>
          <a href="/terms">Terms & Disclaimer</a>
        </footer>
      </div>
    </main>
  );
}
