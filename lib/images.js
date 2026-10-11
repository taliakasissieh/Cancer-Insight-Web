/*
  Cancer Insight — relevance rules for Wikimedia Commons images.

  An image is shown for a cancer only when its own title or description names that cancer.
  The Commons "credit" field often cites the source article, so an image of an inguinal
  hernia or of a head-and-neck tumour can carry a pancreatic-cancer citation; the credit is
  therefore never used as evidence of relevance.
*/

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-phrase matcher: spaces and hyphens are interchangeable, an optional plural "s". */
export function phraseMatcher(list) {
  const bodies = [...new Set(list.map(p => String(p).toLowerCase().trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length)
    .map(p => escapeRegExp(p).replace(/\\-|\s+/g, '[\\s-]+'));
  if (!bodies.length) return null;
  return new RegExp(`(?:^|[^a-z0-9])(?:${bodies.join('|')})s?(?=$|[^a-z0-9])`, 'i');
}

/** Prefix matcher for organ words ("pancre" matches pancreas and pancreatic). */
function prefixMatcher(list) {
  const bodies = [...new Set(list)].map(escapeRegExp);
  if (!bodies.length) return null;
  return new RegExp(`(?:^|[^a-z0-9])(?:${bodies.join('|')})`, 'i');
}

export const VISUAL_TERMS = phraseMatcher([
  'histology',
  'histopathology',
  'histopathologic',
  'pathology',
  'micrograph',
  'microscopy',
  'microscopic',
  'biopsy',
  'specimen',
  'cytology',
  'immunohistochemistry',
  'h&e',
  'hematoxylin',
  'tumor',
  'tumour',
  'neoplasm',
  'lesion',
  'carcinoma',
  'adenocarcinoma',
  'radiograph',
  'x-ray',
  'computed tomography',
  'computertomography',
  'ct',
  'mri',
  'magnetic resonance',
  'pet',
  'mammogram',
  'mammography',
  'ultrasound',
  'ultrasonography',
  'gross pathology',
  'diagram',
  'schematic',
  'illustration',
  'metastasis',
  'metastases',
  'metastatic',
  'immunofluorescence',
  'segmentation',
]);

export const STRONG_TERMS = phraseMatcher([
  'histology',
  'histopathology',
  'micrograph',
  'microscopy',
  'biopsy',
  'immunohistochemistry',
  'computed tomography',
  'computertomography',
  'ct',
  'mri',
  'magnetic resonance',
  'pet',
  'ultrasonography',
  'mammography',
  'gross pathology',
  'segmentation',
]);

export const BLOCKED = phraseMatcher([
  'bus',
  'autobus',
  'vehicle',
  'street',
  'campaign',
  'awareness',
  'ribbon',
  'fundraiser',
  'fundraising',
  'charity',
  'poster',
  'advertisement',
  'logo',
  'mascot',
  'marathon',
  't-shirt',
  'stamp',
  'coin',
  'billboard',
  'military',
  'soldier',
  'army',
  'yearbook',
  'newspaper',
  'portrait of',
  'annual report',
  'book scan',
  'scanned page',
  'title page',
  'table of contents',
  'internet archive',
  'archive.org',
  'digitized by',
]);

/* A title built around a look-alike condition is not an image of the cancer, even if it
   names the cancer ("tuberculosis mimicking pancreatic cancer"). */
const MIMIC = phraseMatcher(['mimic', 'mimicking', 'mimicker', 'masquerading', 'pseudotumor']);

/* Conditions and devices that make an image about something else when the title does not
   name the cancer itself. */
const OTHER_SUBJECT = phraseMatcher([
  'tuberculosis',
  'hernia',
  'abscess',
  'pancreatitis',
  'pseudocyst',
  'appendicitis',
  'cholecystitis',
  'pneumonia',
  'sarcoidosis',
  'aneurysm',
  'fracture',
  'infection',
  'port-a-cath',
  'catheter',
]);

/* Any tumour word in a title. A title with one of these that does not name the searched
   cancer (or its organ) is about a different tumour. */
const TUMOUR_WORD =
  /(?:^|[^a-z0-9])(?:cancers?|carcinomas?|adenocarcinomas?|tumou?rs?|neoplasms?|metasta[a-z]*|lymphomas?|leuka?emias?|sarcomas?|melanomas?|gliomas?|glioblastomas?|myelomas?|[a-z]*blastomas?|carcinoids?|malignan[a-z]*)(?=$|[^a-z0-9])/i;

/* Abbreviations that name a cancer outright. */
const ACRONYMS = new Set([
  'gbm',
  'crc',
  'pdac',
  'hcc',
  'rcc',
  'aml',
  'cll',
  'cml',
  'nhl',
  'hnscc',
  'nsclc',
  'sclc',
]);

/* Words that describe a cancer without naming its site. */
const GENERIC_WORDS = new Set([
  'cancer',
  'cancers',
  'carcinoma',
  'carcinomas',
  'adenocarcinoma',
  'adenocarcinomas',
  'tumor',
  'tumors',
  'tumour',
  'tumours',
  'neoplasm',
  'neoplasms',
  'malignant',
  'malignancy',
  'metastatic',
  'primary',
  'advanced',
  'invasive',
  'ductal',
  'cell',
  'cells',
  'small',
  'non',
  'non-small',
  'large',
  'acute',
  'chronic',
  'squamous',
  'basal',
  'type',
  'and',
  'of',
  'the',
  'in',
]);

/**
 * Build the matchers for one cancer.
 * @param {string[]} phrases  catalogue phrases and MeSH headings
 * @param {string[]} aliases  alternative names that resolve to this cancer
 */
export function imageMatchContext(phrases = [], aliases = []) {
  const disease = [...phrases];
  const organ = [];

  for (const phrase of phrases) {
    for (const token of String(phrase)
      .toLowerCase()
      .split(/[\s-]+/)) {
      if (token.length < 3 || GENERIC_WORDS.has(token) || ACRONYMS.has(token)) continue;
      organ.push(token.length > 6 ? token.slice(0, 6) : token);
    }
  }
  for (const alias of aliases) {
    const a = String(alias).toLowerCase();
    if (/[\s-]/.test(a) || ACRONYMS.has(a) || TUMOUR_WORD.test(a)) disease.push(a);
    else if (a.length >= 3) organ.push(a.length > 6 ? a.slice(0, 6) : a);
  }

  return { disease: phraseMatcher(disease), organ: prefixMatcher(organ) };
}

function norm(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Score one Commons file for a cancer. Returns null when it should not be shown.
 * @param {{title: string, description: string, credit?: string, license?: string}} item
 * @param {{disease: RegExp|null, organ: RegExp|null}} ctx
 */
export function scoreImage(item, ctx) {
  if (!ctx?.disease) return null;
  const title = norm(item.title);
  const description = norm(item.description);
  const text = `${title} ${description}`;

  const inTitle = ctx.disease.test(title);
  const inDescription = ctx.disease.test(description);
  if (!inTitle && !inDescription) return null;

  if (!VISUAL_TERMS.test(text)) return null;
  if (BLOCKED.test(`${text} ${norm(item.credit)}`)) return null;
  if (MIMIC.test(title)) return null;

  if (!inTitle) {
    if (OTHER_SUBJECT.test(title)) return null;
    if (TUMOUR_WORD.test(title) && !(ctx.organ && ctx.organ.test(title))) return null;
    if (!STRONG_TERMS.test(text)) return null;
  }

  let s = inTitle ? 14 : 6;
  if (STRONG_TERMS.test(text)) s += 8;
  if (/\b(histopathology|micrograph|histology)\b/i.test(text)) s += 4;
  if (/\b(ct|mri|computed tomography|magnetic resonance)\b/i.test(text)) s += 3;
  if (item.license) s += 1;
  return s;
}
