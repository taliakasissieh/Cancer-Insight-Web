import Link from 'next/link';
import DocPage from '../../_components/DocPage';
import {
  ATLAS_DESIGN_IDS,
  ATLAS_METHOD_VERSION,
  ATLAS_THRESHOLDS,
  BASELINE_TERM,
  CANCERS,
  DESIGN_BY_ID,
  DESIGNS,
  FREE_FULL_TEXT,
  THEMES,
  TREATMENTS,
  resolveCancer,
} from '../../../lib/queries';

export const metadata = {
  title: 'Methodology',
  description:
    'How Cancer Insight retrieves, checks, classifies and counts cancer research — including the exact PubMed queries and the Research Gap Atlas Method 3.0.',
  alternates: { canonical: '/methodology' },
};

const TOC = [
  { id: 'purpose', label: 'Purpose' },
  { id: 'sources', label: 'Sources' },
  { id: 'queries', label: 'From search to PubMed query' },
  { id: 'recent', label: 'Recent research' },
  { id: 'evidence-types', label: 'Evidence types' },
  { id: 'footprint', label: 'PubMed counts' },
  { id: 'treatments', label: 'Treatment literature' },
  { id: 'gap-atlas', label: 'Research Gap Atlas' },
  { id: 'images', label: 'Images' },
  { id: 'exports', label: 'Exports and saved papers' },
  { id: 'reproducibility', label: 'Reproducibility' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'versions', label: 'Version history' },
];

const FEED_CANCERS = Object.entries(CANCERS)
  .filter(([id, c]) => c.feed === id)
  .map(([, c]) => c.label.charAt(0).toLowerCase() + c.label.slice(1));

const EVIDENCE_ROWS = [
  ['Meta-analysis', 'Meta-Analysis', 'Evidence synthesis'],
  ['Systematic review', 'Systematic Review', 'Evidence synthesis'],
  [
    'Randomized controlled trial',
    'Randomized Controlled Trial (with phase when indexed)',
    'Primary research',
  ],
  [
    'Clinical trial',
    'Clinical Trial; Phase I–IV; Controlled, Pragmatic, Equivalence or Adaptive Clinical Trial',
    'Primary research',
  ],
  ['Guideline', 'Guideline; Practice Guideline; Consensus Development Conference', 'Guidance'],
  ['Review', 'Review; Scoping Review', 'Evidence synthesis'],
  ['Observational study', 'Observational Study', 'Primary research'],
  ['Case report', 'Case Reports', 'Primary research'],
  ['Trial protocol', 'Clinical Trial Protocol (not counted as a trial)', 'Other'],
  ['Editorial, comment or letter', 'Editorial; Comment; Letter; News', 'Commentary'],
  ['Journal article', 'Only “Journal Article” (design not indexed)', 'Design not indexed'],
];

