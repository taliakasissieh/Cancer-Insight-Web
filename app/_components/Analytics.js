'use client';

import { useEffect } from 'react';

const GA_ID = 'G-Y2XM3DY8ZT';

/* Google Analytics, loaded only when the browser has not signalled an opt-out
   (Global Privacy Control or Do Not Track). */
export default function Analytics() {
  useEffect(() => {
    const nav = window.navigator || {};
    const optedOut =
      nav.globalPrivacyControl === true || nav.doNotTrack === '1' || window.doNotTrack === '1';
    if (optedOut || window.gtag) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });

    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  }, []);

  return null;
}
