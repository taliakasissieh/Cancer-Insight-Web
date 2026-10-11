/* Language-aware labels built from data (evidence types, errors, cancer names). */

const ERROR_PATTERNS = [
  [/could not reach its server/i, 'errors.network'],
  [/^Enter a specific cancer type/i, 'errors.specificCancer'],
  [/^PubMed could not be reached/i, 'errors.pubmed'],
  [/^ClinicalTrials\.gov could not be reached/i, 'errors.trials'],
  [/^PubMed returned no records/i, 'errors.noRecords'],
  [/^Something went wrong/i, 'errors.generic'],
];

/** Translate a known server/client error message; unknown messages are returned unchanged. */
export function localizeError(t, locale, message) {
  if (locale !== 'ar' || !message) return message;
  for (const [re, key] of ERROR_PATTERNS) if (re.test(message)) return t(key);
  return message;
}

/** "Randomized controlled trial, phase III" in the page language. */
export function evidenceLabel(t, c) {
  const type = t(`evidence.types.${c.id}`);
  if ((c.id === 'rct' || c.id === 'trial') && c.phase) {
    return t('evidence.withPhase', { type, phase: String(c.phase).replace(/^Phase\s+/i, '') });
  }
  return type;
}

/** Catalogue cancers use the dictionary; anything else keeps the label it was searched with. */
export function cancerName(t, cancer) {
  if (!cancer) return '';
  const id = typeof cancer === 'string' ? cancer : cancer.id;
  if (id) {
    const key = `cancers.${id}`;
    const name = t(key);
    if (name !== key) return name;
  }
  return typeof cancer === 'string' ? cancer : cancer.label || cancer.input || '';
}
