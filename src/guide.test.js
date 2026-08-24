import { describe, expect, it } from 'vitest'
import { SOUHA_LEADER_ROLES, GUIDE_SECTIONS, TERRAIN_EFFECTS } from './guide.jsx'
import { findCharByName } from './core.jsx'

// The Guide route is deliberately split from core.jsx so /guide does not
// download the whole character dataset. That means SOUHA_LEADER_ROLES carries
// its own icon paths instead of resolving them through findCharByName, so the
// paths have to be pinned against the real character data here.
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
