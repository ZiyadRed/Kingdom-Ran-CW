import { describe, expect, it } from 'vitest'
import {
  renderJapaneseCondition,
  renderJapaneseDuration,
  renderJapaneseEffect,
  renderJapaneseTarget,
  renderJapaneseTerm,
} from './ja-render.js'
import { japaneseSkillSource, localizedSkill } from './data.js'

describe('audited compound Japanese conditions and targets',()=>{
  it('preserves damage thresholds, activation and formation selectors',()=>{
    expect(renderJapaneseCondition('When Garrisoning, upon % Damage activation')).toBe('駐屯時、割合ダメージ発生時')
    expect(renderJapaneseCondition('Own remaining HP < 90%, from 170% Damage above')).toBe('自身の残り体力が90%未満、上記170%ダメージから')
    expect(renderJapaneseCondition('When Garrisoning, While gate has HP remaining')).toBe('駐屯時、城門の体力が残っている場合')
    expect(renderJapaneseCondition('When Garrisoning, enemy [Infantry] / enemy [Siege Weapon] with highest ATK')).toBe('駐屯時、攻撃力が最も高い敵歩兵武将／攻撃力が最も高い敵兵器')
    expect(renderJapaneseCondition('Other ally [Qin] or [Mountain Folk] alive, first enemy in formation')).toBe('自身以外の味方秦国武将または山の民武将が生存している場合、編成順が最も早い敵')
  })

  it('uses source-backed gate, group, and inclusive HP conditions',()=>{
    expect(renderJapaneseCondition('When Garrisoning, gate HP remaining'))
      .toBe('駐屯時、城門の体力が残っている場合')
    expect(renderJapaneseCondition('When Garrisoning, gate HP remaining, ally Kisui is alive'))
      .toBe('駐屯時、城門の体力が残っており、味方紀彗が生存している場合')
    expect(renderJapaneseCondition('When ally Hi Shin Unit member is alive'))
      .toBe('味方飛信隊武将が生存している場合')
    expect(renderJapaneseCondition('Own HP ≤ 50%')).toBe('自身の残り体力が50%以下')
    expect(renderJapaneseCondition('Enemy [General]\'s HP ≤ 50%')).toBe('敵武将の体力が50%以下')
    expect(renderJapaneseCondition('Own HP < 50%')).toBe('自身の残り体力が50%未満')
    expect(renderJapaneseCondition('Own HP > 90%')).toBe('自身の残り体力が90%超')
    expect(renderJapaneseCondition('Own HP ≥ 90%')).toBe('自身の残り体力が90%以上')
  })
  it('keeps Soujin\'s Hi Shin Unit versus Shield restriction intact',()=>{
    expect(renderJapaneseTarget('Ally Hi Shin Unit [General] vs enemy [Shield] [General]'))
      .toBe('敵盾兵武将に対する味方飛信隊武将')
  })
  it('keeps separate counted targets and per-ally categories',()=>{
    expect(renderJapaneseTarget('1 each of [Zhao]/[Wei]/[Chu]/[Qi] enemy')).toBe('敵趙国・魏国・楚国・斉国武将各1名')
    expect(renderJapaneseTarget('1 [Infantry] / 1 [Cavalry] enemy [General]')).toBe('敵歩兵武将1名／敵騎兵武将1名')
    expect(renderJapaneseCondition('Per ally [Infantry] / per other ally [Archer] [General]')).toBe('味方歩兵武将1名につき／自身以外の味方弓兵武将1名につき')
  })
  it('resolves named operands through known Japanese names and fails closed for unknown names',()=>{
    expect(renderJapaneseTarget('Shikika')).toBe('紫季歌')
    expect(renderJapaneseTarget('Riboku')).toBe('李牧')
    expect(renderJapaneseTarget('Surviving ally "Ranbihaku", "GHM", and Wei Fire Dragon [General]')).toBe('生存している味方「乱美迫」、「呉鳳明」、魏火龍武将')
    expect(renderJapaneseEffect('Enemy "Riboku", "Ei Sei", "Queen Biki" "Attack Seal" 70%')).toBe('70%の確率で敵「李牧」「嬴政」「太后」に「攻撃封印」状態を付与')
    const unknown='Enemy "Invented Name", "Riboku" "Attack Seal" 70%'
    expect(renderJapaneseEffect(unknown)).toBe(unknown)
  })
})

