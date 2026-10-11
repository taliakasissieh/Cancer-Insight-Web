import { CANCERS } from '../lib/queries';
import { localePath } from '../lib/i18n/index.js';

const SITE = 'https://www.cancer-insight.com';
const UPDATED = new Date('2026-10-11');

const PAGES = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/explore', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/cancers', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/research-gap-atlas', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/cancer-map', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/research-vs-burden', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/methodology', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/data', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  ...Object.keys(CANCERS).map(id => ({
    path: `/cancers/${id}`,
    priority: 0.7,
    changeFrequency: 'weekly',
  })),
];

/* Every page in both languages, each entry listing its counterpart (hreflang). */
export default function sitemap() {
  return PAGES.flatMap(({ path, priority, changeFrequency }) => {
    const languages = {
      en: `${SITE}${localePath('en', path)}`,
      ar: `${SITE}${localePath('ar', path)}`,
    };
    return ['en', 'ar'].map(locale => ({
      url: languages[locale],
      lastModified: UPDATED,
      changeFrequency,
      priority: locale === 'en' ? priority : Math.round(priority * 0.9 * 10) / 10,
      alternates: { languages },
    }));
  });
}
