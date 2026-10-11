import Link from 'next/link';
import DocPage from '../_components/DocPage';

export const metadata = {
  title: 'Privacy policy',
  description:
    'What Cancer Insight collects, which services receive your searches, how analytics works and how to opt out.',
  alternates: { canonical: '/privacy-policy' },
};

const TOC = [
  { id: 'summary', label: 'Summary' },
  { id: 'searches', label: 'What you search' },
  { id: 'analytics', label: 'Analytics and cookies' },
  { id: 'storage', label: 'Saved papers' },
  { id: 'hosting', label: 'Hosting and logs' },
  { id: 'links', label: 'External links' },
  { id: 'children', label: 'Children' },
  { id: 'choices', label: 'Your choices' },
  { id: 'changes', label: 'Changes and contact' },
];

export default function PrivacyPolicy() {
  return (
    <DocPage title="Privacy policy" updated="9 October 2026" toc={TOC}>
      <h2 id="summary">Summary</h2>
      <ul>
        <li>
          Cancer Insight has no accounts and does not ask for your name or health information.
        </li>
        <li>
          Your search terms are sent to the research services that answer them, and are recorded in
          Google Analytics unless your browser asks not to be tracked.
        </li>
        <li>Saved papers stay in your browser.</li>
        <li>Cancer Insight shows no advertising and does not sell data.</li>
      </ul>
      <p>
        <strong>Please search for cancer types and research topics only.</strong> Do not enter
        names, medical record numbers or other personal health details.
      </p>

      <h2 id="searches">What you search</h2>
      <p>
        To answer a search, Cancer Insight’s server sends the cancer type (and, where relevant, a
        treatment category) to:
      </p>
      <ul>
        <li>NCBI E-utilities (PubMed), operated by the U.S. National Library of Medicine;</li>
        <li>the Cure Cancer With AI research API, for recent records and treatment tags;</li>
        <li>the Wikimedia Commons API, for images.</li>
      </ul>
      <p>
        These requests come from Cancer Insight’s server, not your browser, and carry no information
        about you. Each service handles requests under its own policies. Results may be cached on
        the server for up to 24 hours so repeated searches do not repeat these requests.
      </p>

      <h2 id="analytics">Analytics and cookies</h2>
      <p>
        Cancer Insight uses Google Analytics 4 to understand which features are used. It records
        page views, approximate location (such as country or city), device and browser type, and
        events such as starting a search (including the cancer type searched), changing views,
        saving papers, opening sources and downloading exports. Google Analytics sets first-party
        cookies (named
        <code>_ga</code>) to distinguish visits.
      </p>
      <p>
        Analytics is not loaded at all if your browser sends a{' '}
        <a href="https://globalprivacycontrol.org/" target="_blank" rel="noopener noreferrer">
          Global Privacy Control
        </a>{' '}
        or Do Not Track signal. You can also block it with browser settings or Google’s{' '}
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          target="_blank"
          rel="noopener noreferrer"
        >
          opt-out add-on
        </a>
        . Cancer Insight uses no advertising or cross-site tracking cookies.
      </p>

      <h2 id="storage">Saved papers</h2>
      <p>
        When you save a paper, its title, journal, date, identifiers and links are stored in your
        browser’s local storage. They are not sent to Cancer Insight. Clearing site data removes
        them.
      </p>

      <h2 id="hosting">Hosting and logs</h2>
      <p>
        The site is hosted on Vercel, which processes technical request data such as IP addresses
        and request times to deliver and secure the service. Cancer Insight does not combine this
        data with analytics or use it to identify visitors.
      </p>

      <h2 id="links">External links</h2>
      <p>
        Links to PubMed, PubMed Central, publishers, DOI resolvers and Wikimedia open those sites,
        which have their own privacy practices.
      </p>

      <h2 id="children">Children</h2>
      <p>
        Cancer Insight is an educational research site and does not knowingly collect personal
        information from anyone, including children.
      </p>

      <h2 id="choices">Your choices</h2>
      <ul>
        <li>Turn on Global Privacy Control or Do Not Track to stop analytics.</li>
        <li>
          Clear this site’s data in your browser to remove saved papers and analytics cookies.
        </li>
        <li>
          Ask questions or make a privacy request through the{' '}
          <Link href="/contact">contact page</Link>.
        </li>
      </ul>

      <h2 id="changes">Changes and contact</h2>
      <p>
        This policy is updated when the site’s data practices change; the date above shows the
        latest version. Contact:{' '}
        <a href="mailto:cancerinsight.contact@gmail.com">cancerinsight.contact@gmail.com</a>.
      </p>
    </DocPage>
  );
}
