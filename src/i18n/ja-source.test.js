import { describe, expect, it } from 'vitest'
import { ENTITY_NAMES, hasUnresolvedPlaceholder, resolveJapaneseEntities } from './ja-source.js'
import jaSkills from '../../data/generated/ja/skills.json'
import sourceIndex from '../../data/generated/source_index.json'
import { localizedSkill } from './data.js'

/**
 * Original Japanese skill descriptions reference other generals with a
 * 「{-N:characterId}」 token. Shipping that token to readers was the audit's
 * highest-severity Japanese defect (JA-001).
 */

describe('Japanese entity placeholders', () => {
  it('resolves a reference to the general the English data names', () => {
    // Soutan's 十弓相伝【淡】 is conditional on ally Soujin (蒼仁).
    const source = jaSkills.skills['862']
    expect(source.desc).toContain('{-1:261}')
    const resolved = resolveJapaneseEntities(source.desc)
    expect(resolved).toContain('味方「蒼仁」')
    expect(resolved).not.toContain('{-1:261}')
  })

  it('resolves through the row id, not the characterId', () => {
    // MsgUnitGeneralName is indexed by mstUnitGenerals.id. Indexing it directly
    // by characterId returns a different, plausible-looking general — 傅抵 for
    // 261 instead of 蒼仁 — and nothing for characters added after that table
    // and the id space diverged.
    expect(ENTITY_NAMES['261']).toBe('蒼仁')
    expect(ENTITY_NAMES['261']).not.toBe('傅抵')
    expect(ENTITY_NAMES['258']).toBe('蒼淡')
    expect(ENTITY_NAMES['148']).toBe('媧燐')
    expect(ENTITY_NAMES['255']).toBe('麻鉱')
  })

  it('leaves an unknown reference visible instead of guessing or deleting it', () => {
    const unknown = '味方「{-1:999999}」が生存している場合'
    expect(resolveJapaneseEntities(unknown)).toBe(unknown)
    expect(hasUnresolvedPlaceholder(resolveJapaneseEntities(unknown))).toBe(true)
  })

  it('handles several references in one description', () => {
    // Kisui's 離眼の絆【心】 names two allies.
    const source = jaSkills.skills['521']
    const resolved = resolveJapaneseEntities(source.desc)
    expect(hasUnresolvedPlaceholder(resolved)).toBe(false)
    expect(resolved).toMatch(/味方「.+」/)
  })

  it('passes non-placeholder text through untouched', () => {
    const plain = '防御力が最も高い敵武将1名に150%のダメージを与える。'
    expect(resolveJapaneseEntities(plain)).toBe(plain)
    expect(resolveJapaneseEntities('')).toBe('')
    expect(resolveJapaneseEntities(null)).toBe(null)
  })

  it('leaves no raw token in any shipped Japanese skill description', () => {
    const offenders = []
    for (const [skillId, skill] of Object.entries(jaSkills.skills)) {
      if (hasUnresolvedPlaceholder(resolveJapaneseEntities(skill.desc))) {
        offenders.push(`${skillId} ${skill.name}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('resolves the description the Japanese UI actually renders', () => {
    // Goes through the same path the skill card uses, not just the helper.
    const rows = Object.entries(sourceIndex.skills).filter(([, row]) => row.skillId != null)
    let checked = 0
    for (const [key, row] of rows) {
      const source = jaSkills.skills[String(row.skillId)]
      if (!source || !hasUnresolvedPlaceholder(source.desc)) continue
      const [characterId, index] = key.split('#')
      const skill = localizedSkill({ name_en: 'x', effects: [] }, characterId, Number(index), 'ja')
      expect(skill.descriptionJp, key).toBeTruthy()
      expect(hasUnresolvedPlaceholder(skill.descriptionJp), key).toBe(false)
      checked += 1
    }
    // The audit counted 105 affected project rows; assert the class is covered
    // rather than pinning an exact number that legitimately moves with data.
    expect(checked).toBeGreaterThan(90)
  })
})
