# DryRun SEO and deployment

## Source of truth

Production: https://dryruncs.com/ on Vercel project `cie-cs-toolkit`, team `forbiden-colour`, GitHub `main`.
This change started from `da73061`; the downloaded production HTML had the identical SHA-256 `eae5fd6da976b5e36076d6da7d8022b44a2e4b73f0f30e8c3e39e650429a94ec`.
Work was isolated from `codex/stabilize-dryrun` and its unpublished interpreter changes. No learner storage keys or data were migrated.

## Build and routing

Run `npm ci` then `npm test`. Preview with `npm run build && node scripts/serve.cjs`.
Vercel uses `vercel.json`: `npm run build`, output `dist`, no framework server.
`index.html` remains the source, including the `seo-pages` JSON registry. `scripts/build.cjs` generates all pages, shared CSS/JS, sitemap and the error page. Do not hand-edit `dist` or upload an old `index.html` over production.

Public canonical pages:

- `/`: Cambridge pseudocode IDE; stays the default screen.
- `/features`: learning tools and teacher information.
- `/pseudocode-tools`: trace tables, flowcharts and structured English.
- `/logic`: Boolean logic and truth tables.
- `/sql`: local DDL/DML practice.
- `/about`: independence and privacy.

All are pre-rendered with unique title, description, canonical, Open Graph, Twitter metadata and truthful LearningResource/WebPage JSON-LD. Public internal links are real anchors. The main IDE includes visible pseudocode guidance and a runnable example. Rendering does not require a headless-browser build or a new runtime dependency.

`/onboarding`, `/practice`, `/progress`, `/settings` are device-specific, `noindex, follow`, excluded from sitemap. `?selftest` gets an HTTP X-Robots-Tag; the self-test also sets the meta directive. Robots does not block these pages, so crawlers can see noindex. No backend login or private API is configured: optional Supabase SYNC_CONFIG is empty and remains unchanged.

The sitemap regenerates from `index:true` entries on every build. To add a page, add the real view/body and its registry entry, then verify it before setting index:true. No fabricated lastmod dates, ratings or prices.

Existing `#/ide`, `#/lab-pseudocode`, `#/lab-sql`, `#/lab-logic`, `#/settings` and other valid hash routes migrate in the browser using replaceState. Fragments never reach the HTTP server, so this compatibility is client-side, not an HTTP 301. Ordinary old path aliases use 301. HTML suffixes and trailing slashes use Vercel clean-URL canonical redirects. Unrecognised paths return HTTP 404 rather than an app-shell 200.

HTTPS is enforced by Vercel. Preferred host is `dryruncs.com`; www and the old project `.vercel.app` host redirect to it. Preview deployment hosts retain access for testing and declare production canonicals.

## Google Search Console

URL-prefix property: https://dryruncs.com/
Console: https://search.google.com/search-console?resource_id=https%3A%2F%2Fdryruncs.com%2F
Verification uses the Google-generated `google-site-verification` meta tag in the HTML head. This is a public ownership token, not a secret. Keep it in future builds. No DNS record needs to be removed or modified.
Submit https://dryruncs.com/sitemap.xml, then inspect the homepage and request indexing. Submission/processing/discovery/indexing are different states; record the actual result below, not an assumed completion or ranking guarantee.

## Maintenance checks

After deploying: check every sitemap URL returns 200 and its own canonical; inspect redirects, 404, noindex and static assets. Run the browser suite for old URLs, history, saved work, themes, flowchart, SQL, trace tables, small screens and JS-disabled content.
Do not change localStorage keys during SEO work. No secrets are needed for this static build. Deployment output is an explicit allowlist: generated pages, CSS/JS, robots/sitemap and share images; project notes/test output are not served.

## 2026-11-24 verification record

Implementation and local verification in progress. Production and Search Console results will be appended after they are observed.
