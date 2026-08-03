import { describe, expect, it } from 'vitest'
import {
  calculateCwPower,
  createDefaultCwStatsState,
  displayedCwStats,
  normalizeCwStatsState,
  projectedCwStats,
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

  it('treats blank or non-numeric inputs as zero without producing NaN', () => {
    expect(calculateCwPower({ hp: '', atkMin: 'not a number', atkMax: '', def: '' })).toBe(0)
  })
})

describe('CW Stats calculator saved state', () => {
  it('starts with one four-slot team', () => {
    expect(createDefaultCwStatsState()).toEqual({
      version: 1,
      characters: {},
      teams: [[null, null, null, null]],
    })
  })

  it('normalizes saved teams to four slots and caps them at five', () => {
    const raw = {
      characters: { shin: { hp: 100, buffs: { atk: 5 } } },
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
    expect(normalized.teams[0]).toEqual(['shin', 'ouki', 'ouhon', 'tou'])
    expect(normalized.teams[1]).toEqual(['hakuki', null, null, null])
    expect(normalized.characters.shin).toEqual({
      hp: 100,
      atkMin: '',
      atkMax: '',
      def: '',
      buffs: { hp: '', atk: 5, def: '' },
      buffChanges: { hp: '', atk: '', def: '' },
    })
  })
})
