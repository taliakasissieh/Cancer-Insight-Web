import { XMLParser } from "fast-xml-parser";

const RESEARCH = "https://www.curecancerwithai.com/api/v1/research";
const ESEARCH =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const EFETCH =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

const UA = "CancerInsight/5.0 educational-research-project";

const TARGET_PAPERS = 20;
const MAX_API_PAGES = 10;

export const norm = (s) =>
  (s || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");

export const display = (s) =>
  norm(s).replace(/\b\w/g, (c) => c.toUpperCase());

const arr = (x) =>
  x == null ? [] : Array.isArray(x) ? x : [x];

const text = (x) =>
  typeof x === "string" ? x : x?.["#text"] || "";

export function treatmentValues(v) {
  return arr(v)
    .flatMap((x) => String(x || "").split(/[,;|]/))
    .map(norm)
    .filter(Boolean);
}

function paperNorm(p) {
  return {
    ...p,

    treatmentTypes: treatmentValues(p.treatmentTypes),

    publication_types: arr(p.publication_types),

    pubmedId: String(
      p.pubmedId ||
      p.pmid ||
      p.pubmed_id ||
      ""
    ),
  };
}

/* =========================================================
   PUBMED PARSING
   ========================================================= */

function parseArticle(a) {
  const mc = a?.MedlineCitation || {};
  const art = mc.Article || {};
  const journal = art.Journal || {};

  const pmid =
    text(mc.PMID) ||
    String(mc.PMID || "");

  const abst = arr(art.Abstract?.AbstractText)
    .map(text)
    .filter(Boolean)
    .join("\n");

  const authors = arr(art.AuthorList?.Author)
    .map((x) =>
      [x.ForeName, x.LastName]
        .filter(Boolean)
        .join(" ")
    )
    .filter(Boolean);

  const pt = arr(
    art.PublicationTypeList?.PublicationType
  )
    .map(text)
    .filter(Boolean);

  const ids = arr(
    a?.PubmedData?.ArticleIdList?.ArticleId
  );

  const doi = ids.find(
    (x) => x?.["@_IdType"] === "doi"
  );

  const pmc = ids.find(
    (x) => x?.["@_IdType"] === "pmc"
  );

  const date =
    journal.JournalIssue?.PubDate || {};

  const ds = [
    date.Year,
    date.Month,
    date.Day,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    pubmedId: pmid,

    pubmed_title:
      text(art.ArticleTitle),

    pubmed_abstract:
      abst,

    pubmed_journal:
      text(journal.Title) ||
      text(journal.ISOAbbreviation),

    pubmed_date:
      ds,

    pubmed_authors:
      authors.join(", "),

    publication_types:
      pt,

    doi:
      text(doi),

    pmc_id:
      text(pmc),

    pubmed_url:
      pmid
        ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
        : "",

    pmc_url:
      text(pmc)
        ? `https://pmc.ncbi.nlm.nih.gov/articles/${text(
            pmc
          )}/`
        : "",
  };
}

/* =========================================================
   FETCH PUBMED DATA
   ========================================================= */

async function pubmedByIds(ids) {
  const cleanIds = [
    ...new Set(
      arr(ids)
        .map((id) => String(id || "").trim())
        .filter(Boolean)
    ),
  ];

  if (!cleanIds.length) return {};

  try {
    const r = await fetch(
      EFETCH +
        "?db=pubmed&retmode=xml&id=" +
        encodeURIComponent(cleanIds.join(",")),
      {
        headers: {
          "User-Agent": UA,
        },
        cache: "no-store",
      }
    );

    if (!r.ok) return {};

    const xml = await r.text();

    const j = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
    }).parse(xml);

    const arts = arr(
      j?.PubmedArticleSet?.PubmedArticle
    );

    return Object.fromEntries(
      arts
        .map(parseArticle)
        .filter((x) => x.pubmedId)
        .map((x) => [
          x.pubmedId,
          x,
        ])
    );
  } catch (error) {
    console.error(
      "PubMed enrichment error:",
      error
    );

    return {};
  }
}

