# Skill Translation Audit — Site EN vs. Original Game CW Data

**Date:** 2026-06-07
**Scope:** All **202 characters / 635 skills / 1,438 effect rows** in `data/characters/*.json`.
**Ground truth:** `C:\kingdom_data\decrypted\master\MsgUnionConquestSkillName.stbl` + **`MsgUnionConquestSkillDesc.stbl`** (the in-game 争覇/Castle-Wars skill description, with every literal number baked in), joined per character via `mstUnitGenerals → mstUnionConquestGenerals → mstUnionConquestSkills`.
**Status:** ✅ **FIXES APPLIED 2026-06-07.** All numeric/value/%, duration, terminology, and name corrections below (§1–§5) were applied surgically. Backup at `data.backup-20260607-skillaudit/`. Verified: all JSON parses · 13 unit tests pass · production build succeeds · `cw_buffs.json` changed in exactly one place (jiou 6.9→15.9) · buff-parser checks pass on every edited string.
**§4c duplicates — REMOVED (approved):** `qingxiang` (青翔, an incomplete duplicate of **Duke Sei**, charId 221 — no art, no unit, identical skills) and `linhtama` (ランタマ, an incomplete duplicate of **ringyoku**, charId 208 — 2 of its 3 skills don't exist in-game). Both character entries were deleted from `data/characters/misc2.json` and `data/character_rarity.json`, and their `UNIT_TYPES` entries removed from `src/core.jsx`. Roster is now **200 characters**. The complete originals (duke_sei, ringyoku) are untouched.
**Also left as-is (cosmetic, harmless):** mixed full-width "％" vs "%" in a few ☆6 blocks (the parser handles both); `oukotsu` 怪力無双's merged "ATK Up / DEF Up 5%" (parses correctly because both are same-direction — unlike shunshinkun's Up/Down mix, which was fixed).

## Method
Each site skill was matched to its game skill by exact JP name, scoped to that character's own CW skill set (so the correct color/unit/tier variant is used). 620 / 635 skills matched with high confidence; the rest were resolved manually (see §4). For every matched skill I diffed the set of numbers (%, ×N hits, N turns/times, recovery amounts, target counts) between the game description and the site EN, ignoring numbers inside `{…}` unit-name placeholders. Numbers were not guessed — every item below is backed by the game text quoted beside it.

Recurring **false positives** were identified and excluded (they are *not* errors): EN "From the X% Damage" cross-reference lines, HP-threshold conditions repeated per row, JP "ATK and DEF +30%" split into two EN lines, JP "〜1名につき" → EN "Per ally …" (no digit), and EN repeating "1 enemy general" per damage line.

---

## 1. Wrong numeric values  ⚠️ highest priority
The value is present but **does not match the game**.

| # | Character | Skill (EN / JP) | Site EN says | Game says | Fix |
|---|-----------|-----------------|--------------|-----------|-----|
| 1 | **jiou** 江彰 | HP Enhancement – Medium Improved [Archers] / 体力強化・中改【弓兵】 | Max HP Up **6.9%** | **15.9%** (中改 = "Improved" tier) | 6.9 → 15.9 |
| 2 | **kyoukai** 羌瘣 | Place to Return / 帰る場所 | DEF Penetration Up **30%** | **20%** (防御力貫通が20%上昇) | 30 → 20 |
| 3 | **ouki** 王騎 | Ouki Army's Radiance / 王騎軍の威光 | Anti-[Archer] ATK Up **20%** | **15%** (弓兵に対する攻撃力15%) | 20 → 15 |
| 4 | **hanroki** 樊琉期 | Trampling the Weak / 弱者への蹂躙 | HP Drain **10%** | **50%** (その50%を自身の体力に吸収) | 10 → 50 |
| 5 | **tairoji** 太呂慈 | Wei Great General ☆6 (see §4) | self **ATK Up 30%** present; "DEF Penetration Up 30%" | game (覚悟の邀撃☆6) = **DEF only** on self (no ATK 30%); "DEF Penetration **Resistance** Up 30%" | remove ATK 30%; add "Resistance" |

---

## 2. Missing values / %
A number that exists in the game is absent from the EN.

