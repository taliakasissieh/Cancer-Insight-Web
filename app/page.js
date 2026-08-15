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
  return p[k1] || p[k2] || '';
}

function key(p) {
  return (
    p.pubmedId ||
    p.doi ||
    best(p, 'pubmed_title', 'title')
  );
}

function Paper({ p, n, saved, toggle }) {
  const t =
    best(p, 'pubmed_title', 'title') ||
    'Untitled research paper';

  const a =
    best(p, 'pubmed_abstract', 'abstract');

  const j =
    best(p, 'pubmed_journal', 'journal');

  const d =
    best(p, 'pubmed_date', 'publicationDate');

  return (
    <div className={'paper ' + (saved ? 'saved' : '')}>
      <div className="muted">
        {n ? `Paper ${n}` : 'Research paper'}
      </div>

      <h3>{t}</h3>

      <div className="muted">
        {[j, d, p.pubmed_authors]
          .filter(Boolean)
          .join(' · ')}
      </div>

      <div>
        {p.pmc_id && (
          <span className="badge free">
            Free full text in PMC
          </span>
        )}

        {a && (
          <span className="badge abstract">
            PubMed abstract
          </span>
        )}

        {(p.pmc_url || p.publisher_url) && (
          <span className="badge link">
            Full-text source link
          </span>
        )}
      </div>

      {a && <p>{clean(a)}</p>}

      {arr(p.treatmentTypes).length > 0 && (
        <p>
          <b>Treatments mentioned in evidence:</b>{' '}
          {arr(p.treatmentTypes)
            .map(title)
            .join(', ')}
        </p>
      )}

      <div className="paperlinks">
        {p.pubmed_url && (
          <a href={p.pubmed_url} target="_blank">
            PubMed
          </a>
        )}

        {p.pmc_url && (
          <a href={p.pmc_url} target="_blank">
            Free full text
          </a>
        )}

        {p.publisher_url && (
          <a href={p.publisher_url} target="_blank">
            Publisher
          </a>
        )}

        <button onClick={() => toggle(key(p))}>
          {saved ? '★ Saved' : '☆ Save paper'}
        </button>
      </div>
    </div>
  );
}

function Metrics({ p, tcount }) {
  const vals = [
    ['Research papers', p.paper_count],
    ['Free full text', p.free_full_text_count],
    ['Latest year', p.latest_year || '—'],
    ['Journals', p.journals?.length || 0],
    ['Clinical trials', p.clinical_trials || 0],
    ['Treatment types', tcount ?? '—']
  ];

  return (
    <div className="grid6">
      {vals.map(([a, b]) => (
        <div className="metric" key={a}>
          <span className="muted">{a}</span>
          <div className="num">{b}</div>
        </div>
      ))}
    </div>
  );
}

