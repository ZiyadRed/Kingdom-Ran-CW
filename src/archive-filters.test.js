import { describe, expect, it } from 'vitest'
import { ALL, FACTIONS, filterCharactersByStateAndUnit } from './core.jsx'
import { archiveStateSearch, readArchiveUrlState } from './archive-url-state.js'

const factions = FACTIONS.map(f => f.id)

describe('Archive unit-type and rarity filters in the URL', () => {
  it('round-trips the filters alongside faction and search', () => {
    const state = { query: 'Moubu', faction: 'qin', unit: 'Cavalry', rarity: 'UR' }
    expect(archiveStateSearch(state)).toBe('?faction=qin&q=Moubu&unit=cavalry&rarity=ur')
    expect(readArchiveUrlState(archiveStateSearch(state), factions)).toEqual(state)
  })

  it('leaves existing faction-only links byte-for-byte unchanged', () => {
    expect(readArchiveUrlState('?faction=zhao', factions)).toEqual({ query: '', faction: 'zhao' })
    expect(archiveStateSearch({ query: '', faction: 'zhao' })).toBe('?faction=zhao')
  })

  it('fails unknown or repeated filter values closed', () => {
    for (const search of ['?unit=dragon', '?unit=cavalry&unit=archer', '?rarity=ssr', '?rarity=__proto__'])
      expect(readArchiveUrlState(search, factions)).toEqual({ query: '', faction: 'all' })
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
