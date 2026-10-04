const CANCER_ALIASES = {
  lung: [
    'lung cancer',
    'lung carcinoma',
    'lung adenocarcinoma',
    'pulmonary carcinoma',
    'non-small cell lung cancer',
    'non small cell lung cancer',
    'nsclc',
    'small cell lung cancer',
    'small-cell lung cancer',
    'sclc',
    'bronchogenic carcinoma',
  ],
  breast: [
    'breast cancer',
    'breast carcinoma',
    'mammary carcinoma',
    'ductal carcinoma',
    'lobular carcinoma',
    'dcis',
  ],
  brain: [
    'brain cancer',
    'brain tumor',
    'brain tumour',
    'brain neoplasm',
    'glioma',
    'glioblastoma',
    'astrocytoma',
    'medulloblastoma',
  ],
  colon: [
    'colon cancer',
    'colon carcinoma',
    'colorectal cancer',
    'colorectal carcinoma',
  ],
  colorectal: [
    'colorectal cancer',
    'colorectal carcinoma',
    'colon cancer',
    'rectal cancer',
    'rectal carcinoma',
  ],
  prostate: [
    'prostate cancer',
    'prostate carcinoma',
    'prostatic carcinoma',
    'prostate adenocarcinoma',
  ],
  pancreas: [
    'pancreatic cancer',
    'pancreatic carcinoma',
    'pancreatic adenocarcinoma',
    'pancreas cancer',
  ],
  pancreatic: [
    'pancreatic cancer',
    'pancreatic carcinoma',
    'pancreatic adenocarcinoma',
    'pancreas cancer',
  ],
  liver: [
    'liver cancer',
    'liver carcinoma',
    'hepatic cancer',
    'hepatocellular carcinoma',
    'hcc',
  ],
  kidney: [
    'kidney cancer',
    'renal cancer',
    'renal cell carcinoma',
    'rcc',
  ],
  skin: [
    'skin cancer',
    'melanoma',
    'basal cell carcinoma',
    'cutaneous squamous cell carcinoma',
  ],
  melanoma: [
    'melanoma',
    'malignant melanoma',
    'skin cancer',
  ],
  ovarian: [
    'ovarian cancer',
    'ovarian carcinoma',
    'ovary cancer',
  ],
  ovary: [
    'ovarian cancer',
    'ovarian carcinoma',
    'ovary cancer',
  ],
  cervical: [
    'cervical cancer',
    'cervical carcinoma',
    'cervix cancer',
  ],
  cervix: [
    'cervical cancer',
    'cervical carcinoma',
    'cervix cancer',
  ],
  thyroid: [
    'thyroid cancer',
    'thyroid carcinoma',
    'papillary thyroid carcinoma',
    'follicular thyroid carcinoma',
  ],
  bladder: [
    'bladder cancer',
    'bladder carcinoma',
    'urothelial carcinoma',
  ],
  stomach: [
    'stomach cancer',
    'gastric cancer',
    'gastric carcinoma',
  ],
  gastric: [
    'gastric cancer',
    'gastric carcinoma',
    'stomach cancer',
  ],
  esophageal: [
    'esophageal cancer',
    'oesophageal cancer',
    'esophageal carcinoma',
    'oesophageal carcinoma',
  ],
  leukemia: [
    'leukemia',
    'leukaemia',
    'acute myeloid leukemia',
    'acute lymphoblastic leukemia',
    'chronic myeloid leukemia',
  ],
  lymphoma: [
    'lymphoma',
    'hodgkin lymphoma',
    'non-hodgkin lymphoma',
    'non hodgkin lymphoma',
  ],
};

