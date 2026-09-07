# Archive and Guide entry points

F21 keeps both existing URL pairs and gives each page a distinct purpose.
No redirect or canonical consolidation is needed for these useful entry points.

| Route, in EN/JA/AR/FR | Purpose |
| --- | --- |
| `/archive` | Choose the general database or CW6 scene-card collection, see their current source-derived counts, and understand what each collection offers. |
| `/archive/characters` | Search/filter the general roster and open individual skills and artwork. |
| `/guide` | Contents grouped by the existing Beginner/Advanced categories, with short reading guidance and links to every existing article. |
| `/guide/basics` | The complete Basics article, including its existing figures and explanations. |

The Archive overview no longer selects the Characters tab or embeds its roster.
The Guide overview no longer embeds the Basics article. All 14 article URLs,
the CW6 collection, 209 current character IDs and legacy character canonicals
remain available. The shared site navigation already provides an Archive/Guide
return path; article and character breadcrumbs continue to point at their hubs.
Existing collection tabs retain their selected-state behavior.

Eight localized hub descriptions now describe these entry points. Titles,
self-canonicals, reciprocal alternates, sitemap membership and article metadata
are preserved. This is a product/content decision; no search-ranking improvement
is claimed. Before-change metadata, page payloads and source/art hashes were
captured for comparison, independently of the SEO validator.

`ArchiveHubPage` remains in the existing Archive route module. `GuideHubPage`
uses the existing small Guide module, section IDs and translated labels; it
does not import the character registry. Home's route graph remains separate.
`reference-hubs.css` owns the two overview layouts, using the existing palette,
44px article links, keyboard outlines, a single-column phone layout and logical
spacing for RTL. It does not change article or collection styles.

`tests/browser/hubs.spec.js` checks distinct crawlable content and metadata,
collection links/counts/tab state, keyboard navigation and saved-state
preservation. Every Guide article is opened through its hub link and returns
through its existing breadcrumb in all four locales. Invalid-link recovery and
the failed-chunk test now traverse the intentional hubs before opening a
collection or article; their original failure/state assertions remain intact.
The work log records the responsive review and complete release gate results.
