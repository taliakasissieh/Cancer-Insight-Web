'use client';

import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';

const pages = [
  'Search',
  'Research Papers',
  'Research Analytics',
  'Treatment Research',
  'Compare Treatments',
  'Cancer Images',
  'About'
];

const clean = s =>
  String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const title = s =>
  String(s || '')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

const norm = s =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ');

const arr = x =>
  Array.isArray(x) ? x : x ? [x] : [];

function best(p, k1, k2) {
  return p?.[k1] || p?.[k2] || '';
}

function key(p) {
  return (
    p?.pubmedId ||
    p?.pmid ||
    p?.doi ||
    best(p, 'pubmed_title', 'title') ||
    JSON.stringify(p)
  );
}

function uniquePapers(papers = []) {
  const seen = new Set();

  return papers.filter(p => {
    const k = String(key(p) || '')
      .trim()
      .toLowerCase();

    if (!k) {
      return true;
    }

    if (seen.has(k)) {
      return false;
    }

    seen.add(k);
    return true;
  });
}

function getYear(p) {
  const match =
    String(
      best(
        p,
        'pubmed_date',
        'publicationDate'
      ) || ''
    ).match(/\b(19|20)\d{2}\b/);

  return match
    ? Number(match[0])
    : null;
}

function publicationText(p) {
  return arr(
    p?.publication_types
  )
    .join(' ')
    .toLowerCase();
}

function studyLabels(p) {
  const raw =
    publicationText(p);

  const labels = [];

  if (
    raw.includes(
      'randomized controlled trial'
    )
  ) {
    labels.push(
      'Randomized Controlled Trial'
    );
  } else if (
    raw.includes(
      'clinical trial'
    )
  ) {
    labels.push(
      'Clinical Trial'
    );
  }

  if (
    raw.includes(
      'meta-analysis'
    )
  ) {
    labels.push(
      'Meta-analysis'
    );
  }

  if (
    raw.includes(
      'systematic review'
    )
  ) {
    labels.push(
      'Systematic Review'
    );
  } else if (
    raw.includes(
      'review'
    )
  ) {
    labels.push(
      'Review'
    );
  }

  if (
    raw.includes(
      'observational'
    )
  ) {
    labels.push(
      'Observational Study'
    );
  }

  if (
    raw.includes(
      'comparative study'
    )
  ) {
    labels.push(
      'Comparative Study'
    );
  }

  return [
    ...new Set(labels)
  ];
}

function matchesStudyType(
  p,
  selected
) {
  if (
    selected ===
    'All study types'
  ) {
    return true;
  }

  const raw =
    publicationText(p);

  if (
    selected ===
    'Clinical Trial'
  ) {
    return raw.includes(
      'clinical trial'
    );
  }

  if (
    selected ===
    'Randomized Controlled Trial'
  ) {
    return raw.includes(
      'randomized controlled trial'
    );
  }

  if (
    selected ===
    'Review'
  ) {
    return raw.includes(
      'review'
    );
  }

  if (
    selected ===
    'Systematic Review'
  ) {
    return raw.includes(
      'systematic review'
    );
  }

  if (
    selected ===
    'Meta-analysis'
  ) {
    return raw.includes(
      'meta-analysis'
    );
  }

  return true;
}

function relevanceText(
  p,
  cancer
) {
  const paperTitle =
    clean(
      best(
        p,
        'pubmed_title',
        'title'
      )
    );

  const abstract =
    clean(
      best(
        p,
        'pubmed_abstract',
        'abstract'
      )
    );

  const treatments =
    arr(
      p?.treatmentTypes
    )
      .map(title)
      .filter(Boolean);

  const types =
    studyLabels(p);

  const parts = [];

  if (
    treatments.length
  ) {
    parts.push(
      `This paper is associated with ${treatments
        .slice(0, 3)
        .join(', ')} research.`
    );
  }

  if (
    types.length
  ) {
    parts.push(
      `PubMed metadata identifies it as ${types
        .slice(0, 2)
        .join(' / ')}.`
    );
  }

  const combined =
    `${paperTitle} ${abstract}`
      .toLowerCase();

  if (
    cancer &&
    combined.includes(
      String(cancer)
        .toLowerCase()
    )
  ) {
    parts.push(
      `The retrieved title or abstract directly refers to ${title(cancer)} cancer research.`
    );
  } else if (
    abstract
  ) {
    parts.push(
      'The abstract contains research context returned for the current cancer search.'
    );
  }

  if (!parts.length) {
    return (
      'This paper was returned as part of the current Cancer Insight research search. Review the original source for full scientific context.'
    );
  }

  return parts.join(' ');
}

function trackEvent(
  name,
  params = {}
) {
  if (
    typeof window !==
      'undefined' &&
    typeof window.gtag ===
      'function'
  ) {
    window.gtag(
      'event',
      name,
      params
    );
  }
}

function SiteFooter() {
  const trackedLink = (
    href,
    label,
    eventName
  ) => (
    <a
      href={href}
      onClick={() =>
        trackEvent(
          eventName,
          {
            link_text:
              label,
            link_url:
              href,
            location:
              'site_footer'
          }
        )
      }
    >
      {label}
    </a>
  );

  return (
    <footer className="legalFooter">
      {trackedLink(
        '/',
        'Cancer Insight',
        'footer_home_click'
      )}

      {trackedLink(
        '/methodology',
        'Methodology',
        'methodology_click'
      )}

      {trackedLink(
        '/faq',
        'FAQ',
        'faq_click'
      )}

      {trackedLink(
        '/privacy-policy',
        'Privacy Policy',
        'privacy_policy_click'
      )}

      {trackedLink(
        '/contact',
        'Contact',
        'contact_click'
      )}

      {trackedLink(
        '/terms',
        'Terms & Disclaimer',
        'terms_click'
      )}
    </footer>
  );
}

function EmptyState({
  titleText,
  body
}) {
  return (
    <div className="emptyState">
      <strong>
        {titleText}
      </strong>

      <span>
        {body}
      </span>
    </div>
  );
}

function StudyBadges({
  p
}) {
  const labels =
    studyLabels(p);

  if (
    !labels.length
  ) {
    return null;
  }

  return (
    <>
      {labels.map(
        label => {
          let className =
            'badge studyBadge';

          if (
            label.includes(
              'Trial'
            )
          ) {
            className =
              'badge trialBadge';
          }

          if (
            label ===
            'Review' ||
            label ===
            'Systematic Review'
          ) {
            className =
              'badge reviewBadge';
          }

          if (
            label ===
            'Meta-analysis'
          ) {
            className =
              'badge metaBadge';
          }

          return (
            <span
              className={
                className
              }
              key={label}
            >
              {label}
            </span>
          );
        }
      )}
    </>
  );
}

function Paper({
  p,
  n,
  saved,
  toggle,
  cancer
}) {
  const [
    expanded,
    setExpanded
  ] =
    useState(false);

  const t =
    best(
      p,
      'pubmed_title',
      'title'
    ) ||
    'Untitled research paper';

  const rawAbstract =
    best(
      p,
      'pubmed_abstract',
      'abstract'
    );

  const a =
    clean(rawAbstract);

  const j =
    best(
      p,
      'pubmed_journal',
      'journal'
    );

  const d =
    best(
      p,
      'pubmed_date',
      'publicationDate'
    );

  const authors =
    Array.isArray(
      p?.pubmed_authors
    )
      ? p.pubmed_authors.join(
          ', '
        )
      : p?.pubmed_authors;

  const treatments =
    arr(
      p?.treatmentTypes
    )
      .map(title)
      .join(', ');

  const longAbstract =
    a.length >
    720;

  const visibleAbstract =
    longAbstract &&
    !expanded
      ? `${a
          .slice(
            0,
            720
          )
          .trim()}…`
      : a;

  const paperId =
    String(
      p?.pubmedId ||
      p?.pmid ||
      p?.doi ||
      ''
    );

  const relevance =
    relevanceText(
      p,
      cancer
    );

  const trackSource =
    source => {
      trackEvent(
        'research_source_click',
        {
          source_type:
            source,

          paper_title:
            t.slice(
              0,
              100
            ),

          paper_id:
            paperId
        }
      );
    };

  return (
    <article
      className={
        'paperCard ' +
        (
          saved
            ? 'savedPaper'
            : ''
        )
      }
    >
      <div className="paperTop">
        <div className="paperHeading">
          <div className="paperNumber">
            {n
              ? `Paper ${n}`
              : 'Research paper'}
          </div>

          <h3 className="paperTitle">
            {t}
          </h3>
        </div>

        <button
          className={
            'saveButton ' +
            (
              saved
                ? 'savedActive'
                : ''
            )
          }
          onClick={() =>
            toggle(
              key(p),
              p,
              saved
            )
          }
          type="button"
        >
          {saved
            ? '★ Saved'
            : '☆ Save'}
        </button>
      </div>

      <div className="paperMeta">
        {j && (
          <span>
            {j}
          </span>
        )}

        {d && (
          <span>
            {d}
          </span>
        )}

        {authors && (
          <span className="paperAuthors">
            {authors}
          </span>
        )}
      </div>

      <div className="paperBadges">
        {p?.pmc_id && (
          <span className="badge free">
            Free full text in PMC
          </span>
        )}

        {a && (
          <span className="badge abstract">
            PubMed abstract
          </span>
        )}

        {(p?.pmc_url ||
          p?.publisher_url) && (
          <span className="badge link">
            Full-text source
          </span>
        )}

        <StudyBadges
          p={p}
        />
      </div>

      {relevance && (
        <div className="relevanceBox">
          <strong>
            Why this paper is relevant
          </strong>

          <p>
            {relevance}
          </p>
        </div>
      )}

      {a && (
        <div className="abstractBox">
          <div className="abstractLabel">
            Abstract
          </div>

          <p>
            {visibleAbstract}
          </p>

          {longAbstract && (
            <button
              type="button"
              className="textButton"
              onClick={() => {
                const next =
                  !expanded;

                setExpanded(
                  next
                );

                trackEvent(
                  next
                    ? 'abstract_expand'
                    : 'abstract_collapse',
                  {
                    paper_title:
                      t.slice(
                        0,
                        100
                      ),

                    paper_id:
                      paperId
                  }
                );
              }}
            >
              {expanded
                ? 'Show less'
                : 'Show full abstract'}
            </button>
          )}
        </div>
      )}

      {treatments && (
        <div className="treatmentMention">
          <b>
            Treatments mentioned:
          </b>{' '}
          {treatments}
        </div>
      )}

      <div className="paperActions">
        {p?.pubmed_url && (
          <a
            className="sourceButton sourcePrimary"
            href={
              p.pubmed_url
            }
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              trackSource(
                'pubmed'
              )
            }
          >
            PubMed
          </a>
        )}

        {p?.pmc_url && (
          <a
            className="sourceButton"
            href={
              p.pmc_url
            }
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              trackSource(
                'pubmed_central'
              )
            }
          >
            Free Full Text
          </a>
        )}

        {p?.publisher_url && (
          <a
            className="sourceButton"
            href={
              p.publisher_url
            }
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              trackSource(
                'publisher'
              )
            }
          >
            Publisher
          </a>
        )}

        {p?.doi && (
          <span className="doiText">
            DOI: {p.doi}
          </span>
        )}
      </div>
    </article>
  );
}

