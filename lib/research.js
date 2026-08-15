import { XMLParser } from "fast-xml-parser";

const RESEARCH =
  "https://www.curecancerwithai.com/api/v1/research";

const ESEARCH =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";

const EFETCH =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

const UA =
  "CancerInsight/5.0 educational-research-project";

const API_CANDIDATE_LIMIT = 100;

/* =========================================================
   BASIC HELPERS
   ========================================================= */

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

/*
  Simple text helper for fields that do not contain
  nested XML formatting.
*/
const text = (x) => {
  if (x == null) return "";

  if (
    typeof x === "string" ||
    typeof x === "number"
  ) {
    return String(x);
  }

  return String(
    x?.["#text"] || ""
  );
};

/* =========================================================
   IMPORTANT FIX:
   RECURSIVE PUBMED TEXT EXTRACTION
   ========================================================= */

/*
  PubMed often contains things such as:

  anaplastic lymphoma kinase (<i>ALK</i>)
  <sup>18</sup>F-FDG
  <b>EGFR</b>-positive

  The old code only read "#text", so text inside
  <i>, <b>, <sup>, <sub>, etc. disappeared.

  This function recursively extracts ALL textual content
  from nested XML objects.
*/
function deepText(value) {
  if (
    value == null
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .map(deepText)
      .filter(Boolean)
      .join(" ");
  }

  if (
    typeof value === "object"
  ) {
    const parts = [];

    for (
      const [key, child] of
      Object.entries(value)
    ) {
      /*
        Ignore XML attributes such as @_Label,
        @_NlmCategory, @_IdType, etc.
      */
      if (
        key.startsWith("@_")
      ) {
        continue;
      }

      const part =
        deepText(child);

      if (part) {
        parts.push(part);
      }
    }

    return parts.join(" ");
  }

  return "";
}

/*
  Clean up spacing after recursive XML extraction.

  This repairs things like:

    "( ALK )"    -> "(ALK)"
    "ALK - positive" -> "ALK-positive"
    "adjuvant TKIs" remains properly spaced
    "18 F-FDG" remains readable
*/
function cleanPubMedText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")

    /*
      Remove spaces immediately inside parentheses.
    */
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")

    /*
      Avoid awkward spacing before punctuation.
    */
    .replace(/\s+([,.;:!?])/g, "$1")

    /*
      Fix spaces around hyphens introduced by nested tags.
    */
    .replace(/\s*-\s*/g, "-")

    /*
      Keep slash expressions together.
    */
    .replace(/\s*\/\s*/g, "/")

    .trim();
}

/* =========================================================
   TREATMENT HELPERS
   ========================================================= */

