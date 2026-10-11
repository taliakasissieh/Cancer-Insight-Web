/* Layout for long-form pages: sticky contents list + readable prose column. */
export default function DocPage({ title, intro, updated, toc = [], children }) {
  return (
    <>
      <section className="pageHead">
        <div className="pageHeadInner">
          <h1>{title}</h1>
          {intro && <p className="lede">{intro}</p>}
          {updated && <p className="updated">Last updated {updated}</p>}
        </div>
      </section>
      <div className="proseLayout">
        {toc.length > 0 ? (
          <nav className="toc" aria-label="On this page">
            <h2>On this page</h2>
            <ol>
              {toc.map(t => (
                <li key={t.id}>
                  <a href={`#${t.id}`}>{t.label}</a>
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
