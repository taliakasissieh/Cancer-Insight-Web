import GapAtlasClient from '../_components/atlas/GapAtlasClient';
import { languageAlternates, localePath, makeT } from '../../lib/i18n/index.js';

const SITE = 'https://www.cancer-insight.com';
const PATH = '/research-gap-atlas';

export function atlasMetadata(locale) {
  const t = makeT(locale);
  return {
    title: t('atlas.metaTitle'),
    description: t('atlas.metaDescription'),
    alternates: { canonical: localePath(locale, PATH), languages: languageAlternates(PATH) },
  };
}

export default function AtlasPage({ locale = 'en' }) {
  const t = makeT(locale);
  const url = `${SITE}${localePath(locale, PATH)}`;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: `Cancer Insight ${t('atlas.metaTitle')}`,
      url,
      inLanguage: locale,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any (web browser)',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: t('atlas.metaDescription'),
      isPartOf: { '@id': `${SITE}/#website` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Cancer Insight', item: `${SITE}${localePath(locale, '/')}` },
        { '@type': 'ListItem', position: 2, name: t('atlas.metaTitle'), item: url },
      ],
    },
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <GapAtlasClient />
    </>
  );
}
