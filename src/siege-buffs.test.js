import { describe, expect, it } from 'vitest'
import teamBuffs from '../data/cw_team_buffs.json'
import { ALL } from './core.jsx'
import { BUFF_SIEGE, SIEGE_META } from './pages.jsx'
import { matchesCharacterName } from './i18n/ar-character-names.js'
import { renderArabicText } from './i18n/ar-render.js'
import { renderJapaneseText } from './i18n/ja-render.js'

/**
 * Siege-weapon buffs on the Buff Tracker.
 *
 * The category is derived, not curated: every entry must fall straight out of
 * the character skill data. That makes the guard scale — a new general with a
 * siege buff fails here until `data/cw_team_buffs.json` is regenerated, and no
 * invented entry can survive.
 *
 * Assertions are properties of the data present, never fixed counts
 * (docs/CONTENT_INTEGRATION_RULES.md §14).
 */

// The one rule that defines the category. Three English wordings of the same
// Japanese condition exist in the source, so the condition is not matched on.
const TARGETS = {
  'Ally attack [Siege Weapon]': 'Attack Siege Weapons',
  'Ally defense [Siege Weapon]': 'Defense Siege Weapons',
}
const STATS = { 'Max HP': 'HP', ATK: 'Attack', DEF: 'Defense' }
const EFFECT = /^(Max HP|ATK|DEF) Up ([\d.]+)%$/

function deriveFromCharacters() {
  const out = {}
  for (const character of ALL) {
    for (const skill of character.skills || []) {
      if (skill.type !== 'Internal Affairs') continue
      for (const effect of skill.effects || []) {
        const category = TARGETS[effect.target]
        if (!category) continue
        const match = EFFECT.exec(effect.effect || '')
        expect(match, `unmodelled siege effect on ${character.name_en}: ${effect.effect}`).toBeTruthy()
        const stat = STATS[match[1]]
        out[category] ??= {}
        out[category][stat] ??= []
        out[category][stat].push({
          name: character.name_en,
          name_jp: character.name_jp,
          faction: character.country,
          type: character.rarity,
          star6: Boolean(skill.star6),
          value: Number(match[2]),
        })
      }
    }
  }
  for (const category of Object.values(out))
    for (const rows of Object.values(category))
      rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
  return out
}

const siege = teamBuffs.siege

describe('siege-weapon buffs', () => {
  it('matches what the character data actually grants', () => {
    expect(siege).toEqual(deriveFromCharacters())
  })

  it('covers every category the page renders, with all three stats', () => {
    expect(Object.keys(siege).sort()).toEqual([...BUFF_SIEGE].sort())
    for (const key of BUFF_SIEGE) {
      expect(Object.keys(siege[key]).sort()).toEqual(['Attack', 'Defense', 'HP'])
      expect(Object.values(siege[key]).flat().length).toBeGreaterThan(0)
      expect(SIEGE_META[key]?.icon).toMatch(/^\/icons\/.+\.webp$/)
      expect(SIEGE_META[key]?.color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('names a real character in every entry, findable in all three scripts', () => {
    for (const entry of Object.values(siege).flatMap(c => Object.values(c).flat())) {
      const character = ALL.find(c => c.name_jp === entry.name_jp)
      expect(character, `no character for ${entry.name}`).toBeTruthy()
      expect(entry.name).toBe(character.name_en)
      expect(entry.faction).toBe(character.country)
      expect(entry.value).toBeGreaterThan(0)
      for (const query of [character.name_en, character.name_jp])
        expect(matchesCharacterName(character, query), `${entry.name} not findable by ${query}`).toBe(true)
    }
  })

  it('localizes both category names away from English', () => {
    for (const key of BUFF_SIEGE) {
      const ar = renderArabicText(key)
      const ja = renderJapaneseText(key)
      expect(ar).not.toBe(key)
      expect(ja).not.toBe(key)
      expect(ar).toMatch(/^[؀-ۿ\s]+$/)
      expect(ja).toMatch(/^[぀-ヿ一-鿿]+$/)
    }
  })
})
