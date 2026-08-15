import { XMLParser } from "fast-xml-parser";

const RESEARCH =
  "https://www.curecancerwithai.com/api/v1/research";

const ESEARCH =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";

const EFETCH =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

const UA =
  "CancerInsight/5.0 educational-research-project";

/*
  Cure Cancer With AI supports limit=1–100.
  We deliberately request 100 candidates so the
  /api/search relevance filter has enough papers
  from which to choose the best 20.
*/
const API_CANDIDATE_LIMIT = 100;

export const norm = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");

export const display = (s) =>
  norm(s).replace(
    /\b\w/g,
    (c) => c.toUpperCase()
  );

const arr = (x) =>
  x == null
    ? []
    : Array.isArray(x)
      ? x
      : [x];

const text = (x) =>
  typeof x === "string"
    ? x
    : x?.["#text"] || "";

export function treatmentValues(v) {
  return arr(v)
    .flatMap((x) =>
      String(x || "").split(/[,;|]/)
    )
    .map(norm)
    .filter(Boolean);
}

function paperNorm(p) {
  return {
    ...p,

    treatmentTypes:
      treatmentValues(
        p.treatmentTypes
      ),

    publication_types:
      arr(
        p.publication_types
      ),

    pubmedId:
      String(
        p.pubmedId ||
        p.pmid ||
        p.pubmed_id ||
        ""
      ),
  };
}

/* =========================================================
   PUBMED PARSER
   ========================================================= */

