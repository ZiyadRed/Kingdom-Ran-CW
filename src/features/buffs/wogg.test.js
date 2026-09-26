import { describe, expect, it } from 'vitest'
import { ALL } from '../../core.jsx'
import { localizedCharacterName, matchesCharacterName } from '../../i18n/ar-character-names.js'
import { localizedCharacter } from '../../i18n/data.js'
import { WOGG_BUFF_SOURCES } from './data.js'

describe('WoGG buff sources', () => {
  it('joins the three added tier A buffs by game character ID across locales', () => {
    const expected = new Map([[113, 'Gekishin'], [181, 'Reiou'], [125, 'Keibin']])
    for (const [characterId, name] of expected) {
      const source = WOGG_BUFF_SOURCES.find(entry => entry.characterId === characterId)
      const character = ALL.find(entry => entry.source?.characterId === characterId)
      expect(source).toMatchObject({ characterId, name, tier: 'A', icon: `/icons/${name}.webp` })
      expect(character.name_en).toBe(name)
      for (const locale of ['en', 'ja', 'ar', 'fr']) {
        const displayName = localizedCharacter(character, locale).displayName
        expect(displayName).toBeTruthy()
        expect(matchesCharacterName(character, displayName)).toBe(true)
      }
      expect(matchesCharacterName(character, localizedCharacterName(name, 'ar'))).toBe(true)
    }
  })
})
