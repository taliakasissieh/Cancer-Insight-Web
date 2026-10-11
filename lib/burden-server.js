/* Cancer Insight — research vs burden (server only): PubMed counts for the comparison. */

import { BASELINE_TERM, andTerms, pubmedSearchUrl, resolveCancer, yearRangeTerm } from './queries.js';
import { countRecords } from './pubmed.js';
import { BURDEN_EXCLUDED, BURDEN_MAP, GLOBOCAN, compareResearchWithBurden, researchYears } from './burden.js';

export async function researchVsBurden(today = new Date()) {
  const years = researchYears(today);
  const yearsTerm = yearRangeTerm(years.start, years.end);
  const cancers = Object.keys(BURDEN_MAP).map(id => resolveCancer(id));
  const baselineTerm = andTerms(BASELINE_TERM, yearsTerm);

  const [baseline, ...counts] = await Promise.all([
    countRecords(baselineTerm),
    ...cancers.map(c => countRecords(andTerms(c.term, yearsTerm))),
  ]);

  const research = cancers.map((c, i) => ({
    id: c.id,
    label: c.label,
    count: counts[i].count,
    url: counts[i].url,
  }));

  return {
    generatedAt: new Date().toISOString(),
    years,
    burden: GLOBOCAN,
    baseline: {
      term: baselineTerm,
      count: baseline.count,
      url: baseline.url || pubmedSearchUrl(baselineTerm),
    },
    rows: compareResearchWithBurden(research, baseline),
    excluded: Object.entries(BURDEN_EXCLUDED).map(([id, reason]) => ({
      id,
      label: resolveCancer(id)?.label || id,
      reason,
    })),
  };
}
