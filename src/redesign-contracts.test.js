import { describe, expect, it } from 'vitest'
import unitBuffs from '../data/cw_buffs.json'
import teamBuffs from '../data/cw_team_buffs.json'
import {
  META_TEAMS,
  buffSourceId,
  calcCharBuffs,
  calcTeamEnemyDebuffs,
  emptyProgress,
  findCharByName,
  normalizeProgress,
} from './core.jsx'

const compactStats = (stats) => Object.fromEntries(
  Object.entries(stats)
    .filter(([, value]) => value.up || value.down)
    .map(([stat, value]) => [stat, {
      up: value.up,
      down: value.down,
      ...(value.instances ? {
        instances: value.instances.map((instance) => ({
          val: instance.val,
          duration: instance.duration,
          owner: instance.owner.name_en,
        })),
      } : {}),
    }]),
)

const compactEnemyDebuffs = (groups) => Object.fromEntries(
  Object.entries(groups).map(([target, values]) => [target, {
    up: values.up,
    down: values.down,
  }]),
)

const resolveMetaTeam = (name) => {
  const definition = META_TEAMS.find((team) => team.name === name)
  return definition.members.map(findCharByName)
}

describe('redesign progress-storage contract', () => {
  it('keeps all four progress buckets and their values through normalization', () => {
    const populated = {
      cw6Cards: { cardA: true },
      sceneBuffCards: { sceneA: true },
      sceneBuffStars: { sceneA: 4 },
      buffSources: { sourceA: true, 'sourceB:shard': true },
    }

    expect(normalizeProgress(JSON.parse(JSON.stringify(populated)))).toEqual(populated)
    expect(Object.keys(normalizeProgress(populated))).toEqual(Object.keys(emptyProgress()))
  })

  it('migrates legacy indexed source and shard keys without losing ownership', () => {
    expect(normalizeProgress({
      buffSources: {
        'state:Chu:Attack:Kyoubou:巨暴:5::7': true,
        'state:Chu:Attack:Kyoubou:巨暴:5::9:shard': true,
      },
    }).buffSources).toEqual({
      'state:Chu:Attack:Kyoubou:巨暴:5:': true,
    })
  })

  it('keeps the two Chu Attack Kyoubou sources independently addressable', () => {
    const entries = teamBuffs.states.Chu.Attack.filter((entry) => entry.name === 'Kyoubou')
    expect(entries).toHaveLength(2)

    const ids = entries.map((entry, index) => buffSourceId('state', 'Chu', 'Attack', entry, index))
    expect(new Set(ids).size).toBe(2)
    expect(ids).toContain('state:Chu:Attack:Kyoubou:巨暴:5::kyoubou-attack-1')
    expect(ids).toContain('state:Chu:Attack:Kyoubou:巨暴:5:')
  })

  it('splits Nakon Defense into two independent 5% sources and migrates old ownership', () => {
    const entries = unitBuffs.Cavalry.Defense.filter((entry) => entry.name === 'Nakon')
    expect(entries).toHaveLength(2)
    expect(entries.map((entry) => entry.value)).toEqual([5, 5])

    const ids = entries.map((entry, index) => buffSourceId('unit', 'Cavalry', 'Defense', entry, index))
    expect(new Set(ids).size).toBe(2)
    expect(ids[0]).toContain(':nakon-defense-1')
    expect(ids[1]).toContain(':nakon-defense-2')

    const legacyId = `unit:Cavalry:Defense:${entries[0].name}:${entries[0].name_jp}:10:${entries[0].special_label}`
    expect(normalizeProgress({ buffSources: { [legacyId]: true } }).buffSources).toEqual({
      [ids[0]]: true,
      [ids[1]]: true,
    })
  })
})

