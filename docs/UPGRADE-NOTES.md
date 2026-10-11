# Upgrade notes — October 2026

This upgrade sits on top of the `gap-atlas-v2` branch (PR #1). See `docs/AUDIT.md` for every
finding and how it was resolved.

## Before you deploy

1. **Get a free NCBI API key** (https://account.ncbi.nlm.nih.gov/settings/ → API Key Management)
   and add it as `NCBI_API_KEY`. It raises PubMed's limit from 3 to 10 requests per second; the
   Overview, Treatments and Gap Atlas make 10–45 count requests on a cold cache.
2. Keep `CANCER_RESEARCH_API_KEY` as before.
3. Run `npm install`, `npm test` and `npm run build` locally (or let Vercel build a preview).
   The build could not be run in the environment where this upgrade was written (no npm registry
   access); everything else was verified as described below.

## Verify on the preview deployment

- [ ] `/` loads; searching “pancreatic cancer” opens `/explore?cancer=pancreatic%20cancer`
- [ ] Overview shows the PubMed total, yearly bars and study designs; clicking a number opens PubMed with the same count (± a few)
- [ ] Papers: switch to PubMed Best Match; filter by evidence type; save a paper; copy a citation; download CSV, RIS and PDF
- [ ] Treatments: pick a category; switch to “Compare two”
- [ ] Images load with licence links
- [ ] `/explore?cancer=thyroid` works (PubMed fallback — the feed does not cover thyroid)
- [ ] `/research-gap-atlas?cancer=pancreatic` shows survivorship as the only signal and pediatric as “expected”
- [ ] Back/forward buttons move between explorer views
- [ ] Share preview (e.g. https://www.opengraph.xyz) shows the new image
- [ ] Google Search Console: resubmit `sitemap.xml`; the old pages no longer canonicalise to `/`

## How it was verified

- 24 unit tests (`npm test`) on the query catalogue, evidence classifier, relevance filter and the
  PubMed XML parser, using real PubMed XML (non-ASCII authors, structured abstracts, superscripts).
- Every API route was bundled and run against mocked NCBI / research-feed / Wikimedia services:
  natural inputs, fallback, outages (503), 429 retry, rate-limit spacing, input limits.
- PubMed query syntax and the oncology baseline were checked against the live E-utilities API on
  9 October 2026.
- The full UI was rendered in Chromium (desktop 1440 px and mobile 390 px) and 17 interaction
  flows were exercised (search, tabs/back button, save, citation, CSV/RIS/PDF, filters, Best
  Match, treatments, compare, saved-paper migration, atlas exports, error/retry, keyboard skip
  link, mobile menu) with no page errors.

## Your decisions

- **Naming the research feed provider.** Methodology, privacy and the UI now name the Cure Cancer
  With AI research API as the source of recent records and treatment tags. If your agreement with
  them says otherwise, edit `FEED_SOURCE` in `lib/research.js` and the text in
  `app/methodology/page.js`, `app/privacy-policy/page.js`, `app/about/page.js` and
  `app/_components/SiteFooter.js`.
- **Analytics opt-out.** Google Analytics no longer loads for browsers that send Global Privacy
  Control or Do Not Track (`app/_components/Analytics.js`). Remove the check if you prefer.
- **Privacy policy statements** about hosting logs and data use describe a typical Vercel setup;
  confirm they match how you operate the site.
- **Saved-paper migration.** Papers saved with the old site (IDs only) are restored automatically
  the first time someone opens the Saved view.

## Ideas not built (and why)

- Per-cancer landing pages (`/cancer/pancreatic`) rendered on the server would help SEO; they
  need a decision on how often to refresh PubMed counts.
- A cross-cancer theme map (all cancers × all atlas measures) is possible with the same counts
  but would need roughly 15 cached requests per cancer.

## Follow-up fixes — 11 October 2026

Found by checking the live site on a phone after the upgrade was merged:

- **Images tab showed pictures that were not of the searched cancer** (for pancreatic cancer: an
  inguinal hernia CT, a head-and-neck cancer PET and pancreatic tuberculosis). They passed because
  the cancer was named only in the Commons source credit. The cancer must now be named in the
  file's own title or description; titles about a look-alike condition, a device or a different
  tumour are rejected. Rules and tests: `lib/images.js`, `tests/images.test.mjs`. The image cache
  key was bumped so old results are not reused.
- **Treatments → Compare two made the whole page scroll sideways on phones.** Wide tables now
  scroll inside their own box, share notes can wrap, and table spacing is tighter below 560 px,
  so the three-column comparison fits a 360 px screen.
