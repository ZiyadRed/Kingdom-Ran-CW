# Feature ownership

`src/route-modules.js` pairs each lazy loader with its Vite manifest source.
The client and prerender preload traversal use the same route selection.
When moving a route, update this registry and inspect its actual generated
HTML/preload graph, including localized direct entry.

Buff Tracker is the first extracted feature:

- `src/features/buffs/BuffsPage.jsx` owns `/buffs`, its dialogs and source-table
  assembly. It imports the original unit, team and scene-card datasets directly.
- `src/features/buffs/data.js` owns the authored categories, terrain rows and
  presentation constants. Immutable `ownership_id` values must survive edits.
- `src/art-preview.jsx` owns the shared art button/lightbox. It has no dependency
  on the broad pages module or game datasets.
- `src/display-names.js` owns the shared secondary-name presentation helper.
- `src/buff-ownership.js` remains the shared identity/migration boundary; the
  storage and calculation contracts remain in their established modules.

Only `cw_team_buffs.json`, used exclusively by Buff Tracker, is exempted from
the existing shared data chunk. Unit/scene data also serve core calculations
and remain shared. Other page routes still use `pages.jsx`; this is an
incremental boundary, not a completed decomposition of `core.jsx`.

The measured extraction removes 85,763 decoded JS bytes from Buff Tracker and
54,667 from Archive/Builder/Cost/Metawatch. Their Brotli reductions are 17,821
and 8,722 bytes respectively. Buff Tracker retains nine initial JS chunks;
the other tool routes use ten instead of nine, with the new shared chunk
preloaded in parallel. Home/Guide remain outside the broad game-data graph
(203 decoded bytes added for the route declaration). Repeated browser timings
were mixed; these results establish smaller delivery and clearer ownership,
without claiming a consistent LCP improvement.

For each subsequent extraction, compare the actual route graph, repeated cold
requests/timings and completed transfer window; test saved state, calculations,
stable identities and localized screenshots before accepting it. Do not infer
network savings from source-file size or sum independent optimization estimates.