export function treatmentValues(v) {
  return arr(v)
    .flatMap((x) =>
      String(x || "")
        .split(/[,;|]/)
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
   PUBMED ARTICLE PARSER
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

  /* ---------------------------------------------------------
     ABSTRACT
     --------------------------------------------------------- */

  const abstractParts =
    arr(
      art.Abstract
        ?.AbstractText
    )
      .map((part) => {
        /*
          Preserve nested scientific text such as
          ALK, EGFR, superscripts, italicized names, etc.
        */
        const content =
          cleanPubMedText(
            deepText(part)
          );

        /*
          Some PubMed abstracts have labels such as
          BACKGROUND, METHODS, RESULTS.
        */
        const label =
          typeof part === "object"
            ? String(
                part?.["@_Label"] ||
                ""
              ).trim()
            : "";

        if (
          label &&
          content
        ) {
          return `${label}: ${content}`;
        }

        return content;
      })
      .filter(Boolean);

  const abstract =
    abstractParts.join("\n");

  /* ---------------------------------------------------------
     AUTHORS
     --------------------------------------------------------- */

  const authors =
    arr(
      art.AuthorList
        ?.Author
    )
      .map((x) => {
        const first =
          cleanPubMedText(
            deepText(
              x?.ForeName
            )
          );

        const last =
          cleanPubMedText(
            deepText(
              x?.LastName
            )
          );

        const collective =
          cleanPubMedText(
            deepText(
              x?.CollectiveName
            )
          );

        if (collective) {
          return collective;
        }

        return [
          first,
          last
        ]
          .filter(Boolean)
          .join(" ");
      })
      .filter(Boolean);

  /* ---------------------------------------------------------
     PUBLICATION TYPES
     --------------------------------------------------------- */

  const publicationTypes =
    arr(
      art
        .PublicationTypeList
        ?.PublicationType
    )
      .map((x) =>
        cleanPubMedText(
          deepText(x)
        )
      )
      .filter(Boolean);

  /* ---------------------------------------------------------
     DOI / PMC
     --------------------------------------------------------- */

  const articleIds =
    arr(
      a?.PubmedData
        ?.ArticleIdList
        ?.ArticleId
    );

  const doiNode =
    articleIds.find(
      (x) =>
        x?.["@_IdType"] ===
        "doi"
    );

  const pmcNode =
    articleIds.find(
      (x) =>
        x?.["@_IdType"] ===
        "pmc"
    );

  const doi =
    cleanPubMedText(
      deepText(doiNode)
    );

  const pmc =
    cleanPubMedText(
      deepText(pmcNode)
    );

  /* ---------------------------------------------------------
     PUBLICATION DATE
     --------------------------------------------------------- */

  const date =
    journal
      .JournalIssue
      ?.PubDate || {};

  const dateString =
    [
      cleanPubMedText(
        deepText(date.Year)
      ),

      cleanPubMedText(
        deepText(date.Month)
      ),

      cleanPubMedText(
        deepText(date.Day)
      )
    ]
      .filter(Boolean)
      .join(" ");

  /* ---------------------------------------------------------
     TITLE / JOURNAL
     --------------------------------------------------------- */

  const articleTitle =
    cleanPubMedText(
      deepText(
        art.ArticleTitle
      )
    );

  const journalTitle =
    cleanPubMedText(
      deepText(
        journal.Title
      )
    ) ||
    cleanPubMedText(
      deepText(
        journal.ISOAbbreviation
      )
    );

  return {
    pubmedId:
      pmid,

    pubmed_title:
      articleTitle,

    pubmed_abstract:
      abstract,

    pubmed_journal:
      journalTitle,

    pubmed_date:
      dateString,

    pubmed_authors:
      authors.join(", "),

    publication_types:
      publicationTypes,

    doi,

    pmc_id:
      pmc,

    pubmed_url:
      pmid
        ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
        : "",

    pmc_url:
      pmc
        ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmc}/`
        : "",
  };
}

/* =========================================================
   PUBMED FETCH
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

  if (
    !uniqueIds.length
  ) {
    return {};
  }

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

    /*
      We keep attributes because PubMed uses them for
      fields such as publication types and IDs.
    */
    const parsed =
      new XMLParser({
        ignoreAttributes:
          false,

        trimValues:
          true,

        /*
          Keep text nodes available even when nested
          XML formatting exists.
        */
        alwaysCreateTextNode:
          false,
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
    Request a large candidate pool.

    Your /api/search relevance filtering can then
    select the best 20 papers.
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

  let papers =
    arr(
      payload?.data
    ).map(
      paperNorm
    );

  if (
    !papers.length
  ) {
    throw new Error(
      "No research papers were found for that search."
    );
  }

  /* =========================================================
     REMOVE DUPLICATES
     ========================================================= */

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
            p.pubmed_title ||
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

  /* =========================================================
     PUBMED ENRICHMENT
     ========================================================= */

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

  const metadata =
    await pubmedByIds(ids);

  papers =
    papers.map(
      (p) => {
        const originalTreatments =
          p.treatmentTypes;

        const enriched =
          metadata[
            p.pubmedId
          ] || {};

        return paperNorm({
          ...p,
          ...enriched,

          /*
            Keep treatment labels produced by
            Cure Cancer With AI.
          */
          treatmentTypes:
            originalTreatments,
        });
      }
    );

  /*
    Do NOT slice to 20 here.

    The search route needs the larger candidate
    pool so it can select the strongest 20.
  */

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
   PROFILE / ANALYTICS
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

    if (
      !ids.length
    ) {
      return [];
    }

    const metadata =
      await pubmedByIds(
        ids
      );

    return ids
      .map(
        (id) =>
          paperNorm(
            metadata[id] ||
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
