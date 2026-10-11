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
  them says otherwise, edit `FEED_SOURCE` in `lib/research.js` and the text in the methodology,
  privacy and about pages (English under `app/(site)/`, Arabic under `app/ar/`) and
  `app/_components/SiteFooter.js`.
- **Analytics opt-out.** Google Analytics no longer loads for browsers that send Global Privacy
  Control or Do Not Track (`app/_components/Analytics.js`). Remove the check if you prefer.
- **Privacy policy statements** about hosting logs and data use describe a typical Vercel setup;
  confirm they match how you operate the site.
- **Saved-paper migration.** Papers saved with the old site (IDs only) are restored automatically
  the first time someone opens the Saved view.

## Ideas not built (and why)

Both ideas listed here in the first release — per-cancer pages and a cross-cancer map — were
built in the 11 October release below.

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

## New features — 11 October 2026 (PR #3)

Everything below ships in one pull request, on top of the fixes above.

| Feature | Where | What it does |
| --- | --- | --- |
| **Trial tracker** | Explorer → Trials tab, `/api/trials` | Every ClinicalTrials.gov study for a cancer, counted from one downloaded list: study types, where trials stand, phases, sponsors, countries, start years, open trials, and **completed trials without results posted ≥ 24 months later**. CSV of every counted study. |
| **Research vs burden** | `/research-vs-burden`, `/api/burden` | Each cancer's share of the last five complete years of PubMed research compared with its share of deaths and new cases worldwide (GLOBOCAN 2024, IARC). Ratio plot, scatter, table, CSV. |
| **All-cancer map** | `/cancer-map`, `/api/map` | All 29 catalogue cancers × every Gap Atlas measure (Method 3.0) in one table, coloured on a diverging scale, every cell linked to its PubMed search. CSV. |
| **Cancer profiles** | `/cancers`, `/cancers/<id>` (29 pages) | One page per cancer: literature, coverage signals, trials, burden, retractions, links to every tool. Server-rendered for search engines, with structured data. |
| **Retraction watch** | Profiles, Overview, `/api/retractions` | Number and rate of retracted PubMed records for a cancer, and the newest ones. |
| **Open data** | `/data`, `GET /api/*` | Stable JSON/CSV addresses for every analysis, with citation text and the source terms. |
| **Arabic edition** | `/ar/...` | Every page, right to left, with Arabic fonts (IBM Plex Sans Arabic, Noto Naskh Arabic), Arabic cancer-name search, Arabic plurals, Western digits, charts kept left to right, `hreflang` alternates and an Arabic sitemap. |

Also changed:

- **Head and neck cancer query** now uses mouth, otorhinolaryngologic and salivary gland
  headings instead of "Head and Neck Neoplasms", which also pulled in thyroid, oesophageal and
  eye tumours. Its counts are lower than before; this is noted in the methodology's version
  history.
- **Methodology, FAQ, about, contact, privacy and terms** describe the new features; the tables
  in the methodology are generated from the code (`app/_components/methodology/Tables.js`).
- **Privacy policy** lists ClinicalTrials.gov as a service that receives the cancer name.
- **Terms** have a new open-data section and replace the blanket ban on automated use with a
  light rate limit (about one request per second).
- **Sitemap** lists every page in both languages (84 URLs), with language alternates.
- **RTL fixes** in shared CSS: logical properties for search icon, skip link, paper markers,
  table alignment and share values.

### How this release was verified

- 53 unit tests (`npm test`), including trial counting, burden arithmetic against the GLOBOCAN
  totals, image relevance rules, and dictionary parity between English and Arabic.
- GLOBOCAN 2024 figures were transcribed from the IARC world fact sheet (released September 2026)
  and checked twice against it.
- Every API route was bundled and run against mocked PubMed, ClinicalTrials.gov, research-feed
  and Wikimedia services, including outages and the oncology-baseline snapshot fallback.
- In Chromium, 22 pages × 2 languages × 2 widths (360 px and 1280 px): no page errors, no
  sideways scrolling, no untranslated dictionary keys and no untranslated English prose on Arabic
  pages (paper titles and abstracts are kept in their original language on purpose).
- 17 English interaction flows and 6 Arabic flows (Arabic search → explorer, trials tab, language
  switch keeping the search, Arabic suggestions, profile, FAQ).

### Your decisions for this release

- **Arabic text review.** The Arabic was written carefully but has not been reviewed by a native
  speaker with medical training. Please have one read the home page, the explorer, the
  methodology and the legal pages. The Arabic privacy policy and terms say the English version
  applies if the two differ.
- **GLOBOCAN reuse.** IARC allows its estimates to be reproduced with citation but not retrieved
  systematically to build another database without permission. The site uses about 30 published
  figures, cites IARC on every page that shows them, and passes the same terms on through
  `/api/burden`. If you want certainty, ask IARC for permission, or remove `/api/burden` from
  the open-data list.
- **Open data and server cost.** The `GET` addresses are cached for an hour at the edge and a
  day on the server, but a cold `/api/map?cancer=…` call makes 16 PubMed requests (32 if the
  oncology baseline is not cached yet). If usage grows, add a rate-limit rule in Vercel's
  firewall.
- **Preview protection.** You turned on a shareable link for the preview deployment while we were
  testing; switch it off again in Vercel (Settings → Deployment Protection) and keep protection
  on.

### Check after merging

- [ ] `/cancer-map` fills in (the first build takes a minute or two; later visits are fast)
- [ ] `/research-vs-burden` shows the ratio plot and table
- [ ] `/explore?cancer=mesothelioma&view=trials` shows trial figures; the CSV opens in a spreadsheet
- [ ] `/cancers/pancreatic` shows all five cards
- [ ] `/ar` and `/ar/explore?cancer=سرطان الثدي` read right to left; the English/العربية link keeps the search
- [ ] Google Search Console: resubmit `sitemap.xml`
