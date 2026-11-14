import { describe, expect, it } from 'vitest'
import teamBuffs from '../data/cw_team_buffs.json'
import rarityData from '../data/character_rarity.json'
import { ALL, CHAR_BY_ID, META_TEAMS, RED_CRYSTAL_TOTAL_COST, buffEntryRarity, findCharById, findCharByName } from './core.jsx'
import { characterFacts, characterMetaTeams, characterPassiveBuffs } from './archive-facts.js'

const deps = { buffEntryRarity, redCrystalTotals: RED_CRYSTAL_TOTAL_COST }
const rarityByJp = new Map(Object.values(rarityData).map(row => [row.name_jp, row.rarity]))

describe('archive fact strip', () => {
  it('takes rarity from character_rarity.json for every character that has a row', () => {
    for (const character of ALL) {
      const facts = characterFacts(character, deps)
      const expected = rarityByJp.get(character.name_jp) || null
      expect(facts.rarity).toBe(expected)
      expect(facts.redCrystalCost).toBe(expected ? RED_CRYSTAL_TOTAL_COST[expected] : null)
    }
  })

  it('omits rarity and cost rather than guessing when the rarity table has no row', () => {
    const synthetic = { id: 'future_general', name_jp: '未登録の武将', rarity: 'UR', unit_type: 'Cavalry', groups: [] }
    expect(characterFacts(synthetic, deps)).toEqual({ rarity: null, unitType: 'Cavalry', groups: [], redCrystalCost: null })
  })

  it('lists the Buff Tracker sources a general owns, keyed by their unchanged ownership ids', () => {
    for (const character of ALL.slice(0, 80)) {
      for (const row of characterPassiveBuffs(character, { ALL, CHAR_BY_ID, findCharByName })) {
        expect(row.value).toBeGreaterThan(0)
        expect(row.id).toMatch(/^buff_[a-f0-9]{32}$/)
      }
    }
    const zhaoAttack = teamBuffs.states.Zhao.Attack[0]
    const owner = ALL.find(character => character.name_jp === zhaoAttack.name_jp)
    const rows = characterPassiveBuffs(owner, { ALL, CHAR_BY_ID, findCharByName })
    expect(rows).toContainEqual(expect.objectContaining({ kind: 'state', key: 'Zhao', stat: 'Attack', value: zhaoAttack.value, id: zhaoAttack.ownership_id }))
  })

  it('finds the preset teams that include a general by resolved identity', () => {
    const team = META_TEAMS[0]
    const member = findCharByName(team.members[0])
    expect(characterMetaTeams(member, { META_TEAMS, findCharByName }).map(t => t.name)).toContain(team.name)
    expect(characterMetaTeams(findCharById('__missing__'), { META_TEAMS, findCharByName })).toEqual([])
  })
})
