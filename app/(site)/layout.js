import SiteHeader from '../_components/SiteHeader';
import SiteFooter from '../_components/SiteFooter';
import { HtmlLang, I18nProvider } from '../_components/I18n';

/* English pages (site root). Arabic pages live under app/ar with their own layout. */
export default function EnglishLayout({ children }) {
  return (
    <I18nProvider locale="en">
      <HtmlLang locale="en" />
      <SiteHeader />
      <main id="main" className="siteMain" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter locale="en" />
    </I18nProvider>
  );
}
