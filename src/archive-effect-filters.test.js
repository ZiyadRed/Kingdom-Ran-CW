import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getReleaseData } from './core.jsx'
import { CATALOGS } from './i18n/i18n.js'
import {
  ARCHIVE_EFFECT_FILTERS, ARCHIVE_EFFECT_FILTER_IDS, ARCHIVE_ROLE_FILTERS, characterEffectFilterIds, characterRole,
  effectFilterCounts, filterCharactersByRoleAndEffects, targetSides,
} from './archive-effect-filters.js'

const { ALL } = getReleaseData(Infinity)
const filter = id => ARCHIVE_EFFECT_FILTERS.find(item => item.id === id)
const matches = (id, target, effect) => filter(id).match({ target, effect })
const ROLE_ROWS = JSON.parse(readFileSync(join(process.cwd(), 'data/souha_role_skills.json'), 'utf8')).skills

describe('effect filter semantics read the English source rows', () => {
  it('tells recipients apart, ignoring the matchup after "vs"', () => {
    expect([...targetSides('All enemy [General]')]).toEqual(['enemy'])
    expect([...targetSides('1 poisoned enemy [General]')]).toEqual(['enemy'])
    expect([...targetSides('Ally [Zhao] vs confused enemy [General]')]).toEqual(['ally'])
    expect([...targetSides('Other ally [General] / Enemy [General]')].sort()).toEqual(['ally', 'enemy'])
    expect([...targetSides('Self')]).toEqual(['ally'])
  })

  it('counts an inflicted status and a raised infliction chance, never a resistance', () => {
    expect(matches('confusion', '1 enemy [General]', 'Confusion Infliction 30%')).toBe(true)
    expect(matches('confusion', 'Other ally', 'Confusion Infliction Rate Up 20%')).toBe(true)
    expect(matches('confusion', 'Ally [Shield]', 'Confusion Resistance 50%')).toBe(false)
    for (const id of ['confusion', 'poison', 'paralysis']) expect(matches(id, 'Other ally', 'Confusion / Poison / Paralysis Infliction Rate Up 40%')).toBe(true)
    expect(matches('poison', '1 enemy [General]', 'Severe Poison Infliction 40%')).toBe(true)
    expect(matches('poison', 'Self', 'Poison Damage Up 100%')).toBe(true)
    expect(matches('burn', 'Ally [Shield]', 'Poison Resistance / Burn Resistance / Paralysis Resistance 100%')).toBe(false)
    expect(matches('status-resistance', 'Ally [Shield]', 'Poison Resistance / Burn Resistance / Paralysis Resistance 100%')).toBe(true)
    expect(matches('status-resistance', 'Self', '"Betrayal" Resistance, "Confusion" Resistance 35%')).toBe(true)
    expect(matches('status-resistance', 'Self', 'ATK Down Resistance 30%')).toBe(false)
  })

  it('keeps the dodge status and a raised evasion rate, but not an evasion debuff', () => {
    expect(matches('evasion', 'Self', 'Evasion (Dodge Chance) 20%')).toBe(true)
    expect(matches('evasion', 'Self', 'Dodge Chance 30%')).toBe(true)
    expect(matches('evasion', 'Other ally [Chu]', 'Evasion (Dodge Chance) Up 10%')).toBe(true)
    expect(matches('evasion', 'All enemy [General]', 'Evasion (Dodge Chance) Down 20%')).toBe(false)
  })

  it('reads Provoke, Sure Hit and recovery precisely', () => {
    expect(matches('provoke', 'Self', 'Provoke')).toBe(true)
    expect(matches('provoke', 'Self', '"Provoke"')).toBe(true)
    expect(matches('provoke', 'Ally [Qin]', 'Status Effect Immunity (excl. Provoke)')).toBe(false)
    expect(matches('status-immunity', 'Ally [Qin]', 'Status Effect Immunity (excl. Provoke)')).toBe(true)
    expect(matches('sure-hit', 'Ally [Chu]', 'Sure Hit')).toBe(true)
    expect(matches('sure-hit', 'All enemy [General]', 'Remove Sure Hit')).toBe(false)
    expect(matches('hp-recovery', 'Ally [Wei]', 'Continuous HP Recovery 8%')).toBe(true)
    expect(matches('hp-recovery', 'Self', 'HP Recovery 100,000')).toBe(true)
    expect(matches('hp-recovery', 'Self', 'HP Recovery Rate Up 50%')).toBe(false)
    expect(matches('def-penetration', 'Ally [Chu]', 'DEF Penetration Up 30%')).toBe(true)
    expect(matches('def-penetration', 'Self', 'DEF Penetration Resistance 30%')).toBe(false)
  })

  it('only counts stat downs that land on the enemy', () => {
    expect(matches('def-down', 'All enemy [General]', 'DEF Down 30%')).toBe(true)
    expect(matches('def-down', 'Other ally [Chu]', 'DEF Down 10%')).toBe(false)
    expect(matches('atk-down', 'All enemy [General]', 'ATK Down, DEF Down, Evasion (Dodge Chance) Down 30%')).toBe(true)
    expect(matches('critical', 'Self', 'DEF Penetration Resistance Up 30%, Enemy [Cavalry] Critical Rate Down 40%')).toBe(false)
    expect(matches('atk-down', 'Self', 'Enemy [General] ATK Down 40%')).toBe(true)
  })
})

