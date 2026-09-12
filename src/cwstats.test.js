import { describe, expect, it, vi } from 'vitest'
import {
  addCwStatsTeam,
  assignCwStatsCharacter,
  calculateCwPower,
  cwStatsCharacterRarity,
  createDefaultCwStatsState,
  displayedCwStats,
  emptyCwScenario,
  cwStatsValuesForTeam,
  normalizeCwStatsState,
  projectedCwStats,
  removeCwStatsCharacter,
  updateCwStatsCharacter,
  updateCwStatsScenario,
  writeStoredCwStats,
} from './cwstats.jsx'

describe('CW Stats calculator formula', () => {
  it('uses the mean of ATK min and ATK max with one final rounding step', () => {
    expect(calculateCwPower({ hp: 1000, atkMin: 100, atkMax: 200, def: 300 })).toBe(596)
  })

  it('uses current displayed stats directly instead of double-counting their brackets', () => {
    const stats = {
      hp: 1000,
      atkMin: 100,
      atkMax: 200,
      def: 300,
      buffs: { hp: 10, atk: 10, def: 10 },
    }
    expect(displayedCwStats(stats)).toEqual({ hp: 1000, atkMin: 100, atkMax: 200, def: 300 })
    expect(calculateCwPower(stats)).toBe(596)
  })

  it('projects an extra percentage change from the current bracket', () => {
    const stats = {
      hp: 1000,
      atkMin: 100,
      atkMax: 200,
      def: 300,
      buffs: { hp: 0, atk: 0, def: 0 },
      buffChanges: { hp: 5, atk: 10, def: 20 },
    }
    expect(projectedCwStats(stats)).toEqual({ hp: 1050, atkMin: 110, atkMax: 220, def: 360 })
    expect(calculateCwPower(projectedCwStats(stats))).toBe(676)
  })

  it('adds a change to the current percentage bracket without double-counting it', () => {
    const stats = {
      hp: 1000,
      atkMin: 100,
      atkMax: 200,
      def: 300,
      buffs: { hp: 10, atk: 10, def: 10 },
      buffChanges: { hp: 5, atk: 10, def: 0 },
    }
    expect(projectedCwStats(stats)).toEqual({ hp: 1045, atkMin: 109, atkMax: 218, def: 300 })
  })

  it('adds Scene Card base buffs before applying the percentage multiplier', () => {
    const stats = {
      hp: 271383,
      atkMin: 49087,
      atkMax: 51671,
      def: 19972,
      buffs: { hp: 684.7, atk: 251.7, def: 234.2 },
      buffChanges: { hp: 0, atk: 0, def: 0 },
      baseBuffs: { hp: 1983, atk: 0, def: 0 },
    }
    expect(projectedCwStats(stats)).toEqual({ hp: 286944, atkMin: 49087, atkMax: 51671, def: 19972 })
    expect(projectedCwStats({ ...stats, buffChanges: { hp: 5, atk: 0, def: 0 } }).hp).toBe(288772)
    expect(projectedCwStats({ hp: 1000, atkMin: 100, atkMax: 200, def: 300, baseBuffs: { hp: 10, atk: 10, def: 20 } }))
      .toEqual({ hp: 1010, atkMin: 110, atkMax: 210, def: 320 })
  })

  it('treats blank or non-numeric inputs as zero without producing NaN', () => {
    expect(calculateCwPower({ hp: '', atkMin: 'not a number', atkMax: '', def: '' })).toBe(0)
  })
})

describe('CW Stats calculator rarity labels', () => {
  it('uses stable-ID Team Cost assignments instead of stale raw rarity or ambiguous names', () => {
    expect(cwStatsCharacterRarity({ id: 'ouhon', name_en: 'Ouhon', rarity: 'UR' })).toBe('SR')
    expect(cwStatsCharacterRarity({ id: 'kanjou', name_en: 'Kanjou', rarity: 'SR' })).toBe('UR')
    expect(cwStatsCharacterRarity({ id: 'kou', name_en: 'Kou' })).toBe('UR')
    expect(cwStatsCharacterRarity({ id: 'kou2', name_en: 'Kou' })).toBe('N')
  })
})