export function cleanResearchText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function getField(paper, ...names) {
  for (const name of names) {
    const value = paper?.[name];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return '';
}

export function normalizeCancer(cancer) {
  return String(cancer || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getCancerBase(cancer) {
  return normalizeCancer(cancer)
    .replace(/\bcancer\b/g, '')
    .trim();
}

export function aliasesForCancer(cancer) {
  const normalized = normalizeCancer(cancer);
  const base = getCancerBase(normalized);
  const aliases = [
    normalized.includes('cancer') ? normalized : `${normalized} cancer`,
    ...(CANCER_ALIASES[base] || []),
  ];

  return [
    ...new Set(
      aliases
        .map(x => cleanResearchText(x))
        .filter(Boolean)
    ),
  ];
}

function fieldContainsAny(field, aliases) {
  return aliases.some(alias => field.includes(alias));
}

function titleLooksLikeOtherCancer(titleText, selectedAliases) {
  const OTHER_CANCERS = [
    'breast cancer',
    'gastric cancer',
    'stomach cancer',
    'colon cancer',
    'colorectal cancer',
    'rectal cancer',
    'anal cancer',
    'ovarian cancer',
    'cervical cancer',
    'prostate cancer',
    'pancreatic cancer',
    'liver cancer',
    'kidney cancer',
    'renal cancer',
    'thyroid cancer',
    'bladder cancer',
    'skin cancer',
    'melanoma',
    'esophageal cancer',
    'oesophageal cancer',
    'leukemia',
    'leukaemia',
    'lymphoma',
    'sarcoma',
  ];

  return OTHER_CANCERS.some(other => {
    if (selectedAliases.includes(other)) return false;
    return titleText.includes(other);
  });
}

export function paperRelevanceScore(paper, cancer) {
  const aliases = aliasesForCancer(cancer);
  const base = getCancerBase(cancer);

  const titleText = cleanResearchText(
    getField(paper, 'pubmed_title', 'title')
  );
  const abstractText = cleanResearchText(
    getField(paper, 'pubmed_abstract', 'abstract')
  );
  const meshText = cleanResearchText(
    Array.isArray(paper?.mesh_terms)
      ? paper.mesh_terms.join(' ')
      : paper?.mesh_terms
  );
  const keywordText = cleanResearchText(
    Array.isArray(paper?.keywords)
      ? paper.keywords.join(' ')
      : paper?.keywords
  );
  const cancerField = cleanResearchText(
    getField(paper, 'cancerType', 'cancer_type')
  );

  const titleMatch = fieldContainsAny(titleText, aliases);
  const meshMatch = fieldContainsAny(meshText, aliases);
  const keywordMatch = fieldContainsAny(keywordText, aliases);
  const cancerFieldMatch = fieldContainsAny(cancerField, aliases);
  const abstractMatch = fieldContainsAny(abstractText, aliases);

  const strongMatch =
    titleMatch || meshMatch || keywordMatch || cancerFieldMatch;

  if (!strongMatch) return null;

  if (
    titleLooksLikeOtherCancer(titleText, aliases) &&
    !titleMatch
  ) {
    return null;
  }

  if (base === 'lung') {
    const FALSE_LUNG_TOPICS = [
      'lung transplant',
      'lung transplantation',
      'transplantation',
      'transplant recipient',
      'pulmonary fibrosis',
      'idiopathic pulmonary fibrosis',
      'acute respiratory distress syndrome',
      'ards',
      'acute lung injury',
      'pneumonia',
      'tuberculosis',
      'pulmonary infection',
      'lung infection',
    ];

    const falseLungTopic = FALSE_LUNG_TOPICS.some(term =>
      titleText.includes(term)
    );

    if (falseLungTopic && !titleMatch) return null;
  }

  let score = 0;
  if (titleMatch) score += 100;
  if (cancerFieldMatch) score += 70;
  if (meshMatch) score += 55;
  if (keywordMatch) score += 35;
  if (abstractMatch) score += 10;

  if (base === 'lung') {
    const LUNG_TERMS = [
      'lung adenocarcinoma',
      'non-small cell lung',
      'non small cell lung',
      'nsclc',
      'small cell lung',
      'small-cell lung',
      'sclc',
      'pulmonary carcinoma',
      'bronchogenic carcinoma',
    ];

    if (LUNG_TERMS.some(term => titleText.includes(term))) {
      score += 35;
    }
    if (LUNG_TERMS.some(term => meshText.includes(term))) {
      score += 20;
    }
  }

  return score;
}

export function removeDuplicates(papers) {
  const seen = new Set();
  const output = [];

  for (const paper of papers || []) {
    const id = String(
      paper?.pubmedId ||
      paper?.pmid ||
      paper?.doi ||
      cleanResearchText(getField(paper, 'pubmed_title', 'title'))
    )
      .trim()
      .toLowerCase();

    if (!id || seen.has(id)) continue;
    seen.add(id);
    output.push(paper);
  }

  return output;
}

export function treatmentCounts(papers) {
  const counts = new Map();

  for (const paper of papers || []) {
    const values = Array.isArray(paper?.treatmentTypes)
      ? paper.treatmentTypes
      : paper?.treatmentTypes
        ? [paper.treatmentTypes]
        : [];

    for (const value of values) {
      const normalized = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ');

      if (!normalized) continue;
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    }
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function buildProfile(papers) {
  const years = [];
  const journals = new Set();
  const yearCounts = {};
  const journalCounts = {};

  let freeFullText = 0;
  let clinicalTrials = 0;
  let reviews = 0;
  let metaAnalyses = 0;

  for (const paper of papers || []) {
    if (paper?.pmc_id) freeFullText++;

    const date = String(
      getField(paper, 'pubmed_date', 'publicationDate')
    );
    const yearMatch = date.match(/\b(19|20)\d{2}\b/);

    if (yearMatch) {
      const year = Number(yearMatch[0]);
      years.push(year);
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    }

    const journal = String(
      getField(paper, 'pubmed_journal', 'journal') || ''
    ).trim();

    if (journal) {
      journals.add(journal);
      journalCounts[journal] = (journalCounts[journal] || 0) + 1;
    }

    const publicationTypes = (
      Array.isArray(paper?.publication_types)
        ? paper.publication_types.join(' ')
        : paper?.publication_types || ''
    ).toLowerCase();

    if (publicationTypes.includes('clinical trial')) clinicalTrials++;
    if (publicationTypes.includes('review')) reviews++;
    if (
      publicationTypes.includes('meta-analysis') ||
      publicationTypes.includes('meta analysis')
    ) {
      metaAnalyses++;
    }
  }

  return {
    paper_count: (papers || []).length,
    free_full_text_count: freeFullText,
    latest_year: years.length ? Math.max(...years) : null,
    journals: [...journals],
    journal_count: journals.size,
    clinical_trials: clinicalTrials,
    reviews,
    meta_analyses: metaAnalyses,
    year_counts: yearCounts,
    top_journals: Object.entries(journalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
  };
}

export function getRelevantPapers(rawPapers, cancer, limit = 20) {
  const scored = (rawPapers || [])
    .map(paper => ({
      paper,
      score: paperRelevanceScore(paper, cancer),
    }))
    .filter(item => item.score !== null)
    .sort((a, b) => b.score - a.score);

  return removeDuplicates(scored.map(item => item.paper)).slice(0, limit);
}
