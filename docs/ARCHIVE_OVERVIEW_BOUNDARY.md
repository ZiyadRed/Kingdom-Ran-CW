# Archive overview dependency boundary

`/archive` owns `src/ArchiveHubPage.jsx`; character collections and tools retain
`src/pages.jsx`. The overview uses the existing locale catalog and release
snapshot hook without importing the full character, skill, buff, or sharing
modules. Route preloads follow that same lazy entry through `ROUTE_MODULES`.

`scripts/generate_archive_overview.mjs` derives
`src/generated/archive-overview.js` from the existing character reader and
`data/cw6_scene_cards.json`. It runs before `npm run dev` and `npm run build`.
The generated projection contains the complete searchable character count and
card counts grouped by their source release timestamp. It contains no names,
skills, artwork, or independent content authority. Regenerate it after editing
those datasets during an already-running development session.

The overview deliberately counts every public character, including entries
without banner artwork. The character collection's accepted banner count
remains separate. Scheduled card counts initialize from the document's immutable
release snapshot, then refresh with the shared boundary/focus/visibility policy.

Verification covers generated-source parity, complete-roster parity before/at/
after every source release boundary, route preload ownership, real browser
requests excluding the full tools graph, and both collection links. The existing
scheduled-release browser suite covers late hydration and an open overview
crossing the next release boundary in all four locales.
