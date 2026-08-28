import './globals.css';
import Script from 'next/script';

export const metadata = {
  metadataBase: new URL('https://www.cancer-insight.com'),

  title: {
    default: 'Cancer Insight | Cancer Research & PubMed Explorer',
    template: '%s | Cancer Insight',
  },

  description:
    'Explore cancer research papers, PubMed abstracts, treatment evidence, research analytics, free full-text studies, and scientific cancer images with Cancer Insight.',

  keywords: [
    'cancer research',
    'Cancer Insight',
    'PubMed cancer research',
    'cancer research papers',
    'cancer treatments',
    'cancer studies',
    'oncology research',
    'cancer treatment research',
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
    title: 'Cancer Insight | Cancer Research & PubMed Explorer',
    description:
      'Explore cancer research papers, PubMed abstracts, treatment evidence, research analytics, free full-text studies, and scientific cancer images.',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Cancer Insight | Cancer Research & PubMed Explorer',
    description:
      'Explore cancer research papers, PubMed abstracts, treatment evidence, research analytics, and scientific cancer research sources.',
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
