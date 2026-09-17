export const metadata = {
  title: 'Contact | Cancer Insight',
  description:
    'Contact Cancer Insight about the website, research sources, broken links, privacy, methodology, or technical issues.',
};

export default function Contact() {
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

            <h1>Contact Cancer Insight</h1>

            <p>
              Questions, feedback, research-source issues, and website support
            </p>
          </div>
        </div>

        <section className="legalCard importantLegalCard">
          <h2>Contact Email</h2>

          <p>
            For questions about Cancer Insight, website feedback,
            broken research links, technical issues, methodology,
            privacy, or other site-related matters, contact:
          </p>

          <a
            className="contactPlaceholder"
            href="mailto:cancerinsight.contact@gmail.com"
          >
            cancerinsight.contact@gmail.com
          </a>
        </section>

        <section className="legalCard">
          <h2>What You Can Contact Us About</h2>

          <p>
            You can use the contact email for topics such as:
          </p>

          <ul>
            <li>broken PubMed, PMC, DOI, or publisher links,</li>
            <li>research information that appears incorrect or incomplete,</li>
            <li>problems with Cancer Insight search results,</li>
            <li>issues with saved papers,</li>
            <li>problems with PDF or CSV downloads,</li>
            <li>scientific image source or attribution issues,</li>
            <li>website accessibility or mobile-display problems,</li>
            <li>questions about the Research Methodology page,</li>
            <li>privacy questions, and</li>
            <li>general feedback about the platform.</li>
          </ul>
        </section>

        <section className="legalCard">
          <h2>Reporting a Research Problem</h2>

          <p>
            If you are reporting an issue with a research paper,
            including the following information can make the problem
            easier to identify:
          </p>

          <ul>
            <li>the cancer type you searched,</li>
            <li>the paper title,</li>
            <li>the PubMed ID or DOI if available,</li>
            <li>which page or feature showed the problem, and</li>
            <li>a short description of what appears incorrect.</li>
          </ul>

          <p>
            If the issue relates to an external research source,
            Cancer Insight may not be able to change information
            controlled by that external source.
          </p>
        </section>

        <section className="legalCard">
          <h2>Broken or Missing Links</h2>

          <p>
            Research-source links can change over time.
          </p>

          <p>
            If a PubMed, PubMed Central, DOI, publisher, or scientific
            image link no longer works, you can report it through the
            contact email.
          </p>
        </section>

        <section className="legalCard">
          <h2>Scientific Images</h2>

          <p>
            If you notice an issue with a scientific image, source
            page, attribution, creator name, or displayed licensing
            information, please include the image title or original
            source link when contacting Cancer Insight.
          </p>

          <p>
            Image licensing is controlled by the original source, so
            users should always verify reuse rights on the original
            source page.
          </p>
        </section>

        <section className="legalCard">
          <h2>Privacy Questions</h2>

          <p>
            Questions about analytics, cookies, saved-paper storage,
            website interaction tracking, or other privacy-related
            matters can be sent to the same contact email.
          </p>

          <a className="sourceButton" href="/privacy-policy">
            Read Privacy Policy
          </a>
        </section>

        <section className="legalCard">
          <h2>Research Methodology Questions</h2>

          <p>
            The Research Methodology page explains how Cancer Insight
            finds, enriches, filters, deduplicates, compares, and
            presents research information.
          </p>

          <p>
            If something about the methodology is unclear, you can
            contact Cancer Insight for clarification about the
            website's research-exploration process.
          </p>

          <a className="sourceButton" href="/methodology">
            Read Research Methodology
          </a>
        </section>

        <section className="legalCard contactNotice">
          <h2>Medical Questions</h2>

          <p>
            Cancer Insight does not provide diagnosis, personal
            medical advice, individualized treatment recommendations,
            or emergency medical guidance.
          </p>

          <p>
            Please do not send private medical records, passwords,
            financial information, or other sensitive personal
            information by email.
          </p>

          <p>
            Personal medical questions should be discussed with a
            qualified healthcare professional.
          </p>
        </section>

        <section className="legalCard">
          <h2>Response Expectations</h2>

          <p>
            Cancer Insight may review messages relating to the website
            and its research-exploration features, but a response is
            not guaranteed for every message.
          </p>

          <p>
            Messages requesting personal medical advice or individual
            treatment recommendations may not receive a medical
            response because Cancer Insight is not a healthcare
            service.
          </p>
        </section>

        <section className="legalCard">
          <h2>Useful Pages</h2>

          <p>
            Before contacting Cancer Insight, these pages may already
            answer your question:
          </p>

          <div className="paperActions">
            <a className="sourceButton" href="/faq">
              Frequently Asked Questions
            </a>

            <a className="sourceButton" href="/methodology">
              Research Methodology
            </a>

            <a className="sourceButton" href="/privacy-policy">
              Privacy Policy
            </a>

            <a className="sourceButton" href="/terms">
              Terms & Disclaimer
            </a>
          </div>
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
