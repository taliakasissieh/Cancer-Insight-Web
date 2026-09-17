import './globals.css';

import Script from 'next/script';

export const metadata = {
  metadataBase: new URL('https://www.cancer-insight.com'),

  title: {
    default: 'Cancer Insight | Cancer Research Explorer',
    template: '%s | Cancer Insight',
  },

  description:
    'Cancer Insight is an independent educational cancer research explorer at cancer-insight.com for discovering cancer research papers, PubMed abstracts, cancer treatment studies, oncology research, treatment evidence, research analytics, free full-text studies, and scientific cancer images.',

  keywords: [
    'Cancer Insight',
    'cancer insight',
    'cancer-insight.com',
    'Cancer Research Explorer',
    'cancer research',
    'cancer research papers',
    'PubMed cancer research',
    'cancer treatment research',
    'cancer treatments',
    'cancer studies',
    'oncology research',
    'medical research',
    'PubMed',
    'PubMed Central',
    'cancer research database',
    'cancer research articles',
    'cancer research studies',
    'cancer treatment studies',
    'oncology studies',
    'cancer evidence',
    'cancer treatment evidence',
    'cancer research analytics',
    'cancer research explorer',
    'cancer scientific papers',
    'cancer medical research',
    'free cancer research papers',
    'open access cancer research',
    'cancer research resources',
  ],

  authors: [
    {
      name: 'Cancer Insight',
    },
  ],

  creator: 'Cancer Insight',
  publisher: 'Cancer Insight',

  alternates: {
    canonical: '/',
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  openGraph: {
    type: 'website',
    url: 'https://www.cancer-insight.com',
    siteName: 'Cancer Insight',
    title: 'Cancer Insight | Cancer Research Explorer',

    description:
      'Cancer Insight is an independent educational cancer research explorer for discovering cancer research papers, PubMed abstracts, treatment studies, oncology research, research analytics, and scientific cancer resources.',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Cancer Insight | Cancer Research Explorer',

    description:
      'Explore cancer research papers, PubMed abstracts, cancer treatment studies, oncology research, treatment evidence, research analytics, and scientific cancer resources with Cancer Insight.',
  },
};

export default function RootLayout({ children }) {
  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://www.cancer-insight.com/#website',

    name: 'Cancer Insight',

    alternateName: [
      'Cancer Insight Research Explorer',
      'Cancer Insight Cancer Research Explorer',
    ],

    url: 'https://www.cancer-insight.com/',
  };

  const organizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://www.cancer-insight.com/#organization',

    name: 'Cancer Insight',

    alternateName: 'Cancer Insight Research Explorer',

    url: 'https://www.cancer-insight.com/',

    logo: 'https://www.cancer-insight.com/icon.png',

    description:
      'Cancer Insight is an independent educational cancer research explorer that helps users discover scientific cancer research papers, PubMed abstracts, treatment studies, research analytics, free full-text research, and scientific cancer resources.',

    email: 'cancerinsight.contact@gmail.com',
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />

        {children}

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y2XM3DY8ZT"
          strategy="afterInteractive"
        />

        <Script
          id="google-analytics"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];

            function gtag() {
              dataLayer.push(arguments);
            }

            gtag('js', new Date());

            gtag('config', 'G-Y2XM3DY8ZT');
          `}
        </Script>
      </body>
    </html>
  );
}
