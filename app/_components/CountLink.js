'use client';

import { useI18n } from './I18n';

const SITES = {
  pubmed: { name: 'PubMed' },
  ctgov: { name: 'ClinicalTrials.gov' },
};

/** A record count that opens the exact search that produced it. */
export default function CountLink({ count, url, children, label, site = 'pubmed' }) {
  const { t, num } = useI18n();
  const siteName = SITES[site]?.name || site;
  const text = children ?? num(count);
  if (count == null) return <span className="num muted">{t('count.unavailable')}</span>;
  if (!url) return <span className="num">{text}</span>;
  return (
    <a
      className="countLink"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={label || t('count.open', { site: siteName })}
    >
      {text}
      <span className="visuallyHidden"> {t('count.newTab', { site: siteName })}</span>
    </a>
  );
}
