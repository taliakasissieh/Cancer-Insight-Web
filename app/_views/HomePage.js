import Link from 'next/link';
import CancerSearch from '../_components/CancerSearch';
import ForestPlot from '../_components/ForestPlot';
import { EXAMPLE_DATE, EXAMPLE_DATE_ISO, pancreaticExampleRows } from '../../lib/example';
import { localePath, makeT } from '../../lib/i18n/index.js';
import { richText } from '../../lib/i18n/rich.js';
import { fmtDate, fmtShare } from '../../lib/format.js';

const TOOLS = [
  ['explore', '/explore'],
  ['trials', '/explore?cancer=breast&view=trials'],
  ['atlas', '/research-gap-atlas'],
  ['map', '/cancer-map'],
  ['burden', '/research-vs-burden'],
  ['profiles', '/cancers'],
];

export default function HomePage({ locale = 'en' }) {
  const t = makeT(locale);
  const path = p => localePath(locale, p);
  const rows = pancreaticExampleRows().map(r => ({
    ...r,
    label: r.id === 'rct' && locale !== 'ar' ? r.label : t(`measures.short.${r.id}`),
    short: r.id === 'rct' && locale !== 'ar' ? r.short : t(`measures.short.${r.id}`),
  }));
  const survival = rows.find(r => r.id === 'survivorship');
  const date = locale === 'ar' ? fmtDate(`${EXAMPLE_DATE_ISO}T12:00:00Z`, 'ar') : EXAMPLE_DATE;

  return (
    <>
      <section className="homeHero" aria-labelledby="home-title">
        <div className="homeHeroInner">
          <div>
            <h1 id="home-title">{t('home.title')}</h1>
            <p className="lede">{t('home.lede')}</p>
            <CancerSearch autoFocus={false} />
            <p className="heroNote">{t('home.heroNote')}</p>
          </div>

          <figure className="heroFigure">
            <p className="heroFigureTitle">{t('home.figTitle')}</p>
            <p className="heroFigureSub">{t('home.figSub')}</p>
            <ForestPlot rows={rows} compact idPrefix="hero" title={t('home.figPlotTitle')} />
            <figcaption>
              {richText(
                t('home.figCaption', {
                  date,
                  share: fmtShare(survival.share, 2, locale),
                  baseline: fmtShare(survival.baselineShare, 2, locale),
                }),
                {
                  link: (
                    <Link href={path('/research-gap-atlas?cancer=pancreatic')}>
                      {t('home.figLink')}
                    </Link>
                  ),
                }
              )}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="homeSection" aria-labelledby="tools-h">
        <h2 id="tools-h">{t('home.toolsTitle')}</h2>
        <p className="lede">{t('home.toolsLede')}</p>
        <ul className="toolList">
          {TOOLS.map(([id, href]) => (
            <li key={id}>
              <h3>
                <Link href={path(href)}>{t(`home.tools.${id}Title`)}</Link>
              </h3>
              <p>{t(`home.tools.${id}`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="homeSection" aria-labelledby="sources-h">
        <h2 id="sources-h">{t('home.sourcesTitle')}</h2>
        <p className="lede">
          {richText(t('home.sourcesLede'), {
            link: <Link href={path('/methodology')}>{t('home.methodologyLink')}</Link>,
          })}
        </p>
        <ol className="pipeline">
          {[1, 2, 3, 4].map(n => (
            <li key={n}>
              <h3>{t(`home.step${n}Title`)}</h3>
              <p>{t(`home.step${n}`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="homeSection" aria-labelledby="limits-h">
        <h2 id="limits-h">{t('home.limitsTitle')}</h2>
        <div className="limitsGrid">
          <div>
            <h3>{t('home.canTitle')}</h3>
            <ul>
              {[1, 2, 3, 4].map(n => (
                <li key={n}>{t(`home.can${n}`)}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{t('home.cannotTitle')}</h3>
            <ul>
              {[1, 2, 3, 4].map(n => (
                <li key={n}>{t(`home.cannot${n}`)}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="homeSection homeData" aria-labelledby="data-h">
        <div className="dataBand">
          <div>
            <h2 id="data-h">{t('home.dataTitle')}</h2>
            <p>{t('home.data')}</p>
          </div>
          <Link className="btn btnSecondary" href={path('/data')}>
            {t('home.dataLink')}
          </Link>
        </div>
      </section>
    </>
  );
}
