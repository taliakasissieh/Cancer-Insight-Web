import Link from 'next/link';
import DocPage from '../../_components/DocPage';
import {
  AtlasMeasuresTable,
  AtlasRulesTable,
  BurdenExcludedTable,
  BurdenMapTable,
  EvidenceTable,
  FootprintTable,
  TreatmentTable,
  TrialConditionsTable,
  TrialStatusTable,
} from '../../_components/methodology/Tables';
import {
  ATLAS_METHOD_VERSION,
  ATLAS_THRESHOLDS,
  BASELINE_TERM,
  CANCERS,
  RETRACTED_TERM,
  resolveCancer,
} from '../../../lib/queries';
import { GLOBOCAN } from '../../../lib/burden';
import { RESULTS_LAG_MONTHS } from '../../../lib/trials';
import { languageAlternates } from '../../../lib/i18n/index.js';

export const metadata = {
  title: 'Methodology',
  description:
    'How Cancer Insight retrieves, checks, classifies and counts cancer research — the exact PubMed and ClinicalTrials.gov queries, the Research Gap Atlas Method 3.0, the all-cancer map and the comparison with GLOBOCAN 2024 burden.',
  alternates: { canonical: '/methodology', languages: languageAlternates('/methodology') },
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
  { id: 'map', label: 'All-cancer map' },
  { id: 'trials', label: 'Clinical trials' },
  { id: 'burden', label: 'Research compared with burden' },
  { id: 'retractions', label: 'Retractions' },
  { id: 'profiles', label: 'Cancer profiles' },
  { id: 'images', label: 'Images' },
  { id: 'exports', label: 'Exports and saved papers' },
  { id: 'open-data', label: 'Open data' },
  { id: 'languages', label: 'English and Arabic' },
  { id: 'reproducibility', label: 'Reproducibility' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'versions', label: 'Version history' },
];

const FEED_CANCERS = Object.entries(CANCERS)
  .filter(([id, c]) => c.feed === id)
  .map(([, c]) => c.label.charAt(0).toLowerCase() + c.label.slice(1));

