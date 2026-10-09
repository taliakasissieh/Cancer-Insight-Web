/*
  Cancer Insight — shared query definitions.

  This module is isomorphic (used by API routes AND client components) so that the
  PubMed queries shown to users are exactly the queries the server runs.

  Every count Cancer Insight reports is produced by one of these PubMed queries and is
  linked to the same query on pubmed.ncbi.nlm.nih.gov so it can be reproduced.
*/

export const PUBMED_WEB = 'https://pubmed.ncbi.nlm.nih.gov/';

/* =========================================================================
   CANCER CATALOGUE
   - mesh:     MeSH headings (searched with [mh], which includes narrower terms)
   - phrases:  title/abstract phrases (searched with [tiab])
   - feed:     key accepted by the third-party research feed (null = not covered)
   - population: 'adult' | 'pediatric' | 'mixed' — used only to add epidemiological
                 context to population-topic measures in the Gap Atlas.
   ========================================================================= */

export const CANCERS = {
  lung: {
    label: 'Lung cancer',
    feed: 'lung',
    mesh: ['Lung Neoplasms'],
    phrases: [
      'lung cancer',
      'lung cancers',
      'lung carcinoma',
      'lung adenocarcinoma',
      'non-small cell lung cancer',
      'small cell lung cancer',
      'nsclc',
      'sclc',
    ],
    population: 'adult',
  },
  nsclc: {
    label: 'Non-small cell lung cancer',
    feed: 'lung',
    mesh: ['Carcinoma, Non-Small-Cell Lung'],
    phrases: ['non-small cell lung cancer', 'non-small-cell lung cancer', 'nsclc'],
    population: 'adult',
  },
  breast: {
    label: 'Breast cancer',
    feed: 'breast',
    mesh: ['Breast Neoplasms'],
    phrases: [
      'breast cancer',
      'breast cancers',
      'breast carcinoma',
      'breast tumor',
      'breast tumour',
      'mammary carcinoma',
    ],
    population: 'adult',
  },
  brain: {
    label: 'Brain tumors',
    feed: 'brain',
    mesh: ['Brain Neoplasms', 'Glioma'],
    phrases: [
      'brain cancer',
      'brain tumor',
      'brain tumors',
      'brain tumour',
      'brain tumours',
      'glioma',
      'gliomas',
      'glioblastoma',
      'astrocytoma',
      'medulloblastoma',
    ],
    population: 'mixed',
  },
  glioblastoma: {
    label: 'Glioblastoma',
    feed: 'brain',
    mesh: ['Glioblastoma'],
    phrases: ['glioblastoma', 'glioblastomas', 'glioblastoma multiforme'],
    population: 'adult',
  },
  colorectal: {
    label: 'Colorectal cancer',
    feed: 'colorectal',
    mesh: ['Colorectal Neoplasms'],
    phrases: [
      'colorectal cancer',
      'colorectal cancers',
      'colorectal carcinoma',
      'colon cancer',
      'colon carcinoma',
      'rectal cancer',
      'rectal carcinoma',
      'bowel cancer',
    ],
    population: 'adult',
  },
  prostate: {
    label: 'Prostate cancer',
    feed: 'prostate',
    mesh: ['Prostatic Neoplasms'],
    phrases: [
      'prostate cancer',
      'prostate cancers',
      'prostate carcinoma',
      'prostatic carcinoma',
      'prostate adenocarcinoma',
    ],
    population: 'adult',
  },
  pancreatic: {
    label: 'Pancreatic cancer',
    feed: 'pancreatic',
    mesh: ['Pancreatic Neoplasms'],
    phrases: [
      'pancreatic cancer',
      'pancreatic cancers',
      'pancreatic carcinoma',
      'pancreatic adenocarcinoma',
      'pancreatic ductal adenocarcinoma',
    ],
    population: 'adult',
  },
  liver: {
    label: 'Liver cancer',
    feed: 'liver',
    mesh: ['Liver Neoplasms', 'Carcinoma, Hepatocellular'],
    phrases: [
      'liver cancer',
      'liver cancers',
      'liver carcinoma',
      'hepatocellular carcinoma',
      'hepatic carcinoma',
    ],
    population: 'adult',
  },
  hepatocellular: {
    label: 'Hepatocellular carcinoma',
    feed: 'liver',
    mesh: ['Carcinoma, Hepatocellular'],
    phrases: ['hepatocellular carcinoma', 'hepatocellular cancer'],
    population: 'adult',
  },
  kidney: {
    label: 'Kidney cancer',
    feed: 'kidney',
    mesh: ['Kidney Neoplasms'],
    phrases: [
      'kidney cancer',
      'kidney cancers',
      'renal cancer',
      'renal cell carcinoma',
      'renal carcinoma',
      'kidney carcinoma',
    ],
    population: 'mixed',
  },
  'renal-cell': {
    label: 'Renal cell carcinoma',
    feed: 'kidney',
    mesh: ['Carcinoma, Renal Cell'],
    phrases: ['renal cell carcinoma', 'renal cell carcinomas', 'renal cell cancer'],
    population: 'adult',
  },
  melanoma: {
    label: 'Melanoma',
    feed: 'melanoma',
    mesh: ['Melanoma'],
    phrases: ['melanoma', 'melanomas'],
    population: 'adult',
  },
  skin: {
    label: 'Skin cancer',
    feed: null,
    mesh: ['Skin Neoplasms'],
    phrases: [
      'skin cancer',
      'skin cancers',
      'basal cell carcinoma',
      'cutaneous squamous cell carcinoma',
      'keratinocyte carcinoma',
      'cutaneous melanoma',
    ],
    population: 'adult',
  },
  ovarian: {
    label: 'Ovarian cancer',
    feed: 'ovarian',
    mesh: ['Ovarian Neoplasms'],
    phrases: ['ovarian cancer', 'ovarian cancers', 'ovarian carcinoma'],
    population: 'adult',
  },
  cervical: {
    label: 'Cervical cancer',
    feed: 'cervical',
    mesh: ['Uterine Cervical Neoplasms'],
    phrases: ['cervical cancer', 'cervical cancers', 'cervical carcinoma', 'cancer of the cervix'],
    population: 'adult',
  },
  bladder: {
    label: 'Bladder cancer',
    feed: 'bladder',
    mesh: ['Urinary Bladder Neoplasms'],
    phrases: ['bladder cancer', 'bladder cancers', 'bladder carcinoma', 'urothelial carcinoma'],
    population: 'adult',
  },
  stomach: {
    label: 'Gastric cancer',
    feed: 'stomach',
    mesh: ['Stomach Neoplasms'],
    phrases: [
      'gastric cancer',
      'gastric cancers',
      'gastric carcinoma',
      'gastric adenocarcinoma',
      'stomach cancer',
    ],
    population: 'adult',
  },
  esophageal: {
    label: 'Esophageal cancer',
    feed: 'esophageal',
    mesh: ['Esophageal Neoplasms'],
    phrases: [
      'esophageal cancer',
      'oesophageal cancer',
      'esophageal carcinoma',
      'oesophageal carcinoma',
      'esophageal adenocarcinoma',
      'esophageal squamous cell carcinoma',
    ],
    population: 'adult',
  },
  leukemia: {
    label: 'Leukemia',
    feed: 'leukemia',
    mesh: ['Leukemia'],
    phrases: [
      'leukemia',
      'leukaemia',
      'leukemias',
      'acute myeloid leukemia',
      'acute lymphoblastic leukemia',
      'chronic lymphocytic leukemia',
      'chronic myeloid leukemia',
    ],
    population: 'mixed',
  },
  lymphoma: {
    label: 'Lymphoma',
    feed: 'lymphoma',
    mesh: ['Lymphoma'],
    phrases: ['lymphoma', 'lymphomas', 'hodgkin lymphoma', 'non-hodgkin lymphoma'],
    population: 'mixed',
  },
  myeloma: {
    label: 'Multiple myeloma',
    feed: null,
    mesh: ['Multiple Myeloma'],
    phrases: ['multiple myeloma', 'myeloma'],
    population: 'adult',
  },
  thyroid: {
    label: 'Thyroid cancer',
    feed: null,
    mesh: ['Thyroid Neoplasms'],
    phrases: [
      'thyroid cancer',
      'thyroid cancers',
      'thyroid carcinoma',
      'papillary thyroid carcinoma',
      'follicular thyroid carcinoma',
    ],
    population: 'mixed',
  },
  endometrial: {
    label: 'Endometrial cancer',
    feed: null,
    mesh: ['Endometrial Neoplasms'],
    phrases: ['endometrial cancer', 'endometrial cancers', 'endometrial carcinoma'],
    population: 'adult',
  },
  'head-and-neck': {
    label: 'Head and neck cancer',
    feed: null,
    mesh: ['Head and Neck Neoplasms'],
    phrases: [
      'head and neck cancer',
      'head and neck cancers',
      'head and neck squamous cell carcinoma',
      'oral cancer',
      'oropharyngeal cancer',
      'laryngeal cancer',
    ],
    population: 'adult',
  },
  sarcoma: {
    label: 'Sarcoma',
    feed: null,
    mesh: ['Sarcoma'],
    phrases: ['sarcoma', 'sarcomas', 'soft tissue sarcoma', 'osteosarcoma'],
    population: 'mixed',
  },
  mesothelioma: {
    label: 'Mesothelioma',
    feed: null,
    mesh: ['Mesothelioma'],
    phrases: ['mesothelioma', 'mesotheliomas'],
    population: 'adult',
  },
  neuroblastoma: {
    label: 'Neuroblastoma',
    feed: null,
    mesh: ['Neuroblastoma'],
    phrases: ['neuroblastoma', 'neuroblastomas'],
    population: 'pediatric',
  },
  testicular: {
    label: 'Testicular cancer',
    feed: null,
    mesh: ['Testicular Neoplasms'],
    phrases: ['testicular cancer', 'testicular cancers', 'testicular germ cell tumor'],
    population: 'adult',
  },
};

