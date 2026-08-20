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

const cancerTypes = [
  'Adrenal',
  'Anal',
  'Bile Duct',
  'Bladder',
  'Bone',
  'Brain',
  'Breast',
  'Cervical',
  'Colorectal',
  'Endometrial',
  'Esophageal',
  'Eye',
  'Gallbladder',
  'Head and Neck',
  'Kidney',
  'Leukemia',
  'Liver',
  'Lung',
  'Lymphoma',
  'Melanoma',
  'Mesothelioma',
  'Multiple Myeloma',
  'Neuroendocrine',
  'Oral',
  'Ovarian',
  'Pancreatic',
  'Penile',
  'Prostate',
  'Sarcoma',
  'Skin',
  'Stomach',
  'Testicular',
  'Thymus',
  'Thyroid',
  'Uterine',
  'Vaginal',
  'Vulvar'
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
        'Select a cancer type to search.'
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

          <select
            value={input}
            onChange={e =>
              setInput(e.target.value)
            }
            required
          >
            <option value="">
              Select a cancer type
            </option>

            {cancerTypes.map(cancer => (
              <option
                key={cancer}
                value={cancer}
              >
                {cancer}
              </option>
            ))}
          </select>
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

/* =========================================================
   PDF REPORT
   ========================================================= */

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
     PAGE SETTINGS
     ========================================================= */

  const PAGE_W = 210;

  const MARGIN = 16;

  const CONTENT_W =
    PAGE_W - MARGIN * 2;

  const FOOTER_Y = 282;

  /*
    Nothing from a research card is allowed below here.
    This leaves a comfortable gap before the footer.
  */
  const SAFE_BOTTOM = 274;

  let pageNumber = 1;
  let y = 0;

  /* =========================================================
     TEXT CLEANING
     ========================================================= */

  function decodeEntities(value) {
    if (!value) return '';

    let s = String(value);

    if (
      typeof document !==
      'undefined'
    ) {
      const textarea =
        document.createElement(
          'textarea'
        );

      textarea.innerHTML = s;

      s = textarea.value;
    }

    return s;
  }

  function pdfText(value) {
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
      .replace(/≠/g, '!=')
      .replace(/≈/g, '~')
      .replace(/±/g, '+/-')
      .replace(/×/g, 'x')
      .replace(/÷/g, '/')
      .replace(/∞/g, 'infinity')
      .replace(/α/g, 'alpha')
      .replace(/β/g, 'beta')
      .replace(/γ/g, 'gamma')
      .replace(/δ/g, 'delta')
      .replace(/ε/g, 'epsilon')
      .replace(/κ/g, 'kappa')
      .replace(/λ/g, 'lambda')
      .replace(/μ/g, 'u')
      .replace(/µ/g, 'u')
      .replace(/π/g, 'pi')
      .replace(/ρ/g, 'rho')
      .replace(/σ/g, 'sigma')
      .replace(/τ/g, 'tau')
      .replace(/φ/g, 'phi')
      .replace(/χ/g, 'chi')
      .replace(/ω/g, 'omega')
      .replace(/Δ/g, 'Delta')
      .replace(/Σ/g, 'Sigma')
      .replace(/Ω/g, 'Omega')
      .replace(/⁰/g, '0')
      .replace(/¹/g, '1')
      .replace(/²/g, '2')
      .replace(/³/g, '3')
      .replace(/⁴/g, '4')
      .replace(/⁵/g, '5')
      .replace(/⁶/g, '6')
      .replace(/⁷/g, '7')
      .replace(/⁸/g, '8')
      .replace(/⁹/g, '9')
      .replace(/⁺/g, '+')
      .replace(/⁻/g, '-')
      .replace(/₀/g, '0')
      .replace(/₁/g, '1')
      .replace(/₂/g, '2')
      .replace(/₃/g, '3')
      .replace(/₄/g, '4')
      .replace(/₅/g, '5')
      .replace(/₆/g, '6')
      .replace(/₇/g, '7')
      .replace(/₈/g, '8')
      .replace(/₉/g, '9')
      .replace(/₊/g, '+')
      .replace(/₋/g, '-')
      .replace(/°/g, ' degrees ')
      .replace(/→/g, ' -> ')
      .replace(/←/g, ' <- ')
      .replace(/↔/g, ' <-> ')
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

  /* =========================================================
     FONT / WRAPPING HELPERS
     ========================================================= */

  function setPdfFont(
    style,
    size
  ) {
    d.setFont(
      'helvetica',
      style
    );

    d.setFontSize(size);

    d.setLineHeightFactor(1.2);
  }

  function wrapText(
    value,
    width,
    style,
    size
  ) {
    setPdfFont(
      style,
      size
    );

    const cleaned =
      pdfText(value);

    if (!cleaned) {
      return [];
    }

    return d.splitTextToSize(
      cleaned,
      width
    );
  }

  function realLineHeight() {
    return (
      d.getLineHeight() /
      d.internal.scaleFactor
    );
  }

  function blockHeight(
    lines,
    style,
    size
  ) {
    if (
      !lines ||
      !lines.length
    ) {
      return 0;
    }

    setPdfFont(
      style,
      size
    );

    return (
      lines.length *
      realLineHeight()
    );
  }

  function limitLines(
    lines,
    maxLines
  ) {
    if (
      lines.length <=
      maxLines
    ) {
      return lines;
    }

    const out =
      lines.slice(
        0,
        maxLines
      );

    const last =
      out.length - 1;

    out[last] =
      String(
        out[last] || ''
      )
        .replace(
          /\.*$/,
          ''
        )
        .trimEnd() +
      '...';

    return out;
  }

  /* =========================================================
     FOOTER
     ========================================================= */

  function footer() {
    d.setDrawColor(
      ...BORDER
    );

    d.setLineWidth(
      0.25
    );

    d.line(
      MARGIN,
      FOOTER_Y,
      PAGE_W - MARGIN,
      FOOTER_Y
    );

    setPdfFont(
      'normal',
      6.5
    );

    d.setTextColor(
      ...MUTED
    );

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

  /* =========================================================
     SMALL HEADER
     ========================================================= */

  function smallHeader() {
    d.setFillColor(
      ...NAVY
    );

    d.rect(
      0,
      0,
      PAGE_W,
      15,
      'F'
    );

    d.setFillColor(
      ...TEAL
    );

    d.roundedRect(
      MARGIN,
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

    setPdfFont(
      'bold',
      9
    );

    d.text(
      '+',
      MARGIN + 3.5,
      9.1,
      {
        align: 'center'
      }
    );

    setPdfFont(
      'bold',
      9.5
    );

    d.text(
      'Cancer Insight',
      MARGIN + 11,
      9.5
    );

    setPdfFont(
      'normal',
      6.8
    );

    d.text(
      `${title(cancer)} Cancer Research Report`,
      PAGE_W - MARGIN,
      9.5,
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

  /* =========================================================
     LINK BUTTON
     ========================================================= */

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
      6.2,
      1.4,
      1.4,
      'FD'
    );

    d.setTextColor(
      ...TEAL
    );

    setPdfFont(
      'bold',
      6.3
    );

    d.textWithLink(
      label,
      x + width / 2,
      top + 4,
      {
        url,
        align: 'center'
      }
    );
  }

  /* =========================================================
     PAGE 1 — COVER
     ========================================================= */

  d.setFillColor(
    ...NAVY
  );

  d.rect(
    0,
    0,
    PAGE_W,
    54,
    'F'
  );

  d.setFillColor(
    ...TEAL
  );

  d.roundedRect(
    MARGIN,
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

  setPdfFont(
    'bold',
    17
  );

  d.text(
    '+',
    MARGIN + 6.5,
    21.3,
    {
      align: 'center'
    }
  );

  setPdfFont(
    'bold',
    18
  );

  d.text(
    'Cancer Insight',
    MARGIN + 18,
    20
  );

  setPdfFont(
    'normal',
    8.5
  );

  d.text(
    'Evidence-first cancer research explorer',
    MARGIN + 18,
    26
  );

  setPdfFont(
    'bold',
    22
  );

  d.text(
    'Research Report',
    MARGIN,
    43
  );

  y = 67;

  /* =========================================================
     CANCER TITLE
     ========================================================= */

  d.setTextColor(
    ...TEXT
  );

  setPdfFont(
    'bold',
    23
  );

  d.text(
    `${title(cancer)} Cancer`,
    MARGIN,
    y
  );

  y += 8;

  d.setTextColor(
    ...MUTED
  );

  setPdfFont(
    'normal',
    9
  );

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
      .map(
        p => {
          const found =
            String(
              best(
                p,
                'pubmed_date',
                'publicationDate'
              ) || ''
            ).match(
              /\b(19|20)\d{2}\b/
            );

          return found
            ? Number(
                found[0]
              )
            : null;
        }
      )
      .filter(Boolean);

  const latestYear =
    years.length
      ? Math.max(
          ...years
        )
      : '—';

  const cards = [
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

  const summaryGap =
    4;

  const summaryW =
    (
      CONTENT_W -
      summaryGap * 3
    ) / 4;

  cards.forEach(
    ([label, value], i) => {
      const x =
        MARGIN +
        i *
          (
            summaryW +
            summaryGap
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
        summaryW,
        25,
        2.5,
        2.5,
        'FD'
      );

      d.setTextColor(
        ...MUTED
      );

      setPdfFont(
        'normal',
        7
      );

      d.text(
        label,
        x + 4,
        y + 7
      );

      d.setTextColor(
        ...NAVY
      );

      setPdfFont(
        'bold',
        15
      );

      d.text(
        String(value),
        x + 4,
        y + 18
      );
    }
  );

  y += 35;

  /* =========================================================
     RESEARCH OVERVIEW
     ========================================================= */

  d.setTextColor(
    ...NAVY
  );

  setPdfFont(
    'bold',
    14
  );

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
    wrapText(
      intro,
      CONTENT_W,
      'normal',
      8.4
    );

  d.setTextColor(
    ...TEXT
  );

  setPdfFont(
    'normal',
    8.4
  );

  d.text(
    introLines,
    MARGIN,
    y,
    {
      maxWidth:
        CONTENT_W
    }
  );

  y +=
    blockHeight(
      introLines,
      'normal',
      8.4
    ) +
    9;

  /* =========================================================
     TREATMENT COVERAGE
     ========================================================= */

  if (
    treatments &&
    treatments.length
  ) {
    d.setTextColor(
      ...NAVY
    );

    setPdfFont(
      'bold',
      14
    );

    d.text(
      'Treatment Research Coverage',
      MARGIN,
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
          item =>
            Number(
              item[1]
            ) || 0
        )
      );

    treatmentList.forEach(
      ([name, count]) => {
        ensureSpace(8);

        d.setTextColor(
          ...TEXT
        );

        setPdfFont(
          'normal',
          8
        );

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

        d.setFillColor(
          ...TEAL
        );

        d.roundedRect(
          barX,
          y,
          Math.max(
            3,
            (
              Number(count) /
              max
            ) *
              barW
          ),
          4,
          1,
          1,
          'F'
        );

        d.setTextColor(
          ...NAVY
        );

        setPdfFont(
          'bold',
          8
        );

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
     START RESEARCH PAPERS ON NEW PAGE
     ========================================================= */

  newPage();

  d.setTextColor(
    ...NAVY
  );

  setPdfFont(
    'bold',
    16
  );

  d.text(
    'Research Papers',
    MARGIN,
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
    MARGIN,
    y,
    MARGIN + 35,
    y
  );

  y += 10;

  /* =========================================================
     RESEARCH PAPER CARDS
     ========================================================= */

  reportPapers.forEach(
    (p, index) => {
      const CARD_X =
        MARGIN;

      const CARD_W =
        CONTENT_W;

      const CARD_RIGHT =
        CARD_X +
        CARD_W;

      const TEXT_X =
        CARD_X + 17;

      const TEXT_RIGHT =
        CARD_RIGHT - 8;

      const TEXT_W =
        TEXT_RIGHT -
        TEXT_X;

      let titleLines =
        wrapText(
          best(
            p,
            'pubmed_title',
            'title'
          ) ||
            'Untitled research paper',
          TEXT_W,
          'bold',
          8.5
        );

      titleLines =
        limitLines(
          titleLines,
          4
        );

      const titleHeight =
        blockHeight(
          titleLines,
          'bold',
          8.5
        );

      const metaText =
        [
          best(
            p,
            'pubmed_journal',
            'journal'
          ),

          best(
            p,
            'pubmed_date',
            'publicationDate'
          ),

          Array.isArray(
            p.pubmed_authors
          )
            ? p.pubmed_authors.join(
                ', '
              )
            : p.pubmed_authors
        ]
          .filter(Boolean)
          .map(pdfText)
          .join(' | ');

      let metaLines =
        wrapText(
          metaText,
          TEXT_W,
          'normal',
          6
        );

      metaLines =
        limitLines(
          metaLines,
          3
        );

      const metaHeight =
        blockHeight(
          metaLines,
          'normal',
          6
        );

      const abstractText =
        best(
          p,
          'pubmed_abstract',
          'abstract'
        );

      let abstractLines =
        wrapText(
          abstractText,
          TEXT_W,
          'normal',
          6.8
        );

      abstractLines =
        limitLines(
          abstractLines,
          6
        );

      const abstractHeight =
        blockHeight(
          abstractLines,
          'normal',
          6.8
        );

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
        wrapText(
          treatmentText,
          TEXT_W,
          'bold',
          6.2
        );

      treatmentLines =
        limitLines(
          treatmentLines,
          2
        );

      const treatmentHeight =
        blockHeight(
          treatmentLines,
          'bold',
          6.2
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

      const TOP_PADDING =
        7;

      const BOTTOM_PADDING =
        6;

      const SPACE_AFTER_TITLE =
        2;

      const SPACE_AFTER_META =
        metaLines.length
          ? 3
          : 0;

      const PMC_HEIGHT =
        p.pmc_id
          ? 7
          : 0;

      const SPACE_AFTER_ABSTRACT =
        abstractLines.length
          ? 3
          : 0;

      const SPACE_AFTER_TREATMENT =
        treatmentLines.length
          ? 3
          : 0;

      const LINKS_HEIGHT =
        hasLinks
          ? 10
          : 0;

      let cardHeight =
        TOP_PADDING +

        titleHeight +
        SPACE_AFTER_TITLE +

        metaHeight +
        SPACE_AFTER_META +

        PMC_HEIGHT +

        abstractHeight +
        SPACE_AFTER_ABSTRACT +

        treatmentHeight +
        SPACE_AFTER_TREATMENT +

        LINKS_HEIGHT +

        BOTTOM_PADDING;

      cardHeight =
        Math.max(
          cardHeight,
          38
        );

      ensureSpace(
        cardHeight + 6
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

      d.setLineWidth(
        0.3
      );

      d.roundedRect(
        CARD_X,
        startY,
        CARD_W,
        cardHeight,
        2.5,
        2.5,
        'FD'
      );

      d.setFillColor(
        ...TEAL
      );

      d.roundedRect(
        CARD_X + 5,
        startY + 5,
        8,
        8,
        1.5,
        1.5,
        'F'
      );

      d.setTextColor(
        ...WHITE
      );

      setPdfFont(
        'bold',
        index + 1 >= 10
          ? 5.8
          : 6.6
      );

      d.text(
        String(
          index + 1
        ),
        CARD_X + 9,
        startY + 10.1,
        {
          align: 'center'
        }
      );

      let py =
        startY +
        TOP_PADDING +
        1.5;

      d.setTextColor(
        ...NAVY
      );

      setPdfFont(
        'bold',
        8.5
      );

      d.text(
        titleLines,
        TEXT_X,
        py,
        {
          maxWidth:
            TEXT_W
        }
      );

      py +=
        titleHeight +
        SPACE_AFTER_TITLE;

      if (
        metaLines.length
      ) {
        d.setTextColor(
          ...MUTED
        );

        setPdfFont(
          'normal',
          6
        );

        d.text(
          metaLines,
          TEXT_X,
          py,
          {
            maxWidth:
              TEXT_W
          }
        );

        py +=
          metaHeight +
          SPACE_AFTER_META;
      }

      if (p.pmc_id) {
        d.setFillColor(
          ...GREEN_BG
        );

        d.setTextColor(
          ...GREEN_TEXT
        );

        d.roundedRect(
          TEXT_X,
          py - 1.6,
          27,
          5,
          1.3,
          1.3,
          'F'
        );

        setPdfFont(
          'bold',
          5.6
        );

        d.text(
          'FREE FULL TEXT',
          TEXT_X + 2.5,
          py + 1.5
        );

        py +=
          PMC_HEIGHT;
      }

      if (
        abstractLines.length
      ) {
        d.setTextColor(
          ...TEXT
        );

        setPdfFont(
          'normal',
          6.8
        );

        d.text(
          abstractLines,
          TEXT_X,
          py,
          {
            maxWidth:
              TEXT_W
          }
        );

        py +=
          abstractHeight +
          SPACE_AFTER_ABSTRACT;
      }

      if (
        treatmentLines.length
      ) {
        d.setTextColor(
          ...TEAL
        );

        setPdfFont(
          'bold',
          6.2
        );

        d.text(
          treatmentLines,
          TEXT_X,
          py,
          {
            maxWidth:
              TEXT_W
          }
        );

        py +=
          treatmentHeight +
          SPACE_AFTER_TREATMENT;
      }

      if (hasLinks) {
        const buttonY =
          startY +
          cardHeight -
          9;

        let buttonX =
          TEXT_X;

        if (hasPubMed) {
          drawLinkButton(
            'PubMed',
            p.pubmed_url,
            buttonX,
            buttonY,
            22
          );

          buttonX +=
            25;
        }

        if (hasPMC) {
          drawLinkButton(
            'Free Full Text',
            p.pmc_url,
            buttonX,
            buttonY,
            31
          );

          buttonX +=
            34;
        }

        if (hasPublisher) {
          drawLinkButton(
            'Publisher',
            p.publisher_url,
            buttonX,
            buttonY,
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
     SOURCES & INTERPRETATION
     ========================================================= */

  const sourceText =
    'Cancer Insight keeps original research sources visible whenever available, including PubMed, PubMed Central (PMC), DOI, and publisher links. ' +
    'Paper counts and treatment coverage describe the retrieved literature only and should not be interpreted as evidence that one treatment is superior.';

  const sourceLines =
    wrapText(
      sourceText,
      CONTENT_W - 12,
      'normal',
      7
    );

  const sourceTextHeight =
    blockHeight(
      sourceLines,
      'normal',
      7
    );

  const sourceHeight =
    15 +
    sourceTextHeight +
    6;

  ensureSpace(
    sourceHeight +
    5
  );

  d.setFillColor(
    ...LIGHT
  );

  d.setDrawColor(
    ...BORDER
  );

  d.roundedRect(
    MARGIN,
    y,
    CONTENT_W,
    sourceHeight,
    2.5,
    2.5,
    'FD'
  );

  d.setTextColor(
    ...NAVY
  );

  setPdfFont(
    'bold',
    10
  );

  d.text(
    'Sources & Interpretation',
    MARGIN + 6,
    y + 8
  );

  d.setTextColor(
    ...TEXT
  );

  setPdfFont(
    'normal',
    7
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
