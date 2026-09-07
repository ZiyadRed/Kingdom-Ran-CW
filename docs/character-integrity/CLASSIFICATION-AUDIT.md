# Complete character classification audit — 2026-09-07

Baseline: `eb353795305b9c5c3cbb853a66a98d334f2364e5`. All 209 records checked before mutation. The companion JSON contains exact selected/source IDs, original game rows, secondary comparisons and per-record notes.

## Source decisions

- Primary: independently hashed current decrypted game masters. This is new classification evidence, not a replacement for the historical localization snapshot. F19 hashes and artifacts remain unchanged.
- `countryId` is resolved through `MsgMstCountry.stbl`, not the incorrect numeric country map in an old local reference note.
- `attributeId`: 0 Infantry, 1 Cavalry, 2 Archer, 3 Shield. All exact-name secondary matches support the selected type. The official archer pack independently includes Douken, Chouko and Domon: https://www.kingdomran.jp/info/250424rengekipack .
- Highest public rarity within each existing stable-ID mapping determines the single roster type. Shin, Kyoukai and Hyou change type by rarity; their existing higher-rarity selection is preserved. No new variants are published.
- Membership comes from `belong1Id`, `belong2Id`, `belong3Id` through `MsgMstBelong.stbl`. Legacy `belongId` is NOT a membership source: it holds 8 even for Bananji and Shunsuiju, whose numbered membership slots are empty. The independently retrieved Japanese directory confirms they are not Hi Shin Unit members.
- The existing English taxonomy is retained. Duplicate Gyokuhou Unit/Gyokuhou membership is normalized to Gyokuhou. Story army associations are not treated as game targeting tags. Secondary omissions for newer Makou/Ousen and Coalition memberships do not override explicit numbered game slots.
- All 209 Leader/Strategist assignments were independently checked against mstUnionConquestGenerals chiefGeneralSkillId/tacticianSkillId: all 10 role rows match; no role edits. See role-audit.json.
- Classification consumers: Archive faction grouping/counts, localized search (unit, country, groups, rarity), shared pickers, Builder faction accents, roster targeting in Battle Order, tier grouping by members, buff faction buckets, SEO faction descriptions, share text. Stable IDs, routes, saved schemas and skill payloads are unchanged. Initial-rarity cost corrections and verified unit-type targeting are the only dependent calculation changes.
- Initial-rarity boundary resolved: the two independent guides below establish that CW costs use initial rarity, including N=485. All archive and cost rarity assignments are now compared to the minimum mapped public rarityId. Existing approximate base stats for characters without CW_MAX rows are preserved explicitly as internal fallback tiers; these are not presented as game classifications.

## All characters