/**
 * Every input is a verbatim string from data/characters/*.json, and the
 * expected Japanese uses the game's own vocabulary — mined from
 * MsgUnionConquestSkillDesc.stbl — rather than a fresh translation of the
 * English label. This is the regression guard for audit finding JA-002, where
 * the structured effect rows shipped to Japanese readers in English.
 */

describe('Japanese effect rendering', () => {
  it('uses the game’s own phrasing for a stat change', () => {
    // Source: 「攻撃力が20%上昇する」
    expect(renderJapaneseEffect('ATK Up 20%')).toBe('攻撃力20%上昇')
    expect(renderJapaneseEffect('DEF Up 20%')).toBe('防御力20%上昇')
    expect(renderJapaneseEffect('ATK Down 20%')).toBe('攻撃力20%低下')
    expect(renderJapaneseEffect('DEF Penetration Up 20%')).toBe('防御力貫通20%上昇')
  })

  it('uses the cap form the game uses for each stat', () => {
    // 体力 caps as 体力上限, 士気 as 最大士気 — the game is not uniform.
    expect(renderJapaneseEffect('Max HP Up 100%')).toBe('体力上限100%上昇')
    expect(renderJapaneseEffect('Max Morale Up 60%')).toBe('最大士気60%上昇')
  })

  it('renders damage the way the source states it', () => {
    // Source: 「150%のダメージを与える」
    expect(renderJapaneseEffect('150% Damage')).toBe('150%ダメージ')
    expect(renderJapaneseEffect('2-Hit 100% Damage')).toBe('100%ダメージ×2回')
  })

  it('keeps status names identical to the game', () => {
    expect(renderJapaneseEffect('Guard 60%')).toBe('ガード効果60%')
    expect(renderJapaneseEffect('Sure Hit')).toBe('必中')
    expect(renderJapaneseEffect('Attack Nullification')).toBe('攻撃無効')
    expect(renderJapaneseEffect('Provoke')).toBe('挑発')
  })

  it('uses the source meaning, not the English wording', () => {
    // 体力回復無効 — healing is nullified, not a seal placed on HP.
    expect(renderJapaneseEffect('HP Seal 50%')).toBe('「体力回復無効」付与確率50%')
    // 「その100%を自身の体力に吸収する」 — lifesteal.
    expect(renderJapaneseEffect('HP Drain 100%')).toBe('体力吸収100%')
  })

  it('orders a resistance as the game does', () => {
    expect(renderJapaneseEffect('Attack Down Resistance Up 40%')).toBe('攻撃力低下耐性40%上昇')
    expect(renderJapaneseEffect('Confusion Resistance 100%')).toBe('「錯乱」耐性100%上昇')
  })

  it('returns the original English rather than emitting broken Japanese', () => {
    const unknown = 'Some Entirely Unmodelled Effect Phrase'
    expect(renderJapaneseEffect(unknown)).toBe(unknown)
  })
})

describe('Japanese target rendering', () => {
  it('counts targets the way the source counts them', () => {
    // Source: 「敵武将1名に」
    expect(renderJapaneseTarget('1 enemy [General]')).toBe('敵武将1名')
    expect(renderJapaneseTarget('3 enemy [General]')).toBe('敵武将3名')
    expect(renderJapaneseTarget('1 enemy [Siege Weapon]')).toBe('敵兵器1つ')
  })

  it('uses the source unit and state names', () => {
    expect(renderJapaneseTarget('Self')).toBe('自身')
    expect(renderJapaneseTarget('Ally [Infantry]')).toBe('味方歩兵武将')
    expect(renderJapaneseTarget('Ally [Shield]')).toBe('味方盾兵武将')
    expect(renderJapaneseTarget('Ally [Zhao]')).toBe('味方趙国武将')
    expect(renderJapaneseTarget('All enemy [General]')).toBe('敵全武将')
  })

  it('shows a named ally in Japanese, not romaji', () => {
    // The project already carries every character's Japanese name, so effect
    // text that names an ally should not fall back to Latin.
    expect(renderJapaneseTarget('Ally Ouhon')).toBe('味方王賁')
    expect(renderJapaneseTarget('Ally Yotanwa')).toBe('味方楊端和')
    expect(renderJapaneseTarget('Ally Karin')).toBe('味方媧燐')
  })

  it('translates army names, which all have canonical Japanese', () => {
    // Unlike Arabic, no transliteration risk exists here: the source names them.
    expect(renderJapaneseTarget('Ally Kanki Army')).toBe('味方桓騎軍武将')
    expect(renderJapaneseTarget('Ally Hi Shin Unit [General]')).toBe('味方飛信隊武将')
    expect(renderJapaneseCondition('Per other ally [Hishin] [General]')).toBe('自身以外の味方飛信隊武将1名につき')
    expect(renderJapaneseTarget('Enemy Cavalry')).toBe('敵騎兵武将')
    expect(renderJapaneseTarget('Enemy Qin')).toBe('敵秦国武将')
    expect(renderJapaneseTarget('Enemy generals')).toBe('敵武将')
    expect(renderJapaneseTarget('All enemies')).toBe('敵全武将')
    expect(renderJapaneseTerm('Way of The Great General')).toBe('大将軍への道')
    expect(renderJapaneseTerm('Six Great Generals')).toBe('六大将軍')
  })

  it('localizes status-infliction aggregate labels', () => {
    expect(renderJapaneseTerm('Illusion Infliction Rate')).toBe('「幻影」付与確率')
    expect(renderJapaneseTerm('Paralysis Infliction Rate')).toBe('「麻痺」付与確率')
  })
})

