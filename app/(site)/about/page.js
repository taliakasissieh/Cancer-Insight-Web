import Link from 'next/link';
import DocPage from '../../_components/DocPage';

export const metadata = {
  title: 'About',
  description:
    'Cancer Insight is an independent, educational explorer of cancer research that keeps the original evidence visible and every number reproducible.',
  alternates: { canonical: '/about' },
};

export default function About() {
  return (
    <DocPage
      title="About Cancer Insight"
      intro="An independent, educational explorer of cancer research that keeps the original evidence visible."
    >
      <h2>Why it exists</h2>
      <p>
        Searching for cancer research usually returns a list of papers and little sense of the
        literature around them: how much research exists, what kinds of studies it contains, or how
        a number on a website was produced. Cancer Insight is built to answer those questions while
        keeping every source one click away.
      </p>

      <h2>Principles</h2>
      <ul>
        <li>
          <strong>Evidence stays visible.</strong> Papers link to PubMed, PubMed Central and DOI
          pages; images link to their source and licence.
        </li>
        <li>
          <strong>Every count is reproducible.</strong> Each number is a PubMed search, and its link
          runs the same query.
        </li>
        <li>
          <strong>Description, not judgement.</strong> Cancer Insight never ranks treatments and
          never presents paper counts as evidence of effectiveness.
        </li>
        <li>
          <strong>Limits are stated where results appear,</strong> not only in a policy page.
        </li>
      </ul>

      <h2>What you can do</h2>
      <ul>
        <li>
          <Link href="/explore">Explore</Link> a cancer type: recent papers with evidence types,
          structured abstracts and retraction warnings; the size and study-design mix of its PubMed
          literature; treatment literature and comparisons; scientific images.
        </li>
        <li>
          Build a <Link href="/research-gap-atlas">Research Gap Atlas</Link> to see which designs
          and themes are less represented than across oncology overall.
        </li>
        <li>Save papers in your browser and export them as CSV, RIS citations or a PDF report.</li>
      </ul>

      <h2>What it is not</h2>
      <p>
        Cancer Insight is not a medical service. It does not diagnose, recommend treatments or
        replace a clinician, and research counts must not be used to choose a treatment.
      </p>

      <h2>Sources and independence</h2>
      <p>
        Research data comes from NCBI PubMed and PubMed Central, the Cure Cancer With AI research
        API and Wikimedia Commons. Cancer Insight is independent and is not affiliated with these
        organisations. The <Link href="/methodology">methodology</Link> documents every rule and
        query.
      </p>

      <h2>Contact</h2>
      <p>
        Corrections, broken links and questions are welcome on the{' '}
        <Link href="/contact">contact page</Link>.
      </p>
    </DocPage>
  );
}