| ID | EN | JA | Faction before → verified | Type before → verified | Tags before → verified | Change | Confidence | Evidence / ambiguity |
|---|---|---|---|---|---|---|---|---|
| akou | Akou | 亜光 | qin → qin | Cavalry → Cavalry | Akou Army, Ousen Army → Akou Army, Ousen Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=253; general IDs 528,529; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/764027  |
| amon | Amon | 亜門 | qin → zhao | Archer → Archer | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=8; general IDs 2; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728243  |
| bain | Bain | 馬印 | qin → qin | Infantry → Infantry | Kanki Army → Kanki Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=225; general IDs 432,433; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728512  |
| bajio | Bajio | バジオウ | mountain_folk → mountain_folk | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=5; general IDs 95,123; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728268  |
| bakan | Bakan | 馬関 | han → han | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=230; general IDs 455,456,457; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728283  |
| bakukoshin | Bakukoshin | 縛虎申 | qin → qin | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=50; general IDs 57,200; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728514  |
| bamyu | Bamyu | バミュウ | chu → chu | Infantry → Infantry | Karin Army → Coalition Army, Karin Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=172; general IDs 265,584,585; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728292  |
| bananji | Bananji | 馬南慈 | zhao → zhao | Cavalry → Cavalry | Coalition Army → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=215; general IDs 393,394; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728260  |
| banyou | Banyou | 番陽 | qin → qin | Shield → Shield | — → Gyokuhou | YES | High (faction/type/tags) | mstUnitGenerals characterId=52; general IDs 16,268; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728515  |
| batei | Batei | 馬呈 | zhao → zhao | Cavalry → Cavalry | Kisui Army, Rigan → Kisui Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=214; general IDs 391,392; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728259  |
| beiman | Beiman | 貝満 | chu → chu | Cavalry → Cavalry | Kanmei Army → Coalition Army, Kanmei Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=191; general IDs 324,587; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728293  |
| bihei | Bihei | 尾平 | qin → qin | Infantry → Infantry | Hi Shin Unit → Hi Shin Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=54; general IDs 52,113,446,447; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728517  |
| bikou | Bitou | 尾到 | qin → qin | Shield → Shield | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=53; general IDs 25,448,449,450; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728516  |
| budai | Budai | ブダイ | ai → ai | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=236; general IDs 479,480; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728273  |
| chouin | Chouin | 張印 | han → han | Shield → Shield | — → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=161; general IDs 458,459; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728280  |
| chouko | Chouko | 趙高 | zhao → qin | Cavalry → Archer | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=93; general IDs 17; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728533  |
| choushi | Choushi | 丁之 | qin → qin | Infantry → Infantry | Moubo Army → Moubo Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=133; general IDs 217,592; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/785648  |
| chousou | Chousou | 趙荘 | zhao → zhao | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=94; general IDs 73,210,423; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728582  |
| choutou | Choutou | 張唐 | qin → qin | Shield → Shield | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=141; general IDs 225,337; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728504  |
| chouyou | Chouyou | 丁陽 | qin → qin | Shield → Shield | Makou Army, Ousen Army → Makou Army, Ousen Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=256; general IDs 535,536; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/793790  |
| chutetsu | Chutetsu | 中鉄 | qin → qin | Infantry → Infantry | Hi Shin Unit → Hi Shin Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=43; general IDs 326; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728503  |
| danto | Danto | ダント | mountain_folk → mountain_folk | Cavalry → Cavalry | Figo Tribe → Figo Tribe | NO | High (faction/type/tags) | mstUnitGenerals characterId=239; general IDs 497,498; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/746188  |
| denei | Denei | 田永 | qin → qin | Shield → Shield | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=44; general IDs 54,271,356; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728505  |
| denrimi | Denrimi | 田里弥 | qin → qin | Archer → Archer | Ousen Army → Ousen Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=250; general IDs 522,523; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/751613  |
| denyuu | Denyuu | 田有 | qin → qin | Cavalry → Cavalry | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=45; general IDs 65,190,334; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728506  |
| domon | Domon | 土門 | zhao → qin | Archer → Archer | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=130; general IDs 212; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728507  |
| douken | Douken | 道剣 | zhao → qin | Cavalry → Archer | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=48; general IDs 3; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/729405  |
| doukin | Doukin | 同金 | qin → qin | Cavalry → Cavalry | — → Ouki Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=47; general IDs 42,186,291,478; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728510  |
| duke_hyou | Duke Hyou | 麃公 | qin → qin | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=99; general IDs 96,124; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728536  |
| duke_sei | Duke Sei | 青公 | zhao → zhao | Archer → Archer | Kisui Army → Kisui Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=221; general IDs 409,410; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728258  |
| ei_sei | Ei Sei | 嬴政 | qin → qin | Shield → Shield | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=98; general IDs 29,87,115; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728535  |
| eiki | Eiki | 英紀 | qin → qin | — → Infantry | Akou Army, Ousen Army → Akou Army, Ousen Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=254; general IDs 530,531; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/784165  |
| en | En | 渕 | qin → qin | Infantry → Shield | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=86; general IDs 64,114,604,605; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728525  |
| entei | Entei | 燕呈 | qin → qin | Infantry → Infantry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=135; general IDs 219,401,402; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728485  |
| fuji | Fuji | フゥヂ | mountain_folk → mountain_folk | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=143; general IDs 227,489,490; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728264  |
| futei | Futei | 傳抵 | zhao → zhao | Cavalry → Cavalry | Riboku Army → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=170; general IDs 260,261,318; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. No exact Japanese-name match in secondary directory; primary stable-ID evidence retained. |
| gaimou | Gaimou | 凱孟 | wei → wei | Cavalry → Cavalry | Wei Fire Dragon → Wei Fire Dragon | NO | High (faction/type/tags) | mstUnitGenerals characterId=180; general IDs 283,284; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728311  |
| gakuei | Gakuei | 岳嬰 | zhao → zhao | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=210; general IDs 382,383; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728245  |
| gakujou | Gakujou | 楽乗 | zhao → zhao | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=124; general IDs 202,412; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728246  |
| gakuki | Gakuki | 楽毅 | yan → yan | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=118; general IDs 157,163; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728289  |
| gakurai | Gakurai | 岳雷 | qin → qin | Cavalry → Cavalry | Hi Shin Unit, Hyoukou Army / Hi Shin Unit → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=202; general IDs 353,354; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728494  |
| garo | Garo | 我呂 | qin → qin | Cavalry → Cavalry | Hi Shin Unit → Hi Shin Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=178; general IDs 280,424; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728491  |
| gekishin | Gekishin | 劇辛 | yan → yan | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=113; general IDs 152,158; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728290  |
| genpo | Genpo | 玄峰 | wei → wei | Archer → Archer | Renpa Army, Renpa's Four Heavenly Kings → Renpa Army, Renpa's Four Heavenly Kings | NO | High (faction/type/tags) | mstUnitGenerals characterId=20; general IDs 80,244,358; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728314  |
| gii | Gikou | 魏興 | wei → qin | Archer → Archer | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=97; general IDs 13; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728534  |
| gika | Gika | 魏加 | zhao → zhao | Archer → Archer | Chinese Ten Bows → Chinese Ten Bows | YES | High (faction/type/tags) | mstUnitGenerals characterId=96; general IDs 62,245,355; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728584  | Duplicated rarity-file faction corrected.
| gohoumei | Gohoumei | 呉鳳明 | wei → wei | Archer → Archer | Coalition Army, Wei Fire Dragon → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=149; general IDs 233,292; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728316  |
| gokei | Gokei | 呉慶 | wei → wei | Shield → Shield | Wei Fire Dragon → Wei Fire Dragon | NO | High (faction/type/tags) | mstUnitGenerals characterId=21; general IDs 90,118; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728315  |
| gotan | Gotan | 剛炭 | mountain_folk → wei | Infantry → Infantry | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=25; general IDs 11; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728317  |
| goumasho | Goumasho | 剛摩諸 | chu → chu | Shield → Shield | Kanmei Army → Coalition Army, Kanmei Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=192; general IDs 325,586; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728297  |
| goutoku | Goutoku | 豪徳 | chu → chu | Archer → Archer | Karin Army → Coalition Army, Karin Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=249; general IDs 519,520,521; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/736881  |
| hairou | Hairou | 沛浪 | qin → qin | Infantry → Infantry | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=85; general IDs 51,192,420; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728524  |
| hakuki | Hakuki | 白起 | qin → qin | Shield → Shield | Six Great Generals → Six Great Generals | NO | High (faction/type/tags) | mstUnitGenerals characterId=114; general IDs 153,159; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728513  |
| hakukisei | Hakukisai | 白亀西 | qin → wei | Archer → Shield | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=49; general IDs 21; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728322  |
| hakurei | Hakurei | 白麗 | chu → chu | Archer → Archer | Chinese Ten Bows, Karin Army, Rinbukun Army → Chinese Ten Bows, Coalition Army, Karin Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=159; general IDs 248,249,333; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728302  |
| hakusui | Hakusui | 白翠 | chu → chu | Archer → Archer | Rinbukun Army → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=188; general IDs 303,304; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728301  |
| hamui | Hamui | ハムイ | ai → ai | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=235; general IDs 472,473; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728272  |
| hanoki | Hanoki | 樊於期 | ai → ai | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=197; general IDs 335,336; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728275  |
| hanroki | Hanruki | 樊琉期 | ai → ai | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=201; general IDs 350,351; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728276  |
| heirai | Heirai | 平来 | qin → qin | Infantry → Infantry | Hi Shin Unit → Hi Shin Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=263; general IDs 554,555; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/805889  |
| heki | Heki | 壁 | qin → qin | Shield → Shield | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=57; general IDs 35,81,180,288; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728520  |
| hokaku | Hokaku | 蒲鶮 | qin → qin | Infantry → Infantry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=234; general IDs 469,470,471; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728495  |
| hoki | Fuuki | 馮忌 | zhao → zhao | Archer → Archer | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=95; general IDs 85,216,411; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728583  | Duplicated rarity-file faction corrected.
| houken | Houken | 龐煖 | zhao → zhao | Infantry → Infantry | Coalition Army, Zhao's New Three Great Heavens → Coalition Army, Zhao's New Three Great Heavens | NO | High (faction/type/tags) | mstUnitGenerals characterId=100; general IDs 100,128; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728585  |
| hyou | Hyou | 漂 | qin → qin | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=55; general IDs 70,112; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728518 Type changes by rarity; highest mapped public rarity used, preserving existing one-record model. |
| hyouki | Hyouki | 氷鬼 | wei → wei | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=145; general IDs 229,418,419; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728323  |
| hyoushiga | Hyoushiga | 豹司牙 | qin → qin | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=187; general IDs 301,302; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728519  |
| jinou | Jinou | 仁凹 | chu → chu | Archer → Archer | Kanmei Army → Coalition Army, Kanmei Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=189; general IDs 321,588; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728300  |
| jiou | Koushou | 江彰 | zhao → zhao | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=24; general IDs 1; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728252  |
| jokan | Jokan | 徐完 | zhao → qin | Infantry → Infantry | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=31; general IDs 12; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728545  |
| junso | Junso | 荀早 | wei → wei | Shield → Shield | Wei Fire Dragon → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=185; general IDs 297,298; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728331  |
| ka | Ka | 太子嘉 | zhao → zhao | Infantry → Infantry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=240; general IDs 499,500; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/746189  |
| kaen | Kaen | 媧偃 | chu → chu | Cavalry → Cavalry | Karin Army → Coalition Army, Karin Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=173; general IDs 266,371; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728306  |
| kaine | Kaine | カイネ | zhao → zhao | Cavalry → Cavalry | Riboku Army → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=1; general IDs 68,171,319; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728199  |
| kaioku | Kaioku | 介億 | qin → qin | Archer → Archer | Shouheikun Army → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=175; general IDs 272,342; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728492  |
| kaishibou | Kaishibou | 介子坊 | wei → wei | Cavalry → Cavalry | Renpa Army, Renpa's Four Heavenly Kings → Renpa Army, Renpa's Four Heavenly Kings | NO | High (faction/type/tags) | mstUnitGenerals characterId=14; general IDs 79,243,359; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728310  |
| kakubi | Kakubi | 郭備 | qin → qin | Shield → Shield | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=2; general IDs 63,416,417; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. No exact Japanese-name match in secondary directory; primary stable-ID evidence retained. |
| kakukai | Kakukai | 郭開 | zhao → zhao | Infantry → Infantry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=203; general IDs 357,493; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728244  |
| kakuun | Kakuun | 角雲 | qin → qin | Shield → Shield | Kanki Army → Kanki Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=226; general IDs 436,437; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728493  |
| kanjou | Kanjou | 関常 | qin → qin | Cavalry → Cavalry | Gyokuhou, Gyokuhou Unit, Ousen Army → Gyokuhou, Ousen Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=184; general IDs 295,296; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728498  |
| kanki | Kanki | 桓騎 | qin → qin | Cavalry → Cavalry | Kanki Army → Kanki Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=16; general IDs 103,131; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728497  |
| kanmei | Kanmei | 汗明 | chu → chu | Cavalry → Cavalry | Coalition Army, Kanmei Army → Coalition Army, Kanmei Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=137; general IDs 221,307; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728294  |
| kanou | Kanou | 干央 | qin → qin | Cavalry → Cavalry | — → Ouki Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=15; general IDs 41,189,306,477; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728496  |
| kanto | Kanto | 干斗 | qin → qin | Infantry → Infantry | Hi Shin Unit → Hi Shin Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=262; general IDs 551,552; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/805890  |
| karin | Karin | 媧燐 | chu → chu | Shield → Shield | Coalition Army, Karin Army → Coalition Army, Karin Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=148; general IDs 232,589; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728305  |
| karyoten | Karyoten | 河了貂 | qin → qin | Archer → Archer | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=13; general IDs 38,94,122; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728490  |
| katari | Katari | カタリ | mountain_folk → mountain_folk | Cavalry → Cavalry | Mera Tribe → Mera Tribe | NO | High (faction/type/tags) | mstUnitGenerals characterId=245; general IDs 510,511; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/753976  |
| kei | Kei | 慶 | qin → qin | Infantry → Infantry | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=19; general IDs 23; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728538  |
| keibin | Keibin | 景湣王 | wei → wei | Shield → Shield | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=125; general IDs 203,327; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728313  |
| keisha | Keisha | 慶舎 | zhao → zhao | Archer → Archer | — → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=139; general IDs 223,313; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728250  |
| kesshi | Ketsushi | 竭氏 | zhao → qin | Archer → Archer | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=88; general IDs 10; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728527  |
| kinmou | Kinmou | 金毛 | zhao → zhao | Shield → Shield | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=211; general IDs 385,386; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728249  |
| kishou | Kishou | 紀昌 | zhao → zhao | Shield → Shield | Kisui Army, Rigan → Kisui Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=218; general IDs 399,400; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728247  |
| kisui | Kisui | 紀彗 | zhao → zhao | Cavalry → Cavalry | Kisui Army, Kisui Army / Rigan → Kisui Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=207; general IDs 369,370; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728248  |
| kitari | Kitari | キタリ | mountain_folk → mountain_folk | Cavalry → Cavalry | Mera Tribe → Mera Tribe | NO | High (faction/type/tags) | mstUnitGenerals characterId=237; general IDs 481,482; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728265  |
| kokuou | Kokuou | 黒桜 | qin → qin | Archer → Archer | Kanki Army → Kanki Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=26; general IDs 60,177,372; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728542  |
| koshou | Koshou | 胡傷 | qin → qin | Archer → Archer | Six Great Generals → Six Great Generals | NO | High (faction/type/tags) | mstUnitGenerals characterId=116; general IDs 155,161; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728539  |
| kou | Kou | 向 | qin → qin | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=132; general IDs 214,338; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728540  |
| kou2 | Kou | 昂 | qin → qin | — → Shield | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=23; general IDs 18; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728541  |
| koujyun | Koujun | 高順 | qin → qin | Infantry → Infantry | Makou Army, Ousen Army → Makou Army, Ousen Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=257; general IDs 538,539; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/793786  |
| kouretsu | Kouretsu | 考烈王 | chu → chu | Shield → Shield | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=199; general IDs 343,344; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728295  |
| kourigen | Kourigen | 黄離弦 | wei → wei | Archer → Archer | Chinese Ten Bows → Chinese Ten Bows | NO | High (faction/type/tags) | mstUnitGenerals characterId=12; general IDs 50,201,414; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728309  |
| kousonryu | Kousonryu | 公孫龍 | zhao → zhao | Shield → Shield | — → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=22; general IDs 75,215,422; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728251  |
| kouyoku | Kouyoku | 項翼 | chu → chu | Cavalry → Cavalry | Karin Army, Wei Fire Dragon → Coalition Army, Karin Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=158; general IDs 246,247,332; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728296  |
| kuzen | Kozen | 蒙恬のじぃ | qin → qin | Shield → Shield | — → Gakuka Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=64; general IDs 22,269; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. No exact Japanese-name match in secondary directory; primary stable-ID evidence retained. |
| kyomei | Kyomei | 羌明 | qin → qin | Infantry → Infantry | Hi Shin Unit → Qiang Tribe | YES | High (faction/type/tags) | mstUnitGenerals characterId=176; general IDs 275,276,380; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728529  |
| kyou | Kyou | 摎 | qin → qin | Cavalry → Cavalry | Ouki Army, Six Great Generals → Six Great Generals | YES | High (faction/type/tags) | mstUnitGenerals characterId=84; general IDs 99,127; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728523  |
| kyoubou | Kyobou | 巨暴 | chu → chu | Cavalry → Cavalry | Kanmei Army → Coalition Army, Kanmei Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=251; general IDs 524,525; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/758879  |
| kyouen | KyouEn | 姜燕 | wei → wei | Archer → Archer | Chinese Ten Bows, Renpa Army, Renpa's Four Heavenly Kings → Chinese Ten Bows, Renpa Army, Renpa's Four Heavenly Kings | NO | High (faction/type/tags) | mstUnitGenerals characterId=83; general IDs 78,178,278; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728330  |
| kyougai | Kyogai | 去亥 | qin → qin | Archer → Archer | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=18; general IDs 30,182,434,435; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728500  |
| kyoukai | Kyoukai | 羌瘣 | qin → qin | Cavalry → Cavalry | Qiang Tribe → Hi Shin Unit, Qiang Tribe | YES | High (faction/type/tags) | mstUnitGenerals characterId=90; general IDs 36,105,133; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728530 Type changes by rarity; highest mapped public rarity used, preserving existing one-record model. |
| kyourei | Kyourei | 京令 | qin → qin | Infantry → Infantry | Qiang Tribe → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=233; general IDs 466,467,468; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728537  |
| kyoushou | Kyoushou | 羌象 | qin → qin | Infantry → Infantry | Qiang Tribe → Qiang Tribe | NO | High (faction/type/tags) | mstUnitGenerals characterId=89; general IDs 37,194,305; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728528  |
| kyuukou | Kyuukou | 宮康 | qin → qin | Shield → Shield | Gyokuhou, Gyokuhou Unit, Ousen Army → Gyokuhou, Ousen Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=219; general IDs 403,404,405; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728499  |
| maki | Maki | 麻鬼 | mountain_folk → wei | Archer → Infantry | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=59; general IDs 15; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728324  |
| makou | Makou | 麻礦 | qin → qin | Cavalry → Cavalry | Ousen Army → Makou Army, Ousen Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=255; general IDs 533,534; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. No exact Japanese-name match in secondary directory; primary stable-ID evidence retained. |
| mangoku | Mangoku | 万極 | zhao → zhao | Cavalry → Cavalry | Coalition Army → Coalition Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=60; general IDs 86,196,310; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728261  |
| maron | Maron | 摩論 | qin → qin | Infantry → Infantry | Kanki Army → Kanki Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=120; general IDs 167,270,349; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728521  |
| miyamoto | Kyuugen | 宮元 | zhao → wei | Shield → Shield | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=17; general IDs 19; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728312  |
| moubu | Moubu | 蒙武 | qin → qin | Cavalry → Cavalry | Moubo Army, Ryofui Four Pillars → Moubo Army, Ryofui Four Pillars | NO | High (faction/type/tags) | mstUnitGenerals characterId=62; general IDs 98,126; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728558  |
| mougou | Mougou | 蒙驁 | qin → qin | Shield → Shield | Ryofui Four Pillars → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=65; general IDs 91,119; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728561  |
| mouki | Mouki | 蒙毅 | qin → qin | Shield → Shield | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=61; general IDs 59,211,474; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728557  |
| mouten | Mouten | 蒙恬 | qin → qin | Cavalry → Cavalry | Gakuka Unit → Gakuka Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=63; general IDs 77,93,121; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728559  |
| muta | Muta | ムタ | qin → qin | Infantry → Infantry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=6; general IDs 48,273,451; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728484  |
| naki | Naki | 那貴 | qin → qin | Cavalry → Cavalry | Hi Shin Unit, Kanki Army → Hi Shin Unit, Kanki Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=204; general IDs 363,364; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728511  |
| nakon | Nakon | 奈棍 | han → han | Cavalry → Cavalry | — → Coalition Army, Seikai Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=229; general IDs 452,453,454; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728282  |
| ogiko | Ogiko | オギコ | qin → qin | Archer → Archer | Kanki Army → Kanki Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=171; general IDs 262,263,425; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728481  |
| ordo | Ordo | オルド | yan → yan | Cavalry → Cavalry | Ordo Army → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=140; general IDs 224,317; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728203  |
| otaji | Otaji | オタジ | yan → yan | Archer → Archer | Ordo Army → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=231; general IDs 460,461,462; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728212  |
| ouhon | Ouhon | 王賁 | qin → qin | Cavalry → Cavalry | Gyokuhou, Gyokuhou Unit → Gyokuhou | YES | High (faction/type/tags) | mstUnitGenerals characterId=11; general IDs 82,88,116; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728488  |
| ouken | Ouken | 王建王 | qi → qi | Shield → Shield | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=146; general IDs 230,348; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728285  |
| ouki | Ouki | 王騎 | qin → qin | Cavalry → Cavalry | Ouki Army, Six Great Generals → Ouki Army, Six Great Generals | NO | High (faction/type/tags) | mstUnitGenerals characterId=9; general IDs 97,125; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728486  |
| oukotsu | Oukotsu | 王齕 | qin → qin | Infantry → Infantry | Six Great Generals → Six Great Generals | NO | High (faction/type/tags) | mstUnitGenerals characterId=115; general IDs 154,160; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728489  |
| ousen | Ousen | 王翦 | qin → qin | Shield → Shield | Ousen Army → Ousen Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=10; general IDs 92,120; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728487  |
| pam | Pam | パム | mountain_folk → mountain_folk | Infantry → Infantry | Figo Tribe → Figo Tribe | NO | High (faction/type/tags) | mstUnitGenerals characterId=241; general IDs 501,502; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/776026  |
| queen_biki | Queen Biki | 太后 | qin → qin | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=122; general IDs 173,174; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728502  |
| raido | Raido | 雷土 | qin → qin | Shield → Shield | Kanki Army → Kanki Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=69; general IDs 44,195,376,377; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728565  |
| raiki | Raiki | 来輝 | qin → qin | Infantry → Infantry | Moubo Army → Moubo Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=134; general IDs 218,594; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/785652  |
| ramauji | Ramauji | ラマウジ | mountain_folk → mountain_folk | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=144; general IDs 228,483,484; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728269  |
| ranbihaku | Ranbihaku | 乱美迫 | wei → wei | Shield → Shield | Wei Fire Dragon → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=183; general IDs 293,294; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728326  |
| rankai | Rankai | ランカイ | mountain_folk → mountain_folk | Infantry → Infantry | Hi Shin Unit → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=7; general IDs 55,164,165; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728215  |
| reiou | Reiou | 霊凰 | wei → wei | Archer → Archer | Wei Fire Dragon → Wei Fire Dragon | NO | High (faction/type/tags) | mstUnitGenerals characterId=181; general IDs 285,286; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728328  |
| renpa | Renpa | 廉頗 | wei → wei | Cavalry → Cavalry | Renpa Army, Zhao's Three Great Heavens → Renpa Army, Zhao's Three Great Heavens | NO | High (faction/type/tags) | mstUnitGenerals characterId=78; general IDs 104,132; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728329  |
| riboku | Riboku | 李牧 | zhao → zhao | Shield → Shield | Coalition Army, Zhao's New Three Great Heavens → Coalition Army, Zhao's New Three Great Heavens | NO | High (faction/type/tags) | mstUnitGenerals characterId=72; general IDs 102,130; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728579  |
| rien | Rien | 李園 | chu → chu | Shield → Shield | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=198; general IDs 340,341; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728303  |
| rihaku | Rihaku | 李白 | zhao → zhao | Shield → Shield | — → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=71; general IDs 76,204,413; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728262  |
| rikusen | Rikusen | 陸仙 | qin → qin | Cavalry → Cavalry | Gakuka Unit → Gakuka Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=119; general IDs 166,352; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728567  |
| rinbou | Rinbou | 鱗坊 | qin → qin | Cavalry → Cavalry | — → Ouki Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=77; general IDs 40,187,315,476; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728572  |
| rinbukun | Rinbukun | 臨武君 | chu → chu | Cavalry → Cavalry | Coalition Army → Coalition Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=138; general IDs 222,308; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728304  |
| ringyoku | Ringyoku | リン玉 | qin → qin | Cavalry → Cavalry | Kanki Army → Kanki Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=208; general IDs 374,375; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728571  |
| rinko | Rinko | 輪虎 | wei → wei | Cavalry → Cavalry | Renpa Army, Renpa's Four Heavenly Kings → Renpa Army, Renpa's Four Heavenly Kings | NO | High (faction/type/tags) | mstUnitGenerals characterId=76; general IDs 106,134; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728327  |
| rishi | Rishi | 李斯 | qin → qin | Archer → Archer | Ryofui Four Pillars → Ryofui Four Pillars | NO | High (faction/type/tags) | mstUnitGenerals characterId=70; general IDs 47,494,495,496; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728566  |
| robin | Robin | 呂敏 | qin → qin | Archer → Archer | Hi Shin Unit, Kanki Army → Hi Shin Unit, Kanki Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=227; general IDs 438,439; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728574  |
| roen | Roen | 魯延 | qin → qin | Archer → Shield | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=80; general IDs 24; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728576  |
| rokin | Rokin | 魯近 | chu → chu | Archer → Archer | Rinbukun Army (Coalition) → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=248; general IDs 516,517,518; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/736874  |
| rokuomi | Rokuomi | 録嗚未 | qin → qin | Cavalry → Cavalry | — → Ouki Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=81; general IDs 61,175,384; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728522  |
| rouai | Rouai | 嫪毐 | ai → ai | Shield → Shield | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=200; general IDs 346,347; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728277  |
| rui | Rui | 瑠衣 | qin → qin | Infantry → Infantry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=179; general IDs 281,282; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728573  |
| ryofui | Ryofui | 呂不韋 | qin → qin | Archer → Archer | Ryofui Four Pillars → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=79; general IDs 108,136; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728575  |
| ryuukoku | Ryuukoku | 隆国 | qin → qin | Shield → Shield | — → Ouki Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=73; general IDs 39,188,309,475; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728568  |
| ryuusen | Ryuusen | 竜川 | qin → qin | Infantry → Infantry | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=74; general IDs 67,185,373; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728569  |
| ryuuto | Ryuuto | 劉冬 | zhao → zhao | Infantry → Infantry | Kisui Army, Rigan → Kisui Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=213; general IDs 389,390; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728580  |
| ryuyu | Ryuyu | 竜有 | qin → qin | Infantry → Infantry | Hi Shin Unit → Hi Shin Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=75; general IDs 32; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728570  |
| saizatsu | Saitaku | 蔡沢 | qin → qin | Archer → Archer | Ryofui Four Pillars → Ryofui Four Pillars | NO | High (faction/type/tags) | mstUnitGenerals characterId=92; general IDs 46; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728532  |
| saji | Saji | 左慈 | zhao → qin | Infantry → Infantry | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=27; general IDs 34; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728543  |
| seikai | Seikai | 成恢 | han → han | Archer → Archer | Coalition Army → Coalition Army, Seikai Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=147; general IDs 231,312; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728279  |
| seikyou | Seikyou | 成蟜 | qin → qin | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=40; general IDs 69,111,287; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728554  |
| seki | Seki | 石 | qin → qin | Archer → Archer | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=41; general IDs 27,199,590,591; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728555  |
| shibasaku | Shibasaku | 司馬錯 | qin → qin | Archer → Archer | Six Great Generals → Six Great Generals | NO | High (faction/type/tags) | mstUnitGenerals characterId=117; general IDs 156,162; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728544  |
| shihaku | Shihaku | 紫伯 | wei → wei | Cavalry → Cavalry | Wei Fire Dragon → Wei Fire Dragon | NO | High (faction/type/tags) | mstUnitGenerals characterId=182; general IDs 289,290; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728319  |
| shika | Shika | 紫夏 | zhao → zhao | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=29; general IDs 71,250,345; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728253  |
| shikika | Shikika | 紫季歌 | wei → wei | Infantry → Infantry | Wei Fire Dragon → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=186; general IDs 299,300; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728318  |
| shin | Shin | 信 | qin → qin | Cavalry → Cavalry | Hi Shin Unit → Hi Shin Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=38; general IDs 28,72,107,135; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728552 Type changes by rarity; highest mapped public rarity used, preserving existing one-record model. |
| shinseijou | Shinseijou | 晋成常 | zhao → zhao | Cavalry → Cavalry | — → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=136; general IDs 220,320; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728257  |
| shishi | Shishi | 肆氏 | qin → qin | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=91; general IDs 20; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728531  |
| sho | Sho | 昭王 | qin → qin | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=35; general IDs 83,179,279; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728549  |
| shoubunkun | Shoubunkun | 昌文君 | qin → qin | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=33; general IDs 110,138; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728547  |
| shouheikun | Shouheikun | 昌平君 | qin → qin | Cavalry → Cavalry | Ryofui Four Pillars → Ryofui Four Pillars | NO | High (faction/type/tags) | mstUnitGenerals characterId=34; general IDs 109,137; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728548  |
| shoukaku | Shoukaku | 尚鹿 | qin → qin | Shield → Shield | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=32; general IDs 58,442,443; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728546  | Duplicated rarity-file faction corrected.
| shoumou | Shoumou | 渉孟 | zhao → zhao | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=37; general IDs 74,205,360; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728256  |
| shousa | Shousa | 松佐 | qin → qin | Infantry → Infantry | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=36; general IDs 53,191,314; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. No exact Japanese-name match in secondary directory; primary stable-ID evidence retained. |
| shoutaku | Shoutaku | 松琢 | qin → qin | Infantry → Infantry | Gyokuhou, Gyokuhou Unit, Ousen Army → Gyokuhou, Ousen Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=220; general IDs 406,407,408; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728551  |
| shuki | Shuki | 朱鬼 | mountain_folk → wei | Infantry → Infantry | — → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=30; general IDs 14; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728320  |
| shunmen | Shunmen | シュンメン | mountain_folk → mountain_folk | Infantry → Infantry | Hi Shin Unit → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=3; general IDs 49,181,486; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728266  |
| shunpeikun | Shunpeikun | 春平君 | zhao → zhao | Infantry → Infantry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=222; general IDs 426,427; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728254  |
| shunshinkun | Shunshinkun | 春申君 | chu → chu | Shield → Shield | — → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=121; general IDs 168,274; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728299  |
| shunsuiju | Shunsuiju | 舜水樹 | zhao → zhao | Cavalry → Cavalry | Riboku Army → — | YES | High (faction/type/tags) | mstUnitGenerals characterId=212; general IDs 387,388; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728255  |
| sosui | Sosui | 楚水 | qin → qin | Cavalry → Cavalry | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=42; general IDs 66,197,311; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728556  |
| sougen | Sougen | 蒼源 | qin → qin | Archer → Archer | Chinese Ten Bows → Chinese Ten Bows | NO | High (faction/type/tags) | mstUnitGenerals characterId=264; general IDs 557,558; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/774860  |
| soujin | Soujin | 蒼仁 | qin → qin | Archer → Archer | Hi Shin Unit → Hi Shin Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=261; general IDs 549,550; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/802521  |
| soutan | Soutan | 蒼淡 | qin → qin | Archer → Archer | Hi Shin Unit → Hi Shin Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=258; general IDs 541,542; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/811849  |
| suugen | Suugen | 崇原 | qin → qin | Infantry → Infantry | Hi Shin Unit → Hi Shin Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=39; general IDs 33,183,316,415; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728553  |
| taijifu | Taijifu | タジフ | mountain_folk → mountain_folk | Shield → Shield | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=4; general IDs 56,184,485; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728267  |
| tairoji | Tairoji | 太呂慈 | wei → wei | Shield → Shield | Wei Fire Dragon → Wei Fire Dragon | NO | High (faction/type/tags) | mstUnitGenerals characterId=205; general IDs 365,366; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728321  |
| takukei | Takukei | 澤圭 | qin → qin | Archer → Archer | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=87; general IDs 31,198,440,441; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728526  |
| toji | Toji | トッヂ | mountain_folk → mountain_folk | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=142; general IDs 226,487,488; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728263  |
| tonkaku | Tonkaku | 惇角 | qin → qin | Infantry → Infantry | Hi Shin Unit → Hi Shin Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=259; general IDs 543,544; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/796220  |
| tonkoku | Tonkoku | 惇告 | qin → qin | Infantry → Infantry | Hi Shin Unit → Hi Shin Unit | NO | High (faction/type/tags) | mstUnitGenerals characterId=260; general IDs 546,547; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/796221  |
| tou | Tou | 騰 | qin → qin | Cavalry → Cavalry | Ouki Army → Ouki Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=46; general IDs 101,129; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728509  |
| toumi | Toubi | 東美 | qin → qin | Infantry → Infantry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=217; general IDs 397,398; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728508  |
| wategi | Wategi | 戎翟公 | ai → ai | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=190; general IDs 322,323; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728274  |
| yotanwa | Yotanwa | 楊端和 | mountain_folk → mountain_folk | Cavalry → Cavalry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=68; general IDs 89,117,139; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728270  |
| you | You | 陽 | qin → qin | Archer → Archer | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=131; general IDs 213,339; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728564  |
| youka | Youka | 姚賈 | qin → qin | Infantry → Infantry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=238; general IDs 491,492; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/734702  |
| yugi | Yugi | 有義 | qin → qin | Shield → Shield | — → Hi Shin Unit | YES | High (faction/type/tags) | mstUnitGenerals characterId=129; general IDs 209; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728563  |
| yukii | Yukii | ユキイ | yan → yan | Archer → Archer | — → Coalition Army | YES | High (faction/type/tags) | mstUnitGenerals characterId=174; general IDs 361,362; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728287  |
| yuri | Yuri | 友里 | qin → qin | Infantry → Infantry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=228; general IDs 444,445; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728562  |
| yuuren | Yuuren | 幽連 | wei → wei | Infantry → Infantry | — → — | NO | High (faction/type/tags) | mstUnitGenerals characterId=66; general IDs 45,193,421; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728325  |
| zenou | Zenou | ゼノウ | qin → qin | Infantry → Infantry | Kanki Army → Kanki Army | NO | High (faction/type/tags) | mstUnitGenerals characterId=206; general IDs 367,368; countryId/attributeId/belong1Id..belong3Id; MsgMstCountry/MsgMstBelong. Supporting: https://game8.jp/kingdomran/728483  |

