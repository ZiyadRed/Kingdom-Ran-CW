import { describe, expect, it } from 'vitest'
import {
  renderJapaneseCondition,
  renderJapaneseDuration,
  renderJapaneseEffect,
  renderJapaneseTarget,
  renderJapaneseTerm,
} from './ja-render.js'
import { localizedSkill } from './data.js'

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
    expect(renderJapaneseEffect('HP Seal 50%')).toBe('体力回復無効50%')
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
    expect(renderJapaneseTarget('1 enemy [Siege Weapon]')).toBe('敵兵器1名')
  })

  it('uses the source unit and state names', () => {
    expect(renderJapaneseTarget('Self')).toBe('自身')
    expect(renderJapaneseTarget('Ally [Infantry]')).toBe('味方歩兵')
    expect(renderJapaneseTarget('Ally [Shield]')).toBe('味方盾兵')
    expect(renderJapaneseTarget('Ally [Zhao]')).toBe('味方趙国')
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
    expect(renderJapaneseTerm('Way of The Great General')).toBe('大将軍への道')
    expect(renderJapaneseTerm('Six Great Generals')).toBe('六大将軍')
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