describe('CW Stats calculator saved state', () => {
  it('starts with one four-slot v2 team with a stable identity', () => {
    expect(createDefaultCwStatsState()).toMatchObject({
      version: 2,
      characters: {},
      teams: [{
        id: 'team-1',
        slots: [null, null, null, null],
        scenarios: {},
      }],
    })
  })

  it('normalizes saved teams to four slots, caps them at five, and migrates v1 scenarios', () => {
    const raw = {
      version: 1,
      characters: {
        shin: {
          hp: 100,
          buffs: { atk: 5 },
          buffChanges: { hp: 4 },
          baseBuffs: { def: 7 },
        },
      },
      teams: [
        ['shin', 'ouki', 'ouhon', 'tou', 'extra'],
        ['hakuki'],
        [],
        [],
        [],
        ['ignored'],
      ],
    }
    const normalized = normalizeCwStatsState(raw)
    expect(normalized.teams).toHaveLength(5)
    expect(normalized.teams[0]).toMatchObject({
      id: 'team-1',
      slots: ['shin', 'ouki', 'ouhon', 'tou'],
      scenarios: {
        shin: {
          buffChanges: { hp: 4, atk: '', def: '' },
          baseBuffs: { hp: '', atk: '', def: 7 },
        },
      },
    })
    expect(normalized.teams[1]).toMatchObject({
      id: 'team-2',
      slots: ['hakuki', null, null, null],
      scenarios: { hakuki: emptyCwScenario() },
    })
    expect(normalized.characters.shin).toEqual({
      hp: 100,
      atkMin: '',
      atkMax: '',
      def: '',
      buffs: { hp: '', atk: 5, def: '' },
    })
    expect(normalized.characters.shin).not.toHaveProperty('buffChanges')
    expect(normalized.characters.shin).not.toHaveProperty('baseBuffs')
  })

  it('keeps Scene Card base buffs local to each migrated team and defaults missing values safely', () => {
    const normalized = normalizeCwStatsState({
      version: 1,
      characters: {
        shin: { baseBuffs: { hp: 1983, def: 20 } },
        ouki: { rawBuffs: { atk: 12 } },
      },
      teams: [['shin'], ['shin'], ['ouki']],
    })
    expect(normalized.characters.shin).toEqual({
      hp: '', atkMin: '', atkMax: '', def: '', buffs: { hp: '', atk: '', def: '' },
    })
    expect(normalized.teams[0].scenarios.shin.baseBuffs).toEqual({ hp: 1983, atk: '', def: 20 })
    expect(normalized.teams[1].scenarios.shin.baseBuffs).toEqual({ hp: 1983, atk: '', def: 20 })
    expect(normalized.teams[2].scenarios.ouki.baseBuffs).toEqual({ hp: '', atk: 12, def: '' })
  })

  it('returns safe v2 defaults for malformed state and missing team values', () => {
    expect(normalizeCwStatsState({ version: 999, teams: [['shin']] })).toEqual(createDefaultCwStatsState())

    const normalized = normalizeCwStatsState({
      version: 2,
      characters: { shin: { hp: null, buffs: { atk: 5 } } },
      teams: [
        null,
        { id: 'not-a-team-id', slots: ['shin', 'ouki', 'ouhon', 'tou', 'extra'], scenarios: { shin: null } },
        ['shin', 'ouki', 'ouhon', 'tou', 'extra'],
      ],
    })

    expect(normalized.version).toBe(2)
    expect(normalized.teams.map(team => team.slots)).toEqual([
      [null, null, null, null],
      ['shin', 'ouki', 'ouhon', 'tou'],
      ['shin', 'ouki', 'ouhon', 'tou'],
    ])
    expect(new Set(normalized.teams.map(team => team.id)).size).toBe(3)
    expect(cwStatsValuesForTeam(normalized, 'missing-team', 'missing-character')).toEqual({
      hp: '',
      atkMin: '',
      atkMax: '',
      def: '',
      buffs: { hp: '', atk: '', def: '' },
      buffChanges: { hp: '', atk: '', def: '' },
      baseBuffs: { hp: '', atk: '', def: '' },
    })
  })

  it('updates shared character facts globally while leaving team hypotheses intact', () => {
    const state = normalizeCwStatsState({
      version: 2,
      characters: {
        shin: { hp: '1000', atkMin: '100', atkMax: '200', def: '300', buffs: { hp: '10' } },
      },
      teams: [
        { id: 'team-1', slots: ['shin', null, null, null], scenarios: { shin: { buffChanges: { hp: '5' } } } },
        { id: 'team-2', slots: ['shin', null, null, null], scenarios: { shin: { buffChanges: { hp: '20' } } } },
      ],
    })
    const before = JSON.parse(JSON.stringify(state))
    const next = updateCwStatsCharacter(state, 'shin', 'hp', '2000')

    expect(state).toEqual(before)
    expect(next.characters.shin.hp).toBe('2000')
    expect(cwStatsValuesForTeam(next, 'team-1', 'shin').buffChanges.hp).toBe('5')
    expect(cwStatsValuesForTeam(next, 'team-2', 'shin').buffChanges.hp).toBe('20')
    expect(cwStatsValuesForTeam(next, 'team-1', 'shin').hp).toBe('2000')
    expect(cwStatsValuesForTeam(next, 'team-2', 'shin').hp).toBe('2000')
  })

  it('updates only the selected team scenario and keeps the other team unchanged', () => {
    const state = normalizeCwStatsState({
      version: 2,
      characters: {
        shin: { hp: '1000', atkMin: '100', atkMax: '200', def: '300', buffs: { hp: '0' } },
      },
      teams: [
        { id: 'team-1', slots: ['shin', null, null, null], scenarios: { shin: emptyCwScenario() } },
        { id: 'team-2', slots: ['shin', null, null, null], scenarios: { shin: emptyCwScenario() } },
      ],
    })
    const before = JSON.parse(JSON.stringify(state))
    const next = updateCwStatsScenario(state, 'team-2', 'shin', 'buffChanges', 'hp', '5')

    expect(state).toEqual(before)
    expect(cwStatsValuesForTeam(next, 'team-1', 'shin').buffChanges.hp).toBe('')
    expect(cwStatsValuesForTeam(next, 'team-2', 'shin').buffChanges.hp).toBe('5')
    expect(next.characters.shin).toEqual(state.characters.shin)
  })

  it('guards hydrated slots and team caps against stale rendered actions', () => {
    const state = normalizeCwStatsState({
      version: 2,
      characters: { shin: { hp: 100 }, ouki: { hp: 200 } },
      teams: [
        { id: 'team-1', slots: ['shin', null, null, null], scenarios: { shin: emptyCwScenario() } },
        { id: 'team-2', slots: [], scenarios: {} },
        { id: 'team-3', slots: [], scenarios: {} },
        { id: 'team-4', slots: [], scenarios: {} },
        { id: 'team-5', slots: [], scenarios: {} },
      ],
      nextTeamId: 6,
    })

    expect(assignCwStatsCharacter(state, 'team-1', 'ouki', 0, null)).toBe(state)
    expect(addCwStatsTeam(state)).toBe(state)
    const replaced = assignCwStatsCharacter(state, 'team-1', 'ouki', 0, 'shin')
    expect(replaced.teams[0].slots[0]).toBe('ouki')
  })

  it('removes the alternative-local scenario with its roster entry', () => {
    const state = normalizeCwStatsState({
      version: 2,
      characters: { shin: { hp: 1000 } },
      teams: [{ id: 'team-1', slots: ['shin'], scenarios: { shin: { buffChanges: { hp: 50 } } } }],
    })
    const removed = removeCwStatsCharacter(state, 'team-1', 0)
    const readded = assignCwStatsCharacter(removed, 'team-1', 'shin', 0, null)

    expect(removed.teams[0].scenarios).toEqual({})
    expect(cwStatsValuesForTeam(readded, 'team-1', 'shin').buffChanges.hp).toBe('')
    expect(readded.characters.shin.hp).toBe(1000)
  })

  it('preserves stable team IDs and scenario ownership when teams are reordered', () => {
    const state = normalizeCwStatsState({
      version: 2,
      characters: {
        shin: { hp: '1000', atkMin: '100', atkMax: '200', def: '300', buffs: { hp: '0' } },
      },
      teams: [
        { id: 'team-7', slots: ['shin', null, null, null], scenarios: { shin: { buffChanges: { hp: '7' } } } },
        { id: 'team-3', slots: ['shin', null, null, null], scenarios: { shin: { buffChanges: { hp: '3' } } } },
      ],
    })
    const reordered = normalizeCwStatsState({ ...state, teams: [...state.teams].reverse() })

    expect(reordered.teams.map(team => team.id)).toEqual(['team-3', 'team-7'])
    expect(cwStatsValuesForTeam(reordered, 'team-3', 'shin').buffChanges.hp).toBe('3')
    expect(cwStatsValuesForTeam(reordered, 'team-7', 'shin').buffChanges.hp).toBe('7')
    expect(normalizeCwStatsState(JSON.parse(JSON.stringify(reordered)))).toEqual(reordered)
  })

  it('preserves equivalent derived calculations through v1 migration and v2 round trips', () => {
    const legacyCharacter = {
      hp: 1000,
      atkMin: 100,
      atkMax: 200,
      def: 300,
      buffs: { hp: 10, atk: 10, def: 10 },
      buffChanges: { hp: 5, atk: 10, def: 20 },
      baseBuffs: { hp: 15, atk: 2, def: 3 },
    }
    const legacy = {
      version: 1,
      characters: { shin: legacyCharacter },
      teams: [['shin', null, null, null], ['shin', null, null, null]],
    }
    const expectedProjected = projectedCwStats(legacyCharacter)
    const expectedPower = calculateCwPower(expectedProjected)
    const migrated = normalizeCwStatsState(legacy)
    const roundTripped = normalizeCwStatsState(JSON.parse(JSON.stringify(migrated)))

    expect(roundTripped).toEqual(migrated)
    for (const team of migrated.teams) {
      const values = cwStatsValuesForTeam(migrated, team.id, 'shin')
      expect(projectedCwStats(values)).toEqual(expectedProjected)
      expect(calculateCwPower(projectedCwStats(values))).toBe(expectedPower)
    }
  })

  it('reports the actual browser-storage write result without touching other keys', () => {
    const values = new Map([['unrelated', 'unchanged']])
    const storage = {
      getItem: vi.fn((key) => values.get(key) ?? null),
      setItem: vi.fn((key, value) => values.set(key, value)),
    }
    expect(writeStoredCwStats(createDefaultCwStatsState(), storage)).toBe(true)
    expect(JSON.parse(values.get('ranhq-cw-stats-v1'))).toEqual(createDefaultCwStatsState())
    expect(values.get('unrelated')).toBe('unchanged')

    storage.setItem.mockImplementation(() => { throw Error('quota') })
    expect(writeStoredCwStats({
      ...createDefaultCwStatsState(),
      teams: [{ id: 'team-1', slots: ['shin', null, null, null], scenarios: {} }],
    }, storage)).toBe(false)
    expect(values.get('unrelated')).toBe('unchanged')
  })
})