export default function Methodology() {
  const pancreatic = resolveCancer('pancreatic');
  const t = ATLAS_THRESHOLDS;
  return (
    <DocPage
      title="Methodology"
      intro="How Cancer Insight retrieves, checks, classifies and counts cancer research. The tables on this page are generated from the same code that runs the site."
      updated="9 October 2026"
      toc={TOC}
    >
      <h2 id="purpose">Purpose</h2>
      <p>
        Cancer Insight is an independent, educational explorer of cancer research literature. Its
        job is to show what research exists while keeping the original evidence visible: what was
        retrieved, where it came from, why it appears and what the numbers do — and do not — mean.
      </p>
      <p>
        It does not diagnose, recommend treatments or give medical advice. Counts of papers describe
        research activity, never how well a treatment works.
      </p>

      <h2 id="sources">Sources</h2>
      <ul>
        <li>
          <strong>NCBI PubMed and PubMed Central</strong> (U.S. National Library of Medicine), via
          the E-utilities API: record counts, Best Match and newest-first record lists, and metadata
          (titles, abstracts, authors, journals, dates, publication types, MeSH headings, DOIs and
          PMC links).
        </li>
        <li>
          <strong>Cure Cancer With AI research API</strong>: a third-party feed of the newest
          research records for {FEED_CANCERS.length} cancer types ({FEED_CANCERS.join(', ')}),
          including treatment-category tags. Cancer Insight re-checks every feed record and replaces
          its metadata with PubMed’s where a PubMed ID exists.
        </li>
        <li>
          <strong>Wikimedia Commons</strong>: openly licensed scientific images.
        </li>
      </ul>
      <p>
        Searches are sent from Cancer Insight’s server to these services. Cancer Insight is not
        affiliated with any of them.
      </p>

      <h2 id="queries">From search to PubMed query</h2>
      <p>
        Every cancer type is turned into one PubMed query that combines MeSH headings (which include
        narrower headings) with title/abstract phrases. The same query is used for every count, list
        and Gap Atlas measure for that cancer, and it is shown wherever results appear. For example,
        “pancreatic cancer” becomes:
      </p>
      <code className="formula">{pancreatic.term}</code>
      <p>
        Cancer Insight recognises {Object.keys(CANCERS).length} cancer types and common synonyms
        (for example colon → colorectal, NSCLC → non-small cell lung cancer). Other inputs are
        searched as title/abstract phrases such as “appendix cancer”. Inputs are limited to letters,
        numbers, spaces and hyphens so they cannot change the structure of a query.
      </p>

      <h2 id="recent">Recent research</h2>
      <ol>
        <li>
          For cancers the feed covers, Cancer Insight requests the 100 newest feed records (cached
          for up to an hour).
        </li>
        <li>
          Each record is enriched with PubMed metadata and checked for relevance. It is kept when
          the cancer appears in the title, MeSH headings or keywords, or in the abstract of a record
          the feed tags with that cancer. Records whose title is about a different cancer are
          dropped. The matching field is shown on each paper as “Why it’s here”.
        </li>
        <li>
          Up to 20 records are kept, most relevant first and then newest. If fewer than 8 pass, the
          newest PubMed records for the query fill the list and are labelled as such. Cancers the
          feed does not cover use PubMed directly.
        </li>
        <li>
          Treatment tags come from the feed. A “stem cell transplant” tag is kept only when the text
          describes a transplant, so papers about cancer stem cells are not mislabelled.
        </li>
      </ol>
      <p>
        Because the feed returns the newest records, this list shows <em>what is new</em>. It is not
        a sample of the whole literature, and statistics about it (for example its publication
        years) describe these records only. The Papers view can also show{' '}
        <strong>PubMed Best Match</strong>: PubMed’s own relevance ranking across all years.
      </p>

      <h2 id="evidence-types">Evidence types</h2>
      <p>
        Evidence types come from PubMed publication types, using one classifier everywhere on the
        site. When a record has several types, the first matching row below wins.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Label shown</th>
              <th>PubMed publication types</th>
              <th>Family</th>
            </tr>
          </thead>
          <tbody>
            {EVIDENCE_ROWS.map(([label, types, family]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>{types}</td>
                <td>{family}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul>
        <li>Randomized controlled trials always count as clinical trials.</li>
        <li>
          “Design not indexed” is common: many original studies, including laboratory and clinical
          research, carry only the generic “Journal Article” type. It is not a judgement.
        </li>
        <li>
          Records indexed as “Retracted Publication” show a retraction warning everywhere they
          appear, including exports.
        </li>
        <li>
          Evidence types describe what kind of record a paper is. They are not quality or
          certainty-of-evidence ratings.
        </li>
      </ul>

      <h2 id="footprint">PubMed counts</h2>
      <p>
        The Overview counts PubMed records matching the cancer query in total, in each of the last
        11 publication years, and for each study design below. Each count is a separate PubMed
        search and links to it.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Measure</th>
              <th>Added to the cancer query</th>
            </tr>
          </thead>
          <tbody>
            {DESIGNS.map(d => (
              <tr key={d.id}>
                <td>{d.label}</td>
                <td>
                  <code>AND {d.term}</code>
                </td>
              </tr>
            ))}
            <tr>
              <td>{FREE_FULL_TEXT.label}</td>
              <td>
                <code>AND {FREE_FULL_TEXT.term}</code>
              </td>
            </tr>
            <tr>
              <td>A publication year, e.g. 2024</td>
              <td>
                <code>AND (&quot;2024&quot;[dp] : &quot;2024&quot;[dp])</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Read these counts with three cautions: PubMed indexes more journals than it used to, so
        growth over time partly reflects coverage; the current year is incomplete; and publication
        types are added during indexing, so the newest records are under-counted by design.
      </p>

      <h2 id="treatments">Treatment literature</h2>
      <p>
        Treatment categories are matched with the PubMed terms below, combined with the cancer
        query. For a category, Cancer Insight reports the number of records, their share of the
        cancer’s literature, the study designs among them, how many were published in the last five
        years and how many have a free full text. Example records are PubMed Best Match.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>PubMed terms</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(TREATMENTS).map(([id, tr]) => (
              <tr key={id}>
                <td>{tr.label}</td>
                <td>
                  <code>{tr.term}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        A comparison of two categories compares literature: how much has been published and in which
        designs. It does not compare effectiveness or safety, and the two lists of example records
        are not paired. More records, more trials or newer records never mean a better treatment.
      </p>

      <h2 id="gap-atlas">Research Gap Atlas — Method {ATLAS_METHOD_VERSION}</h2>
      <p>
        The atlas asks whether a study design, research theme, access filter or publication period
        makes up a smaller share of a cancer’s PubMed literature than of oncology as a whole.
      </p>
      <code className="formula">
        {`share(cancer)   = records(cancer AND measure) ÷ records(cancer)
share(oncology) = records(oncology AND measure) ÷ records(oncology)
ratio           = share(cancer) ÷ share(oncology)`}
      </code>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Reading</th>
              <th>Rule</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Much lower representation</td>
              <td>ratio below {t.muchLower}</td>
            </tr>
            <tr>
              <td>Lower representation (a signal)</td>
              <td>ratio below {t.lower}</td>
            </tr>
            <tr>
              <td>Higher representation (shown, never a signal)</td>
              <td>ratio above {t.higher}</td>
            </tr>
            <tr>
              <td>Too few records</td>
              <td>
                fewer than {t.minRecords} records for the cancer, or fewer than {t.minExpected}{' '}
                matching records expected at the oncology-wide share
              </td>
            </tr>
            <tr>
              <td>Expected (population)</td>
              <td>
                a low share of pediatric studies in cancers that occur mainly in adults, or of
                older-adult studies in cancers that occur mainly in children
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        These thresholds are exploratory design choices, not accepted standards. Because the atlas
        compares shares across the whole index rather than a sample, sampling error does not apply;
        the uncertainty lies in how well each query captures its concept.
      </p>
      <h3>Measures</h3>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Measure</th>
              <th>PubMed terms</th>
            </tr>
          </thead>
          <tbody>
            {ATLAS_DESIGN_IDS.map(id => (
              <tr key={id}>
                <td>{DESIGN_BY_ID[id].label}</td>
                <td>
                  <code>{DESIGN_BY_ID[id].term}</code>
                </td>
              </tr>
            ))}
            {THEMES.map(th => (
              <tr key={th.id}>
                <td>
                  {th.label}
                  {th.kind === 'population' ? ' (title/abstract only)' : ''}
                </td>
                <td>
                  <code>{th.term}</code>
                </td>
              </tr>
            ))}
            <tr>
              <td>{FREE_FULL_TEXT.label}</td>
              <td>
                <code>{FREE_FULL_TEXT.term}</code>
              </td>
            </tr>
            <tr>
              <td>Published in the last three years</td>
              <td>
                <code>(&quot;YYYY−2&quot;[dp] : &quot;YYYY&quot;[dp])</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Population themes use title/abstract wording only, so they count studies that focus on a
        population rather than every study that enrolled it. The oncology baseline is:
      </p>
      <code className="formula">{BASELINE_TERM}</code>
      <p>
        If a live baseline count cannot be retrieved, the atlas uses a dated reference snapshot for
        that measure and says so.
      </p>
      <h3>What the atlas deliberately does not do</h3>
      <ul>
        <li>
          It never flags treatment categories. It reports how many records mention each one, but
          relevance depends on the biology of each cancer, so a low count is not a gap.
        </li>
        <li>It never claims that a real scientific or clinical research gap exists.</li>
        <li>It never ranks cancers, treatments or topics by importance.</li>
      </ul>
      <h3>Evidence behind the atlas</h3>
      <p>
        To make the queries inspectable, the atlas also retrieves the PubMed Best Match records
        inside four publication periods (the last 3 years, the 5 before, the 10 before those and
        everything earlier), checks them for cancer relevance and lists them with their period,
        evidence type and metadata completeness. Equal numbers are requested per period, so this
        sample is spread across time by design and does not feed any signal.
      </p>
      <h3>Changes from version 2.0</h3>
      <p>
        Version 2.0 computed coverage inside a sample of 28–100 records. Three problems led to
        Method 3.0:
      </p>
      <ul>
        <li>
          Treatment-focused records, deliberately added for the most common treatments, were counted
          in general study-design and topic denominators, and they made the treatment distribution
          signal circular.
        </li>
        <li>
          The “recent literature” measure was produced by the sampling design: one of the four
          sampling periods <em>was</em> the recent period.
        </li>
        <li>
          Fixed thresholds on small samples could flag large literatures as lacking trials: on 9
          October 2026 the published atlas (method 1.0) reported “0 clinical trials” for pancreatic
          cancer, which has more than 4,000 clinical-trial records in PubMed.
        </li>
      </ul>

      <h2 id="images">Images</h2>
      <p>
        Images come from Wikimedia Commons searches for the cancer combined with histopathology,
        micrograph, CT and MRI. Documents, scans of books, posters and awareness campaigns are
        excluded; each image needs the cancer in its title, or in its description together with a
        specific imaging term. Creator, licence and a licence link are shown. Images are educational
        illustrations, not diagnostic references.
      </p>

      <h2 id="exports">Exports and saved papers</h2>
      <ul>
        <li>
          <strong>CSV</strong> files start with provenance rows (date, cancer, query, source,
          filters) and neutralise cells that spreadsheets could run as formulas.
        </li>
        <li>
          <strong>RIS</strong> files import into Zotero, EndNote and Mendeley; retractions are
          noted.
        </li>
        <li>
          <strong>PDF reports</strong> state when and how records were retrieved, the query, the
          evidence-type mix and links to every source.
        </li>
        <li>
          <strong>Gap Atlas JSON</strong> contains every count, query, link, threshold and sampled
          record.
        </li>
        <li>
          <strong>Saved papers</strong> are stored only in your browser, with enough metadata to
          show them across searches.
        </li>
      </ul>

      <h2 id="reproducibility">Reproducibility</h2>
      <p>
        PubMed counts are cached for up to 24 hours and record lists for up to 12 hours, so a number
        can lag PubMed by a day. Opening a count’s link runs the same query on PubMed; small
        differences are normal as records are added and re-indexed. Requests follow NCBI’s usage
        policy (identified tool, contact address, rate limits and retries).
      </p>

      <h2 id="limitations">Limitations</h2>
      <ul>
        <li>
          PubMed does not index every journal, conference abstract, trial registry or preprint.
        </li>
        <li>MeSH headings and publication types lag behind the newest records.</li>
        <li>Title/abstract matching catches incidental mentions and misses unusual wording.</li>
        <li>The research feed’s coverage and tagging rules are controlled by its provider.</li>
        <li>Deduplication relies on PubMed IDs, DOIs and titles and can miss duplicates.</li>
      </ul>
      <p>
        If something looks wrong, <Link href="/contact">tell us</Link> — include the cancer, the
        page and, if possible, the PubMed ID.
      </p>

      <h2 id="versions">Version history</h2>
      <ul>
        <li>
          <strong>October 2026</strong> — Research Gap Atlas Method 3.0; shared query catalogue;
          PubMed counts with linked queries; evidence-type classifier; retraction warnings.
        </li>
        <li>
          <strong>Method 2.0</strong> (not released) — year-stratified sample and provenance export,
          superseded by 3.0 before release.
        </li>
        <li>
          <strong>Method 1.0</strong> — first Research Gap Atlas, based on the records retrieved for
          a search.
        </li>
      </ul>
    </DocPage>
  );
}
