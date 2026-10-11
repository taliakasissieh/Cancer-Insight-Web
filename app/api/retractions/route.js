/*
  GET  /api/retractions?cancer=pancreatic → retracted PubMed records for a cancer (count + newest)
  POST /api/retractions {cancer}
*/

import { retractionWatch } from '../../../lib/research';
import { badRequest, errorResponse, json, publicJson, queryParams, readJson } from '../../../lib/http';

export const maxDuration = 30;

export async function GET(request) {
  try {
    return publicJson(await retractionWatch(queryParams(request).cancer));
  } catch (error) {
    return errorResponse(error, 'retractions');
  }
}

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest();
  try {
    return json(await retractionWatch(body.cancer));
  } catch (error) {
    return errorResponse(error, 'retractions');
  }
}
