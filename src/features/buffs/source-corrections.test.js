import { describe, expect, it } from 'vitest'
import units from '../../../data/cw_buffs.json'
import teams from '../../../data/cw_team_buffs.json'
import evidence from '../../../data/source/buff_corrections_2026-10-05.json'
import moubuOfficers from '../../../data/source/moubu_officers_2026-10-14.json'
import sourceMap from '../../../data/source/cw_skills.map.json'
import legacy from '../../../data/buff_ownership_legacy.json'
import { ALL, CHAR_BY_ID, normalizeProgress, redCrystalBuffUnlockCost } from '../../core.jsx'
import { resolveRegularBuffCharacter } from '../../buff-identity.js'
import { localizedCharacter, localizedText } from '../../i18n/data.js'
import { matchesCharacterName } from '../../i18n/ar-character-names.js'
import { BUFF_ARMIES, ARMY_ICON_CHAR, ARMY_PARENT_STATE } from './data.js'

const corrections = [...evidence.corrections, ...moubuOfficers.corrections]
const entriesFor = record => (record.kind === 'unit' ? units : teams[record.kind === 'state' ? 'states' : 'armies'])[record.category][record.stat]
const entryFor = record => entriesFor(record).find(entry => entry.ownership_id === record.ownership_id)

describe('source-verified buff corrections', () => {
  it('keeps every reviewed assignment visible under its evidenced owner and category', () => {
    for (const record of corrections) {
      const entry = entryFor(record)
      const character = CHAR_BY_ID[record.character_id]
      expect(entry, `${record.character_id}/${record.category}/${record.stat}`).toBeTruthy()
      expect(entry.character_id).toBe(character.id)
      expect(character.source.characterId).toBe(record.characterId)
      expect(entry.value).toBe(record.value)
      if (record.method !== 'cw') expect(entry.skill_layer).toBe(record.method)
      if (record.kind === 'unit') expect(resolveRegularBuffCharacter(entry, CHAR_BY_ID, ALL)).toBe(character)
      if (record.kind === 'army') expect(BUFF_ARMIES).toContain(record.category)
      for (const code of ['en', 'ja', 'ar', 'fr']) {
        const name = localizedCharacter(character, code).displayName
        expect(matchesCharacterName(character, name)).toBe(true)
      }
    }
  })

  it('does not award newly added buffs from existing saved or legacy ownership', () => {
    const old = new Set(Object.values(legacy.legacyKeys).flat())
    const saved = normalizeProgress({ buffSources: Object.fromEntries([...old].map(id => [id, true])) })
    const additions = corrections.filter(record => record.previousValue === undefined)
    for (const record of additions) {
      expect(old.has(record.ownership_id)).toBe(false)
      expect(saved.buffSources[record.ownership_id]).toBeUndefined()
      const owned = normalizeProgress({ ...saved, buffSources: { ...saved.buffSources, [record.ownership_id]: true } })
      expect(owned.buffSources[record.ownership_id]).toBe(true)
      expect(Object.keys(owned.buffSources)).toHaveLength(old.size + 1)
    }
    // Normal and Ura Zhao DEF copies are separate upgrades on the same owner.
    const duke = teams.states.Zhao.Defense.filter(entry => entry.character_id === 'duke_sei' || entry.name_jp === '青公')
    expect(duke.map(entry => entry.value)).toEqual([5, 5])
    expect(duke.map(entry => entry.skill_layer)).toEqual(['normal', 'ura'])
    expect(new Set(duke.map(entry => entry.ownership_id)).size).toBe(duke.length)
  })

  it('resolves the corrected Archer HP skill by its actual owner assignment', () => {
    const character = CHAR_BY_ID.jiou
    expect(character.skills[1]).toMatchObject({ cwId: 279, textId: 279, name_jp: '体力強化・中【弓兵】' })
    expect(character.skills[1].effects[0].effect).toBe('Max HP Up 6.9%')
    expect(sourceMap.skills['jiou#1']).toMatchObject({ status: 'exact', characterId: 24, skillId: 279, textId: 279 })
    expect(localizedCharacter(character, 'ja').skills[1].descriptionJp).toContain('6.9%')
    const row = units.Archer.HP.find(entry => entry.character_id === 'jiou')
    expect(row.ownership_id).toBe('buff_7a58b414000d430182a85c070dca2df0')
    expect(redCrystalBuffUnlockCost(row, 'unit', 'Archer', 'HP')).toBe(245)
  })

  it('reuses the established Qiang Tribe term and a real portrait in every locale', () => {
    expect(ARMY_ICON_CHAR['Qiang Tribe']).toBe('Kyoukai')
    expect(localizedText('Qiang Tribe', 'ja')).toBe('羌族')
    expect(localizedText('Qiang Tribe', 'ar')).toBe('قبيلة كيانغ')
    expect(localizedText('Qiang Tribe', 'fr')).toBe('Tribu Qiang')
  })

  it('adds the Moubu Army CW category without importing battlefield or Hero Rise buffs', () => {
    expect(ARMY_ICON_CHAR['Moubo Army']).toBe('Moubu')
    expect(ARMY_PARENT_STATE['Moubo Army']).toBe('qin')
    expect(localizedText('Moubo Army', 'ja')).toBe('蒙武軍')
    expect(localizedText('Moubo Army', 'ar')).toBe('جيش موبو')
    expect(localizedText('Moubo Army', 'fr')).toBe('Armée de Moubo')
    const group = teams.armies['Moubo Army']
    expect(group.HP).toEqual([])
    for (const stat of ['Attack', 'Defense']) {
      const reviewed = moubuOfficers.corrections.filter(record => record.kind === 'army' && record.stat === stat)
      expect(group[stat].map(entry => entry.ownership_id)).toEqual(reviewed.map(record => record.ownership_id))
    }
    const importedSkills = new Set(moubuOfficers.corrections.map(record => record.skillId))
    for (const excluded of moubuOfficers.excludedNonCw) expect(importedSkills.has(excluded.skillId)).toBe(false)
  })

  it('retains both officers normal-skill ownership independently of each new Ura source', () => {
    const saved = normalizeProgress({ buffSources: Object.fromEntries(moubuOfficers.existingNormal.map(record => [record.ownership_id, true])) })
    for (const record of moubuOfficers.existingNormal) {
      const entry = entryFor(record)
      expect(entry.value).toBe(record.value)
      expect(entry.skill_layer).toBe('normal')
      expect(saved.buffSources[entry.ownership_id]).toBe(true)
      expect(resolveRegularBuffCharacter(entry, CHAR_BY_ID, ALL)).toBe(CHAR_BY_ID[record.character_id])
    }
    for (const record of moubuOfficers.corrections) {
      expect(saved.buffSources[record.ownership_id]).toBeUndefined()
      const next = normalizeProgress({ ...saved, buffSources: { ...saved.buffSources, [record.ownership_id]: true } })
      expect(next.buffSources[record.ownership_id]).toBe(true)
      for (const other of moubuOfficers.corrections.filter(other => other.ownership_id !== record.ownership_id)) {
        expect(next.buffSources[other.ownership_id]).toBeUndefined()
      }
    }
  })
})
