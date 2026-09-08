# September 2026 audit remediation

Baseline: `6cd23c5c5c0c4302741d7714d0907f31b8204afd`. Changes are limited to
the confirmed audit findings and three measured performance hotspots.

| Finding | Result and regression evidence |
| --- | --- |
| F01 | Formation summaries and shared text use side-aware contributions; real BuffTable tests cover attacking/garrison conditions and disclosures. Unknown runtime conditions remain explicit. |
| F02 | Immutable document release snapshot, followed by a post-hydration transition and boundary/focus refresh. Twelve late-hydration cases, twelve open-tab boundary cases and four saved Builder cases cover all locales. See SCHEDULED_RELEASES.md. |
| F03 | Mobile routed details hide covered controls, focus their heading and return focus on close/back. Actual Tab/Shift+Tab traversal covers phones; desktop layout remains available. |
| F04 | Native disclosure buttons, aria-expanded, linked source panels and visible focus. Normal buffs, Guard alternatives and enemy debuffs support Enter/Space. |
| F05 | Tests distinguish 209 total/searchable records from 190 accepted-banner browse records. Every search-only record retains search and direct detail access. |
| F06 | Official FAQ establishes forward general order and reverse skill order within each general. Copy corrected; mechanics retained. Sparse multi-general regressions and provenance are in BATTLE_ORDER_EVIDENCE.md. |
| F07 | Validated query/faction URL state, natural browser history and locale switching, plus a per-tab return bookmark. See ARCHIVE_STATE.md. |
| F08 | Shared Arabic mark/tatweel normalization and bounded authored French concept aliases. Matching populations verified across locales. |
| F09 | Finite structured Japanese fallbacks resolved; ten Guide owners use source-backed Japanese names. Merged role coverage participates in the strict zero-fallback corpus gate. Original Japanese and unknown readings remain unchanged. |
| F10 | Five measured foreground/background pairings corrected in the existing palette. Rendered normal/hover/focus/selected contrast checked at 320, 390, 820 and 1440px in every locale. |
| F11 | Byte-hashed source artifacts pinned to LF. A real Git checkout with core.autocrlf=true preserves exact committed source hashes while ordinary code retains normal checkout behavior. |

## Performance evidence

Cold Chromium 153.0.8010.12 contexts, 390x844, three runs per route, no scrolling,
same local built server, network idle, analytics intercepted. All three samples
agreed. Image values are encoded response-body bytes; JS gzip is the sum of
gzip-compressed actual requested local JS files, excluding the empty analytics
stub. These are controlled asset measurements, not field latency scores.

| Surface | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Castle control art, three files | 360,478 B | 103,468 B | 71.3% |
| Buff unit category art, four files | 276,460 B | 95,238 B | 65.6% |
| CW6 image requests before scroll, including logo | 67 | 19 | 71.6% |
| CW6 image bytes before scroll | 1,029,744 B | 268,024 B | 74.0% |
| Archive overview requested JS, gzip | 299,572 B | 117,773 B | 60.7% |

Home and Guide remain outside the game-data graph. Their gzip changes are only
96 B each from the additional lazy route reference. Full CW6 JS grows 216 B for
visibility handling. No performance claim rests on moving a file alone.

`scripts/gen_control_icons.py` creates lossless WebP derivatives from authentic
originals with preserved aspect ratios. Originals are untouched. Bounds cover
64px controls at 3x density and the scaled 76px Infantry/Cavalry controls.
`ArchiveImage` defers CW6 art and owner sources until visible, preserves square
geometry before loading, and suppresses covered mobile gallery sources. Full
card markup, accessible names, ownership and detail controls remain available.

`scripts/measure-route-assets.mjs <output.json>` reproduces measurements against
port 4190, or RANHQ_MEASURE_ORIGIN. Source counts/releases for the lightweight
overview are derived at build time; see ARCHIVE_OVERVIEW_BOUNDARY.md.

## Scope retained

All optional/later items from the brief remain deferred: CW6 deep links,
formation import URLs, ambiguous-row badges, Metawatch freshness, repeated
Remove labels, superseded comments and experimental battle-code cleanup.
The missing immutable historical August masters snapshot remains an excluded
archival prerequisite. Four ambiguous source joins remain unassigned, 21 ruby
readings remain null, and strict byte hashing is unchanged. There is no remaining
formation-order evidence gap; broader runtime battle simulation is not certified
by these changes.

## Acceptance

Phases 1, 2 and 3 passed their complete browser gates (120, 148 and 161 passing
cases respectively). Phase 3 has three intentional non-French skips for its
French-only concept comparison. Final combined acceptance: 518 unit/source tests
in 43 files; 181 browser tests passed, three intentional locale skips, zero
failures and retries (9.4 minutes, one worker). This includes the 28 clock-boundary
cases and mobile keyboard checks. The focused performance/clock gate passed
48 cases before the full run. All four locales and 320/390/820/1440px are covered.

Lint, 446-key catalog validation, both source validators, production build,
1,149 prerendered routes plus the real 404 artifact, and SEO validation all pass.
SEO covers 936 canonical, 209 legacy and four noindex application URLs. Clean
dependency install succeeded (282 packages, zero reported vulnerabilities);
the lockfile and dependency versions are unchanged. Final diff review found no
authoritative data or original artwork drift. Public deployment is verified
separately against this accepted tree.
