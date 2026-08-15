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
   XML / PUBMED TEXT HELPERS
   ========================================================= */

/*
  Decode XML / HTML-style entities that may remain inside
  PubMed stop-node text.
*/
function decodeXmlEntities(value) {
  return String(value || "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCodePoint(
          parseInt(hex, 16)
        );
      } catch {
        return "";
      }
    })

    .replace(/&#([0-9]+);/g, (_, dec) => {
      try {
        return String.fromCodePoint(
          parseInt(dec, 10)
        );
      } catch {
        return "";
      }
    })

    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

/*
  Converts preserved PubMed inline XML such as:

    anaplastic lymphoma kinase (<i>ALK</i>)
    <i>EGFR</i>-mutated
    <sup>18</sup>F-FDG

  into:

    anaplastic lymphoma kinase (ALK)
    EGFR-mutated
    18F-FDG

  The formatting is removed but the scientific text remains.
*/
function inlineXmlText(value) {
  if (value == null) {
    return "";
  }

  let raw = "";

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    raw = String(value);
  } else if (
    typeof value === "object"
  ) {
    /*
      stopNodes with attributes normally place the preserved
      inner XML in #text.
    */
    raw = String(
      value?.["#text"] || ""
    );

    /*
      Safety fallback for ordinary text-only objects.
    */
    if (!raw) {
      raw = Object.entries(value)
        .filter(
          ([key]) =>
            !key.startsWith("@_")
        )
        .map(
          ([, child]) =>
            typeof child === "string" ||
            typeof child === "number"
              ? String(child)
              : ""
        )
        .filter(Boolean)
        .join(" ");
    }
  }

  raw = decodeXmlEntities(raw);

  /*
    Replace a few semantic formatting tags with their contents.
    The generic tag removal below handles the rest.
  */
  raw = raw
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p\s*>/gi, " ")
    .replace(/<p\b[^>]*>/gi, " ")

    /*
      Remove all remaining XML/HTML markup,
      while leaving the text INSIDE the tags.
    */
    .replace(/<[^>]+>/g, "");

  return cleanPubMedText(raw);
}

/*
  Used for simple XML fields that are not stopNodes.
*/
function deepText(value) {
  if (value == null) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map(deepText)
      .filter(Boolean)
      .join(" ");
  }

  if (typeof value === "object") {
    const parts = [];

    for (
      const [key, child] of
      Object.entries(value)
    ) {
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

function cleanPubMedText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")

    /*
      Collapse accidental whitespace.
    */
    .replace(/\s+/g, " ")

    /*
      Parentheses.
    */
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")

    /*
      Punctuation.
    */
    .replace(/\s+([,.;:!?])/g, "$1")

    /*
      Hyphens and slashes.
    */
    .replace(/\s*-\s*/g, "-")
    .replace(/\s*\/\s*/g, "/")

    /*
      Fix spaces around percent sign.
    */
    .replace(/\s+%/g, "%")

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

  /* =======================================================
     ABSTRACT
     ======================================================= */

  const abstractParts =
    arr(
      art.Abstract
        ?.AbstractText
    )
      .map((part) => {
        /*
          AbstractText is configured as a stopNode,
          so inline tags remain in the original order.
        */
        const content =
          inlineXmlText(part);

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
          /*
            Avoid duplicate labels in case PubMed already
            included the label in the content.
          */
          if (
            content
              .toLowerCase()
              .startsWith(
                label.toLowerCase() + ":"
              )
          ) {
            return content;
          }

          return `${label}: ${content}`;
        }

        return content;
      })
      .filter(Boolean);

  const abstract =
    abstractParts.join("\n");

  /* =======================================================
     AUTHORS
     ======================================================= */

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

  /* =======================================================
     PUBLICATION TYPES
     ======================================================= */

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

  /* =======================================================
     ARTICLE IDS
     ======================================================= */

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

  /* =======================================================
     DATE
     ======================================================= */

  const date =
    journal
      .JournalIssue
      ?.PubDate || {};

  const dateString =
    [
      cleanPubMedText(
        deepText(
          date.Year
        )
      ),

      cleanPubMedText(
        deepText(
          date.Month
        )
      ),

      cleanPubMedText(
        deepText(
          date.Day
        )
      )
    ]
      .filter(Boolean)
      .join(" ");

  /* =======================================================
     TITLE
     ======================================================= */

  /*
    ArticleTitle is also a stopNode because PubMed titles
    sometimes contain italic/sup/sub formatting.
  */
  const articleTitle =
    inlineXmlText(
      art.ArticleTitle
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
      KEY FIX:

      AbstractText and ArticleTitle are treated as stopNodes.

      This means nested formatting such as:
        <i>ALK</i>
        <i>EGFR</i>
        <sup>18</sup>F

      stays together in the correct original text order.
    */
    const parsed =
      new XMLParser({
        ignoreAttributes:
          false,

        trimValues:
          true,

        parseTagValue:
          false,

        parseAttributeValue:
          false,

        stopNodes: [
          "*.AbstractText",
          "*.ArticleTitle"
        ]
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

  const url =
    new URL(RESEARCH);

  url.searchParams.set(
    "cancerType",
    cancer
  );

  /*
    Keep the working large candidate pool.
  */
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

  /* =======================================================
     REMOVE DUPLICATES
     ======================================================= */

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

  const metadata =
    await pubmedByIds(
      ids
    );

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
            Keep Cure Cancer With AI treatment labels.
          */
          treatmentTypes:
            originalTreatments,
        });
      }
    );

  /*
    IMPORTANT:
    Do NOT slice to 20 here.

    Your search route needs the larger pool so it can
    select the strongest 20 relevant papers.
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
