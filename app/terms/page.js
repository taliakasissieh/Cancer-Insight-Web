export const metadata = {
  title: 'Terms & Disclaimer | Cancer Insight',
  description:
    'Terms of use, research limitations, and medical disclaimer for Cancer Insight.',
};

export default function Terms() {
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

            <h1>Terms & Disclaimer</h1>

            <p>
              Last updated: September 2026
            </p>
          </div>
        </div>

        <section className="legalCard importantLegalCard">
          <h2>Educational Use Only</h2>

          <p>
            Cancer Insight is provided for educational,
            informational, and research-exploration
            purposes only.
          </p>

          <p>
            The website does not provide medical diagnosis,
            medical treatment, individualized medical
            advice, or professional healthcare services.
          </p>
        </section>

        <section className="legalCard">
          <h2>No Medical Advice</h2>

          <p>
            Information displayed by Cancer Insight should
            not be used as a substitute for advice from a
            physician or another qualified healthcare
            professional.
          </p>

          <p>
            Never delay seeking professional medical care
            because of information found through Cancer
            Insight.
          </p>
        </section>

        <section className="legalCard">
          <h2>Research Information</h2>

          <p>
            Cancer Insight retrieves and organizes
            scientific research information from external
            research sources.
          </p>

          <p>
            Research papers, abstracts, publication counts,
            treatment mentions, research analytics, and
            other information may be incomplete, outdated,
            automatically extracted, or subject to errors.
          </p>

          <p>
            Users should review the original research
            sources before relying on scientific
            information presented by the website.
          </p>
        </section>

        <section className="legalCard">
          <h2>Treatment Comparisons</h2>

          <p>
            Treatment comparison features compare retrieved
            research literature and research availability.
          </p>

          <p>
            More papers, newer papers, more clinical trials,
            or greater research coverage do not mean that
            one treatment is safer, more effective, or more
            appropriate than another treatment.
          </p>
        </section>

        <section className="legalCard">
          <h2>External Links</h2>

          <p>
            Cancer Insight may link to PubMed, PubMed
            Central, publishers, DOI services, Wikimedia
            Commons, and other third-party websites.
          </p>

          <p>
            Cancer Insight is not responsible for the
            availability, accuracy, privacy practices,
            content, or policies of external websites.
          </p>
        </section>

        <section className="legalCard">
          <h2>Scientific Images</h2>

          <p>
            Scientific images may come from external sources
            such as Wikimedia Commons.
          </p>

          <p>
            Licensing and attribution information is shown
            when available. Users are responsible for
            checking the original source and license before
            reusing an image.
          </p>
        </section>

        <section className="legalCard">
          <h2>No Guarantee of Accuracy</h2>

          <p>
            Cancer Insight aims to present research
            information accurately, but no guarantee is
            made that all information will always be
            complete, current, or error-free.
          </p>
        </section>

        <section className="legalCard">
          <h2>Use of the Website</h2>

          <p>
            By using Cancer Insight, you agree to use the
            website responsibly and for lawful,
            educational, or research purposes.
          </p>
        </section>

        <section className="legalCard">
          <h2>Changes</h2>

          <p>
            Cancer Insight may update its features, sources,
            terms, or policies as the platform develops.
          </p>
        </section>

        <div className="legalFooter">
          <a href="/privacy-policy">
            Privacy Policy
          </a>

          <a href="/contact">
            Contact
          </a>

          <a href="/terms">
            Terms & Disclaimer
          </a>

          <a href="/">
            Cancer Insight
          </a>
        </div>
      </div>
    </main>
  );
}
