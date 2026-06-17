import { describe, it, expect } from 'vitest'
import { parseBuffEffect, simulate, ALL, META_TEAMS, findCharByName, calcCwStats, isTargetedBy, normalizeEnemyTarget, calcCharBuffs, calcTeamEnemyDebuffs } from './core.jsx'

// The buff-text parser is the most intricate pure function in the engine.
// These lock its behaviour against the documented terminology + formats.
describe('parseBuffEffect', () => {
  const stat = (s) => parseBuffEffect(s).map(({ stat, dir, val }) => ({ stat, dir, val }))

  it('parses simple stat up/down with percent', () => {
    expect(stat('ATK Up 30%')).toEqual([{ stat: 'ATK', dir: 'Up', val: 30 }])
    expect(stat('DEF Down 10%')).toEqual([{ stat: 'DEF', dir: 'Down', val: 10 }])
  })

  it('handles fullwidth percent sign', () => {
    expect(stat('Max HP Up 25％')).toEqual([{ stat: 'Max HP', dir: 'Up', val: 25 }])
  })

  it('parses status-effect infliction rates', () => {
    expect(stat('Confusion Infliction 30%')).toEqual([
      { stat: 'Confusion Infliction Rate', dir: 'Up', val: 30 },
    ])
  })

  it('encodes boolean flag buffs as val=1', () => {
    expect(stat('Sure Hit')).toEqual([{ stat: 'Sure Hit', dir: 'Up', val: 1 }])
    expect(stat('Attack Nullification')).toEqual([{ stat: 'Attack Nullification', dir: 'Up', val: 1 }])
  })

  it('normalizes Evasion Rate -> Evasion', () => {
    expect(stat('Evasion 15%')).toEqual([{ stat: 'Evasion', dir: 'Up', val: 15 }])
  })

  it('splits multi-part effect strings', () => {
    expect(stat('ATK Up 20%, DEF Up 10%')).toEqual([
      { stat: 'ATK', dir: 'Up', val: 20 },
      { stat: 'DEF', dir: 'Up', val: 10 },
    ])
  })

  it('returns nothing for empty input', () => {
    expect(parseBuffEffect('')).toEqual([])
    expect(parseBuffEffect(null)).toEqual([])
  })
})

// "general" is the universal unit and is bracketed as a tag ([General]); the
// matcher must treat the bracketed and word forms identically (display-only).
describe('bracket-tolerant target matching', () => {
  const owner = { id: 'a', name_en: 'A', country: 'qin', unit_type: 'Cavalry' }
  const ally = { id: 'b', name_en: 'B', country: 'wei', unit_type: 'Shield' }
  const team = [owner, ally]

  it('treats "Ally [General]" like "Ally generals" (everyone)', () => {
    expect(isTargetedBy('Ally [General]', ally, owner, team)).toBe(true)
    expect(isTargetedBy('Ally generals', ally, owner, team)).toBe(true)
  })
  it('"Other ally [General]" excludes self', () => {
    expect(isTargetedBy('Other ally [General]', owner, owner, team)).toBe(false)
    expect(isTargetedBy('Other ally [General]', ally, owner, team)).toBe(true)
  })
  it('still resolves unit-type + country tags', () => {
    expect(isTargetedBy('Ally [Shield]', ally, owner, team)).toBe(true)
    expect(isTargetedBy('Ally [Shield]', owner, owner, team)).toBe(false)
    expect(isTargetedBy('Ally [Wei]', ally, owner, team)).toBe(true)
  })
  it('normalizeEnemyTarget understands bracketed forms', () => {
    expect(normalizeEnemyTarget('Enemy [General] vs Qin')).toBe('Enemy generals')
    expect(normalizeEnemyTarget('All enemy [General]')).toBe('All enemies')
    expect(normalizeEnemyTarget('Enemy [Cavalry]')).toBe('Enemy Cavalry')
  })
})

