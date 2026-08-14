import { NextResponse } from "next/server";

const ALIASES = {
  brain: [
    "brain cancer",
    "brain tumor",
    "brain tumour",
    "brain neoplasm",
    "glioma",
    "glioblastoma",
    "astrocytoma",
    "oligodendroglioma",
    "ependymoma",
    "medulloblastoma",
    "brainstem glioma",
    "cns tumor",
    "cns tumour",
  ],
  breast: [
    "breast cancer",
    "breast carcinoma",
    "mammary carcinoma",
    "ductal carcinoma",
    "lobular carcinoma",
    "invasive breast",
    "dcis",
    "mammogram",
    "mammography",
  ],
  lung: [
    "lung cancer",
    "lung carcinoma",
    "pulmonary carcinoma",
    "lung adenocarcinoma",
    "non-small cell lung",
    "non small cell lung",
    "nsclc",
    "small cell lung",
    "sclc",
  ],
  colon: [
    "colon cancer",
    "colon carcinoma",
    "colonic carcinoma",
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
  pancreatic: [
    "pancreatic cancer",
    "pancreatic carcinoma",
    "pancreatic adenocarcinoma",
    "pancreas cancer",
  ],
  pancreas: [
    "pancreatic cancer",
    "pancreatic carcinoma",
    "pancreatic adenocarcinoma",
    "pancreas cancer",
  ],
  liver: [
    "liver cancer",
    "hepatic cancer",
    "hepatocellular carcinoma",
    "hcc",
    "liver carcinoma",
  ],
  kidney: [
    "kidney cancer",
    "renal cancer",
    "renal cell carcinoma",
    "rcc",
    "kidney carcinoma",
  ],
  skin: [
    "skin cancer",
    "melanoma",
    "basal cell carcinoma",
    "squamous cell carcinoma of skin",
    "cutaneous carcinoma",
  ],
  melanoma: ["melanoma", "malignant melanoma", "skin cancer"],
  ovarian: ["ovarian cancer", "ovarian carcinoma", "ovary cancer"],
  ovary: ["ovarian cancer", "ovarian carcinoma", "ovary cancer"],
  cervical: ["cervical cancer", "cervical carcinoma", "cervix cancer"],
  cervix: ["cervical cancer", "cervical carcinoma", "cervix cancer"],
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
  thyroid: [
    "thyroid cancer",
    "thyroid carcinoma",
    "papillary thyroid",
    "follicular thyroid",
    "medullary thyroid",
  ],
  bladder: [
    "bladder cancer",
    "bladder carcinoma",
    "urothelial carcinoma",
  ],
  stomach: ["stomach cancer", "gastric cancer", "gastric carcinoma"],
  gastric: ["stomach cancer", "gastric cancer", "gastric carcinoma"],
  esophageal: [
    "esophageal cancer",
    "oesophageal cancer",
    "esophageal carcinoma",
    "oesophageal carcinoma",
  ],
};

const QUERY_ALIASES = {
  brain: ["brain tumor", "glioma", "glioblastoma", "astrocytoma"],
  breast: ["breast cancer", "breast carcinoma", "mammography"],
  lung: ["lung cancer", "lung carcinoma", "NSCLC"],
  colon: ["colon cancer", "colorectal cancer"],
  colorectal: ["colorectal cancer", "colon cancer", "rectal cancer"],
  skin: ["skin cancer", "melanoma"],
  pancreatic: ["pancreatic cancer", "pancreatic adenocarcinoma"],
  pancreas: ["pancreatic cancer", "pancreatic adenocarcinoma"],
};

function cleanHtml(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function imageRelevanceScore(cancerType, title, description = "", credit = "") {
  const target = String(cancerType || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!target) return null;

  const titleL = cleanHtml(title).toLowerCase();
  const descriptionL = cleanHtml(description).toLowerCase();
  const creditL = cleanHtml(credit).toLowerCase();

  const combined = `${titleL} ${descriptionL} ${creditL}`;

  const base = target.replace(/\bcancer\b/g, "").trim();

  let aliases = [
    target.includes("cancer") ? target : `${target} cancer`,
    `${base} carcinoma`,
    ...(ALIASES[base] || []),
  ];

  aliases = [...new Set(aliases.map(x => x.trim().toLowerCase()).filter(Boolean))];

  const diseaseHits = aliases.filter(alias => combined.includes(alias));

  if (!diseaseHits.length) return null;

  const medicalVisualTerms = [
    "histology",
    "histopathology",
    "pathology",
    "micrograph",
    "microscopy",
    "microscopic",
    "biopsy",
    "specimen",
    "tissue",
    "cytology",
    "immunohistochemistry",
    "immunostain",
    "stain",
    "h&e",
    "hematoxylin",
    "eosin",
    "tumor",
    "tumour",
    "neoplasm",
    "lesion",
    "carcinoma",
    "adenocarcinoma",
    "sarcoma",
    "glioma",
    "glioblastoma",
    "astrocytoma",
    "radiology",
    "radiograph",
    "x-ray",
    "xray",
    "computed tomography",
    "ct scan",
    "mri",
    "magnetic resonance",
    "pet scan",
    "pet/ct",
    "mammogram",
    "mammography",
    "ultrasound",
    "gross pathology",
    "gross specimen",
    "anatomical",
    "anatomy",
    "medical diagram",
    "schematic",
    "diagram",
    "illustration",
    "cancer cell",
    "tumor cell",
    "tumour cell",
    "metastasis",
    "metastatic",
    "immunofluorescence",
    "fluorescence",
    "tumor segmentation",
    "tumour segmentation",
  ];

  const visualHits = medicalVisualTerms.filter(term =>
    combined.includes(term)
  );

  if (!visualHits.length) return null;

  // Reject things that are NOT useful medical images.
  const blockedTerms = [
    "bus",
    "autobus",
    "coach",
    "route",
    "street",
    "vehicle",
    "campaign",
    "awareness",
    "ribbon",
    "fundraiser",
    "fundraising",
    "charity",
    "poster",
    "advertisement",
    "advertising",
    "logo",
    "mascot",
    "event",
    "marathon",
    "race for",
    "t-shirt",
    "shirt",
    "badge",
    "stamp",
    "coin",
    "billboard",
    "military",
    "marine corps",
    "soldier",
    "artillery",
    "army",
    "state hospital report",
    "board of directors",
    "yearbook",
    "book scan",
    "internet archive book",
    "newspaper",
    "portrait of",
    "annual report",
    "proceedings",
    "archive.org",
    "scanned page",
    "scanned book",
    "book page",
    "title page",
    "table of contents",
    "reprinted from",
  ];

  if (blockedTerms.some(term => combined.includes(term))) {
    return null;
  }

  // Absolutely reject PDFs / scanned documents.
  if (/\.(pdf|djvu|djv)$/i.test(titleL)) {
    return null;
  }

  const documentMarkers = [
    "identifier:",
    "find matches",
    "authors:",
    "digitized by",
    "full text",
    "volume ",
    "chapter ",
    "page ",
    "pages ",
  ];

  if (
    documentMarkers.filter(marker => combined.includes(marker)).length >= 2
  ) {
    return null;
  }

  // Special lung guard against tuberculosis/tuberculoma results.
  if (
    base === "lung" &&
    (titleL.includes("tuberculoma") || titleL.includes("tuberculosis")) &&
    !aliases.some(alias => titleL.includes(alias))
  ) {
    return null;
  }

  // Reject images clearly belonging to another cancer.
  const otherCancers = [
    "breast",
    "lung",
    "brain",
    "prostate",
    "pancreatic",
    "liver",
    "kidney",
    "colon",
    "colorectal",
    "rectal",
    "ovarian",
    "cervical",
    "thyroid",
    "bladder",
    "gastric",
    "stomach",
    "esophageal",
    "melanoma",
    "leukemia",
    "lymphoma",
  ];

  for (const other of otherCancers) {
    if (other === base) continue;

    if (
      titleL.includes(`${other} cancer`) ||
      titleL.includes(`${other} carcinoma`)
    ) {
      if (!aliases.some(alias => titleL.includes(alias))) {
        return null;
      }
    }
  }

  let score = 0;

  const titleAliasHits = aliases.filter(alias => titleL.includes(alias));
  const descAliasHits = aliases.filter(alias =>
    descriptionL.includes(alias)
  );

  if (titleAliasHits.length) score += 14;
  if (descAliasHits.length) score += 7;

  score += Math.min(visualHits.length, 5) * 3;

  const highValue = [
    "histology",
    "histopathology",
    "pathology",
    "micrograph",
    "microscopy",
    "biopsy",
    "mri",
    "ct scan",
    "computed tomography",
    "mammogram",
    "mammography",
    "gross specimen",
    "immunohistochemistry",
    "medical diagram",
    "schematic",
    "glioma",
    "glioblastoma",
  ];

  for (const term of highValue) {
    if (combined.includes(term)) score += 3;
  }

  // If disease is not clearly in the title,
  // require very strong medical-image evidence.
  if (!titleAliasHits.length) {
    const strongVisualTerms = [
      "histology",
      "histopathology",
      "micrograph",
      "microscopy",
      "mri",
      "ct scan",
      "computed tomography",
      "gross pathology",
      "gross specimen",
      "biopsy",
      "immunohistochemistry",
      "tumor segmentation",
      "tumour segmentation",
    ];

    const strongVisual = strongVisualTerms.some(term =>
      combined.includes(term)
    );

    if (!(descAliasHits.length && strongVisual)) {
      return null;
    }

    score -= 3;
  }

  // Prefer actual diagnostic images/pathology.
  if (
    [
      "mri",
      "ct scan",
      "computed tomography",
      "pet scan",
      "mammogram",
      "mammography",
    ].some(term => combined.includes(term))
  ) {
    score += 8;
  }

  if (
    [
      "histology",
      "histopathology",
      "pathology",
      "micrograph",
      "microscopy",
      "gross pathology",
      "gross specimen",
    ].some(term => combined.includes(term))
  ) {
    score += 7;
  }

  if (score < 15) return null;

  return score;
}

async function searchCommons(query) {
  const u = new URL("https://commons.wikimedia.org/w/api.php");

  const params = {
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "20",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "900",
    format: "json",
    origin: "*",
  };

  for (const [key, value] of Object.entries(params)) {
    u.searchParams.set(key, value);
  }

  const response = await fetch(u, {
    headers: {
      "User-Agent": "CancerInsight/5.0 educational-research-project",
    },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const json = await response.json();

  return Object.values(json?.query?.pages || {});
}

export async function POST(req) {
  try {
    const { cancer } = await req.json();

    const target = String(cancer || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

    if (!target) {
      return NextResponse.json({ images: [] });
    }

    const base = target.replace(/\bcancer\b/g, "").trim();

    const diseaseQueries =
      QUERY_ALIASES[base] ||
      [target.includes("cancer") ? target : `${target} cancer`];

    const contexts = [
      "histology",
      "pathology",
      "MRI",
      "CT",
      "microscopy",
      "tumor diagram",
    ];

    const queries = [];

    for (const disease of diseaseQueries.slice(0, 4)) {
      for (const context of contexts) {
        queries.push(`"${disease}" ${context}`);
      }
    }

    for (const disease of diseaseQueries.slice(0, 4)) {
      queries.push(`"${disease}"`);
    }

    const candidates = new Map();

    for (const query of queries) {
      let pages = [];

      try {
        pages = await searchCommons(query);
      } catch {
        continue;
      }

      for (const page of pages) {
        const info = page?.imageinfo?.[0] || {};
        const meta = info?.extmetadata || {};

        const thumbnail = info.thumburl;
        const originalFile = info.url;

        if (!thumbnail) continue;

        const title = String(page?.title || "Image").replace(/^File:/, "");

        const description =
          meta?.ImageDescription?.value || "";

        const artist =
          meta?.Artist?.value || "";

        const credit =
          meta?.Credit?.value || "";

        const license =
          meta?.LicenseShortName?.value || "";

        const score = imageRelevanceScore(
          target,
          title,
          description,
          credit
        );

        if (score === null) continue;

        const key = originalFile || thumbnail;

        const item = {
          title,
          thumbnail,
          original: info.descriptionurl || originalFile || thumbnail,
          description,
          license,
          artist,
          credit,
          _score: score + (license ? 1 : 0),
        };

        const existing = candidates.get(key);

        if (!existing || item._score > existing._score) {
          candidates.set(key, item);
        }
      }
    }

    const images = [...candidates.values()]
      .sort((a, b) => {
        if (b._score !== a._score) {
          return b._score - a._score;
        }

        return a.title.localeCompare(b.title);
      })
      .slice(0, 12)
      .map(({ _score, ...image }) => image);

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Cancer Images API error:", error);

    return NextResponse.json(
      { images: [] },
      { status: 200 }
    );
  }
}