describe('redesign Team Buff calculation contract', () => {
  it('locks representative Gyokuhou vs YTW calculation output', () => {
    const attack = resolveMetaTeam('Gyokuhou')
    const defense = resolveMetaTeam('YTW')
    expect(attack.every(Boolean)).toBe(true)
    expect(defense.every(Boolean)).toBe(true)

    const result = {
      attack: attack.map((general) => [
        general.name_en,
        compactStats(calcCharBuffs(general, attack, defense, false, true, false)),
      ]),
      defense: defense.map((general) => [
        general.name_en,
        compactStats(calcCharBuffs(general, defense, attack, true, true, false)),
      ]),
      attackEnemyDebuffs: compactEnemyDebuffs(calcTeamEnemyDebuffs(attack, defense, false, false)),
      defenseEnemyDebuffs: compactEnemyDebuffs(calcTeamEnemyDebuffs(defense, attack, false, true)),
    }

    expect(JSON.stringify(result)).toBe('{"attack":[["Shoutaku",{"HP Recovery":{"up":40,"down":0},"Hit Rate":{"up":60,"down":0},"ATK":{"up":60,"down":0},"Confusion Resistance":{"up":100,"down":0},"Max HP":{"up":100,"down":0},"DEF":{"up":70,"down":0},"Guard":{"up":100,"down":0,"instances":[{"val":100,"duration":"1 time","owner":"Ouhon"}]},"Betrayal Resistance":{"up":30,"down":0},"Critical Damage":{"up":30,"down":0},"Morale Consumption":{"up":0,"down":30},"Evasion":{"up":30,"down":0},"Attack Down Resistance":{"up":40,"down":0},"HP Recovery Rate":{"up":30,"down":0}}],["Ouhon",{"Max HP":{"up":200,"down":0},"HP Recovery":{"up":40,"down":0},"Hit Rate":{"up":60,"down":0},"ATK":{"up":60,"down":0},"Confusion Resistance":{"up":100,"down":0},"DEF":{"up":70,"down":0},"Guard":{"up":100,"down":0,"instances":[{"val":100,"duration":"1 time","owner":"Ouhon"}]},"Critical Rate":{"up":30,"down":0},"Betrayal Resistance":{"up":30,"down":0},"Critical Damage":{"up":30,"down":0},"Morale Consumption":{"up":0,"down":50},"Evasion":{"up":30,"down":0},"Attack Down Resistance":{"up":40,"down":0},"HP Recovery Rate":{"up":30,"down":0}}],["Kyuukou",{"HP Recovery":{"up":40,"down":0},"Hit Rate":{"up":60,"down":0},"ATK":{"up":60,"down":0},"Confusion Resistance":{"up":100,"down":0},"Max HP":{"up":100,"down":0},"DEF":{"up":70,"down":0},"Guard":{"up":100,"down":0,"instances":[{"val":100,"duration":"1 time","owner":"Ouhon"}]},"Betrayal Resistance":{"up":30,"down":0},"Critical Damage":{"up":30,"down":0},"Morale Consumption":{"up":0,"down":50},"Evasion":{"up":30,"down":0},"Attack Down Resistance":{"up":40,"down":0},"HP Recovery Rate":{"up":30,"down":0}}],["Kanjou",{"HP Recovery":{"up":40,"down":0},"Hit Rate":{"up":60,"down":0},"ATK":{"up":60,"down":0},"Confusion Resistance":{"up":100,"down":0},"Max HP":{"up":100,"down":0},"DEF":{"up":70,"down":0},"Guard":{"up":100,"down":0,"instances":[{"val":100,"duration":"1 time","owner":"Ouhon"}]},"Betrayal Resistance":{"up":30,"down":0},"Critical Damage":{"up":30,"down":0},"Evasion":{"up":30,"down":0},"Attack Down Resistance":{"up":40,"down":0},"HP Recovery Rate":{"up":30,"down":0}}]],"defense":[["Katari",{"Evasion":{"up":30,"down":0},"DEF Penetration":{"up":20,"down":0},"Max HP":{"up":100,"down":0},"Morale Recovery":{"up":20,"down":0},"Fear Resistance":{"up":60,"down":0},"Betrayal Resistance":{"up":60,"down":0},"ATK":{"up":30,"down":0},"Critical Rate":{"up":30,"down":0}}],["Yotanwa",{"DEF Penetration":{"up":20,"down":0},"Max HP":{"up":100,"down":0},"Morale Recovery":{"up":20,"down":0},"Fear Resistance":{"up":60,"down":0},"Betrayal Resistance":{"up":60,"down":0},"ATK":{"up":30,"down":0},"Critical Rate":{"up":50,"down":0},"Sure Hit":{"up":1,"down":0}}],["Kitari",{"DEF Penetration":{"up":20,"down":0},"Max HP":{"up":100,"down":0},"Morale Recovery":{"up":20,"down":0},"Fear Resistance":{"up":60,"down":0},"Betrayal Resistance":{"up":60,"down":0},"ATK":{"up":30,"down":0},"Evasion":{"up":30,"down":0},"Critical Rate":{"up":30,"down":0}}],["Ramauji",{"DEF Penetration":{"up":20,"down":0},"Max HP":{"up":100,"down":0},"Morale Recovery":{"up":20,"down":0},"Fear Resistance":{"up":60,"down":0},"Betrayal Resistance":{"up":60,"down":0},"ATK":{"up":30,"down":0},"Critical Rate":{"up":30,"down":0}}]],"attackEnemyDebuffs":{"Enemy General":{"up":{},"down":{"ATK":40}},"Enemy generals":{"up":{},"down":{"DEF":40}}},"defenseEnemyDebuffs":{"All enemies":{"up":{},"down":{"ATK":30}}}}')
  })
})
