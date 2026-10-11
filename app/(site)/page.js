import Link from 'next/link';
import CancerSearch from '../_components/CancerSearch';
import ForestPlot from '../_components/ForestPlot';
import { EXAMPLE_DATE, pancreaticExampleRows } from '../../lib/example';

export const metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  const rows = pancreaticExampleRows();
  const survival = rows.find(r => r.id === 'survivorship');

  return (
    <>
      <section className="homeHero" aria-labelledby="home-title">
        <div className="homeHeroInner">
          <div>
            <h1 id="home-title">Explore cancer research and see where every number comes from.</h1>
            <p className="lede">
              Cancer Insight is a free, independent research explorer. Search a cancer type to read
              recent papers, see how large and varied its PubMed literature is, compare treatment
              literature and map thinly covered research themes. Every count links to the PubMed
              search that reproduces it.
            </p>
            <CancerSearch autoFocus={false} />
            <p className="heroNote">
              Educational use only. Cancer Insight does not give medical advice or recommend
              treatments.
            </p>
          </div>

          <figure className="heroFigure">
            <p className="heroFigureTitle">Pancreatic cancer compared with oncology overall</p>
            <p className="heroFigureSub">
              Share of PubMed records in each category, as a multiple of the oncology-wide share
            </p>
            <ForestPlot
              rows={rows}
              compact
              idPrefix="hero"
              title="Pancreatic cancer research compared with oncology overall"
            />
            <figcaption>
              PubMed counts from {EXAMPLE_DATE}. Survivorship research is{' '}
              {(survival.share * 100).toFixed(2)}% of pancreatic cancer records against{' '}
              {(survival.baselineShare * 100).toFixed(2)}% across oncology. The hollow pediatric
              marker reflects that pancreatic cancer occurs mainly in adults. Select a row to open
              its PubMed search, or{' '}
              <Link href="/research-gap-atlas?cancer=pancreatic">build the full atlas</Link>.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="homeSection" aria-labelledby="tools-h">
        <h2 id="tools-h">Three ways into the literature</h2>
        <p className="lede">
          Each tool answers a different question, and none of them ranks treatments.
        </p>
        <ul className="toolList">
          <li>
            <h3>
              <Link href="/explore">Read the newest research</Link>
            </h3>
            <p>
              Recent papers for a cancer type, labelled by evidence type, with structured abstracts,
              free full-text links, retraction warnings and a note on why each record is included.
            </p>
          </li>
          <li>
            <h3>
              <Link href="/explore?cancer=breast&view=treatments">
                Compare treatment literature
              </Link>
            </h3>
            <p>
              How many PubMed records, trials and systematic reviews mention each treatment category
              — a measure of research attention, never of effectiveness.
            </p>
          </li>
          <li>
            <h3>
              <Link href="/research-gap-atlas">Map research coverage</Link>
            </h3>
            <p>
              The Research Gap Atlas shows which study designs and themes make up a smaller share of
              a cancer’s literature than of oncology overall, with the counts behind each one.
            </p>
          </li>
        </ul>
      </section>

      <section className="homeSection" aria-labelledby="sources-h">
        <h2 id="sources-h">Where the numbers come from</h2>
        <p className="lede">
          The same four steps sit behind every page, and the{' '}
          <Link href="/methodology">methodology</Link> documents each rule.
        </p>
        <ol className="pipeline">
          <li>
            <h3>Your search becomes a PubMed query</h3>
            <p>
              Cancer types map to MeSH headings and title/abstract phrases. The full query is shown
              wherever results appear.
            </p>
          </li>
          <li>
            <h3>Records are retrieved</h3>
            <p>
              Recent records come from the Cure Cancer With AI research feed. PubMed supplies
              metadata, Best Match results and counts.
            </p>
          </li>
          <li>
            <h3>Each record is checked</h3>
            <p>
              Relevance, duplicate and retraction checks run on every record. Evidence types come
              from PubMed publication types.
            </p>
          </li>
          <li>
            <h3>Every count links back</h3>
            <p>Select a number to run the identical search on PubMed and check it yourself.</p>
          </li>
        </ol>
      </section>

      <section className="homeSection" aria-labelledby="limits-h">
        <h2 id="limits-h">What Cancer Insight can and cannot tell you</h2>
        <div className="limitsGrid">
          <div>
            <h3>It can show</h3>
            <ul>
              <li>what has been published on a cancer, and where;</li>
              <li>how that literature divides across study designs and research themes;</li>
              <li>which records are free to read;</li>
              <li>the exact search behind every number.</li>
            </ul>
          </div>
          <div>
            <h3>It cannot show</h3>
            <ul>
              <li>which treatment works best, or is right for a person;</li>
              <li>whether a thinly covered theme is a real or important research gap;</li>
              <li>the quality or certainty of an individual study;</li>
              <li>anything about a specific diagnosis.</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
