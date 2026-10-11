import CancerMap from '../_components/map/CancerMap';
import { languageAlternates, localePath, makeT } from '../../lib/i18n/index.js';
import { ATLAS_METHOD_VERSION } from '../../lib/queries.js';

const PATH = '/cancer-map';

export function mapMetadata(locale) {
  const t = makeT(locale);
  return {
    title: t('map.metaTitle'),
    description: t('map.metaDescription'),
    alternates: { canonical: localePath(locale, PATH), languages: languageAlternates(PATH) },
  };
}

export default function MapPage({ locale = 'en' }) {
  const t = makeT(locale);
  return (
    <>
      <section className="pageHead" aria-labelledby="map-title">
        <div className="pageHeadInner">
          <p className="eyebrow">{t('map.eyebrow', { version: ATLAS_METHOD_VERSION })}</p>
          <h1 id="map-title">{t('map.title')}</h1>
          <p className="lede">{t('map.lede')}</p>
          <p className="notice small" style={{ maxWidth: '78ch', margin: 0 }}>
            {t('map.promise')}
          </p>
        </div>
      </section>
      <div className="viewBody mapBody">
        <CancerMap />
      </div>
    </>
  );
}
