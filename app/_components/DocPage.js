import { makeT } from '../../lib/i18n/index.js';

/* Layout for long-form pages: sticky contents list + readable prose column. */
export default function DocPage({ title, intro, updated, toc = [], locale = 'en', children }) {
  const t = makeT(locale);
  return (
    <>
      <section className="pageHead">
        <div className="pageHeadInner">
          <h1>{title}</h1>
          {intro && <p className="lede">{intro}</p>}
          {updated && <p className="updated">{t('doc.updated', { date: updated })}</p>}
        </div>
      </section>
      <div className="proseLayout">
        {toc.length > 0 ? (
          <nav className="toc" aria-label={t('doc.onThisPage')}>
            <h2>{t('doc.onThisPage')}</h2>
            <ol>
              {toc.map(item => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.label}</a>
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <div />
        )}
        <article className="prose">{children}</article>
      </div>
    </>
  );
}
