# RanHQ

An unofficial fan archive and planning toolkit for **Kingdom Ran** (キングダム乱),
building on the [original skill archive](https://pirock55.work/souha-skill-archive/).
The local application supports English (`/`), Japanese (`/ja`), Arabic (`/ar`)
and French (`/fr`). Arabic uses RTL text while gameplay formation positions retain
their intended LTR order. Source-verbatim Japanese skill names are intentional.

## Features

- Character and CW6 card archives with localized content search and shared Romaji,
  Japanese and Arabic character-name matching.
- Party Builder with **four attacking and four defending slots**, independently
  saved skill selections, preset teams, buff summaries and share links/images.
- Battle Order, Metawatch, CW Stats, Castle Points, Team Cost and Buff Tracker tools.
- A localized guide and crawlable static HTML, canonical/legacy character URLs,
  locale alternates, sitemaps and genuine 404 documents.

## Local setup

Use **Node.js 24.x** for parity with CI. The declared Vite-compatible minimum is
Node 20.19.x or Node 22.12 and newer (`^20.19.0 || >=22.12.0`); Node 18 and 21
are unsupported. Use the checked-in lockfile. In Windows PowerShell, `npm.cmd`
and `npx.cmd` avoid script execution-policy issues.

```sh
npm ci
npm run dev
```

To test the production build, including real 404 responses:

```sh
npm run build
npx playwright install chromium --only-shell
npm run test:browser
```

`npm run preview:built` serves the completed `dist/` at
`http://127.0.0.1:4188`. The browser runner starts/stops this server itself; do not
run a second instance or rebuild `dist/` during a test. `RANHQ_TEST_PORT` selects
another local port. `npm run preview` remains available for Vite's general preview,
but its SPA fallback is not the HTTP acceptance gate.

## Validation and release

After installing Chromium, run `npm run check:release` for script/source lint,
checked-in source-artifact validation, unit tests, build/prerender/SEO checks and
the browser regression suite. Linux browser setup uses
`npx playwright install --with-deps chromium --only-shell`.

The [release checklist](docs/RELEASE.md) describes browser scope, source
prerequisites, CI and deployment review. Building the existing source artifacts
does not require an emulator. Re-extraction needs the exact pinned historical
master/STBL snapshot; the mutable `C:\kingdom_data` directory is not a substitute.
See the [exact snapshot hashes and availability](docs/SOURCE_SNAPSHOT.md).
The original-source verifier remains a separate mandatory check when changing
source data; document an unavailable historical snapshot explicitly.

Read [content integration rules](docs/CONTENT_INTEGRATION_RULES.md) before adding
game content. Preserve stable IDs, exact Japanese source joins, intentional
ambiguity, all four locales and existing owner changes.

## Saved data

All player choices stay in browser local storage; there is no account/database.

| Storage key | Contents |
| --- | --- |
| `ranhq:party-builder` | Version-1 attacking/defending stable IDs and skill masks |
| `ranhq-cw-stats-v1` | Version-1 per-character inputs and team IDs |
| `ranhq:castle-points` | Version-1 independent boards, mode, alliance names/counts and carried scores |
| `ranhq:team-cost` | Version-1 four stable IDs and completed-skill counts |
| `ranhq-progress-v3` | CW6 ownership, scene-card ownership/stars and authored buff-source IDs |
| `ranhq-progress-v3:before-import` | Recoverable exact raw progress snapshot before the latest import/restore |
| `ranhq-locale` | Explicit language preference |

Progress Export/Import covers its four progress buckets; it does not back up
Builder or calculator drafts. Import accepts the exact version-1 export envelope
or exact four-bucket raw shape, rejects invalid payloads without writes, and offers
restoration of the prior progress. Startup hydration does not overwrite saved
values. See [buff identity and legacy migration](docs/BUFF_OWNERSHIP.md) before
editing tracked sources.
