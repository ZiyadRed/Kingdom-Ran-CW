import { describe, it, expect } from 'vitest'
import { ALL } from './core.jsx'
import { sharedDisplayNames } from './pages.jsx'
import { localizedCharacter } from './i18n/data.js'

describe('Archive name disambiguation', () => {
  it('flags only display names used by more than one general', () => {
    const shared = sharedDisplayNames([
      { displayName: 'Kou' }, { displayName: 'Kou' }, { displayName: 'Shin' }, { displayName: '' },
    ])
    expect([...shared]).toEqual(['Kou'])
  })

  it('every shared roster name has an original name to tell the generals apart', () => {
    for (const code of ['en', 'ja', 'ar', 'fr']) {
      const roster = ALL.map(character => localizedCharacter(character, code))
      const shared = sharedDisplayNames(roster)
      for (const name of shared) {
        const labels = roster
          .filter(character => character.displayName === name)
          .map(character => character.displaySecondaryName || character.name_jp)
        expect(labels.every(Boolean), `${code}:${name}`).toBe(true)
        expect(new Set(labels).size, `${code}:${name}`).toBe(labels.length)
      }
    }
  })
})
