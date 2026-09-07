# RanHQ release checks

Run from the Git root with Node 24.x and the checked-in `package-lock.json`.
Preserve staged/unstaged ownership. Build and browser evidence must come from the
same final tree. A successful local gate is not evidence of a production deploy.

## Application acceptance

```sh
npm ci
npx playwright install chromium --only-shell
npm run check:release
git diff --check
```

On Linux, add `--with-deps` to the browser install. The release command runs:

1. ESLint over application code, build/localization scripts, browser tests and configs.
2. Source-map and checked-in locale-artifact validators, including exact source hashes.
3. Unit, calculation, identity, corpus and source-artifact tests.
4. Build preflight (sitemap, star-six sync, CW6/catalog validation), Vite build,
   static prerendering and SEO validation.
5. Playwright acceptance against the completed static output.

Inspect generated-file diffs; a build is allowed to generate artifacts but must
not silently replace unrelated owner edits. Do not claim source re-extraction
from these internal checks alone.

## Browser regression scope

`npm run test:browser` uses disposable Chromium contexts, no saved user profile,
no retries and a loopback-only built-output server. Each locale runs direct entry,
saved Builder/Stats/progress hydration and refresh, invalid import/legacy migration/
export/restore, CW6 Enter/Space/art, translated search, native dialog focus,
calculator persistence/locale switching, true 404/recovery and observed chunk
failure/reload. Castle controls additionally run at 320/820/1440 in all four locales.
The standard locale viewport is 390×844.

Hydration holds application scripts until the server-rendered heading is captured,
then checks that the same node survives and that no local-storage write occurs.
The dialog test inspects Chromium's accessibility tree as well as real keyboard
focus. Chunk interception must actually happen. Invalid URLs must return HTTP 404
and `noindex`, then render the localized recovery view. Vercel Analytics calls are
stubbed locally; this suite does not validate the remote analytics service.

To run a focused check, use `npm run test:browser -- --project=ar --grep Castle`.
Failure screenshots, traces and HTML reports are in ignored `test-results/` and
`playwright-report/`. Open traces with `npx playwright show-trace <trace.zip>`.
The framework's [CI guidance](https://playwright.dev/docs/ci) and
[web-server configuration](https://playwright.dev/docs/test-webserver) describe
the underlying runner. CI runs one worker for reproducibility.

For CSS/architecture changes, also inspect screenshots and interactive states at
phone, tablet and desktop sizes in EN/JA/AR/FR. Read rendered Arabic/French;
catalog parity does not establish natural language quality. Check image sharing,
focus return, reduced motion, touch areas and intended gameplay ordering. Compare
route transfer bytes, request counts and waterfalls when changing code boundaries.

## Source-data prerequisite

The [snapshot inventory and verifier setup](SOURCE_SNAPSHOT.md) records exact
hashes, search results, relocation behavior and the future update workflow.
The checked-in provenance is `data/source/_provenance.json`, pinned to
`v8.6.0_20260826_c23b0a22`. Its recorded machine path is
`C:\kingdom_data\decrypted`; that path is mutable and is not itself a snapshot.
The extractor verifies all five master-file hashes and the matching STBL data
before accepting the source. Python 3 plus `msgpack` is needed only for this step.

```sh
python scripts/localization/extract_ja_text.py --verify /path/to/immutable/snapshot
```

The argument may be the directory containing the masters and `master/` STBL child,
or its parent with a `decrypted/` child. `RANHQ_GAME_DATA` supplies the same argument; without either,
`--verify` uses the recorded provenance path. Do not change expected hashes merely
to make a current pull pass. A missing matching historical snapshot is an external
prerequisite and must remain visible in release evidence. Source changes require
intentional snapshot review and all integration gates, including the original-
source verifier, before acceptance.

## CI and deployment

The repository inspection on 6 September 2026 found no GitHub Actions workflows
or check runs on the starting HEAD. GitHub did report a successful Vercel deployment
status. The local Vercel link exists, but remote project settings could not be
read without authentication. No remote settings were changed.

`.github/workflows/acceptance.yml` adds application validation on pull requests,
pushes to `main` and manual dispatch. It installs the locked dependencies and
Chromium, runs `check:release`, and retains failure evidence for seven days.
Its permissions are read-only and it has no deployment step. The historical
raw-source verifier requires the external snapshot and is not silently treated
as passing by CI.

Before publishing, review the final diff and source prerequisite, confirm the
actual Vercel project/root/build/Node settings and required checks, and approve
the specific release tree. After an authorized deploy, verify the deployed
revision, all four locale entry points, representative tools/share flows,
canonical/alternate/sitemap parity, HTTP 404/noindex and cache/security headers.
Record actual results. French local readiness and French production acceptance
are separate observations.

The [French release checklist](FRENCH_RELEASE.md) records pre-existing ownership,
the complete local acceptance scope and the exact public checks for an authorized
release.

The [dependency maintenance record](DEPENDENCY_MAINTENANCE.md) documents the
reviewed versions, advisory preconditions and lockfile scope. Refresh the audit
before a future release; a recorded zero count describes its observation date.

The [CSP inventory and rollout checklist](CSP.md) explains the prepared report-only
header, browser probes, analytics boundary and report-collector prerequisite.
Enforcement requires a separate reviewed deployment after observing real reports.
