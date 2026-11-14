import { describe, expect, it } from 'vitest'
import { TIER_TEAMS, findCharByName } from './core.jsx'
import { assignCwStatsCharacter, createDefaultCwStatsState, isEmptyCwStatsState, loadCwStatsExample, updateCwStatsCharacter } from './cwstats.jsx'

const exampleIds = TIER_TEAMS[0].members.map(name => findCharByName(name)?.id).filter(Boolean)

describe('Stats Calculator example', () => {
  it('fills an empty calculator with the first Metawatch team and blank stats', () => {
    const next = loadCwStatsExample(createDefaultCwStatsState(), exampleIds)
    expect(next.teams[0].slots.filter(Boolean)).toEqual(exampleIds.slice(0, 4))
    for (const id of exampleIds) expect(next.characters[id]).toEqual({ hp: '', atkMin: '', atkMax: '', def: '', buffs: { hp: '', atk: '', def: '' } })
  })

  it('never overwrites a calculator that already holds data', () => {
    const withGeneral = assignCwStatsCharacter(createDefaultCwStatsState(), 'team-1', 'moubu')
    expect(isEmptyCwStatsState(withGeneral)).toBe(false)
    expect(loadCwStatsExample(withGeneral, exampleIds)).toBe(withGeneral)
    const withValues = updateCwStatsCharacter(createDefaultCwStatsState(), 'moubu', 'hp', '12345')
    expect(loadCwStatsExample(withValues, exampleIds)).toBe(withValues)
  })
})
