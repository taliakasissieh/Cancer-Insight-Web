import { languageAlternates, localePath, makeT } from '../../lib/i18n/index.js';
import { fmtDate } from '../../lib/format.js';

const PATH = '/data';

const ENDPOINTS = [
  ['/api/footprint?cancer={cancer}', 'footprint', '/api/footprint?cancer=pancreatic'],
  ['/api/gaps?cancer={cancer}', 'gaps', '/api/gaps?cancer=pancreatic'],
  ['/api/map', 'mapIndex', '/api/map'],
  ['/api/map?cancer={id}', 'mapRow', '/api/map?cancer=breast'],
  ['/api/trials?cancer={cancer}', 'trials', '/api/trials?cancer=mesothelioma'],
  ['/api/trials?cancer={cancer}&format=csv', 'trialsCsv', '/api/trials?cancer=mesothelioma&format=csv'],
  ['/api/burden', 'burden', '/api/burden'],
  ['/api/burden?format=csv', 'burdenCsv', '/api/burden?format=csv'],
  ['/api/retractions?cancer={cancer}', 'retractions', '/api/retractions?cancer=breast'],
  [
    '/api/treatment?cancer={cancer}&treatment={treatment}',
    'treatment',
    '/api/treatment?cancer=lung&treatment=immunotherapy',
  ],
];

export function dataMetadata(locale) {
  const t = makeT(locale);
  return {
    title: t('data.metaTitle'),
    description: t('data.metaDescription'),
    alternates: { canonical: localePath(locale, PATH), languages: languageAlternates(PATH) },
  };
}

export default function DataPage({ locale = 'en' }) {
  const t = makeT(locale);
  const today = new Date();
  return (
    <>
      <section className="pageHead" aria-labelledby="data-title">
        <div className="pageHeadInner">
          <h1 id="data-title">{t('data.title')}</h1>
          <p className="lede">{t('data.lede')}</p>
        </div>
      </section>
      <div className="viewBody stack">
        <section className="panel" aria-labelledby="endpoints-h">
          <h2 id="endpoints-h">{t('data.endpointsTitle')}</h2>
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th scope="col">{t('data.colAddress')}</th>
                  <th scope="col">{t('data.colReturns')}</th>
                  <th scope="col">{t('data.colExample')}</th>
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map(([address, key, example]) => (
                  <tr key={address}>
                    <th scope="row">
                      <code dir="ltr" className="mono">
                        {address}
                      </code>
                    </th>
                    <td>{t(`data.${key}`)}</td>
                    <td>
                      <a href={example} target="_blank" rel="noopener noreferrer" dir="ltr">
                        {example.replace('/api/', '')}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            {t('data.cancerParam')}
          </p>
        </section>

        <section className="panel" aria-labelledby="use-h">
          <h2 id="use-h">{t('data.useTitle')}</h2>
          <ul className="cautionList">
            <li>{t('data.use1')}</li>
            <li>{t('data.use2')}</li>
            <li>{t('data.use3')}</li>
          </ul>
        </section>

        <section className="panel" aria-labelledby="cite-h">
          <h2 id="cite-h">{t('data.citeTitle')}</h2>
          <p className="citeBox">
            {t('data.cite', {
              year: String(today.getUTCFullYear()),
              page: t('data.citeExamplePage'),
              path: localePath(locale, '/research-vs-burden'),
              date: fmtDate(today.toISOString(), locale),
            })}
          </p>
        </section>

        <section className="panel" aria-labelledby="terms-h">
          <h2 id="terms-h">{t('data.termsTitle')}</h2>
          <ul className="cautionList">
            <li>{t('data.termsPubmed')}</li>
            <li>{t('data.termsCtgov')}</li>
            <li>{t('data.termsGlobocan')}</li>
            <li>{t('data.termsCommons')}</li>
          </ul>
          <p className="small muted" style={{ marginTop: 12 }}>
            {t('data.noAdvice')}
          </p>
        </section>
      </div>
    </>
  );
}
