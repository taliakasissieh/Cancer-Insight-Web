import './globals.css';

import Script from 'next/script';

export const metadata = {
  metadataBase: new URL('https://www.cancer-insight.com'),

  title: {
    default: 'Cancer Insight | Cancer Research Explorer',
    template: '%s | Cancer Insight',
  },

  description:
    'Cancer Insight is a cancer research explorer for discovering cancer research papers, PubMed abstracts, treatment research, research analytics, free full-text studies, and scientific cancer images.',

  keywords: [
    'Cancer Insight',
    'cancer insight',
    'Cancer Research Explorer',
    'cancer research',
    'cancer research papers',
    'PubMed cancer research',
    'cancer treatment research',
    'cancer treatments',
    'cancer studies',
    'oncology research',
    'PubMed',
    'medical research',
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
      'Explore cancer research papers, PubMed abstracts, cancer treatment research, research analytics, free full-text studies, and scientific cancer images with Cancer Insight.',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Cancer Insight | Cancer Research Explorer',
    description:
      'Explore cancer research papers, PubMed abstracts, treatment research, research analytics, and scientific cancer research sources with Cancer Insight.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y2XM3DY8ZT"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-Y2XM3DY8ZT');
          `}
        </Script>
      </body>
    </html>
  );
}
