import { describe, expect, it } from 'vitest'
import {
  ALL, calcCharBuffs, calcTeamEnemyDebuffs, getMultiplier, isTargetedBy, parseBuffEffect,
} from './core.jsx'
import { localizedCharacter, localizedText } from './i18n/data.js'
import { CATALOGS } from './i18n/i18n.js'
import { CONDITION_CHIP_LABELS } from './pages.jsx'
import { compareCharacters } from './i18n/character-search.js'
import {
  DEFAULT_SHARE_LABELS, buildCharacterImageLayout, buildTeamImageLayout, inspectShareImageLayout,
} from './share.js'

const character = id => ALL.find(c => c.id === id)
const bare = id => ({ ...character(id), skills: [], roleSkill: null })
const rowOwner = (id, slot, index) => {
  const c = character(id), skill = c.skills[slot]
  return { ...c, roleSkill: null, skills: [{ ...skill, effects: [skill.effects[index]] }] }
}
const buffs = (recipient, team) => calcCharBuffs(recipient, team, [], false, true, true)

describe('source-backed Japanese review corrections', () => {
  it('applies Karin’s penalty to her other Chu allies and never to the enemy summary', () => {
    const karin = rowOwner('karin', 1, 1), kanmei = bare('kanmei'), shin = bare('shin')
    const team = [karin, kanmei, shin]
    expect(buffs(karin, team).DEF).toBeUndefined()
    expect(buffs(kanmei, team).DEF?.down).toBe(10)
    expect(buffs(shin, team).DEF).toBeUndefined()
    expect(Object.keys(calcTeamEnemyDebuffs(team, [bare('kanmei')], true))).toEqual([])
  })

  it('requires Yotanwa rather than Kitari for Danto’s recovery bonus', () => {
    const danto = rowOwner('danto', 1, 1)
    expect(buffs(danto, [danto, bare('yotanwa')])['HP Recovery Rate']?.up).toBe(50)
    expect(buffs(danto, [danto, bare('kitari')])['HP Recovery Rate']).toBeUndefined()
  })

  it('limits Rinko’s critical-rate bonus to himself and Renpa', () => {
    const rinko = rowOwner('rinko', 3, 1), renpa = bare('renpa'), kaishibou = bare('kaishibou')
    for (const recipient of [rinko, renpa]) expect(buffs(recipient, [rinko, renpa, kaishibou])['Critical Rate']?.up).toBe(20)
    expect(buffs(kaishibou, [rinko, renpa, kaishibou])['Critical Rate']).toBeUndefined()
  })

  it.each([['shoutaku', 3, 0], ['kyuukou', 3, 0]])('keeps %s’s CW6 recipients on Ouhon and Ousen Army', (id, slot, index) => {
    const owner = rowOwner(id, slot, index), target = owner.skills[0].effects[0].target
    expect(isTargetedBy(target, bare('ouhon'), owner, [owner, bare('ouhon')])).toBe(true)
    expect(isTargetedBy(target, bare('akou'), owner, [owner, bare('akou')])).toBe(true)
    expect(isTargetedBy(target, bare('moubu'), owner, [owner, bare('moubu')])).toBe(false)
  })

  it.each([
    ['goumasho', 1, 1], ['ryofui', 0, 1], ['ouki', 0, 1],
    ['tou', 1, 1], ['seikai', 0, 2], ['kakubi', 0, 0],
  ])('preserves the source’s self-exclusion for %s', (id, slot, index) => {
    const owner = rowOwner(id, slot, index)
    expect(isTargetedBy(owner.skills[0].effects[0].target, owner, owner, [owner])).toBe(false)
  })

  it('excludes Bain from his own Kanki Army count and keeps attack events separate', () => {
    const bain = rowOwner('bain', 2, 1)
    const condition = bain.skills[0].effects[0].condition
    expect(getMultiplier(condition, bain, [bain])).toBe(0)
    expect(getMultiplier(condition, bain, [bain, bare('kanki'), bare('raido')])).toBe(2)
    for (const [id, slot, index] of [['shin', 2, 1], ['ordo', 1, 0]]) {
      const owner = rowOwner(id, slot, index)
      const recipient = id === 'ordo' ? bare('gekishin') : owner
      const result = buffs(recipient, [owner, recipient])
      expect(result.meta.conditionalEffects).toEqual(expect.arrayContaining([
        expect.objectContaining({ effect: expect.objectContaining({ condition: 'Per other ally attack count' }), valueMeaning: expect.objectContaining({ kind: 'perCounter' }) }),
      ]))
    }
  })

  it('renders Hyouki’s recipient union independently from his infantry matchup', () => {
    const owner = rowOwner('hyouki', 0, 1), ouki = bare('ouki'), hakurei = bare('hakurei'), heirai = bare('heirai')
    const target = owner.skills[0].effects[0].target
    for (const recipient of [ouki, hakurei]) expect(isTargetedBy(target, recipient, owner, [owner, recipient])).toBe(true)
    expect(isTargetedBy(target, heirai, owner, [owner, heirai])).toBe(false)
    const display = localizedCharacter(owner, 'ja').skills[0].displayEffects[0]
    expect(display.target).toContain('騎兵')
    expect(display.target).toContain('弓兵')
    expect(display.effect).toBe('歩兵に対する防御力20%上昇')
  })

  it.each([
    ['hakukisei', 'gokei', 'ouki', 'heirai', 'DEF', 25],
    ['kourigen', 'hakurei', 'gokei', 'ouki', 'ATK', 20],
  ])('keeps %s’s ally recipient distinct from the opposing unit type', (id, allyId, matchedEnemy, otherEnemy, stat, value) => {
    const owner = rowOwner(id, 0, 1), ally = bare(allyId), team = [owner, ally]
    expect(calcCharBuffs(ally, team, [bare(matchedEnemy)], true, true, true)[stat]?.up).toBe(value)
    expect(calcCharBuffs(ally, team, [bare(otherEnemy)], true, true, true)[stat]).toBeUndefined()
  })

  it('includes Kanto’s infantry bonus and the source’s three-turn limits', () => {
    const kanto = rowOwner('kanto', 2, 0), heirai = bare('heirai'), ouki = bare('ouki')
    expect(buffs(heirai, [kanto, heirai, ouki]).ATK?.up).toBe(20)
    expect(buffs(ouki, [kanto, heirai, ouki]).ATK).toBeUndefined()
    for (const [id, slot, index] of [['kanto', 2, 0], ['kyoukai', 2, 2], ['yotanwa', 0, 2]]) {
      expect(character(id).skills[slot].effects[index].duration).toBe('3 turns')
    }
  })

  it('keeps 見切り probability separate from additive evasion, including stable Makou mechanics', () => {
    for (const effect of ['Dodge Chance 30%', 'Evasion (Dodge Chance) 30%']) {
      expect(parseBuffEffect(effect)).toEqual([expect.objectContaining({ stat: 'Dodge Chance', valueMeaning: { kind: 'chance', rate: 30 } })])
      expect(parseBuffEffect(`Evasion Up 20%, and ${effect}`).map(row => row.stat)).toEqual(['Evasion', 'Dodge Chance'])
    }
    expect(parseBuffEffect('Evasion Up 20%')[0].stat).toBe('Evasion')
    const makou = rowOwner('makou', 1, 0)
    const owner = { ...makou, skills: [...makou.skills, { type: 'Strategy', effects: [{ target: 'Self', effect: 'Evasion Up 20%' }] }] }
    const result = buffs(owner, [owner])
    expect(result.Evasion.up).toBe(20)
    expect(result['Dodge Chance']).toBeUndefined()
    expect(result.meta.conditionalEffects).toEqual(expect.arrayContaining([
      expect.objectContaining({ stat: 'Dodge Chance', valueMeaning: { kind: 'chance', rate: 30 } }),
    ]))
  })

  it('orders Japanese names by source readings and kana, rather than Romaji', () => {
    const ids = ['ouki', 'akou', 'ordo', 'kanki', 'moubu']
    const sorted = ids.map(character).sort((a, b) => compareCharacters(a, b, 'ja')).map(c => c.id)
    expect(sorted).toEqual(['akou', 'ouki', 'ordo', 'kanki', 'moubu'])
    expect(ids.map(character).sort((a, b) => compareCharacters(a, b, 'en')).map(c => c.name_en))
      .toEqual(ids.map(character).map(c => c.name_en).sort((a, b) => a.localeCompare(b)))
  })
})

