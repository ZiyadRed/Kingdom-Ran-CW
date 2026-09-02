import { afterEach, describe, expect, it } from 'vitest'
import {
  BUILDER_SCHEMA_VERSION,
  BUILDER_STORAGE_KEY,
  createDefaultBuilderState,
  normalizeBuilderState,
  readBuilderState,
  reconcileBuilderState,
  writeBuilderState,
} from './builder-storage.js'

function stubStorage(initial = null) {
  const store = new Map()
  if (initial !== null) store.set(BUILDER_STORAGE_KEY, initial)
  global.window = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
    },
  }
  return store
}

afterEach(() => {
  delete global.window
})

describe('Party Builder persistence', () => {
  it('uses a namespaced, versioned four-slot schema', () => {
    expect(BUILDER_STORAGE_KEY).toBe('ranhq:party-builder')
    expect(createDefaultBuilderState()).toEqual({
      version: BUILDER_SCHEMA_VERSION,
      attack: [null, null, null, null],
      defense: [null, null, null, null],
      attackSkills: Array.from({ length: 4 }, () => ({ n: 3, s6: true, role: false })),
      defenseSkills: Array.from({ length: 4 }, () => ({ n: 3, s6: true, role: false })),
    })
  })

  it('recovers from missing, malformed, and incompatible storage', () => {
    expect(readBuilderState()).toEqual(createDefaultBuilderState())

    stubStorage('{not json')
    expect(readBuilderState()).toEqual(createDefaultBuilderState())

    stubStorage(JSON.stringify({ version: 99, attack: ['shin'] }))
    expect(readBuilderState()).toEqual(createDefaultBuilderState())
  })

  it('normalizes IDs, slot counts, duplicates, and skill masks', () => {
    expect(normalizeBuilderState({
      version: BUILDER_SCHEMA_VERSION,
      attack: [' shin ', 'shin', 12, 'ouki', 'ignored'],
      defense: ['tou'],
      attackSkills: [{ n: 9, s6: false, role: true }, { n: -2 }, null, { n: '2' }],
    })).toEqual({
      version: BUILDER_SCHEMA_VERSION,
      attack: ['shin', null, null, 'ouki'],
      defense: ['tou', null, null, null],
      attackSkills: [
        { n: 3, s6: false, role: true },
        { n: 0, s6: true, role: false },
        { n: 3, s6: true, role: false },
        { n: 2, s6: true, role: false },
      ],
      defenseSkills: Array.from({ length: 4 }, () => ({ n: 3, s6: true, role: false })),
    })
  })

  it('drops deleted characters and impossible duplicate role assignments', () => {
    const state = {
      version: BUILDER_SCHEMA_VERSION,
      attack: ['leader-a', 'deleted', 'leader-b', 'strategist'],
      defense: ['leader-b', null, null, null],
      attackSkills: Array.from({ length: 4 }, () => ({ n: 2, s6: false, role: true })),
      defenseSkills: Array.from({ length: 4 }, () => ({ n: 1, s6: true, role: true })),
    }
    const characters = [
      { id: 'leader-a', roleSkill: { type: 'Leader' } },
      { id: 'leader-b', roleSkill: { type: 'Leader' } },
      { id: 'strategist', roleSkill: { type: 'Strategist' } },
    ]
    const result = reconcileBuilderState(state, characters)
    expect(result.attack).toEqual(['leader-a', null, 'leader-b', 'strategist'])
    expect(result.attackSkills.map((mask) => mask.role)).toEqual([true, false, false, true])
    expect(result.defenseSkills[0].role).toBe(true)
    expect(result.attackSkills[1]).toEqual({ n: 3, s6: true, role: false })
  })

  it('avoids redundant writes and degrades safely when storage throws', () => {
    const store = stubStorage()
    const state = createDefaultBuilderState()
    expect(writeBuilderState(state)).toBe(true)
    const first = store.get(BUILDER_STORAGE_KEY)
    expect(writeBuilderState(state)).toBe(true)
    expect(store.get(BUILDER_STORAGE_KEY)).toBe(first)

    global.window.localStorage.getItem = () => { throw new Error('blocked') }
    expect(readBuilderState()).toEqual(createDefaultBuilderState())
    expect(writeBuilderState(state)).toBe(false)
  })
})
