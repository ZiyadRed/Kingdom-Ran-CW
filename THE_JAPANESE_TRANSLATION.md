# The Japanese Translation — design & handoff notes

**Status: NOT implemented. Saved for later.**
Goal: add a **full EN/JP UI language toggle** to the site, showing **per-field Japanese**
for skills. Rule from the user: **use the original game Japanese — never machine-translate
English → Japanese.**

Date captured: 2026-06-05.

---

## Decisions already made
- **Per-field JP** (condition / target / effect / duration shown in Japanese per row),
  not a single original-description block.
- **Full UI i18n** (toggle covers interface chrome too, not just skill text).
- Source of truth should be the **original game text**, with a reconstruction composer
  as fallback.

---

## What's already built (the composer — Route A)
A working per-field JP composer that reconstructs Japanese from the existing English
rows using only original glossary atoms (the `data/glossary/*.json` files are JP-keyed,
so the Japanese is the original game vocabulary; only numbers pass through and grammar
is assembled — nothing is guess-translated).

- `src/skill-jp.js` — `createSkillJP({conditions, effects, skillTypes, roster})` returning
  `{ condition, target, effect, duration, type }` composer functions.
- `scripts/validate_jp.mjs` — runs the composer over all character data and writes coverage.
- `_jp_coverage.md` — last coverage report.

**Coverage: 4490 / 4779 field occurrences = 94.0%.**
| field | coverage |
|---|---|
| skill type | 100% |
| duration | 100% |
| effect | 97% |
| target | 92% |
| condition | 85% |

Run it: `node scripts/validate_jp.mjs` (Node 24 present). The remaining ~6% is an
irregular long tail (multi-clause conditions, bespoke multi-target lists, a few
typo'd English source strings).

---

## The authentic path (Route B — recommended source of truth, not yet built)
The site is a **Castle War / 同盟争覇戦 (Union Conquest)** souha-skill simulator, so the
authentic per-effect Japanese lives in the **CW tables** of the decrypted game data, not
the regular special-skill tables. Proven feasible — rendered real characters straight from
the data (`猛将一閃【赤羊】`, `攻撃力アップ中`, `味方盾兵武将の攻撃力上昇`).

### Data location
- Masters: `C:\kingdom_data\decrypted\masters_00{1..5}.bin`
  load with `msgpack.unpackb(open(p,'rb').read(), raw=False)['master']`.
- STBL strings: `C:\kingdom_data\decrypted\master\*.stbl`
  parser (count@offset 8, base@12, offsets@16, NUL-terminated UTF-8) lives in
  `C:\kingdom_data\.claude\skills\kingdom-update-report\scripts\update_report.py`.

### The join (character → original JP per effect)
1. `mstUnitGenerals` — links a character; `characterId` field. Names via
   `MsgUnitGeneralName.stbl`.
2. `mstUnionConquestGenerals` — keyed by `characterId`; fields `skill1id`–`skill10id`
   (also `chiefGeneralSkillId`, `tacticianSkillId`) → CW skill ids.
3. `mstUnionConquestSkills` — `id`, `name` (JP), `skillEffectIds` (csv), `textId`.
4. `mstUnionConquestSkillEffects` — **this row IS the site's structure:**
   - `effectType`  → JP effect text (via step 5)
   - `targetType`  → who it hits
   - `skillTriggerIds` → condition, via `mstUnionConquestSkillTriggers`
     (`conditionType` + `conditionParam1..3`, `targetType`, `targetParam`)
   - `effectTurnCount` / `effectCount` → duration (ターン / 回)
   - `effectValue1/2/3` → the numbers
5. `mstUnionConquestSkillEffectTypes` — `effectType` → `textId` into
   `MsgUnionConquestSkillEffectDesc.stbl` (JP with `{1:per}` / `{1:value}` slots).

### Calibration TODO (before trusting the output)
- **Value scaling** looks like ÷100 (effectValue `2000` → `20%`) — confirm per placeholder.
- `{N:per}` → `effectValueN` as a percent; `{N:value}` → a count (target number / turns),
  NOT a percent. My first naive render mis-filled these.
- A few effectTypes are **reserved/placeholder** (e.g. text `予約領域153`) — skip them.
- **Lock the calibration against the site's existing English numbers** as ground truth —
  that anchors scaling and slot mapping so nothing is guessed.
- Also need targetType → JP and trigger conditionType → JP mapping tables (the glossary
  already covers most of the vocabulary; cross-check).

### Plan
Build **B as source of truth**, **A (composer) as automatic fallback** for any effect
that doesn't resolve cleanly. Suggested first step: extract + calibrate **one faction**,
diff the rendered JP against the current English, eyeball, then scale to all characters.

---

## UI work still remaining (both routes need this)
- `src/i18n.js` — language context (`useLang()`) + EN/JP string table + a header toggle.
- Wire the chosen JP source into `SkillCard` in `src/pages.jsx` (renders
  `e.condition / e.target / e.effect / e.duration` + `skill.type`); also the other skill
  renderers. Names already carry `name_jp`.
- **UI chrome strings** (nav, buttons, page copy) have no "original game text." Plan:
  source authentic JP from the game's own UI string tables (`MsgGlobal`, `MsgUnionBattle`,
  unit/stat terms, etc.) wherever a concept matches; translate only the genuinely
  site-specific bits (e.g. RanHQ branding copy).

## Guardrails (project memory)
- Never push/deploy unless told; back up before big changes.
- Vite 8 dev server shows a blank page — verify via `npm run build` + `npm run preview`
  on port 4173, not `npm run dev`.
