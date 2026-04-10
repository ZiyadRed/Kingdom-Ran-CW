# NOTES FOR CLAUDE — Kingdom Ran EN Project
# READ THIS FIRST before doing anything else.
# Last updated: 2026-04-11

---

## WHAT THIS PROJECT IS

An English fan translation of the Japanese Souha (争覇) skill simulator for the
mobile game Kingdom Ran (キングダム乱), based on the manga Kingdom.

  Skill archive source:  https://pirock55.work/souha-skill-archive/
  JP simulator source:   https://pirock55.work/souha-party-simulation/
  Canonical EN names:    https://touranko.vercel.app/char

Run locally:  npm install  then  npm run dev  →  http://localhost:5173
Deploy:       npm run build  →  upload dist/ to Vercel

---

## PROJECT STRUCTURE

kingdom-ran-en/
├── NOTES_FOR_CLAUDE.md
├── index.html
├── package.json           (React 18 + Vite 5)
├── vite.config.js         (aliases: @ → src, @data → data)
├── src/
│   ├── main.jsx
│   ├── App.jsx            (full app + all components inline)
│   └── styles/globals.css
└── data/
    ├── index.json
    ├── glossary/
    │   ├── countries.json
    │   ├── skill_types.json
    │   ├── effects.json
    │   └── conditions.json
    └── characters/
        ├── mountain_folk.json
        ├── qin.json + qin_batch2.json + qin_major.json
        ├── zhao.json + zhao_batch2.json + zhao_major.json
        ├── other_states.json
        ├── chu.json + chu_major.json
        ├── wei.json
        ├── yan.json
        ├── qi.json
        ├── ai_yan_major.json
        ├── misc.json + misc2.json

---

## SIMULATION LOGIC (100% CONFIRMED FROM 2 SETS OF USER SCREENSHOTS)

Party = exactly 4 generals. Formation order = left to right = display order.

### Output Section 1 — Strategy Skills (always active)
All Strategy + Administration skills from all 4 generals, in formation order.
These are always-on passives. Generals with no strategy skills skip.

### Output Section 2 — Turn-by-Turn Combat Skills
Each general fires ONE combat skill per turn, in REVERSE slot order:

  Turn 1 → LAST combat skill (highest index)
  Turn 2 → SECOND-TO-LAST combat skill
  Turn 3 → next combat skill, or Normal Attack if none left
  Turn 4 → Normal Attack (unless still have combat skills)

Strategy/Admin skills are SKIPPED when counting backwards through slots.
Only Combat-type skills count for the turn sequence.

VERIFIED example (Fuji→Shunmen→Katari→Yotanwa):
  Fuji:    Skill1=Combat, Skill2=Strategy, Skill3=Combat
  Shunmen: Skill1=Combat (only one)
  Katari:  Skill1=Combat, Skill2=Strategy, Skill3=Combat
  Yotanwa: Skill1=Combat, Skill2=Combat, Skill3=Combat

  Turn 1: Fuji→Skill3,  Shunmen→Skill1, Katari→Skill3,  Yotanwa→Skill3
  Turn 2: Fuji→Skill1,  Shunmen→Normal, Katari→Skill1,  Yotanwa→Skill2
  Turn 3: Fuji→Normal,  Shunmen→Normal, Katari→Normal,  Yotanwa→Skill1
  Turn 4: all Normal Attack

### Algorithm (JavaScript pseudocode):

function simulate(party) {
  // SECTION 1
  const strategySkills = []
  for (const general of party) {
    for (const skill of (general.skills || [])) {
      if (skill.type === 'Strategy' || skill.type === 'Administration') {
        strategySkills.push({ general, skill })
      }
    }
  }

  // SECTION 2
  const combatQueues = party.map(general => {
    const combatSkills = (general.skills || []).filter(s => s.type === 'Combat')
    return [...combatSkills].reverse()   // last skill fires first
  })

  const turns = []
  for (let turn = 1; turn <= 4; turn++) {
    const entries = []
    for (let i = 0; i < party.length; i++) {
      const skill = combatQueues[i].shift() || null  // null = Normal Attack
      entries.push({ general: party[i], skill })
    }
    turns.push({ turn, entries })
  }

  return { strategySkills, turns }
}

---

## NEXT TODO (what to do first when resuming)

