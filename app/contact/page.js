import Link from 'next/link';
import DocPage from '../_components/DocPage';

export const metadata = {
  title: 'Contact',
  description:
    'Contact Cancer Insight about incorrect research information, broken links, image attribution, privacy or the methodology.',
  alternates: { canonical: '/contact' },
};

export default function Contact() {
  return (
    <DocPage
      title="Contact"
      intro="Corrections, broken links and questions about the site are welcome."
    >
      <div className="contactCard">
        <p style={{ margin: '0 0 4px' }}>Email</p>
        <a className="contactEmail" href="mailto:cancerinsight.contact@gmail.com">
          cancerinsight.contact@gmail.com
        </a>
      </div>

      <h2>Reporting a problem with research information</h2>
      <p>Include as much of this as you can — it lets us reproduce the problem:</p>
      <ul>
        <li>
          the cancer type you searched and the page (Overview, Papers, Treatments, Gap Atlas…);
        </li>
        <li>the paper title and its PubMed ID or DOI;</li>
        <li>what looks wrong, and what you expected.</li>
      </ul>
      <p>
        Some information comes from PubMed or the research feed; we can explain it, but corrections
        to the records themselves have to be made at the source.
      </p>

      <h2>Images and attribution</h2>
      <p>
        For an image problem, include the image title or its Wikimedia Commons link. Licensing is
        set by the original uploader.
      </p>

      <h2>Privacy</h2>
      <p>
        Privacy questions and requests go to the same address. See the{' '}
        <Link href="/privacy-policy">privacy policy</Link> for what the site collects.
      </p>

      <h2>Medical questions</h2>
      <p>
        Cancer Insight cannot answer personal medical questions or review medical records. Please do
        not send health details by email; ask a qualified clinician instead.
      </p>

      <p className="muted">
        Cancer Insight is run independently; replies are not guaranteed, but every report is read.
      </p>
    </DocPage>
  );
}
