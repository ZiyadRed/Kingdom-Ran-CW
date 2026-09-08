import { describe, expect, it } from 'vitest'
import { ALL, CHAR_GROUPS, matchCharacterSearch, searchCharacters } from '../core.jsx'
import { matchesCharacterName, LEGACY_CHARACTER_NAME_ALIASES, AR_CHARACTER_NAMES } from './ar-character-names.js'
import { characterContentMatch, normalizeContentSearch } from './character-search.js'

const matches = (query, locale) => ALL.filter(character => matchCharacterSearch(character, query, locale)).map(character => character.id)
const skills = character => [...(character.skills || []), ...(character.roleSkill ? [character.roleSkill] : [])]

describe('localized content search over the actual roster', () => {
  it.each(['en', 'ja', 'ar', 'fr'])('preserves tri-script names on %s', locale => {
    for (const query of ['Moubu', '蒙武', 'موبو','مُوبُو','مـوبـو']) {
      expect(matches(query, locale)).toContain('moubu')
      expect(matchesCharacterName(ALL.find(c=>c.id==='moubu'),query,{exact:true})).toBe(true)
    }
  })
  it('maps authored French infantry forms to the same complete result population',()=>{
    const expected=matches('infanterie','fr')
    expect(expected.length).toBeGreaterThan(0)
    expect(matches('fantassin','fr')).toEqual(expected)
    expect(matches('fantassins','fr')).toEqual(expected)
  })
  // This exhaustive corpus check sorts the full roster for three names per
  // general. Its timeout is a runner guard, not a search latency assertion.
  it.each(['en', 'ja', 'ar', 'fr'])('keeps every tri-script general reachable before the picker result limit on %s', locale => {
    for (const character of ALL) for (const query of [character.name_en, character.name_jp, AR_CHARACTER_NAMES[character.name_en]]) {
      const results = searchCharacters(ALL, query, locale)
      expect(results.slice(0,24).map(c=>c.id), query).toContain(character.id)
      expect(matchesCharacterName(results[0], query), query).toBe(true)
    }
  }, 15_000)
  it('keeps existing hidden group phrases searchable', () => {
    for (const [tag,ids] of Object.entries(CHAR_GROUPS)) {
      const expected = ALL.filter(c=>ids.includes(c.id)).map(c=>c.id)
      expect(matches(`${tag} team`, 'en')).toEqual(expect.arrayContaining(expected))
    }
  })
  it('keeps corrected aliases case insensitive and trimmed', () => {
    for (const locale of ['en','ja','ar','fr']) expect(matches(' JIOU ', locale)).toEqual(matches('Jiou', locale))
  })
  it.each(Object.entries(LEGACY_CHARACTER_NAME_ALIASES))('keeps the exact corrected alias %s exclusive to %s', (legacy, canonical) => {
    for (const query of [legacy, canonical]) for (const locale of ['en', 'ja', 'ar', 'fr']) {
      expect(matches(query, locale)).toEqual(ALL.filter(character => matchesCharacterName(character, query)).map(character => character.id))
    }
  })
  it.each([['ar', 'سم'], ['ja', '毒'], ['fr', 'Poison'], ['en', 'Poison']])('finds actual poison effects in %s using %s', (locale, query) => {
    const poison = ALL.filter(character => skills(character).some(skill => skill.effects?.some(effect => /poison/i.test(effect.effect || ''))))
    expect(poison.length).toBeGreaterThan(1)
    expect(matches(query, locale)).toEqual(expect.arrayContaining(poison.map(character => character.id)))
  })
  it.each([['ar', 'المشاة'], ['ar', 'مشاة'], ['ja', '歩兵'], ['fr', 'Fantassins'], ['fr', 'Infanterie'], ['en', 'Infantry']])('finds the existing infantry roster in %s using %s', (locale, query) => {
    const infantry = ALL.filter(character => character.unit_type === 'Infantry')
    expect(infantry.length).toBeGreaterThan(1)
    expect(matches(query, locale)).toEqual(expect.arrayContaining(infantry.map(character => character.id)))
  })
  it('finds French defense regardless of case or accents, including original English matches', () => {
    const withAccent = matches('DÉFENSE', 'fr')
    expect(withAccent.length).toBeGreaterThan(1)
    expect(withAccent).toEqual(matches('defense', 'fr'))
    const original = ALL.filter(character => skills(character).some(skill => skill.effects?.some(effect => /defense/i.test(effect.effect || ''))))
    expect(withAccent).toEqual(expect.arrayContaining(original.map(character => character.id)))
  })
  it('uses the French infantry synonym in skill terms as well as the unit badge', () => {
    expect(matches('Infanterie', 'fr')).toEqual(expect.arrayContaining(matches('Infantry', 'fr')))
    expect(matches('Infanterie', 'fr')).toEqual(expect.arrayContaining(matches('fantassins', 'fr')))
  })
  it('does not discard Japanese dakuten while folding Latin accents and Arabic vowel marks', () => {
    expect(normalizeContentSearch('DÉFENSE')).toBe('defense')
    expect(normalizeContentSearch('السَّم')).toBe(normalizeContentSearch('السم'))
    expect(normalizeContentSearch('が')).toBe(normalizeContentSearch('か\u3099'))
    expect(normalizeContentSearch('が')).not.toBe(normalizeContentSearch('か'))
  })
  it('uses the selected locale and does not reuse stale fields for a new object with the same ID', () => {
    const character = ALL.find(character => character.unit_type === 'Infantry')
    expect(characterContentMatch(character, 'infanterie', 'en')).toBeNull()
    expect(characterContentMatch(character, 'infanterie', 'fr')).not.toBeNull()
    const renamedUnit = { ...character, unit_type: 'Archer', groups: [], skills: [], roleSkill: null }
    expect(characterContentMatch(renamedUnit, 'infanterie', 'fr')).toBeNull()
  })
  it('handles empty and absent content queries without building a record or losing results', () => {
    expect(characterContentMatch(null, '  ', 'fr')).toEqual({ hint: null })
    expect(matches('zzzz-no-such-general-or-effect', 'ar')).toEqual([])
  })
})
