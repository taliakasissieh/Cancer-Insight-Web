import SiteHeader from './_components/SiteHeader';
import SiteFooter from './_components/SiteFooter';
import NotFoundView from './_components/NotFoundView';
import { I18nProvider } from './_components/I18n';

/* Root "not found" page (English). It renders outside the language layouts, so it brings its
   own header and footer. Arabic addresses use app/ar/not-found.js. */
export default function NotFound() {
  return (
    <I18nProvider locale="en">
      <SiteHeader />
      <main id="main" className="siteMain" tabIndex={-1}>
        <NotFoundView locale="en" />
      </main>
      <SiteFooter locale="en" />
    </I18nProvider>
  );
}
