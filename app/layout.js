import './globals.css';

import { Source_Code_Pro, Source_Sans_3, Source_Serif_4 } from 'next/font/google';
import SiteHeader from './_components/SiteHeader';
import SiteFooter from './_components/SiteFooter';
import Analytics from './_components/Analytics';

const serif = Source_Serif_4({ subsets: ['latin'], display: 'swap', variable: '--font-serif' });
const sans = Source_Sans_3({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });
const mono = Source_Code_Pro({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });

const SITE = 'https://www.cancer-insight.com';

export const metadata = {
  metadataBase: new URL(SITE),
  applicationName: 'Cancer Insight',
  title: {
    default: 'Cancer Insight — explore cancer research with its evidence trail',
    template: '%s | Cancer Insight',
  },
  description:
    'Cancer Insight is an independent, educational explorer of cancer research. Search PubMed-indexed papers, compare the literature on treatments and map research coverage — with every count linked to the PubMed query that reproduces it.',
  keywords: [
    'cancer research',
    'PubMed',
    'cancer research papers',
    'cancer treatment research',
    'research gap',
    'evidence',
    'oncology literature',
  ],
  authors: [{ name: 'Cancer Insight' }],
  creator: 'Cancer Insight',
  publisher: 'Cancer Insight',
  category: 'education',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    siteName: 'Cancer Insight',
    url: SITE,
    title: 'Cancer Insight — explore cancer research with its evidence trail',
    description:
      'Search cancer research papers, compare treatment literature and map research coverage. Every number links to the PubMed query behind it.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cancer Insight — explore cancer research with its evidence trail',
    description:
      'Search cancer research papers, compare treatment literature and map research coverage. Every number links to the PubMed query behind it.',
  },
};

export const viewport = {
  themeColor: '#12304A',
  width: 'device-width',
  initialScale: 1,
};

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    name: 'Cancer Insight',
    url: `${SITE}/`,
    inLanguage: 'en',
    description:
      'An independent, educational explorer of cancer research literature with transparent, reproducible PubMed queries.',
    publisher: { '@id': `${SITE}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/explore?cancer={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: 'Cancer Insight',
    url: `${SITE}/`,
    logo: { '@type': 'ImageObject', url: `${SITE}/icon.png` },
    email: 'cancerinsight.contact@gmail.com',
    description:
      'Independent educational project that helps people explore cancer research while keeping the original evidence visible.',
  },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <SiteHeader />
        <main id="main" className="siteMain" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
