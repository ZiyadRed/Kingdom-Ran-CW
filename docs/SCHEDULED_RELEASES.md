# Scheduled CW6 publication

Prerender captures one millisecond timestamp for its entire document batch and
stores it in `html[data-ranhq-release-time]`. Server rendering and the client's
first hydration render filter cards and their stable-ID-linked star-six skills
against that same instant. A later client clock cannot change the first render.

After hydration, `useReleaseData()` refreshes in a React transition against the
client clock. It schedules the next release boundary and rechecks on focus,
pageshow and visibility changes. It updates data without replacing the route or
resetting saved ownership, formation IDs or skill masks. Old data snapshots stay
unchanged; newly released character skill data gets a new identity so localized
search caches refresh. Home and Guide do not import the roster for this policy.

This preserves the existing client-clock publication policy. A static document
remains at its build snapshot until rebuilt; JavaScript clients refresh after
hydration. Normal deployments rebuild static content. Do not change source
publication timestamps to force a release or bypass the gate.

`RANHQ_RELEASE_SNAPSHOT` optionally pins prerender to a valid millisecond instant
for reproducible tests. Normal builds use build time. Browser regression tests
render authentic pre-boundary documents with the production JavaScript bundles,
then verify post-boundary hydration and open-tab rollover in EN/JA/AR/FR on the
Archive overview, CW6 collection and Kisui detail. They retain the original SSR
heading node and saved storage, and also test the saved Kisui Builder skill mask.

The September 2026 boundary is card `42004`, epoch `1789290000` seconds:
September 13 at 09:00 UTC (12:00 Asia/Riyadh). The card and linked character skill
become available together.
