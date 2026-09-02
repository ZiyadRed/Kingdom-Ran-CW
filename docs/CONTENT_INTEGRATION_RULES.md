# RanHQ — Content Integration Rules

**Mandatory for every agent and contributor adding characters, skills, CW/CW6
cards, game data, or new mechanics.**

`AGENTS.md` carries the short mandatory summary and links here. This is the
detailed contract. Read it before adding content, not after.

A change is not "done" because the English archive card renders.

---

## 0. The one-line rule

> New user-facing content ships in **EN, JA and AR** or it does not ship.

Adding content only to English is the single most common way this project has
regressed. Every rule below exists because that happened.

---

## 1. Character names

Owner policy — each locale shows names in its own script:

| Locale | Form |
|---|---|
| English | canonical Romaji |
| Japanese | canonical Japanese |
| Arabic | canonical Arabic |

A new character needs **all three**. Arabic coverage must stay **complete**.

The Romaji policy that preceded this existed to prevent a *partial* Arabic set
alternating scripts mid-roster. That failure mode is still the thing to avoid —
the fix was completeness, not Latin. Never ship "207 Arabic names + 1 Romaji
fallback".

Arabic names live in `src/i18n/ar-character-names.js`. Transliterate from the
**Japanese reading**, not the English spelling:

- Calibration: `Karin = كارين`، `Kanmei = كانمي`، `Kyoukai = كيوكاي`
- Collapse doubled vowel letters — `روكومي`, never `روكوومي`
- Translate titles, transliterate names — `Duke Hyou = الدوق هيو`
- Two pairs deliberately share a form (Douken/Doukin, Suugen/Sougen). If a new
  name collides with an existing one, **surface it to the owner** rather than
  inventing a distinction.

**Enforced by:** `src/content-contract.test.js` → *"has the three locale names it needs"*.

---

## 2. Tri-script search

Every character must be findable by **Romaji, Japanese and Arabic** on every
search surface — archive, Party Builder picker, CW stats picker, buff tracker.

Do not give one picker a weaker matcher. Use the shared
`matchesCharacterName()` from `src/i18n/ar-character-names.js`.

**Enforced by:** `src/content-contract.test.js` → *"is findable by Romaji, Japanese and Arabic"*.

---

## 3. Stable identifiers

Link characters, skills and cards through canonical/stable IDs.

**Never** rely on:

```
array position
display-name equality
skillId - 1 arithmetic
fuzzy matching
```

when a deterministic source ID exists. Character records carry `source`, and
`data/source/characters.map.json` carries the `characterId` join.

**Enforced by:** `src/content-contract.test.js` → *"carries a stable source
identity"* and *"keeps ids unique"*.

---

## 4. Japanese source data

Authoritative Japanese lives in `C:\kingdom_data\decrypted`.

- Use exact stable-ID joins. Preserve the original Japanese string.
- **Never** translate English back into Japanese when authoritative Japanese exists.
- Keep provenance distinct: `VERIFIED_ORIGINAL`, `EVIDENCE_INFORMED`,
  `COMPATIBLE_RECONSTRUCTION`, `UNKNOWN`.
- Ambiguous rows stay **explicitly unassigned**. Do not guess.

**Enforced by:** `scripts/localization/validate_source_map.mjs`,
`validate_locale_artifacts.mjs`, and
`python scripts/localization/extract_ja_text.py --verify`.

---

## 5. Japanese placeholders

Source descriptions reference other generals as `{-N:characterId}`.

Resolve them through the verified master-table relationship —
`mstUnitGenerals.characterId → mstUnitGenerals.id → MsgUnitGeneralName.stbl`.

Indexing that table directly by `characterId` returns a **different,
plausible-looking general**. That mistake shipped once and was caught only by
cross-checking the English data.

Unknown ids **fail closed**: leave the token visible. Never guess, never delete.

---

## 6. Arabic game effects

Arabic mechanic text is produced by a **semantic renderer**
(`src/i18n/ar-render.js`), not substitution.

Forbidden:

```
word-by-word replacement
literal English grammar
mixed English/Arabic fragments
visible parser tokens such as [جنرال]
```

The pipeline for a new mechanic:

```
understand the mechanic (read the Japanese source)
        ↓
recognise its structure
        ↓
extract targets / values / conditions
        ↓
render natural Arabic using approved terminology
```

Three grammatical frames already exist — use them rather than inventing a
fourth:

| Frame | For | Example |
|---|---|---|
| `من` phrase | scope + unit type | `حليف من المشاة` |
| construct (iḍāfa) | superlative selector | `جنرال العدو صاحب أعلى هجوم` |
| construct plural | a whole group named | `خفض الهجوم لجنرالات العدو بنسبة 40%` |

