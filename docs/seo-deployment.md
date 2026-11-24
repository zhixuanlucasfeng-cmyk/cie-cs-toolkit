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

- Production commits: `703602a` initial static SEO build, `7a1c7d7` root query headers and error alias fixes; final follow-up preserves native link semantics in the rail.
- Local core checks: 257/257. SEO artifact checks: 3/3. Browser checks: 21/21 locally and 21/21 against https://dryruncs.com after deployment.
- All six sitemap URLs: HTTP 200, unique canonical and title. CSS, JS, share image and Vercel analytics script: HTTP 200. Fonts use the system font stack, no external font request.
- `www.dryruncs.com` Vercel domain setting changed from 307 to 301; path is preserved. Old `cie-cs-toolkit.vercel.app` host uses 301. HTTP to HTTPS, HTML suffixes and trailing slash normalization use platform 308 redirects.
- Unknown URLs return HTTP 404. The error-document alias `/404` permanently redirects to `/page-not-found`, which returns 404.
- Settings/progress/practice/onboarding and the root self-test query have verified noindex response headers. Root-specific header rules are explicit because the wildcard header did not cover the root in production testing.
- Google ownership: verified via HTML tag using the user's signed-in account.
- Sitemap: submitted 2026-11-24, last read 2026-11-24, status Success, 6 discovered pages. Discovery does not mean all six are indexed.
- Homepage URL inspection: already indexed by Google. New live test at 08:35 Dubai time on 2026-11-24: URL can be indexed. Requested indexing afterwards; Google confirmed the URL was added to the priority crawl queue.
- Updated content/re-ranking and indexing of the other five URLs remain Google's asynchronous decisions. No claim of a target keyword position.
- No login or app API exists in the active configuration; optional sync remains disabled. An invalid `/api/` URL returns 404. No secrets were added, and no DNS or domain registration details changed.
- Production functional tests created test traffic on 2026-11-24; do not report those visits as organic growth or cumulative users.
- Browser screenshots and HTTP/test evidence are saved locally in `outputs/seo-2026-11-24/` in the original workspace. They are not in the deployed static output.
