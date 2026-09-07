# French release checklist

French is implemented in the local working tree. Publishing it requires separate
authorization and verification of the deployed revision. This audit remediation
does not deploy, stage or commit the pre-existing French work.

## Ownership

The starting checkout was `main` at
`c309dc0b96f8dbb496dac7cfefb89d8e08b3e41d`, with 33 already-dirty paths:
28 staged and 18 unstaged, including overlap. All are treated as owner work.
The original binary staged patch is preserved, and every accepted remediation
checkpoint compares it with the current index.

French renderer/lexicon refinements, route/SEO integration, catalog tests,
sharing and localization styles already existed before this task. The working
tree contains accepted French refinements beyond the original index. Include
those reviewed refinements in the release commit. The remediation adds focused
behavior fixes, a gender-neutral ownership-count label, the defense-resistance
preposition and locale-aware buff decimals with unchanged rounding. It retains
the existing French translation architecture and source-verbatim title policy.

Use the complete reviewed application tree and the locked dependencies. Review
each intended path before staging. Keep local evidence, credentials, runtime
files, unrelated owner work and private coordination state outside the release.

## Local acceptance

- Run the complete [release gate](RELEASE.md) from the final tree and a clean
  dependency installation. It includes the French semantic corpus and source
  mapping/artifact validators, calculations, browser acceptance and SEO build.
- Verify 234 indexable French URLs and `/fr/sim` with `noindex`. The complete
  four-locale output has 936 canonical URLs, 209 retained English legacy
  character URLs and a real `404.html` (1149 route documents plus 404).
- Check raw French HTML, one H1, `lang="fr"`, `dir="ltr"`, distinct titles and
  descriptions, self-canonicals, reciprocal EN/JA/AR/FR alternates and `x-default`.
- Exercise Home, Archive/detail/CW6, Builder, Stats, Cost, Castle Points, Buffs,
  Metawatch and Guide on phone, tablet and desktop. Include localized search,
  clear/empty results, saved state across refresh and locale changes, keyboard
  dialogs, actual share images and invalid-route recovery.
- Read rendered French. Canonical Romaji names and source-verbatim skill/card
  titles are intentional. English mechanism fragments, broken agreement and
  parser placeholders are acceptance failures. Verify Arabic direction and
  positional formation order when shared code changes.
- Record the [historical raw-source prerequisite](SOURCE_SNAPSHOT.md). The
  matching original binary snapshot is unavailable; current internal source
  validators pass against checked-in provenance. Original-source re-extraction
  is unverified, and source changes require the matching intentional snapshot.

## Authorized deployment and public acceptance

1. Review the exact release diff/commit and retained source prerequisite. Confirm
   the Vercel project, nested repository root, Node version, build command,
   output directory and required checks. Remote settings remain unverified.
2. Obtain authorization for that concrete release, then publish through the
   established project workflow. Retain its revision and deployment URL.
3. Verify `/fr` and representative `/fr/archive/characters/moubu`, `/fr/builder`,
   `/fr/cw-stats`, `/fr/cost`, `/fr/castle-points`, `/fr/buffs` and `/fr/guide/basics`
   as fresh public requests and through language navigation.
4. Verify public sitemap parity and reciprocal alternates, existing English
   legacy canonicals, genuine HTTP 404/noindex, cache/security headers and any
   Report-Only CSP observations. Repeat the critical French interactive flows.
5. Record observed results and the deployed revision. Mark public French
   availability accepted only after these live checks pass. The audit's earlier
   production `/fr` 404 is historical evidence, not a current deployment result.
