import HomePage from '../_views/HomePage';
import { languageAlternates } from '../../lib/i18n/index.js';

export const metadata = {
  alternates: { canonical: '/', languages: languageAlternates('/') },
};

export default function Page() {
  return <HomePage locale="en" />;
}
