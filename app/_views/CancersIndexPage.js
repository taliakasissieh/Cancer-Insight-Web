import Link from 'next/link';
import { CANCERS } from '../../lib/queries.js';
import { languageAlternates, localePath, makeT } from '../../lib/i18n/index.js';
import { burdenFor } from '../../lib/burden.js';
import { fmtInt, fmtShare } from '../../lib/format.js';

const PATH = '/cancers';

export function cancersIndexMetadata(locale) {
  const t = makeT(locale);
  const n = Object.keys(CANCERS).length;
  return {
    title: t('cancersIndex.metaTitle'),
    description: t('cancersIndex.metaDescription', { n }),
    alternates: { canonical: localePath(locale, PATH), languages: languageAlternates(PATH) },
  };
}

export default function CancersIndexPage({ locale = 'en' }) {
  const t = makeT(locale);
  const ids = Object.keys(CANCERS);
  const rows = ids
    .map(id => ({ id, name: t(`cancers.${id}`), burden: burdenFor(id) }))
    .sort((a, b) => {
      const d = (b.burden?.deaths ?? -1) - (a.burden?.deaths ?? -1);
      return d || a.name.localeCompare(b.name, locale);
    });
  return (
    <>
      <section className="pageHead" aria-labelledby="cancers-title">
        <div className="pageHeadInner">
          <h1 id="cancers-title">{t('cancersIndex.title')}</h1>
          <p className="lede">{t('cancersIndex.lede', { n: ids.length })}</p>
          <p className="small muted" style={{ margin: 0 }}>
            {t('cancersIndex.order')}
          </p>
        </div>
      </section>
      <div className="viewBody">
        <ul className="cancerGrid">
          {rows.map(r => (
            <li key={r.id}>
              <Link href={localePath(locale, `/cancers/${r.id}`)} className="cancerCard">
                <strong>{r.name}</strong>
                {r.burden ? (
                  <>
                    <span>{t('cancersIndex.deaths', { n: fmtInt(r.burden.deaths, locale) })}</span>
                    <span className="cancerBar" aria-hidden="true">
                      <i style={{ width: `${Math.max(2, (r.burden.deathShare / 0.2) * 100)}%` }} />
                    </span>
                    <span className="muted small">
                      {t('cancersIndex.cases', { n: fmtInt(r.burden.cases, locale) })} ·{' '}
                      {fmtShare(r.burden.deathShare, undefined, locale)}
                    </span>
                  </>
                ) : (
                  <span className="muted small">{t('cancersIndex.noBurden')}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
