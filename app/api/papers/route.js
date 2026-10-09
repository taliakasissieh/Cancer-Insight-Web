import { pubmedPaperSet } from '../../../lib/research';
import { badRequest, errorResponse, json, readJson } from '../../../lib/http';

export const maxDuration = 60;

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest();
  const sort = body.sort === 'pub_date' ? 'pub_date' : 'relevance';
  const limit = Math.max(5, Math.min(40, Number(body.limit) || 20));
  try {
    return json(await pubmedPaperSet(body.cancer, { sort, limit }));
  } catch (error) {
    return errorResponse(error, 'papers');
  }
}
