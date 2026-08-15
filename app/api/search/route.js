import { NextResponse } from "next/server";
import { searchCancer } from "../../../lib/research";

const CANCER_ALIASES = {
  lung: [
    "lung cancer",
    "lung carcinoma",
    "lung adenocarcinoma",
    "pulmonary carcinoma",
    "non-small cell lung cancer",
    "non small cell lung cancer",
    "nsclc",
    "small cell lung cancer",
    "sclc",
  ],

  breast: [
    "breast cancer",
    "breast carcinoma",
    "mammary carcinoma",
    "ductal carcinoma",
    "lobular carcinoma",
    "dcis",
  ],

  brain: [
    "brain cancer",
    "brain tumor",
    "brain tumour",
    "brain neoplasm",
    "glioma",
    "glioblastoma",
    "astrocytoma",
    "medulloblastoma",
  ],

  colon: [
    "colon cancer",
    "colon carcinoma",
    "colorectal cancer",
    "colorectal carcinoma",
  ],

  colorectal: [
    "colorectal cancer",
    "colorectal carcinoma",
    "colon cancer",
    "rectal cancer",
    "rectal carcinoma",
  ],

  prostate: [
    "prostate cancer",
    "prostate carcinoma",
    "prostatic carcinoma",
    "prostate adenocarcinoma",
  ],

  pancreas: [
    "pancreatic cancer",
    "pancreatic carcinoma",
    "pancreatic adenocarcinoma",
    "pancreas cancer",
  ],

  pancreatic: [
    "pancreatic cancer",
    "pancreatic carcinoma",
    "pancreatic adenocarcinoma",
    "pancreas cancer",
  ],

  liver: [
    "liver cancer",
    "liver carcinoma",
    "hepatic cancer",
    "hepatocellular carcinoma",
    "hcc",
  ],

  kidney: [
    "kidney cancer",
    "renal cancer",
    "renal cell carcinoma",
    "rcc",
  ],

  skin: [
    "skin cancer",
    "melanoma",
    "basal cell carcinoma",
    "cutaneous squamous cell carcinoma",
  ],

  melanoma: [
    "melanoma",
    "malignant melanoma",
    "skin cancer",
  ],

  ovarian: [
    "ovarian cancer",
    "ovarian carcinoma",
    "ovary cancer",
  ],

  ovary: [
    "ovarian cancer",
    "ovarian carcinoma",
    "ovary cancer",
  ],

  cervical: [
    "cervical cancer",
    "cervical carcinoma",
    "cervix cancer",
  ],

  cervix: [
    "cervical cancer",
    "cervical carcinoma",
    "cervix cancer",
  ],

  thyroid: [
    "thyroid cancer",
    "thyroid carcinoma",
    "papillary thyroid carcinoma",
    "follicular thyroid carcinoma",
  ],

  bladder: [
    "bladder cancer",
    "bladder carcinoma",
    "urothelial carcinoma",
  ],

  stomach: [
    "stomach cancer",
    "gastric cancer",
    "gastric carcinoma",
  ],

  gastric: [
    "gastric cancer",
    "gastric carcinoma",
    "stomach cancer",
  ],

  esophageal: [
    "esophageal cancer",
    "oesophageal cancer",
    "esophageal carcinoma",
    "oesophageal carcinoma",
  ],

  leukemia: [
    "leukemia",
    "leukaemia",
    "acute myeloid leukemia",
    "acute lymphoblastic leukemia",
    "chronic myeloid leukemia",
  ],

  lymphoma: [
    "lymphoma",
    "hodgkin lymphoma",
    "non-hodgkin lymphoma",
    "non hodgkin lymphoma",
  ],
};

