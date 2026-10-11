import BurdenView from '../_components/burden/BurdenView';
import { languageAlternates, localePath, makeT } from '../../lib/i18n/index.js';
import { BURDEN_MAP, researchYears } from '../../lib/burden.js';

const PATH = '/research-vs-burden';

export function burdenMetadata(locale) {
  const t = makeT(locale);
  return {
    title: t('burden.metaTitle'),
    description: t('burden.metaDescription'),
    alternates: { canonical: localePath(locale, PATH), languages: languageAlternates(PATH) },
  };
}

export default function BurdenPage({ locale = 'en' }) {
  const t = makeT(locale);
  const years = researchYears();
  return (
    <>
      <section className="pageHead" aria-labelledby="burden-title">
        <div className="pageHeadInner">
          <p className="eyebrow">{t('burden.eyebrow')}</p>
          <h1 id="burden-title">{t('burden.title')}</h1>
          <p className="lede">
            {t('burden.lede', { from: String(years.start), to: String(years.end) })}
          </p>
          <p className="notice small" style={{ maxWidth: '78ch', margin: 0 }}>
            {t('burden.notJudgement')}
          </p>
        </div>
      </section>
      <div className="viewBody">
        <BurdenView cancerCount={Object.keys(BURDEN_MAP).length} />
      </div>
    </>
  );
}
