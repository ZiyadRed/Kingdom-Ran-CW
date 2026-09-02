# RanHQ agent instructions

## Scope and source of truth

- The Git root is `C:\Users\Admin\Desktop\kingdom-ran-en-FINAL\kingdom-ran-en`.
- Preserve the existing dirty working tree. Never use `git reset --hard`, `git clean`, destructive restore, force push, or blind stash overlays.
- Read `.ai-team/state.json` before starting a task and update it only after a bounded slice is actually verified. Keep credentials, OAuth tokens, cookies, and runtime databases out of the repository.

## Localization contract

- Supported locales are English (`/`), Japanese (`/ja`), and Arabic (`/ar`). Existing English URLs must continue to work.
- For Kingdom Ran game-originated text, use exact stable-ID joins from `C:\kingdom_data\decrypted` and preserve the original Japanese string. Do not guess from translated English, names, array positions, or `skillId - 1` arithmetic. Leave ambiguous rows explicitly unassigned.
- RanHQ-authored UI and guide copy may be translated naturally. Keep provenance distinct from game text (`VERIFIED_ORIGINAL`, `EVIDENCE_INFORMED`, `COMPATIBLE_RECONSTRUCTION`, `UNKNOWN`).
- Arabic must set `lang="ar"` and `dir="rtl"`; prefer logical CSS properties and test mixed Arabic, Japanese, Latin identifiers, and numbers.
- Maintain `data/glossary/localization_terms.json` for shared English/Japanese/Arabic terminology. Do not invent costs, odds, rewards, packet semantics, or combat formulas.

## NEW CHARACTER / CW CARD INTEGRATION CONTRACT

**Mandatory.** Before adding a character, skill, CW/CW6 card, game data or a new
mechanic, read `docs/CONTENT_INTEGRATION_RULES.md`. It is the detailed contract;
this is the non-negotiable summary.

- **Ship EN + JA + AR or do not ship.** No new user-facing concept lands in
  English only. No hard-coded visible English in shared UI unless it is
  source-verbatim under an established policy.
- **Character names**: English = canonical Romaji, Japanese = canonical
  Japanese, Arabic = canonical Arabic (`src/i18n/ar-character-names.js`).
  Arabic coverage must stay **complete** — never 207 names plus one Romaji
  fallback.
- **Tri-script search**: every character findable by Romaji, Japanese and
  Arabic on every picker. Use the shared `matchesCharacterName()`.
- **Stable IDs only.** Never array position, display-name equality,
  `skillId - 1`, or fuzzy matching when a deterministic source ID exists.
- **Japanese source** comes from `C:\kingdom_data\decrypted` via exact
  stable-ID joins. Never back-translate English into Japanese. Ambiguous rows
  stay unassigned.
- **Source placeholders** (`{-N:characterId}`) resolve through the verified
  master-table relationship and **fail closed** when unknown. Never guess.
- **Arabic mechanics** go through the semantic renderer. No word-by-word
  replacement, no English grammar, no mixed fragments, no parser tokens. If a
  mechanic cannot be modelled, return the **complete** English source — never a
  partial translation.
- **Arabic must read as human**: natural, gaming-friendly, grammatically
  correct, RTL-aware. Arabic characters being present is not completion.
- **Check the glossary before inventing a translation**
  (`RANHQ_ARABIC_TERMINOLOGY.md`). Owner-approved terms win. Ask once about a
  genuinely new recurring term, then record it. Do not re-ask settled terms.
- **Fixed policies**: Western digits in Arabic; skill names source-verbatim;
  `CW`/`CW6`/`UR`/`SR`/`R` kept as shorthand; `->` stays ASCII in share images.
- **Preset teams** are defined once in `META_TEAMS`; the tier list derives from
  it. Country is resolved from member data, never from the team name.
- **Write guards as properties, not counts.** "Every character present has an
  Arabic name", never "there are exactly 208 characters".

Enforced by `src/content-contract.test.js`, `src/meta-teams.test.js`,
`src/i18n/corpus-coverage.test.js`, `src/i18n/team-names.test.js` and the
localization validators.

## Validation

Run the relevant focused tests, then:

```text
npm.cmd run validate:i18n
node scripts/localization/validate_source_map.mjs
node scripts/localization/validate_locale_artifacts.mjs
npm.cmd test -- --run
npm.cmd run lint
npm.cmd run build
```

For UI changes, smoke-test English, Japanese, and Arabic desktop plus 390x844 mobile. Record remaining fallback or native-Flash boundaries honestly; a successful build is not native Flash acceptance.

## Ownership and handoff

- Keep write scopes non-overlapping when delegating. Shared routing/catalog/source files belong to the lead lane unless explicitly assigned.
- Leave a concise evidence trail in `.ai-team/state.json` and the final report. Do not claim another agent or Claude reviewed a change unless that review actually ran.
