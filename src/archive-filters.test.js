import { describe, expect, it } from 'vitest'
import { ALL, FACTIONS, filterCharactersByStateAndUnit } from './core.jsx'
import { ARCHIVE_EFFECT_LIMIT, archiveStateSearch, readArchiveUrlState } from './archive-url-state.js'
import { ARCHIVE_EFFECT_FILTER_IDS } from './archive-effect-filters.js'

const factions = FACTIONS.map(f => f.id)

describe('Archive unit-type, role and effect filters in the URL', () => {
  it('round-trips the filters alongside faction and search', () => {
    const state = { query: 'Moubu', faction: 'qin', unit: 'Cavalry', role: 'Leader', effects: ['sure-hit', 'guard'] }
    expect(archiveStateSearch(state)).toBe('?faction=qin&q=Moubu&unit=cavalry&role=leader&effect=sure-hit&effect=guard')
    expect(readArchiveUrlState(archiveStateSearch(state), factions)).toEqual(state)
  })

  it('writes effects in one canonical order, whatever order they were picked in', () => {
    const search = archiveStateSearch({ query: '', faction: 'all', effects: ['confusion', 'guard'] })
    expect(search).toBe('?faction=all&effect=guard&effect=confusion')
    expect(readArchiveUrlState('?faction=all&effect=confusion&effect=GUARD', factions).effects).toEqual(['guard', 'confusion'])
  })

  it('leaves existing faction-only links byte-for-byte unchanged', () => {
    expect(readArchiveUrlState('?faction=zhao', factions)).toEqual({ query: '', faction: 'zhao' })
    expect(archiveStateSearch({ query: '', faction: 'zhao' })).toBe('?faction=zhao')
  })

  it('ignores the retired rarity filter in old links', () => {
    expect(readArchiveUrlState('?faction=zhao&rarity=ur', factions)).toEqual({ query: '', faction: 'zhao' })
    expect(archiveStateSearch({ query: '', faction: 'zhao', rarity: 'UR' })).toBe('?faction=zhao')
  })

  it('fails unknown or repeated filter values closed', () => {
    const tooMany = ARCHIVE_EFFECT_FILTER_IDS.slice(0, ARCHIVE_EFFECT_LIMIT + 1).map(id => `effect=${id}`).join('&')
    for (const search of [
      '?unit=dragon', '?unit=cavalry&unit=archer',
      '?role=king', '?role=leader&role=strategist', '?role=__proto__',
      '?effect=dragon', '?effect=guard&effect=dragon', '?effect=guard&effect=guard', '?effect=__proto__', `?${tooMany}`,
    ]) expect(readArchiveUrlState(search, factions)).toEqual({ query: '', faction: 'all' })
  })
})

describe('picker state and unit-type chips', () => {
  it('narrows by state and unit type and leaves the list alone when no chip is set', () => {
    expect(filterCharactersByStateAndUnit(ALL)).toBe(ALL)
    const qinCavalry = filterCharactersByStateAndUnit(ALL, { state: 'qin', unit: 'Cavalry' })
    expect(qinCavalry.length).toBeGreaterThan(0)
    expect(qinCavalry.every(c => c.country === 'qin' && c.unit_type === 'Cavalry')).toBe(true)
  })
})