/* =========================================================
   RESEARCH API PAGE FETCHER
   ========================================================= */

async function fetchResearchPage(
  cancer,
  page
) {
  const url = new URL(RESEARCH);

  url.searchParams.set(
    "cancerType",
    cancer
  );

  /*
    The API previously exposed pagination metadata.
    We request a page explicitly so Cancer Insight
    is not limited to only the first returned batch.
  */

  url.searchParams.set(
    "page",
    String(page)
  );

  const key =
    process.env.CANCER_RESEARCH_API_KEY;

  const r = await fetch(
    url.toString(),
    {
      headers: {
        Authorization: `Bearer ${key}`,
        "User-Agent": UA,
      },

      cache: "no-store",
    }
  );

  if (!r.ok) {
    throw new Error(
      `Research API returned ${r.status}`
    );
  }

  return await r.json();
}

/* =========================================================
   IDENTIFY A PAPER
   Used so duplicate papers from different pages are removed.
   ========================================================= */

function paperKey(p) {
  return String(
    p.pubmedId ||
    p.pmid ||
    p.pubmed_id ||
    p.doi ||
    p.title ||
    p.pubmed_title ||
    JSON.stringify(p)
  )
    .trim()
    .toLowerCase();
}

/* =========================================================
   MAIN CANCER SEARCH
   ========================================================= */

export async function searchCancer(input) {
  const cancer = norm(input);

  if (!cancer) {
    throw new Error(
      "Enter a cancer type to search."
    );
  }

  const key =
    process.env.CANCER_RESEARCH_API_KEY;

  if (!key) {
    throw new Error(
      "The research API key has not been configured."
    );
  }

  /*
    Collect papers across multiple API pages.

    This fixes the problem where the website showed
    only 8 papers simply because the first response
    contained 8 usable records.
  */

  const collected = new Map();

  let page = 1;

  while (
    collected.size < TARGET_PAPERS &&
    page <= MAX_API_PAGES
  ) {
    let payload;

    try {
      payload =
        await fetchResearchPage(
          cancer,
          page
        );
    } catch (error) {
      console.error(
        `Research API page ${page} failed:`,
        error
      );

      /*
        If page 1 fails, the service itself
        is unavailable.
      */

      if (page === 1) {
        throw new Error(
          "The research service could not be reached right now."
        );
      }

      break;
    }

    /*
      Support several possible response structures
      so the project is less fragile if the API
      response differs slightly.
    */

    const pagePapers = arr(
      payload?.data ||
      payload?.papers ||
      payload?.results ||
      payload?.research
    );

    if (!pagePapers.length) {
      break;
    }

    for (const rawPaper of pagePapers) {
      const paper =
        paperNorm(rawPaper);

      const id =
        paperKey(paper);

      if (!id) continue;

      if (!collected.has(id)) {
        collected.set(
          id,
          paper
        );
      }

      if (
        collected.size >=
        TARGET_PAPERS
      ) {
        break;
      }
    }

    /*
      If the API tells us there are no more pages,
      stop instead of making unnecessary requests.
    */

    const totalPages =
      Number(
        payload?.totalPages ||
        payload?.total_pages ||
        payload?.pagination?.totalPages ||
        payload?.pagination?.total_pages ||
        0
      );

    if (
      totalPages &&
      page >= totalPages
    ) {
      break;
    }

    page++;
  }

  let papers = [
    ...collected.values(),
  ];

  if (!papers.length) {
    throw new Error(
      "No research papers were found for that search."
    );
  }

  /*
    Keep at most 20 papers.
  */

  papers = papers.slice(
    0,
    TARGET_PAPERS
  );

  /* =======================================================
     PUBMED ENRICHMENT
     ======================================================= */

  const ids = [
    ...new Set(
      papers
        .map(
          (p) =>
            p.pubmedId
        )
        .filter(Boolean)
    ),
  ];

  const meta =
    await pubmedByIds(ids);

  papers = papers.map(
    (p) => {
      const pubmed =
        meta[p.pubmedId] || {};

      /*
        PubMed metadata enriches the API result,
        but we preserve the original treatmentTypes.
      */

      return paperNorm({
        ...p,
        ...pubmed,

        treatmentTypes:
          p.treatmentTypes,
      });
    }
  );

  return buildResult(
    cancer,
    papers
  );
}

