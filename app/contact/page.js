export const metadata = {
  title: 'Contact | Cancer Insight',
  description:
    'Contact information and inquiries for Cancer Insight.',
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

            <h1>Contact</h1>

            <p>
              Questions, feedback, and research-source
              inquiries
            </p>
          </div>
        </div>

        <section className="legalCard">
          <h2>Contact Cancer Insight</h2>

          <p>
            Cancer Insight welcomes feedback about the
            website, technical issues, research-source
            links, and general questions about the
            platform.
          </p>

          <p>
            Please do not send private medical records,
            personal health information, passwords,
            financial details, or other sensitive
            information.
          </p>
        </section>

        <section className="legalCard contactNotice">
          <h2>Medical Questions</h2>

          <p>
            Cancer Insight is an educational research
            explorer and cannot provide personal medical
            advice, diagnosis, emergency assistance, or
            individualized treatment recommendations.
          </p>

          <p>
            Medical questions should be discussed with a
            qualified healthcare professional.
          </p>
        </section>

        <section className="legalCard">
          <h2>Research Sources</h2>

          <p>
            If you notice an incorrect source link,
            attribution issue, broken research link, or
            scientific image concern, please include the
            title of the relevant paper or image when
            contacting the site.
          </p>
        </section>

        <section className="legalCard">
          <h2>Email</h2>

          <p>
            Add your official Cancer Insight contact email
            here before publishing this page publicly.
          </p>

          <div className="contactPlaceholder">
            contact@your-domain.com
          </div>

          <p className="legalSmall">
            Replace the address above with an email address
            you actually control.
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
