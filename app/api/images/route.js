/*
  Cancer Insight — scientific images from Wikimedia Commons.

  Previous version: up to 48 sequential, uncached Commons searches (≈8 s per request).
  Now: ≤10 searches run with limited concurrency and cached for 24 h; filtering uses
  word boundaries (so "thrombus" and "prevention" are no longer rejected); licence links and
  attribution are returned so the gallery can meet CC BY / BY-SA attribution requirements.
*/

import { unstable_cache } from 'next/cache';
import { resolveCancer } from '../../../lib/queries';
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

function words(list) {
  return new RegExp(`\\b(?:${list.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i');
}

const VISUAL_TERMS = words([
  'histology',
  'histopathology',
  'histopathologic',
  'pathology',
  'micrograph',
  'microscopy',
  'microscopic',
  'biopsy',
  'specimen',
  'cytology',
  'immunohistochemistry',
  'h&e',
  'hematoxylin',
  'tumor',
  'tumour',
  'neoplasm',
  'lesion',
  'carcinoma',
  'adenocarcinoma',
  'radiograph',
  'x-ray',
  'computed tomography',
  'ct',
  'mri',
  'magnetic resonance',
  'pet',
  'mammogram',
  'mammography',
  'ultrasound',
  'ultrasonography',
  'gross pathology',
  'diagram',
  'schematic',
  'illustration',
  'metastasis',
  'metastatic',
  'immunofluorescence',
  'segmentation',
]);

const STRONG_TERMS = words([
  'histology',
  'histopathology',
  'micrograph',
  'microscopy',
  'biopsy',
  'immunohistochemistry',
  'computed tomography',
  'ct',
  'mri',
  'magnetic resonance',
  'ultrasonography',
  'mammography',
  'gross pathology',
  'segmentation',
]);

const BLOCKED = words([
  'bus',
  'autobus',
  'vehicle',
  'street',
  'campaign',
  'awareness',
  'ribbon',
  'fundraiser',
  'fundraising',
  'charity',
  'poster',
  'advertisement',
  'logo',
  'mascot',
  'marathon',
  't-shirt',
  'stamp',
  'coin',
  'billboard',
  'military',
  'soldier',
  'army',
  'yearbook',
  'newspaper',
  'portrait of',
  'annual report',
  'book scan',
  'scanned page',
  'title page',
  'table of contents',
  'internet archive',
  'archive.org',
  'digitized by',
]);

const DOCUMENT_FILE = /\.(pdf|djvu|djv|docx?|pptx?|xlsx?|txt|rtf|od[tsp])(?:$|\?)/i;
const IMAGE_FILE = /\.(jpe?g|png|gif|webp|tiff?|svg)(?:$|\?)/i;

function score(item, phrases) {
  const titleL = item.title.toLowerCase();
  const all = `${titleL} ${item.description.toLowerCase()} ${item.credit.toLowerCase()}`;

  const diseaseRe = words(phrases);
  const inTitle = diseaseRe.test(titleL);
  const inText = diseaseRe.test(all);
  if (!inText) return null;
  if (!VISUAL_TERMS.test(all)) return null;
  if (BLOCKED.test(all)) return null;
  if (!inTitle && !STRONG_TERMS.test(all)) return null;

  let s = inTitle ? 14 : 6;
  if (STRONG_TERMS.test(all)) s += 8;
  if (/\b(histopathology|micrograph|histology)\b/i.test(all)) s += 4;
  if (/\b(ct|mri|computed tomography|magnetic resonance)\b/i.test(all)) s += 3;
  if (item.license) s += 1;
  return s;
}

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

const searchCommons = unstable_cache(searchCommonsRaw, ['ci-commons-search-v1'], {
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

async function findImagesRaw(slug, label, phrasesKey) {
  const phrases = phrasesKey.split('|').filter(Boolean);
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
    const s = score(item, phrases);
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
      description: image.description.length > 240 ? `${image.description.slice(0, 237)}…` : image.description,
    }));
}

const findImages = unstable_cache(findImagesRaw, ['ci-commons-images-v1'], {
  revalidate: 60 * 60 * 24,
});

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest();
  const resolved = resolveCancer(body.cancer);
  if (!resolved) return badRequest('Enter a specific cancer type.');

  try {
    const phrases = [...resolved.phrases, ...resolved.mesh.map(m => m.toLowerCase())];
    const images = await findImages(resolved.slug, resolved.label, phrases.join('|'));
    return json({
      cancer: { label: resolved.label, slug: resolved.slug },
      source: { name: 'Wikimedia Commons', url: 'https://commons.wikimedia.org' },
      images,
    });
  } catch (error) {
    return errorResponse(error, 'images');
  }
}
