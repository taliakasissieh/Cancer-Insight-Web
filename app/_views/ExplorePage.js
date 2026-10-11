import Explorer from '../_components/explore/Explorer';
import { languageAlternates, localePath, makeT } from '../../lib/i18n/index.js';

const VIEWS = ['overview', 'papers', 'treatments', 'trials', 'images', 'saved'];
const PATH = '/explore';

export function exploreMetadata(locale) {
  const t = makeT(locale);
  return {
    title: t('explorePage.metaTitle'),
    description: t('explorePage.metaDescription'),
    alternates: { canonical: localePath(locale, PATH), languages: languageAlternates(PATH) },
  };
}

export async function ExplorePage({ searchParams }) {
  const sp = (await searchParams) || {};
  const cancer = typeof sp.cancer === 'string' ? sp.cancer.slice(0, 60) : '';
  const view = VIEWS.includes(sp.view) ? sp.view : 'overview';
  const treatment = typeof sp.treatment === 'string' ? sp.treatment.slice(0, 50) : '';
  return <Explorer initialCancer={cancer} initialView={view} initialTreatment={treatment} />;
}