| # | Character | Skill | Missing | Game text |
|---|-----------|-------|---------|-----------|
| 6 | **hanoki** 樊於期 | Forced Training / 強制練兵 | **20%** on first Betrayal infliction (EN just says "Betrayal Infliction") | 20%の確率で…「裏切り」状態 |
| 7 | **jiou** 江彰 | Weak General Flash [Red Sheep] / 弱将一閃【赤羊】 | **50%** on Paralysis infliction | 50%の確率で…「麻痺」状態 |
| 8 | **seikai** 青歌 | Research Results / 研究の成果 | **40%** on the first Poison(猛毒) infliction (second one has it) | 40%の確率で…「猛毒」 |
| 9 | **pam** | Stalwart Escort / 剛者随行 | Guard value **60%** + "(2 times)" count | 60%のガード効果(2回) |
| 10 | **bajio** バジオウ | Heart of the Beast / 獣の心 | scaling ATK Up "(max **20%**)" | 攻撃力が上昇…(最大20%) |
| 11 | **rinbukun** 臨武君 | Vanguard Smasher ☆6 / 先陣割砕☆6 | entire **"Self ATK Up 40%"** effect line | 自身の攻撃力が40%上昇する |
| 12 | **sougen** 蒼源 | Father's Back / 父の背中 | **100%** Guard value — and rendered as "Attack Nullification" instead of **Guard 100%** | 味方全武将に100%のガード効果(1回) |
| 13 | **shihaku** 司馬尚 | Master General Attack [Red Sheep] / 名将攻撃【赤羊】 | scaling ATK Up "(max **50%**)" + "(4 turns)" | 攻撃力が5%上昇(4ターン)…(最大50%) |

---

## 3. Missing durations (turns / times)
The effect % is right but the JP "(Nターン)" / "(N回)" duration was dropped. The site keeps a separate `duration` field for these elsewhere, so these are genuine omissions.

| # | Character | Skill | Missing duration |
|---|-----------|-------|------------------|
| 14 | rouai 嫪毐 | 猛将双撃【赤羊】 | Evasion Down 20% → **(4 turns)** |
| 15 | rouai 嫪毐 | 癒しの滴 | Provoke → **(4 turns)**; Continuous HP Recovery 10% → **(3 turns)** |
| 16 | rouai 嫪毐 | 虚栄の毐王 | Guard 60% → **(1 time)** |
| 17 | duke_hyou 麃公 | 名将一閃【橙亀】 | ATK Up 20% → **(3 turns)** |
| 18 | duke_hyou 麃公 | 冥土の土産 | ATK Down 50% → **(4 turns)** |
| 19 | qingxiang | 急所一閃【橙虎】 | ATK Up 2% → **(3 turns)** |
| 20 | qingxiang | 許し難き非道 | Status Nullification → **(2 times)** |
| 21 | shin 信 | 受け継ぐ意思 | ATK Up 3% → **(3 turns)** |
| 22 | gakurai 岳雷 | 後手必勝 | Critical Damage Up 20% → **(3 turns)** |
| 23 | gakurai 岳雷 | 乱戦強者 | Critical Rate Up 10% & 20% → **(3 turns)** ×2 |
| 24 | seikyou 成蟜 | 脆将一閃【赤羊】 | ATK Up 30% → **(3 turns)** |
| 25 | shihaku 司馬尚 | 色無き世界 | Reckless (捨て身) → **(4 turns)** |
| 26 | **keisha** 慶舎 | 狩り取る糸 | ⚠️ entire **Provoke (4 turns)** infliction line is missing, and the 180% damage target may be mis-merged (game = Provoke on 1 shield general, then 180% on 1 general). **Review.** |
| 27 | *(pattern)* ouken, kou, you, rui… | "Less Likely to be Targeted" | site consistently drops the "(3 turns)" on this status |
| 28 | kinmou 金毛 | 副官の底力 | EN adds "3 turns" to **Sure Hit** that the game does **not** have — likely spurious. **Review.** |

---

## 4. Skill name / character-mapping issues

### 4a. Mislabeled ☆6 skills (EN effects are correct — only `name_jp` is wrong)
These four characters' ☆6 awakening skills are scene-card rank-6 skills; the site used the *base* skill's name + ☆6. The numbers all check out against the correct skill.

| Character | Site `name_jp` | Correct game skill | Note |
|-----------|----------------|--------------------|------|
| ousen 王翦 | 必勝の籠城☆6 | **絶対防御☆6** (id 771) | EN matches game exactly |
| rinko 輪虎 | 廉頗の飛槍☆6 | **天の導き☆6** (id 585) | EN matches game exactly |
| karin 媧燐 | 女傑の覇道☆6 | **天才の策略☆6** (id 777) | EN matches game exactly |
| tairoji 太呂慈 | 魏国大将軍☆6 | **覚悟の邀撃☆6** (id 789) | EN matches except items in §1 #5 |