/* =========================================================
   BUILD RESULT
   ========================================================= */

export function buildResult(
  cancer,
  papers
) {
  const counts = {};

  papers.forEach((p) => {
    treatmentValues(
      p.treatmentTypes
    ).forEach((t) => {
      counts[t] =
        (counts[t] || 0) + 1;
    });
  });

  const treatments =
    Object.entries(counts).sort(
      (a, b) =>
        b[1] - a[1]
    );

  return {
    cancer,
    papers,
    treatments,
    profile: profile(papers),
  };
}

/* =========================================================
   RESEARCH PROFILE / ANALYTICS
   ========================================================= */

export function profile(papers) {
  const years = {};
  const journals = {};

  let free = 0;
  let trials = 0;
  let reviews = 0;
  let meta = 0;

  papers.forEach((p) => {
    if (p.pmc_id) {
      free++;
    }

    const y = (
      String(
        p.pubmed_date ||
        p.publicationDate ||
        p.publication_date ||
        ""
      ).match(
        /\b(19|20)\d{2}\b/
      ) || []
    )[0];

    if (y) {
      years[y] =
        (years[y] || 0) + 1;
    }

    const j =
      p.pubmed_journal ||
      p.journal;

    if (j) {
      journals[j] =
        (journals[j] || 0) + 1;
    }

    const pts = arr(
      p.publication_types
    )
      .join(" ")
      .toLowerCase();

    if (
      pts.includes(
        "clinical trial"
      )
    ) {
      trials++;
    }

    if (
      pts.includes("review")
    ) {
      reviews++;
    }

    if (
      pts.includes(
        "meta-analysis"
      )
    ) {
      meta++;
    }
  });

  const ys =
    Object.keys(years).map(
      Number
    );

  return {
    paper_count:
      papers.length,

    free_full_text_count:
      free,

    latest_year:
      ys.length
        ? Math.max(...ys)
        : null,

    journals:
      Object.keys(journals),

    clinical_trials:
      trials,

    reviews,

    meta_analyses:
      meta,

    year_counts:
      years,

    top_journals:
      Object.entries(journals)
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .slice(0, 10),
  };
}

/* =========================================================
   TREATMENT RESEARCH
   ========================================================= */

export async function treatmentEvidence(
  cancer,
  treatment,
  limit = 14
) {
  const q =
    `(${norm(
      cancer
    )} cancer[Title/Abstract]) ` +
    `AND (${norm(
      treatment
    )}[Title/Abstract])`;

  try {
    const s = await fetch(
      ESEARCH +
        "?db=pubmed" +
        "&retmode=json" +
        "&retmax=" +
        encodeURIComponent(
          limit
        ) +
        "&term=" +
        encodeURIComponent(q),
      {
        headers: {
          "User-Agent": UA,
        },

        cache: "no-store",
      }
    );

    if (!s.ok) {
      return [];
    }

    const sj =
      await s.json();

    const ids =
      sj?.esearchresult
        ?.idlist || [];

    if (!ids.length) {
      return [];
    }

    const m =
      await pubmedByIds(ids);

    return ids
      .map((id) =>
        paperNorm(
          m[id] || {}
        )
      )
      .filter(
        (p) =>
          p.pubmedId
      );
  } catch (error) {
    console.error(
      "Treatment evidence error:",
      error
    );

    return [];
  }
}
