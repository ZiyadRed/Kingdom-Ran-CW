import { describe, expect, it } from 'vitest'
import glossary from '../../data/glossary/localization_terms.json'

const terms = new Map(glossary.terms.map(term => [term.key, term]))

describe('official Japanese terminology glossary', () => {
  it('keeps similarly colored crystals and role stones as distinct items', () => {
    expect(terms.get('red_crystal').japanese).toBe('赤の結晶')
    expect(terms.get('blue_crystal').japanese).toBe('青の結晶')
    expect(terms.get('hi_shin_unit_unlock_stone').japanese).toBe('専用争覇解放石(飛信隊)')
    expect(terms.get('leader_unlock_stone').japanese).toBe('争覇総大将解放石')
    expect(terms.get('strategist_unlock_stone').japanese).toBe('争覇軍師解放石')
  })

  it('records current official evidence for every terminology correction', () => {
    for (const key of [
      'skill', 'leader_skill', 'strategist_skill', 'leader_unlock_stone',
      'strategist_unlock_stone', 'hi_shin_unit_unlock_stone', 'red_crystal',
      'blue_crystal', 'scene_card', 'castle_points', 'cumulative_castle_points',
      'attacking_side', 'defending_side', 'strategist_defeat_penalty',
    ]) expect(terms.get(key)?.evidence, key).toMatch(/^https:\/\/www\.kingdomran\.jp\//)
  })

  it('does not collapse the new strategist penalty into the ordinary source status', () => {
    expect(terms.get('strategist_defeat_penalty').japanese).toBe('混乱')
    expect(terms.get('confusion').japanese).toBe('錯乱')
  })
})