function clean(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getField(paper, ...names) {
  for (const name of names) {
    if (
      paper?.[name] !== undefined &&
      paper?.[name] !== null &&
      paper?.[name] !== ""
    ) {
      return paper[name];
    }
  }

  return "";
}

function getCancerBase(cancer) {
  return String(cancer || "")
    .trim()
    .toLowerCase()
    .replace(/\bcancer\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function aliasesForCancer(cancer) {
  const target = String(cancer || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  const base = getCancerBase(target);

  const aliases = [
    target.includes("cancer")
      ? target
      : `${target} cancer`,

    `${base} carcinoma`,

    ...(CANCER_ALIASES[base] || []),
  ];

  return [
    ...new Set(
      aliases
        .map(x => x.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

function paperRelevanceScore(paper, cancer) {
  const aliases = aliasesForCancer(cancer);
  const base = getCancerBase(cancer);

  const title = clean(
    getField(
      paper,
      "pubmed_title",
      "title"
    )
  );

  const abstract = clean(
    getField(
      paper,
      "pubmed_abstract",
      "abstract"
    )
  );

  const mesh = clean(
    Array.isArray(paper?.mesh_terms)
      ? paper.mesh_terms.join(" ")
      : paper?.mesh_terms
  );

  const keywords = clean(
    Array.isArray(paper?.keywords)
      ? paper.keywords.join(" ")
      : paper?.keywords
  );

  const cancerType = clean(
    getField(
      paper,
      "cancerType",
      "cancer_type"
    )
  );

  const combined =
    `${title} ${abstract} ${mesh} ${keywords} ${cancerType}`;

  let score = 0;

  // ---------------------------------------------
  // Strong matches
  // ---------------------------------------------

  const titleHits =
    aliases.filter(alias =>
      title.includes(alias)
    );

  const abstractHits =
    aliases.filter(alias =>
      abstract.includes(alias)
    );

  const meshHits =
    aliases.filter(alias =>
      mesh.includes(alias)
    );

  const cancerFieldHits =
    aliases.filter(alias =>
      cancerType.includes(alias)
    );

  if (titleHits.length) {
    score += 18;
  }

  if (abstractHits.length) {
    score += 8;
  }

  if (meshHits.length) {
    score += 10;
  }

  if (cancerFieldHits.length) {
    score += 14;
  }

  // ---------------------------------------------
  // Target-specific medical phrases
  // ---------------------------------------------

  if (base === "lung") {
    const strongLungCancerTerms = [
      "lung adenocarcinoma",
      "non-small cell lung",
      "non small cell lung",
      "nsclc",
      "small cell lung",
      "sclc",
      "pulmonary carcinoma",
      "bronchogenic carcinoma",
      "lung tumour",
      "lung tumor",
    ];

    if (
      strongLungCancerTerms.some(term =>
        combined.includes(term)
      )
    ) {
      score += 14;
    }

    // Lung alone is NOT enough.
    // These are frequent false matches.
    const lungFalseContexts = [
      "lung transplant",
      "lung transplantation",
      "transplant recipient",
      "pulmonary fibrosis",
      "idiopathic pulmonary fibrosis",
      "acute lung injury",
      "acute respiratory distress syndrome",
      "ards",
      "pneumonia",
      "tuberculosis",
      "tuberculoma",
      "pulmonary infection",
    ];

    if (
      lungFalseContexts.some(term =>
        title.includes(term)
      ) &&
      !titleHits.length
    ) {
      score -= 30;
    }
  }

  // ---------------------------------------------
  // Penalize obvious papers about another cancer
  // ---------------------------------------------

  const otherCancerTerms = [
    "breast cancer",
    "gastric cancer",
    "stomach cancer",
    "colon cancer",
    "colorectal cancer",
    "rectal cancer",
    "anal cancer",
    "ovarian cancer",
    "cervical cancer",
    "prostate cancer",
    "pancreatic cancer",
    "liver cancer",
    "kidney cancer",
    "renal cancer",
    "thyroid cancer",
    "bladder cancer",
    "skin cancer",
    "melanoma",
    "esophageal cancer",
    "oesophageal cancer",
    "leukemia",
    "leukaemia",
    "lymphoma",
    "sarcoma",
  ];

  const selectedAliases =
    new Set(aliases);

  for (const other of otherCancerTerms) {
    if (
      selectedAliases.has(other)
    ) {
      continue;
    }

    if (title.includes(other)) {
      score -= 25;
    }
  }

  // ---------------------------------------------
  // Generic cancer papers should not automatically
  // enter a specific cancer search.
  // ---------------------------------------------

  const genericOnlyTerms = [
    "pan-cancer",
    "pan cancer",
    "solid tumors",
    "solid tumours",
    "cancer therapy",
    "tumor therapy",
    "tumour therapy",
    "anti-tumor",
    "anti tumor",
    "oncology",
  ];

  if (
    genericOnlyTerms.some(term =>
      title.includes(term)
    ) &&
    !titleHits.length
  ) {
    score -= 10;
  }

  // ---------------------------------------------
  // Require explicit disease evidence.
  // ---------------------------------------------

  const hasExplicitDiseaseMatch =
    titleHits.length > 0 ||
    abstractHits.length > 0 ||
    meshHits.length > 0 ||
    cancerFieldHits.length > 0;

  if (!hasExplicitDiseaseMatch) {
    return null;
  }

  // Strong preference for papers clearly centered
  // on the requested cancer.
  if (titleHits.length) {
    score += 5;
  } else if (
    !meshHits.length &&
    !cancerFieldHits.length
  ) {
    // Disease only mentioned in abstract.
    score -= 5;
  }

  if (score < 10) {
    return null;
  }

  return score;
}

function removeDuplicates(papers) {
  const seen = new Set();
  const output = [];

  for (const paper of papers) {
    const id =
      paper?.pubmedId ||
      paper?.pmid ||
      paper?.doi ||
      clean(
        getField(
          paper,
          "pubmed_title",
          "title"
        )
      );

    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    output.push(paper);
  }

  return output;
}

function treatmentCounts(papers) {
  const counts = new Map();

  for (const paper of papers) {
    const treatments =
      Array.isArray(paper?.treatmentTypes)
        ? paper.treatmentTypes
        : paper?.treatmentTypes
          ? [paper.treatmentTypes]
          : [];

    for (const treatment of treatments) {
      const raw =
        String(treatment || "").trim();

      if (!raw) continue;

      const key = raw
        .toLowerCase()
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      counts.set(
        key,
        (counts.get(key) || 0) + 1
      );
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1]);
}

function buildProfile(papers) {
  const years = [];
  const journals = new Set();

  let freeFullText = 0;
  let clinicalTrials = 0;
  let reviews = 0;
  let metaAnalyses = 0;

  const yearCounts = {};
  const journalCounts = {};

  for (const paper of papers) {
    if (paper?.pmc_id) {
      freeFullText++;
    }

    const date = String(
      getField(
        paper,
        "pubmed_date",
        "publicationDate"
      )
    );

    const yearMatch =
      date.match(/\b(19|20)\d{2}\b/);

    if (yearMatch) {
      const year =
        Number(yearMatch[0]);

      years.push(year);

      yearCounts[year] =
        (yearCounts[year] || 0) + 1;
    }

    const journal =
      String(
        getField(
          paper,
          "pubmed_journal",
          "journal"
        ) || ""
      ).trim();

    if (journal) {
      journals.add(journal);

      journalCounts[journal] =
        (journalCounts[journal] || 0) + 1;
    }

    const publicationTypes =
      (
        Array.isArray(
          paper?.publication_types
        )
          ? paper.publication_types.join(" ")
          : paper?.publication_types || ""
      ).toLowerCase();

    if (
      publicationTypes.includes(
        "clinical trial"
      )
    ) {
      clinicalTrials++;
    }

    if (
      publicationTypes.includes(
        "review"
      )
    ) {
      reviews++;
    }

    if (
      publicationTypes.includes(
        "meta-analysis"
      ) ||
      publicationTypes.includes(
        "meta analysis"
      )
    ) {
      metaAnalyses++;
    }
  }

  const topJournals =
    Object.entries(journalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

  return {
    paper_count: papers.length,

    free_full_text_count:
      freeFullText,

    latest_year:
      years.length
        ? Math.max(...years)
        : null,

    journals:
      [...journals],

    journal_count:
      journals.size,

    clinical_trials:
      clinicalTrials,

    reviews,

    meta_analyses:
      metaAnalyses,

    year_counts:
      yearCounts,

    top_journals:
      topJournals,
  };
}

export async function POST(req) {
  try {
    const { cancer } =
      await req.json();

    const normalizedCancer =
      String(cancer || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    if (!normalizedCancer) {
      return NextResponse.json(
        {
          error:
            "Enter a cancer type to search.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------------
    // Existing Cancer Insight search
    // ---------------------------------------------

    const result =
      await searchCancer(
        normalizedCancer
      );

    const rawPapers =
      Array.isArray(result?.papers)
        ? result.papers
        : [];

    // ---------------------------------------------
    // Final relevance filter
    // ---------------------------------------------

    const scored =
      rawPapers
        .map(paper => ({
          paper,
          score:
            paperRelevanceScore(
              paper,
              normalizedCancer
            ),
        }))
        .filter(
          item =>
            item.score !== null
        )
        .sort(
          (a, b) =>
            b.score - a.score
        );

    const relevantPapers =
      removeDuplicates(
        scored.map(
          item => item.paper
        )
      ).slice(0, 20);

    // ---------------------------------------------
    // Recalculate analytics AFTER filtering
    // so the website/PDF counts match the papers.
    // ---------------------------------------------

    const treatments =
      treatmentCounts(
        relevantPapers
      );

    const profile =
      buildProfile(
        relevantPapers
      );

    return NextResponse.json({
      ...result,

      cancer:
        normalizedCancer,

      papers:
        relevantPapers,

      treatments,

      profile,
    });

  } catch (e) {
    console.error(
      "Cancer Insight search error:",
      e
    );

    return NextResponse.json(
      {
        error:
          e?.message ||
          "Search failed.",
      },
      {
        status: 400,
      }
    );
  }
}
