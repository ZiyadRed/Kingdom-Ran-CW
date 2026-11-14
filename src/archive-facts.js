// Archive character panel facts (UX plan 2026-11-14, phase 3).
//
// Everything here is read from data already in the bundle and joined by the
// same identity rules the Buff Tracker and Team Cost pages use. A fact that
// cannot be resolved is omitted, never guessed.
import cwBuffsData from '../data/cw_buffs.json'
import cwTeamBuffs from '../data/cw_team_buffs.json'
import { resolveRegularBuffCharacter } from './buff-identity.js'
import { BUFF_UNIT_CATS, BUFF_STATES, BUFF_ARMIES, BUFF_SIEGE, TERRAIN_BUFFS } from './features/buffs/data.js'

const BUFF_STATS = ['HP', 'Attack', 'Defense']

/**
 * Rarity comes from data/character_rarity.json through the shared
 * `buffEntryRarity` helper (joined by Japanese name), never from a buff
 * entry's `type`. Characters missing from that table get no rarity, and so no
 * red-crystal total either.
 */
export function characterFacts(character, { buffEntryRarity, redCrystalTotals }) {
  if (!character) return null
  const rarity = character.name_jp ? buffEntryRarity({ name_jp: character.name_jp }) : null
  const verifiedRarity = rarity && Object.hasOwn(redCrystalTotals, rarity) ? rarity : null
  return {
    rarity: verifiedRarity,
    unitType: character.unit_type || null,
    groups: [...(character.groups || [])],
    redCrystalCost: verifiedRarity ? redCrystalTotals[verifiedRarity] : null,
  }
}

/**
 * The Buff Tracker's passive sources owned by this general, in Buff Tracker
 * category order. Unit-type rows resolve through their stable character_id;
 * the other categories use the same lookup the Buff Tracker page uses.
 */
export function characterPassiveBuffs(character, { ALL, CHAR_BY_ID, findCharByName }) {
  if (!character) return []
  const teamOwner = entry => entry?.characterId
    ? ALL.find(candidate => candidate.source?.characterId === entry.characterId) || null
    : findCharByName(entry?.name) || ALL.find(candidate => candidate.name_jp === entry?.name_jp) || null
  const rows = []
  const push = (kind, key, stat, entry, owner) => {
    if (owner?.id !== character.id || typeof entry?.value !== 'number') return
    rows.push({ kind, key, stat, value: entry.value, id: entry.ownership_id || `${kind}:${key}:${stat}:${rows.length}` })
  }
  for (const key of BUFF_UNIT_CATS) for (const stat of BUFF_STATS)
    for (const entry of cwBuffsData[key]?.[stat] || []) push('unit', key, stat, entry, resolveRegularBuffCharacter(entry, CHAR_BY_ID, ALL))
  for (const key of BUFF_STATES) for (const stat of BUFF_STATS)
    for (const entry of cwTeamBuffs.states?.[key]?.[stat] || []) push('state', key, stat, entry, teamOwner(entry))
  for (const key of BUFF_ARMIES) for (const stat of BUFF_STATS)
    for (const entry of cwTeamBuffs.armies?.[key]?.[stat] || []) push('army', key, stat, entry, teamOwner(entry))
  for (const terrain of TERRAIN_BUFFS)
    for (const entry of terrain.entries || []) push('terrain', terrain.name, terrain.typeLabel, entry, teamOwner(entry))
  for (const key of BUFF_SIEGE) for (const stat of BUFF_STATS)
    for (const entry of cwTeamBuffs.siege?.[key]?.[stat] || []) push('siege', key, stat, entry, teamOwner(entry))
  return rows
}

/** Preset teams (META_TEAMS) whose members resolve to this general. */
export function characterMetaTeams(character, { META_TEAMS, findCharByName }) {
  if (!character) return []
  return META_TEAMS.filter(team => team.members.some(name => findCharByName(name)?.id === character.id))
}
