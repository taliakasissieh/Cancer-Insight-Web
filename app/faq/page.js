import Link from 'next/link';
import DocPage from '../_components/DocPage';
import Icon from '../_components/Icon';

export const metadata = {
  title: 'Frequently asked questions',
  description:
    'Answers about Cancer Insight: where its research data comes from, what evidence types and counts mean, how the Research Gap Atlas works, saving and exporting papers, and privacy.',
  alternates: { canonical: '/faq' },
};

/* Plain-text answers feed both the page and the FAQPage structured data. */
const GROUPS = [
  {
    id: 'about',
    title: 'About Cancer Insight',
    items: [
      {
        q: 'What is Cancer Insight?',
        a: 'An independent, free, educational explorer of cancer research literature. It shows recent papers, the size and make-up of a cancer’s PubMed literature, treatment literature and research coverage, with every count linked to the PubMed search that produced it.',
      },
      {
        q: 'Can Cancer Insight tell me which treatment is best?',
        a: 'No. It describes published research; it does not evaluate treatments, diagnose or give medical advice. Discuss personal medical decisions with a qualified clinician.',
      },
      {
        q: 'Who is it for?',
        a: 'Students, researchers, journalists and anyone who wants to understand what research exists on a cancer and where the evidence comes from.',
      },
    ],
  },
  {
    id: 'numbers',
    title: 'Sources and numbers',
    items: [
      {
        q: 'Where does the research come from?',
        a: 'From NCBI PubMed and PubMed Central (U.S. National Library of Medicine), a third-party research feed (the Cure Cancer With AI research API) for recent records and treatment tags, and Wikimedia Commons for images.',
        link: ['/methodology#sources', 'Sources in detail'],
      },
      {
        q: 'Why does every number link to PubMed?',
        a: 'So you can check it. Each count is a PubMed search; the link runs the identical query on pubmed.ncbi.nlm.nih.gov.',
      },
      {
        q: 'Why is a number slightly different on PubMed?',
        a: 'Cancer Insight caches counts for up to 24 hours and PubMed adds and re-indexes records daily, so small differences are expected.',
      },
      {
        q: 'Why are the papers in “Recent research” all so new?',
        a: 'Because that list is the newest relevant records — a view of what is new, not a sample of the whole literature. Switch the Papers view to PubMed Best Match to see the most relevant records across all years.',
      },
      {
        q: 'Which cancers have treatment tags?',
        a: 'The research feed covers lung, breast, brain, colorectal, prostate, pancreatic, liver, kidney, melanoma, ovarian, cervical, bladder, gastric and esophageal cancers, leukemia and lymphoma. Other cancers are searched directly in PubMed, without treatment tags.',
      },
    ],
  },
  {
    id: 'papers',
    title: 'Papers and evidence types',
    items: [
      {
        q: 'What do the evidence types mean?',
        a: 'They come from PubMed publication types: for example randomized controlled trial, observational study, systematic review or case report. They describe what kind of record a paper is, not how good it is.',
        link: ['/methodology#evidence-types', 'How evidence types are assigned'],
      },
      {
        q: 'What does “Design not indexed” mean?',
        a: 'The paper is indexed only as a generic “Journal Article”. Many original studies are indexed this way, so it is not a judgement about the paper.',
      },
      {
        q: 'Why do some papers carry a retraction warning?',
        a: 'PubMed marks them as retracted publications. Read the retraction notice before relying on anything in them.',
      },
      {
        q: 'Can I reuse a paper marked “Free full text”?',
        a: 'Not necessarily. Free to read is not the same as free to reuse; check the licence on the publisher or PMC page.',
      },
    ],
  },
  {
    id: 'treatments',
    title: 'Treatment literature',
    items: [
      {
        q: 'If one treatment has more papers or trials, is it better?',
        a: 'No. More records, more trials or more recent records reflect research attention, history and funding — not effectiveness, safety or suitability for anyone.',
      },
      {
        q: 'Why are the example papers on each side of a comparison different?',
        a: 'Each side is a separate PubMed Best Match search. The papers are examples of each literature and are not paired.',
      },
    ],
  },
  {
    id: 'atlas',
    title: 'Research Gap Atlas',
    items: [
      {
        q: 'Does a signal prove a research gap?',
        a: 'No. A signal means a design or theme makes up less than half the share it has across oncology. That can reflect biology, epidemiology, terminology or indexing, so it is a prompt for investigation, not proof of a gap.',
        link: ['/methodology#gap-atlas', 'The method in full'],
      },
      {
        q: 'Why isn’t “children and adolescents” flagged for some cancers?',
        a: 'Cancers that occur mainly in adults are expected to have few pediatric studies, so that measure is shown but not treated as a signal.',
      },
      {
        q: 'Why are treatments never flagged?',
        a: 'Whether a treatment is relevant depends on the biology of each cancer, so a low count cannot be read as a gap.',
      },
      {
        q: 'What changed from the earlier version?',
        a: 'Earlier versions measured coverage inside a small, recent sample of papers, which could, for example, report zero clinical trials for a cancer with thousands. Method 3.0 compares shares across the whole PubMed index with oncology overall, and keeps a sample only to make the queries inspectable.',
      },
    ],
  },
  {
    id: 'saving',
    title: 'Saving and exporting',
    items: [
      {
        q: 'Where are saved papers stored?',
        a: 'Only in your browser. Clearing browser data, private browsing or another device will not show them, so export anything you want to keep.',
      },
      {
        q: 'What can I export?',
        a: 'CSV files with a provenance header, RIS citations for Zotero, EndNote or Mendeley, PDF reports and, for the Gap Atlas, the full evidence as JSON.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    items: [
      {
        q: 'Is what I search private?',
        a: 'Search terms are sent from Cancer Insight’s server to the research sources listed above and are recorded in Google Analytics events unless your browser sends Global Privacy Control or Do Not Track. Search for cancer types, never personal health details.',
        link: ['/privacy-policy', 'Privacy policy'],
      },
    ],
  },
];

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: GROUPS.flatMap(g =>
    g.items.map(i => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    }))
  ),
};

export default function FAQ() {
  return (
    <DocPage
      title="Frequently asked questions"
      intro="Short answers, with links to the methodology where the detail lives."
      toc={GROUPS.map(g => ({ id: g.id, label: g.title }))}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {GROUPS.map(g => (
        <section key={g.id} className="faqGroup" aria-labelledby={g.id}>
          <h2 id={g.id}>{g.title}</h2>
          {g.items.map(i => (
            <details key={i.q} className="faqItem">
              <summary>
                {i.q}
                <Icon name="chevron" />
              </summary>
              <div className="faqAnswer">
                <p>{i.a}</p>
                {i.link && (
                  <p>
                    <Link href={i.link[0]}>{i.link[1]}</Link>
                  </p>
                )}
              </div>
            </details>
          ))}
        </section>
      ))}
      <p style={{ marginTop: 40 }}>
        Still have a question? <Link href="/contact">Contact Cancer Insight</Link>.
      </p>
    </DocPage>
  );
}
