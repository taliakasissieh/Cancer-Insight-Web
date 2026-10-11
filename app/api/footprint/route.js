import { literatureFootprint } from '../../../lib/research';
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
    return publicJson(await literatureFootprint(params.cancer));
  } catch (error) {
    return errorResponse(error, 'footprint');
  }
}

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest();
  try {
    return json(await literatureFootprint(body.cancer));
  } catch (error) {
    return errorResponse(error, 'footprint');
  }
}
