import GapAtlasClient from './GapAtlasClient';

export const metadata = {
  title: 'Research Gap Atlas',
  description:
    'Compare how a cancer’s PubMed literature divides across study designs and research themes with oncology overall. Every count links to the PubMed query behind it; signals are prompts for investigation, not proof of research gaps.',
  alternates: { canonical: '/research-gap-atlas' },
};

const SITE = 'https://www.cancer-insight.com';

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Cancer Insight Research Gap Atlas',
    url: `${SITE}/research-gap-atlas`,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any (web browser)',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description:
      'Educational tool comparing the share of a cancer’s PubMed records in each study design and research theme with the oncology-wide share (Method 3.0).',
    isPartOf: { '@id': `${SITE}/#website` },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Cancer Insight', item: `${SITE}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Research Gap Atlas',
        item: `${SITE}/research-gap-atlas`,
      },
    ],
  },
];

export default function ResearchGapAtlasPage() {
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
