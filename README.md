# Cancer Insight — Direct Domain Web Version

This is the JavaScript/Next.js conversion of the existing Streamlit Cancer Insight project. It is designed for direct deployment on Vercel with a custom domain such as `cancer-insight.com`.

## Important fix
Cancer type searches are normalized to lowercase on both the client and server. `lung`, `Lung`, `LUNG`, and ` lung ` therefore send the same normalized API query.

## Local setup
1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Put the private key in `CANCER_RESEARCH_API_KEY`.
5. Run `npm run dev`.

## Vercel
Import this repository into Vercel. In Project Settings → Environment Variables, add `CANCER_RESEARCH_API_KEY` (do not prefix it with `NEXT_PUBLIC_`). Redeploy after adding the variable. Then add `cancer-insight.com` under the project's Domains settings and enter the DNS records Vercel gives you in GoDaddy.