### 4b. `name_jp` typos (wrong kanji; EN translation usually fine)
| Character | Site `name_jp` | Game `name_jp` |
|-----------|----------------|----------------|
| hanoki 樊於期 | 争乱扇動 | 騒乱扇動 |
| hanroki 樊琉期 | 優勝劣勢 | 優勝劣敗 |
| queen_biki 太后 | 果てない野望 | 果てない欲望 |
| kyourei 京令 | 医療の枠 | 医療の粋 |
| kakuun 角雲 | 不動の守護 | 不動の守備 |
| zenou ゼノウ | 猛将撲滅【赤羊】 | 猛将撃滅【赤羊】 |
| kaioku 介億 | 軍曹司令の右腕 | 軍総司令の右腕 (EN "Commander-in-Chief" already correct) |
| mouten 蒙恬 | 才気爆発 | 才気煥発 |
| moubu 蒙武 | 至強に至る武 | 至強を超える武 (EN "Reaching" → should be "Surpassing/Exceeding") |
| kourigen 黄離弦 | 坂路適正・大 | 坂路適性・大 |
| katari カタリ | 從容自若 | 従容自若 (traditional → simplified) |
| ryuuto 劉冬 | 離眼の絆【友】 | 離眼の絆【技】 (his game skills are 【技】+【巧】) |

### 4c. Character identity — needs your decision
| Character | Issue |
|-----------|-------|
| **qingxiang** 青翔 | All 3 skills (急所一閃【橙虎】, 城主への忠誠, 許し難き非道) belong to **青公 Duke Sei** (charId 221). The site already has a separate **duke_sei** entry. → "青翔" looks like a duplicate/wrong name for Duke Sei. |
| **linhtama** ランタマ | No matching game character; 2 of its 3 skills (俊敏なる腹心, 残酷追撃) **do not exist** in CW data; its kit duplicates **ringyoku** (リン玉, charId 208). → looks like an erroneous duplicate entry. |

### 4d. Special-character `name_jp` variant spellings (EN fine; resolved to the right character)
futei 傳抵→傅抵 · kuzen 蒙恬のじぃ→のじィ · makou 麻礦→麻鉱 · shousa 松佐→松左.
(kakubi 郭備 = charId 2 and ringyoku リン玉 = charId 208 are correct; their game names just didn't decode cleanly in the STBL.)

---

## 5. Terminology / wording
- **sougen** 父の背中: "100%のガード効果" → "Attack Nullification". Per the project glossary these are distinct mechanics (Guard ≠ Attack Nullification). Should be "Guard 100%".
- **tairoji**: "DEF Penetration Up" vs game "DEF Penetration **Resistance** Up" (防御力貫通耐性).
- **Mixed percent signs**: some EN effects use full-width "％" (e.g. Hakuki 不敗☆6, houken 求道の果て☆6, kaishibou 大将軍への忠心☆6, gokei) while the rest use "%". Cosmetic but inconsistent.
- **Grammar**: ouhon 共にある☆6 "Guard 100% || 1 **times**" (→ "1 time").
- **Merged effect lines** (values present, structure simplified): oukotsu 怪力無双 collapses two separate +5% sources into one; shunshinkun 合従軍総大将 uses a combined "Max HP Up / Morale Cost Reduction 30%" slash format instead of per-stat.

---

## 6. What was verified correct
- All damage multipliers, hit counts (×N回 / N-Hit), target counts, and recovery amounts (incl. gate-HP like 50,000 / 100,000) checked across all 635 skills.
- 620 skills matched game data with no numeric discrepancy after excluding the documented false-positive patterns.
- The Internal-Affairs decimal tiers (e.g. 6.9 / 15.9 / 22.8 / 24.8%) were tier-checked by skill grade (・中 / ・中改 / ・大改 …); only **jiou** (#1) was off-tier.

---

## Appendix — raw candidate dumps (for cross-checking)
- `C:\kingdom_data\_skill_audit_v2.json` — every skill with game desc, site EN, and number diffs.
- `C:\kingdom_data\_audit_out.txt` — full %-discrepancy + non-% discrepancy console dump.