/* Inputs that should resolve to a catalogue entry. */
const ALIASES = {
  'non-small cell lung cancer': 'nsclc',
  'non small cell lung cancer': 'nsclc',
  'non-small-cell lung cancer': 'nsclc',
  glioma: 'brain',
  gliomas: 'brain',
  gbm: 'glioblastoma',
  'glioblastoma multiforme': 'glioblastoma',
  colon: 'colorectal',
  rectal: 'colorectal',
  rectum: 'colorectal',
  bowel: 'colorectal',
  crc: 'colorectal',
  pancreas: 'pancreatic',
  pdac: 'pancreatic',
  hcc: 'hepatocellular',
  'hepatocellular carcinoma': 'hepatocellular',
  renal: 'kidney',
  rcc: 'renal-cell',
  'renal cell carcinoma': 'renal-cell',
  'renal cell': 'renal-cell',
  'basal cell carcinoma': 'skin',
  ovary: 'ovarian',
  cervix: 'cervical',
  urothelial: 'bladder',
  gastric: 'stomach',
  esophagus: 'esophageal',
  oesophagus: 'esophageal',
  oesophageal: 'esophageal',
  leukaemia: 'leukemia',
  aml: 'leukemia',
  cll: 'leukemia',
  cml: 'leukemia',
  hodgkin: 'lymphoma',
  'non-hodgkin': 'lymphoma',
  nhl: 'lymphoma',
  'multiple myeloma': 'myeloma',
  uterine: 'endometrial',
  endometrium: 'endometrial',
  'head and neck': 'head-and-neck',
  hnscc: 'head-and-neck',
  oral: 'head-and-neck',
  throat: 'head-and-neck',
  osteosarcoma: 'sarcoma',
  testis: 'testicular',
};

