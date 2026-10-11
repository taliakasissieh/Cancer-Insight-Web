/*
  GET  /api/trials?cancer=pancreatic            → trial profile (JSON)
  GET  /api/trials?cancer=pancreatic&format=csv → every counted study, one row each
  POST /api/trials {cancer}                     → trial profile (used by the site)
*/

import { requireCancer } from '../../../lib/research';
import { fetchTrialRows, trialProfile } from '../../../lib/trials-server';
import { conditionFor, trialsCsvRows } from '../../../lib/trials';
import { toCsv } from '../../../lib/csv';
import { slugify } from '../../../lib/format';
import {
  badRequest,
  csvResponse,
  errorResponse,
  json,
  publicJson,
  queryParams,
  readJson,
} from '../../../lib/http';

export const maxDuration = 60;

async function profileFor(cancer) {
  const resolved = requireCancer(cancer);
  return trialProfile(resolved);
}

export async function GET(request) {
  const params = queryParams(request);
  try {
    const resolved = requireCancer(params.cancer);
    if (params.format === 'csv') {
      const data = await fetchTrialRows(conditionFor(resolved));
      const rows = trialsCsvRows(data.rows, { countryNames: data.countryNames });
      const date = new Date().toISOString().slice(0, 10);
      const provenance = [
        ['# Source', 'ClinicalTrials.gov API v2, condition search'],
        ['# Condition', data.condition],
        ['# Retrieved', data.retrievedAt],
        ['# Studies in list', String(data.rows.length), 'of', String(data.totalCount)],
      ];
      return csvResponse(
        toCsv([...provenance, ...rows]),
        `cancer-insight_${slugify(resolved.label)}_trials_${date}.csv`
      );
    }
    return publicJson(await trialProfile(resolved));
  } catch (error) {
    return errorResponse(error, 'trials');
  }
}

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest();
  try {
    return json(await profileFor(body.cancer));
  } catch (error) {
    return errorResponse(error, 'trials');
  }
}
