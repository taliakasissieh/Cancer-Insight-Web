export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: 'https://www.cancer-insight.com/sitemap.xml',
  };
}