describe('Japanese condition rendering', () => {
  it('matches the source selector phrasing exactly', () => {
    // Source: 「攻撃力が最も高い敵武将1名に」
    expect(renderJapaneseCondition('Enemy [General] with highest ATK')).toBe('攻撃力が最も高い敵武将')
    expect(renderJapaneseCondition('Enemy [General] with lowest remaining HP')).toBe('残り体力が最も低い敵武将')
    expect(renderJapaneseCondition('Enemy [General] with highest max morale')).toBe('最大士気が最も高い敵武将')
  })

  it('uses the source timing words', () => {
    expect(renderJapaneseCondition('When Garrisoning')).toBe('駐屯時')
    expect(renderJapaneseCondition('When Attacking')).toBe('侵攻時')
  })

  it('keeps "and" and "or" distinct between allies', () => {
    // Collapsing these would state a different mechanic.
    expect(renderJapaneseCondition('When ally Batei and Ryuuto are both alive'))
      .toBe('味方馬呈と劉冬が生存している場合')
    expect(renderJapaneseCondition('When ally Batei or Ryuuto is alive'))
      .toBe('味方馬呈または劉冬が生存している場合')
  })

  it('renders the deployment qualifier the source uses', () => {
    expect(renderJapaneseCondition('CW battle (active even when not deployed)'))
      .toBe('同盟争覇戦（出撃していなくても有効）')
  })
})

describe('Japanese duration rendering', () => {
  it('uses the source counters', () => {
    expect(renderJapaneseDuration('3 turns')).toBe('3ターン')
    expect(renderJapaneseDuration('1 time')).toBe('1回')
    expect(renderJapaneseDuration('2 times')).toBe('2回')
  })
})

describe('Japanese skill rendering end to end', () => {
  it('renders effect rows in Japanese while leaving source text verbatim', () => {
    const skill = localizedSkill({
      name_en: 'Master General Flash',
      name_jp: '名将一閃【橙象】',
      effects: [{
        condition: 'Enemy [General] with highest max morale',
        target: '1 enemy [General]',
        effect: '150% Damage',
        duration: '3 turns',
      }],
    }, 'renpa', 0, 'ja')
    const [row] = skill.displayEffects
    expect(row.condition).toBe('最大士気が最も高い敵武将')
    expect(row.target).toBe('敵武将1名')
    expect(row.effect).toBe('150%ダメージ')
    expect(row.duration).toBe('3ターン')
    // The source name and description are never paraphrased by the renderer.
    expect(skill.displayName).toBe('名将一閃【橙象】')
    expect(skill.descriptionJp).toContain('ダメージを与える')
  })

  it('leaves English locales untouched', () => {
    const skill = localizedSkill({
      name_en: 'Test',
      effects: [{ target: '1 enemy [General]', effect: '150% Damage' }],
    }, 'renpa', 0, 'en')
    expect(skill.displayEffects[0].target).toBe('1 enemy [General]')
    expect(skill.displayEffects[0].effect).toBe('150% Damage')
  })
})

