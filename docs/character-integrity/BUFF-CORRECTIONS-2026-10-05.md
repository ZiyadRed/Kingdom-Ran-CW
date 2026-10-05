# Buff Tracker corrections, 5 October 2026

Verified against the retained `v8.7.0_20260930_11f45ee4` game dump in
`C:\kingdom_data\decrypted`. The five-master manifest SHA-256 is
`DF4991D44F206E6D8702CA858CFE98BC51FC36486C0AA4E95B70180F084C4943`.
WoGG is outside this change.

Each added buff uses an actual character/card assignment, not a skill name
match. `data/source/buff_corrections_2026-10-05.json` records the exact joins,
original Japanese STBL names/descriptions, independent source hashes, values
and target categories for every correction. It is maintainer evidence and is
not imported by the runtime.

| General / characterId | Source assignment | Target and contribution |
|---|---|---|
| Pamu / 241 | Ura 10876, field ability 159 | Infantry DEF +5% |
| Eiki / 254 | Ura 10990, field ability 221 | Ousen Army ATK +5% |
| Shunpeikun / 222 | Ura 10876, field ability 159 | Infantry DEF +5% |
| Hakusui / 188 | Ura 10696, field ability 81 | Archer ATK +5% |
| Kakubi / 2 | Normal ability 1354, field ability 86 | Shield HP +5% |
| Duke Sei / 221 | Ura 10814, field ability 84 | Zhao DEF +5%, independent of the existing normal ability |
| En / 86 | Normal ability 1821, field ability 90; Ura 10967, field ability 85 | Hishin Unit DEF +5%, ATK +5% |
| Yuri / 228 | Ura 10721, field ability 90; Ura 10878, field ability 169 | Hishin Unit DEF +5%, Qin DEF +5% |
| Robin / 227 | Ura 10378, field ability 189 | Qin ATK +5% |
| Rokin / 248 | Ura 10916, field ability 177 | Chu ATK +5% |
| Goutoku / 249 | Ura 10698, field ability 82 | Chu DEF +5% |
| Kyomei / 176 | Normal ability 683, field ability 209 | Qiang Tribe ATK +5% |
| Kyoushou / 89 | Ura 10334 / 10336, field abilities 209 / 210 | Qiang Tribe ATK +5%, DEF +5% |
| Toujou / 223 | CW slot 3, skill 579, text 577, effect 2268 | Infantry DEF +12.4% |
| Koushou / 24 (legacy slug `jiou`) | CW slot 2, skill 279, text 279, effect 1401 | Archer HP +6.9%, corrected from +15.9% |

Normal/Ura values are at skill Lv99: the all-army field rate uses
`effectLvB / 10000`. CW passive values use `effectValue1 / 100`. The read-only
verifier checks these values, the correct mode, target selectors, release dates,
owner assignments and original strings directly against the master/STBL files.

The Qiang Tribe category uses the game's `belongId=16` (`羌族`) and existing
EN/JA/AR/FR terminology. It uses the existing Kyoukai portrait.

Koushou's old profile borrowed skill 282's name/value while his owner assignment
points to skill 279. The profile and buff entry now agree with the owner-linked
6.9% skill. Its source mapping is exact, and the generated Japanese text is the
original text at index 279. The other ambiguous source mappings remain unassigned.

All pre-existing ownership IDs and frozen legacy mappings are preserved. Added
sources have independent new IDs and begin unowned in an existing save; owning a
previous normal or red-crystal source does not grant the added upgrade. The added
5% sources do not alter existing shard/red-crystal combinations.
Normal/Ura labels identify the independently selectable upgrades in all four
locales. The modal's general count counts owners once when they have multiple
sources for the same target/stat.

Reproduce the source verification without modifying any files:

```text
python scripts/validate_buff_corrections.py C:\kingdom_data
python scripts/localization/extract_ja_text.py --verify
```

The first command requires the pinned local game dump and is intentionally not a
normal CI/build dependency. Repository tests cover stable ownership, independent
normal/Ura selection, owner identity, the corrected profile and localization.