## Initial rarity and dependent CW cost audit (all 209)

Sources: https://pirock55.work/kin-ran/kinran-souha/26427/ and https://www.strixhiroblog.com/posted20241111/ . Initial card ranks additionally corroborated by the official https://www.kingdomran.jp/info/ver7-10-0updatenews and archer/infantry pack notices. N skill costs are 70/175/240 (485 total). Existing R/SR/UR cost constants are unchanged.

| ID | Archive before | CW bucket before | Verified initial rarity | Change |
|---|---|---|---|---|
| akou | SR | UR | UR | YES |
| amon | NR | SR | R | YES |
| bain | SR | UR | UR | YES |
| bajio | SR | UR | UR | YES |
| bakan | SR | SR | SR | NO |
| bakukoshin | SR | SR | SR | NO |
| bamyu | NR | SR | SR | YES |
| bananji | SR | UR | UR | YES |
| banyou | SR | SR | SR | NO |
| batei | UR | UR | UR | NO |
| beiman | SR | UR | UR | YES |
| bihei | R | R | R | NO |
| bikou | R | R | R | NO |
| budai | SR | UR | UR | YES |
| chouin | SR | UR | UR | YES |
| chouko | NR | SR | N | YES |
| choushi | SR | SR | SR | NO |
| chousou | SR | SR | SR | NO |
| choutou | SR | UR | UR | YES |
| chouyou | SR | SR | SR | NO |
| chutetsu | SR | SR | SR | NO |
| danto | UR | UR | UR | NO |
| denei | SR | SR | SR | NO |
| denrimi | SR | UR | UR | YES |
| denyuu | SR | SR | SR | NO |
| domon | SR | SR | SR | NO |
| douken | NR | SR | N | YES |
| doukin | R | R | R | NO |
| duke_hyou | UR | UR | UR | NO |
| duke_sei | SR | UR | UR | YES |
| ei_sei | UR | SR | SR | YES |
| eiki | SR | SR | SR | NO |
| en | SR | SR | R | YES |
| entei | NR | SR | SR | YES |
| fuji | SR | SR | SR | NO |
| futei | UR | SR | SR | YES |
| gaimou | UR | UR | UR | NO |
| gakuei | SR | UR | UR | YES |
| gakujou | SR | SR | UR | YES |
| gakuki | UR | UR | UR | NO |
| gakurai | SR | UR | UR | YES |
| garo | SR | UR | UR | YES |
| gekishin | SR | UR | UR | YES |
| genpo | NR | SR | SR | YES |
| gii | NR | SR | N | YES |
| gika | SR | SR | SR | NO |
| gohoumei | SR | UR | UR | YES |
| gokei | UR | UR | UR | NO |
| gotan | R | R | R | NO |
| goumasho | SR | UR | UR | YES |
| goutoku | SR | SR | SR | NO |
| hairou | SR | SR | SR | NO |
| hakuki | UR | UR | UR | NO |
| hakukisei | SR | SR | N | YES |
| hakurei | SR | SR | SR | NO |
| hakusui | SR | UR | UR | YES |
| hamui | SR | UR | UR | YES |
| hanoki | SR | UR | UR | YES |
| hanroki | SR | UR | UR | YES |
| heirai | SR | SR | SR | NO |
| heki | R | R | R | NO |
| hokaku | SR | SR | SR | NO |
| hoki | SR | SR | SR | NO |
| houken | UR | UR | UR | NO |
| hyou | R | R | R | NO |
| hyouki | SR | SR | SR | NO |
| hyoushiga | SR | UR | UR | YES |
| jinou | SR | UR | UR | YES |
| jiou | NR | SR | R | YES |
| jokan | SR | SR | R | YES |
| junso | SR | UR | UR | YES |
| ka | SR | UR | UR | YES |
| kaen | SR | UR | UR | YES |
| kaine | SR | SR | SR | NO |
| kaioku | SR | UR | UR | YES |
| kaishibou | SR | SR | SR | NO |
| kakubi | SR | SR | SR | NO |
| kakukai | UR | UR | UR | NO |
| kakuun | SR | UR | UR | YES |
| kanjou | SR | UR | UR | YES |
| kanki | UR | UR | UR | NO |
| kanmei | UR | UR | UR | NO |
| kanou | R | R | R | NO |
| kanto | SR | SR | SR | NO |
| karin | UR | UR | UR | NO |
| karyoten | R | SR | SR | YES |
| katari | SR | UR | UR | YES |
| kei | SR | SR | N | YES |
| keibin | UR | UR | UR | NO |
| keisha | SR | UR | UR | YES |
| kesshi | NR | SR | N | YES |
| kinmou | SR | UR | UR | YES |
| kishou | UR | UR | UR | NO |
| kisui | UR | UR | UR | NO |
| kitari | SR | UR | UR | YES |
| kokuou | SR | SR | SR | NO |
| koshou | SR | UR | UR | YES |
| kou | UR | UR | UR | NO |
| kou2 | NR | UR | N | YES |
| koujyun | SR | SR | SR | NO |
| kouretsu | UR | UR | UR | NO |
| kourigen | SR | SR | SR | NO |
| kousonryu | SR | SR | SR | NO |
| kouyoku | SR | SR | SR | NO |
| kuzen | SR | SR | SR | NO |
| kyomei | SR | SR | SR | NO |
| kyou | UR | UR | UR | NO |
| kyoubou | SR | UR | UR | YES |
| kyouen | SR | SR | SR | NO |
| kyougai | R | R | R | NO |
| kyoukai | missing | SR | SR | YES |
| kyourei | NR | SR | SR | YES |
| kyoushou | SR | SR | SR | NO |
| kyuukou | SR | SR | SR | NO |
| maki | SR | SR | N | YES |
| makou | UR | UR | UR | NO |
| mangoku | UR | SR | SR | YES |
| maron | NR | SR | SR | YES |
| miyamoto | SR | SR | N | YES |
| moubu | UR | UR | UR | NO |
| mougou | SR | UR | UR | YES |
| mouki | SR | SR | SR | NO |
| mouten | UR | SR | SR | YES |
| muta | SR | SR | SR | NO |
| naki | SR | UR | UR | YES |
| nakon | SR | SR | SR | NO |
| ogiko | UR | SR | SR | YES |
| ordo | UR | UR | UR | NO |
| otaji | SR | SR | SR | NO |
| ouhon | UR | SR | SR | YES |
| ouken | UR | UR | UR | NO |
| ouki | UR | UR | UR | NO |
| oukotsu | SR | UR | UR | YES |
| ousen | UR | UR | UR | NO |
| pam | SR | SR | SR | NO |
| queen_biki | SR | UR | UR | YES |
| raido | R | R | R | NO |
| raiki | SR | SR | SR | NO |
| ramauji | SR | SR | SR | NO |
| ranbihaku | UR | UR | UR | NO |
| rankai | SR | SR | SR | NO |
| reiou | UR | UR | UR | NO |
| renpa | UR | UR | UR | NO |
| riboku | UR | UR | UR | NO |
| rien | SR | UR | UR | YES |
| rihaku | SR | SR | SR | NO |
| rikusen | SR | UR | UR | YES |
| rinbou | R | R | R | NO |
| rinbukun | UR | UR | UR | NO |
| ringyoku | SR | UR | UR | YES |
| rinko | SR | UR | UR | YES |
| rishi | NR | R | R | YES |
| robin | SR | UR | UR | YES |
| roen | SR | SR | R | YES |
| rokin | SR | SR | SR | NO |
| rokuomi | SR | SR | SR | NO |
| rouai | UR | UR | UR | NO |
| rui | UR | UR | UR | NO |
| ryofui | SR | UR | UR | YES |
| ryuukoku | R | R | R | NO |
| ryuusen | SR | SR | SR | NO |
| ryuuto | SR | UR | UR | YES |
| ryuyu | SR | SR | SR | NO |
| saizatsu | NR | SR | R | YES |
| saji | R | R | R | NO |
| seikai | UR | UR | UR | NO |
| seikyou | R | R | R | NO |
| seki | SR | SR | R | YES |
| shibasaku | SR | UR | UR | YES |
| shihaku | UR | UR | UR | NO |
| shika | SR | SR | SR | NO |
| shikika | UR | UR | UR | NO |
| shin | UR | SR | R | YES |
| shinseijou | SR | UR | UR | YES |
| shishi | NR | SR | R | YES |
| sho | UR | SR | SR | YES |
| shoubunkun | SR | UR | UR | YES |
| shouheikun | UR | UR | UR | NO |
| shoukaku | SR | SR | SR | NO |
| shoumou | SR | SR | SR | NO |
| shousa | SR | SR | SR | NO |
| shoutaku | SR | SR | SR | NO |
| shuki | SR | SR | N | YES |
| shunmen | SR | SR | SR | NO |
| shunpeikun | UR | UR | UR | NO |
| shunshinkun | UR | UR | UR | NO |
| shunsuiju | SR | UR | UR | YES |
| sosui | SR | SR | SR | NO |
| sougen | SR | UR | UR | YES |
| soujin | UR | missing | UR | YES |
| soutan | UR | missing | UR | YES |
| suugen | R | R | R | NO |
| taijifu | SR | SR | SR | NO |
| tairoji | UR | UR | UR | NO |
| takukei | SR | SR | R | YES |
| toji | SR | SR | SR | NO |
| tonkaku | SR | SR | SR | NO |
| tonkoku | SR | SR | SR | NO |
| tou | UR | UR | UR | NO |
| toumi | UR | UR | UR | NO |
| wategi | UR | UR | UR | NO |
| yotanwa | UR | SR | SR | YES |
| you | UR | UR | UR | NO |
| youka | SR | UR | UR | YES |
| yugi | SR | SR | SR | NO |
| yukii | SR | UR | UR | YES |
| yuri | UR | UR | UR | NO |
| yuuren | SR | SR | SR | NO |
| zenou | UR | UR | UR | NO |

