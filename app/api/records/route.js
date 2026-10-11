import { fetchRecords } from '../../../lib/pubmed';
import { badRequest, errorResponse, json, readJson } from '../../../lib/http';

/* Look up PubMed metadata for saved paper IDs (used to restore papers saved by the
   previous version of the site, which stored IDs only). */
export async function POST(request) {
  const body = await readJson(request);
  const ids = Array.isArray(body?.ids)
    ? body.ids.map(String).filter(id => /^\d{1,9}$/.test(id))
    : null;
  if (!ids || !ids.length || ids.length > 100) return badRequest('Provide 1–100 PubMed IDs.');
  try {
    const records = await fetchRecords(ids);
    return json({ papers: ids.map(id => records[id]).filter(Boolean) });
  } catch (error) {
    return errorResponse(error, 'records');
  }
}
