import { IBM_Plex_Sans_Arabic, Noto_Naskh_Arabic } from 'next/font/google';
import SiteHeader from '../_components/SiteHeader';
import SiteFooter from '../_components/SiteFooter';
import { HtmlLang, I18nProvider } from '../_components/I18n';

const arabicSans = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-arabic',
});
const arabicSerif = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-arabic-serif',
});

export const metadata = {
  title: {
    default: 'Cancer Insight — استكشف أبحاث السرطان مع مصدر كل رقم',
    template: '%s | Cancer Insight',
  },
  description:
    'Cancer Insight مستكشف تعليمي مستقل لأبحاث السرطان باللغة العربية: ابحث في الأوراق المفهرسة في PubMed، وتابع التجارب السريرية، وقارن حجم البحث بعبء المرض عالميًا — وكل رقم مرتبط بعملية البحث التي تعيد إنتاجه.',
  openGraph: {
    locale: 'ar_AR',
    alternateLocale: ['en_US'],
    title: 'Cancer Insight — استكشف أبحاث السرطان مع مصدر كل رقم',
    description:
      'ابحث في أبحاث السرطان، وتابع التجارب السريرية، وقارن البحث بعبء المرض. كل رقم مرتبط بمصدره.',
  },
};

/* Sets <html lang dir> before first paint; HtmlLang keeps it right after client navigation. */
const SET_LANG = "document.documentElement.lang='ar';document.documentElement.dir='rtl';";

export default function ArabicLayout({ children }) {
  return (
    <div lang="ar" dir="rtl" className={`localeRoot localeAr ${arabicSans.variable} ${arabicSerif.variable}`}>
      <script dangerouslySetInnerHTML={{ __html: SET_LANG }} />
      <I18nProvider locale="ar">
        <HtmlLang locale="ar" />
        <SiteHeader />
        <main id="main" className="siteMain" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter locale="ar" />
      </I18nProvider>
    </div>
  );
}
