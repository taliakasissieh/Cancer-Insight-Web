const SITE = 'https://www.cancer-insight.com';
const UPDATED = new Date('2026-10-09');

export default function sitemap() {
  return [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/explore', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/research-gap-atlas', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/methodology', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${SITE}${path}`,
    lastModified: UPDATED,
    changeFrequency,
    priority,
  }));
}
