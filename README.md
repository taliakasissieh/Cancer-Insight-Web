# Cancer Insight

Cancer Insight is an independent educational cancer research explorer built with Next.js. It helps users discover and inspect cancer research literature while keeping original scientific sources visible.

## Current features

- Cancer research search with PubMed enrichment
- Research-paper deduplication and relevance filtering
- Study-type and year-range filters
- Treatment Research
- Compare Treatments
- Research Analytics
- Scientific cancer images
- Saved papers in browser local storage
- PDF research reports and CSV exports
- Methodology, FAQ, Privacy, Contact, and Terms pages
- Google Analytics event tracking
- **Cancer Research Gap Atlas**

## Cancer Research Gap Atlas

The Research Gap Atlas is an experimental research-exploration layer that looks for low-coverage signals inside a retrieved cancer-literature dataset.

It analyzes:

- clinical-trial and review coverage
- randomized controlled trial coverage
- predefined research-topic visibility
- treatment-tagged literature distribution
- publication recency
- free-full-text accessibility
- metadata completeness

Every signal exposes its numerical basis and a caution. A signal is **not proof of a true scientific or clinical gap**, does not rank treatments, and should be treated as a prompt for further investigation.

The main files are:

- `app/research-gap-atlas/page.js`
- `app/research-gap-atlas/GapAtlasClient.js`
- `app/api/gaps/route.js`
- `lib/gaps.js`
- `lib/relevance.js`

## Local setup

1. Install Node.js 20+.
2. Run `npm install`.
3. Create `.env.local`.
4. Add `CANCER_RESEARCH_API_KEY=<your private key>`.
5. Run `npm run dev`.

## Production / Vercel

Import the repository into Vercel and add `CANCER_RESEARCH_API_KEY` in Project Settings → Environment Variables. Do not prefix the variable with `NEXT_PUBLIC_`. Redeploy after changing environment variables.

The production domain is intended to be:

`https://www.cancer-insight.com`