function Metrics({
  p,
  tcount
}) {
  const vals = [
    [
      'Research papers',
      p?.paper_count ??
        0
    ],

    [
      'Free full text',
      p?.free_full_text_count ??
        0
    ],

    [
      'Latest year',
      p?.latest_year ||
        '—'
    ],

    [
      'Journals',
      p?.journals
        ?.length ||
        p?.journal_count ||
        0
    ],

    [
      'Clinical trials',
      p?.clinical_trials ||
        0
    ],

    [
      'Treatment types',
      tcount ?? '—'
    ]
  ];

  return (
    <div className="grid6">
      {vals.map(
        ([
          a,
          b
        ]) => (
          <div
            className="metric"
            key={a}
          >
            <span className="muted">
              {a}
            </span>

            <div className="num">
              {b}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function Bars({
  items = []
}) {
  const safeItems =
    Array.isArray(
      items
    )
      ? items
      : [];

  const max =
    Math.max(
      1,
      ...safeItems.map(
        x =>
          Number(
            x?.[1]
          ) ||
          0
      )
    );

  if (
    !safeItems.length
  ) {
    return (
      <EmptyState
        titleText="No analytics available"
        body="No matching research data was available for this chart."
      />
    );
  }

  return (
    <div className="panel chartPanel">
      {safeItems.map(
        ([
          k,
          v
        ]) => (
          <div
            className="barrow"
            key={
              String(k)
            }
          >
            <div className="barlabel">
              {title(k)}
            </div>

            <div className="barTrack">
              <div
                className="bar"
                style={{
                  width:
                    `${
                      Number(v)
                        ? Math.max(
                            3,
                            (
                              Number(
                                v
                              ) /
                              max
                            ) *
                              100
                          )
                        : 0
                    }%`
                }}
              />
            </div>

            <b>
              {v}
            </b>
          </div>
        )
      )}
    </div>
  );
}

export default function App() {
  const [
    page,
    setPage
  ] =
    useState(
      'Search'
    );

  const [
    input,
    setInput
  ] =
    useState('');

  const [
    data,
    setData
  ] =
    useState(null);

  const [
    error,
    setError
  ] =
    useState('');

  const [
    notice,
    setNotice
  ] =
    useState('');

  const [
    busy,
    setBusy
  ] =
    useState(false);

  const [
    bookmarks,
    setBookmarks
  ] =
    useState([]);

  const [
    images,
    setImages
  ] =
    useState([]);

  useEffect(() => {
    try {
      setBookmarks(
        JSON.parse(
          localStorage.getItem(
            'ci-bookmarks'
          ) || '[]'
        )
      );
    } catch {
      setBookmarks([]);
    }
  }, []);

  const toggle = (
    k,
    p,
    wasSaved
  ) =>
    setBookmarks(
      b => {
        const n =
          b.includes(k)
            ? b.filter(
                x =>
                  x !== k
              )
            : [
                ...b,
                k
              ];

        localStorage.setItem(
          'ci-bookmarks',
          JSON.stringify(
            n
          )
        );

        trackEvent(
          wasSaved
            ? 'paper_unsaved'
            : 'paper_saved',
          {
            paper_title:
              String(
                best(
                  p,
                  'pubmed_title',
                  'title'
                ) ||
                ''
              ).slice(
                0,
                100
              ),

            paper_id:
              String(
                p?.pubmedId ||
                p?.pmid ||
                p?.doi ||
                ''
              )
          }
        );

        return n;
      }
    );

  function changePage(
    p
  ) {
    setPage(p);

    trackEvent(
      'navigation_click',
      {
        section_name:
          p
      }
    );

    if (
      typeof window !==
      'undefined'
    ) {
      window.scrollTo(
        0,
        0
      );
    }
  }

  async function search(
    e
  ) {
    e.preventDefault();

    setError('');
    setNotice('');
    setData(null);
    setImages([]);

    const q =
      input.trim();

    if (!q) {
      setError(
        'Enter a cancer type to search.'
      );

      return;
    }

    setBusy(true);

    trackEvent(
      'cancer_search',
      {
        cancer_type:
          q.toLowerCase()
      }
    );

    try {
      const r =
        await fetch(
          '/api/search',
          {
            method:
              'POST',

            headers: {
              'content-type':
                'application/json'
            },

            body:
              JSON.stringify(
                {
                  cancer:
                    q.toLowerCase()
                }
              )
          }
        );

      const j =
        await r.json();

      if (!r.ok) {
        throw Error(
          j?.error ||
          'Search failed.'
        );
      }

      setData(j);

      const count =
        uniquePapers(
          j?.papers ||
          []
        ).length;

      setNotice(
        `Found ${count} unique papers for ${title(q)}.`
      );

      trackEvent(
        'cancer_search_success',
        {
          cancer_type:
            q.toLowerCase(),

          result_count:
            count,

          treatment_count:
            j?.treatments
              ?.length ||
            0
        }
      );
    } catch (e) {
      setError(
        e?.message ||
        'Something went wrong.'
      );

      trackEvent(
        'cancer_search_error',
        {
          cancer_type:
            q.toLowerCase(),

          error_message:
            String(
              e?.message ||
              'unknown'
            ).slice(
              0,
              100
            )
        }
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandrow">
            <div className="mark">
              ✚
            </div>

            <strong>
              Cancer Insight
            </strong>
          </div>

          <small>
            Evidence-first cancer research explorer
          </small>
        </div>

        <div className="nav">
          {pages.map(
            p => (
              <button
                className={
                  page ===
                  p
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  changePage(
                    p
                  )
                }
                key={p}
              >
                <span className="navDot">
                  ●
                </span>

                {p}
              </button>
            )
          )}
        </div>

        {data && (
          <div className="sideinfo dataSummary">
            <b>
              {title(
                data.cancer
              )}{' '}
              cancer
            </b>

            <br />

            {
              uniquePapers(
                data.papers ||
                []
              ).length
            }{' '}
            unique papers ·{' '}
            {
              data
                .treatments
                ?.length ||
              0
            }{' '}
            treatment types

            <br />

            {
              data.profile
                ?.free_full_text_count ||
              0
            }{' '}
            free full-text in PMC
          </div>
        )}

        <div className="sideinfo">
          Educational use only. Not medical advice.

          <div className="legalLinks">
            <a
              href="/methodology"
              onClick={() =>
                trackEvent(
                  'methodology_click',
                  {
                    location:
                      'sidebar'
                  }
                )
              }
            >
              Methodology
            </a>

            <a
              href="/faq"
              onClick={() =>
                trackEvent(
                  'faq_click',
                  {
                    location:
                      'sidebar'
                  }
                )
              }
            >
              FAQ
            </a>

            <a
              href="/privacy-policy"
              onClick={() =>
                trackEvent(
                  'privacy_policy_click',
                  {
                    location:
                      'sidebar'
                  }
                )
              }
            >
              Privacy Policy
            </a>

            <a
              href="/contact"
              onClick={() =>
                trackEvent(
                  'contact_click',
                  {
                    location:
                      'sidebar'
                  }
                )
              }
            >
              Contact
            </a>

            <a
              href="/terms"
              onClick={() =>
                trackEvent(
                  'terms_click',
                  {
                    location:
                      'sidebar'
                  }
                )
              }
            >
              Terms & Disclaimer
            </a>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="content">
          {page ===
            'Search' && (
            <Search
              input={
                input
              }
              setInput={
                setInput
              }
              search={
                search
              }
              data={
                data
              }
              error={
                error
              }
              notice={
                notice
              }
              busy={
                busy
              }
            />
          )}

          {page ===
            'Research Papers' && (
            <Research
              data={
                data
              }
              bookmarks={
                bookmarks
              }
              toggle={
                toggle
              }
            />
          )}

          {page ===
            'Research Analytics' && (
            <Analytics
              data={
                data
              }
            />
          )}

          {page ===
            'Treatment Research' && (
            <Treatment
              data={
                data
              }
              bookmarks={
                bookmarks
              }
              toggle={
                toggle
              }
            />
          )}

          {page ===
            'Compare Treatments' && (
            <Compare
              data={
                data
              }
            />
          )}

          {page ===
            'Cancer Images' && (
            <Images
              data={
                data
              }
              images={
                images
              }
              setImages={
                setImages
              }
            />
          )}

          {page ===
            'About' && (
            <About />
          )}

          <div className="disclaimer">
            <b>
              Educational use only.
            </b>{' '}
            Cancer Insight does not provide medical diagnosis,
            individualized treatment recommendations, or professional
            medical advice.
          </div>

          <SiteFooter />
        </div>
      </main>
    </div>
  );
}

function Need() {
  return (
    <div className="panel needPanel">
      <div className="needIcon">
        ⌕
      </div>

      <div>
        <b>
          Search a cancer type first
        </b>

        <p>
          Start a search to unlock research papers, treatment evidence,
          analytics, comparisons, and scientific images.
        </p>
      </div>
    </div>
  );
}

function Search({
  input,
  setInput,
  search,
  data,
  error,
  notice,
  busy
}) {
  const uniqueCount =
    data
      ? uniquePapers(
          data.papers ||
          []
        ).length
      : 0;

  return (
    <>
      <section className="hero">
        <div className="eyebrow">
          Evidence-First Cancer Research Explorer
        </div>

        <h1>
          Cancer Insight
        </h1>

        <h2 className="heroSubtitle">
          Explore Cancer Research and Treatment Evidence
        </h2>

        <p>
          Search cancer research papers, PubMed studies, treatment evidence,
          oncology research, analytics, and free full-text scientific studies
          while keeping original research sources visible.
        </p>

        <div className="sourcePills">
          <span>
            PubMed
          </span>

          <span>
            PubMed Central
          </span>

          <span>
            DOI Sources
          </span>

          <span>
            Publisher Sources
          </span>
        </div>
      </section>

      <div className="homeFeatures">
        <div className="featureCard">
          <div className="featureIcon">
            ⌕
          </div>

          <h3>
            Search Research
          </h3>

          <p>
            Find papers, abstracts, journals, study types, dates, and
            scientific sources by cancer type.
          </p>
        </div>

        <div className="featureCard">
          <div className="featureIcon">
            ▥
          </div>

          <h3>
            Explore Evidence
          </h3>

          <p>
            Review treatment research, publication trends, trials, reviews,
            journals, and analytics.
          </p>
        </div>

        <div className="featureCard">
          <div className="featureIcon">
            ⇄
          </div>

          <h3>
            Compare Treatments
          </h3>

          <p>
            Compare retrieved research coverage without treating paper counts
            as medical recommendations.
          </p>
        </div>
      </div>

      <section className="panel searchPanel">
        <div className="searchIntro">
          <div className="eyebrow darkEyebrow">
            Start Exploring
          </div>

          <h2>
            Search Cancer Research
          </h2>

          <p className="muted">
            Enter a cancer type to explore research papers, treatments,
            analytics, scientific images, study types, and PubMed evidence.
          </p>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {notice && (
          <div className="success">
            {notice}
          </div>
        )}

        <form
          onSubmit={
            search
          }
          className="searchForm"
        >
          <label>
            Cancer type

            <input
              value={
                input
              }
              onChange={
                e =>
                  setInput(
                    e.target
                      .value
                  )
              }
              placeholder="For example: lung, breast, leukemia..."
            />
          </label>

          <button
            className="primary"
            disabled={
              busy
            }
          >
            {busy
              ? 'Searching PubMed…'
              : 'Search Cancer Research'}
          </button>
        </form>

        <div className="searchHint">
          Try: <b>lung</b>, <b>breast</b>, <b>leukemia</b>,
          <b> melanoma</b>, or <b>pancreatic</b>.
        </div>
      </section>

      <section className="trustPanel">
        <div>
          <strong>
            Original scientific sources stay visible
          </strong>

          <p>
            Cancer Insight connects results with PubMed, PubMed Central, DOI,
            and publisher pages whenever source information is available.
          </p>
        </div>

        <div className="trustBadge">
          ✓ Evidence-first
        </div>
      </section>

      {data && (
        <>
          <div className="resultsHeading">
            <div>
              <div className="eyebrow darkEyebrow">
                Search Results
              </div>

              <h2>
                {title(
                  data.cancer
                )}{' '}
                Cancer Research Highlights
              </h2>
            </div>

            <p className="muted">
              {uniqueCount} unique research papers in this search.
            </p>
          </div>

          <Metrics
            p={{
              ...data.profile,
              paper_count:
                uniqueCount
            }}
            tcount={
              data
                .treatments
                ?.length ||
              0
            }
          />

          <h3>
            Treatment Research Coverage
          </h3>

          <Bars
            items={
              data.treatments ||
              []
            }
          />

          <div className="panel resultHelp">
            <b>
              Continue exploring
            </b>

            <p>
              Open Research Papers for advanced filters, or explore Analytics,
              Treatment Research, Compare Treatments, and Cancer Images.
            </p>
          </div>
        </>
      )}
    </>
  );
}

function Research({
  data,
  bookmarks,
  toggle
}) {
  const [
    q,
    setQ
  ] =
    useState('');

  const [
    access,
    setAccess
  ] =
    useState(
      'All'
    );

  const [
    tr,
    setTr
  ] =
    useState(
      'All treatments'
    );

  const [
    studyType,
    setStudyType
  ] =
    useState(
      'All study types'
    );

  const [
    fromYear,
    setFromYear
  ] =
    useState(
      'Any'
    );

  const [
    toYear,
    setToYear
  ] =
    useState(
      'Any'
    );

  const [
    sort,
    setSort
  ] =
    useState(
      'Original relevance'
    );

  const [
    saved,
    setSaved
  ] =
    useState(false);

  useEffect(() => {
    setQ('');
    setAccess('All');
    setTr(
      'All treatments'
    );
    setStudyType(
      'All study types'
    );
    setFromYear(
      'Any'
    );
    setToYear(
      'Any'
    );
    setSort(
      'Original relevance'
    );
    setSaved(false);
  }, [
    data?.cancer
  ]);

  const basePapers =
    useMemo(
      () =>
        data
          ? uniquePapers(
              data.papers ||
              []
            )
          : [],
      [data]
    );

  const years =
    useMemo(
      () =>
        [
          ...new Set(
            basePapers
              .map(
                getYear
              )
              .filter(
                Boolean
              )
          )
        ].sort(
          (
            a,
            b
          ) =>
            b - a
        ),
      [
        basePapers
      ]
    );

  const papers =
    useMemo(() => {
      if (!data) {
        return [];
      }

      let x = [
        ...basePapers
      ];

      if (q) {
        const needle =
          q.toLowerCase();

        x =
          x.filter(
            p =>
              [
                best(
                  p,
                  'pubmed_title',
                  'title'
                ),

                best(
                  p,
                  'pubmed_abstract',
                  'abstract'
                ),

                best(
                  p,
                  'pubmed_journal',
                  'journal'
                ),

                p?.mesh_terms,

                arr(
                  p?.publication_types
                ).join(
                  ' '
                )
              ]
                .join(
                  ' '
                )
                .toLowerCase()
                .includes(
                  needle
                )
          );
      }

      if (
        access ===
        'Free full text in PMC'
      ) {
        x =
          x.filter(
            p =>
              p?.pmc_id
          );
      }

      if (
        access ===
        'Has abstract'
      ) {
        x =
          x.filter(
            p =>
              best(
                p,
                'pubmed_abstract',
                'abstract'
              )
          );
      }

      if (
        access ===
        'Has full-text link'
      ) {
        x =
          x.filter(
            p =>
              p?.pmc_url ||
              p?.publisher_url
          );
      }

      if (
        tr !==
        'All treatments'
      ) {
        x =
          x.filter(
            p =>
              arr(
                p?.treatmentTypes
              )
                .map(
                  norm
                )
                .includes(
                  norm(
                    tr
                  )
                )
          );
      }

      if (
        studyType !==
        'All study types'
      ) {
        x =
          x.filter(
            p =>
              matchesStudyType(
                p,
                studyType
              )
          );
      }

      if (
        fromYear !==
        'Any'
      ) {
        x =
          x.filter(
            p => {
              const y =
                getYear(
                  p
                );

              return (
                y &&
                y >=
                  Number(
                    fromYear
                  )
              );
            }
          );
      }

      if (
        toYear !==
        'Any'
      ) {
        x =
          x.filter(
            p => {
              const y =
                getYear(
                  p
                );

              return (
                y &&
                y <=
                  Number(
                    toYear
                  )
              );
            }
          );
      }

      if (saved) {
        x =
          x.filter(
            p =>
              bookmarks.includes(
                key(p)
              )
          );
      }

      if (
        sort ===
        'Newest first'
      ) {
        x.sort(
          (
            a,
            b
          ) =>
            (
              getYear(
                b
              ) ||
              0
            ) -
            (
              getYear(
                a
              ) ||
              0
            )
        );
      }

      if (
        sort ===
        'Oldest first'
      ) {
        x.sort(
          (
            a,
            b
          ) =>
            (
              getYear(
                a
              ) ||
              9999
            ) -
            (
              getYear(
                b
              ) ||
              9999
            )
        );
      }

      if (
        sort ===
        'Free full text first'
      ) {
        x.sort(
          (
            a,
            b
          ) =>
            Number(
              !!b?.pmc_id
            ) -
            Number(
              !!a?.pmc_id
            )
        );
      }

      return x;
    }, [
      data,
      basePapers,
      q,
      access,
      tr,
      studyType,
      fromYear,
      toYear,
      sort,
      saved,
      bookmarks
    ]);

  if (!data) {
    return (
      <>
        <div className="pageHeader">
          <div className="eyebrow darkEyebrow">
            Research Library
          </div>

          <h1>
            Research Papers
          </h1>
        </div>

        <Need />
      </>
    );
  }

  function clearFilters() {
    setQ('');
    setAccess('All');
    setTr(
      'All treatments'
    );
    setStudyType(
      'All study types'
    );
    setFromYear(
      'Any'
    );
    setToYear(
      'Any'
    );
    setSort(
      'Original relevance'
    );
    setSaved(false);

    trackEvent(
      'research_filters_cleared',
      {
        cancer_type:
          data.cancer
      }
    );
  }

  const activeFilters =
    [];

  if (q) {
    activeFilters.push(
      `Text: ${q}`
    );
  }

  if (
    access !==
    'All'
  ) {
    activeFilters.push(
      access
    );
  }

  if (
    tr !==
    'All treatments'
  ) {
    activeFilters.push(
      `Treatment: ${title(tr)}`
    );
  }

  if (
    studyType !==
    'All study types'
  ) {
    activeFilters.push(
      studyType
    );
  }

  if (
    fromYear !==
    'Any'
  ) {
    activeFilters.push(
      `From ${fromYear}`
    );
  }

  if (
    toYear !==
    'Any'
  ) {
    activeFilters.push(
      `To ${toYear}`
    );
  }

  if (saved) {
    activeFilters.push(
      'Saved papers'
    );
  }

  function csv() {
    const cols = [
      'pubmedId',
      'pubmed_title',
      'pubmed_journal',
      'pubmed_date',
      'pubmed_authors',
      'publication_types',
      'treatmentTypes',
      'pubmed_url',
      'pmc_url',
      'doi',
      'pubmed_abstract'
    ];

    const esc =
      v =>
        '"' +
        String(
          Array.isArray(
            v
          )
            ? v.join(
                '; '
              )
            : v ??
              ''
        ).replaceAll(
          '"',
          '""'
        ) +
        '"';

    trackEvent(
      'csv_download',
      {
        cancer_type:
          data.cancer,

        paper_count:
          papers.length,

        export_type:
          'research_papers'
      }
    );

    download(
      'cancer_insight_' +
        data.cancer.replaceAll(
          ' ',
          '_'
        ) +
        '_papers.csv',

      [
        cols.join(
          ','
        ),

        ...papers.map(
          p =>
            cols
              .map(
                c =>
                  esc(
                    p?.[c]
                  )
              )
              .join(
                ','
              )
        )
      ].join(
        '\n'
      ),

      'text/csv'
    );
  }

  function makePdf() {
    trackEvent(
      'pdf_download',
      {
        cancer_type:
          data.cancer,

        paper_count:
          papers.length,

        report_location:
          'research_papers'
      }
    );

    pdfReport(
      data.cancer,
      papers,
      data.treatments
    );
  }

  return (
    <>
      <div className="pageHeader">
        <div className="eyebrow darkEyebrow">
          Research Library
        </div>

        <h1>
          Research Papers
        </h1>

        <p className="muted">
          {title(
            data.cancer
          )}{' '}
          · filter unique research papers by access, treatment, study type,
          year range, and saved status.
        </p>
      </div>

      <div className="panel filterPanel">
        <div className="filters filtersMain">
          <label className="filterSearch">
            Search titles, abstracts, journals, study types, or MeSH terms

            <input
              value={q}
              onChange={
                e =>
                  setQ(
                    e.target
                      .value
                  )
              }
              placeholder="Filter papers..."
            />
          </label>

          <label>
            Access

            <select
              value={
                access
              }
              onChange={
                e =>
                  setAccess(
                    e.target
                      .value
                  )
              }
            >
              {[
                'All',
                'Free full text in PMC',
                'Has abstract',
                'Has full-text link'
              ].map(
                x => (
                  <option
                    key={
                      x
                    }
                  >
                    {x}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Treatment

            <select
              value={tr}
              onChange={
                e =>
                  setTr(
                    e.target
                      .value
                  )
              }
            >
              {[
                'All treatments',

                ...(
                  data.treatments ||
                  []
                ).map(
                  x =>
                    x[0]
                )
              ].map(
                x => (
                  <option
                    key={
                      x
                    }
                  >
                    {x}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <div className="filtersAdvanced">
          <label>
            Study type

            <select
              value={
                studyType
              }
              onChange={
                e => {
                  setStudyType(
                    e.target
                      .value
                  );

                  trackEvent(
                    'study_type_filter',
                    {
                      cancer_type:
                        data.cancer,

                      study_type:
                        e.target
                          .value
                    }
                  );
                }
              }
            >
              <option>
                All study types
              </option>

              <option>
                Clinical Trial
              </option>

              <option>
                Randomized Controlled Trial
              </option>

              <option>
                Review
              </option>

              <option>
                Systematic Review
              </option>

              <option>
                Meta-analysis
              </option>
            </select>
          </label>

          <div className="yearRange">
            <label>
              From year

              <select
                value={
                  fromYear
                }
                onChange={
                  e =>
                    setFromYear(
                      e.target
                        .value
                    )
                }
              >
                <option>
                  Any
                </option>

                {[
                  ...years
                ]
                  .sort(
                    (
                      a,
                      b
                    ) =>
                      a - b
                  )
                  .map(
                    y => (
                      <option
                        key={
                          y
                        }
                      >
                        {y}
                      </option>
                    )
                  )}
              </select>
            </label>

            <label>
              To year

              <select
                value={
                  toYear
                }
                onChange={
                  e =>
                    setToYear(
                      e.target
                        .value
                    )
                }
              >
                <option>
                  Any
                </option>

                {years.map(
                  y => (
                    <option
                      key={
                        y
                      }
                    >
                      {y}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <label>
            Sort by

            <select
              value={
                sort
              }
              onChange={
                e =>
                  setSort(
                    e.target
                      .value
                  )
              }
            >
              <option>
                Original relevance
              </option>

              <option>
                Newest first
              </option>

              <option>
                Oldest first
              </option>

              <option>
                Free full text first
              </option>
            </select>
          </label>
        </div>

        <div className="filters filtersSecondary">
          <label className="savedFilter">
            <input
              type="checkbox"
              checked={
                saved
              }
              onChange={
                e => {
                  setSaved(
                    e.target
                      .checked
                  );

                  trackEvent(
                    'saved_filter_toggle',
                    {
                      enabled:
                        e.target
                          .checked
                    }
                  );
                }
              }
            />

            <span>
              Show saved papers only
            </span>
          </label>

          <div />

          <button
            type="button"
            className="toolbarButton secondaryToolbarButton"
            onClick={
              clearFilters
            }
          >
            Clear Filters
          </button>
        </div>

        {activeFilters.length >
          0 && (
          <div className="filterSummary">
            {activeFilters.map(
              item => (
                <span
                  className="filterChip"
                  key={
                    item
                  }
                >
                  {item}
                </span>
              )
            )}
          </div>
        )}
      </div>

      <div className="researchToolbar">
        <div className="toolbar">
          <button
            className="toolbarButton"
            onClick={
              makePdf
            }
          >
            Download PDF Report
          </button>

          <button
            className="toolbarButton secondaryToolbarButton"
            onClick={
              csv
            }
          >
            Export Raw Data (CSV)
          </button>
        </div>

        <div className="paperCount">
          Showing{' '}
          <b>
            {papers.length}
          </b>{' '}
          of{' '}
          <b>
            {basePapers.length}
          </b>{' '}
          unique papers
        </div>
      </div>

      {!papers.length ? (
        <EmptyState
          titleText="No papers match these filters"
          body="Try clearing one or more filters to show more research papers."
        />
      ) : (
        papers.map(
          (
            p,
            i
          ) => (
            <Paper
              p={p}
              n={
                i + 1
              }
              saved={
                bookmarks.includes(
                  key(
                    p
                  )
                )
              }
              toggle={
                toggle
              }
              cancer={
                data.cancer
              }
              key={
                key(
                  p
                ) + i
              }
            />
          )
        )
      )}
    </>
  );
}

function Analytics({
  data
}) {
  if (!data) {
    return (
      <>
        <div className="pageHeader">
          <div className="eyebrow darkEyebrow">
            Evidence Overview
          </div>

          <h1>
            Research Analytics
          </h1>
        </div>

        <Need />
      </>
    );
  }

  const unique =
    uniquePapers(
      data.papers ||
      []
    );

  const calculated =
    simpleProfile(
      unique
    );

  function makePdf() {
    trackEvent(
      'pdf_download',
      {
        cancer_type:
          data.cancer,

        paper_count:
          unique.length,

        report_location:
          'research_analytics'
      }
    );

    pdfReport(
      data.cancer,
      unique,
      data.treatments
    );
  }

  function exportTreatments() {
    trackEvent(
      'csv_download',
      {
        cancer_type:
          data.cancer,

        export_type:
          'treatment_counts'
      }
    );

    download(
      data.cancer.replaceAll(
        ' ',
        '_'
      ) +
        '_treatment_counts.csv',

      'treatment,paper_count\n' +
        (
          data.treatments ||
          []
        )
          .map(
            x =>
              x.join(
                ','
              )
          )
          .join(
            '\n'
          ),

      'text/csv'
    );
  }

  return (
    <>
      <div className="pageHeader">
        <div className="eyebrow darkEyebrow">
          Evidence Overview
        </div>

        <h1>
          Research Analytics
        </h1>

        <p className="muted">
          Publication and treatment research patterns for {title(data.cancer)} cancer.
        </p>
      </div>

      <Metrics
        p={{
          ...data.profile,
          paper_count:
            unique.length,
          clinical_trials:
            calculated.clinical_trials,
          journals:
            calculated.journals,
          latest_year:
            calculated.latest_year
        }}
        tcount={
          data
            .treatments
            ?.length ||
          0
        }
      />

      <h3>
        Treatment Coverage
      </h3>

      <Bars
        items={
          data.treatments ||
          []
        }
      />

      <h3>
        Publication Timeline
      </h3>

      <Bars
        items={
          Object.entries(
            data.profile
              ?.year_counts ||
              {}
          ).sort()
        }
      />

      <h3>
        Top Journals
      </h3>

      <Bars
        items={
          data.profile
            ?.top_journals ||
          []
        }
      />

      <div className="toolbar">
        <button
          className="toolbarButton"
          onClick={
            makePdf
          }
        >
          Download PDF Report
        </button>

        <button
          className="toolbarButton secondaryToolbarButton"
          onClick={
            exportTreatments
          }
        >
          Export Treatment Counts (CSV)
        </button>
      </div>
    </>
  );
}

function Treatment({
  data,
  bookmarks,
  toggle
}) {
  const [
    tr,
    setTr
  ] =
    useState('');

  const [
    evidence,
    setEvidence
  ] =
    useState([]);

  const [
    busy,
    setBusy
  ] =
    useState(false);

  useEffect(() => {
    const firstTreatment =
      data?.treatments
        ?.[0]?.[0] ||
      '';

    setTr(
      firstTreatment
    );

    setEvidence([]);
  }, [
    data?.cancer
  ]);

  useEffect(() => {
    if (
      !data ||
      !tr
    ) {
      setEvidence(
        []
      );

      return;
    }

    let cancelled =
      false;

    setBusy(true);

    fetch(
      '/api/treatment',
      {
        method:
          'POST',

        headers: {
          'content-type':
            'application/json'
        },

        body:
          JSON.stringify(
            {
              cancer:
                data.cancer,

              treatment:
                tr,

              limit:
                14
            }
          )
      }
    )
      .then(
        r =>
          r.json()
      )
      .then(
        j => {
          if (
            !cancelled
          ) {
            setEvidence(
              uniquePapers(
                j?.papers ||
                []
              )
            );
          }
        }
      )
      .catch(
        () => {
          if (
            !cancelled
          ) {
            setEvidence(
              []
            );
          }
        }
      )
      .finally(
        () => {
          if (
            !cancelled
          ) {
            setBusy(
              false
            );
          }
        }
      );

    return () => {
      cancelled =
        true;
    };
  }, [
    data?.cancer,
    tr
  ]);

  if (!data) {
    return (
      <>
        <div className="pageHeader">
          <div className="eyebrow darkEyebrow">
            Treatment Evidence
          </div>

          <h1>
            Treatment Research
          </h1>
        </div>

        <Need />
      </>
    );
  }

  const api =
    uniquePapers(
      (
        data.papers ||
        []
      ).filter(
        p =>
          arr(
            p?.treatmentTypes
          )
            .map(
              norm
            )
            .includes(
              norm(
                tr
              )
            )
      )
    );

  const combined =
    uniquePapers([
      ...api,
      ...evidence
    ]);

  const additional =
    evidence.filter(
      p =>
        !api.some(
          x =>
            String(
              key(
                x
              )
            ).toLowerCase() ===
            String(
              key(
                p
              )
            ).toLowerCase()
        )
    );

  return (
    <>
      <div className="pageHeader">
        <div className="eyebrow darkEyebrow">
          Treatment Evidence
        </div>

        <h1>
          Treatment Research
        </h1>

        <p className="muted">
          Explore unique retrieved literature for individual treatment types.
        </p>
      </div>

      <div className="panel treatmentSelector">
        <label>
          Choose a treatment

          <select
            value={
              tr
            }
            onChange={
              e => {
                const next =
                  e.target
                    .value;

                setTr(
                  next
                );

                trackEvent(
                  'treatment_selected',
                  {
                    cancer_type:
                      data.cancer,

                    treatment:
                      next
                  }
                );
              }
            }
          >
            {(
              data.treatments ||
              []
            ).map(
              x => (
                <option
                  key={
                    x[0]
                  }
                  value={
                    x[0]
                  }
                >
                  {title(
                    x[0]
                  )}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <div className="panel evidenceIntro">
        <div className="eyebrow darkEyebrow">
          Selected Treatment
        </div>

        <h2>
          {title(
            tr
          )}
        </h2>

        <p>
          Evidence-focused research view for {title(data.cancer)} cancer.
          Paper counts describe retrieved literature and do not indicate
          medical superiority.
        </p>
      </div>

      <h2>
        Research Highlights
      </h2>

      <Metrics
        p={
          simpleProfile(
            combined
          )
        }
      />

      <div className="panel comparisonNotice">
        <b>
          Unique-paper counting
        </b>{' '}
        Cancer Insight removes duplicate papers before calculating these
        research totals.
      </div>

      {busy && (
        <div className="loadingNotice">
          Retrieving treatment-focused PubMed evidence…
        </div>
      )}

      <h2>
        Papers in Your Cancer Insight Search
      </h2>

      {api.length ? (
        api.map(
          (
            p,
            i
          ) => (
            <Paper
              p={p}
              n={
                i + 1
              }
              saved={
                bookmarks.includes(
                  key(
                    p
                  )
                )
              }
              toggle={
                toggle
              }
              cancer={
                data.cancer
              }
              key={
                key(
                  p
                ) + i
              }
            />
          )
        )
      ) : (
        <EmptyState
          titleText="No treatment-tagged papers in the current search"
          body="Cancer Insight may still find additional PubMed evidence for this treatment below."
        />
      )}

      <h2>
        Additional PubMed Evidence
      </h2>

      {busy ? (
        <div className="loadingNotice">
          Loading additional evidence…
        </div>
      ) : additional.length ? (
        additional
          .slice(
            0,
            8
          )
          .map(
            (
              p,
              i
            ) => (
              <Paper
                p={p}
                n={
                  i + 1
                }
                saved={
                  bookmarks.includes(
                    key(
                      p
                    )
                  )
                }
                toggle={
                  toggle
                }
                cancer={
                  data.cancer
                }
                key={
                  key(
                    p
                  ) + i
                }
              />
            )
          )
      ) : (
        <EmptyState
          titleText="No additional unique papers found"
          body="The treatment search did not return additional unique PubMed papers beyond the current Cancer Insight results."
        />
      )}
    </>
  );
}

function Compare({
  data
}) {
  const [
    a,
    setA
  ] =
    useState('');

  const [
    b,
    setB
  ] =
    useState('');

  const [
    ea,
    setEa
  ] =
    useState([]);

  const [
    eb,
    setEb
  ] =
    useState([]);

  const [
    busy,
    setBusy
  ] =
    useState(false);

  useEffect(() => {
    const first =
      data?.treatments
        ?.[0]?.[0] ||
      '';

    const second =
      data?.treatments
        ?.[1]?.[0] ||
      '';

    setA(first);
    setB(second);
    setEa([]);
    setEb([]);
  }, [
    data?.cancer
  ]);

  useEffect(() => {
    if (
      !data ||
      !a ||
      !b ||
      a === b
    ) {
      setEa([]);
      setEb([]);

      return;
    }

    let cancelled =
      false;

    setBusy(true);

    trackEvent(
      'treatment_comparison',
      {
        cancer_type:
          data.cancer,

        treatment_a:
          a,

        treatment_b:
          b
      }
    );

    Promise.all(
      [
        a,
        b
      ].map(
        t =>
          fetch(
            '/api/treatment',
            {
              method:
                'POST',

              headers: {
                'content-type':
                  'application/json'
              },

              body:
                JSON.stringify(
                  {
                    cancer:
                      data.cancer,

                    treatment:
                      t,

                    limit:
                      12
                  }
                )
            }
          ).then(
            r =>
              r.json()
          )
      )
    )
      .then(
        ([
          x,
          y
        ]) => {
          if (
            cancelled
          ) {
            return;
          }

          setEa(
            uniquePapers(
              x?.papers ||
              []
            )
          );

          setEb(
            uniquePapers(
              y?.papers ||
              []
            )
          );
        }
      )
      .catch(
        () => {
          if (
            !cancelled
          ) {
            setEa([]);
            setEb([]);
          }
        }
      )
      .finally(
        () => {
          if (
            !cancelled
          ) {
            setBusy(
              false
            );
          }
        }
      );

    return () => {
      cancelled =
        true;
    };
  }, [
    data?.cancer,
    a,
    b
  ]);

  if (!data) {
    return (
      <>
        <div className="pageHeader">
          <div className="eyebrow darkEyebrow">
            Evidence Comparison
          </div>

          <h1>
            Compare Treatments
          </h1>
        </div>

        <Need />
      </>
    );
  }

  if (
    (
      data.treatments ||
      []
    ).length <
    2
  ) {
    return (
      <>
        <div className="pageHeader">
          <div className="eyebrow darkEyebrow">
            Evidence Comparison
          </div>

          <h1>
            Compare Treatments
          </h1>
        </div>

        <EmptyState
          titleText="Not enough treatments to compare"
          body="At least two treatment categories are needed for a research comparison."
        />
      </>
    );
  }

  const apiA =
    uniquePapers(
      (
        data.papers ||
        []
      ).filter(
        p =>
          arr(
            p?.treatmentTypes
          )
            .map(
              norm
            )
            .includes(
              norm(
                a
              )
            )
      )
    );

  const apiB =
    uniquePapers(
      (
        data.papers ||
        []
      ).filter(
        p =>
          arr(
            p?.treatmentTypes
          )
            .map(
              norm
            )
            .includes(
              norm(
                b
              )
            )
      )
    );

  const combinedA =
    uniquePapers([
      ...apiA,
      ...ea
    ]);

  const combinedB =
    uniquePapers([
      ...apiB,
      ...eb
    ]);

  const pa =
    simpleProfile(
      combinedA
    );

  const pb =
    simpleProfile(
      combinedB
    );

  return (
    <>
      <div className="pageHeader">
        <div className="eyebrow darkEyebrow">
          Evidence Comparison
        </div>

        <h1>
          Compare Treatments
        </h1>

        <p className="muted">
          Compare characteristics of the retrieved research literature,
          not medical effectiveness.
        </p>
      </div>

      <div className="compare compareSelectors panel">
        <label>
          First treatment

          <select
            value={
              a
            }
            onChange={
              e =>
                setA(
                  e.target
                    .value
                )
            }
          >
            {(
              data.treatments ||
              []
            ).map(
              x => (
                <option
                  key={
                    x[0]
                  }
                  value={
                    x[0]
                  }
                >
                  {title(
                    x[0]
                  )}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          Second treatment

          <select
            value={
              b
            }
            onChange={
              e =>
                setB(
                  e.target
                    .value
                )
            }
          >
            {(
              data.treatments ||
              []
            ).map(
              x => (
                <option
                  key={
                    x[0]
                  }
                  value={
                    x[0]
                  }
                >
                  {title(
                    x[0]
                  )}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      {a === b ? (
        <div className="error">
          Choose two different treatments.
        </div>
      ) : (
        <>
          <div className="panel comparisonNotice">
            <b>
              How to read this comparison
            </b>{' '}
            The numbers describe unique retrieved research papers.
            More papers, newer studies, or greater research coverage do not
            mean one treatment is medically better, safer, or more appropriate.
          </div>

          {busy && (
            <div className="loadingNotice">
              Retrieving treatment comparison evidence…
            </div>
          )}

          <div className="comparisonSummary">
            <div className="comparisonCard">
              <h3>
                {title(
                  a
                )}
              </h3>

              <div className="comparisonStats">
                <div className="comparisonStat">
                  <span>
                    Unique papers
                  </span>

                  <strong>
                    {
                      pa.paper_count
                    }
                  </strong>
                </div>

                <div className="comparisonStat">
                  <span>
                    Free full text
                  </span>

                  <strong>
                    {
                      pa.free_full_text_count
                    }
                  </strong>
                </div>

                <div className="comparisonStat">
                  <span>
                    Clinical trials
                  </span>

                  <strong>
                    {
                      pa.clinical_trials
                    }
                  </strong>
                </div>

                <div className="comparisonStat">
                  <span>
                    Latest year
                  </span>

                  <strong>
                    {
                      pa.latest_year ||
                      '—'
                    }
                  </strong>
                </div>
              </div>
            </div>

            <div className="comparisonCard">
              <h3>
                {title(
                  b
                )}
              </h3>

              <div className="comparisonStats">
                <div className="comparisonStat">
                  <span>
                    Unique papers
                  </span>

                  <strong>
                    {
                      pb.paper_count
                    }
                  </strong>
                </div>

                <div className="comparisonStat">
                  <span>
                    Free full text
                  </span>

                  <strong>
                    {
                      pb.free_full_text_count
                    }
                  </strong>
                </div>

                <div className="comparisonStat">
                  <span>
                    Clinical trials
                  </span>

                  <strong>
                    {
                      pb.clinical_trials
                    }
                  </strong>
                </div>

                <div className="comparisonStat">
                  <span>
                    Latest year
                  </span>

                  <strong>
                    {
                      pb.latest_year ||
                      '—'
                    }
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <h2>
            Research Comparison
          </h2>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    Measure
                  </th>

                  <th>
                    {title(
                      a
                    )}
                  </th>

                  <th>
                    {title(
                      b
                    )}
                  </th>
                </tr>
              </thead>

              <tbody>
                {[
                  [
                    'Unique evidence papers',
                    'paper_count'
                  ],

                  [
                    'Free full text in PMC',
                    'free_full_text_count'
                  ],

                  [
                    'Latest year',
                    'latest_year'
                  ],

                  [
                    'Journals represented',
                    'journal_count'
                  ],

                  [
                    'Clinical trials',
                    'clinical_trials'
                  ],

                  [
                    'Reviews',
                    'reviews'
                  ],

                  [
                    'Meta-analyses',
                    'meta_analyses'
                  ]
                ].map(
                  ([
                    l,
                    k
                  ]) => (
                    <tr
                      key={
                        k
                      }
                    >
                      <td>
                        {l}
                      </td>

                      <td>
                        {
                          pa[
                            k
                          ] ??
                          '—'
                        }
                      </td>

                      <td>
                        {
                          pb[
                            k
                          ] ??
                          '—'
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="compare compareEvidence">
            <div>
              <h3>
                {title(
                  a
                )}{' '}
                — Supporting PubMed Evidence
              </h3>

              {ea.length ? (
                ea
                  .slice(
                    0,
                    3
                  )
                  .map(
                    (
                      p,
                      i
                    ) => (
                      <Paper
                        p={
                          p
                        }
                        n={
                          i +
                          1
                        }
                        saved={
                          false
                        }
                        toggle={
                          () =>
                            {}
                        }
                        cancer={
                          data.cancer
                        }
                        key={
                          key(
                            p
                          ) +
                          i
                        }
                      />
                    )
                  )
              ) : (
                <EmptyState
                  titleText="No additional evidence returned"
                  body={`No additional PubMed evidence was returned for ${title(a)}.`}
                />
              )}
            </div>

            <div>
              <h3>
                {title(
                  b
                )}{' '}
                — Supporting PubMed Evidence
              </h3>

              {eb.length ? (
                eb
                  .slice(
                    0,
                    3
                  )
                  .map(
                    (
                      p,
                      i
                    ) => (
                      <Paper
                        p={
                          p
                        }
                        n={
                          i +
                          1
                        }
                        saved={
                          false
                        }
                        toggle={
                          () =>
                            {}
                        }
                        cancer={
                          data.cancer
                        }
                        key={
                          key(
                            p
                          ) +
                          i
                        }
                      />
                    )
                  )
              ) : (
                <EmptyState
                  titleText="No additional evidence returned"
                  body={`No additional PubMed evidence was returned for ${title(b)}.`}
                />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Images({
  data,
  images,
  setImages
}) {
  const [
    busy,
    setBusy
  ] =
    useState(false);

  useEffect(() => {
    if (!data) {
      setImages(
        []
      );

      return;
    }

    let cancelled =
      false;

    setBusy(true);

    trackEvent(
      'cancer_images_view',
      {
        cancer_type:
          data.cancer
      }
    );

    fetch(
      '/api/images',
      {
        method:
          'POST',

        headers: {
          'content-type':
            'application/json'
        },

        body:
          JSON.stringify(
            {
              cancer:
                data.cancer
            }
          )
      }
    )
      .then(
        r =>
          r.json()
      )
      .then(
        j => {
          if (
            !cancelled
          ) {
            setImages(
              j?.images ||
              []
            );
          }
        }
      )
      .catch(
        () => {
          if (
            !cancelled
          ) {
            setImages(
              []
            );
          }
        }
      )
      .finally(
        () => {
          if (
            !cancelled
          ) {
            setBusy(
              false
            );
          }
        }
      );

    return () => {
      cancelled =
        true;
    };
  }, [
    data?.cancer,
    setImages
  ]);

  if (!data) {
    return (
      <>
        <div className="pageHeader">
          <div className="eyebrow darkEyebrow">
            Scientific Media
          </div>

          <h1>
            Cancer Images
          </h1>
        </div>

        <Need />
      </>
    );
  }

  return (
    <>
      <div className="pageHeader">
        <div className="eyebrow darkEyebrow">
          Scientific Media
        </div>

        <h1>
          Cancer Images
        </h1>

        <p className="muted">
          Medically relevant Wikimedia Commons images for {title(data.cancer)} cancer,
          prioritizing MRI/CT, pathology, histology, microscopy, specimens,
          segmentation, and medical diagrams.
        </p>
      </div>

      {busy && (
        <div className="loadingNotice">
          Finding medically relevant scientific images…
        </div>
      )}

      {!busy &&
      !images.length ? (
        <EmptyState
          titleText="No scientific images found"
          body="Cancer Insight did not retrieve suitable Wikimedia Commons images for this search."
        />
      ) : (
        <div className="images">
          {images.map(
            (
              x,
              i
            ) => (
              <div
                className="imagecard"
                key={
                  x?.original ||
                  x?.thumbnail ||
                  i
                }
              >
                <div className="imageFrame">
                  <img
                    src={
                      x.thumbnail
                    }
                    alt={
                      x.title ||
                      'Cancer research image'
                    }
                  />
                </div>

                <div className="imageContent">
                  <h3>
                    {
                      x.title
                    }
                  </h3>

                  {x.description && (
                    <p className="muted">
                      {clean(
                        x.description
                      ).slice(
                        0,
                        180
                      )}
                    </p>
                  )}

                  {x.license && (
                    <p className="imageMeta">
                      License:{' '}
                      {clean(
                        x.license
                      )}
                    </p>
                  )}

                  {x.artist && (
                    <p className="imageMeta">
                      Creator:{' '}
                      {clean(
                        x.artist
                      ).slice(
                        0,
                        120
                      )}
                    </p>
                  )}

                  {x.original && (
                    <a
                      className="sourceButton"
                      href={
                        x.original
                      }
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        trackEvent(
                          'scientific_image_source_click',
                          {
                            cancer_type:
                              data.cancer,

                            image_title:
                              String(
                                x.title ||
                                ''
                              ).slice(
                                0,
                                100
                              )
                          }
                        )
                      }
                    >
                      Open Original Source
                    </a>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}

function About() {
  return (
    <>
      <div className="pageHeader">
        <div className="eyebrow darkEyebrow">
          About the Platform
        </div>

        <h1>
          About Cancer Insight
        </h1>
      </div>

      <div className="aboutGrid">
        <section className="panel aboutCard">
          <h2>
            What Cancer Insight Does
          </h2>

          <p>
            Cancer Insight is an independent educational cancer research
            explorer available at cancer-insight.com. It is designed to help
            users discover and examine scientific cancer research while
            keeping original research sources visible.
          </p>

          <p>
            Cancer Insight brings together cancer research papers, PubMed and
            NCBI metadata, treatment research, publication trends, research
            analytics, free full-text availability, scientific cancer images,
            study-type filtering, and research comparison tools.
          </p>

          <p>
            The platform is intended for educational and research-exploration
            purposes and does not provide personal medical advice, diagnosis,
            or individualized treatment recommendations.
          </p>
        </section>

        <section className="panel aboutCard">
          <h2>
            Research Sources
          </h2>

          <p>
            Source information may include PubMed, PubMed Central, DOI records,
            publisher pages, and Wikimedia Commons for scientific images.
          </p>
        </section>

        <section className="panel aboutCard">
          <h2>
            Study Types
          </h2>

          <p>
            When publication metadata is available, Cancer Insight can identify
            research categories such as clinical trials, randomized controlled
            trials, reviews, systematic reviews, and meta-analyses.
          </p>

          <p>
            These labels depend on the metadata provided by the original
            research source and may not be available for every paper.
          </p>
        </section>

        <section className="panel aboutCard">
          <h2>
            Why a Paper Is Relevant
          </h2>

          <p>
            Cancer Insight may provide a short relevance note based only on
            retrieved paper metadata, treatment tags, titles, abstracts, and
            publication types.
          </p>

          <p>
            This note is intended to help users navigate the research and is
            not a scientific conclusion or medical recommendation.
          </p>
        </section>

        <section className="panel aboutCard">
          <h2>
            Access Labels
          </h2>

          <ul>
            <li>
              <b>
                Free full text in PMC:
              </b>{' '}
              freely readable in PubMed Central; this does not automatically
              mean unrestricted reuse.
            </li>

            <li>
              <b>
                Full-text source link:
              </b>{' '}
              a publisher or research-source link is available; access rules
              may vary.
            </li>

            <li>
              <b>
                PubMed abstract:
              </b>{' '}
              an abstract is available even when a free PMC copy is not
              identified.
            </li>
          </ul>
        </section>

        <section className="panel aboutCard">
          <h2>
            Research Methodology
          </h2>

          <p>
            Cancer Insight explains how research records are found, organized,
            enriched, filtered, deduplicated, and presented.
          </p>

          <a
            className="sourceButton"
            href="/methodology"
            onClick={() =>
              trackEvent(
                'methodology_click',
                {
                  location:
                    'about_page'
                }
              )
            }
          >
            Read Research Methodology
          </a>
        </section>

        <section className="panel aboutCard">
          <h2>
            Frequently Asked Questions
          </h2>

          <p>
            Learn more about PubMed, study types, free full text, treatment
            research, comparisons, saved papers, reports, and scientific
            images.
          </p>

          <a
            className="sourceButton"
            href="/faq"
            onClick={() =>
              trackEvent(
                'faq_click',
                {
                  location:
                    'about_page'
                }
              )
            }
          >
            View FAQ
          </a>
        </section>
      </div>

      <section className="panel limitationPanel">
        <h2>
          Limitations
        </h2>

        <p>
          Paper counts, study-type labels, relevance notes, and research
          summaries describe retrieved literature, not treatment effectiveness,
          safety, or suitability for an individual patient. Automated
          extraction and metadata classification can miss context, so users
          should read cited papers and consult qualified healthcare
          professionals for personal medical decisions.
        </p>
      </section>
    </>
  );
}

function simpleProfile(
  papers
) {
  const unique =
    uniquePapers(
      papers ||
      []
    );

  const years =
    [];

  const journals =
    new Set();

  let free = 0;
  let trials = 0;
  let reviews = 0;
  let meta = 0;

  unique.forEach(
    p => {
      if (
        p?.pmc_id
      ) {
        free++;
      }

      const y =
        getYear(
          p
        );

      if (y) {
        years.push(
          y
        );
      }

      const j =
        best(
          p,
          'pubmed_journal',
          'journal'
        );

      if (j) {
        journals.add(
          j
        );
      }

      const t =
        publicationText(
          p
        );

      if (
        t.includes(
          'clinical trial'
        )
      ) {
        trials++;
      }

      if (
        t.includes(
          'review'
        )
      ) {
        reviews++;
      }

      if (
        t.includes(
          'meta-analysis'
        )
      ) {
        meta++;
      }
    }
  );

  return {
    paper_count:
      unique.length,

    free_full_text_count:
      free,

    latest_year:
      years.length
        ? Math.max(
            ...years
          )
        : null,

    journals:
      [
        ...journals
      ],

    journal_count:
      journals.size,

    clinical_trials:
      trials,

    reviews,

    meta_analyses:
      meta
  };
}

function download(
  name,
  text,
  type
) {
  const a =
    document.createElement(
      'a'
    );

  const url =
    URL.createObjectURL(
      new Blob(
        [text],
        {
          type
        }
      )
    );

  a.href =
    url;

  a.download =
    name;

  document.body.appendChild(
    a
  );

  a.click();

  a.remove();

  URL.revokeObjectURL(
    url
  );
}

function pdfReport(
  cancer,
  papers,
  treatments
) {
  const uniqueReportPapers =
    uniquePapers(
      papers ||
      []
    );

  const d =
    new jsPDF({
      orientation:
        'portrait',
      unit:
        'mm',
      format:
        'a4'
    });

  const NAVY = [
    20,
    61,
    82
  ];

  const TEAL = [
    31,
    174,
    174
  ];

  const LIGHT = [
    239,
    246,
    248
  ];

  const TEXT = [
    25,
    54,
    70
  ];

  const MUTED = [
    92,
    120,
    136
  ];

  const BORDER = [
    210,
    225,
    231
  ];

  const WHITE = [
    255,
    255,
    255
  ];

  const GREEN_BG = [
    225,
    245,
    239
  ];

  const GREEN_TEXT = [
    25,
    115,
    88
  ];

  const pageW =
    210;

  const margin =
    16;

  const contentW =
    pageW -
    margin * 2;

  const footerY =
    282;

  let pageNumber =
    1;

  let y =
    0;

  const decodeEntities =
    value => {
      if (
        typeof document ===
        'undefined'
      ) {
        return String(
          value ||
          ''
        );
      }

      const area =
        document.createElement(
          'textarea'
        );

      area.innerHTML =
        String(
          value ||
          ''
        );

      return area.value;
    };

  const pdfText =
    value =>
      decodeEntities(
        clean(
          value ||
          ''
        )
      )
        .replace(
          /\u00a0/g,
          ' '
        )
        .replace(
          /[\u2010\u2011\u2012\u2013\u2014\u2212]/g,
          '-'
        )
        .replace(
          /[\u2018\u2019]/g,
          "'"
        )
        .replace(
          /[\u201c\u201d]/g,
          '"'
        )
        .replace(
          /\u2026/g,
          '...'
        )
        .replace(
          /[^\x20-\x7E\xA0-\xFF]/g,
          ' '
        )
        .replace(
          /\s+/g,
          ' '
        )
        .trim();

  const paperTitle =
    p =>
      pdfText(
        best(
          p,
          'pubmed_title',
          'title'
        )
      ) ||
      'Untitled research paper';

  const journal =
    p =>
      pdfText(
        best(
          p,
          'pubmed_journal',
          'journal'
        )
      );

  const date =
    p =>
      pdfText(
        best(
          p,
          'pubmed_date',
          'publicationDate'
        )
      );

  const abstract =
    p =>
      pdfText(
        best(
          p,
          'pubmed_abstract',
          'abstract'
        )
      );

  const authors =
    p =>
      pdfText(
        Array.isArray(
          p?.pubmed_authors
        )
          ? p.pubmed_authors.join(
              ', '
            )
          : p?.pubmed_authors
      );

  function footer() {
    d.setDrawColor(
      ...BORDER
    );

    d.setLineWidth(
      0.25
    );

    d.line(
      margin,
      footerY,
      pageW -
        margin,
      footerY
    );

    d.setFont(
      'helvetica',
      'normal'
    );

    d.setFontSize(
      7.2
    );

    d.setTextColor(
      ...MUTED
    );

    d.text(
      'Educational use only. Cancer Insight does not provide medical diagnosis or individualized treatment advice.',
      margin,
      footerY + 5
    );

    d.text(
      `Page ${pageNumber}`,
      pageW -
        margin,
      footerY + 5,
      {
        align:
          'right'
      }
    );
  }

  function smallHeader() {
    d.setFillColor(
      ...NAVY
    );

    d.rect(
      0,
      0,
      pageW,
      15,
      'F'
    );

    d.setFillColor(
      ...TEAL
    );

    d.roundedRect(
      margin,
      4,
      7,
      7,
      1.5,
      1.5,
      'F'
    );

    d.setTextColor(
      ...WHITE
    );

    d.setFont(
      'helvetica',
      'bold'
    );

    d.setFontSize(
      9.5
    );

    d.text(
      '+',
      margin +
        3.5,
      9.1,
      {
        align:
          'center'
      }
    );

    d.setFontSize(
      10
    );

    d.text(
      'Cancer Insight',
      margin +
        11,
      9.5
    );

    d.setFont(
      'helvetica',
      'normal'
    );

    d.setFontSize(
      7.5
    );

    d.text(
      `${title(cancer)} Cancer Research Report`,
      pageW -
        margin,
      9.5,
      {
        align:
          'right'
      }
    );
  }

  function newPage() {
    footer();

    d.addPage();

    pageNumber +=
      1;

    smallHeader();

    y = 24;
  }

  function ensureSpace(
    required
  ) {
    if (
      y +
        required >
      footerY -
        5
    ) {
      newPage();
    }
  }

  function drawSectionTitle(
    label
  ) {
    d.setTextColor(
      ...NAVY
    );

    d.setFont(
      'helvetica',
      'bold'
    );

    d.setFontSize(
      16
    );

    d.text(
      label,
      margin,
      y
    );

    y += 5;

    d.setDrawColor(
      ...TEAL
    );

    d.setLineWidth(
      0.8
    );

    d.line(
      margin,
      y,
      margin +
        35,
      y
    );

    y += 9;
  }

  function drawLinkButton(
    label,
    url,
    x,
    top,
    width
  ) {
    if (!url) {
      return 0;
    }

    d.setFillColor(
      ...LIGHT
    );

    d.setDrawColor(
      ...BORDER
    );

    d.roundedRect(
      x,
      top,
      width,
      6.5,
      1.5,
      1.5,
      'FD'
    );

    d.setFont(
      'helvetica',
      'bold'
    );

    d.setFontSize(
      7
    );

    d.setTextColor(
      ...TEAL
    );

    d.textWithLink(
      label,
      x +
        width /
          2,
      top +
        4.3,
      {
        url,
        align:
          'center'
      }
    );

    return width;
  }

  d.setFillColor(
    ...NAVY
  );

  d.rect(
    0,
    0,
    pageW,
    54,
    'F'
  );

  d.setFillColor(
    ...TEAL
  );

  d.roundedRect(
    margin,
    12,
    13,
    13,
    2.5,
    2.5,
    'F'
  );

  d.setTextColor(
    ...WHITE
  );

  d.setFont(
    'helvetica',
    'bold'
  );

  d.setFontSize(
    17
  );

  d.text(
    '+',
    margin +
      6.5,
    21.3,
    {
      align:
        'center'
    }
  );

  d.setFontSize(
    18
  );

  d.text(
    'Cancer Insight',
    margin +
      18,
    20
  );

  d.setFont(
    'helvetica',
    'normal'
  );

  d.setFontSize(
    8.5
  );

  d.text(
    'Evidence-first cancer research explorer',
    margin +
      18,
    26
  );

  d.setFont(
    'helvetica',
    'bold'
  );

  d.setFontSize(
    22
  );

  d.text(
    'Research Report',
    margin,
    43
  );

  y = 67;

  d.setTextColor(
    ...TEXT
  );

  d.setFont(
    'helvetica',
    'bold'
  );

  d.setFontSize(
    24
  );

  d.text(
    `${title(cancer)} Cancer`,
    margin,
    y
  );

  y += 8;

  d.setFont(
    'helvetica',
    'normal'
  );

  d.setFontSize(
    10
  );

  d.setTextColor(
    ...MUTED
  );

  d.text(
    'Research literature overview generated by Cancer Insight',
    margin,
    y
  );

  y += 13;

  const freeCount =
    uniqueReportPapers.filter(
      p =>
        p?.pmc_id
    ).length;

  const years =
    uniqueReportPapers
      .map(
        getYear
      )
      .filter(
        Boolean
      );

  const latestYear =
    years.length
      ? Math.max(
          ...years
        )
      : '-';

  const profile =
    simpleProfile(
      uniqueReportPapers
    );

  const cards = [
    [
      'Research Papers',
      uniqueReportPapers.length
    ],

    [
      'Free Full Text',
      freeCount
    ],

    [
      'Latest Year',
      latestYear
    ],

    [
      'Clinical Trials',
      profile.clinical_trials
    ]
  ];

  const gap =
    4;

  const cardW =
    (
      contentW -
      gap * 3
    ) /
    4;

  cards.forEach(
    (
      [
        label,
        value
      ],
      i
    ) => {
      const x =
        margin +
        i *
          (
            cardW +
            gap
          );

      d.setFillColor(
        ...LIGHT
      );

      d.setDrawColor(
        ...BORDER
      );

      d.roundedRect(
        x,
        y,
        cardW,
        25,
        2.5,
        2.5,
        'FD'
      );

      d.setTextColor(
        ...MUTED
      );

      d.setFont(
        'helvetica',
        'normal'
      );

      d.setFontSize(
        7.5
      );

      d.text(
        label,
        x + 4,
        y + 7
      );

      d.setTextColor(
        ...NAVY
      );

      d.setFont(
        'helvetica',
        'bold'
      );

      d.setFontSize(
        16
      );

      d.text(
        String(
          value
        ),
        x + 4,
        y + 18
      );
    }
  );

  y += 35;

  d.setTextColor(
    ...NAVY
  );

  d.setFont(
    'helvetica',
    'bold'
  );

  d.setFontSize(
    15
  );

  d.text(
    'Research Overview',
    margin,
    y
  );

  y += 7;

  d.setTextColor(
    ...TEXT
  );

  d.setFont(
    'helvetica',
    'normal'
  );

  d.setFontSize(
    9
  );

  const intro =
    `This report summarizes ${uniqueReportPapers.length} unique research papers retrieved for ${title(cancer)} cancer. ` +
    'Cancer Insight presents publication metadata, abstracts, study-type information, treatment research coverage, and links to original scientific sources. ' +
    'The report describes retrieved research literature and does not rank treatments or provide medical recommendations.';

  const introLines =
    d.splitTextToSize(
      intro,
      contentW
    );

  d.text(
    introLines,
    margin,
    y
  );

  y +=
    introLines.length *
      4.5 +
    9;

  if (
    treatments &&
    treatments.length
  ) {
    d.setTextColor(
      ...NAVY
    );

    d.setFont(
      'helvetica',
      'bold'
    );

    d.setFontSize(
      15
    );

    d.text(
      'Treatment Research Coverage',
      margin,
      y
    );

    y += 8;

    const treatmentList =
      treatments.slice(
        0,
        8
      );

    const max =
      Math.max(
        1,
        ...treatmentList.map(
          x =>
            Number(
              x[1]
            ) ||
            0
        )
      );

    treatmentList.forEach(
      ([
        name,
        count
      ]) => {
        ensureSpace(
          10
        );

        d.setTextColor(
          ...TEXT
        );

        d.setFont(
          'helvetica',
          'normal'
        );

        d.setFontSize(
          8.5
        );

        d.text(
          title(
            name
          ).slice(
            0,
            36
          ),
          margin,
          y + 3
        );

        const barX =
          margin +
          60;

        const barW =
          90;

        d.setFillColor(
          224,
          235,
          239
        );

        d.roundedRect(
          barX,
          y,
          barW,
          4,
          1,
          1,
          'F'
        );

        d.setFillColor(
          ...TEAL
        );

        d.roundedRect(
          barX,
          y,
          Math.max(
            3,
            (
              Number(
                count
              ) /
              max
            ) *
              barW
          ),
          4,
          1,
          1,
          'F'
        );

        d.setFont(
          'helvetica',
          'bold'
        );

        d.setTextColor(
          ...NAVY
        );

        d.text(
          String(
            count
          ),
          pageW -
            margin,
          y + 3,
          {
            align:
              'right'
          }
        );

        y += 8;
      }
    );

    y += 4;
  }

  newPage();

  drawSectionTitle(
    'Research Papers'
  );

  uniqueReportPapers
    .slice(
      0,
      20
    )
    .forEach(
      (
        p,
        i
      ) => {
        const t =
          paperTitle(
            p
          );

        const j =
          journal(
            p
          );

        const dt =
          date(
            p
          );

        const auth =
          authors(
            p
          );

        let absText =
          abstract(
            p
          );

        if (
          absText.length >
          520
        ) {
          absText =
            absText
              .slice(
                0,
                517
              )
              .trimEnd() +
            '...';
        }

        const titleLines =
          d.splitTextToSize(
            t,
            contentW -
              20
          );

        const metaText =
          [
            j,
            dt,
            auth
          ]
            .filter(
              Boolean
            )
            .join(
              '  |  '
            );

        const metaLines =
          metaText
            ? d.splitTextToSize(
                metaText,
                contentW -
                  20
              )
            : [];

        const abstractLines =
          absText
            ? d.splitTextToSize(
                absText,
                contentW -
                  20
              )
            : [];

        const treatmentsMentioned =
          arr(
            p?.treatmentTypes
          ).length
            ? arr(
                p.treatmentTypes
              )
                .map(
                  title
                )
                .join(
                  ', '
                )
            : '';

        const studyTypes =
          studyLabels(
            p
          ).join(
            ', '
          );

        const treatmentLines =
          treatmentsMentioned
            ? d.splitTextToSize(
                `Treatments mentioned: ${treatmentsMentioned}`,
                contentW -
                  20
              )
            : [];

        const studyLines =
          studyTypes
            ? d.splitTextToSize(
                `Study type: ${studyTypes}`,
                contentW -
                  20
              )
            : [];

        const hasLinks =
          Boolean(
            p?.pubmed_url ||
            p?.pmc_url ||
            p?.publisher_url
          );

        const targetHeight =
          17 +
          titleLines.length *
            5 +
          metaLines.length *
            3.8 +
          (
            p?.pmc_id
              ? 7
              : 0
          ) +
          Math.min(
            studyLines.length,
            1
          ) *
            3.8 +
          Math.min(
            abstractLines.length,
            6
          ) *
            4 +
          Math.min(
            treatmentLines.length,
            2
          ) *
            3.8 +
          (
            hasLinks
              ? 11
              : 3
          );

        const cardHeight =
          Math.min(
            Math.max(
              targetHeight,
              40
            ),
            82
          );

        ensureSpace(
          cardHeight +
            7
        );

        const startY =
          y;

        d.setFillColor(
          250,
          252,
          253
        );

        d.setDrawColor(
          ...BORDER
        );

        d.roundedRect(
          margin,
          startY,
          contentW,
          cardHeight,
          2.5,
          2.5,
          'FD'
        );

        d.setFillColor(
          ...TEAL
        );

        d.roundedRect(
          margin +
            4,
          startY +
            5,
          8,
          8,
          1.5,
          1.5,
          'F'
        );

        d.setTextColor(
          ...WHITE
        );

        d.setFont(
          'helvetica',
          'bold'
        );

        d.setFontSize(
          7
        );

        d.text(
          String(
            i +
              1
          ),
          margin +
            8,
          startY +
            10.2,
          {
            align:
              'center'
          }
        );

        let py =
          startY +
          9;

        const textX =
          margin +
          16;

        d.setTextColor(
          ...NAVY
        );

        d.setFont(
          'helvetica',
          'bold'
        );

        d.setFontSize(
          10
        );

        d.text(
          titleLines,
          textX,
          py
        );

        py +=
          titleLines.length *
            5 +
          2;

        if (
          metaLines.length
        ) {
          d.setTextColor(
            ...MUTED
          );

          d.setFont(
            'helvetica',
            'normal'
          );

          d.setFontSize(
            7.3
          );

          const visibleMeta =
            metaLines.slice(
              0,
              3
            );

          d.text(
            visibleMeta,
            textX,
            py
          );

          py +=
            visibleMeta.length *
              3.8 +
            3;
        }

        if (
          p?.pmc_id &&
          py <
            startY +
              cardHeight -
              24
        ) {
          d.setFillColor(
            ...GREEN_BG
          );

          d.setTextColor(
            ...GREEN_TEXT
          );

          d.roundedRect(
            textX,
            py -
              3,
            31,
            5.5,
            1.5,
            1.5,
            'F'
          );

          d.setFont(
            'helvetica',
            'bold'
          );

          d.setFontSize(
            6.5
          );

          d.text(
            'FREE FULL TEXT',
            textX +
              3,
            py +
              0.7
          );

          py +=
            7;
        }

        if (
          studyLines.length &&
          py <
            startY +
              cardHeight -
              20
        ) {
          d.setTextColor(
            ...TEAL
          );

          d.setFont(
            'helvetica',
            'bold'
          );

          d.setFontSize(
            7
          );

          d.text(
            studyLines.slice(
              0,
              1
            ),
            textX,
            py
          );

          py +=
            4;
        }

        if (
          abstractLines.length &&
          py <
            startY +
              cardHeight -
              18
        ) {
          d.setTextColor(
            ...TEXT
          );

          d.setFont(
            'helvetica',
            'normal'
          );

          d.setFontSize(
            8
          );

          const reserved =
            hasLinks
              ? 15
              : 6;

          const availableLines =
            Math.max(
              1,
              Math.floor(
                (
                  startY +
                  cardHeight -
                  py -
                  reserved
                ) /
                  4
              )
            );

          let visibleAbstract =
            abstractLines.slice(
              0,
              availableLines
            );

          if (
            visibleAbstract.length <
              abstractLines.length &&
            visibleAbstract.length
          ) {
            const last =
              visibleAbstract.length -
              1;

            visibleAbstract[
              last
            ] =
              visibleAbstract[
                last
              ]
                .replace(
                  /\.*$/,
                  ''
                )
                .trimEnd() +
              '...';
          }

          d.text(
            visibleAbstract,
            textX,
            py
          );

          py +=
            visibleAbstract.length *
              4 +
            3;
        }

        if (
          treatmentLines.length &&
          py <
            startY +
              cardHeight -
              (
                hasLinks
                  ? 13
                  : 5
              )
        ) {
          d.setTextColor(
            ...TEAL
          );

          d.setFont(
            'helvetica',
            'bold'
          );

          d.setFontSize(
            7
          );

          const visibleTreatment =
            treatmentLines.slice(
              0,
              2
            );

          d.text(
            visibleTreatment,
            textX,
            py
          );

          py +=
            visibleTreatment.length *
              3.8 +
            2;
        }

        if (
          hasLinks
        ) {
          const linkY =
            startY +
            cardHeight -
            9;

          let linkX =
            textX;

          if (
            p?.pubmed_url
          ) {
            drawLinkButton(
              'PubMed',
              p.pubmed_url,
              linkX,
              linkY,
              25
            );

            linkX +=
              28;
          }

          if (
            p?.pmc_url
          ) {
            drawLinkButton(
              'Free Full Text',
              p.pmc_url,
              linkX,
              linkY,
              34
            );

            linkX +=
              37;
          }

          if (
            p?.publisher_url
          ) {
            drawLinkButton(
              'Publisher',
              p.publisher_url,
              linkX,
              linkY,
              27
            );
          }
        }

        y =
          startY +
          cardHeight +
          6;
      }
    );

  ensureSpace(
    42
  );

  d.setFillColor(
    ...LIGHT
  );

  d.setDrawColor(
    ...BORDER
  );

  d.roundedRect(
    margin,
    y,
    contentW,
    32,
    2.5,
    2.5,
    'FD'
  );

  d.setTextColor(
    ...NAVY
  );

  d.setFont(
    'helvetica',
    'bold'
  );

  d.setFontSize(
    10
  );

  d.text(
    'Sources & Interpretation',
    margin +
      6,
    y +
      8
  );

  d.setTextColor(
    ...TEXT
  );

  d.setFont(
    'helvetica',
    'normal'
  );

  d.setFontSize(
    7.8
  );

  const sourceText =
    'Cancer Insight keeps original research sources visible whenever available, including PubMed, PubMed Central (PMC), DOI, and publisher links. ' +
    'Duplicate papers are removed from research counts where possible. Publication-type labels depend on available source metadata. ' +
    'Paper counts and treatment coverage describe the retrieved literature only and should not be interpreted as evidence that one treatment is superior.';

  d.text(
    d.splitTextToSize(
      sourceText,
      contentW -
        12
    ),
    margin +
      6,
    y +
      14
  );

  footer();

  d.setProperties({
    title:
      `Cancer Insight - ${title(cancer)} Cancer Research Report`,

    subject:
      `${title(cancer)} cancer research literature`,

    author:
      'Cancer Insight',

    creator:
      'Cancer Insight'
  });

  d.save(
    `cancer_insight_${String(
      cancer
    )
      .replace(
        /\s+/g,
        '_'
      )
      .toLowerCase()}_research_report.pdf`
  );
}
