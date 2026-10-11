import { analyzeResearchGaps } from '../../../lib/gaps';
import {
  badRequest,
  errorResponse,
  json,
  publicJson,
  queryParams,
  readJson,
} from '../../../lib/http';

export const maxDuration = 60;

/* Open data: GET ?cancer=… returns the same JSON. */
export async function GET(request) {
  const params = queryParams(request);
  try {
    return publicJson(await analyzeResearchGaps(params.cancer));
  } catch (error) {
    return errorResponse(error, 'gap atlas');
  }
}

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest();
  try {
    return json(await analyzeResearchGaps(body.cancer));
  } catch (error) {
    return errorResponse(error, 'gap atlas');
  }
}
