import Link from 'next/link';
import Logo from './Logo';
import { localePath, makeT } from '../../lib/i18n/index.js';

const GROUPS = [
  {
    key: 'footer.tools',
    links: [
      ['/explore', 'footer.exploreResearch'],
      ['/cancers', 'footer.cancers'],
      ['/research-gap-atlas', 'footer.atlas'],
      ['/cancer-map', 'footer.map'],
      ['/research-vs-burden', 'footer.burden'],
      ['/explore?view=saved', 'footer.savedPapers'],
    ],
  },
  {
    key: 'footer.learn',
    links: [
      ['/methodology', 'footer.methodology'],
      ['/data', 'footer.data'],
      ['/faq', 'footer.faq'],
      ['/about', 'footer.about'],
    ],
  },
  {
    key: 'footer.site',
    links: [
      ['/contact', 'footer.contact'],
      ['/privacy-policy', 'footer.privacy'],
      ['/terms', 'footer.terms'],
    ],
  },
];

export default function SiteFooter({ locale = 'en' }) {
  const t = makeT(locale);
  const path = p => localePath(locale, p);
  return (
    <footer className="siteFooter">
      <div className="siteFooterInner">
        <div className="footerBrand">
          <Link href={path('/')} className="brand">
            <Logo size={26} />
            <span className="brandName">{t('meta.siteName')}</span>
          </Link>
          <p>{t('footer.blurb')}</p>
        </div>

        <nav className="footerNav" aria-label={t('footer.label')}>
          {GROUPS.map(group => (
            <div key={group.key}>
              <h2>{t(group.key)}</h2>
              <ul>
                {group.links.map(([href, key]) => (
                  <li key={href}>
                    <Link href={path(href)}>{t(key)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="footerLegal">
        <p>
          <strong>{t('common.educationalOnly')}</strong> {t('footer.legal')}
        </p>
        <p>{t('footer.dataSources')}</p>
      </div>
    </footer>
  );
}
