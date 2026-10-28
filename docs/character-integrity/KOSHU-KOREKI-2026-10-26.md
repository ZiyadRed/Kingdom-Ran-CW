# Koshuu and Koreki — released October 28, 2026

## October 28 release verification

The [completed maintenance notice](https://www.kingdomran.jp/info/261028maintenance)
and today's acquired game data confirm these additions are released. This
section supersedes the announcement-only limitations in the historical record
below. These validation results were captured before the release commit.

Source: **v8.8.0_20261028_263b4f3c**, acquired October 28 at 12:07 Riyadh,
with completed decryption verified. All five master shards are merged by row
ID; conflicting duplicates fail extraction. The current SHA-256 manifest,
complete CW profiles, assigned skill records, asset joins, and retained buff
evidence are in `data/source/released_content_2026-10-28.json`.

| Owner | Released CW IDs | Japanese text IDs |
|---|---|---|
| Koshuu (265) | 880, 881, 271 | 879, 880, 271 |
| Koreki (266) | 882, 883, 271 | 881, 882, 271 |
| Kanmei (137), Leader | 890 | 889 |
| Reiou (181), Strategist | 891 | 890 |

All six Koshuu/Koreki slots now have exact master assignments and original
Japanese STBL text. There are no pending-source slots. Koshuu's former
`《？》` recipient is **Riboku (character 72)**: effect 3602 uses target type 17
and target parameter 72, independently matching the Japanese entity token.
His named DEF +30% stacks with Zhao DEF +20%; Leader/Strategist bonuses apply
only to selected formation roles.

Kanmei's **超大国の象徴** costs 2000 morale and grants Kanmei Army DEF +60%
and morale recovery 20%, while reducing enemy morale 30%. Reiou's
**火龍鳳翼** costs 1000 morale and grants Wei DEF +30% and morale recovery
20%, while reducing enemy DEF 30%. The role system, Guide, Archive, Builder,
opening-order planner, and image exports consume these same records. Opening
order remains Leader then Strategist; the planner retains its runtime morale
and activation caveats.

Native UR icons now exist: general 560 -> design 232/image 2 ->
`character/icon/cg232_i02.png`, and general 563 -> design 233/image 2 ->
`character/icon/cg233_i02.png`. Both original 120x120 icons were converted to
WebP and checked pixel-for-pixel. The original 313x440 official UR banners
and thumbnail twins remain intact. No LG 561/564 artwork or skills are added.

The three normal 5% buffs and both Infantry HP +18.2% ownership IDs are
unchanged. Current master joins independently confirm their previous values.
Released Bananji backpage, Shihaku rework/EX, Ryuuto LG3 and Duke Sei LG3
were also checked: they introduce no additional missing CW skill-catalog
entry or owned CW buff source. Normal battlefield/EX effects are not promoted
into CW totals. The unused legacy simulator's precomputed maximum stat table
remains unchanged. The public CW Stats calculator uses player-entered stats.

Future Ryuuto CW6 card **42005** and skills **884-889**, Tonkaku/Tonkoku's
November upgrades, Choukatsu/Maikou, Roen's future variants, and placeholder
Kouretsu EX/LG3 are excluded from runtime additions. Raw Japanese source
snapshots retain the full authentic STBL; that source inventory does not make
future rows public in the catalog.

Validation: **743 unit tests**, lint, localization/source/artifact validators,
current-source extraction verification, production build, CW6 parity and SEO
pass. **36 existing Chromium regressions** pass. Eight EN/JA/AR/FR desktop and
mobile combinations each pass new-character details, native icons, tri-script
search, all five independent saved buff toggles, Builder insertion, Guide role
entries, both role controls, DEF totals 90/60/50, opening order, and team PNGs.
All sixteen character PNGs for the four affected owners also render correctly.
No browser console/page errors or horizontal overflow were observed. Arabic
RTL buff rows, Japanese source details, French skill rows and actual exported
PNGs were visually reviewed. Browser plugin not available; regular Playwright
used at 1440x900 and 390x844 against the production build on localhost:4197.
QA scripts/screenshots remain outside the repository in
`C:/Users/Admin/AppData/Local/Temp/ranhq-update-20261028`.

## Historical October 26 preparation

Official announcements, published October 26, introduce **SR/UR 胡周** and
**SR/UR 虎歴** after the October 28 Ver. 8.8.0 maintenance, scheduled to finish
at 18:00 JST / 12:00 Riyadh. Both are SR debuts under the owner's terminology.
No LG version is announced.

- [Koshuu announcement](https://www.kingdomran.jp/info/srur_kosyu)
- [Koreki announcement](https://www.kingdomran.jp/info/srur_koreki)
- [Maintenance notice](https://www.kingdomran.jp/info/261026maintenance)
- Exact source/provenance: `data/source/announced_characters_2026-10-26.json`.

## Identity and artwork

| Character | Character ID | Announced general IDs | Classification |
|---|---:|---|---|
| Koshuu / 胡周 / كوشو | 265 | SR 559, UR 560 | Zhao, Infantry, civil official |
| Koreki / 虎歴 / كوريكي | 266 | SR 562, UR 563 | Ai, Infantry, civil official |

Names/readings and classification use exact master/general/STBL joins. English
and French use Koshuu; `Koshu` remains a search alias. Japanese readings are
`こしゅう` and `これき`. The Arabic Koshuu spelling coincides with Koushou's;
the owner was informed, and search retains both distinct Japanese identities.

Full original official UR PNGs are 313×440. WebP conversion and thumbnail twins
preserve their pixels losslessly, without upscaling. Native `cg232`/`cg233` icons
are absent from the acquired cache; the existing portrait component uses the
authentic UR card. Future LG placeholder general IDs 561/564 and borrowed LG
ability 1418 are excluded from the announced runtime profiles.

## Buff Tracker

| Source | Category | Stat | Maximum | Acquisition layer |
|---|---|---|---:|---|
| Koshuu | Zhao | DEF | 5% | Normal ability 1356, UR general 560 slot 5 |
| Koreki | Infantry | DEF | 5% | Normal ability 1576, SR general 562 slot 2 |
| Koreki | Ai | ATK | 5% | Normal ability 1548, UR general 563 slot 5 |
| Koshuu | Infantry | HP | 18.2% | Announced CW skill 3; shared skill/text 271 |
| Koreki | Infantry | HP | 18.2% | Announced CW skill 3; shared skill/text 271 |

Each source has its own new authored ownership UUID. Existing IDs and frozen
legacy aliases are unchanged; old saves leave all new sources unowned.
The 5% values are verified at ability Lv99 through exact
`mstUnitGeneralAbilities → mstUnitAbilities → mstUnitBattleFieldAbilities`
joins (field IDs 84, 159 and 147, `effectLvB / 10000`).

## Source boundaries

The local acquisition is **v8.7.0_20261014_cca859f8**, not a fresh October 26
pull. Its CW assignments for both characters still contain generic skill 1.
The four new character-specific CW skills therefore have **null canonical
IDs**, `pending_source` mappings, and verbatim Japanese from the official
announcements. No fabricated skill rows are added to the raw STBL artifacts.
Both third skills reuse the exact published name/description of shared
skill/text 271, with the announcement recorded as the assignment evidence.

Koshuu's fourth DEF recipient remains the official `《？》` placeholder in
every locale and is excluded from calculated totals. His separate Leader and
Strategist DEF bonuses apply only to the corresponding selected formation
roles. Eligibility alone does not confer either bonus.

All five current master hashes, three 5% ability joins, character/type joins,
and all five retained Japanese raw artifacts pass a separate read-only check.
The historical `extract_ja_text.py --verify` command remains pinned to the
September 30 master hash and rejects the newer acquisition before extraction;
no raw Japanese artifact was changed or re-extracted.

## Local validation

739 unit tests pass. Lint, locale catalogs, source maps, locale artifacts,
production build, CW6 parity and SEO pass. Built Chromium checks cover EN/JA/AR/FR
at 1440×900 and 390×844: both detail pages, tri-script archive searches, five
independent buff toggles with reload persistence, Builder picker insertion,
and rendered team share images. No console/page errors or horizontal overflow.
Arabic, French, Japanese buff rows and exported team images were visually read.
Browser plugin not available; regular Playwright was used.
Twenty existing archive-state, regular buff identity and Builder-share browser
regressions also pass across the four locales.

Changes are prepared locally, uncommitted and unpushed. Refresh the four pending
CW IDs and actual source availability from the October 28 acquisition when it
becomes available; preserve ownership UUIDs and published text provenance.
