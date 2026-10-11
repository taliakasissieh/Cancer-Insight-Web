import { treatmentProfile } from '../../../lib/research';
import {
  badRequest,
  errorResponse,
  json,
  publicJson,
  queryParams,
  readJson,
} from '../../../lib/http';

export const maxDuration = 60;

/* Open data: GET ?cancer=…&treatment=… returns the same JSON. */
export async function GET(request) {
  const params = queryParams(request);
  const limit = Math.max(1, Math.min(20, Number(params.limit) || 8));
  const sort = params.sort === 'pub_date' ? 'pub_date' : 'relevance';
  try {
    const profile = await treatmentProfile(params.cancer, params.treatment, { limit, sort });
    return publicJson({ ...profile, papers: profile.examples.papers });
  } catch (error) {
    return errorResponse(error, 'treatment');
  }
}

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest();
  const limit = Math.max(1, Math.min(20, Number(body.limit) || 8));
  const sort = body.sort === 'pub_date' ? 'pub_date' : 'relevance';
  try {
    const profile = await treatmentProfile(body.cancer, body.treatment, { limit, sort });
    return json({ ...profile, papers: profile.examples.papers });
  } catch (error) {
    return errorResponse(error, 'treatment');
  }
}
