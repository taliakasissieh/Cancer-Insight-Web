import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProfileView from '../_components/profile/ProfileView';
import { CANCERS } from '../../lib/queries.js';
import { languageAlternates, localePath, makeT } from '../../lib/i18n/index.js';
import { burdenFor, GLOBOCAN } from '../../lib/burden.js';
import { fmtInt } from '../../lib/format.js';

const SITE = 'https://www.cancer-insight.com';

export const PROFILE_IDS = Object.keys(CANCERS);

export function profileMetadata(locale, id) {
  if (!CANCERS[id]) return {};
  const t = makeT(locale);
  const cancer = t(`cancers.${id}`);
  const path = `/cancers/${id}`;
  return {
    title: t('profile.metaTitle', { cancer }),
    description: t('profile.metaDescription', { cancer }),
    alternates: { canonical: localePath(locale, path), languages: languageAlternates(path) },
  };
}

export default function ProfilePage({ locale = 'en', id }) {
  if (!CANCERS[id]) notFound();
  const t = makeT(locale);
  const cancer = t(`cancers.${id}`);
  const b = burdenFor(id);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('profile.metaTitle', { cancer }),
    url: `${SITE}${localePath(locale, `/cancers/${id}`)}`,
    inLanguage: locale,
    about: { '@type': 'MedicalCondition', name: CANCERS[id].label },
    isPartOf: { '@id': `${SITE}/#website` },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="pageHead" aria-labelledby="profile-title">
        <div className="pageHeadInner">
          <p className="eyebrow">
            <Link href={localePath(locale, '/cancers')}>{t('profile.eyebrow')}</Link>
          </p>
          <h1 id="profile-title">{cancer}</h1>
          <p className="lede">{t('profile.lede', { cancer: lowerName(cancer, locale) })}</p>
          {b && (
            <p className="small muted" style={{ margin: 0 }}>
              {t('cancersIndex.deaths', { n: fmtInt(b.deaths, locale) })} ·{' '}
              {t('cancersIndex.cases', { n: fmtInt(b.cases, locale) })} — {GLOBOCAN.edition}
            </p>
          )}
        </div>
      </section>
      <div className="viewBody">
        <ProfileView id={id} />
      </div>
    </>
  );
}

function lowerName(name, locale) {
  if (locale === 'ar') return name;
  return /^[A-Z][a-z]/.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name;
}
