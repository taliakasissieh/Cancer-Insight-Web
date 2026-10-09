# Cancer Insight — Full Platform Audit (October 2026)

Scope: the complete `gap-atlas-v2` branch (PR #1) — every file under `app/` and `lib/` — plus
live behaviour of https://www.cancer-insight.com (which still runs `main`). Live checks were made
on 9 October 2026 against the production API routes and against NCBI E-utilities.

Severity scale: **CRITICAL** (misleading science or broken core promise) · **HIGH** (broken
feature, major trust/SEO/UX problem) · **MEDIUM** (noticeable quality problem) · **LOW** (polish).

The "Resolution" column records what this upgrade did. "Recommended" items need an owner decision
or an external account (they are listed again in `docs/UPGRADE-NOTES.md`).

---

## 1. Evidence from the live site

| Check (pancreatic cancer) | Result |
|---|---|
| `/api/search` — 20 "relevant papers" | **All 20 published in 2026.** `year_counts = {2026: 20}` |
| `/api/gaps` (V1, live) — 28 papers | **All 28 from 2026.** Flags "Limited clinical trials — strong signal" (0 of 28) |
| PubMed: pancreatic-cancer records tagged *Clinical Trial* | **4,034** (1,418 RCTs, 1,695 systematic reviews, 1,581 meta-analyses) |
| `/api/treatment` (chemotherapy) | 14 papers, all Sep–Oct 2026; top hits about fibrinolysis, epigenetics, a rare histotype — PubMed default sort is *most recent*, not relevance |
| `/api/images` | **8.3 s** (48 sequential Wikimedia requests) |
| Author names | `Laura K Kj&#xe6;r`, `Morten Orebo Holmstr&#xf6;m` — numeric XML entities not decoded |
| Titles/abstracts | `Mini GPT-Pancreas`, `lnc RNAs`, `Chat GPT`, `i HD-SBRT` — text "repair" regex splits scientific tokens (also `mRNA → m RNA`, `siRNA → si RNA`) |

The main research feed (third-party research API) returns the newest records, so every downstream
metric computed on it (timeline, "latest year", trial counts, Gap Atlas V1) describes *this
month's papers*, not the literature.

---

## 2. CRITICAL

| ID | Area | Finding | Resolution |
|---|---|---|---|
| C1 | Gap Atlas | Study-design and topic "gap signals" are computed on a tiny, recency-skewed sample (live: 28 papers, all 2026) and presented as "strong signals". Pancreatic cancer is flagged for "0 clinical trials" although PubMed indexes 4,034. | **Method 3.0**: coverage is measured with PubMed-wide record counts, compared with an all-oncology baseline, every number linked to its exact PubMed query. |
| C2 | Gap Atlas V2 | Treatment-focused PubMed papers (≤50, deliberately enriched for the top-5 treatments) are mixed into the general topic and study-design denominators, inflating trial/treatment shares. | Treatment queries no longer feed any general denominator. Treatment distribution is a separate, count-based table with no signals. |
| C3 | Gap Atlas V2 | "Treatment distribution" signal is circular: the top-5 treatments receive +10 query-tagged papers each, so every other treatment is flagged "lower volume" by construction. | Removed. Treatment categories are described (records co-mentioning each) and explicitly *not* flagged — relevance differs by cancer biology. |
| C4 | Gap Atlas V2 | "Recent literature" signal and "Recent papers %" metric are produced by the sampling design (one of four windows *is* the recent window; base set is recent-only). | Recency is now a relative measure: share of the cancer's PubMed records published in the last 3 years vs the same share oncology-wide. |
| C5 | Gap Atlas V2 | `slice(0, 100)` after concatenating base (≤60) + windows (≤72) + treatment (≤50) silently drops whole strata (often all treatment papers and part of the historical window). | Inspectable sample is balanced per window and never truncated across strata; its statistics are labelled as sample statistics. |
| C6 | Analytics | "Publication Timeline", "Latest year" and "Clinical trials" describe 20 recent-feed papers (one bar: 2026) but are labelled as publication patterns for the cancer. | Replaced by an **Evidence Landscape**: PubMed records per publication year and study-design composition (true counts), clearly separated from "recent feed" statistics. |
| C7 | Compare Treatments | Compares capped retrieval counts (≈ limit 12 + a few tagged papers) as "Unique evidence papers" — the numbers are artefacts of the request limit. Example papers are labelled "Supporting PubMed Evidence". | Comparison now uses PubMed record counts for each cancer × treatment query, design composition and shares; examples use Best Match and are labelled "Example records". |

## 3. HIGH

| ID | Area | Finding | Resolution |
|---|---|---|---|
| H1 | Transparency | The primary data source (a third-party research API that supplies candidate records and treatment tags) is never disclosed; methodology says only "its search system". | Disclosed on Methodology, Privacy, About, in exports and in the UI provenance line. |
| H2 | Data quality | `cleanPubMedText` inserts spaces inside scientific tokens (`mRNA→m RNA`, `lncRNA→lnc RNA`, `MiniGPT→Mini GPT`) and collapses spaced dashes. | Harmful regexes removed; numeric/named entities decoded for authors, journals, titles. |
| H3 | Data quality | Numeric XML entities in author names are not decoded (`Kj&#xe6;r`). | Fixed (entity decoding on every parsed field). |
| H4 | Treatment research | PubMed treatment query uses default sort (most recent) and `"<cancer> cancer"[tiab]` — "leukemia cancer", "breast cancer cancer", "melanoma cancer" phrases fail and fall back to word AND, missing most haematological/melanoma literature. | Shared cancer query builder (MeSH heading + synonym phrases) and treatment term maps; Best Match ordering. |
| H5 | NCBI usage | No `tool`/`email`/`api_key` parameters, no rate limiting, no retry; Gap Atlas fires 4–10 parallel E-utility requests (NCBI limit: 3/s without key) and silently returns `[]` on 429. | `lib/pubmed.js`: rate limiter (3/s, 9/s with `NCBI_API_KEY`), retry with back-off, registered tool/email, cached counts. |
| H6 | Broken feature | Save buttons in Compare Treatments render but do nothing (`toggle={() => {}}`). | All paper cards share one saved-papers store. |
| H7 | Broken feature | Saved papers persist only IDs; papers saved in an earlier search can never be shown again. | Saved papers store a metadata snapshot; new **Saved** view with CSV/RIS export across searches. |
| H8 | IA / UX | Entire explorer is one client component with tab state: no URLs per section, back button leaves the site, refresh loses the search, results cannot be shared or bookmarked. | `/explore?cancer=…&view=…` with history support; landing page at `/`. |
| H9 | SEO | Root layout sets `alternates.canonical: '/'`; Methodology, FAQ, Privacy, Contact and Terms inherit it, telling search engines they are duplicates of the homepage. | Per-page canonical URLs. |
| H10 | SEO | Page titles duplicate the brand: `title: 'FAQ \| Cancer Insight'` + template `'%s \| Cancer Insight'` → "FAQ \| Cancer Insight \| Cancer Insight". | Titles fixed. |
| H11 | Performance | `/api/images` runs up to 48 Wikimedia searches **sequentially** with `no-store` (8.3 s live) and is re-requested every time the Images tab is opened. | 4 parallel searches, server cache (24 h), client cache per cancer. |
| H12 | Performance | `jspdf` (~350 kB) is statically imported into the main client bundle. | Loaded on demand when a report is generated. |
| H13 | Misleading UI | Titles render "Breast Cancer Cancer", "Leukemia Cancer" (`${title(cancer)} Cancer`). | Display names come from the cancer query builder. |
| H14 | Privacy | Policy does not state that search terms are sent server-side to the third-party research API, NCBI and Wikimedia; it contains internal drafting notes ("should be updated…", "should be changed…"). | Rewritten; Global Privacy Control / Do-Not-Track respected for Google Analytics. |
| H15 | Classification | "Clinical trial" = substring `clinical trial`, so RCTs indexed only as *Randomized Controlled Trial* are not counted; *Clinical Trial Protocol* and *Clinical Trial, Veterinary* are counted as trials. Three different copies of this logic exist (client, `lib/relevance`, `lib/gaps`, `lib/research`). | One shared classifier (`lib/evidence.js`) used by server, client, exports and reports. |
| H16 | API safety | `/api/treatment` accepts an unbounded `limit` (passed to `retmax`/`efetch`) and arbitrary strings; error messages from internals are returned to users. | Input validation, length limits, clamped limits, generic error messages. |

## 4. MEDIUM

| ID | Area | Finding | Resolution |
|---|---|---|---|
| M1 | Relevance | Substring matching without word boundaries (`ards` matches "towards"/"standards"; `hcc`, `rcc` inside other tokens). | Word-boundary matching. |
| M2 | Images | Block list substring `bus` rejects *thrombus* (common in HCC/RCC), `event` rejects *prevention*; licence shown without licence link (CC BY/BY-SA require attribution + licence reference). | Word-boundary rules; licence links and attribution line. |
| M3 | Gap Atlas UI | "Strong signal" wording implies strength of evidence for a gap; "Research Activity by Year" on a stratified sample; 2-digit year labels. | "Much lower / lower representation"; "Sampled papers by window"; full years. |
| M4 | Gap Atlas | Population topics flagged without epidemiological context (e.g. "low pediatric coverage" for prostate cancer). | Context rule: expected-low population topics are shown as "explained by epidemiology", not signals. |
| M5 | Repetition | Treatment bars appear on the homepage results and again in Analytics; Methodology, FAQ, Terms and About repeat the same paragraphs (duplicate handling, filters, relevance notes…). | Each fact lives in one place; FAQ grouped and shortened; Terms reduced to terms. |
| M6 | Overlap | Treatment Research and Compare Treatments are two tools over the same endpoint and data. | Merged into one **Treatments** view with a compare mode. |
| M7 | Exports | CSV has no provenance (query, source, date), no protection against spreadsheet formula injection; PDF report has no generation date or query. | CSV/RIS/JSON/PDF include query, source, retrieval date and method version; cells starting with `= + - @` are neutralised. |
| M8 | Duplicate requests | Treatment and Compare refetch every time their tab is reopened; images too. | Client-side request cache keyed by cancer/treatment. |
| M9 | Accessibility | Nav buttons without `aria-current`; results/errors not announced (`aria-live`); decorative glyphs (✚ ⌕ ▥ ⇄ ●) read aloud; focus outline at 22 % opacity (fails 3:1); muted text `#6e8796` on `#eef4f7` ≈ 3.4:1 (fails AA for body text); bar charts have no text alternative. | Fixed across components. |
| M10 | Mobile | Sidebar collapses into a horizontally scrolling strip of 8 buttons with hidden scrollbar; search form appears below a large hero. | New header + compact workspace tabs; search in the first screen. |
| M11 | Metadata | No Open Graph image; `twitter: summary_large_image` without an image; keyword stuffing in `keywords`. | OG image added; keywords trimmed. |
| M12 | Structured data | No `FAQPage`, `BreadcrumbList`, `Dataset`/`WebApplication` markup. | FAQPage + WebApplication + breadcrumbs added. |
| M13 | Content | "Why this paper is relevant" makes generic statements ("The abstract contains research context returned…"). | Provenance line states the actual match (title/MeSH/keywords), source and tags. |
| M14 | Security headers | No `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame protection. | `next.config.mjs` headers. |
| M15 | Papers | Abstract shown as one paragraph even when PubMed provides structured sections (BACKGROUND/METHODS/RESULTS). | Structured abstracts rendered with section labels. |

## 5. LOW

| ID | Finding | Resolution |
|---|---|---|
| L1 | Empty route file `app/api/test-cancers/route.js`. | Removed. |
| L2 | Typography: system Arial everywhere; numbers not tabular. | Type system (Source Serif 4 / IBM Plex Sans / IBM Plex Mono) via `next/font`. |
| L3 | Emoji/glyph icons (★ ☆ ✚ ⌕) render inconsistently across platforms. | Inline SVG icon set. |
| L4 | Code formatted one token per line (6,500-line `page.js`), hard to maintain. | Split into components and libraries; Prettier config. |
| L5 | `UPGRADE_NOTES.txt` describes an older ZIP workflow. | Replaced by `docs/UPGRADE-NOTES.md`. |
| L6 | Search hint markup `<b>leukemia</b>,<b> melanoma</b>` spacing. | Replaced by example chips. |
| L7 | `fullTextUrl` from the research API is malformed (`…/articles/PMC/`). | Not used; PMC links are built from PubMed IDs. |

---

## 6. What was deliberately *not* added

Ideas considered and rejected because they would duplicate existing information or could not be
supported by the available data:

- **Evidence-quality scores / GRADE-like ratings** — publication type is not evidence certainty;
  any score would imply clinical judgement the data cannot support.
- **"Trending treatments" / momentum rankings** — growth in records conflates indexing growth with
  research activity and invites "more papers = better" readings.
- **AI-generated summaries of papers** — would place unverifiable text next to primary sources.
- **Separate "Research Analytics" page** — its useful content now lives in the Overview's Evidence
  Landscape; a second page would repeat it.
- **Per-treatment gap signals** — treatment relevance depends on cancer biology (e.g. hormone
  therapy in pancreatic cancer), so low counts are not interpretable as gaps.