1. IMPLEMENT simulate() in src/App.jsx → ActivationOrderPage component
   - Replace the placeholder with real output matching the JP simulator layout
   - Section 1: table of always-active strategy effects (general name, condition, effect, duration)
   - Section 2: turn-by-turn, grouped by turn number, each general's firing skill

2. DEPLOY TO VERCEL
   - User has GitHub (TBD) or use Vercel CLI
   - npm run build → vercel --prod

3. Translate remaining ~56 characters (minor admin chars mostly)

---

## CONFIRMED TERMINOLOGY

挑発 = Provoke (NOT Taunt)
暴走 = Rampage (NOT Berserk)
幻影 = Illusion (NOT Phantom)
見切り = Evasion (Dodge Chance)
捨て身 = Reckless
攻撃無効 = Attack Nullification
ガード効果 = Guard
必中 = Sure Hit
裏切り = Betrayal
通常攻撃 = Normal Attack
ランダム = Random
侵攻時 = When Attacking
駐屯時 = When Garrisoning

---

## CANONICAL CHARACTER NAMES (verified vs touranko.vercel.app/char)

KEY CORRECTIONS (common mistakes to avoid):
  蒙恬 = Mouten      (NOT Muten)
  昌文君 = Shoubunkun (NOT Shoumounkun)
  摎 = Kyou          (NOT Mou)
  京令 = Kyourei     (NOT Keirei)
  呂敏 = Robin       (NOT Romin)
  松琢 = Shoutaku    (NOT Shotaku)
  宮康 = Kyuukou     (NOT Kyukou)
  張唐 = Choutou     (NOT Choto)
  司馬錯 = Shibasaku  (NOT Shimasaku)
  豹司牙 = Hyoushiga  (NOT Hyoshiga)
  王齕 = Oukotsu     (NOT Ohkotsu)
  麃公 = Duke Hyou   (NOT Hyoukou)
  紀彗 = Kisui       (NOT Kisei)
  劉冬 = Ryuuto      (NOT Ryuto)
  金毛 = Kinmou      (NOT Kinmo)
  青公 = Duke Sei    (NOT Seikou)
  晋成常 = Shinseijou (NOT Shinseicho)
  乱美迫 = Ranbihaku  (NOT Ranbishaku)
  凱孟 = Gaimou      (NOT Gaimo)
  呉鳳明 = Gohoumei   (NOT Gofuumei)
  景湣王 = Keibin     (NOT Keiminoo)
  輪虎 = Rinko       (NOT Rinka)
  介子坊 = Kaishibou  (NOT Kaishi)
  臨武君 = Rinbukun   (NOT Rinbujun)
  仁凹 = Jinou       (NOT Jino)
  貝満 = Beiman      (NOT Baiman)
  剛摩諸 = Goumasho   (NOT Gomosho)
  考烈王 = Kouretsu   (NOT Koretsuo)
  豪徳 = Goutoku     (NOT Gotoku)
  巨暴 = Kyoubou     (NOT Kyobou)
  楽毅 = Gakuki      (NOT Rakki)
  戎翟公 = Wategi     (NOT Juutekkō)
  嫪毐 = Rouai       (NOT Raoai)
  樊琉期 = Hanroki    (NOT Hanryuki)
  タジフ = Taijifu   (NOT Tajifu)
  ラマウジ = Ramauji  (NOT Ramaoji)
  トッヂ = Toji      (NOT Todji)
  パム = Pam         (NOT Pamu)
  王建王 = Ouken      (NOT Oukenwang)
  奈棍 = Nakon       (NOT Nako)
  シュンメン = Shunmen → Mountain Folk (NOT Qin)
  ランカイ = Rankai   → Mountain Folk (NOT Qin)

---

## DESIGN TOKENS

Dark ink & parchment:
  bg:     #0d0c0a
  text:   #e8dcc8
  accent: #c0392b (red)
  gold:   #c9a84c

Country colors:
  Qin: #c0392b    Zhao: #2980b9    Chu: #8e44ad    Wei: #16a085
  Han: #d4ac0d    Yan:  #1abc9c    Ai:  #884ea0    Mountain Folk: #7d6608

Fonts: Cinzel Decorative (display) + Cinzel (headings) + Crimson Pro (body)
