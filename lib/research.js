import { XMLParser } from "fast-xml-parser";

const RESEARCH =
  "https://www.curecancerwithai.com/api/v1/research";

const ESEARCH =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";

const EFETCH =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

const UA =
  "CancerInsight/6.0 educational-research-project";

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
   XML ENTITY DECODING
   ========================================================= */

function decodeXmlEntities(value) {
  return String(value || "")

    .replace(
      /&#x([0-9a-fA-F]+);/g,
      (_, hex) => {
        try {
          return String.fromCodePoint(
            parseInt(hex, 16)
          );
        } catch {
          return "";
        }
      }
    )

    .replace(
      /&#([0-9]+);/g,
      (_, dec) => {
        try {
          return String.fromCodePoint(
            parseInt(dec, 10)
          );
        } catch {
          return "";
        }
      }
    )

    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

/* =========================================================
   PUBMED TEXT CLEANING
   ========================================================= */

function cleanPubMedText(value) {
  return String(value || "")

    .replace(/\u00a0/g, " ")

    /*
      Collapse repeated whitespace.
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
      Hyphens/slashes.
    */
    .replace(/\s*-\s*/g, "-")
    .replace(/\s*\/\s*/g, "/")

    /*
      Percent.
    */
    .replace(/\s+%/g, "%")

    /*
      Repair obvious word + scientific acronym joins
      created by inline XML boundaries.

      Examples:
        withEGFR -> with EGFR
        adjuvantTKIs -> adjuvant TKIs
    */
    .replace(
      /([a-z])([A-Z]{2,}[A-Za-z0-9+]*)/g,
      "$1 $2"
    )

    .trim();
}

/* =========================================================
   RAW INLINE PUBMED XML -> PLAIN TEXT

   IMPORTANT:
   We remove the TAGS, not their contents.

   Example:
     anaplastic lymphoma kinase (<i>ALK</i>)
   becomes:
     anaplastic lymphoma kinase (ALK)

     <i>EGFR</i>-mutated
   becomes:
     EGFR-mutated
   ========================================================= */

function inlineXmlToText(value) {
  let s =
    String(value || "");

  /*
    Preserve sensible spacing for explicit break elements.
  */
  s = s
    .replace(
      /<br\s*\/?>/gi,
      " "
    )

    .replace(
      /<\/p\s*>/gi,
      " "
    )

    .replace(
      /<p\b[^>]*>/gi,
      ""
    );

  /*
    Remove all XML/HTML tags while preserving
    the text contained between them.
  */
  s =
    s.replace(
      /<[^>]+>/g,
      ""
    );

  s =
    decodeXmlEntities(s);

  return cleanPubMedText(s);
}

/* =========================================================
   RAW PUBMED ARTICLE EXTRACTION

   This is the key fix.

   We use the ORIGINAL XML string for ArticleTitle and
   AbstractText so nested formatting cannot rearrange,
   duplicate, or delete scientific text.
   ========================================================= */

function extractRawPubMedText(xml) {
  const result = {};

  /*
    Separate the XML into individual PubmedArticle blocks.
  */
  const articleRegex =
    /<PubmedArticle\b[\s\S]*?<\/PubmedArticle>/gi;

  const articleBlocks =
    xml.match(articleRegex) || [];

  for (
    const block of
    articleBlocks
  ) {
    /* -----------------------------------------------------
       PMID
       ----------------------------------------------------- */

    const pmidMatch =
      block.match(
        /<PMID\b[^>]*>([\s\S]*?)<\/PMID>/i
      );

    const pmid =
      pmidMatch
        ? inlineXmlToText(
            pmidMatch[1]
          )
        : "";

    if (!pmid) {
      continue;
    }

    /* -----------------------------------------------------
       ARTICLE TITLE
       ----------------------------------------------------- */

    const titleMatch =
      block.match(
        /<ArticleTitle\b[^>]*>([\s\S]*?)<\/ArticleTitle>/i
      );

    const articleTitle =
      titleMatch
        ? inlineXmlToText(
            titleMatch[1]
          )
        : "";

    /* -----------------------------------------------------
       ABSTRACT
       ----------------------------------------------------- */

    const abstractParts = [];

    const abstractRegex =
      /<AbstractText\b([^>]*)>([\s\S]*?)<\/AbstractText>/gi;

    let match;

    while (
      (
        match =
          abstractRegex.exec(block)
      ) !== null
    ) {
      const attributes =
        match[1] || "";

      const rawContent =
        match[2] || "";

      const labelMatch =
        attributes.match(
          /\bLabel\s*=\s*["']([^"']+)["']/i
        );

      const label =
        labelMatch
          ? decodeXmlEntities(
              labelMatch[1]
            ).trim()
          : "";

      const content =
        inlineXmlToText(
          rawContent
        );

      if (!content) {
        continue;
      }

      if (label) {
        /*
          Avoid accidental duplicate labels.
        */
        if (
          content
            .toLowerCase()
            .startsWith(
              label.toLowerCase() +
                ":"
            )
        ) {
          abstractParts.push(
            content
          );
        } else {
          abstractParts.push(
            `${label}: ${content}`
          );
        }
      } else {
        abstractParts.push(
          content
        );
      }
    }

    result[pmid] = {
      pubmed_title:
        articleTitle,

      pubmed_abstract:
        abstractParts.join(
          "\n"
        ),
    };
  }

  return result;
}

/* =========================================================
   NORMAL XML TEXT HELPER

   Fine for authors/journals/dates/etc because those fields
   do not have the mixed inline formatting problem that
   AbstractText has.
   ========================================================= */

function deepText(value) {
  if (value == null) {
    return "";
  }

  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
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
    typeof value ===
    "object"
  ) {
    const parts = [];

    for (
      const [
        key,
        child
      ] of Object.entries(
        value
      )
    ) {
      if (
        key.startsWith(
          "@_"
        )
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

/* =========================================================
   TREATMENT HELPERS
   ========================================================= */

export function treatmentValues(v) {
  return arr(v)
    .flatMap(
      (x) =>
        String(x || "")
          .split(/[,;|]/)
    )
    .map(norm)
    .filter(Boolean);
}

function cleanTreatmentLabels(p) {
  const treatments =
    treatmentValues(
      p.treatmentTypes
    );

  const evidenceText =
    [
      p.pubmed_title,
      p.title,
      p.pubmed_abstract,
      p.abstract
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  return treatments.filter(
    (treatment) => {
      if (
        treatment !==
        "stem cell transplant"
      ) {
        return true;
      }

      /*
        Keep Stem Cell Transplant ONLY when
        the research actually discusses a
        transplantation treatment.

        This prevents phrases such as
        "cancer stem cell properties"
        from being misclassified as
        Stem Cell Transplant.
      */
      const realTransplantEvidence =
        /\bstem[\s-]*cell transplantation\b/i.test(
          evidenceText
        ) ||
        /\bstem[\s-]*cell transplant\b/i.test(
          evidenceText
        ) ||
        /\bhematopoietic stem[\s-]*cell transplantation\b/i.test(
          evidenceText
        ) ||
        /\bhematopoietic stem[\s-]*cell transplant\b/i.test(
          evidenceText
        ) ||
        /\bhsct\b/i.test(
          evidenceText
        ) ||
        /\bbone marrow transplant(?:ation)?\b/i.test(
          evidenceText
        ) ||
        /\ballogeneic transplant(?:ation)?\b/i.test(
          evidenceText
        ) ||
        /\bautologous transplant(?:ation)?\b/i.test(
          evidenceText
        );

      return realTransplantEvidence;
    }
  );
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

function parseArticle(
  article,
  rawText = {}
) {
  const mc =
    article?.MedlineCitation ||
    {};

  const art =
    mc.Article || {};

  const journal =
    art.Journal || {};

  const pmid =
    text(mc.PMID) ||
    String(
      mc.PMID || ""
    );

  /* -------------------------------------------------------
     AUTHORS
     ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     PUBLICATION TYPES
     ------------------------------------------------------- */

  const publicationTypes =
    arr(
      art
        .PublicationTypeList
        ?.PublicationType
    )
      .map(
        (x) =>
          cleanPubMedText(
            deepText(x)
          )
      )
      .filter(Boolean);

  /* -------------------------------------------------------
     ARTICLE IDS
     ------------------------------------------------------- */

  const articleIds =
    arr(
      article?.PubmedData
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

  /* -------------------------------------------------------
     DATE
     ------------------------------------------------------- */

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
      ),
    ]
      .filter(Boolean)
      .join(" ");

  /* -------------------------------------------------------
     JOURNAL
     ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     TITLE + ABSTRACT

     Prefer raw XML extraction.
     Fall back only if necessary.
     ------------------------------------------------------- */

  const parsedTitle =
    rawText?.pubmed_title ||
    cleanPubMedText(
      deepText(
        art.ArticleTitle
      )
    );

  const parsedAbstract =
    rawText
      ?.pubmed_abstract ||
    arr(
      art.Abstract
        ?.AbstractText
    )
      .map(
        (part) =>
          cleanPubMedText(
            deepText(part)
          )
      )
      .filter(Boolean)
      .join("\n");

  return {
    pubmedId:
      pmid,

    pubmed_title:
      parsedTitle,

    pubmed_abstract:
      parsedAbstract,

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
        .map(
          (id) =>
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
      First extract titles and abstracts DIRECTLY
      from the original XML.
    */
    const rawTextByPmid =
      extractRawPubMedText(
        xml
      );

    /*
      Then parse the rest of PubMed normally.
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
      }).parse(xml);

    const articles =
      arr(
        parsed
          ?.PubmedArticleSet
          ?.PubmedArticle
      );

    return Object.fromEntries(
      articles
        .map((article) => {
          const pmid =
            text(
              article
                ?.MedlineCitation
                ?.PMID
            );

          return parseArticle(
            article,
            rawTextByPmid[
              pmid
            ] || {}
          );
        })

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
    Keep the candidate pool that fixed
    the 7/8/9-paper problem.
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
      await r
        .text()
        .catch(
          () => ""
        );

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
            Preserve treatment labels from
            Cure Cancer With AI.
          */
          treatmentTypes:
            originalTreatments,
        });
      }
    );

  /*
    DO NOT slice to 20 here.

    Your search endpoint needs the larger candidate pool
    so it can choose the strongest 20 relevant records.
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
      profile(
        papers
      ),
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
            journals[
              journal
            ] ||
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
