/*
  Cancer Insight — server cache that survives deployments.

  Next.js builds an unstable_cache key from the cached function's source text plus the key
  parts. The bundled source of a function changes whenever the build renames or reorders code,
  so every deployment silently emptied the PubMed, ClinicalTrials.gov and image caches and the
  first visitors after it (on the cancer map: about 460 PubMed counts) waited for everything
  to be fetched again.

  A bound function's source text is always "function () { [native code] }", so binding the
  function makes the key depend only on `keyParts` and the arguments. The flip side: when the
  shape or meaning of a cached result changes, bump the version in its key parts.
*/

import { unstable_cache } from 'next/cache';

export function stableCache(fn, keyParts, options) {
  return unstable_cache(fn.bind(null), keyParts, options);
}
