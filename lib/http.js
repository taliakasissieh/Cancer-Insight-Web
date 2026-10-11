/*
  Cancer Insight — small helpers shared by API routes.
*/

import { NextResponse } from 'next/server';

const MAX_BODY = 4000;

/** Parse a small JSON body; returns {} for an empty body and null for invalid input. */
export async function readJson(request) {
  try {
    const text = await request.text();
    if (!text) return {};
    if (text.length > MAX_BODY) return null;
    const value = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

export function badRequest(message = 'Invalid request.') {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Convert an error into a response without leaking internal details. */
export function errorResponse(error, context) {
  if (error?.userFacing) {
    const status = Number(error.status) >= 400 && Number(error.status) < 600 ? error.status : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  console.error(`Cancer Insight ${context} error:`, error);
  return NextResponse.json(
    { error: 'Something went wrong while retrieving research data. Please try again.' },
    { status: 500 }
  );
}

export function json(data, init) {
  return NextResponse.json(data, init);
}

/* Open-data GET responses may be cached by the CDN; the underlying counts are cached for a day. */
const PUBLIC_CACHE = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

export function publicJson(data) {
  return NextResponse.json(data, {
    headers: { 'Cache-Control': PUBLIC_CACHE, 'Access-Control-Allow-Origin': '*' },
  });
}

export function csvResponse(text, filename) {
  return new NextResponse(text, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename.replace(/[^a-z0-9._-]/gi, '_')}"`,
      'Cache-Control': PUBLIC_CACHE,
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/** Read ?cancer= (and friends) from a GET request with the same limits as POST bodies. */
export function queryParams(request) {
  const url = new URL(request.url);
  const out = {};
  for (const [k, v] of url.searchParams) {
    if (k.length <= 30 && v.length <= 200) out[k] = v;
  }
  return out;
}
