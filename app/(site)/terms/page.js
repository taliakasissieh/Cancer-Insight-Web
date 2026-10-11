import Link from 'next/link';
import DocPage from '../../_components/DocPage';
import { languageAlternates } from '../../../lib/i18n/index.js';

export const metadata = {
  title: 'Terms and disclaimer',
  description:
    'Terms of use and medical disclaimer for Cancer Insight, an educational cancer research explorer.',
  alternates: { canonical: '/terms', languages: languageAlternates('/terms') },
};

const TOC = [
  { id: 'medical', label: 'Not medical advice' },
  { id: 'information', label: 'Research information' },
  { id: 'content', label: 'Third-party content' },
  { id: 'data', label: 'Open data' },
  { id: 'use', label: 'Acceptable use' },
  { id: 'liability', label: 'Liability' },
  { id: 'changes', label: 'Changes and contact' },
];

export default function Terms() {
  return (
    <DocPage
      title="Terms and disclaimer"
      intro="By using Cancer Insight you agree to these terms."
      updated="11 October 2026"
      toc={TOC}
    >
      <h2 id="medical">Not medical advice</h2>
      <p>
        Cancer Insight is an educational research-exploration website. It does not provide medical
        advice, diagnosis or treatment recommendations, and using it does not create a
        clinician–patient relationship. Research counts, evidence types, comparisons, Gap Atlas
        signals, trial figures and burden comparisons describe published research and trial
        registrations; they must not be used to choose or refuse a treatment or a trial. Always seek the advice of a qualified healthcare professional, and in an
        emergency contact local emergency services.
      </p>

      <h2 id="information">Research information</h2>
      <p>
        Information is retrieved automatically from external sources and processed by the rules in
        the <Link href="/methodology">methodology</Link>. It may be incomplete, out of date or
        wrong, and results change as sources change. Cancer Insight is provided “as is”, without
        warranties of accuracy, completeness or availability. Check the original sources whenever
        accuracy matters.
      </p>

      <h2 id="content">Third-party content</h2>
      <p>
        Titles, abstracts, images and other content belong to their authors, publishers or
        licensors. Cancer Insight shows them for research and educational purposes with links to
        their sources. Free availability does not grant reuse rights; check the licence on the
        original page before reusing anything.
      </p>

      <h2 id="data">Open data</h2>
      <p>
        The figures Cancer Insight computes are available from the addresses on the{' '}
        <Link href="/data">open data page</Link>. You may reuse them with a citation to Cancer
        Insight and to the original sources. The underlying data keep their sources’ terms: in
        particular, GLOBOCAN burden figures belong to the International Agency for Research on
        Cancer, must be cited to it, and may not be retrieved systematically to build another
        database without its permission.
      </p>

      <h2 id="use">Acceptable use</h2>
      <ul>
        <li>Do not enter personal health information or other sensitive data.</li>
        <li>
          Keep automated use of the site and its data addresses light — no more than about one
          request a second. The site relies on public services with strict usage limits.
        </li>
        <li>Do not misrepresent Cancer Insight’s output as medical guidance.</li>
      </ul>

      <h2 id="liability">Liability</h2>
      <p>
        To the extent permitted by law, Cancer Insight is not liable for decisions made or actions
        taken on the basis of information on the site, or for the content of external websites.
      </p>

      <h2 id="changes">Changes and contact</h2>
      <p>
        These terms may change as the site develops; the date above shows the latest version.
        Questions: <Link href="/contact">contact Cancer Insight</Link>.
      </p>
    </DocPage>
  );
}
