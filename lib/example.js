/*
  Real example for the homepage: PubMed record counts for pancreatic cancer and for all
  oncology, captured on 9 October 2026 with the Gap Atlas Method 3.0 queries. Each row links
  to the live PubMed query, so readers can check today's numbers.
*/

import {
  BASELINE_TERM,
  DESIGN_BY_ID,
  THEMES,
  andTerms,
  pubmedSearchUrl,
  resolveCancer,
} from './queries.js';

export const EXAMPLE_DATE = '9 October 2026';

const COUNTS = {
  total: [129428, 5902084],
  rct: [1418, 79055],
  'systematic-review': [1695, 60686],
  'quality-of-life': [2680, 137770],
  toxicity: [8512, 422865],
  biomarkers: [16299, 486015],
  survivorship: [200, 46183],
  disparities: [786, 52908],
  pediatric: [1333, 260469],
};

export function pancreaticExampleRows() {
  const cancer = resolveCancer('pancreatic');
  const themeById = Object.fromEntries(THEMES.map(t => [t.id, t]));
  const ids = [
    'rct',
    'systematic-review',
    'quality-of-life',
    'toxicity',
    'biomarkers',
    'disparities',
    'survivorship',
    'pediatric',
  ];
  const [cTotal, bTotal] = COUNTS.total;
  return ids.map(id => {
    const def = DESIGN_BY_ID[id] || themeById[id];
    const [c, b] = COUNTS[id];
    const share = c / cTotal;
    const baselineShare = b / bTotal;
    const ratio = share / baselineShare;
    let status =
      ratio < 0.33 ? 'much-lower' : ratio < 0.5 ? 'lower' : ratio > 1.5 ? 'higher' : 'similar';
    if (id === 'pediatric') status = 'context';
    return {
      id,
      label: def.short === 'RCTs' ? 'Randomized trials' : def.short,
      short: def.short === 'RCTs' ? 'Randomized trials' : def.short,
      share,
      baselineShare,
      ratio,
      status,
      url: pubmedSearchUrl(andTerms(cancer.term, def.term)),
      baselineUrl: pubmedSearchUrl(andTerms(BASELINE_TERM, def.term)),
    };
  });
}
