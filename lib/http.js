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
