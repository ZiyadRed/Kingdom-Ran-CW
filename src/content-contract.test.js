import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ALL } from './core.jsx'
import { AR_CHARACTER_NAMES, matchesCharacterName } from './i18n/ar-character-names.js'

/**
 * The New Character / CW Card Integration Contract, enforced.
 * See docs/CONTENT_INTEGRATION_RULES.md.
 *
 * Every assertion here is a PROPERTY of whatever data is present, never a
 * fixed count — adding character 209 must fail only if that character is
 * incomplete, not merely because it exists.
 */

const sourceMap = JSON.parse(
  readFileSync(join(process.cwd(), 'data/source/characters.map.json'), 'utf8'),
).characters

describe('new-content contract: every character is complete', () => {
  it('keeps Toujou scoped to the three officially announced CW skills', () => {
    const character = ALL.find((c) => c.id === 'toujouou')
    expect(character?.name_en).toBe('Toujou')
    expect(character?.name_jp).toBe('悼襄王')
    expect(AR_CHARACTER_NAMES[character?.name_en]).toBe('توجو')
    expect(matchesCharacterName(character, 'Toujouou', { exact: true })).toBe(true)
    expect(character?.source).toEqual({ characterId: 223, generalIds: [428, 429] })
    expect(character?.country).toBe('zhao')
    expect(character?.unit_type).toBe('Infantry')
    expect(character?.groups).toEqual([])
    expect(character?.skills.map((skill) => skill.name_jp)).toEqual([
      '急所攻撃【赤牛】', '唯我独尊', '防御力強化・特大改【歩兵】',
    ])
  })

  it('has the three locale names it needs', () => {
    const incomplete = ALL.filter((c) => !c.name_en || !c.name_jp || !AR_CHARACTER_NAMES[c.name_en])
    expect(incomplete.map((c) => `${c.id}: en=${!!c.name_en} jp=${!!c.name_jp} ar=${!!AR_CHARACTER_NAMES[c.name_en]}`))
      .toEqual([])
  })

  it('is findable by Romaji, Japanese and Arabic', () => {
    const unfindable = []
    for (const c of ALL) {
      for (const [label, query] of [
        ['romaji', c.name_en],
        ['japanese', c.name_jp],
        ['arabic', AR_CHARACTER_NAMES[c.name_en]],
      ]) {
        if (!query) continue
        if (!matchesCharacterName(c, query)) unfindable.push(`${c.id} by ${label} (${query})`)
      }
    }
    expect(unfindable).toEqual([])
  })

  it('carries a stable source identity, not a positional guess', () => {
    const missing = ALL.filter((c) => !sourceMap[c.id] || sourceMap[c.id].characterId == null)
    expect(missing.map((c) => c.id)).toEqual([])
  })

  it('keeps ids unique, so nothing resolves by display name alone', () => {
    const ids = ALL.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