export default function Methodology() {
  const pancreatic = resolveCancer('pancreatic');
  const t = ATLAS_THRESHOLDS;
  const atlasRules = [
    ['Much lower representation', `ratio below ${t.muchLower}`],
    ['Lower representation (a signal)', `ratio below ${t.lower}`],
    ['Higher representation (shown, never a signal)', `ratio above ${t.higher}`],
    [
      'Too few records',
      `fewer than ${t.minRecords} records for the cancer, or fewer than ${t.minExpected} matching records expected at the oncology-wide share`,
    ],
    [
      'Expected (population)',
      'a low share of pediatric studies in cancers that occur mainly in adults, or of older-adult studies in cancers that occur mainly in children',
    ],
  ];
  return (
    <DocPage
      title="Methodology"
      intro="How Cancer Insight retrieves, checks, classifies and counts cancer research. The tables on this page are generated from the same code that runs the site."
      updated="11 October 2026"
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
          <strong>ClinicalTrials.gov</strong> (U.S. National Library of Medicine), via its data API
          version 2: registered clinical studies for each cancer.
        </li>
        <li>
          <strong>GLOBOCAN 2024</strong> (Global Cancer Observatory, International Agency for
          Research on Cancer): worldwide estimates of new cases and deaths, used to compare research
          with burden.
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
      <EvidenceTable />
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
      <FootprintTable />
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
      <TreatmentTable />
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
      <AtlasRulesTable rows={atlasRules} />
      <p>
        These thresholds are exploratory design choices, not accepted standards. Because the atlas
        compares shares across the whole index rather than a sample, sampling error does not apply;
        the uncertainty lies in how well each query captures its concept.
      </p>
      <h3>Measures</h3>
      <AtlasMeasuresTable />
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

      <h2 id="map">All-cancer map</h2>
      <p>
        The map applies the atlas to every cancer in the catalogue ({Object.keys(CANCERS).length}{' '}
        cancers) and every atlas measure at once. Each cell is the same ratio as in the atlas — the
        cancer’s share of records matching the measure divided by the oncology-wide share — and
        links to the PubMed search behind it. Counts are cached for a day, so the map fills quickly
        after its first build.
      </p>
      <ul>
        <li>
          Colours use a diverging scale centred on a ratio of 1: brown for lower representation,
          blue for higher, and a pale neutral between 0.8 and 1.25. Every cell also shows its value,
          so colour is never the only cue. The map is built as a table that screen readers can
          navigate, and it can be downloaded as CSV.
        </li>
        <li>
          Only ratios below {t.lower} are signals, exactly as in the atlas. The extra colour steps
          are there to make the picture readable, not to create new categories.
        </li>
        <li>
          The map compares each cancer with oncology overall. Comparing cancers with each other
          should be done with care: their queries differ in breadth, and a broad query (such as
          head and neck cancer) includes several diseases.
        </li>
      </ul>

      <h2 id="trials">Clinical trials</h2>
      <p>
        Trial figures come from ClinicalTrials.gov (data API version 2). For each cancer one
        condition search is sent — ClinicalTrials.gov adds its own synonyms — every matching study
        is downloaded with a small set of fields (identifier, status, phase, study type, whether
        results are posted, start and completion dates, lead sponsor type and site countries), and
        every figure is counted from that single list. The list can be downloaded as CSV, one row
        per study, with the categories used on the page, so any number can be checked. Up to 40,000
        studies are counted per cancer; if a search returns more, the page says so.
      </p>
      <p>
        The cancer name is sent as the condition, except for the cancers below, where the
        registry’s usual term is used:
      </p>
      <TrialConditionsTable />
      <p>
        The study-type split counts every registered study. Statuses, phases, sponsors, countries
        and start years count interventional trials only. Statuses are grouped as follows:
      </p>
      <TrialStatusTable />
      <h3>Completed without results posted</h3>
      <p>
        This measure counts interventional trials whose status is “Completed”, whose primary
        completion date (or completion date, if the primary date is missing) is at least{' '}
        {RESULTS_LAG_MONTHS} months ago, and which have no results section on ClinicalTrials.gov.
        The share is out of all completed interventional trials past the same date.
      </p>
      <ul>
        <li>
          <strong>It is not proof that results were never shared.</strong> Many trials report in
          journals or elsewhere instead, and many studies — for example phase 1 trials, or trials
          outside U.S. law — are not required to post results on ClinicalTrials.gov.
        </li>
        <li>
          The {RESULTS_LAG_MONTHS}-month allowance is deliberately longer than the 12 months U.S. law
          gives most trials it covers, so recently finished trials are not counted.
        </li>
        <li>
          Statuses are reported by sponsors and are not always kept up to date; “status not verified
          recently” is ClinicalTrials.gov’s own label for records it considers out of date.
        </li>
        <li>
          Countries are those listed as trial sites. A trial with sites in several countries counts
          once in each, so country counts add up to more than the number of trials.
        </li>
      </ul>

      <h2 id="burden">Research compared with burden</h2>
      <p>
        This comparison sets each cancer’s share of recent research beside its share of deaths
        (or new cases) worldwide.
      </p>
      <code className="formula">
        {`research share = records(cancer, last 5 complete years) ÷ records(oncology, same years)
burden share   = deaths(cancer) ÷ deaths(all cancers)     (or new cases)
ratio          = research share ÷ burden share`}
      </code>
      <ul>
        <li>
          <strong>Burden:</strong> {GLOBOCAN.edition} estimates — {GLOBOCAN.product}, {GLOBOCAN.scope}{' '}
          — transcribed from the world fact sheet and checked twice against it. Shares are of all
          cancers, including non-melanoma skin cancer, as GLOBOCAN reports them.
        </li>
        <li>
          <strong>Research:</strong> each cancer’s PubMed query (the same one used everywhere on the
          site) limited to the last five complete publication years, divided by the oncology
          baseline for the same years.
        </li>
        <li>
          A ratio above 1 means the cancer’s share of recent research is larger than its share of
          deaths; below 1, smaller. Research shares overlap — one paper can be about several
          cancers — so they do not add up to 100%.
        </li>
        <li>
          <strong>Burden is one reason among many to study a cancer.</strong> Survival, curability,
          how many people live with the disease and scientific opportunity matter too. The ratio
          describes where attention goes; it never says how much research a cancer should get.
        </li>
      </ul>
      <p>Catalogue cancers are matched to GLOBOCAN sites as follows:</p>
      <BurdenMapTable />
      <p>These catalogue entries are not compared:</p>
      <BurdenExcludedTable />
      <p className="small">
        Citation: {GLOBOCAN.citation}
      </p>

      <h2 id="retractions">Retractions</h2>
      <p>
        Retracted records are those PubMed indexes with the publication type “Retracted
        Publication”:
      </p>
      <code className="formula">{`(cancer query) AND ${RETRACTED_TERM}`}</code>
      <p>
        Cancer profiles report how many of a cancer’s records are retracted, the rate per 10,000
        records, and the most recently published retracted records. Retractions reach PubMed after
        the journal publishes a notice, so the count lags; and a retraction can be for honest error
        as well as misconduct. Papers lists and exports carry a retraction warning wherever such a
        record appears.
      </p>

      <h2 id="profiles">Cancer profiles</h2>
      <p>
        Each catalogue cancer has a profile page that gathers, on one page, the figures described
        above: its PubMed literature, its row of the all-cancer map, its clinical trials, its
        retractions and, where GLOBOCAN reports it, its burden. Every figure is computed by the
        same code as the full tool it comes from and links to it.
      </p>

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

      <h2 id="open-data">Open data</h2>
      <p>
        The figures behind every analysis can be fetched as JSON (and some as CSV) from stable
        addresses listed on the <Link href="/data">open data page</Link>. Each response includes
        the searches that produced it. The data keep the terms of their original sources; burden
        figures in particular are IARC’s and should be cited to IARC.
      </p>

      <h2 id="languages">English and Arabic</h2>
      <p>
        The whole site is available in Arabic at <Link href="/ar">/ar</Link>, laid out right to
        left. Searches in Arabic are matched to the same catalogue, so the same PubMed and
        ClinicalTrials.gov queries — which are always in English — produce the same numbers in both
        languages. Paper titles and abstracts are shown in their original language, and exported
        files stay in English so they work in reference managers. Numbers use Western digits in
        both languages.
      </p>

      <h2 id="reproducibility">Reproducibility</h2>
      <p>
        PubMed counts and ClinicalTrials.gov lists are cached for up to 24 hours and record lists
        for up to 12 hours, so a number can lag its source by a day. Opening a count’s link runs the same query on PubMed; small
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
        <li>
          ClinicalTrials.gov is one registry among several; trials registered only elsewhere (for
          example in the EU or WHO registries) are not counted.
        </li>
        <li>
          GLOBOCAN figures are modelled estimates; for countries with limited cancer registration
          they carry wide uncertainty.
        </li>
      </ul>
      <p>
        If something looks wrong, <Link href="/contact">tell us</Link> — include the cancer, the
        page and, if possible, the PubMed ID.
      </p>

      <h2 id="versions">Version history</h2>
      <ul>
        <li>
          <strong>11 October 2026</strong> — clinical trials from ClinicalTrials.gov; research
          compared with GLOBOCAN 2024 burden; all-cancer map; cancer profiles; retraction counts;
          open data; Arabic edition. The head and neck cancer query was narrowed to mouth,
          otorhinolaryngologic and salivary gland headings, so its counts are lower than before.
        </li>
        <li>
          <strong>9 October 2026</strong> — Research Gap Atlas Method 3.0; shared query catalogue;
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
