import Link from 'next/link';
import Logo from './Logo';

export default function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="siteFooterInner">
        <div className="footerBrand">
          <Link href="/" className="brand">
            <Logo size={26} />
            <span className="brandName">Cancer Insight</span>
          </Link>
          <p>
            An independent, educational explorer of cancer research literature. Every count links to
            the PubMed search that reproduces it.
          </p>
        </div>

        <nav className="footerNav" aria-label="Footer">
          <div>
            <h2>Tools</h2>
            <ul>
              <li>
                <Link href="/explore">Explore research</Link>
              </li>
              <li>
                <Link href="/research-gap-atlas">Research Gap Atlas</Link>
              </li>
              <li>
                <Link href="/explore?view=saved">Saved papers</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2>Learn</h2>
            <ul>
              <li>
                <Link href="/methodology">Methodology</Link>
              </li>
              <li>
                <Link href="/faq">FAQ</Link>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2>Site</h2>
            <ul>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              <li>
                <Link href="/privacy-policy">Privacy</Link>
              </li>
              <li>
                <Link href="/terms">Terms &amp; disclaimer</Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="footerLegal">
        <p>
          <strong>Educational use only.</strong> Cancer Insight does not diagnose, recommend
          treatments or give medical advice. Discuss health decisions with a qualified clinician.
        </p>
        <p>
          Data: NCBI PubMed and PubMed Central (U.S. National Library of Medicine), the Cure Cancer
          With AI research API and Wikimedia Commons. Cancer Insight is not affiliated with these
          organisations.
        </p>
      </div>
    </footer>
  );
}