const SUFFIX_WORDS = /\b(cancers?|carcinomas?|tumou?rs?|neoplasms?|malignanc(?:y|ies))\b/g;
const CANCER_WORD = /(oma|omas|emia|aemia|cancer|cancers|carcinoma|tumou?r|neoplasm|malignancy)$/;

export const EXAMPLE_CANCERS = ['pancreatic', 'breast', 'lung', 'leukemia', 'melanoma', 'glioblastoma'];

/** Lower-case, strip anything that could alter a PubMed query, cap the length. */
export function sanitizeCancerInput(raw) {
  return String(raw ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[_]/g, ' ')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .trim();
}

function capitalize(text) {
  const s = String(text || '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function quote(phrase) {
  return `"${String(phrase).replace(/"/g, '')}"`;
}

/**
 * Resolve user input into a catalogue entry (or a generic definition) plus the exact
 * PubMed query used everywhere on the site.
 */
export function resolveCancer(raw) {
  const input = sanitizeCancerInput(raw);
  if (!input || input.length < 2) return null;

  const base = input.replace(SUFFIX_WORDS, '').replace(/\s+/g, ' ').trim();
  // "cancer" or "tumor" alone is not a searchable cancer type.
  if (!base || base.length < 2) return null;
  const candidates = [input, base, input.replace(/s$/, ''), base.replace(/s$/, '')];

  let id = null;
  for (const c of candidates) {
    if (!c) continue;
    if (CANCERS[c]) {
      id = c;
      break;
    }
    if (ALIASES[c]) {
      id = ALIASES[c];
      break;
    }
  }

  if (id) {
    const entry = CANCERS[id];
    return {
      input,
      id,
      known: true,
      slug: id,
      label: entry.label,
      feed: entry.feed,
      mesh: entry.mesh,
      phrases: entry.phrases,
      population: entry.population,
      term: buildCancerTerm(entry.mesh, entry.phrases),
    };
  }

  // Generic definition for inputs outside the catalogue.
  const subject = base || input;
  const phrases = CANCER_WORD.test(input)
    ? [input]
    : [
        `${subject} cancer`,
        `${subject} cancers`,
        `${subject} carcinoma`,
        `${subject} tumor`,
        `${subject} tumour`,
        `${subject} neoplasm`,
      ];

  return {
    input,
    id: null,
    known: false,
    slug: input.replace(/\s+/g, '-'),
    label: CANCER_WORD.test(input) ? capitalize(input) : `${capitalize(subject)} cancer`,
    feed: null,
    mesh: [],
    phrases,
    population: 'unknown',
    term: buildCancerTerm([], phrases),
  };
}

export function buildCancerTerm(mesh = [], phrases = []) {
  const parts = [
    ...mesh.map(m => `${quote(m)}[mh]`),
    ...phrases.map(p => `${quote(p)}[tiab]`),
  ];
  return `(${parts.join(' OR ')})`;
}

export function pubmedSearchUrl(term) {
  return `${PUBMED_WEB}?term=${encodeURIComponent(term)}`;
}

export function andTerms(...terms) {
  return terms.filter(Boolean).join(' AND ');
}

export function yearRangeTerm(start, end) {
  return `("${start}"[dp] : "${end}"[dp])`;
}

/* =========================================================================
   ALL-ONCOLOGY BASELINE
   Used by the Gap Atlas to compare a cancer's literature with oncology overall.
   ========================================================================= */

export const BASELINE_TERM =
  '(neoplasms[mh] OR cancer*[tiab] OR carcinoma*[tiab] OR tumor*[tiab] OR tumour*[tiab] OR neoplasm*[tiab] OR leukemia*[tiab] OR leukaemia*[tiab] OR lymphoma*[tiab] OR melanoma*[tiab] OR sarcoma*[tiab] OR glioma*[tiab] OR myeloma*[tiab])';

/* =========================================================================
   STUDY DESIGNS (PubMed publication types). [pt] searches include narrower
   publication types, e.g. "clinical trial"[pt] includes phase I–IV and RCTs.
   ========================================================================= */

export const DESIGNS = [
  {
    id: 'clinical-trial',
    label: 'Clinical trials (all phases)',
    short: 'Clinical trials',
    term: '"clinical trial"[pt]',
  },
  {
    id: 'rct',
    label: 'Randomized controlled trials',
    short: 'RCTs',
    term: '"randomized controlled trial"[pt]',
  },
  {
    id: 'observational',
    label: 'Observational studies',
    short: 'Observational',
    term: '"observational study"[pt]',
  },
  { id: 'case-report', label: 'Case reports', short: 'Case reports', term: '"case reports"[pt]' },
  {
    id: 'systematic-review',
    label: 'Systematic reviews',
    short: 'Systematic reviews',
    term: '"systematic review"[pt]',
  },
  {
    id: 'meta-analysis',
    label: 'Meta-analyses',
    short: 'Meta-analyses',
    term: '"meta-analysis"[pt]',
  },
  { id: 'review', label: 'Reviews (all types)', short: 'Reviews', term: 'review[pt]' },
  {
    id: 'guideline',
    label: 'Guidelines',
    short: 'Guidelines',
    term: '(guideline[pt] OR "practice guideline"[pt])',
  },
];

export const DESIGN_BY_ID = Object.fromEntries(DESIGNS.map(d => [d.id, d]));

/* =========================================================================
   RESEARCH THEMES (Gap Atlas). Concept themes combine MeSH and title/abstract
   wording; population themes use title/abstract wording only, so they measure
   studies that *focus on* a population rather than any study that included it.
   ========================================================================= */

export const THEMES = [
  {
    id: 'quality-of-life',
    label: 'Quality of life & patient-reported outcomes',
    short: 'Quality of life',
    kind: 'concept',
    term: '("quality of life"[mh] OR "quality of life"[tiab] OR "patient reported outcome*"[tiab] OR "patient-reported outcome*"[tiab] OR hrqol[tiab])',
  },
  {
    id: 'toxicity',
    label: 'Toxicity, adverse events & tolerability',
    short: 'Toxicity & safety',
    kind: 'concept',
    term: '("drug-related side effects and adverse reactions"[mh] OR toxicit*[tiab] OR "adverse event*"[tiab] OR "adverse effect*"[tiab] OR "side effect*"[tiab] OR tolerability[tiab])',
  },
  {
    id: 'recurrence',
    label: 'Recurrence & relapse',
    short: 'Recurrence',
    kind: 'concept',
    term: '("neoplasm recurrence, local"[mh] OR recurrence[tiab] OR relapse*[tiab])',
  },
  {
    id: 'resistance',
    label: 'Treatment resistance',
    short: 'Resistance',
    kind: 'concept',
    term: '("drug resistance, neoplasm"[mh] OR chemoresistan*[tiab] OR radioresistan*[tiab] OR "drug resistance"[tiab] OR "treatment resistance"[tiab] OR "therapy resistance"[tiab] OR refractory[tiab])',
  },
  {
    id: 'biomarkers',
    label: 'Biomarkers',
    short: 'Biomarkers',
    kind: 'concept',
    term: '("biomarkers, tumor"[mh] OR biomarker*[tiab])',
  },
  {
    id: 'pediatric',
    label: 'Children & adolescents',
    short: 'Pediatric',
    kind: 'population',
    term: '(pediatric*[tiab] OR paediatric*[tiab] OR child*[tiab] OR adolescen*[tiab])',
  },
  {
    id: 'older-adults',
    label: 'Older adults',
    short: 'Older adults',
    kind: 'population',
    term: '(elderly[tiab] OR "older adult*"[tiab] OR "older patient*"[tiab] OR geriatric*[tiab] OR "older people"[tiab])',
  },
  {
    id: 'survivorship',
    label: 'Survivorship & late effects',
    short: 'Survivorship',
    kind: 'concept',
    term: '("cancer survivors"[mh] OR survivorship[tiab] OR "cancer survivor*"[tiab] OR "late effect*"[tiab])',
  },
  {
    id: 'disparities',
    label: 'Access, equity & disparities',
    short: 'Disparities',
    kind: 'concept',
    term: '("healthcare disparities"[mh] OR "health status disparities"[mh] OR disparit*[tiab] OR inequit*[tiab] OR "access to care"[tiab] OR underserved[tiab] OR socioeconomic[tiab])',
  },
];

export const FREE_FULL_TEXT = {
  id: 'free-full-text',
  label: 'Free full text available',
  short: 'Free full text',
  term: '"free full text"[sb]',
};

/* =========================================================================
   TREATMENT CATEGORIES
   Keys match the treatment tags supplied by the research feed.
   ========================================================================= */

export const TREATMENTS = {
  surgery: {
    label: 'Surgery',
    term: '(surgery[tiab] OR surgical[tiab] OR resection[tiab] OR "surgical procedures, operative"[mh])',
  },
  chemotherapy: {
    label: 'Chemotherapy',
    term: '(chemotherap*[tiab] OR "antineoplastic combined chemotherapy protocols"[mh])',
  },
  radiation: {
    label: 'Radiation therapy',
    term: '(radiotherap*[tiab] OR "radiation therapy"[tiab] OR radiotherapy[mh])',
  },
  immunotherapy: {
    label: 'Immunotherapy',
    term: '(immunotherap*[tiab] OR "immune checkpoint inhibitor*"[tiab] OR immunotherapy[mh])',
  },
  'targeted therapy': {
    label: 'Targeted therapy',
    term: '("targeted therap*"[tiab] OR "molecular targeted therapy"[mh] OR "kinase inhibitor*"[tiab])',
  },
  'hormone therapy': {
    label: 'Hormone therapy',
    term: '("hormone therap*"[tiab] OR "endocrine therap*"[tiab] OR "hormonal therap*"[tiab] OR "androgen deprivation"[tiab] OR "antineoplastic agents, hormonal"[mh])',
  },
  'stem cell transplant': {
    label: 'Stem cell transplant',
    term: '("hematopoietic stem cell transplantation"[mh] OR "stem cell transplant*"[tiab] OR "bone marrow transplant*"[tiab])',
  },
};

const TREATMENT_ALIASES = {
  radiotherapy: 'radiation',
  'radiation therapy': 'radiation',
  'targeted therapies': 'targeted therapy',
  'hormonal therapy': 'hormone therapy',
  'endocrine therapy': 'hormone therapy',
  'stem cell transplantation': 'stem cell transplant',
  'bone marrow transplant': 'stem cell transplant',
};

export const DEFAULT_TREATMENT_KEYS = Object.keys(TREATMENTS);

export function sanitizeTreatmentInput(raw) {
  return String(raw ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[_]/g, ' ')
    .replace(/[^a-z0-9\s'+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50)
    .trim();
}

export function resolveTreatment(raw) {
  const key = sanitizeTreatmentInput(raw);
  if (!key) return null;
  const id = TREATMENTS[key] ? key : TREATMENT_ALIASES[key] || null;
  if (id) return { id, key: id, label: TREATMENTS[id].label, term: TREATMENTS[id].term, known: true };
  return {
    id: key,
    key,
    label: capitalize(key),
    term: `${quote(key)}[tiab]`,
    known: false,
  };
}

/* =========================================================================
   PUBLICATION-YEAR WINDOWS (Gap Atlas inspectable sample + recency measure)
   ========================================================================= */

export function yearWindows(currentYear = new Date().getUTCFullYear()) {
  return [
    { id: 'recent', label: 'Recent', start: currentYear - 2, end: currentYear },
    { id: 'mid', label: 'Mid', start: currentYear - 7, end: currentYear - 3 },
    { id: 'older', label: 'Older', start: currentYear - 17, end: currentYear - 8 },
    { id: 'historical', label: 'Historical', start: 1900, end: currentYear - 18 },
  ];
}
