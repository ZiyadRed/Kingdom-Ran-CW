# Eiki and Pam LG artwork - 2026-09-16

Replaced existing artwork at the established paths; stable character IDs and localized names remain unchanged. Pamu (パム) is the existing `pam` record.

## Source identity

| Character | characterId | LG generalId | assetId | designNo | image | Game icon |
|---|---:|---:|---:|---:|---:|---|
| Eiki / 英紀 | 254 | 532 | 636 | 227 | 3 | `character/icon/cg227_i03.png` |
| Pam / パム | 241 | 503 | 607 | 226 | 3 | `character/icon/cg226_i03.png` |

Joins: `mstUnitGenerals.characterId` -> LG general row (`rarityId=5`) -> `assetId` = `mstAssetGenerals.id` -> `designNo` / `image`. Both LG rows have `publicTime=1789549200` (2026-09-16 18:00 JST). Icons come from `C:/kingdom_data/decrypted`.

## Official finished banners

- Eiki: https://www.kingdomran.jp/info/lg_eiki
  - Original PNG: https://s3.ap-northeast-1.amazonaws.com/official-operation.s3.sand.okp.mobcast.io/wp-content/uploads/2026/08/31160637/unnamed-file-4.png
- Pam: https://www.kingdomran.jp/info/lg_pamu
  - Original PNG: https://s3.ap-northeast-1.amazonaws.com/official-operation.s3.sand.okp.mobcast.io/wp-content/uploads/2026/08/31160653/unnamed-file-5.png

Both official LG announcements are dated September 14 for September 16 release. The full-size PNG siblings of the embedded 213x300 previews were downloaded successfully and visually verified against those previews. Original finished cards are 313x440 RGBA, including transparent ornate corners and the LG mark. Icons are 120x120.

Converted to lossless WebP with exact RGBA preservation; no cropping, repainting, composites, or upscaling. Full banners and thumbnails use identical 313x440 files, following the existing small-source convention. Every output was decoded and checked pixel-for-pixel against its source.

## File hashes

| Asset | Source SHA-256 | Output path | Output SHA-256 |
|---|---|---|---|
| eiki banner | `881fcfe4cdb16f37a7ebc9567d8673c33b9d221b891967aff89d209305473ded` | `public/persos/eiki.webp` | `dce71496e03a5f266788d3341750fbdbb7f6aae93385a286f730e5e3d3e7444d` |
| eiki banner | `881fcfe4cdb16f37a7ebc9567d8673c33b9d221b891967aff89d209305473ded` | `public/persos/thumbs/eiki.webp` | `dce71496e03a5f266788d3341750fbdbb7f6aae93385a286f730e5e3d3e7444d` |
| eiki icon | `2a56d4080cf5c1aa4d157c0c2f6b907061a5b79a0dd133bab83f1be4ab482784` | `public/icons/Eiki.webp` | `33db2c4ea2516e05d6f52856a16934000c9b255fcac6362062b50315c720d44f` |
| pam banner | `31143cc45b9327aca80ab34bb075acaa367d10a7d4f8920c40818f5062e52947` | `public/persos/pam.webp` | `1f42d6b3650eaeb13885a242c81154b0949c947f30e68496fdd0ad86fc8f2376` |
| pam banner | `31143cc45b9327aca80ab34bb075acaa367d10a7d4f8920c40818f5062e52947` | `public/persos/thumbs/pam.webp` | `1f42d6b3650eaeb13885a242c81154b0949c947f30e68496fdd0ad86fc8f2376` |
| pam icon | `595cb0467bcc26183221f1d381638feb53b44911ad559712c1223f189e06a7eb` | `public/icons/Pam.webp` | `4a52c900bd7a77dccdfb3d87ee7e1998d9c42091b39b5b7c251a1eb01c478139` |
