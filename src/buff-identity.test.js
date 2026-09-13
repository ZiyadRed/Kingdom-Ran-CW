import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import unitBuffs from '../data/cw_buffs.json'
import sceneCardBuffs from '../data/scene_card_cw_buffs.json'
import characterSourceMap from '../data/source/characters.map.json'
import classification from '../data/character_classification.json'
import { resolveRegularBuffCharacter } from './buff-identity.js'
import { ALL, CHAR_BY_ID, buffSourceId, findCharByName, normalizeProgress, redCrystalBuffUnlockCost } from './core.jsx'

const rows = Object.entries(unitBuffs).flatMap(([unit, stats]) =>
  Object.entries(stats).flatMap(([stat, entries]) => entries.map((entry, index) => ({ unit, stat, entry, index }))),
)
const kou = unitBuffs.Archer.Attack.find(entry => entry.name_jp === '向' && entry.value === 12.4)

describe('regular Buff Tracker character identity', () => {
  it('keeps the September 11 F03 Kou source attached to canonical kou', () => {
    expect(kou).toMatchObject({
      character_id: 'kou',
      name: 'Kou',
      name_jp: '向',
      type: 'UR',
      value: 12.4,
      ownership_id: 'buff_fbc9ed824fb448a588cd091db0027196',
    })
    expect(findCharByName('Kou').id).toBe('kou2') // The old name-first join reproduced F03.
    const character = resolveRegularBuffCharacter(kou, CHAR_BY_ID, ALL)
    expect(character).toMatchObject({ id: 'kou', name_jp: '向', icon: '/icons/Kou.webp', source: { characterId: 132 } })
    expect(character.id).not.toBe('kou2')
    expect(character.icon).not.toBe('/icons/Kou2.webp')
    expect(redCrystalBuffUnlockCost(kou, 'unit', 'Archer', 'Attack')).toBe(1750)
  })

  it('checks every regular unit source against the character provenance and preserves the entire gameplay payload', () => {
    expect(rows).toHaveLength(117)
    const categories = { EXACT_STABLE_MATCH: 0, DISPLAY_NAME_ONLY_BUT_UNAMBIGUOUS: 0, COLLISION_FIXED_BY_STABLE_ID: 0, CONFLICT: 0, UNKNOWN_FAIL_CLOSED: 0 }
    for (const { unit, stat, entry, index } of rows) {
      const character = resolveRegularBuffCharacter(entry, CHAR_BY_ID, ALL)
      expect(character, `${unit}/${stat}/${entry.name_jp}`).not.toBeNull()
      const mapped = characterSourceMap.characters[entry.character_id]
      expect(['exact', 'resolved']).toContain(mapped.status)
      expect(mapped.characterId).toBe(character.source.characterId)
      expect(mapped.generalIds).toEqual(character.source.generalIds)
      expect(classification[character.id].unit_type).toBe(unit)
      expect(character.rarity).toBe(entry.type)
      expect(buffSourceId('unit', unit, stat, entry, index)).toBe(entry.ownership_id)

      const candidates = ALL.filter(candidate => candidate.name_en?.toLowerCase() === entry.name.toLowerCase())
      const oldWinner = findCharByName(entry.name)
      if (candidates.length > 1) {
        expect(entry.name).toBe('Kou')
        expect(candidates.map(candidate => candidate.id).sort()).toEqual(['kou', 'kou2'])
        expect(oldWinner.id).toBe('kou2')
        categories.COLLISION_FIXED_BY_STABLE_ID++
      } else {
        expect(oldWinner?.id, `${unit}/${stat}/${entry.name}`).toBe(character.id)
        categories.EXACT_STABLE_MATCH++
      }
    }
    expect(categories).toEqual({ EXACT_STABLE_MATCH: 116, DISPLAY_NAME_ONLY_BUT_UNAMBIGUOUS: 0, COLLISION_FIXED_BY_STABLE_ID: 1, CONFLICT: 0, UNKNOWN_FAIL_CLOSED: 0 })
    const gameplayOnly = structuredClone(unitBuffs)
    for (const stats of Object.values(gameplayOnly)) for (const entries of Object.values(stats)) for (const entry of entries) delete entry.character_id
    expect(createHash('sha256').update(JSON.stringify(gameplayOnly)).digest('hex'))
      .toBe('ba142f5f3bfebe86183fb5f271bbd3106978f28430a108c62e5d65a9b1fbf267')
  })

  it('is independent of candidate order, locale and the display spelling', () => {
    expect(resolveRegularBuffCharacter(kou, CHAR_BY_ID, [...ALL].reverse()).id).toBe('kou')
    for (const locale of ['en', 'ja', 'ar', 'fr']) {
      const presentation = { ...kou, display_name: `${locale}-translation` }
      expect(resolveRegularBuffCharacter(presentation, CHAR_BY_ID, ALL).id).toBe('kou')
    }
    expect(resolveRegularBuffCharacter({ ...kou, name: 'historical Kou spelling' }, CHAR_BY_ID, ALL).id).toBe('kou')
  })

  it('fails closed on missing, unknown or contradictory identity evidence', () => {
    for (const conflicting of [
      { character_id: undefined }, { character_id: 'unknown' }, { character_id: 'kou2' },
      { name_jp: '昂' }, { name: 'Shin' }, { type: 'N' }, { faction: 'zhao' },
    ]) expect(resolveRegularBuffCharacter({ ...kou, ...conflicting }, CHAR_BY_ID, ALL)).toBeNull()
    expect(resolveRegularBuffCharacter({ name: 'Kou', name_jp: '向' }, CHAR_BY_ID, ALL)).toBeNull()
  })

  it('does not reinterpret ownership/progress when metadata is joined', () => {
    const id = buffSourceId('unit', 'Archer', 'Attack', kou, 1)
    const progress = { buffSources: { [id]: true, 'unrelated:opaque': true } }
    expect(id).toBe('buff_fbc9ed824fb448a588cd091db0027196')
    expect(normalizeProgress(progress).buffSources).toEqual(progress.buffSources)
  })
})

describe('Scene Card Buff Tracker character identity', () => {
  it('pins every Japanese owner label to a stable source-backed character id', () => {
    expect(sceneCardBuffs.cards).toHaveLength(23)
    for (const card of sceneCardBuffs.cards) {
      const character = CHAR_BY_ID[card.ownerId]
      expect(character, `unknown ownerId on scene card ${card.id}`).toBeTruthy()
      expect(character.name_en, `English owner mismatch on scene card ${card.id}`).toBe(card.ownerName)
      expect(character.name_jp, `Japanese owner mismatch on scene card ${card.id}`).toBe(card.ownerNameJp)
      expect(character.source?.characterId, `missing source characterId on scene card ${card.id}`).toBeTypeOf('number')
    }
  })
})
