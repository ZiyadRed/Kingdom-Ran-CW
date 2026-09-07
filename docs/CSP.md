# Content Security Policy

`vercel.json` prepares **Content-Security-Policy-Report-Only** for the static
site. It does not enable enforcement. Existing cache headers, `nosniff`,
Referrer-Policy, Permissions-Policy and `X-Frame-Options: DENY` remain intact.
This is defense in depth for future unsafe content; the audit did not establish
an existing XSS exploit.

## Resource inventory

| Resource | Existing caller and policy requirement |
| --- | --- |
| Application scripts | `main.jsx`, built route modules and route preloads load from the same origin. `script-src 'self'` needs neither inline execution nor eval. |
| Analytics | The installed `@vercel/analytics` production SDK injects `/_vercel/insights/script.js`. The default same-origin script/beacon contract fits script/connect `'self'`. The local test intercepts these requests; the hosted script and beacon service still need public verification. |
| Styles | Built stylesheets are same-origin. The Google Fonts stylesheet in `index.html` uses `https://fonts.googleapis.com`. Prerendered React markup contains inline `style` attributes, requiring the current style-only `'unsafe-inline'` allowance. This does not allow inline scripts. |
| Fonts | Barlow and Oswald font files from the Google stylesheet use `https://fonts.gstatic.com`. Japanese/Arabic system fallbacks need no additional network origin. |
| Artwork | Existing WebP/JPG/PNG/SVG assets, icons, guide figures and hero preloads are same-origin. No `data:` image source is needed by the current application. |
| Share previews | `pages.jsx` creates object URLs from the real character/team canvas blobs. Preview images require `img-src blob:`. `share.js` downloads the blob with an anchor; downloading is checked separately from image loading. |
| Structured data | `#ranhq-schema` is a non-executable `application/ld+json` data block. Prerendering and the `seo.js` text-content update work without an inline-script exception. |
| Manifest and remaining resources | The same-origin manifest falls under `default-src 'self'`. No external workers, embeds, media or application API are required by the inspected app. |

The remaining directives disable objects, restrict base/form destinations to the
same origin, and report framing attempts, consistent with the existing enforced
`X-Frame-Options: DENY`. External links to community sites are ordinary navigation
and do not need a script, image or connect allowance.

## Local validation

Run a production build, then `npm run test:browser -- --grep CSP`.
The normal `check:release` command also includes these tests.
The built-output server reads the real Vercel header configuration; the test
checks that the report-only header is present and an enforced CSP header is absent.

Each locale exercises Google font responses and loaded font faces, the installed
analytics SDK's script URL with a locally fulfilled script/beacon, a clicked lazy
Guide route with updated JSON-LD, and real character/team image previews and PNG
downloads. A listener installed before the document parses captures
`securitypolicyviolation` events. Accepted healthy flows must have no violations.

A separate negative probe inserts a harmless inline script and an external script
fulfilled entirely inside Playwright at `csp-probe.invalid`. Both must execute
and emit reports with disposition `report`. This detects a missing/dead policy
as well as accidental enforcement. It sends no request to that external host.

Another response-only probe removes the inline-style and blob allowances. Actual
prerendered style attributes and a generated share-preview image must then report
violations while still rendering. This establishes why those allowances exist
without enabling enforcement or replacing real application images with fixtures.

Test production output, not Vite development mode: HMR and development preambles
have different requirements and are not part of the deployed static application.
Do not relax production directives to accommodate development tooling.

Local acceptance on 7 September 2026 passed all 12 dedicated CSP cases and the
full release gate (478 tests in 35 files, lint/source/catalog/build/SEO and 52
browser cases). A separate Chrome sweep covered 120 direct visits across the
four locales at 390px and 1440px: 112 successful routes and eight genuine 404s,
with zero CSP violations. Existing header and cache configuration was compared
structurally with the pre-change version and is unchanged apart from this header.
Evidence and earlier harness failures remain in the audit-remediation work log.

## Reporting and deployment boundary

The local browser listener and console provide reviewable reports without a
backend. No report collector is configured, so this change does **not** collect
or aggregate reports from visitors. No fake `/api/csp-report` endpoint is added.
MDN documents [report-only behavior and reporting configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only)
and the browser's [violation event](https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent).

Before an authorized public trial, confirm the exact Vercel build/root/settings,
keep the policy report-only, and configure a real report destination if aggregate
monitoring is wanted. Review that destination's ownership and data handling, then
add a matching `Reporting-Endpoints` / `report-to` configuration (and a supported
fallback if required). Verify its receipt with a deliberate harmless probe.
Browser inspection remains necessary for major tools, all locales, fonts, artwork,
share previews, HTTP 404/noindex, and the actual hosted analytics script/beacons.
Preview deployment tooling may inject resources absent from production; inspect
those differences without granting blanket production origins.

Enforcement is a separate decision after representative production reports and
critical flows have been reviewed. This task neither publishes the report-only
policy nor enables enforcement. See [release checks](RELEASE.md).