// The team buff summary sums Strategy skills by default; the "include combat
// skills" toggle adds Combat-type buff/debuff effects too.
describe('calcCharBuffs / buff summary', () => {
  const cav = (id, skills) => ({ id, name_en: id, country: 'qin', unit_type: 'Cavalry', skills })

  it('aggregates a bracketed ally-unit-type buff to matching members only', () => {
    const owner = cav('a', [{ type: 'Strategy', effects: [
      { condition: null, target: 'Ally [Cavalry]', effect: 'ATK Up 30%', duration: null },
    ] }])
    const cavAlly = { id: 'b', name_en: 'B', country: 'wei', unit_type: 'Cavalry', skills: [] }
    const shieldAlly = { id: 'c', name_en: 'C', country: 'wei', unit_type: 'Shield', skills: [] }
    const team = [owner, cavAlly, shieldAlly]
    expect(calcCharBuffs(cavAlly, team, [], false, true).ATK?.up).toBe(30)
    expect(calcCharBuffs(shieldAlly, team, [], false, true).ATK).toBeUndefined()
  })

  it('excludes combat-skill buffs unless includeCombat is set', () => {
    const owner = cav('a', [
      { type: 'Strategy', effects: [{ condition: null, target: 'Self', effect: 'ATK Up 20%', duration: null }] },
      { type: 'Combat', effects: [{ condition: null, target: 'Self', effect: 'DEF Up 30%', duration: '3 turns' }] },
    ])
    const team = [owner]
    const off = calcCharBuffs(owner, team, [], false, true, false)
    expect(off.ATK?.up).toBe(20)
    expect(off.DEF).toBeUndefined()
    const on = calcCharBuffs(owner, team, [], false, true, true)
    expect(on.ATK?.up).toBe(20)
    expect(on.DEF?.up).toBe(30)
  })

  it('includeCombat flows through to enemy debuffs', () => {
    const owner = cav('a', [{ type: 'Combat', effects: [
      { condition: null, target: 'All enemy [General]', effect: 'ATK Down 20%', duration: '3 turns' },
    ] }])
    expect(Object.keys(calcTeamEnemyDebuffs([owner], [])).length).toBe(0)
    const withCombat = calcTeamEnemyDebuffs([owner], [], true)
    expect(withCombat['All enemies']?.down?.ATK).toBe(20)
  })
})

// Combat skills fire in REVERSE slot order, one per turn, Normal Attack when
// a general runs out (see NOTES_FOR_CLAUDE.md). Strategy skills are skipped.
describe('simulate turn ordering', () => {
  const g = (id, skills) => ({ id, name_en: id, skills })

  it('fires combat skills last-first and falls back to Normal Attack', () => {
    const a = [g('A', [
      { type: 'Combat', name: 'c1' },
      { type: 'Strategy', name: 's1' },
      { type: 'Combat', name: 'c3' },
    ])]
    const { turns } = simulate(a, [])
    const fired = turns.map((t) => t.entries[0].skill?.name ?? 'Normal')
    expect(fired).toEqual(['c3', 'c1', 'Normal', 'Normal'])
  })

  it('collects Strategy skills into the strategy section', () => {
    const a = [g('A', [{ type: 'Strategy', name: 's1' }, { type: 'Combat', name: 'c1' }])]
    const { st } = simulate(a, [])
    expect(st.attack).toHaveLength(1)
    expect(st.attack[0].skills.map((s) => s.name)).toEqual(['s1'])
  })
})

// Guards against the data graph silently breaking during refactors.
describe('character data', () => {
  it('loads a non-trivial roster with no unknown-country leaks', () => {
    expect(ALL.length).toBeGreaterThan(150)
    expect(ALL.every((c) => c.country !== 'unknown')).toBe(true)
  })

  it('resolves characters by name case-insensitively', () => {
    const shin = findCharByName('Shin')
    expect(shin?.id).toBe('shin')
    expect(findCharByName('shin')).toBe(shin)
  })

  it('produces finite maxed CW stats for a known character', () => {
    const shin = findCharByName('Shin')
    const s = calcCwStats(shin)
    for (const k of ['hp', 'atk', 'def', 'maxMp']) {
      expect(Number.isFinite(s[k])).toBe(true)
      expect(s[k]).toBeGreaterThan(0)
    }
  })

  it('resolves the current custom meta teams to complete four-member rosters', () => {
    for (const name of ['Yan', 'Moubo', 'Renpa v2', 'Ai', 'Hakuki + Ousen', 'Karin Army', 'Ousen v3']) {
      const team = META_TEAMS.find((t) => t.name === name)
      expect(team?.members).toHaveLength(4)
      expect(team.members.map(findCharByName).filter(Boolean)).toHaveLength(4)
    }
  })
})