describe('Japanese shapes the Arabic renderer already modelled', () => {
  it('reads a group name the source wrote in brackets', () => {
    // 「[Gyokuhou] Unit」 rather than 「Gyokuhou Unit」 — this shape reached the
    // generated Share Team image in English before it was modelled.
    expect(renderJapaneseTarget('Ally [Hishin] Unit')).toBe('味方飛信隊武将')
    expect(renderJapaneseCondition('Other ally [Gyokuhou] Unit alive'))
      .toBe('自身以外の味方玉鳳隊武将が生存している場合')
  })

  it('renders a scaling clause that carries no (scales) tag', () => {
    expect(renderJapaneseCondition('The higher own remaining HP')).toBe('自身の残り体力が高いほど')
    expect(renderJapaneseCondition('The lower own remaining HP')).toBe('自身の残り体力が低いほど')
  })
})

describe('source-audited conquest mechanic distinctions', () => {
  it('distinguishes defeated allies from enemies defeated during the effect', () => {
    expect(japaneseSkillSource('tou', 0).skillId).toBe(120)
    expect(japaneseSkillSource('tou', 0).desc).toContain('撃破された味方武将1名につき')
    expect(renderJapaneseCondition('Per defeated ally [General]')).toBe('撃破された味方武将1名につき')
    expect(japaneseSkillSource('kanmei', 1).skillId).toBe(73)
    expect(japaneseSkillSource('kanmei', 1).desc).toContain('効果中に自身が撃破した敵武将1名につき')
    expect(renderJapaneseCondition('Per enemy [General] defeated while skill is active'))
      .toBe('効果中に自身が撃破した敵武将1名につき')
  })

  it('identifies attack and defense siege weapons as recipient types', () => {
    expect(japaneseSkillSource('entei', 2).desc).toContain('味方攻撃兵器')
    expect(japaneseSkillSource('shousa', 1).desc).toContain('味方防衛兵器')
    expect(renderJapaneseTarget('Ally attack [Siege Weapon]')).toBe('味方攻撃兵器')
    expect(renderJapaneseTarget('Ally defense [Siege Weapon]')).toBe('味方防衛兵器')
    expect(renderJapaneseTarget('Self / Ally attack [Siege Weapon]')).toBe('自身／味方攻撃兵器')
    expect(renderJapaneseTarget('2 enemy [Siege Weapon]')).toBe('敵兵器2つ')
    expect(renderJapaneseTarget('1 enemy [Siege Weapon] with highest ATK')).toBe('攻撃力が最も高い敵兵器1つ')
    expect(renderJapaneseEffect('1 [Siege Weapon] ATK Up 20%')).toBe('兵器1つの攻撃力20%上昇')
    expect(renderJapaneseEffect('150% Damage to equipment')).toBe('兵器に150%ダメージ')
  })

  it('keeps the 見切り state separate from a 回避率 stat change', () => {
    expect(japaneseSkillSource('futei', 3).desc).toContain('見切り(25%)')
    expect(japaneseSkillSource('kitari', 1).desc).toContain('見切り(30%)')
    expect(renderJapaneseEffect('Evasion (Dodge Chance) 25%')).toBe('見切り25%')
    expect(renderJapaneseEffect('Dodge Chance 30%')).toBe('見切り30%')
    expect(renderJapaneseTerm('Dodge Chance')).toBe('見切り')
    expect(renderJapaneseTerm('Evasion')).toBe('回避率')
    expect(renderJapaneseEffect('Evasion (Dodge Chance) Up 40%')).toBe('回避率40%上昇')
    expect(renderJapaneseEffect('Evasion (Dodge Chance) Down 25%')).toBe('回避率25%低下')
  })

  it('carries values across status lists without repeating the resistance noun', () => {
    expect(renderJapaneseEffect('Confusion Resistance, Betrayal Resistance 100%'))
      .toBe('「錯乱」耐性100%上昇、「裏切り」耐性100%上昇')
    expect(renderJapaneseEffect('Poison Resistance / Burn Resistance / Paralysis Resistance 100%'))
      .toBe('「毒」耐性100%上昇、「火傷」耐性100%上昇、「麻痺」耐性100%上昇')
    expect(renderJapaneseEffect('Confusion / Poison / Paralysis Infliction Rate Up 40%'))
      .toBe('「錯乱」付与確率40%上昇、「毒」付与確率40%上昇、「麻痺」付与確率40%上昇')
  })

  it('distinguishes infliction probability from guard strength', () => {
    expect(renderJapaneseEffect('Paralysis Infliction 70%')).toBe('「麻痺」付与確率70%')
    expect(renderJapaneseEffect('"Illusion"35%')).toBe('「幻影」付与確率35%')
    expect(renderJapaneseEffect('Normal Attack Seal 50%')).toBe('「通常攻撃封印」付与確率50%')
    expect(renderJapaneseEffect('Guard 60%')).toBe('ガード効果60%')
  })

  it('uses the source terrain and army spelling and identifies faction recipients', () => {
    expect(renderJapaneseTerm('Slope')).toBe('坂路')
    expect(renderJapaneseTerm('Forest')).toBe('森林')
    expect(renderJapaneseTerm('Marsh')).toBe('泥濘')
    expect(renderJapaneseTerm('Wei Fire Dragon')).toBe('魏火龍')
    expect(renderJapaneseCondition('When passing Forest terrain (effective even if not deployed)'))
      .toBe('地形【森林】通過時（出撃していなくても有効）')
    expect(renderJapaneseTarget('All ally [Chu]')).toBe('味方楚国全武将')
    expect(renderJapaneseTarget('1 [Qin] enemy')).toBe('敵秦国武将1名')
    expect(renderJapaneseCondition('[Zhao], [Wei], [Chu], [Qi] enemy with highest ATK'))
      .toBe('攻撃力が最も高い敵趙国・魏国・楚国・斉国武将')
  })

  it('keeps the ally or enemy scope on every member of a shared target list', () => {
    expect(renderJapaneseTarget('Ally Hi Shin Unit / Gyokuhou Unit / Gakuka Unit'))
      .toBe('味方飛信隊武将／味方玉鳳隊武将／味方楽華隊武将')
    expect(renderJapaneseTarget('Ally [Qin], [Zhao], [Wei], [Chu], [Han], and [Yan]'))
      .toBe('味方秦国武将、味方趙国武将、味方魏国武将、味方楚国武将、味方韓国武将、味方燕国武将')
    expect(renderJapaneseTarget('Enemy [Zhao] / [Wei] / [Chu] / [Han] / [Yan]'))
      .toBe('敵趙国武将／敵魏国武将／敵楚国武将／敵韓国武将／敵燕国武将')
    expect(renderJapaneseTarget('Ally [Infantry] and [Archer]')).toBe('味方歩兵武将と味方弓兵武将')
    expect(renderJapaneseTarget('Ally [Zhao] / [Wei] / Other [Chu] / [Han] / [Yan]'))
      .toBe('味方趙国武将／味方魏国武将／自身以外の味方楚国武将／味方韓国武将／味方燕国武将')
  })

  it('uses the source distinction between terrain damage penalties and consumption', () => {
    expect(japaneseSkillSource('douken', 1).desc).toContain('与ダメージ減少効果への耐性')
    expect(japaneseSkillSource('entei', 1).desc).toContain('消費する貨幣の量')
    expect(renderJapaneseEffect('Damage Reduction Effect Resistance 5.4%'))
      .toBe('与ダメージ減少効果耐性5.4%上昇')
    expect(renderJapaneseEffect('Damage Dealt Reduction Resistance 14.5%'))
      .toBe('与ダメージ減少耐性14.5%上昇')
    expect(renderJapaneseEffect('Squad Damage Reduction 6.2%')).toBe('部隊ダメージ6.2%軽減')
    expect(renderJapaneseEffect('Morale Cost Reduction 30%')).toBe('士気消費30%軽減')
    expect(renderJapaneseEffect('Currency Cost Down 3.2%')).toBe('貨幣消費量3.2%減少')
    expect(renderJapaneseEffect('Material Cost Down 6.2%')).toBe('資材消費量6.2%減少')
    expect(renderJapaneseEffect('Ore Cost Down 6.2%')).toBe('鉱石消費量6.2%減少')
  })

  it('leaves unresolved named participants completely unchanged', () => {
    for (const input of ['Ally Invented Name', 'When ally Invented Name is alive']) {
      expect(renderJapaneseTarget(input)).toBe(input)
      expect(renderJapaneseCondition(input)).toBe(input)
    }
  })
})
