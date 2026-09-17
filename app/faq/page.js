export const metadata = {
  title: 'FAQ | Cancer Insight',
  description:
    'Frequently asked questions about Cancer Insight, research sources, study types, filters, treatment research, comparisons, downloads, saved papers, and scientific images.',
};

export default function FAQ() {
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

            <h1>Frequently Asked Questions</h1>

            <p>
              Answers about Cancer Insight, research sources, and how to use the platform
            </p>
          </div>
        </div>

        <section className="legalCard importantLegalCard">
          <h2>What is Cancer Insight?</h2>

          <p>
            Cancer Insight is an independent educational cancer
            research explorer.
          </p>

          <p>
            It helps users discover, filter, organize, and examine
            scientific cancer research while keeping links to
            original research sources visible.
          </p>
        </section>

        <section className="legalCard">
          <h2>Is Cancer Insight a medical advice website?</h2>

          <p>
            No.
          </p>

          <p>
            Cancer Insight is designed for educational and
            research-exploration purposes only.
          </p>

          <p>
            It does not provide diagnosis, individualized treatment
            recommendations, professional medical advice, or
            healthcare services.
          </p>
        </section>

        <section className="legalCard">
          <h2>Where does the research information come from?</h2>

          <p>
            Cancer Insight may use research information from sources
            including PubMed, PubMed Central, NCBI resources, DOI
            records, scientific publisher pages, and related
            research metadata.
          </p>

          <p>
            Scientific images may also come from sources such as
            Wikimedia Commons.
          </p>
        </section>

        <section className="legalCard">
          <h2>What is PubMed?</h2>

          <p>
            PubMed is a database and search resource for biomedical
            and life-sciences literature maintained by the U.S.
            National Library of Medicine.
          </p>

          <p>
            Cancer Insight may use PubMed information to display
            research titles, abstracts, journals, authors,
            publication dates, publication types, and source links.
          </p>
        </section>

        <section className="legalCard">
          <h2>What is PubMed Central?</h2>

          <p>
            PubMed Central, often called PMC, is a digital archive of
            full-text biomedical and life-sciences journal
            literature.
          </p>

          <p>
            When Cancer Insight identifies a freely readable PMC
            version of a paper, the paper may be labeled
            “Free full text in PMC.”
          </p>
        </section>

        <section className="legalCard">
          <h2>Does “Free full text” mean I can reuse the paper?</h2>

          <p>
            Not necessarily.
          </p>

          <p>
            Free full-text availability means the paper can be read
            without a normal paywall at the identified source.
          </p>

          <p>
            Copyright and reuse permissions depend on the paper's
            original license and publisher terms.
          </p>
        </section>

        <section className="legalCard">
          <h2>Why do some papers have abstracts and others do not?</h2>

          <p>
            Abstract availability depends on the metadata provided by
            the research source.
          </p>

          <p>
            Some papers may have a PubMed abstract while others may
            only provide title, journal, date, author, or source-link
            information.
          </p>
        </section>

        <section className="legalCard">
          <h2>What are study-type labels?</h2>

          <p>
            Cancer Insight may display publication-type labels from
            research metadata.
          </p>

          <p>
            Examples include:
          </p>

          <ul>
            <li>Clinical Trial,</li>
            <li>Randomized Controlled Trial,</li>
            <li>Review,</li>
            <li>Systematic Review, and</li>
            <li>Meta-analysis.</li>
          </ul>

          <p>
            These labels depend on the information available from the
            original research source.
          </p>
        </section>

        <section className="legalCard">
          <h2>Does a study-type label tell me which paper is best?</h2>

          <p>
            No.
          </p>

          <p>
            A publication type describes the type of research record.
            It does not by itself determine study quality, reliability,
            certainty of evidence, clinical usefulness, or relevance
            to an individual patient.
          </p>
        </section>

        <section className="legalCard">
          <h2>How does the Study Type filter work?</h2>

          <p>
            The Study Type filter checks available publication-type
            metadata and displays papers matching the selected
            category.
          </p>

          <p>
            A paper without the required publication-type metadata may
            not appear when a study-type filter is active.
          </p>
        </section>

        <section className="legalCard">
          <h2>How do the From Year and To Year filters work?</h2>

          <p>
            Cancer Insight extracts a publication year from available
            publication-date metadata.
          </p>

          <p>
            The From Year filter keeps papers published in or after
            the selected year.
          </p>

          <p>
            The To Year filter keeps papers published in or before
            the selected year.
          </p>

          <p>
            Papers without a recognizable publication year may not
            appear while year filters are active.
          </p>
        </section>

        <section className="legalCard">
          <h2>Can I search within the papers that were found?</h2>

          <p>
            Yes.
          </p>

          <p>
            The Research Papers page includes a filter that can search
            across available titles, abstracts, journal information,
            study-type metadata, and related research terms.
          </p>
        </section>

        <section className="legalCard">
          <h2>What does “Why this paper is relevant” mean?</h2>

          <p>
            Cancer Insight may show a short explanation based on
            information already available in the research record.
          </p>

          <p>
            This may use the paper title, abstract, treatment tags,
            publication type, and the current cancer search.
          </p>

          <p>
            It is a navigation aid, not an independent scientific
            conclusion, quality rating, or medical recommendation.
          </p>
        </section>

        <section className="legalCard">
          <h2>What does “Treatments mentioned” mean?</h2>

          <p>
            It means Cancer Insight identified one or more treatment
            categories associated with the paper or research record.
          </p>

          <p>
            A treatment mention does not mean that a treatment is
            recommended, proven effective, safe, or suitable for a
            specific person.
          </p>
        </section>

        <section className="legalCard">
          <h2>What is Treatment Research?</h2>

          <p>
            Treatment Research lets users focus on research associated
            with one treatment category for the cancer currently being
            explored.
          </p>

          <p>
            Cancer Insight may combine treatment-tagged papers from the
            original cancer search with additional PubMed evidence.
          </p>

          <p>
            Duplicate papers are removed from research counts where
            possible.
          </p>
        </section>

        <section className="legalCard">
          <h2>What does Compare Treatments do?</h2>

          <p>
            Compare Treatments examines research coverage for two
            selected treatment categories.
          </p>

          <p>
            It may compare measures such as:
          </p>

          <ul>
            <li>unique-paper counts,</li>
            <li>free full-text availability,</li>
            <li>latest publication year,</li>
            <li>journal coverage,</li>
            <li>clinical-trial counts,</li>
            <li>review counts, and</li>
            <li>meta-analysis counts.</li>
          </ul>

          <p>
            It compares research literature, not which treatment is
            medically better.
          </p>
        </section>

        <section className="legalCard">
          <h2>Why are the papers different on the two sides of Compare Treatments?</h2>

          <p>
            The two treatment searches are performed independently.
          </p>

          <p>
            Cancer Insight does not artificially pair one paper from
            one treatment with one paper from another treatment.
          </p>

          <p>
            Each side shows supporting PubMed evidence for that
            treatment category.
          </p>
        </section>

        <section className="legalCard">
          <h2>Why can treatment paper counts be different?</h2>

          <p>
            Different treatment categories may return different
            amounts of research literature.
          </p>

          <p>
            Counts can also vary because of search terms, source
            metadata, publication indexing, treatment tags,
            deduplication, and the current retrieved dataset.
          </p>

          <p>
            A larger count does not mean a treatment is better or more
            effective.
          </p>
        </section>

        <section className="legalCard">
          <h2>How does Cancer Insight remove duplicate papers?</h2>

          <p>
            Cancer Insight attempts to identify duplicate research
            records using available identifiers such as PubMed IDs,
            DOI values, titles, or other metadata.
          </p>

          <p>
            Duplicate records are removed from research counts where
            possible.
          </p>

          <p>
            Some duplicates may remain if identifiers are missing or
            inconsistent.
          </p>
        </section>

        <section className="legalCard">
          <h2>What does Research Analytics show?</h2>

          <p>
            Research Analytics summarizes characteristics of the
            currently retrieved research dataset.
          </p>

          <p>
            Depending on the available data, this may include:
          </p>

          <ul>
            <li>unique-paper counts,</li>
            <li>free full-text counts,</li>
            <li>latest publication year,</li>
            <li>journal coverage,</li>
            <li>clinical-trial counts,</li>
            <li>treatment coverage,</li>
            <li>publication-year trends, and</li>
            <li>top journals.</li>
          </ul>
        </section>

        <section className="legalCard">
          <h2>Does a larger bar in Research Analytics mean better evidence?</h2>

          <p>
            No.
          </p>

          <p>
            Analytics bars describe the amount or distribution of
            retrieved research information.
          </p>

          <p>
            They do not measure treatment effectiveness, safety,
            quality, or medical importance.
          </p>
        </section>

        <section className="legalCard">
          <h2>What are Cancer Images?</h2>

          <p>
            Cancer Images are scientific or medically relevant images
            retrieved from external sources such as Wikimedia Commons.
          </p>

          <p>
            Cancer Insight may prioritize material such as pathology,
            histology, microscopy, MRI, CT, specimens, medical
            diagrams, or segmentation images.
          </p>
        </section>

        <section className="legalCard">
          <h2>Can I reuse images from Cancer Insight?</h2>

          <p>
            You should check the original source first.
          </p>

          <p>
            Cancer Insight may display available creator and license
            information, but reuse rights depend on the original
            image license.
          </p>
        </section>

        <section className="legalCard">
          <h2>Can I download a research report?</h2>

          <p>
            Yes.
          </p>

          <p>
            Cancer Insight can generate PDF research reports based on
            the current research dataset or filtered research set.
          </p>

          <p>
            Reports may include research metrics, treatment coverage,
            study-type information, paper metadata, abstract excerpts,
            and links to original sources.
          </p>
        </section>

        <section className="legalCard">
          <h2>Can I export the research data?</h2>

          <p>
            Yes.
          </p>

          <p>
            Cancer Insight can export research-paper data and certain
            analytics as CSV files.
          </p>

          <p>
            CSV files are intended to make the retrieved research
            information easier to organize or analyze.
          </p>
        </section>

        <section className="legalCard">
          <h2>Can I save papers?</h2>

          <p>
            Yes.
          </p>

          <p>
            Papers can be saved while browsing Cancer Insight.
          </p>

          <p>
            Saved-paper preferences are stored locally in the browser,
            so they normally remain available on the same browser and
            device.
          </p>
        </section>

        <section className="legalCard">
          <h2>Why did my saved papers disappear?</h2>

          <p>
            Saved-paper information is stored locally in the browser.
          </p>

          <p>
            Clearing browser data, using private browsing, switching
            browsers, or using another device may remove or hide saved
            papers.
          </p>
        </section>

        <section className="legalCard">
          <h2>Does Cancer Insight contain every relevant cancer paper?</h2>

          <p>
            No.
          </p>

          <p>
            Cancer Insight displays research returned by its search
            and retrieval process.
          </p>

          <p>
            Some relevant papers may not appear because of search
            limits, indexing, metadata availability, database changes,
            source availability, or other technical factors.
          </p>
        </section>

        <section className="legalCard">
          <h2>Can Cancer Insight research results change over time?</h2>

          <p>
            Yes.
          </p>

          <p>
            Research databases continue to change as new papers are
            published, metadata is updated, records are corrected, and
            external services change.
          </p>

          <p>
            Cancer Insight itself may also improve its search,
            filtering, and processing methods.
          </p>
        </section>

        <section className="legalCard">
          <h2>Why might a paper have missing information?</h2>

          <p>
            Cancer Insight depends on available source metadata.
          </p>

          <p>
            Some records may not include an abstract, publication
            type, DOI, PMC link, author list, treatment tag, or other
            information.
          </p>
        </section>

        <section className="legalCard">
          <h2>What should I do if a source link is broken or information looks wrong?</h2>

          <p>
            You can report the problem through the Cancer Insight
            contact page.
          </p>

          <p>
            Including the paper title, cancer type, or broken source
            information can help identify the problem.
          </p>

          <a className="sourceButton" href="/contact">
            Contact Cancer Insight
          </a>
        </section>

        <section className="legalCard">
          <h2>Can I ask Cancer Insight a personal medical question?</h2>

          <p>
            Cancer Insight is not designed to provide personal medical
            guidance.
          </p>

          <p>
            Do not enter private health records or other sensitive
            personal information into research search fields.
          </p>

          <p>
            Personal medical questions should be discussed with a
            qualified healthcare professional.
          </p>
        </section>

        <section className="legalCard">
          <h2>How can I learn more about how the site works?</h2>

          <p>
            The Research Methodology page explains how Cancer Insight
            retrieves, enriches, filters, deduplicates, compares, and
            presents research information.
          </p>

          <a className="sourceButton" href="/methodology">
            Read Research Methodology
          </a>
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
