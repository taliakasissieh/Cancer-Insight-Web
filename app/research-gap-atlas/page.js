import GapAtlasClient from './GapAtlasClient';

export const metadata = {
  title: 'Cancer Research Gap Atlas | Cancer Insight',
  description:
    'Explore transparent low-coverage signals in cancer research literature using Cancer Insight Research Gap Atlas.',
  alternates: {
    canonical: '/research-gap-atlas',
  },
};

export default function ResearchGapAtlasPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Cancer Research Gap Atlas',
    url: 'https://www.cancer-insight.com/research-gap-atlas',
    description:
      'An educational research tool that identifies transparent low-coverage signals inside retrieved cancer research literature.',
    isPartOf: {
      '@id': 'https://www.cancer-insight.com/#website',
    },
    about: {
      '@type': 'Thing',
      name: 'Cancer research literature',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <GapAtlasClient />
    </>
  );
}