function parseArticle(a) {
  const mc =
    a?.MedlineCitation || {};

  const art =
    mc.Article || {};

  const journal =
    art.Journal || {};

  const pmid =
    text(mc.PMID) ||
    String(mc.PMID || "");

  const abst =
    arr(
      art.Abstract?.AbstractText
    )
      .map(text)
      .filter(Boolean)
      .join("\n");

  const authors =
    arr(
      art.AuthorList?.Author
    )
      .map((x) =>
        [
          x.ForeName,
          x.LastName,
        ]
          .filter(Boolean)
          .join(" ")
      )
      .filter(Boolean);

  const publicationTypes =
    arr(
      art.PublicationTypeList
        ?.PublicationType
    )
      .map(text)
      .filter(Boolean);

  const articleIds =
    arr(
      a?.PubmedData
        ?.ArticleIdList
        ?.ArticleId
    );

  const doi =
    articleIds.find(
      (x) =>
        x?.["@_IdType"] ===
        "doi"
    );

  const pmc =
    articleIds.find(
      (x) =>
        x?.["@_IdType"] ===
        "pmc"
    );

  const date =
    journal
      .JournalIssue
      ?.PubDate || {};

  const dateString =
    [
      date.Year,
      date.Month,
      date.Day,
    ]
      .filter(Boolean)
      .join(" ");

  return {
    pubmedId:
      pmid,

    pubmed_title:
      text(
        art.ArticleTitle
      ),

    pubmed_abstract:
      abst,

    pubmed_journal:
      text(journal.Title) ||
      text(
        journal.ISOAbbreviation
      ),

    pubmed_date:
      dateString,

    pubmed_authors:
      authors.join(", "),

    publication_types:
      publicationTypes,

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
   PUBMED ENRICHMENT
   ========================================================= */

async function pubmedByIds(ids) {
  const uniqueIds = [
    ...new Set(
      arr(ids)
        .map((id) =>
          String(
            id || ""
          ).trim()
        )
        .filter(Boolean)
    ),
  ];

  if (!uniqueIds.length) {
    return {};
  }

  /*
    NCBI can accept a comma-separated PMID list.
    100 papers is still perfectly reasonable here.
  */

  try {
    const r =
      await fetch(
        EFETCH +
          "?db=pubmed" +
          "&retmode=xml" +
          "&id=" +
          encodeURIComponent(
            uniqueIds.join(",")
          ),
        {
          headers: {
            "User-Agent":
              UA,
          },

          cache:
            "no-store",
        }
      );

    if (!r.ok) {
      console.error(
        "PubMed EFETCH failed:",
        r.status
      );

      return {};
    }

    const xml =
      await r.text();

    const parsed =
      new XMLParser({
        ignoreAttributes:
          false,

        trimValues:
          true,
      }).parse(xml);

    const articles =
      arr(
        parsed
          ?.PubmedArticleSet
          ?.PubmedArticle
      );

    return Object.fromEntries(
      articles
        .map(parseArticle)
        .filter(
          (x) =>
            x.pubmedId
        )
        .map(
          (x) => [
            x.pubmedId,
            x,
          ]
        )
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
   MAIN CANCER SEARCH
   ========================================================= */

export async function searchCancer(
  input
) {
  const cancer =
    norm(input);

  if (!cancer) {
    throw new Error(
      "Enter a cancer type to search."
    );
  }

  const apiKey =
    process.env
      .CANCER_RESEARCH_API_KEY;

  if (!apiKey) {
    throw new Error(
      "The research API key has not been configured."
    );
  }

  /*
    IMPORTANT FIX:

    Cure Cancer With AI uses:
      limit
      offset

    NOT:
      page=1
      page=2

    Request a large pool in one call.
  */

  const url =
    new URL(RESEARCH);

  url.searchParams.set(
    "cancerType",
    cancer
  );

  url.searchParams.set(
    "limit",
    String(
      API_CANDIDATE_LIMIT
    )
  );

  url.searchParams.set(
    "offset",
    "0"
  );

  const r =
    await fetch(
      url.toString(),
      {
        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          "User-Agent":
            UA,
        },

        cache:
          "no-store",
      }
    );

  if (!r.ok) {
    const body =
      await r.text()
        .catch(() => "");

    console.error(
      "Research API error:",
      r.status,
      body
    );

    throw new Error(
      "The research service could not be reached right now."
    );
  }

  const payload =
    await r.json();

  /*
    Official response shape:
      {
        data: [...],
        pagination: {
          total,
          limit,
          offset,
          page,
          totalPages
        }
      }
  */

  let papers =
    arr(
      payload?.data
    ).map(
      paperNorm
    );

  if (!papers.length) {
    throw new Error(
      "No research papers were found for that search."
    );
  }

  /*
    Remove duplicate records before enrichment.
  */

  const seen =
    new Set();

  papers =
    papers.filter(
      (p) => {
        const id =
          String(
            p.pubmedId ||
            p.id ||
            p.doi ||
            p.title ||
            ""
          )
            .trim()
            .toLowerCase();

        if (!id) {
          return false;
        }

        if (
          seen.has(id)
        ) {
          return false;
        }

        seen.add(id);

        return true;
      }
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

  papers =
    papers.map(
      (p) => {
        const originalTreatments =
          p.treatmentTypes;

        const enriched =
          meta[
            p.pubmedId
          ] || {};

        return paperNorm({
          ...p,
          ...enriched,

          /*
            Keep treatment labels coming
            from Cure Cancer With AI.
          */
          treatmentTypes:
            originalTreatments,
        });
      }
    );

  /*
    VERY IMPORTANT:
    Do NOT slice to 20 here.

    /api/search/route.js applies the relevance filter.
    It needs the larger candidate pool to find
    the best 20 relevant papers.
  */

  return buildResult(
    cancer,
    papers
  );
}

/* =========================================================
   RESULT + TREATMENT COUNTS
   ========================================================= */

export function buildResult(
  cancer,
  papers
) {
  const counts = {};

  papers.forEach(
    (p) => {
      treatmentValues(
        p.treatmentTypes
      ).forEach(
        (t) => {
          counts[t] =
            (
              counts[t] ||
              0
            ) + 1;
        }
      );
    }
  );

  const treatments =
    Object.entries(
      counts
    ).sort(
      (a, b) =>
        b[1] -
        a[1]
    );

  return {
    cancer,

    papers,

    treatments,

    profile:
      profile(papers),
  };
}

/* =========================================================
   ANALYTICS PROFILE
   ========================================================= */

export function profile(
  papers
) {
  const years = {};
  const journals = {};

  let free = 0;
  let trials = 0;
  let reviews = 0;
  let meta = 0;

  papers.forEach(
    (p) => {
      if (
        p.pmc_id
      ) {
        free++;
      }

      const year =
        (
          String(
            p.pubmed_date ||
            p.publicationDate ||
            ""
          ).match(
            /\b(19|20)\d{2}\b/
          ) || []
        )[0];

      if (year) {
        years[year] =
          (
            years[year] ||
            0
          ) + 1;
      }

      const journal =
        p.pubmed_journal ||
        p.journal;

      if (journal) {
        journals[journal] =
          (
            journals[journal] ||
            0
          ) + 1;
      }

      const types =
        arr(
          p.publication_types
        )
          .join(" ")
          .toLowerCase();

      if (
        types.includes(
          "clinical trial"
        )
      ) {
        trials++;
      }

      if (
        types.includes(
          "review"
        )
      ) {
        reviews++;
      }

      if (
        types.includes(
          "meta-analysis"
        )
      ) {
        meta++;
      }
    }
  );

  const yearNumbers =
    Object.keys(
      years
    ).map(Number);

  return {
    paper_count:
      papers.length,

    free_full_text_count:
      free,

    latest_year:
      yearNumbers.length
        ? Math.max(
            ...yearNumbers
          )
        : null,

    journals:
      Object.keys(
        journals
      ),

    clinical_trials:
      trials,

    reviews,

    meta_analyses:
      meta,

    year_counts:
      years,

    top_journals:
      Object.entries(
        journals
      )
        .sort(
          (a, b) =>
            b[1] -
            a[1]
        )
        .slice(
          0,
          10
        ),
  };
}

/* =========================================================
   TREATMENT-SPECIFIC PUBMED EVIDENCE
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
    const s =
      await fetch(
        ESEARCH +
          "?db=pubmed" +
          "&retmode=json" +
          "&retmax=" +
          encodeURIComponent(
            limit
          ) +
          "&term=" +
          encodeURIComponent(
            q
          ),
        {
          headers: {
            "User-Agent":
              UA,
          },

          cache:
            "no-store",
        }
      );

    if (!s.ok) {
      return [];
    }

    const sj =
      await s.json();

    const ids =
      sj
        ?.esearchresult
        ?.idlist ||
      [];

    if (!ids.length) {
      return [];
    }

    const meta =
      await pubmedByIds(
        ids
      );

    return ids
      .map(
        (id) =>
          paperNorm(
            meta[id] ||
            {}
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
