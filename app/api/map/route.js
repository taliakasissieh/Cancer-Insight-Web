/*
  GET /api/map                 → columns (measures) and the list of cancers
  GET /api/map?cancer=breast   → one row of the all-cancer map (catalogue ids only)
*/

import { mapIndex, mapRow } from '../../../lib/map-server';
import { errorResponse, publicJson, queryParams } from '../../../lib/http';

export const maxDuration = 60;

export async function GET(request) {
  const params = queryParams(request);
  try {
    if (!params.cancer) return publicJson(mapIndex());
    return publicJson(await mapRow(params.cancer));
  } catch (error) {
    return errorResponse(error, 'map');
  }
}
