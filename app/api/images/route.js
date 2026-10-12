/*
  Cancer Insight — scientific images from Wikimedia Commons.

  Previous version: up to 48 sequential, uncached Commons searches (≈8 s per request).
  Now: ≤10 searches run with limited concurrency and cached for 24 h; filtering uses
  word boundaries (so "thrombus" and "prevention" are no longer rejected); licence links and
  attribution are returned so the gallery can meet CC BY / BY-SA attribution requirements.
  Relevance rules live in lib/images.js (the cancer must be named in the file's own title or
  description, never only in the source credit).
*/

import { stableCache } from '../../../lib/cache.js';
import { aliasesFor, resolveCancer } from '../../../lib/queries';
import { imageMatchContext, scoreImage } from '../../../lib/images';
import { badRequest, errorResponse, json, readJson } from '../../../lib/http';

export const maxDuration = 30;

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const UA =
  'CancerInsight/7.0 (educational research explorer; https://www.cancer-insight.com; cancerinsight.contact@gmail.com)';

const CONTEXTS = ['histopathology', 'micrograph', 'CT', 'MRI', ''];
const MAX_IMAGES = 12;

function cleanHtml(value = '') {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanArtist(value) {
  const text = cleanHtml(value)
    .replace(/\s*(Author info|Consent note|Reusing images|Conflicts of interest)\b[\s\S]*$/i, '')
    .trim();
  return text.length > 90 ? `${text.slice(0, 87).trimEnd()}…` : text;
}

const DOCUMENT_FILE = /\.(pdf|djvu|djv|docx?|pptx?|xlsx?|txt|rtf|od[tsp])(?:$|\?)/i;
const IMAGE_FILE = /\.(jpe?g|png|gif|webp|tiff?|svg)(?:$|\?)/i;

async function searchCommonsRaw(query) {
  const url = new URL(COMMONS_API);
  const params = {
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '40',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '640',
    format: 'json',
    formatversion: '2',
  };
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Commons HTTP ${res.status}`);
  const data = await res.json();
  return (data?.query?.pages || []).map(page => {
    const info = page?.imageinfo?.[0] || {};
    const meta = info.extmetadata || {};
    return {
      title: String(page?.title || '').replace(/^File:/, ''),
      thumbnail: info.thumburl || '',
      file: info.url || '',
      mime: info.mime || '',
      page: info.descriptionurl || '',
      description: cleanHtml(meta?.ImageDescription?.value || ''),
      artist: cleanArtist(meta?.Artist?.value || ''),
      credit: cleanHtml(meta?.Credit?.value || ''),
      license: cleanHtml(meta?.LicenseShortName?.value || ''),
      licenseUrl: String(meta?.LicenseUrl?.value || ''),
      attributionRequired: String(meta?.AttributionRequired?.value || '') === 'true',
    };
  });
}

const searchCommons = stableCache(searchCommonsRaw, ['ci-commons-search-v1'], {
  revalidate: 60 * 60 * 24,
});

async function runLimited(tasks, concurrency = 4) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      try {
        results[i] = await tasks[i]();
      } catch (error) {
        console.error('Wikimedia search failed:', error?.message || error);
        results[i] = [];
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}

async function findImagesRaw(slug, label, phrasesKey, aliasesKey = '') {
  const phrases = phrasesKey.split('|').filter(Boolean);
  const ctx = imageMatchContext(phrases, aliasesKey.split('|').filter(Boolean));
  const candidates = [...new Set([label.toLowerCase(), ...phrases])];
  const diseases = candidates
    .filter(p => !(p.endsWith('s') && candidates.includes(p.slice(0, -1))))
    .slice(0, 2);
  const queries = diseases.flatMap(d => CONTEXTS.map(c => `"${d}" ${c}`.trim()));

  const batches = await runLimited(queries.map(q => () => searchCommons(q)));
  const best = new Map();

  for (const item of batches.flat()) {
    if (!item.thumbnail || !item.file) continue;
    if (DOCUMENT_FILE.test(item.title) || DOCUMENT_FILE.test(item.file)) continue;
    if (!IMAGE_FILE.test(item.file)) continue;
    const s = scoreImage(item, ctx);
    if (s == null) continue;
    const prev = best.get(item.file);
    if (!prev || s > prev.score) best.set(item.file, { ...item, score: s });
  }

  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, MAX_IMAGES)
    .map(({ score: _s, mime: _m, ...image }) => ({
      ...image,
      title: image.title.replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' '),
      description:
        image.description.length > 240 ? `${image.description.slice(0, 237)}…` : image.description,
    }));
}

const findImages = stableCache(findImagesRaw, ['ci-commons-images-v2'], {
  revalidate: 60 * 60 * 24,
});

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest();
  const resolved = resolveCancer(body.cancer);
  if (!resolved) return badRequest('Enter a specific cancer type.');

  try {
    const phrases = [...resolved.phrases, ...resolved.mesh.map(m => m.toLowerCase())];
    const images = await findImages(
      resolved.slug,
      resolved.label,
      phrases.join('|'),
      aliasesFor(resolved.id).join('|')
    );
    return json({
      cancer: { label: resolved.label, slug: resolved.slug },
      source: { name: 'Wikimedia Commons', url: 'https://commons.wikimedia.org' },
      images,
    });
  } catch (error) {
    return errorResponse(error, 'images');
  }
}
