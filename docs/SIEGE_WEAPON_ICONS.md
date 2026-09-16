# Buff Tracker siege weapon icons

The icons come from the Castle War (Union Conquest) atlas, not the older
`siege_weapon/gimmick_*` set. Both category selectors show all four types;
detail headings use the first weapon in the corresponding category.

Source: `C:/kingdom_data/decrypted`, inspected 2026-09-16.
`mstUnionConquestWeapons.id` identifies each weapon, `weaponType` selects attack
(1) or defense (2), and `imgId` selects its artwork. The client library's
`DataPath::makeUnionBattleAttackWeaponIcon` / `makeUnionBattleDefenseWeaponIcon`
use `atk_%03d_%02d.png` / `def_%03d_%02d.png`. These exports use the base `_01`
appearance consistently, without implying an owned weapon level.

Each WebP is a lossless extraction from `union_battle_ui/AT_ui_union_battle01.png`,
using the matching plist frame and restoring its original 99x99 or 100x100 transparent
canvas with `sourceColorRect`. No recoloring or generated artwork.

| Weapon ID | Original Japanese | Type | Image ID | Atlas frame | Export |
|---|---|---|---|---|---|
| 1 | 争覇床弩車 | 1 | 1 | `atk_001_01.png` | `public/icons/siege/atk_001.webp` |
| 2 | 争覇井闌車 | 1 | 3 | `atk_003_01.png` | `public/icons/siege/atk_003.webp` |
| 5 | 争覇破城槌 | 1 | 4 | `atk_004_01.png` | `public/icons/siege/atk_004.webp` |
| 7 | 争覇呂公車 | 1 | 5 | `atk_005_01.png` | `public/icons/siege/atk_005.webp` |
| 3 | 争覇投石台 | 2 | 2 | `def_002_01.png` | `public/icons/siege/def_002.webp` |
| 4 | 争覇床弩台 | 2 | 1 | `def_001_01.png` | `public/icons/siege/def_001.webp` |
| 6 | 争覇夜叉擂 | 2 | 3 | `def_003_01.png` | `public/icons/siege/def_003.webp` |
| 8 | 争覇塞門刀車 | 2 | 4 | `def_004_01.png` | `public/icons/siege/def_004.webp` |

Source SHA-256 (this asset extraction only; independent of historical localization pins):

- `masters_001.bin`: `5649a995c2d6a18768b980c82910edbc6328abd0cbde6c96a6e23d7c02d32eb2`
- `masters_002.bin`: `5fa42e376dbe0156f67a47b1f7801e318a697fc685ffadd66040e6b961e69a3a`
- `masters_003.bin`: `759d7b3a6cfc29b8a19296661c827cfdb7dce6290e6fe04ac6088a285ff40607`
- `masters_004.bin`: `33e28e96ad73323d02d111f46693c218bfafeb760cf3dc7940484bef9b6d374c`
- `masters_005.bin`: `c37b5b604619e9601a8d08817de348cbb72854e90ea7bdee0139da950eec071c`
- `union_battle_ui/AT_ui_union_battle01.png`: `5d9b988d27b95da54fa3e1874fe4c0544da94e163be548066786de604e13cce2`
- `union_battle_ui/AT_ui_union_battle01.plist`: `eb6942ccbee784a5f1f32dc4cdaf1d30d1abd63f11d4139ceb75621045ee7801`
