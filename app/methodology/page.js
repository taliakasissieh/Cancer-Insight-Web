export const metadata = {
  title: 'Methodology | Cancer Insight',

  description:
    'Learn how Cancer Insight finds, organizes, enriches, deduplicates, and presents cancer research evidence from scientific sources including PubMed and PubMed Central.',
};

export default function Methodology() {
  return (
    <main className="legalPage">
      <div className="legalContainer">
        <a
          className="backLink"
          href="/"
        >
          ← Back to Cancer Insight
        </a>

        <div className="legalHeader">
          <div className="legalMark">
            ✚
          </div>

          <div>
            <div className="legalEyebrow">
              CANCER INSIGHT
            </div>

            <h1>
              Research Methodology
            </h1>

            <p>
              How Cancer Insight finds, organizes, and presents cancer
              research evidence
            </p>
          </div>
        </div>

        <section className="legalCard">
          <h2>
            Purpose
          </h2>

          <p>
            Cancer Insight is an independent educational cancer research
            explorer available at cancer-insight.com.
          </p>

          <p>
            The platform is designed to make scientific cancer research easier
            to discover and examine while keeping original research sources
            visible.
          </p>

          <p>
            Cancer Insight does not provide personal medical advice,
            diagnosis, treatment recommendations, or medical decision-making
            services.
          </p>
        </section>

        <section className="legalCard">
          <h2>
            Research Sources
          </h2>

          <p>
            Cancer Insight may use scientific publication information from
            sources including PubMed, PubMed Central, DOI records, and
            publisher pages.
          </p>

          <p>
            Scientific cancer images may also be retrieved from Wikimedia
            Commons when appropriate source and attribution information is
            available.
          </p>

          <p>
            Original source links are displayed whenever available so users can
            examine the underlying research directly.
          </p>
        </section>

        <section className="legalCard">
          <h2>
            Cancer Research Search
          </h2>

          <p>
            When a user searches for a cancer type, Cancer Insight retrieves
            relevant research records and organizes available information such
            as paper titles, abstracts, journals, publication dates, authors,
            treatment mentions, PubMed identifiers, DOI information, and
            full-text source links.
          </p>

          <p>
            The number of papers shown depends on the research records returned
            for the search and does not represent every scientific publication
            ever produced about that cancer type.
          </p>
        </section>

        <section className="legalCard">
          <h2>
            PubMed Metadata Enrichment
          </h2>

          <p>
            When a PubMed identifier is available, Cancer Insight may enrich a
            research result with metadata associated with that PubMed record.
          </p>

          <p>
            This can include information such as the publication title,
            abstract, journal, publication date, authors, publication types,
            PubMed links, and PubMed Central availability.
          </p>
        </section>

        <section className="legalCard">
          <h2>
            Duplicate Paper Handling
          </h2>

          <p>
            Cancer Insight removes duplicate research papers from certain
            research counts where possible.
          </p>

          <p>
            Papers may be matched using identifiers such as PubMed IDs or DOI
            values. When those identifiers are unavailable, paper titles may
            also be used to help identify duplicate records.
          </p>

          <p>
            Deduplication reduces repeated records but cannot guarantee that
            every possible duplicate will always be detected.
          </p>
        </section>

        <section className="legalCard">
          <h2>
            Treatment Research
          </h2>

          <p>
            Cancer Insight identifies treatment-related research associated
            with retrieved cancer research records.
          </p>

          <p>
            Treatment Research can combine treatment-tagged papers from the
            original search with additional treatment-focused PubMed evidence.
          </p>

          <p>
            Duplicate papers are removed from combined research counts where
            possible.
          </p>
        </section>

        <section className="legalCard">
          <h2>
            Treatment Comparisons
          </h2>

          <p>
            The Compare Treatments feature compares characteristics of the
            retrieved research literature.
          </p>

          <p>
            These characteristics may include the number of unique evidence
            papers, free full-text availability, latest publication year,
            represented journals, clinical trials, reviews, and
            meta-analyses.
          </p>

          <p>
            These measurements describe research coverage only.
          </p>

          <p>
            A larger number of papers, newer publication dates, or greater
            research coverage does not mean that one treatment is medically
            superior, safer, or more suitable for a particular patient.
          </p>
        </section>

        <section className="legalCard">
          <h2>
            Publication Types
          </h2>

          <p>
            Cancer Insight may identify publication categories using available
            publication metadata.
          </p>

          <p>
            Examples include clinical trials, reviews, and meta-analyses.
          </p>

          <p>
            These categories depend on the metadata supplied by the research
            source and may not be available for every paper.
          </p>
        </section>

        <section className="legalCard">
          <h2>
            Free Full Text
          </h2>

          <p>
            A paper labeled “Free full text in PMC” indicates that Cancer
            Insight identified a freely readable version in PubMed Central.
          </p>

          <p>
            Free access does not automatically mean that the material can be
            reused without restrictions. Copyright and licensing conditions
            still depend on the original publication.
          </p>
        </section>

        <section className="legalCard">
          <h2>
            Research Analytics
          </h2>

          <p>
            Cancer Insight can summarize patterns in the retrieved literature,
            including publication years, journals, treatment coverage, and
            other research metadata.
          </p>

          <p>
            Analytics describe the records retrieved by Cancer Insight and
            should not be interpreted as a complete measurement of all cancer
            research activity worldwide.
          </p>
        </section>

        <section className="legalCard">
          <h2>
            Scientific Images
          </h2>

          <p>
            Cancer Insight may display scientifically relevant images from
            Wikimedia Commons.
          </p>

          <p>
            Searches may prioritize medical imaging, pathology, histology,
            microscopy, specimens, segmentation images, and scientific
            diagrams related to the searched cancer type.
          </p>

          <p>
            Users should refer to the original source for image descriptions,
            creator information, licensing conditions, and attribution
            requirements.
          </p>
        </section>

        <section className="legalCard importantLegalCard">
          <h2>
            Important Limitations
          </h2>

          <p>
            Cancer Insight is a research discovery tool. Automated searches,
            metadata processing, treatment identification, and research
            organization can sometimes miss information or context.
          </p>

          <p>
            Research abstracts are summaries of scientific publications and
            should not replace examination of the complete study when detailed
            interpretation is required.
          </p>

          <p>
            Research evidence can also change as new studies are published.
          </p>

          <p>
            Users should examine original scientific sources before drawing
            conclusions from individual studies.
          </p>
        </section>

        <section className="legalCard contactNotice">
          <h2>
            Medical Disclaimer
          </h2>

          <p>
            Cancer Insight is for educational and research-exploration
            purposes only.
          </p>

          <p>
            It does not provide medical diagnosis, personal medical advice,
            individualized treatment recommendations, emergency assistance,
            or professional healthcare services.
          </p>

          <p>
            Personal medical questions should be discussed with a qualified
            healthcare professional.
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
