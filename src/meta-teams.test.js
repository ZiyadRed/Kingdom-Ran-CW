import { describe, expect, it } from 'vitest'
import { META_TEAMS, TIER_TEAMS, FACTIONS, MIXED_COUNTRY, metaTeamsByCountry, findCharByName } from './core.jsx'

/**
 * Preset comps are defined once in META_TEAMS; the tier list and the Party
 * Builder both read from it. These guards keep that single definition honest.
 */
describe('preset team definitions', () => {
  it('resolves every member to a real character', () => {
    const broken = []
    for (const team of META_TEAMS) {
      for (const name of team.members) {
        if (!findCharByName(name)) broken.push(`${team.name}: ${name}`)
      }
    }
    expect(broken).toEqual([])
  })

  it('gives every preset a country the grouping knows about', () => {
    const known = new Set([...FACTIONS.map((f) => f.id), MIXED_COUNTRY])
    const bad = META_TEAMS.filter((team) => !known.has(team.country))
    expect(bad.map((team) => `${team.name}: ${team.country}`)).toEqual([])
  })

  it('assigns a country that the members actually belong to', () => {
    // Guards against classifying a team by its name. MIXED_COUNTRY is the
    // documented escape hatch for unit-type comps spanning four states.
    const wrong = []
    for (const team of META_TEAMS) {
      if (team.country === MIXED_COUNTRY) continue
      const countries = team.members.map((n) => findCharByName(n)?.country)
      const matching = countries.filter((c) => c === team.country).length
      if (matching < countries.length / 2) wrong.push(`${team.name}: ${team.country} vs ${countries.join(',')}`)
    }
    expect(wrong).toEqual([])
  })

  it('groups every preset exactly once, in canonical faction order', () => {
    const groups = metaTeamsByCountry()
    const grouped = groups.flatMap((g) => g.teams)
    expect(grouped).toHaveLength(META_TEAMS.length)
    expect(new Set(grouped.map((t) => t.name)).size).toBe(META_TEAMS.length)

    const order = [...FACTIONS.map((f) => f.id), MIXED_COUNTRY]
    const seen = groups.map((g) => g.country)
    expect(seen).toEqual(order.filter((id) => seen.includes(id)))
    expect(seen[seen.length - 1]).toBe(MIXED_COUNTRY)
  })

  it('keeps the tier list derived from the same definitions', () => {
    for (const team of TIER_TEAMS) {
      const source = META_TEAMS.find((t) => t.name === team.name)
      expect(source, team.name).toBeTruthy()
      expect(team.members).toEqual(source.members)
      expect(team.country).toBe(source.country)
    }
    expect(TIER_TEAMS).toHaveLength(META_TEAMS.filter((t) => t.tier).length)
  })
})

describe('the two Chu meta teams', () => {
  const byName = (name) => META_TEAMS.find((t) => t.name === name)

  it('Chu Shields is S tier with the requested members', () => {
    const team = byName('Chu Shields')
    expect(team).toBeTruthy()
    expect(team.tier).toBe('S')
    expect(team.country).toBe('chu')
    // Pinned by canonical id, not display name.
    expect(team.members.map((n) => findCharByName(n).id))
      .toEqual(['rien', 'karin', 'goutoku', 'shunshinkun'])
  })

  it('Chu Cavalry is A tier with the requested members', () => {
    const team = byName('Chu Cavalry')
    expect(team).toBeTruthy()
    expect(team.tier).toBe('A')
    expect(team.country).toBe('chu')
    expect(team.members.map((n) => findCharByName(n).id))
      .toEqual(['kyoubou', 'rinbukun', 'rokin', 'kanmei'])
  })

  it('places both on the tier list exactly once', () => {
    expect(TIER_TEAMS.filter((t) => t.name === 'Chu Shields')).toHaveLength(1)
    expect(TIER_TEAMS.filter((t) => t.name === 'Chu Cavalry')).toHaveLength(1)
  })

  it('every member is actually a Chu general', () => {
    for (const name of [...byName('Chu Shields').members, ...byName('Chu Cavalry').members]) {
      expect(findCharByName(name).country, name).toBe('chu')
    }
  })
})
