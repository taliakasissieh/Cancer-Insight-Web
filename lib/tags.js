/*
  Treatment tags from the research feed are kept only when the record's own text supports them.
  The feed sometimes tags papers by association: "cancer stem cell" papers as stem cell
  transplant, or photodynamic and other light-based therapies as radiation therapy.
*/

import { treatmentTags } from './evidence.js';
import { resolveTreatment } from './queries.js';

const asText = v => (Array.isArray(v) ? v.join(' ') : v ? String(v) : '');

const EVIDENCE = {
  'stem cell transplant':
    /\b(hematopoietic stem[\s-]*cell transplant|haematopoietic stem[\s-]*cell transplant|stem[\s-]*cell transplant|hsct\b|bone marrow transplant|allogeneic transplant|autologous transplant)/i,
  radiation:
    /\b(radiotherap|radiation|irradiat|chemoradi|radiochemo|brachytherap|radiosurg|proton (beam )?therap|carbon[\s-]ion|stereotactic body|sbrt\b|sabr\b|imrt\b|vmat\b|radioligand|radionuclide therap|radioiodine|radioembolization|\d+(\.\d+)?\s?gy\b)/i,
};

/** Feed tags for a record, minus those its title, abstract, MeSH and keywords do not support. */
export function supportedTreatmentTags(p) {
  const text = [
    p?.pubmed_title,
    p?.title,
    p?.pubmed_abstract,
    p?.abstract,
    asText(p?.mesh_terms),
    asText(p?.keywords),
  ]
    .filter(Boolean)
    .join(' ');
  return treatmentTags(p).filter(tag => {
    const id = resolveTreatment(tag)?.id || tag;
    const re = EVIDENCE[id];
    return !re || re.test(text);
  });
}