## Additional duplicated classification corrections

The CW_MAX unit-type metadata is corrected without touching any base numeric stat:

- chouko: Cavalry → Archer.
- douken: Cavalry → Archer.
- en: Infantry → Shield.
- hakukisei: Archer → Shield.
- kyuukou: Infantry → Shield.
- maki: Archer → Infantry.
- mouten: Shield → Cavalry.
- roen: Archer → Shield.

The rarity metadata file also had independent stale faction labels: Gika (`gika`) Wei → Zhao, Hoki/Fuuki (`hoki`) Wei → Zhao, and Shoukaku/Shoka (`shoukaku`) Zhao → Qin. All now match their already-correct primary roster faction and exact-ID source evidence in the complete table above.

## Scope integrity

All source skill payloads, stable IDs, names, URLs and source mappings remain byte-equivalent as parsed records. CW_MAX numeric stats are unchanged; only eight unitType fields change. Existing approximate fallback base stat tiers are preserved separately. Buff ownership IDs, values, order and flags are preserved; faction and initial-rarity labels are corrected. Hidden search group membership now derives from verified stable IDs, including the two different Kou characters. No route, sitemap, canonical, navigation, CSP, persistence schema or F19 artifact changes.

## Complete changed-character summary

| Stable ID | Confirmed changes |
|---|---|
| akou | initial rarity |
| amon | faction, initial rarity, CW cost bucket |
| bain | initial rarity |
| bajio | initial rarity |
| bamyu | tags, initial rarity |
| bananji | tags, initial rarity |
| banyou | tags |
| batei | tags |
| beiman | tags, initial rarity |
| bikou | tags |
| budai | initial rarity |
| chouin | tags, initial rarity |
| chouko | faction, type, initial rarity, CW cost bucket, CW stats type |
| choutou | initial rarity |
| denei | tags |
| denrimi | initial rarity |
| denyuu | tags |
| domon | faction |
| douken | faction, type, initial rarity, CW cost bucket, CW stats type |
| doukin | tags |
| duke_sei | initial rarity |
| ei_sei | initial rarity |
| eiki | type |
| en | type, tags, initial rarity, CW cost bucket, CW stats type |
| entei | initial rarity |
| futei | tags, initial rarity |
| gakuei | initial rarity |
| gakujou | initial rarity, CW cost bucket |
| gakurai | tags, initial rarity |
| garo | initial rarity |
| gekishin | initial rarity |
| genpo | initial rarity |
| gii | faction, initial rarity, CW cost bucket |
| gohoumei | tags, initial rarity |
| gotan | faction |
| goumasho | tags, initial rarity |
| goutoku | tags |
| hairou | tags |
| hakukisei | faction, type, initial rarity, CW cost bucket, CW stats type |
| hakurei | tags |
| hakusui | tags, initial rarity |
| hamui | initial rarity |
| hanoki | initial rarity |
| hanroki | initial rarity |
| hyoushiga | initial rarity |
| jinou | tags, initial rarity |
| jiou | initial rarity, CW cost bucket |
| jokan | faction, initial rarity, CW cost bucket |
| junso | tags, initial rarity |
| ka | initial rarity |
| kaen | tags, initial rarity |
| kaine | tags |
| kaioku | tags, initial rarity |
| kakuun | initial rarity |
| kanjou | tags, initial rarity |
| kanou | tags |
| karyoten | tags, initial rarity |
| katari | initial rarity |
| kei | tags, initial rarity, CW cost bucket |
| keisha | tags, initial rarity |
| kesshi | faction, initial rarity, CW cost bucket |
| kinmou | initial rarity |
| kishou | tags |
| kisui | tags |
| kitari | initial rarity |
| koshou | initial rarity |
| kou2 | type, tags, initial rarity, CW cost bucket |
| kousonryu | tags |
| kouyoku | tags |
| kuzen | tags |
| kyomei | tags |
| kyou | tags |
| kyoubou | tags, initial rarity |
| kyougai | tags |
| kyoukai | tags, initial rarity |
| kyourei | tags, initial rarity |
| kyuukou | tags, CW stats type |
| maki | faction, type, initial rarity, CW cost bucket, CW stats type |
| makou | tags |
| mangoku | initial rarity |
| maron | initial rarity |
| miyamoto | faction, initial rarity, CW cost bucket |
| mougou | tags, initial rarity |
| mouten | initial rarity, CW stats type |
| naki | initial rarity |
| nakon | tags |
| ogiko | initial rarity |
| ordo | tags |
| otaji | tags |
| ouhon | tags, initial rarity |
| oukotsu | initial rarity |
| queen_biki | initial rarity |
| ranbihaku | tags |
| rankai | tags |
| rien | initial rarity |
| rihaku | tags |
| rikusen | initial rarity |
| rinbou | tags |
| ringyoku | initial rarity |
| rinko | initial rarity |
| rishi | initial rarity |
| robin | initial rarity |
| roen | type, tags, initial rarity, CW cost bucket, CW stats type |
| rokin | tags |
| rokuomi | tags |
| ryofui | tags, initial rarity |
| ryuukoku | tags |
| ryuusen | tags |
| ryuuto | tags, initial rarity |
| saizatsu | initial rarity, CW cost bucket |
| saji | faction |
| seikai | tags |
| seki | tags, initial rarity, CW cost bucket |
| shibasaku | initial rarity |
| shikika | tags |
| shin | initial rarity, CW cost bucket |
| shinseijou | tags, initial rarity |
| shishi | initial rarity, CW cost bucket |
| sho | initial rarity |
| shoubunkun | initial rarity |
| shousa | tags |
| shoutaku | tags |
| shuki | faction, initial rarity, CW cost bucket |
| shunmen | tags |
| shunshinkun | tags |
| shunsuiju | tags, initial rarity |
| sosui | tags |
| sougen | initial rarity |
| soujin | CW cost bucket |
| soutan | CW cost bucket |
| takukei | tags, initial rarity, CW cost bucket |
| yotanwa | initial rarity |
| youka | initial rarity |
| yugi | tags |
| yukii | tags, initial rarity |

Additional characters changed only in duplicated rarity-file faction metadata: gika (Wei → Zhao), hoki (Wei → Zhao), shoukaku (Zhao → Qin). Total unique characters with classification changes across all consumers: **138**.
