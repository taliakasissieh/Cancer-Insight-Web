# Cancer Insight

Cancer Insight is an independent, educational explorer of cancer research literature, built with
Next.js. It shows what research exists while keeping the evidence trail visible: every PubMed count
links to the exact query that reproduces it.

It is not a medical tool. It does not diagnose, recommend treatments or give medical advice.

## What it does

| Area                                             | Route                          | What it shows                                                                                               |
| ------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Landing                                          | `/`                            | Search, a worked example, how numbers are produced, limits                                                  |
| Explore → Overview                               | `/explore?cancer=…`            | PubMed records per year and by study design (linked counts); recent-research summary                        |
| Explore → Papers                                 | `…&view=papers`                | Recent research feed or PubMed Best Match; evidence types, retraction warnings, filters, CSV/RIS/PDF        |
| Explore → Treatments                             | `…&view=treatments`            | Literature per treatment category, or two side by side (never effectiveness)                                |
| Explore → Images                                 | `…&view=images`                | Wikimedia Commons images with licence attribution                                                           |
| Explore → Saved                                  | `/explore?view=saved`          | Reading list stored in the browser, exportable                                                              |
| Research Gap Atlas                               | `/research-gap-atlas?cancer=…` | Method 3.0: shares of PubMed records vs oncology overall, forest-plot profile, inspectable sample, CSV/JSON |
| Methodology, FAQ, About, Privacy, Terms, Contact |                                | Generated in part from the same query definitions as the code                                               |

## Architecture

```
lib/queries.js       cancer catalogue, PubMed query builder, designs, themes, treatments (isomorphic)
lib/evidence.js      publication-type classifier and paper-set statistics (isomorphic)
lib/relevance.js     cancer-relevance check with a recorded explanation
lib/pubmed.js        NCBI E-utilities client: rate limit, retries, cached counts/records (server)
lib/pubmed-parse.js  PubMed XML parsing without altering scientific text (pure)
lib/research.js      research feed + PubMed fallback, footprint counts, treatment profiles (server)
lib/gaps.js          Research Gap Atlas Method 3.0 (server)
lib/client/*         browser helpers: API cache, saved papers, exports, PDF report, analytics
app/api/*            search, papers, footprint, treatment, gaps, images, records
app/_components/*    UI components (explorer views, forest plot, year chart, paper item…)
tests/*.test.mjs     unit tests for the pure modules (node --test)
docs/AUDIT.md        full audit with findings and resolutions
docs/UPGRADE-NOTES.md deployment and verification checklist
```

## Local setup

1. Install Node.js 20.19+ (or 22+).
2. `npm install`
3. Create `.env.local`:
   ```
   CANCER_RESEARCH_API_KEY=<research feed key>
   NCBI_API_KEY=<free NCBI key — strongly recommended>
   ```
4. `npm run dev`, then open http://localhost:3000
5. `npm test` runs the unit tests.

Without `CANCER_RESEARCH_API_KEY` the site still works: searches fall back to PubMed (no
treatment tags). Without `NCBI_API_KEY` PubMed requests are limited to 3 per second, so a first
Gap Atlas run takes roughly 10–15 seconds instead of 3–5.

## Production (Vercel)

Add both environment variables in Project Settings → Environment Variables (never prefix them with
`NEXT_PUBLIC_`), then redeploy. API routes declare `maxDuration` of 30–60 seconds. PubMed counts,
record lists and image searches use the Next.js data cache (up to 24 hours).

The production domain is `https://www.cancer-insight.com`.
