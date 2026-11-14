import { describe, expect, it } from 'vitest'
import cwBuffsData from '../../../data/cw_buffs.json'
import cwTeamBuffs from '../../../data/cw_team_buffs.json'
import { buffSourceId, normalizeProgress } from '../../core.jsx'
import { BUFF_ARMIES, BUFF_SIEGE, BUFF_STATES, BUFF_UNIT_CATS, buffSourceDisplayValue, sortBuffSourcesByValue } from './data.js'

const STATS = ['HP', 'Attack', 'Defense']
const lists = [
  ...BUFF_UNIT_CATS.flatMap(key => STATS.map(stat => ['unit', key, stat, cwBuffsData[key]?.[stat] || []])),
  ...BUFF_STATES.flatMap(key => STATS.map(stat => ['state', key, stat, cwTeamBuffs.states?.[key]?.[stat] || []])),
  ...BUFF_ARMIES.flatMap(key => STATS.map(stat => ['army', key, stat, cwTeamBuffs.armies?.[key]?.[stat] || []])),
  ...BUFF_SIEGE.flatMap(key => STATS.map(stat => ['siege', key, stat, cwTeamBuffs.siege?.[key]?.[stat] || []])),
].filter(([, , , entries]) => entries.length)

describe('Buff Tracker value order', () => {
  it('shows each list highest buff first and keeps ties in authored order', () => {
    for (const [, , , entries] of lists) {
      const sorted = sortBuffSourcesByValue(entries)
      const values = sorted.map(buffSourceDisplayValue)
      expect(values).toEqual([...values].sort((a, b) => b - a))
      for (let i = 1; i < sorted.length; i++) {
        if (values[i] === values[i - 1]) expect(entries.indexOf(sorted[i])).toBeGreaterThan(entries.indexOf(sorted[i - 1]))
      }
    }
  })

  it('does not reorder the data files themselves', () => {
    const before = JSON.stringify(cwTeamBuffs.states.Zhao.Attack)
    sortBuffSourcesByValue(cwTeamBuffs.states.Zhao.Attack)
    expect(JSON.stringify(cwTeamBuffs.states.Zhao.Attack)).toBe(before)
  })

  it('keeps owned toggles saved before the change pointing at the same sources', () => {
    // A visitor's saved progress, recorded with the old (authored) display
    // order: every source id plus every independent shard toggle.
    const saved = {}
    const sourceById = new Map()
    for (const [kind, key, stat, entries] of lists) {
      entries.forEach((entry, index) => {
        const id = buffSourceId(kind, key, stat, entry, index)
        saved[id] = true
        if (entry.shard_bonus) saved[`${id}:shard`] = true
        sourceById.set(id, entry)
      })
    }
    const restored = normalizeProgress({ buffSources: saved }).buffSources
    expect(restored).toEqual(saved)

    // After the change, the rendered rows (new order, new positions) resolve
    // to exactly the same ids, and each id still names the same entry.
    const rendered = new Set()
    for (const [kind, key, stat, entries] of lists) {
      sortBuffSourcesByValue(entries).forEach((entry, displayIndex) => {
        const id = buffSourceId(kind, key, stat, entry, displayIndex)
        expect(restored[id]).toBe(true)
        expect(sourceById.get(id)).toBe(entry)
        if (entry.shard_bonus) expect(restored[`${id}:shard`]).toBe(true)
        rendered.add(id)
      })
    }
    expect(rendered).toEqual(new Set(sourceById.keys()))
  })
})
