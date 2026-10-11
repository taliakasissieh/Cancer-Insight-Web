'use client';

/* Small client for Cancer Insight API routes with an in-memory cache, so switching views
   never repeats a request that already succeeded. */

const cache = new Map();

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function postJson(path, body, { signal } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError(
      'Cancer Insight could not reach its server. Check your connection and try again.',
      0
    );
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new ApiError(data?.error || 'The request failed. Please try again.', res.status);
  }
  return data;
}

/** Cached request: identical (path, body) pairs share one in-flight promise and result. */
export function cachedPost(path, body) {
  const key = `${path}|${JSON.stringify(body)}`;
  if (!cache.has(key)) {
    const p = postJson(path, body).catch(error => {
      cache.delete(key);
      throw error;
    });
    cache.set(key, p);
  }
  return cache.get(key);
}

export function peekCache(path, body) {
  return cache.get(`${path}|${JSON.stringify(body)}`);
}
