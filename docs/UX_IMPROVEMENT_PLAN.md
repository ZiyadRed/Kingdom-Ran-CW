# RanHQ UX improvement plan (2026-11-14)

Source: review of the live site (ranhq.vercel.app) on desktop and at 375px, English only.
Work happens in this worktree (`ranhq-ux-preview`, branch `release/ux-audit-fixes-20261111`,
one commit ahead of `origin/main`). Nothing is committed or pushed without the owner's say-so.

## Owner decisions (do not revisit)

- **No counters / "why it's here" text** on the tier list. Not time for it yet.
- **Tier SS stays empty** for now. Do not add a team to it or hide the band.
- **"Characters 212" vs "All 193" stays as it is.** The rest have no banner art. Do not relabel,
  do not add placeholder cards.
- **Buff Tracker:** show sources from highest buff to lowest. This is a display-order change only.
  **Ownership ids must not change** — anyone who has toggled sources as owned must keep them.
  No "% per crystal" figure.

## Ground rules

- Read `AGENTS.md` and `docs/CONTENT_INTEGRATION_RULES.md` first. Every new visible string ships in
  EN + JA + AR + FR through the existing i18n catalogs; Arabic is RTL, use logical CSS properties.
- No changes to game data, skill text, buff values, storage keys, share-URL formats or existing routes.
- Existing contract tests (`redesign-contracts.test.js`, `buff-ownership.test.jsx`,
  `buff-summary.test.jsx`, `archive-url-state.test.js`, …) must keep passing; update a test only when
  the behaviour it pins is one this plan deliberately changes, and say so.
- Dev server shows a blank page on Vite 8: verify with `npm run build` then `npm run preview` (4173).

## Phases, in priority order

Each phase is finished and validated before the next begins.

### 1. Battle Order: compact timeline — `SimPage`, `BattleResult` in `src/pages.jsx`

Problem: two full teams produce an ~11,000px page (13,000px on a phone) because every action prints
its full skill card.

- Each action becomes one collapsed row: order number, portrait, general name, side marker, skill
  name, skill-type chip, and a one-line effect summary built from the skill's existing structured
  effects (no new wording of game text; if a summary cannot be built, show the skill name only).
- Tapping/Enter on a row expands the existing full `SkillCard` in place (`aria-expanded`, keyboard
  reachable). An "Expand all / Collapse all" control sits in the header.
- Turn headers are sticky while scrolling their turn; a small "jump to turn" strip sits under the
  formation bar.
- Default state is collapsed. Target: one turn fits roughly one desktop screen.

### 2. Party Builder: buff comparison table — `BuffTable`, `BuffSideTable`, `src/buff-summary.css`

Problem: each general gets a separate stack of 5–12 rows (~4,900px page); nothing is comparable.

- Per side, one grid: stats as rows (existing `STAT_ORDER`), the four generals as columns (portrait +
  name header), value chips in cells, empty cell where a general has no value. Rows with no value
  for anyone on that side are omitted.
- Keep everything the current rows carry: the count/turn qualifiers ("1 time"), the expandable
  source evidence (`BuffSourceEvidence`) — opened from the cell —, enemy debuffs, the
  "All selected skill effects" reference, the "Include combat skills" toggle and Share.
- Desktop: attacker and defender grids side by side as now. Phone (≤480px): one side at a time
  behind the existing Attacking/Defending tabs; the stat column is sticky and the grid may scroll
  horizontally inside its own container, never the page.
- Calculation code is untouched; this is a re-layout of the same computed entries.

### 3. Archive character panel: fact strip and cross-links — `ArchivePage` in `src/pages.jsx`

Problem: the panel shows only the three skills.

- Under the header add a compact strip from data already in the bundle: rarity
  (`data/character_rarity.json` via the existing helpers, never the buff `type` field), unit type,
  special-unit membership, and total red-crystal cost.
- "Passive buffs this general gives" — the same sources the Buff Tracker lists, read-only.
- "Used in" — `META_TEAMS` containing this general, each loading that team into the builder
  (reuse the existing `loadMetaTeam` / `onAddToBuilder` path).
- Omit any section that has no data; never invent values. Generals without a `cw_max_stats` row
  show no stat figures.

### 4. Filters for the Archive and the general picker — `ArchivePage`, `Picker` in `src/core.jsx`

- Archive: add unit-type and rarity filter chips beside the state rail, combinable with state and
  search, persisted in the URL through `src/archive-url-state.js` (existing `?faction=` links keep
  working).
- Picker (builder, team cost, stats calculator): add state and unit-type chips above the grid.
  Search continues to use `matchesCharacterName()` (Romaji/Japanese/Arabic).
- Sorting and skill-effect filtering are out of scope for this pass.

### 5. Buff Tracker: order by value — `ROUTE_MODULES.buffs` module

- In each category/stat list, sort sources by buff value, highest first; ties keep their current
  relative order (stable sort).
- Sort at render time only. Do not reorder, rename or re-key anything in `data/cw_team_buffs.json`,
  `data/buff_ownership_legacy.json`, `src/buff-identity.js` or `src/buff-ownership.js`. The rank
  number shown on each row follows the new display order.
- Add a test: a set of owned ids saved before the change still resolves to the same sources after.

### 6. Image loading polish — `FadeImg`, `CharIcon`, `src/archive-images.jsx`

Problem: Archive cards, scene cards, builder team portraits and Buff Tracker unit-type icons render
as blank beige tiles first; scene cards were still blank after two seconds.

- Give image tiles a neutral skeleton/shimmer until loaded (respect `prefers-reduced-motion`).
- Load the first visible row eagerly (`loading="eager"`, `fetchpriority="high"` for the first few);
  keep the rest lazy. Check scene cards use the `thumbs/` twins in the grid, not full art.

### 7. Small items

- `/archive/characters` with no query opens on **All**, not Qin. Explicit `?faction=qin` still works.
- Tier list: clicking a team card loads it into the Party Builder (no explanatory text added).
- Phone Archive: state filters become a single horizontally scrolling chip row so the first cards
  sit higher.
- Stats Calculator, Team Cost, Castle Points: a "Load example" action on the empty state. It must
  not overwrite saved user data — only offered when the tool is empty.
- The orange count badge next to "Teams" in the nav gets an accessible label and tooltip
  ("N generals selected").
- Home hero: reduce desktop height so the three tool columns start within the first screen.

## Validation (after each phase, all at the end)

```text
npm.cmd run validate:i18n
node scripts/localization/validate_source_map.mjs
node scripts/localization/validate_locale_artifacts.mjs
npm.cmd test -- --run
npm.cmd run lint
npm.cmd run build
```

Then smoke-test the changed pages in the built preview: EN, JA, AR (RTL), FR, desktop and 390x844.

## Out of scope

Counters, tier explanations, SS team, the 212/193 label, "% per crystal", skill-effect search,
any data correction from the 2026-11-10 audit's open findings, committing, pushing, deploying.