describe('Archive role and effect filtering', () => {
  it('lists exactly the generals with each role skill', () => {
    for (const role of ARCHIVE_ROLE_FILTERS) {
      const listed = filterCharactersByRoleAndEffects(ALL, { role }).map(c => c.id).sort()
      const expected = ROLE_ROWS.filter(row => row.role === role).map(row => row.owner_id).filter(id => ALL.some(c => c.id === id)).sort()
      expect(listed, role).toEqual(expected)
      expect(listed.length, role).toBeGreaterThan(0)
    }
    expect(characterRole(ALL.find(c => c.id === 'beiman'))).toBe('Strategist')
    expect(characterRole(ALL.find(c => c.id === 'shin'))).toBe(null)
  })

  it('looks inside Leader and Strategist skills too', () => {
    // Renpa's only status resistance is his Leader skill's Confusion Resistance.
    const renpa = ALL.find(c => c.id === 'renpa')
    expect(characterEffectFilterIds(renpa).has('status-resistance')).toBe(true)
    expect(characterEffectFilterIds({ ...renpa, roleSkill: null }).has('status-resistance')).toBe(false)
  })

  it('requires every selected effect and counts what each chip would leave', () => {
    const both = filterCharactersByRoleAndEffects(ALL, { effects: ['guard', 'sure-hit'] })
    expect(both.length).toBeGreaterThan(0)
    expect(both.every(c => characterEffectFilterIds(c).has('guard') && characterEffectFilterIds(c).has('sure-hit'))).toBe(true)
    const counts = effectFilterCounts(ALL, ['guard'])
    for (const id of ARCHIVE_EFFECT_FILTER_IDS) {
      const expected = filterCharactersByRoleAndEffects(ALL, { effects: id === 'guard' ? ['guard'] : ['guard', id] }).length
      expect(counts[id], id).toBe(expected)
    }
  })

  it('offers no dead chip: every effect finds at least one general', () => {
    for (const id of ARCHIVE_EFFECT_FILTER_IDS) expect(filterCharactersByRoleAndEffects(ALL, { effects: [id] }).length, id).toBeGreaterThan(0)
  })

  it('labels every chip in every language, with no Latin letters in Japanese', () => {
    for (const code of ['en', 'ja', 'ar', 'fr']) {
      const archive = CATALOGS[code].archive
      for (const id of ARCHIVE_EFFECT_FILTER_IDS) expect(archive.effects[id], `${code}.${id}`).toBeTruthy()
      for (const role of ARCHIVE_ROLE_FILTERS) expect(archive.role[role], `${code}.${role}`).toBeTruthy()
    }
    const japanese = [...Object.values(CATALOGS.ja.archive.effects), ...Object.values(CATALOGS.ja.archive.role), ...Object.values(CATALOGS.ja.archive.effectFilter), CATALOGS.ja.archive.roleFilter]
    expect(japanese.filter(value => /[A-Za-z]/.test(value.replace(/{{[^}]+}}/g, '')))).toEqual([])
  })
})
