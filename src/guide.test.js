import { describe, expect, it } from 'vitest'
import { SOUHA_LEADER_ROLES, GUIDE_SECTIONS, TERRAIN_EFFECTS } from './guide.jsx'
import { findCharByName } from './core.jsx'
import { readFileSync } from 'node:fs'

// The Guide route is deliberately split from core.jsx so /guide does not
// download the whole character dataset. Its small role-skill dataset must still
// stay pinned to the full character data consumed by Archive and Party Builder.
describe('guide leader/strategist roster', () => {
  const generals = SOUHA_LEADER_ROLES.flatMap(role =>
    role.generals.map(g => [role.id, g]),
  )

  it('lists both roles with five generals each', () => {
    expect(SOUHA_LEADER_ROLES.map(r => r.id)).toEqual(['leader', 'strategist'])
    for (const role of SOUHA_LEADER_ROLES) {
      expect(role.generals).toHaveLength(5)
    }
  })

  it.each(generals)('%s: %o matches the character data', (_roleId, general) => {
    const char = findCharByName(general.name)
    expect(char, `no character named ${general.name}`).toBeTruthy()
    // If a character's artwork is renamed, this fails instead of the guide
    // silently rendering a broken avatar.
    expect(general.icon).toBe(char.icon)
    expect(general.skillName).toBe(char.roleSkill?.name_en)
    expect(general.skillNameJp).toBe(char.roleSkill?.name_jp)
    expect(general.cwId).toBe(char.roleSkill?.cwId)
    expect(char.roleSkill?.type.toLowerCase()).toBe(_roleId)
  })
})

describe('guide sections', () => {
  it('has unique section ids and every section is categorised', () => {
    const ids = GUIDE_SECTIONS.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of GUIDE_SECTIONS) {
      expect(['Beginner', 'Advanced']).toContain(s.category)
      expect(s.label.length).toBeGreaterThan(0)
    }
  })

  it('keeps the terrain effect table intact', () => {
    expect(TERRAIN_EFFECTS.length).toBeGreaterThan(0)
    for (const t of TERRAIN_EFFECTS) {
      expect(t.icon).toMatch(/^\/icons\/terrain_effect\//)
      expect(t.effect.length).toBeGreaterThan(0)
    }
  })
})

// A localization refactor once reduced these English fallback arrays to a
// single bullet each while the ja/ar copy kept all four, silently dropping
// nine bullets of mechanics guidance from the default locale. Parity between
// the English fallback and every translation is now asserted directly against
// the source so the same regression cannot recur unnoticed.
describe('guide copy parity between English fallbacks and translations', () => {
  const source = readFileSync(new URL('./guide.jsx', import.meta.url), 'utf8')

  const guideCopyObject = () => {
    const start = source.indexOf('const GUIDE_COPY = {')
    const open = source.indexOf('{', start)
    let depth = 0
    let quote = null
    let escaped = false
    let i = open
    for (; i < source.length; i += 1) {
      const ch = source[i]
      if (quote) {
        if (escaped) escaped = false
        else if (ch === '\\') escaped = true
        else if (ch === quote) quote = null
        continue
      }
      if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue }
      if (ch === '{' || ch === '[' || ch === '(') depth += 1
      else if (ch === '}' || ch === ']' || ch === ')') {
        depth -= 1
        if (depth === 0) { i += 1; break }
      }
    }
    return (0, eval)(`(${source.slice(open, i)})`)
  }

  const englishFallbacks = () => {
    const calls = {}
    const re = /guideCopy\(\s*locale\s*,\s*'([^']+)'\s*,\s*/g
    let match
    while ((match = re.exec(source))) {
      let j = re.lastIndex
      let depth = 0
      let quote = null
      let escaped = false
      const start = j
      for (; j < source.length; j += 1) {
        const ch = source[j]
        if (quote) {
          if (escaped) escaped = false
          else if (ch === '\\') escaped = true
          else if (ch === quote) quote = null
          continue
        }
        if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue }
        if (ch === '(' || ch === '[' || ch === '{') depth += 1
        else if (ch === ')' || ch === ']' || ch === '}') {
          if (depth === 0 && ch === ')') break
          depth -= 1
        }
      }
        calls[match[1]] = (0, eval)(`(${source.slice(start, j).trim()})`)
    }
    return calls
  }

  const copy = guideCopyObject()
  const fallbacks = englishFallbacks()

  it('has an English fallback for every guideCopy call site', () => {
    expect(Object.keys(fallbacks).length).toBeGreaterThan(0)
    for (const [key, value] of Object.entries(fallbacks)) {
      expect(value, `English fallback for ${key}`).toBeTruthy()
    }
  })

  it.each(['ja', 'ar'])('keeps %s bullet lists the same length as English', locale => {
    for (const [key, english] of Object.entries(fallbacks)) {
      if (!Array.isArray(english)) continue
      const translated = copy[locale]?.[key]
      if (!Array.isArray(translated)) continue
      expect(translated.length, `${locale}.${key} bullet count`).toBe(english.length)
    }
  })

  it('still carries all four Core Loop bullets in English', () => {
    expect(fallbacks.coreLoopItems).toHaveLength(4)
    expect(fallbacks.dailyTimingItems).toHaveLength(4)
    expect(fallbacks.actionsItems).toHaveLength(4)
  })

  it('keeps HP Seal aligned with recovery nullification in Arabic', () => {
    expect(copy.ar.effects.items['HP Seal'].name).toBe('ختم استعادة الصحة')
  })
})
