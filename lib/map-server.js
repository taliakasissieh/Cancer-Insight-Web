/*
  Cancer Insight — all-cancer map (server only). One row per catalogue cancer, one cell per
  Gap Atlas measure: the cancer's share of records matching the measure divided by the
  oncology-wide share (Method 3.0). Counts are cached for a day, so the map fills quickly
  after its first build.
*/

import { CANCERS, resolveCancer } from './queries.js';
import { METHOD_VERSION, THRESHOLDS, computeAtlasMeasures, measureDefinitions } from './gaps.js';
import { UserFacingError } from './research.js';

export const MAP_CANCERS = Object.keys(CANCERS);

export function mapColumns(currentYear = new Date().getUTCFullYear()) {
  return measureDefinitions(currentYear).map(m => ({
    id: m.id,
    group: m.group,
    label: m.label,
    short: m.short,
    definition: m.term,
  }));
}

export function mapIndex() {
  return {
    methodVersion: METHOD_VERSION,
    thresholds: THRESHOLDS,
    columns: mapColumns(),
    cancers: MAP_CANCERS.map(id => ({ id, label: CANCERS[id].label })),
  };
}

export async function mapRow(id) {
  if (!MAP_CANCERS.includes(id)) {
    throw new UserFacingError('Choose a cancer from the catalogue.', 400);
  }
  const resolved = resolveCancer(id);
  const { total, baselineTotalCount, results } = await computeAtlasMeasures(resolved);
  return {
    id,
    label: resolved.label,
    methodVersion: METHOD_VERSION,
    generatedAt: new Date().toISOString(),
    total: total.count,
    totalUrl: total.url,
    baselineTotal: baselineTotalCount,
    cells: results.map(m => ({
      id: m.id,
      ratio: m.ratio,
      status: m.status,
      count: m.count,
      share: m.share,
      baselineShare: m.baselineShare,
      url: m.url,
    })),
  };
}
