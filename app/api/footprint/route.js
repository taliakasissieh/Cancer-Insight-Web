import { literatureFootprint } from '../../../lib/research';
import { badRequest, errorResponse, json, readJson } from '../../../lib/http';

export const maxDuration = 60;

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest();
  try {
    return json(await literatureFootprint(body.cancer));
  } catch (error) {
    return errorResponse(error, 'footprint');
  }
}
