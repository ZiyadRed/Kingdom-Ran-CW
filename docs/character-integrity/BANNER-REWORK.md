# Character banner rework

Date: 2026-09-07

The 21 assets from `64130e797d51ca479342e368924d2e425d3a6841` are rejected. The commit is preserved only on `archive/unacceptable-banner-64130e7`; it is not in the `main` history. The classification commit `47d5cbea89730800b27c1e35ad8ffd55b71bbd0f` remains the branch base.

## Visual contract

- The accepted inventory contains 188 finished cards: 170 at 626x880, 8 at 213x300, 7 at 313x440, and 3 at 426x600. The median aspect ratio is 0.71136.
- Accepted art uses an action or environment scene, deliberate face/body framing, readable name and rarity, and transparent ornate outer corners. A flat patterned rarity field is not accepted for a new replacement.
- The normal source is 626x880 with a 320px-wide thumbnail. Existing 313px and 213px sources keep byte-identical full and thumbnail files.
- Accepted files are sharp at gallery size and have no watermark, unrelated variant, stretch, painted repair, invented composite, or generative fill.
- The accepted outer four-pixel dark fraction has median 0.06977 and maximum 0.48750. The rejected batch ranges from 0.82611 to 0.96102, with median 0.87618; all 21 renditions are opaque RGB and have no outer transparency.

## Decisions for all 21 attempts

Every old attempt has an opaque black matte around the irregular frame. A rectangular crop cannot recover transparency without cutting the frame. For flat low-rarity cards, cropping also cannot create the scene depth used by accepted banners.

| Character | Old attempt | Same-source crop | Final outcome |
|---|---|---|---|
| Yugi (`yugi`, 有義) | Black matte; action composition otherwise plausible | Rejected | ACCEPTED NEW BANNER - clean official transparent overview PNG |
| Ketsushi (`kesshi`, 竭氏) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - official transparent candidate still has the flat N presentation |
| Amon (`amon`, 亜門) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Koushou (`jiou`, 江彰) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Douken (`douken`, 道剣) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Shishi (`shishi`, 肆氏) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Gikou (`gii`, 魏興) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Hyou (`hyou`, 漂) | Black matte; action composition otherwise plausible | Rejected | KEEP FALLBACK - no clean official finished action card found |
| Kei (`kei`, 慶) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Hakukisai (`hakukisei`, 白亀西) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Roen (`roen`, 魯延) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Kou (`kou2`, 昂) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Gotan (`gotan`, 剛炭) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Shuki (`shuki`, 朱鬼) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Maki (`maki`, 麻鬼) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Saitaku (`saizatsu`, 蔡沢) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Domon (`domon`, 土門) | Black matte; action composition otherwise plausible | Rejected | ACCEPTED NEW BANNER - clean official transparent overview PNG |
| Kyuugen (`miyamoto`, 宮元) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Saji (`saji`, 左慈) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Jokan (`jokan`, 徐完) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |
| Chouko (`chouko`, 趙高) | Black matte; flat patterned low-rarity presentation | Rejected | KEEP FALLBACK - no suitable authentic finished action card found |

No character qualified as an accepted improved crop.

## Accepted provenance

| Character | Official page | Original file | Preparation | Final file |
|---|---|---|---|---|
| Yugi | https://www.kingdomran.jp/info/231208multipoint | https://dxqkr1fuhva1u.cloudfront.net/wp-content/uploads/73ef67fa7f4cc452f93a278c7803c401.png (313x440 PNG, SHA-256 `764c9c86135c55294a4279a1d8b9f782a6146ce3c7dd388a2f2e722c2759fb6f`) | Lossless PNG-to-WebP conversion; decoded RGBA pixels byte-identical; no crop, resize, retouch, or composite | `public/persos/yugi.webp` and `public/persos/thumbs/yugi.webp`; SHA-256 `4cbd60370394f8493e9c78b4f1369412cabf573b6c212a30d9868d8d5e0321f9` |
| Domon | https://www.kingdomran.jp/info/uraskill_domon | https://dxqkr1fuhva1u.cloudfront.net/wp-content/uploads/2cc9868c061e6374c40da69707c93b7b.png (313x440 PNG, SHA-256 `f1d8ba404a3bcdb5dceed6719458bc26cb33c54d6faea6fa1479f0d998ff0ed3`) | Lossless PNG-to-WebP conversion; decoded RGBA pixels byte-identical; no crop, resize, retouch, or composite | `public/persos/domon.webp` and `public/persos/thumbs/domon.webp`; SHA-256 `f71b038ae8722163f6ac0a75df5e4a969cb5d972662255669f847e1d8f3db230` |

The official Yugi and Domon files preserve alpha at the ornate corners and use complete outdoor action scenes. Their lossless WebP outputs are 313x440, matching an established accepted source size in the repository.

Ketsushi also had a clean official 313x440 PNG candidate. It was rejected because removing the matte did not fix the static full-body N portrait on a plain patterned field.

## Source search and rejection boundaries

- Checked the local decrypted official character layers, character backgrounds, rectangle strips, icons, and card names for the matching design IDs. The 21 have identity-matched character art, but no matching finished action-scene backgrounds. Building new cards from those parts would be an invented composite.
- Checked official Kingdom Ran news/skill pages and the official CDN, including the site sitemap covering 5,902 info URLs. Predictable CDN paths yielded only 120x120 icons or 126x330 rectangle strips for the remaining characters.
- Exact-character database pages were retained as identity evidence only. Their 312x440 `/show` renditions had flattened black corners and were rejected as release assets.
- Fan art, AI-generated art, watermarks, unrelated variants, tiny thumbnails, repainting, and generative fill were excluded.

## Verification

- `npm.cmd run check:release`: PASS.
- Lint and source validation: PASS (209/209 character mappings, 661/661 CW skill mappings, and 10/10 exact role-skill source rows).
- Vitest: PASS (489 tests in 38 files).
- Build, prerender, and SEO: PASS (132 modules, 1,149 route documents plus `404.html`, and 936 canonical localized URLs).
- Chromium: PASS (80 cases across EN, JA, AR, and FR). The banner matrix verifies both accepted files at 390x844, 820x900, and 1440x900, samples their decoded outer alpha, and covers accepted-banner and unresolved-character fallback recovery.
- Manual visual review: PASS (24 captures: two accepted banners x four locales x three viewports). Both cards align with adjacent accepted Qin cards and show no black edge artifact or responsive overflow.
- `git diff --check`: PASS.

The strict outcome is 2 accepted new banners, 0 accepted improved crops, and 19 retained fallbacks.
