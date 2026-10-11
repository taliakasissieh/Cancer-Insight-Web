import Link from 'next/link';
import DocPage from '../_components/DocPage';
import Icon from '../_components/Icon';
import { languageAlternates, localePath } from '../../lib/i18n/index.js';
import { FAQ } from './faq-content.js';

const PATH = '/faq';
const ARABIC = /[؀-ۿ]/;

export function faqMetadata(locale) {
  const c = FAQ[locale] || FAQ.en;
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: localePath(locale, PATH), languages: languageAlternates(PATH) },
  };
}

export default function FaqPage({ locale = 'en' }) {
  const c = FAQ[locale] || FAQ.en;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: c.groups.flatMap(g =>
      g.items.map(i => ({
        '@type': 'Question',
        name: i.q,
        acceptedAnswer: { '@type': 'Answer', text: i.a },
      }))
    ),
  };
  return (
    <DocPage
      title={c.title}
      intro={c.intro}
      locale={locale}
      toc={c.groups.map(g => ({ id: g.id, label: g.title }))}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {c.groups.map(g => (
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
                    <Link
                      href={i.link[0].startsWith('/ar') ? i.link[0] : localePath(locale, i.link[0])}
                      {...(locale !== 'ar' && ARABIC.test(i.link[1])
                        ? { lang: 'ar', dir: 'rtl' }
                        : {})}
                    >
                      {i.link[1]}
                    </Link>
                  </p>
                )}
              </div>
            </details>
          ))}
        </section>
      ))}
      <p style={{ marginTop: 40 }}>
        {c.more} <Link href={localePath(locale, '/contact')}>{c.contact}</Link>.
      </p>
    </DocPage>
  );
}