Proportional changes take `بنسبة`: `زيادة الهجوم بنسبة 20%`. Raw damage stays
terse: `ضرر 150%`.

**If a mechanic genuinely cannot be modelled, return the complete English
source.** A safe English fallback beats an invented Arabic mechanic. Never
partially translate.

**Enforced by:** `src/i18n/corpus-coverage.test.js`. Arabic is held at **zero
fallback** — a new unmodelled mechanic fails the build rather than shipping
English. Japanese is held to its current coverage level.

---

## 7. Arabic must look human

Arabic is not complete merely because Arabic characters are present. The
standard is:

```
natural · gaming-friendly · grammatically correct · RTL-aware · not machine-looking
```

Watch specifically for: gender and number agreement, the `zero` plural
category (Arabic has one — `لا جنرالات`, not `0 جنرالًا`), iḍāfa correctness
(`لعدو` + definite noun is not a valid construct), and bare adjectives after
`عند`.

---

## 8. Canonical terminology

**Check the glossary before inventing a translation:**
`C:\Users\Admin\Desktop\RANHQ_ARABIC_TERMINOLOGY.md`

Owner-approved choices win even when another translation is defensible.
Established concepts include: CW / Castle War, Team, Formation, Unit, Army,
Tier, Self, Turn, Role, Guard, Attack Seal, stats terminology, unit types,
countries/states.

Do **not** duplicate a concept under a second translation. If a genuinely new
recurring term is needed, ask the owner **once**, then record the decision in
the glossary. Do not re-ask about a settled term.

Countries in UI must reuse the existing `FACTIONS` entries (`label` for
English, `jp` for Japanese) and the Arabic `TAGS` in `ar-lexicon.js`. Never
introduce a second name for a country.

---

## 9. Fixed policies — do not "fix" these

| Policy | Why |
|---|---|
| **Western digits in Arabic** (`0 1 2 3…`) | Owner decision. Not Arabic-Indic. |
| **Skill names stay source-verbatim** | All locales. Do not translate them for one new character. |
| **English shorthand kept**: `CW`, `CW6`, `UR`, `SR`, `R`, tier letters | Established game shorthand. |
| **`->` stays ASCII in share images** | `>` is bidi-mirrored, so it points leftward correctly in RTL. `→` is not mirrored and would break it. |

---

## 10. Checklist — adding a character

1. canonical stable ID
2. English/Romaji name
3. Japanese source name + reading
4. **Arabic canonical name** (`ar-character-names.js`)
5. tri-script search verified
6. source/provenance metadata + `characters.map.json` entry
7. skills mapped to source by stable ID
8. Arabic semantic rendering for every effect row
9. CW/CW6 relationships if applicable
10. images/assets (`/persos` + `thumbs/` twin)
11. archive
12. Party Builder
13. tier/meta references where appropriate
14. Share Team output
15. tests + all validators

## 11. Checklist — adding a CW/CW6 card

1. canonical card/source ID
2. preserve original game data and provenance
3. wire character identity by stable ID
4. add/verify Japanese source data
5. Arabic semantic rendering for any new mechanic
6. all display labels respect the active locale
7. searches/pickers still work
8. verify Share Team where the card can surface
9. run every source/localization validator
10. regression coverage for genuinely new mechanic shapes

---

## 12. Preset teams

Preset comps are defined **once** in `META_TEAMS` (`src/core.jsx`). The tier
list derives from it (`TIER_TEAMS = META_TEAMS.filter(t => t.tier)`) and the
Party Builder groups it by country. Never create a second array.

Each preset carries `{ name, country, members, tier? }`:

- `name` is the stable key — it maps to localized labels in
  `src/i18n/team-names.js` and is what tests and share URLs use.
- `country` must be resolved from the **members' own character records**, never
  from the team name. Comps whose members span four states use `MIXED_COUNTRY`.
- Every preset needs an entry in `team-names.js` for JA and AR.

**Enforced by:** `src/meta-teams.test.js` and `src/i18n/team-names.test.js`.

---

## 13. Gates

Run all of these before claiming completion:

```
npx vitest run
npm run lint
npm run build
npm run validate:i18n
node scripts/localization/validate_source_map.mjs
node scripts/localization/validate_locale_artifacts.mjs
python scripts/localization/extract_ja_text.py --verify
git diff --check
```

Then smoke-test EN, JA and AR at desktop **and** 390×844.

A green build is not native-quality acceptance. Read the rendered Arabic.

---

## 14. Tests must scale

Write guards as **properties of the data present**, not fixed counts.

Good: *"every character currently present has an Arabic name"*
Bad: *"there are exactly 208 characters"*

The second makes a legitimate character 209 look like corruption. Same
philosophy for CW cards and corpus size.
