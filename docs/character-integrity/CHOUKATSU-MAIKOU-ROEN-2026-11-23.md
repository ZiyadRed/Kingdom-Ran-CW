# Choukatsu, Maikou and Roen — November 23, 2026

Official announcements published November 23 cover **SR/UR 趙括**, **SR/UR 昧広** and
**SR/UR/LG 魯延**, all arriving with the Ver8.9.0 maintenance on November 25
(14:00–18:00 JST). Owner instruction (2026-11-23): publish immediately from the
announcement, with no release-time gate.

- [Choukatsu announcement](https://www.kingdomran.jp/info/srur_chokatsu)
- [Maikou announcement](https://www.kingdomran.jp/info/srur_maikou)
- [Roen announcement](https://www.kingdomran.jp/info/urlg_roen)
- [Maintenance notice](https://www.kingdomran.jp/info/261123maintenance)
- Exact source/provenance: `data/source/announced_characters_2026-11-23.json`.

## Source snapshot

Local acquisition dated November 18 (masters manifest
`1BD25A5D8573341567E28830A3501BB14DC08738321EEB6D7B2CED32A97AC414`), from
`C:\kingdom_data\decrypted`. It already contains the new general rows, names,
readings and normal/ura buff abilities, but **not** the new CW kits:
`mstUnionConquestGenerals` 270 and 271 still carry generic placeholder skill 1.

## Identity

| Character | Character ID | Published general IDs | Classification |
|---|---:|---|---|
| Choukatsu / 趙括 / تشوكاتسو | 270 | SR 571, UR 572 | Zhao, Cavalry (attributeId 1) |
| Maikou / 昧広 / مايكو | 271 | SR 574, UR 575 | Zhao, Cavalry (attributeId 1) |

Readings ちょうかつ / まいこう come from the exact general/ruby STBL joins.
Future LG generals 573 and 576 (publicTime 2030) are excluded.

## CW skills

All six Choukatsu/Maikou CW skills are **pending_source**: null canonical IDs,
names and descriptions copied verbatim from the official announcements, and
effect rows modelled from that text. Promote them to `exact` once the Ver8.9.0
data is acquired.

New effect shapes, rendered semantically in EN/JA/AR/FR:

- `Enemy [Leader]` — damage aimed at the opposing formation's 争覇総大将
  (JA 敵争覇総大将, AR قائد العدو, FR Leader ennemi). The French renderer also
  now renders `Ally [Leader]` / `Ally [Strategist]` (previously left in English).
- `Ally [Zhao] vs confused enemy [General]` — Maikou's ATK bonus applies only
  against enemies under Confusion. It is situational, so it is not added to flat
  Builder totals; the four resulting Builder-audit findings are acknowledged in
  `builder_audit_baseline.json`.

Roen's CW skills (80/177/294) are unchanged in the source and the announcement.

## Buff Tracker

| Source | Category | Stat | Value | Evidence |
|---|---|---|---:|---|
| Choukatsu | Zhao | ATK | 5% | normal ability 1681, UR general 572 slot 5, field 187 |
| Maikou | Zhao | ATK | 5% | normal ability 1681, UR general 575 slot 5, field 187 |
| Roen | Hishin Unit | DEF | 5% | normal ability 1769, UR general 607 slot 5, field 90 |
| Roen | Shield | DEF | 5% | ura skill 10842, binding 414 slot 6, field 96 |

Values are `effectLvB / 10000` at Lv99. Each source has a new ownership UUID;
old saves leave them unowned. Roen's rows use type `R`, matching his initial
rarity like other R→LG generals.

Not added: Youka's announced 裏スキル 争覇攻撃力強化【秦】 (no binding or row in the
November 18 data, so the value cannot be verified), and the newly unlocked
呉慶 争覇総大将 / 剛摩諸 争覇軍師 skills (announced without names or effects;
still 0 in the data).

## Artwork

Official 313×440 PNG cards from the announcement pages, SHA-256 verified
byte-identical to the official CDN files, converted to lossless WebP (decoded
RGBA identical) with byte-identical thumbnail twins: Roen **LG** (new banner,
replacing the fallback), Choukatsu UR and Maikou UR. Choukatsu/Maikou native
icons are not yet available (both assets map to placeholder design 216), so the
portrait fallback uses the card. OG cards were generated for the three generals
only, with the same template and font families (local @fontsource copies).
