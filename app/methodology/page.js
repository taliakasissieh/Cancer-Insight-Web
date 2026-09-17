export const metadata = {
  title: 'Methodology | Cancer Insight',
  description:
    'How Cancer Insight finds, organizes, filters, enriches, deduplicates, and presents cancer research evidence.',
};

export default function Methodology() {
  return (
    <main className="legalPage">
      <div className="legalContainer">
        <a className="backLink" href="/">
          ← Back to Cancer Insight
        </a>

        <div className="legalHeader">
          <div className="legalMark">✚</div>

          <div>
            <div className="legalEyebrow">
              CANCER INSIGHT
            </div>

            <h1>Research Methodology</h1>

            <p>
              How Cancer Insight finds, organizes, filters, and presents research evidence
            </p>
          </div>
        </div>

        <section className="legalCard importantLegalCard">
          <h2>Purpose</h2>

          <p>
            Cancer Insight is an independent educational cancer research explorer.
          </p>

          <p>
            Its purpose is to help users discover and examine scientific cancer
            research while keeping original research sources visible.
          </p>

          <p>
            Cancer Insight does not provide medical diagnosis, individualized
            treatment recommendations, or professional medical advice.
          </p>
        </section>

        <section className="legalCard">
          <h2>Research Sources</h2>

          <p>
            Cancer Insight may use research information from sources including
            PubMed, PubMed Central, NCBI resources, DOI records, scientific
            publisher pages, and Wikimedia Commons for scientific images.
          </p>

          <p>
            Source links are shown whenever available so users can review the
            original research record or source page directly.
          </p>
        </section>

        <section className="legalCard">
          <h2>Cancer Research Search</h2>

          <p>
            A user begins by entering a cancer type or research topic.
          </p>

          <p>
            Cancer Insight sends the research request to its search system and
            retrieves a set of research papers and related metadata.
          </p>

          <p>
            Search results represent the records returned for that search at that
            time. They are not intended to represent every paper ever published
            about that cancer type.
          </p>
        </section>

        <section className="legalCard">
          <h2>PubMed Metadata Enrichment</h2>

          <p>
            When a PubMed identifier or related metadata is available, Cancer
            Insight may enrich a research record with information such as:
          </p>

          <ul>
            <li>paper title,</li>
            <li>journal name,</li>
            <li>publication date,</li>
            <li>author information,</li>
            <li>abstract text,</li>
            <li>publication types,</li>
            <li>PubMed links,</li>
            <li>PubMed Central links,</li>
            <li>DOI information, and</li>
            <li>publisher links.</li>
          </ul>

          <p>
            Some papers may contain more complete metadata than others.
          </p>
        </section>

        <section className="legalCard">
          <h2>Duplicate Paper Handling</h2>

          <p>
            Cancer Insight attempts to remove duplicate research records before
            calculating paper counts and other research metrics.
          </p>

          <p>
            Deduplication may use available identifiers such as PubMed IDs, DOI
            values, paper titles, or other record information.
          </p>

          <p>
            Duplicate removal is performed where possible, but it may not detect
            every duplicate when source identifiers are missing, inconsistent, or
            formatted differently.
          </p>
        </section>

        <section className="legalCard">
          <h2>Research Paper Filters</h2>

          <p>
            The Research Papers section allows users to narrow the currently
            retrieved research set.
          </p>

          <p>
            Available filters may include:
          </p>

          <ul>
            <li>text search across titles, abstracts, journals, study types, and related metadata,</li>
            <li>free full-text availability,</li>
            <li>abstract availability,</li>
            <li>full-text source availability,</li>
            <li>treatment category,</li>
            <li>study type,</li>
            <li>publication year range, and</li>
            <li>saved-paper status.</li>
          </ul>

          <p>
            Filters change which papers from the retrieved dataset are displayed.
            They do not independently determine scientific quality or clinical
            importance.
          </p>
        </section>

        <section className="legalCard">
          <h2>Study-Type Classification</h2>

          <p>
            Cancer Insight may identify study types using publication-type
            metadata supplied by research sources.
          </p>

          <p>
            Examples may include:
          </p>

          <ul>
            <li>Clinical Trial,</li>
            <li>Randomized Controlled Trial,</li>
            <li>Review,</li>
            <li>Systematic Review, and</li>
            <li>Meta-analysis.</li>
          </ul>

          <p>
            These labels depend on the available source metadata and may not be
            present for every paper.
          </p>

          <p>
            Study-type classification is descriptive and should not be treated as
            a complete assessment of study quality, certainty of evidence, or
            clinical importance.
          </p>
        </section>

        <section className="legalCard">
          <h2>Publication Year Filtering</h2>

          <p>
            Cancer Insight may allow users to choose a starting year, ending year,
            or both.
          </p>

          <p>
            The year is extracted from available publication-date metadata.
          </p>

          <p>
            Papers without a recognizable publication year may not appear when a
            year-range filter is active.
          </p>
        </section>

        <section className="legalCard">
          <h2>Why This Paper Is Relevant</h2>

          <p>
            Cancer Insight may display a short relevance explanation for a paper.
          </p>

          <p>
            This explanation is based only on available retrieved information,
            such as:
          </p>

          <ul>
            <li>the paper title,</li>
            <li>the abstract,</li>
            <li>treatment tags,</li>
            <li>publication types, and</li>
            <li>the current cancer research query.</li>
          </ul>

          <p>
            This feature is intended to help users understand why a paper appears
            in the research set.
          </p>

          <p>
            It is not a scientific conclusion, independent quality assessment, or
            medical recommendation.
          </p>
        </section>

        <section className="legalCard">
          <h2>Treatment Research</h2>

          <p>
            Cancer Insight groups or retrieves research associated with treatment
            categories relevant to the current cancer search.
          </p>

          <p>
            The Treatment Research section may combine:
          </p>

          <ul>
            <li>papers already found in the main cancer search, and</li>
            <li>additional treatment-focused PubMed evidence.</li>
          </ul>

          <p>
            The combined set is deduplicated before research totals are
            calculated where possible.
          </p>

          <p>
            Treatment research counts describe the amount of retrieved research
            literature and do not indicate treatment superiority, safety, or
            effectiveness.
          </p>
        </section>

        <section className="legalCard">
          <h2>Treatment Comparisons</h2>

          <p>
            The Compare Treatments section retrieves and summarizes research
            separately for two selected treatment categories.
          </p>

          <p>
            Comparison measures may include:
          </p>

          <ul>
            <li>unique evidence-paper counts,</li>
            <li>free full-text availability,</li>
            <li>latest publication year,</li>
            <li>journal coverage,</li>
            <li>clinical-trial counts,</li>
            <li>review counts, and</li>
            <li>meta-analysis counts.</li>
          </ul>

          <p>
            Papers shown under each treatment are supporting research examples
            for that treatment and are not artificially paired with papers from
            the other treatment.
          </p>

          <p>
            The comparison is a research-coverage comparison only.
          </p>

          <p>
            More papers, newer studies, or more clinical trials do not mean that
            one treatment is medically better or more appropriate than another.
          </p>
        </section>

        <section className="legalCard">
          <h2>Research Analytics</h2>

          <p>
            Cancer Insight may generate summary analytics from the retrieved
            research set.
          </p>

          <p>
            Examples may include:
          </p>

          <ul>
            <li>paper counts,</li>
            <li>free full-text counts,</li>
            <li>latest publication year,</li>
            <li>journal counts,</li>
            <li>clinical-trial counts,</li>
            <li>treatment coverage,</li>
            <li>publication timelines, and</li>
            <li>top journals.</li>
          </ul>

          <p>
            Where possible, unique-paper counts are used to reduce duplicate
            records.
          </p>

          <p>
            Analytics describe the retrieved research dataset and are not measures
            of clinical effectiveness.
          </p>
        </section>

        <section className="legalCard">
          <h2>Free Full Text</h2>

          <p>
            A paper may be labeled as free full text when Cancer Insight
            identifies a freely readable source, such as PubMed Central.
          </p>

          <p>
            Free availability does not automatically mean the content can be
            reused, modified, republished, or redistributed without restriction.
          </p>

          <p>
            Users should check the original source and license before reusing
            content.
          </p>
        </section>

        <section className="legalCard">
          <h2>Saved Papers</h2>

          <p>
            Users may save papers for easier access while browsing Cancer
            Insight.
          </p>

          <p>
            Saved-paper identifiers are stored locally in the user's browser.
          </p>

          <p>
            Saved status does not change research ranking, relevance, or
            scientific interpretation.
          </p>
        </section>

        <section className="legalCard">
          <h2>PDF Research Reports</h2>

          <p>
            Cancer Insight can generate downloadable PDF reports based on the
            current research set.
          </p>

          <p>
            Reports may include:
          </p>

          <ul>
            <li>unique-paper counts,</li>
            <li>free full-text counts,</li>
            <li>publication year information,</li>
            <li>clinical-trial counts,</li>
            <li>treatment research coverage,</li>
            <li>paper titles and metadata,</li>
            <li>study-type information,</li>
            <li>abstract excerpts, and</li>
            <li>links to original research sources.</li>
          </ul>

          <p>
            PDF reports describe retrieved research literature and are not medical
            reports or clinical recommendations.
          </p>
        </section>

        <section className="legalCard">
          <h2>CSV Research Exports</h2>

          <p>
            Cancer Insight may allow research records or treatment-count data to
            be exported as CSV files.
          </p>

          <p>
            CSV exports are intended to make research data easier to inspect,
            organize, or analyze.
          </p>

          <p>
            Exported information remains subject to the same source limitations
            and interpretation cautions as information displayed on the website.
          </p>
        </section>

        <section className="legalCard">
          <h2>Scientific Images</h2>

          <p>
            Cancer Insight may retrieve scientific images from Wikimedia Commons
            and prioritize medically relevant material such as:
          </p>

          <ul>
            <li>pathology images,</li>
            <li>histology,</li>
            <li>microscopy,</li>
            <li>MRI or CT images,</li>
            <li>medical diagrams,</li>
            <li>specimens, and</li>
            <li>segmentation or research images.</li>
          </ul>

          <p>
            Original-source links, licensing information, and creator information
            are shown when available.
          </p>

          <p>
            Users should verify the original image source and license before reuse.
          </p>
        </section>

        <section className="legalCard">
          <h2>Research Source Links</h2>

          <p>
            Cancer Insight keeps source links visible whenever available.
          </p>

          <p>
            These may include:
          </p>

          <ul>
            <li>PubMed,</li>
            <li>PubMed Central,</li>
            <li>publisher pages,</li>
            <li>DOI records, and</li>
            <li>Wikimedia Commons source pages.</li>
          </ul>

          <p>
            Users are encouraged to open the original sources for full scientific
            context.
          </p>
        </section>

        <section className="legalCard">
          <h2>Important Limitations</h2>

          <p>
            Cancer Insight relies on external research sources, metadata,
            automated processing, and search logic.
          </p>

          <p>
            As a result:
          </p>

          <ul>
            <li>some relevant papers may not be retrieved,</li>
            <li>some metadata may be incomplete,</li>
            <li>study-type labels may be missing or imperfect,</li>
            <li>duplicate detection may not identify every duplicate,</li>
            <li>treatment tags may not capture every scientific nuance,</li>
            <li>relevance notes may simplify complex research context, and</li>
            <li>external links or source availability may change.</li>
          </ul>

          <p>
            Users should always review original research sources when scientific
            accuracy or detailed interpretation is important.
          </p>
        </section>

        <section className="legalCard importantLegalCard">
          <h2>Medical Disclaimer</h2>

          <p>
            Cancer Insight is for educational and research-exploration purposes
            only.
          </p>

          <p>
            It does not provide diagnosis, treatment recommendations, medical
            advice, or individualized healthcare guidance.
          </p>

          <p>
            Research-paper counts, study types, treatment comparisons, relevance
            notes, and analytics must not be used to decide which treatment a
            person should receive.
          </p>

          <p>
            Personal medical decisions should be made with qualified healthcare
            professionals.
          </p>
        </section>

        <div className="legalFooter">
          <a href="/">
            Cancer Insight
          </a>

          <a href="/methodology">
            Methodology
          </a>

          <a href="/faq">
            FAQ
          </a>

          <a href="/privacy-policy">
            Privacy Policy
          </a>

          <a href="/contact">
            Contact
          </a>

          <a href="/terms">
            Terms & Disclaimer
          </a>
        </div>
      </div>
    </main>
  );
}
