'use client';

/* Google Analytics events. No-ops when analytics is not loaded (e.g. Global Privacy Control). */
export function track(name, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}