function Bars({ items }) {
  const max = Math.max(
    1,
    ...items.map(x => Number(x[1]) || 0)
  );

  return (
    <div className="panel">
      {items.map(([k, v]) => (
        <div className="barrow" key={k}>
          <div className="barlabel">
            {title(k)}
          </div>

          <div
            className="bar"
            style={{
              width: `${Math.max(
                3,
                (Number(v) / max) * 70
              )}%`
            }}
          />

          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [page, setPage] =
    useState('Search');

  const [input, setInput] =
    useState('');

  const [data, setData] =
    useState(null);

  const [error, setError] =
    useState('');

  const [notice, setNotice] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [bookmarks, setBookmarks] =
    useState([]);

  const [images, setImages] =
    useState([]);

  useEffect(() => {
    try {
      setBookmarks(
        JSON.parse(
          localStorage.getItem('ci-bookmarks') || '[]'
        )
      );
    } catch {}
  }, []);

  const toggle = k =>
    setBookmarks(b => {
      const n = b.includes(k)
        ? b.filter(x => x !== k)
        : [...b, k];

      localStorage.setItem(
        'ci-bookmarks',
        JSON.stringify(n)
      );

      return n;
    });

  async function search(e) {
    e.preventDefault();

    setError('');
    setNotice('');
    setData(null);
    setImages([]);

    const q = input.trim();

    if (!q) {
      setError(
        'Enter a cancer type to search.'
      );
      return;
    }

    setBusy(true);

    try {
      const r = await fetch('/api/search', {
        method: 'POST',

        headers: {
          'content-type':
            'application/json'
        },

        body: JSON.stringify({
          cancer: q.toLowerCase()
        })
      });

      const j = await r.json();

      if (!r.ok) {
        throw Error(j.error);
      }

      setData(j);

      setNotice(
        `Found ${j.papers.length} papers for ${title(q)}.`
      );
    } catch (e) {
      setError(e.message);
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
          {pages.map(p => (
            <button
              className={
                page === p
                  ? 'active'
                  : ''
              }
              onClick={() => {
                setPage(p);
                scrollTo(0, 0);
              }}
              key={p}
            >
              ● &nbsp; {p}
            </button>
          ))}
        </div>

        {data && (
          <div className="sideinfo">
            <b>
              {title(data.cancer)} cancer
            </b>

            <br />

            {data.profile.paper_count}{' '}
            papers ·{' '}
            {data.treatments.length}{' '}
            treatment types

            <br />

            {
              data.profile
                .free_full_text_count
            }{' '}
            free full-text in PMC
          </div>
        )}

        <div className="sideinfo">
          Educational use only.
          Not medical advice.
        </div>
      </aside>

      <main className="main">
        <div className="content">
          {page === 'Search' && (
            <Search
              input={input}
              setInput={setInput}
              search={search}
              data={data}
              error={error}
              notice={notice}
              busy={busy}
            />
          )}

          {page ===
            'Research Papers' && (
            <Research
              data={data}
              bookmarks={bookmarks}
              toggle={toggle}
            />
          )}

          {page ===
            'Research Analytics' && (
            <Analytics data={data} />
          )}

          {page ===
            'Treatment Research' && (
            <Treatment
              data={data}
              bookmarks={bookmarks}
              toggle={toggle}
            />
          )}

          {page ===
            'Compare Treatments' && (
            <Compare data={data} />
          )}

          {page ===
            'Cancer Images' && (
            <Images
              data={data}
              images={images}
              setImages={setImages}
            />
          )}

          {page === 'About' && (
            <About />
          )}

          <div className="disclaimer">
            <b>
              Educational use only.
            </b>{' '}
            Cancer Insight does not
            provide medical diagnosis,
            individualized treatment
            recommendations, or
            professional medical advice.
          </div>
        </div>
      </main>
    </div>
  );
}

function Need() {
  return (
    <div className="panel">
      Search for a cancer type first
      to view this section.
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
  return (
    <>
      <section className="hero">
        <div className="eyebrow">
          Evidence-first cancer research
          platform
        </div>

        <h1>
          Cancer Insight
        </h1>

        <p>
          Search cancer research, read
          PubMed abstracts, identify free
          full-text papers, explore
          treatment evidence, and compare
          research coverage without hiding
          the original sources.
        </p>
      </section>

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
        className="panel"
        onSubmit={search}
      >
        <label>
          Cancer type

          <input
            value={input}
            onChange={e =>
              setInput(e.target.value)
            }
            placeholder="For example: lung"
          />
        </label>

        <br />

        <button
          className="primary"
          disabled={busy}
        >
          {busy
            ? 'Searching and enriching papers with PubMed metadata…'
            : 'Search research'}
        </button>
      </form>

      {data && (
        <>
          <h2>
            Research Highlights
          </h2>

          <Metrics
            p={data.profile}
            tcount={
              data.treatments.length
            }
          />

          <h3>
            Treatment research coverage
          </h3>

          <Bars
            items={data.treatments}
          />
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
  const [q, setQ] =
    useState('');

  const [access, setAccess] =
    useState('All');

  const [tr, setTr] =
    useState('All treatments');

  const [year, setYear] =
    useState('All years');

  const [sort, setSort] =
    useState('Original relevance');

  const [saved, setSaved] =
    useState(false);

  const papers = useMemo(() => {
    if (!data) return [];

    let x = [...data.papers];

    if (q) {
      x = x.filter(p =>
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
          p.mesh_terms
        ]
          .join(' ')
          .toLowerCase()
          .includes(
            q.toLowerCase()
          )
      );
    }

    if (
      access ===
      'Free full text in PMC'
    ) {
      x = x.filter(
        p => p.pmc_id
      );
    }

    if (
      access ===
      'Has abstract'
    ) {
      x = x.filter(p =>
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
      x = x.filter(
        p =>
          p.pmc_url ||
          p.publisher_url
      );
    }

    if (
      tr !==
      'All treatments'
    ) {
      x = x.filter(p =>
        arr(p.treatmentTypes)
          .map(norm)
          .includes(norm(tr))
      );
    }

    if (
      year !==
      'All years'
    ) {
      x = x.filter(p =>
        String(
          best(
            p,
            'pubmed_date',
            'publicationDate'
          )
        ).includes(year)
      );
    }

    if (saved) {
      x = x.filter(p =>
        bookmarks.includes(key(p))
      );
    }

    if (
      sort ===
      'Newest first'
    ) {
      x.sort((a, b) =>
        String(
          best(
            b,
            'pubmed_date',
            'publicationDate'
          )
        ).localeCompare(
          String(
            best(
              a,
              'pubmed_date',
              'publicationDate'
            )
          )
        )
      );
    }

    if (
      sort ===
      'Free full text first'
    ) {
      x.sort(
        (a, b) =>
          Number(!!b.pmc_id) -
          Number(!!a.pmc_id)
      );
    }

    return x;
  }, [
    data,
    q,
    access,
    tr,
    year,
    sort,
    saved,
    bookmarks
  ]);

  if (!data) {
    return (
      <>
        <h1>
          Research Papers
        </h1>

        <Need />
      </>
    );
  }

  const years = [
    ...new Set(
      data.papers
        .map(p =>
          (
            String(
              best(
                p,
                'pubmed_date',
                'publicationDate'
              )
            ).match(
              /\b(19|20)\d{2}\b/
            ) || []
          )[0]
        )
        .filter(Boolean)
    )
  ]
    .sort()
    .reverse();

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

    const esc = v =>
      '"' +
      String(
        Array.isArray(v)
          ? v.join('; ')
          : v ?? ''
      ).replaceAll(
        '"',
        '""'
      ) +
      '"';

    download(
      'cancer_insight_' +
        data.cancer.replaceAll(
          ' ',
          '_'
        ) +
        '_papers.csv',

      [
        cols.join(','),

        ...papers.map(p =>
          cols
            .map(c => esc(p[c]))
            .join(',')
        )
      ].join('\n'),

      'text/csv'
    );
  }

  return (
    <>
      <h1>
        Research Papers
      </h1>

      <p className="muted">
        {title(data.cancer)} · enriched
        with PubMed metadata when a PMID
        is available
      </p>

      <div className="filters">
        <label>
          Search titles, abstracts,
          journals, or MeSH terms

          <input
            value={q}
            onChange={e =>
              setQ(e.target.value)
            }
          />
        </label>

        <label>
          Access

          <select
            value={access}
            onChange={e =>
              setAccess(
                e.target.value
              )
            }
          >
            {[
              'All',
              'Free full text in PMC',
              'Has abstract',
              'Has full-text link'
            ].map(x => (
              <option key={x}>
                {x}
              </option>
            ))}
          </select>
        </label>

        <label>
          Treatment

          <select
            value={tr}
            onChange={e =>
              setTr(e.target.value)
            }
          >
            {[
              'All treatments',
              ...data.treatments.map(
                x => x[0]
              )
            ].map(x => (
              <option key={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="filters three">
        <label>
          Year

          <select
            value={year}
            onChange={e =>
              setYear(
                e.target.value
              )
            }
          >
            {[
              'All years',
              ...years
            ].map(x => (
              <option key={x}>
                {x}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sort by

          <select
            value={sort}
            onChange={e =>
              setSort(
                e.target.value
              )
            }
          >
            {[
              'Original relevance',
              'Newest first',
              'Free full text first'
            ].map(x => (
              <option key={x}>
                {x}
              </option>
            ))}
          </select>
        </label>

        <label>
          <br />

          <input
            type="checkbox"
            checked={saved}
            onChange={e =>
              setSaved(
                e.target.checked
              )
            }
          />{' '}
          Show saved papers only
        </label>
      </div>

      <div className="toolbar">
        {/*
          IMPORTANT:
          The PDF uses data.papers,
          NOT the filtered papers array.
          This exports every paper returned
          by the actual Cancer Insight search.
        */}
        <button
          onClick={() =>
            pdfReport(
              data.cancer,
              data.papers,
              data.treatments
            )
          }
        >
          Download PDF Research Report
        </button>

        <button onClick={csv}>
          Export Raw Data (CSV)
        </button>
      </div>

      <p>
        Showing{' '}
        <b>
          {papers.length}
        </b>{' '}
        papers
      </p>

      {papers.map((p, i) => (
        <Paper
          p={p}
          n={i + 1}
          saved={bookmarks.includes(
            key(p)
          )}
          toggle={toggle}
          key={key(p) + i}
        />
      ))}
    </>
  );
}

function Analytics({ data }) {
  if (!data) {
    return (
      <>
        <h1>
          Research Analytics
        </h1>

        <Need />
      </>
    );
  }

  return (
    <>
      <h1>
        Research Analytics
      </h1>

      <Metrics
        p={data.profile}
        tcount={
          data.treatments.length
        }
      />

      <h3>
        Treatment coverage
      </h3>

      <Bars
        items={data.treatments}
      />

      <h3>
        Publication timeline
      </h3>

      <Bars
        items={Object.entries(
          data.profile.year_counts ||
            {}
        ).sort()}
      />

      <h3>
        Top journals
      </h3>

      <Bars
        items={
          data.profile.top_journals ||
          []
        }
      />

      <div className="toolbar">
        <button
          onClick={() =>
            pdfReport(
              data.cancer,
              data.papers,
              data.treatments
            )
          }
        >
          Download PDF Research Report
        </button>

        <button
          onClick={() =>
            download(
              data.cancer.replaceAll(
                ' ',
                '_'
              ) +
                '_treatment_counts.csv',

              'treatment,paper_count\n' +
                data.treatments
                  .map(x =>
                    x.join(',')
                  )
                  .join('\n'),

              'text/csv'
            )
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
  const [tr, setTr] =
    useState('');

  const [evidence, setEvidence] =
    useState([]);

  const [busy, setBusy] =
    useState(false);

  useEffect(() => {
    if (
      data?.treatments?.length &&
      !tr
    ) {
      setTr(
        data.treatments[0][0]
      );
    }
  }, [data, tr]);

  useEffect(() => {
    if (!data || !tr) return;

    setBusy(true);

    fetch('/api/treatment', {
      method: 'POST',

      headers: {
        'content-type':
          'application/json'
      },

      body: JSON.stringify({
        cancer: data.cancer,
        treatment: tr,
        limit: 14
      })
    })
      .then(r => r.json())
      .then(j =>
        setEvidence(
          j.papers || []
        )
      )
      .finally(() =>
        setBusy(false)
      );
  }, [data, tr]);

  if (!data) {
    return (
      <>
        <h1>
          Treatment Research
        </h1>

        <Need />
      </>
    );
  }

  const api =
    data.papers.filter(p =>
      arr(p.treatmentTypes)
        .map(norm)
        .includes(norm(tr))
    );

  return (
    <>
      <h1>
        Treatment Research
      </h1>

      <label>
        Choose a treatment

        <select
          value={tr}
          onChange={e =>
            setTr(e.target.value)
          }
        >
          {data.treatments.map(x => (
            <option
              value={x[0]}
              key={x[0]}
            >
              {title(x[0])}
            </option>
          ))}
        </select>
      </label>

      <div className="panel">
        <h2>
          {title(tr)}
        </h2>

        <p>
          Evidence-focused research view
          for {title(data.cancer)} cancer.
          Statements below are based on
          retrieved PubMed-indexed papers;
          paper counts do not indicate
          medical superiority.
        </p>
      </div>

      <h2>
        Research Highlights
      </h2>

      <Metrics
        p={simpleProfile([
          ...api,
          ...evidence
        ])}
      />

      {busy && (
        <p>
          Retrieving treatment-focused
          PubMed evidence…
        </p>
      )}

      <h2>
        Papers in your Cancer Insight
        search
      </h2>

      {api.length ? (
        api.map((p, i) => (
          <Paper
            p={p}
            n={i + 1}
            saved={bookmarks.includes(
              key(p)
            )}
            toggle={toggle}
            key={key(p) + i}
          />
        ))
      ) : (
        <div className="panel">
          No API-tagged papers for this
          treatment were returned in the
          current search.
        </div>
      )}

      <h2>
        Additional PubMed evidence
      </h2>

      {evidence
        .slice(0, 8)
        .map((p, i) => (
          <Paper
            p={p}
            n={i + 1}
            saved={bookmarks.includes(
              key(p)
            )}
            toggle={toggle}
            key={key(p) + i}
          />
        ))}
    </>
  );
}

function Compare({ data }) {
  const [a, setA] =
    useState('');

  const [b, setB] =
    useState('');

  const [ea, setEa] =
    useState([]);

  const [eb, setEb] =
    useState([]);

  useEffect(() => {
    if (
      data?.treatments?.length
    ) {
      setA(
        x =>
          x ||
          data.treatments[0]?.[0] ||
          ''
      );

      setB(
        x =>
          x ||
          data.treatments[1]?.[0] ||
          ''
      );
    }
  }, [data]);

  useEffect(() => {
    if (
      !data ||
      !a ||
      !b ||
      a === b
    ) {
      return;
    }

    Promise.all(
      [a, b].map(t =>
        fetch('/api/treatment', {
          method: 'POST',

          headers: {
            'content-type':
              'application/json'
          },

          body: JSON.stringify({
            cancer: data.cancer,
            treatment: t,
            limit: 12
          })
        }).then(r => r.json())
      )
    ).then(([x, y]) => {
      setEa(x.papers || []);
      setEb(y.papers || []);
    });
  }, [data, a, b]);

  if (!data) {
    return (
      <>
        <h1>
          Compare Treatments
        </h1>

        <Need />
      </>
    );
  }

  if (
    data.treatments.length < 2
  ) {
    return (
      <div className="panel">
        At least two treatment types are
        needed for comparison.
      </div>
    );
  }

  const pa =
    simpleProfile([
      ...data.papers.filter(p =>
        arr(p.treatmentTypes)
          .map(norm)
          .includes(norm(a))
      ),
      ...ea
    ]);

  const pb =
    simpleProfile([
      ...data.papers.filter(p =>
        arr(p.treatmentTypes)
          .map(norm)
          .includes(norm(b))
      ),
      ...eb
    ]);

  return (
    <>
      <h1>
        Compare Treatments
      </h1>

      <div className="compare">
        <label>
          First treatment

          <select
            value={a}
            onChange={e =>
              setA(
                e.target.value
              )
            }
          >
            {data.treatments.map(x => (
              <option
                value={x[0]}
                key={x[0]}
              >
                {title(x[0])}
              </option>
            ))}
          </select>
        </label>

        <label>
          Second treatment

          <select
            value={b}
            onChange={e =>
              setB(
                e.target.value
              )
            }
          >
            {data.treatments.map(x => (
              <option
                value={x[0]}
                key={x[0]}
              >
                {title(x[0])}
              </option>
            ))}
          </select>
        </label>
      </div>

      {a === b ? (
        <div className="error">
          Choose two different treatments.
        </div>
      ) : (
        <>
          <div className="panel">
            <b>
              How to read this comparison:
            </b>{' '}
            the descriptions explain each
            treatment, while the numbers
            compare the retrieved research
            evidence. More papers or newer
            studies do not mean one
            treatment is medically better.
          </div>

          <h2>
            Research Comparison
          </h2>

          <table className="table">
            <thead>
              <tr>
                <th>
                  Measure
                </th>

                <th>
                  {title(a)}
                </th>

                <th>
                  {title(b)}
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
              ].map(([l, k]) => (
                <tr key={k}>
                  <td>
                    {l}
                  </td>

                  <td>
                    {pa[k] || '—'}
                  </td>

                  <td>
                    {pb[k] || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="compare">
            <div>
              <h3>
                {title(a)} — strongest
                supporting PubMed evidence
              </h3>

              {ea
                .slice(0, 3)
                .map((p, i) => (
                  <Paper
                    p={p}
                    n={i + 1}
                    saved={false}
                    toggle={() => {}}
                    key={key(p) + i}
                  />
                ))}
            </div>

            <div>
              <h3>
                {title(b)} — strongest
                supporting PubMed evidence
              </h3>

              {eb
                .slice(0, 3)
                .map((p, i) => (
                  <Paper
                    p={p}
                    n={i + 1}
                    saved={false}
                    toggle={() => {}}
                    key={key(p) + i}
                  />
                ))}
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
  const [busy, setBusy] =
    useState(false);

  useEffect(() => {
    if (!data) return;

    setBusy(true);

    fetch('/api/images', {
      method: 'POST',

      headers: {
        'content-type':
          'application/json'
      },

      body: JSON.stringify({
        cancer: data.cancer
      })
    })
      .then(r => r.json())
      .then(j =>
        setImages(
          j.images || []
        )
      )
      .finally(() =>
        setBusy(false)
      );
  }, [data, setImages]);

  if (!data) {
    return (
      <>
        <h1>
          Cancer Images
        </h1>

        <Need />
      </>
    );
  }

  return (
    <>
      <h1>
        Cancer Images
      </h1>

      <p className="muted">
        Scientific and medically relevant
        images for {title(data.cancer)}{' '}
        cancer are retrieved from Wikimedia
        Commons. The gallery prioritizes
        MRI/CT, pathology, histology,
        microscopy, tumor specimens,
        segmentation, and medical diagrams;
        documents and unrelated photographs
        are excluded. Source/license metadata
        is shown when Commons supplies it.
      </p>

      {busy && (
        <p>
          Finding medically relevant
          scientific images…
        </p>
      )}

      <div className="images">
        {images.map((x, i) => (
          <div
            className="imagecard"
            key={i}
          >
            <img
              src={x.thumbnail}
              alt={
                x.title ||
                'Medical image'
              }
            />

            <h3>
              {x.title}
            </h3>

            {x.description && (
              <p className="muted">
                {clean(
                  x.description
                ).slice(0, 180)}
              </p>
            )}

            {x.license && (
              <p className="muted">
                License:{' '}
                {clean(x.license)}
              </p>
            )}

            {x.artist && (
              <p className="muted">
                Creator:{' '}
                {clean(
                  x.artist
                ).slice(0, 120)}
              </p>
            )}

            <a
              href={x.original}
              target="_blank"
            >
              Open original source
            </a>
          </div>
        ))}
      </div>
    </>
  );
}

function About() {
  return (
    <>
      <h1>
        About Cancer Insight
      </h1>

      <p>
        Cancer Insight is an educational
        cancer-research exploration platform.
        It combines a cancer-research API
        with PubMed/NCBI metadata so users
        can inspect papers, research themes,
        treatment evidence, and free-full-text
        availability while keeping the
        original sources visible.
      </p>

      <h2>
        How treatment descriptions work
      </h2>

      <p>
        Cancer Insight gives a plain-language
        definition of the treatment itself,
        then displays cancer-specific
        statements extracted from multiple
        PubMed-indexed abstracts. Each
        displayed research statement is
        linked back to identifiable PubMed
        sources through PMID references and
        source cards.
      </p>

      <h2>
        Access labels
      </h2>

      <ul>
        <li>
          <b>
            Free full text in PMC:
          </b>{' '}
          freely readable in PubMed Central;
          this does not automatically mean
          unrestricted reuse.
        </li>

        <li>
          <b>
            Full-text source link:
          </b>{' '}
          a publisher or research-source
          link is available; access rules
          may vary.
        </li>

        <li>
          <b>
            PubMed abstract:
          </b>{' '}
          an abstract is available even if
          Cancer Insight did not identify a
          free PMC copy.
        </li>
      </ul>

      <h2>
        Limitations
      </h2>

      <p>
        Paper counts and research summaries
        describe retrieved literature, not
        treatment effectiveness, safety, or
        suitability for an individual patient.
        Automated extraction can miss context,
        so users should read the cited papers
        and consult qualified healthcare
        professionals for personal medical
        decisions.
      </p>
    </>
  );
}

function simpleProfile(papers) {
  const years = [];
  const journals = new Set();

  let free = 0;
  let trials = 0;
  let reviews = 0;
  let meta = 0;

  papers.forEach(p => {
    if (p.pmc_id) {
      free++;
    }

    const y = (
      String(
        best(
          p,
          'pubmed_date',
          'publicationDate'
        )
      ).match(
        /\b(19|20)\d{2}\b/
      ) || []
    )[0];

    if (y) {
      years.push(+y);
    }

    const j =
      best(
        p,
        'pubmed_journal',
        'journal'
      );

    if (j) {
      journals.add(j);
    }

    const t =
      arr(p.publication_types)
        .join(' ')
        .toLowerCase();

    if (
      t.includes(
        'clinical trial'
      )
    ) {
      trials++;
    }

    if (
      t.includes('review')
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
  });

  return {
    paper_count:
      papers.length,

    free_full_text_count:
      free,

    latest_year:
      years.length
        ? Math.max(...years)
        : null,

    journals:
      [...journals],

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
    document.createElement('a');

  a.href =
    URL.createObjectURL(
      new Blob(
        [text],
        { type }
      )
    );

  a.download = name;

  a.click();

  URL.revokeObjectURL(
    a.href
  );
}

function pdfReport(cancer, papers, treatments) {
  const reportPapers =
    Array.isArray(papers)
      ? papers.slice(0, 20)
      : [];

  const d = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  /* =========================================================
     COLORS
     ========================================================= */

  const NAVY = [20, 61, 82];
  const TEAL = [31, 174, 174];
  const LIGHT = [239, 246, 248];
  const TEXT = [25, 54, 70];
  const MUTED = [92, 120, 136];
  const BORDER = [210, 225, 231];
  const WHITE = [255, 255, 255];
  const GREEN_BG = [225, 245, 239];
  const GREEN_TEXT = [25, 115, 88];

  /* =========================================================
     PAGE
     ========================================================= */

  const PAGE_W = 210;
  const MARGIN = 16;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const FOOTER_Y = 282;
  const SAFE_BOTTOM = 275;

  let pageNumber = 1;
  let y = 0;

  /* =========================================================
     HELPERS
     ========================================================= */

  function decodeEntities(value) {
    if (!value) return '';

    let s = String(value);

    if (typeof document !== 'undefined') {
      const textarea =
        document.createElement('textarea');

      textarea.innerHTML = s;
      s = textarea.value;
    }

    return s;
  }

  function safeText(value) {
    return decodeEntities(
      clean(value || '')
    )
      .replace(/\u00a0/g, ' ')
      .replace(
        /[\u2010\u2011\u2012\u2013\u2014\u2212]/g,
        '-'
      )
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\u2026/g, '...')
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .replace(/±/g, '+/-')
      .replace(/×/g, 'x')
      .replace(/µ/g, 'u')
      .replace(/μ/g, 'u')
      .replace(/α/g, 'alpha')
      .replace(/β/g, 'beta')
      .replace(/γ/g, 'gamma')
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function validUrl(url) {
    return (
      typeof url === 'string' &&
      /^https?:\/\//i.test(url)
    );
  }

  function setFont(
    style = 'normal',
    size = 8
  ) {
    d.setFont(
      'helvetica',
      style
    );

    d.setFontSize(size);
  }

  /*
    IMPORTANT:
    Font/style is set BEFORE splitting.
  */

  function wrap(
    value,
    width,
    style = 'normal',
    size = 8
  ) {
    setFont(style, size);

    return d.splitTextToSize(
      safeText(value),
      width
    );
  }

  function lineHeight(
    fontSize,
    factor = 1.25
  ) {
    return (
      fontSize *
      0.352778 *
      factor
    );
  }

  function footer() {
    d.setDrawColor(...BORDER);
    d.setLineWidth(0.25);

    d.line(
      MARGIN,
      FOOTER_Y,
      PAGE_W - MARGIN,
      FOOTER_Y
    );

    setFont('normal', 6.7);
    d.setTextColor(...MUTED);

    d.text(
      'Educational use only. Cancer Insight does not provide medical diagnosis or individualized treatment advice.',
      MARGIN,
      287
    );

    d.text(
      `Page ${pageNumber}`,
      PAGE_W - MARGIN,
      287,
      {
        align: 'right'
      }
    );
  }

  function smallHeader() {
    d.setFillColor(...NAVY);

    d.rect(
      0,
      0,
      PAGE_W,
      15,
      'F'
    );

    d.setFillColor(...TEAL);

    d.roundedRect(
      MARGIN,
      4,
      7,
      7,
      1.5,
      1.5,
      'F'
    );

    d.setTextColor(...WHITE);

    setFont('bold', 9);

    d.text(
      '+',
      MARGIN + 3.5,
      9.1,
      {
        align: 'center'
      }
    );

    setFont('bold', 9.3);

    d.text(
      'Cancer Insight',
      MARGIN + 11,
      9.5
    );

    setFont('normal', 6.8);

    d.text(
      `${title(cancer)} Cancer Research Report`,
      PAGE_W - MARGIN,
      9.4,
      {
        align: 'right'
      }
    );
  }

  function newPage() {
    footer();

    d.addPage();

    pageNumber++;

    smallHeader();

    y = 24;
  }

  function ensureSpace(height) {
    if (
      y + height >
      SAFE_BOTTOM
    ) {
      newPage();
    }
  }

  function drawLinkButton(
    label,
    url,
    x,
    top,
    width
  ) {
    if (!validUrl(url)) {
      return;
    }

    d.setFillColor(...LIGHT);
    d.setDrawColor(...BORDER);

    d.roundedRect(
      x,
      top,
      width,
      6.3,
      1.4,
      1.4,
      'FD'
    );

    d.setTextColor(...TEAL);
    setFont('bold', 6.4);

    d.textWithLink(
      label,
      x + width / 2,
      top + 4.1,
      {
        url,
        align: 'center'
      }
    );
  }

  /* =========================================================
     PAGE 1 HEADER
     ========================================================= */

  d.setFillColor(...NAVY);

  d.rect(
    0,
    0,
    PAGE_W,
    54,
    'F'
  );

  d.setFillColor(...TEAL);

  d.roundedRect(
    MARGIN,
    12,
    13,
    13,
    2.5,
    2.5,
    'F'
  );

  d.setTextColor(...WHITE);

  setFont('bold', 17);

  d.text(
    '+',
    MARGIN + 6.5,
    21.3,
    {
      align: 'center'
    }
  );

  setFont('bold', 18);

  d.text(
    'Cancer Insight',
    MARGIN + 18,
    20
  );

  setFont('normal', 8.5);

  d.text(
    'Evidence-first cancer research explorer',
    MARGIN + 18,
    26
  );

  setFont('bold', 22);

  d.text(
    'Research Report',
    MARGIN,
    43
  );

  y = 67;

  d.setTextColor(...TEXT);

  setFont('bold', 23);

  d.text(
    `${title(cancer)} Cancer`,
    MARGIN,
    y
  );

  y += 8;

  d.setTextColor(...MUTED);

  setFont('normal', 9);

  d.text(
    'Research literature overview generated by Cancer Insight',
    MARGIN,
    y
  );

  y += 13;

  /* =========================================================
     SUMMARY
     ========================================================= */

  const freeCount =
    reportPapers.filter(
      p => p.pmc_id
    ).length;

  const years =
    reportPapers
      .map(p => {
        const m =
          String(
            best(
              p,
              'pubmed_date',
              'publicationDate'
            ) || ''
          ).match(
            /\b(19|20)\d{2}\b/
          );

        return m
          ? Number(m[0])
          : null;
      })
      .filter(Boolean);

  const latestYear =
    years.length
      ? Math.max(...years)
      : '—';

  const summary = [
    [
      'Research Papers',
      reportPapers.length
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
      'Treatment Types',
      treatments?.length || 0
    ]
  ];

  const summaryGap = 4;

  const summaryW =
    (
      CONTENT_W -
      summaryGap * 3
    ) / 4;

  summary.forEach(
    ([label, value], i) => {
      const x =
        MARGIN +
        i *
          (
            summaryW +
            summaryGap
          );

      d.setFillColor(...LIGHT);
      d.setDrawColor(...BORDER);

      d.roundedRect(
        x,
        y,
        summaryW,
        25,
        2.5,
        2.5,
        'FD'
      );

      d.setTextColor(...MUTED);

      setFont('normal', 7);

      d.text(
        label,
        x + 4,
        y + 7
      );

      d.setTextColor(...NAVY);

      setFont('bold', 15);

      d.text(
        String(value),
        x + 4,
        y + 18
      );
    }
  );

  y += 35;

  /* =========================================================
     OVERVIEW
     ========================================================= */

  d.setTextColor(...NAVY);

  setFont('bold', 14);

  d.text(
    'Research Overview',
    MARGIN,
    y
  );

  y += 7;

  const intro =
    `This report summarizes ${reportPapers.length} research papers retrieved for ${title(cancer)} cancer. ` +
    'Cancer Insight presents publication metadata, abstracts, treatment research coverage, and links to original scientific sources. ' +
    'The report describes retrieved research literature and does not rank treatments or provide medical recommendations.';

  const introLines =
    wrap(
      intro,
      CONTENT_W,
      'normal',
      8.4
    );

  d.setTextColor(...TEXT);

  setFont('normal', 8.4);

  const introLH =
    lineHeight(
      8.4,
      1.3
    );

  d.text(
    introLines,
    MARGIN,
    y
  );

  y +=
    introLines.length *
      introLH +
    9;

  /* =========================================================
     TREATMENT COVERAGE
     ========================================================= */

  if (
    treatments &&
    treatments.length
  ) {
    d.setTextColor(...NAVY);

    setFont('bold', 14);

    d.text(
      'Treatment Research Coverage',
      MARGIN,
      y
    );

    y += 8;

    const list =
      treatments.slice(
        0,
        8
      );

    const max =
      Math.max(
        1,
        ...list.map(
          x =>
            Number(x[1]) ||
            0
        )
      );

    list.forEach(
      ([name, count]) => {
        ensureSpace(8);

        d.setTextColor(...TEXT);

        setFont('normal', 8);

        d.text(
          title(name).slice(
            0,
            34
          ),
          MARGIN,
          y + 3
        );

        const barX =
          MARGIN + 60;

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

        d.setFillColor(...TEAL);

        d.roundedRect(
          barX,
          y,
          Math.max(
            3,
            Number(count) /
              max *
              barW
          ),
          4,
          1,
          1,
          'F'
        );

        d.setTextColor(...NAVY);

        setFont('bold', 8);

        d.text(
          String(count),
          PAGE_W - MARGIN,
          y + 3,
          {
            align: 'right'
          }
        );

        y += 8;
      }
    );
  }

  /* =========================================================
     RESEARCH PAPERS
     ========================================================= */

  newPage();

  d.setTextColor(...NAVY);

  setFont('bold', 16);

  d.text(
    'Research Papers',
    MARGIN,
    y
  );

  y += 5;

  d.setDrawColor(...TEAL);
  d.setLineWidth(0.8);

  d.line(
    MARGIN,
    y,
    MARGIN + 35,
    y
  );

  y += 10;

  reportPapers.forEach(
    (p, i) => {
      /*
        Larger padding than before.
        The card is 178 mm wide.
        Text gets only 156 mm.
        This creates a real safety margin
        on BOTH sides.
      */

      const CARD_X =
        MARGIN;

      const CARD_W =
        CONTENT_W;

      const NUMBER_W =
        11;

      const INNER_LEFT =
        CARD_X +
        7 +
        NUMBER_W;

      const INNER_RIGHT =
        CARD_X +
        CARD_W -
        7;

      const INNER_W =
        INNER_RIGHT -
        INNER_LEFT;

      /*
        TITLE
      */

      const titleLines =
        wrap(
          safeText(
            best(
              p,
              'pubmed_title',
              'title'
            )
          ) ||
            'Untitled research paper',
          INNER_W,
          'bold',
          8.7
        );

      const titleLH =
        lineHeight(
          8.7,
          1.25
        );

      /*
        META
      */

      const metaText =
        [
          safeText(
            best(
              p,
              'pubmed_journal',
              'journal'
            )
          ),
          safeText(
            best(
              p,
              'pubmed_date',
              'publicationDate'
            )
          ),
          safeText(
            Array.isArray(
              p.pubmed_authors
            )
              ? p.pubmed_authors.join(
                  ', '
                )
              : p.pubmed_authors
          )
        ]
          .filter(Boolean)
          .join(' | ');

      let metaLines =
        metaText
          ? wrap(
              metaText,
              INNER_W,
              'normal',
              6.3
            )
          : [];

      /*
        Extremely long author lists can
        create giant cards.

        Keep max 3 properly wrapped lines.
      */

      if (
        metaLines.length >
        3
      ) {
        metaLines =
          metaLines.slice(
            0,
            3
          );

        metaLines[2] =
          String(
            metaLines[2]
          )
            .replace(
              /\.*$/,
              ''
            ) +
          '...';
      }

      const metaLH =
        lineHeight(
          6.3,
          1.25
        );

      /*
        ABSTRACT

        We intentionally use 5 lines here.
        This guarantees readable cards and
        prevents text ever escaping.

        The website still contains the
        COMPLETE abstract.
      */

      const abs =
        safeText(
          best(
            p,
            'pubmed_abstract',
            'abstract'
          )
        );

      let abstractLines =
        abs
          ? wrap(
              abs,
              INNER_W,
              'normal',
              7
            )
          : [];

      if (
        abstractLines.length >
        5
      ) {
        abstractLines =
          abstractLines.slice(
            0,
            5
          );

        abstractLines[4] =
          String(
            abstractLines[4]
          )
            .replace(
              /\.*$/,
              ''
            ) +
          '...';
      }

      const abstractLH =
        lineHeight(
          7,
          1.3
        );

      /*
        TREATMENTS
      */

      const treatmentText =
        arr(
          p.treatmentTypes
        ).length
          ? `Treatments mentioned: ${arr(
              p.treatmentTypes
            )
              .map(title)
              .join(', ')}`
          : '';

      let treatmentLines =
        treatmentText
          ? wrap(
              treatmentText,
              INNER_W,
              'bold',
              6.3
            )
          : [];

      if (
        treatmentLines.length >
        2
      ) {
        treatmentLines =
          treatmentLines.slice(
            0,
            2
          );
      }

      const treatmentLH =
        lineHeight(
          6.3,
          1.25
        );

      const hasPubMed =
        validUrl(
          p.pubmed_url
        );

      const hasPMC =
        validUrl(
          p.pmc_url
        );

      const hasPublisher =
        validUrl(
          p.publisher_url
        );

      const hasLinks =
        hasPubMed ||
        hasPMC ||
        hasPublisher;

      /*
        HEIGHT CALCULATION

        EXACT same line counts and
        exact line heights used below.
      */

      const TOP_PAD =
        7;

      const BOTTOM_PAD =
        6;

      const titleHeight =
        titleLines.length *
        titleLH;

      const metaHeight =
        metaLines.length
          ? metaLines.length *
              metaLH +
            2.5
          : 0;

      const badgeHeight =
        p.pmc_id
          ? 7
          : 0;

      const abstractHeight =
        abstractLines.length
          ? abstractLines.length *
              abstractLH +
            3
          : 0;

      const treatmentHeight =
        treatmentLines.length
          ? treatmentLines.length *
              treatmentLH +
            3
          : 0;

      const linkHeight =
        hasLinks
          ? 10
          : 0;

      const cardHeight =
        Math.max(
          34,
          TOP_PAD +
            titleHeight +
            metaHeight +
            badgeHeight +
            abstractHeight +
            treatmentHeight +
            linkHeight +
            BOTTOM_PAD
        );

      ensureSpace(
        cardHeight + 6
      );

      const startY =
        y;

      /*
        CARD
      */

      d.setFillColor(
        250,
        252,
        253
      );

      d.setDrawColor(...BORDER);
      d.setLineWidth(0.3);

      d.roundedRect(
        CARD_X,
        startY,
        CARD_W,
        cardHeight,
        2.5,
        2.5,
        'FD'
      );

      /*
        PAPER NUMBER
      */

      d.setFillColor(...TEAL);

      d.roundedRect(
        CARD_X + 5,
        startY + 5,
        8,
        8,
        1.5,
        1.5,
        'F'
      );

      d.setTextColor(...WHITE);

      setFont(
        'bold',
        i + 1 >= 10
          ? 5.8
          : 6.6
      );

      d.text(
        String(i + 1),
        CARD_X + 9,
        startY + 10.1,
        {
          align: 'center'
        }
      );

      let py =
        startY + 8.5;

      /*
        TITLE
      */

      d.setTextColor(...NAVY);

      setFont('bold', 8.7);

      d.text(
        titleLines,
        INNER_LEFT,
        py,
        {
          maxWidth:
            INNER_W
        }
      );

      py +=
        titleHeight +
        2;

      /*
        META
      */

      if (
        metaLines.length
      ) {
        d.setTextColor(...MUTED);

        setFont(
          'normal',
          6.3
        );

        d.text(
          metaLines,
          INNER_LEFT,
          py,
          {
            maxWidth:
              INNER_W
          }
        );

        py +=
          metaLines.length *
            metaLH +
          2.5;
      }

      /*
        PMC BADGE
      */

      if (p.pmc_id) {
        d.setFillColor(
          ...GREEN_BG
        );

        d.setTextColor(
          ...GREEN_TEXT
        );

        d.roundedRect(
          INNER_LEFT,
          py - 1.7,
          27,
          5,
          1.3,
          1.3,
          'F'
        );

        setFont(
          'bold',
          5.7
        );

        d.text(
          'FREE FULL TEXT',
          INNER_LEFT + 2.5,
          py + 1.5
        );

        py += 7;
      }

      /*
        ABSTRACT
      */

      if (
        abstractLines.length
      ) {
        d.setTextColor(...TEXT);

        setFont(
          'normal',
          7
        );

        d.text(
          abstractLines,
          INNER_LEFT,
          py,
          {
            maxWidth:
              INNER_W
          }
        );

        py +=
          abstractLines.length *
            abstractLH +
          3;
      }

      /*
        TREATMENTS
      */

      if (
        treatmentLines.length
      ) {
        d.setTextColor(...TEAL);

        setFont(
          'bold',
          6.3
        );

        d.text(
          treatmentLines,
          INNER_LEFT,
          py,
          {
            maxWidth:
              INNER_W
          }
        );

        py +=
          treatmentLines.length *
            treatmentLH +
          3;
      }

      /*
        LINKS

        Anchored inside bottom edge.
      */

      if (hasLinks) {
        const linkY =
          startY +
          cardHeight -
          9;

        let linkX =
          INNER_LEFT;

        if (hasPubMed) {
          drawLinkButton(
            'PubMed',
            p.pubmed_url,
            linkX,
            linkY,
            23
          );

          linkX += 26;
        }

        if (hasPMC) {
          drawLinkButton(
            'Free Full Text',
            p.pmc_url,
            linkX,
            linkY,
            31
          );

          linkX += 34;
        }

        if (hasPublisher) {
          drawLinkButton(
            'Publisher',
            p.publisher_url,
            linkX,
            linkY,
            26
          );
        }
      }

      y =
        startY +
        cardHeight +
        6;
    }
  );

  /* =========================================================
     SOURCES
     ========================================================= */

  ensureSpace(40);

  const sourceText =
    'Cancer Insight keeps original research sources visible whenever available, including PubMed, PubMed Central (PMC), DOI, and publisher links. ' +
    'Paper counts and treatment coverage describe the retrieved literature only and should not be interpreted as evidence that one treatment is superior.';

  const sourceLines =
    wrap(
      sourceText,
      CONTENT_W - 12,
      'normal',
      7.2
    );

  const sourceLH =
    lineHeight(
      7.2,
      1.3
    );

  const sourceHeight =
    16 +
    sourceLines.length *
      sourceLH +
    6;

  ensureSpace(
    sourceHeight
  );

  d.setFillColor(...LIGHT);
  d.setDrawColor(...BORDER);

  d.roundedRect(
    MARGIN,
    y,
    CONTENT_W,
    sourceHeight,
    2.5,
    2.5,
    'FD'
  );

  d.setTextColor(...NAVY);

  setFont('bold', 10);

  d.text(
    'Sources & Interpretation',
    MARGIN + 6,
    y + 8
  );

  d.setTextColor(...TEXT);

  setFont(
    'normal',
    7.2
  );

  d.text(
    sourceLines,
    MARGIN + 6,
    y + 14,
    {
      maxWidth:
        CONTENT_W - 12
    }
  );

  footer();

  /* =========================================================
     SAVE
     ========================================================= */

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