const ctx = {
  font: '16px sans-serif',
  measureText(value) {
    const size = Number(/(\d+(?:\.\d+)?)px/.exec(this.font)?.[1] || 16)
    return { width: [...String(value || '')].reduce((sum, c) => sum + (/[\u3000-\u9fff\u3040-\u30ff\u0600-\u06ff]/.test(c) ? 1 : .56), 0) * size }
  },
}

describe.each(['ja', 'ar', 'fr'])('%s exported skill images', locale => {
  it('retains every complete translated condition once, without raw-English fallback', () => {
    const catalog = CATALOGS[locale]
    const labels = {
      ...DEFAULT_SHARE_LABELS, ...catalog.shareOutput, direction: locale === 'ar' ? 'rtl' : 'ltr',
      conditions: CONDITION_CHIP_LABELS[locale], localizeTerm: value => localizedText(value, locale),
    }
    const localized = ALL.map(c => localizedCharacter(c, locale))
    const check = layout => {
      expect(inspectShareImageLayout(layout)).toEqual({ ok: true, issues: [] })
      const skills = layout.skillLayouts || layout.memberLayouts.flatMap(member => member.skillLayouts)
      for (const skill of skills) for (const row of skill.effects) {
        const translated = row.pair.effect.condition
        if (!translated || translated === row.pair.source.condition) continue
        expect(row.conditionBlocks).toHaveLength(1)
        expect(row.conditionBlocks[0].text).toContain(translated)
        expect(row.conditionBlocks[0].text).not.toMatch(/\b(?:When|own HP|gate HP remaining|ally .+ alive|highest ATK)\b/)
      }
    }
    for (const c of localized) check(buildCharacterImageLayout(ctx, c, labels))
    for (let i = 0; i < localized.length; i += 4) check(buildTeamImageLayout(ctx, localized.slice(i, i + 4), { labels }))
  })
})
