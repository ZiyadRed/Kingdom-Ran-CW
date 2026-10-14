# Choushi and Raiki LG / Buff Tracker update

The official [Choushi notice](https://www.kingdomran.jp/info/lg_chousi) and
[Raiki notice](https://www.kingdomran.jp/info/lg_raiki), published October 12,
announce their Ura skills after October 14 maintenance and LG at 18:00 JST
(12:00 Riyadh). Exact assignments and values were checked against the fresh
`v8.7.0_20261014_cca859f8` snapshot in `C:/kingdom_data/decrypted`.

## CW contributions

| Owner | Assigned Ura source | Target | Stat at Lv99 |
|---|---|---|---|
| Choushi / 丁之, character 133 | general 592, binding 433, slot 2, skill 11001, field 222 | Moubu Army (`belongId=27`) | DEF +5% |
| Choushi / 丁之 | general 592, binding 433, slot 6, skill 11002, field 159 | Infantry | DEF +5% |
| Raiki / 来輝, character 134 | general 594, binding 436, slot 2, skill 11008, field 226 | Moubu Army (`belongId=27`) | ATK +5% |
| Raiki / 来輝 | general 594, binding 436, slot 6, skill 10909, field 91 | Infantry | ATK +5% |

These use CW field target types 22 (ATK) and 23 (DEF), with the Lv99 percentage
`effectLvB / 10000`. `MsgMstBelong.stbl[27]` is `蒙武軍`. The new category reuses
the established `Moubo Army` key and EN/JA/AR/FR labels, with Moubu's portrait.
There is no CW HP buff. The Hero Rise skills and ordinary battlefield
`全軍全能力強化【蒙武軍】` have different field target types and are excluded.
LG deputy effects are ordinary battlefield effects, so they do not enter CW totals.

Each new selectable contribution has its own authored ownership UUID and starts
unowned in existing saves. The existing Choushi Infantry ATK and Raiki Infantry
DEF normal-skill +5% entries retain their UUIDs, values and shard labels; their
new Normal labels distinguish them from Ura. Frozen legacy aliases are unchanged.

## Artwork and identity

| Owner | LG general | Asset join | Native LG icon |
|---|---:|---|---|
| Choushi | 593 | asset 697 -> design 24, image 3 | `character/icon/cg024_i03.png` |
| Raiki | 595 | asset 699 -> design 25, image 3 | `character/icon/cg025_i03.png` |

Both LG upgrade rows have `lgGroupType=4` (LG2). Existing source IDs, canonical
names, URLs, Infantry type and Qin/Moubu Army affiliations already agree with
the current source. Initial SR rarity remains correct for CW unlock costs.
The three CW skill assignments on each officer are unchanged: Choushi
802/805/806 and Raiki 802/803/804. No ordinary battlefield skill is added to
their CW character profiles.

Finished banners use the original official PNGs:

- [Choushi LG](https://s3.ap-northeast-1.amazonaws.com/official-operation.s3.sand.okp.mobcast.io/wp-content/uploads/2026/09/25190005/LG-4.png)
- [Raiki LG](https://s3.ap-northeast-1.amazonaws.com/official-operation.s3.sand.okp.mobcast.io/wp-content/uploads/2026/09/25190004/LG-3.png)

Both are 313x440 RGBA, compared with the notices' 213x300 previews. The full
banner and thumbnail twins use lossless WebP at the source dimensions; icons
use the native 120x120 LG artwork. All six outputs were compared pixel-for-pixel
with their sources. No crop, repaint or enlargement was applied. The content
hash asset manifest refreshes cached portraits across archive, Builder and buffs.

`data/source/moubu_officers_2026-10-14.json` records the five-master manifest,
independent STBL hashes, exact original Japanese names/descriptions, all joins,
mode exclusions, retained ownership and artwork hashes. This evidence is not
imported into the runtime. The older staged September 30 catalogue remains a
historical preparation record.

Read-only source verification:

```text
python scripts/validate_moubu_officers.py C:\kingdom_data
```

Add `--official-art <directory>` when the downloaded originals named
`choushi-LG.png` and `raiki-LG.png` are available to repeat exact pixel checks.

## Validation

- Source verifier passed all four new assignments, both retained normal sources,
  LG asset/upgrade joins, unchanged CW assignments, mode exclusions and six
  exact artwork conversions.
- 710 unit tests, lint, catalog/source/artifact validators, production build and
  prerender/SEO checks passed.
- Built Chromium checks passed EN/JA/AR/FR at 1440x900 and 390x844: three-script
  search, all four independent toggles, original normal ownership, owned totals,
  reload persistence, and both officers' card/icon URLs and content hashes.
  No console warnings/errors or page overflow. Screenshots and source-row
  control bounds were checked in all eight locale/viewport combinations.
- 16 existing archive-state and regular-buff-identity browser regressions passed.
- Original staged patch remained byte-identical throughout development validation.

The release candidate is isolated on the published `main` baseline and contains
only this session's 15 paths. The 22 pre-existing staged future-content paths
are excluded. The asset-version manifest is generated from that clean release
copy and changes only the six Choushi/Raiki artwork hashes. The isolated copy
passes 706 unit tests and all eight targeted locale/viewport flows; its current
source check verifies 661 deterministic CW mappings. These counts exclude the
unrelated staged tests and future CW6 entry present in the development checkout.
The complete local CI-mode release gate also passes 324 browser checks with
24 expected locale-specific skips.

The historical `extract_ja_text.py --verify` refuses the current October 14
master hash because it is pinned to September 30. A separate read-only check
confirmed that all five retained raw Japanese STBL hashes/strings, 662
deterministic CW mappings and the character-name placeholder index still match
the current October 14 source. No historical provenance or raw artifacts were
rewritten. Temporary verification scripts, results and PNGs are retained under
`%TEMP%/ranhq-moubu-20261014`.
