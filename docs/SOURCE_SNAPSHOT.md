# Pinned Japanese source snapshot

The extractor and checked-in provenance require **v8.6.0_20260826_c23b0a22**,
dated **2026-08-26**. `data/source/_provenance.json` records
`C:\kingdom_data\decrypted` as the source root. This is a machine path, not an
immutable archive. Preserve raw game inputs outside the public repository.

## Current reproducibility boundary

As of 6 September 2026, no matching raw snapshot was found in the available
Kingdom data directories, older July/August snapshots, desktop game-data copies,
or the inspected RanHQ/localization backup archives. The named snapshot JSON
under `C:\kingdom_data\snapshots` contains summaries/row hashes, not the original
five binary masters and STBL files. It cannot reproduce their byte hashes.

The default read-only verifier fails before writing anything:

```text
masters_001.bin
actual:   5DFD05438B0CC10507438A171CC83872A421F66DEE9D3F3C86D1909ABBC3271B
expected: E054EDB9D12229933621BAA2C9D40E5AB2A06DC0859C75FC46ECCA2B08222A8A
```

The 2026-08-05 and 2026-07-29 copies and the KingdomViewer master copy also
have different hashes. The missing historical raw snapshot remains an **external
prerequisite for original-source re-extraction**. Internal source-map, raw-artifact
and generated-locale validation passes against the checked-in artifacts; it does
not establish that the original input files are available. No pinned hashes or
source artifacts were changed to hide this boundary.

## Required input tree and hashes

Provide either the complete decrypted directory below, or its parent containing
`decrypted/`. The `master/` child is required to identify a direct source root.

```text
decrypted/
  masters_001.bin ... masters_005.bin
  master/
    MsgUnionConquestSkillName.stbl
    MsgUnionConquestSkillDesc.stbl
    MsgUnitGeneralRubyName.stbl
    MsgUnitGeneralName.stbl
    MsgUnionConquestSkillEffectDesc.stbl
```

| Master file | Required SHA-256 |
| --- | --- |
| masters_001.bin | E054EDB9D12229933621BAA2C9D40E5AB2A06DC0859C75FC46ECCA2B08222A8A |
| masters_002.bin | 9D98E3326302178D0FBE9348A0D8662B248DFF5FAFE0CC12C6F7D939616CC179 |
| masters_003.bin | 1BC784A61CD7A6FFB1CE852DA90E88CD1C0FAC2BBD111C37C10722E91A668B04 |
| masters_004.bin | 5D53C8835C5B2CDDE05FD8B415FBC5EF5FF26A8600E8A2912E047D69A22F73E7 |
| masters_005.bin | 10C71F47F31FB9AEE74C02C91ADBB232750008FDF4F799E08B3D3E2123766E72 |

The master manifest is exactly 405 UTF-8 bytes: one
`<filename>:<UPPERCASE_SHA256>\n` line for each file in numeric order.
Its required SHA-256 is
`59408FDF1D9E5A6B0A18DA30D4175EE90B2D0B2554E7D17D53FFD04B91A931E0`.

STBL files are not covered by that manifest; their independent hashes are:

| STBL file | Required SHA-256 |
| --- | --- |
| MsgUnionConquestSkillName.stbl | D3B5125440EB5C8F1FF59D447038F15795D9B463597C8602A07ECDD2DBF8F501 |
| MsgUnionConquestSkillDesc.stbl | 96EDB05B41417D24336EE743D04B929550D1DF1A0C1149B06B3584C178098452 |
| MsgUnitGeneralRubyName.stbl | C37D1BCF3D49CCEBDF50F904634E94B3E891288AC52022E7E054D08C356BFF0A |
| MsgUnitGeneralName.stbl | 2AC16EBA8D8D399B590A65025AF8540B24193C0376BA1F5CD74D5CB3EFB9DB18 |
| MsgUnionConquestSkillEffectDesc.stbl | 96A4DD9BD740BD598F6F4080630DBBA096AA13E9DB38ED7E1740764FC186950C |

## Verifier setup

Python 3 and `msgpack` are required. These PowerShell examples are read-only:

```powershell
python scripts/localization/extract_ja_text.py --verify 'C:\path\to\snapshot\decrypted'
# Or supply the same source directory through the environment:
$env:RANHQ_GAME_DATA = 'C:\path\to\snapshot\decrypted'
python scripts/localization/extract_ja_text.py --verify
```

An explicit positional argument takes precedence over `RANHQ_GAME_DATA`.
Without either, `--verify` uses `sourceSnapshot.sourceRoot` from provenance.
The current verifier also compares the recorded absolute `sourceRoot` field:
after locating a byte-identical snapshot elsewhere, review a provenance-only path
relocation to that verified directory before expecting a complete verification.
Retain every hash, label, date and source identity. Do not overwrite a current
emulator extraction to force the old machine path to match.

## Intentional future snapshot update

1. Retain the old snapshot. Capture the new five masters and STBL inputs together
   into a separately named, read-only snapshot with extraction date/version and
   per-file hashes. Verify the copy before using it.
2. In an isolated review tree, deliberately update the extractor's pinned master
   hashes/manifest, snapshot label/date, STBL expectations and corresponding
   provenance/validator constants. Never make hash mismatches optional. The
   existing `refresh_current_source_map.py` is a specific historical maintenance
   script, not a generic safe updater for every new game version.
3. Run the extractor in write mode against the named snapshot, review exact
   stable-ID source joins and raw Japanese changes, retain explicit ambiguity,
   and preserve authored buff ownership IDs and legacy aliases. Do not infer
   missing source relationships from translations, names or array positions.
4. Run `node scripts/localization/build_locale_artifacts.mjs`, review the generated
   diff and all four locale renderers/corpora, then run the original-source
   `--verify` against the same immutable inputs and `npm run check:release`.
5. Record the new input location/hashes and actual results in the reviewed release.
   Keep the source update distinct from deployment and retain reproducible prior
   artifacts. No current snapshot update was performed for the audit remediation.
