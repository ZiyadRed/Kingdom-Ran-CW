// Archive "filter by effect" chips.
//
// Every filter reads the canonical English skill rows (target + effect), never
// display text, so a filter means the same thing in every language. A general
// matches when any of their skills — including a released ☆6 skill and a
// Leader/Strategist skill — carries the effect.
import { versionPublicAsset } from './asset-url.js'

export const ARCHIVE_ROLE_FILTERS = ['Leader', 'Strategist']
export const ARCHIVE_EFFECT_GROUPS = ['ally', 'enemy']

// Statuses that can be inflicted on enemies; each also has a resistance.
const INFLICTED_STATUSES = ['Poison', 'Burn', 'Paralysis', 'Confusion', 'Betrayal', 'Fear', 'Illusion']

/** Which side(s) a target names. Text after "vs" is the matchup, not a recipient. */
export function targetSides(target) {
  const subject = String(target || '').split(/\s+vs\s+/i)[0]
  const sides = new Set()
  for (const part of subject.split(/\s*\/\s*|,\s*|\s+and\s+/)) {
    if (part.trim()) sides.add(/\benem(?:y|ies)\b/i.test(part) ? 'enemy' : 'ally')
  }
  return sides.size ? sides : new Set(['ally'])
}

/**
 * Split one effect into the parts that share a recipient. Combined effects are
 * comma-joined ("ATK Up 20%, DEF Up 60%"); a part that starts with "Enemy" is
 * aimed at the enemy even inside an ally row. Commas inside numbers
 * (100,000) and inside quoted name lists stay put.
 */
function effectParts(row) {
  const sides = targetSides(row?.target)
  return String(row?.effect || '').split(/,\s*(?=[A-Z"[])/).map(text => ({
    text,
    ally: /^Enemy\b/.test(text) ? false : sides.has('ally'),
    enemy: /^Enemy\b/.test(text) || sides.has('enemy'),
  }))
}

/**
 * How a status word is used inside one part: inflicted on someone
 * ("Confusion Infliction 30%", "Poison / Paralysis Infliction Rate Up"), resisted
 * ("Betrayal Resistance 50%") or boosted as damage ("Poison Damage Up").
 */
function statusUse(text, status) {
  const match = new RegExp(`\\b${status}\\b"?`).exec(text)
  if (!match) return null
  return /\b(Infliction|Resistance|Damage)\b/.exec(text.slice(match.index + match[0].length))?.[1] || null
}

const icon = path => versionPublicAsset(`/icons/status/${path}.webp`)
const anyPart = (test, side = null) => row => effectParts(row).some(part => (!side || part[side]) && test(part.text))
const inflicts = status => anyPart(text => ['Infliction', 'Damage'].includes(statusUse(text, status)))

export const ARCHIVE_EFFECT_FILTERS = [
  // Effects on allies (or self).
  { id: 'sure-hit', group: 'ally', icon: icon('surehit'), match: anyPart(text => /\bSure Hit\b/.test(text) && !/\bRemove Sure Hit\b/.test(text)) },
  { id: 'guard', group: 'ally', icon: icon('guard'), match: anyPart(text => /\bGuard\b/.test(text)) },
  { id: 'nullify', group: 'ally', icon: icon('nullify'), match: anyPart(text => /\bAttack (?:Nullification|Immunity)\b/.test(text)) },
  { id: 'reflect', group: 'ally', icon: icon('reflect'), match: anyPart(text => /\bReflect\b/.test(text)) },
  // 見切り (the dodge status) and a raised 回避率 (evasion rate).
  { id: 'evasion', group: 'ally', icon: icon('evasion'), match: row => anyPart(text => /(?:\bEvasion \(Dodge Chance\)|\bDodge Chance) \d/.test(text))(row) || anyPart(text => /\bEvasion \(Dodge Chance\) Up\b/.test(text), 'ally')(row) },
  { id: 'less-targeted', group: 'ally', icon: icon('less_targeted'), match: anyPart(text => /\bLess Likely to be Targeted\b/.test(text)) },
  // The general takes (or hands out) Provoke; "excl. Provoke" is not Provoke.
  { id: 'provoke', group: 'ally', icon: icon('provoke'), match: anyPart(text => /^"?Provoke"?(?: Infliction)?$/.test(text.trim())) },
  { id: 'status-immunity', group: 'ally', icon: icon('status_immunity'), match: anyPart(text => /\bStatus Effect Immunity\b/.test(text)) },
  { id: 'status-resistance', group: 'ally', icon: null, match: anyPart(text => INFLICTED_STATUSES.some(status => statusUse(text, status) === 'Resistance')) },
  // Restores HP now or over time; recovery-amount bonuses and HP Drain are not heals.
  { id: 'hp-recovery', group: 'ally', icon: null, match: anyPart(text => /\bHP Recovery\b(?! (?:Rate|Up|Nullification))/.test(text), 'ally') },
  { id: 'morale-recovery', group: 'ally', icon: null, match: anyPart(text => /\bMorale Recovery\b/.test(text), 'ally') },
  { id: 'def-penetration', group: 'ally', icon: null, match: anyPart(text => /\bDEF Penetration\b(?! Resistance)/.test(text), 'ally') },
  { id: 'critical', group: 'ally', icon: null, match: anyPart(text => /\bCritical (?:Rate|Damage) Up\b/.test(text), 'ally') },
  { id: 'hit-rate', group: 'ally', icon: null, match: anyPart(text => /\bHit Rate Up\b/.test(text), 'ally') },

  // Effects on enemies. A status filter also lists generals who raise their
  // allies' chance to inflict it; resistances are a separate filter above.
  { id: 'poison', group: 'enemy', icon: icon('poison'), match: inflicts('Poison') },
  { id: 'burn', group: 'enemy', icon: icon('burn'), match: inflicts('Burn') },
  { id: 'paralysis', group: 'enemy', icon: icon('paralysis'), match: inflicts('Paralysis') },
  { id: 'confusion', group: 'enemy', icon: icon('confusion'), match: inflicts('Confusion') },
  { id: 'betrayal', group: 'enemy', icon: icon('betrayal'), match: inflicts('Betrayal') },
  { id: 'fear', group: 'enemy', icon: icon('fear'), match: inflicts('Fear') },
  { id: 'illusion', group: 'enemy', icon: icon('illusion'), match: inflicts('Illusion') },
  { id: 'seal', group: 'enemy', icon: icon('seal'), match: anyPart(text => /\b(?:Normal |Skill )?Attack Seal\b/.test(text)) },
  { id: 'hp-seal', group: 'enemy', icon: icon('hp_recovery_block'), match: anyPart(text => /\bHP Seal\b/.test(text)) },
  { id: 'atk-down', group: 'enemy', icon: null, match: anyPart(text => /\bATK Down\b(?! Resistance)/.test(text), 'enemy') },
  { id: 'def-down', group: 'enemy', icon: null, match: anyPart(text => /\bDEF Down\b(?! Resistance)/.test(text), 'enemy') },
  { id: 'morale-down', group: 'enemy', icon: null, match: anyPart(text => /\bMorale Down\b/.test(text), 'enemy') },
]

export const ARCHIVE_EFFECT_FILTER_IDS = ARCHIVE_EFFECT_FILTERS.map(filter => filter.id)
const FILTERS_BY_ID = new Map(ARCHIVE_EFFECT_FILTERS.map(filter => [filter.id, filter]))

/** Every skill a general can bring to a Castle War battle. */
const battleSkills = character => [...(character?.skills || []), ...(character?.roleSkill ? [character.roleSkill] : [])]

const effectCache = new WeakMap()
/** The set of effect-filter ids a general matches (cached per character object). */
export function characterEffectFilterIds(character) {
  if (!character || typeof character !== 'object') return new Set()
  let ids = effectCache.get(character)
  if (!ids) {
    const rows = battleSkills(character).flatMap(skill => skill?.effects || [])
    ids = new Set(ARCHIVE_EFFECT_FILTERS.filter(filter => rows.some(filter.match)).map(filter => filter.id))
    effectCache.set(character, ids)
  }
  return ids
}

/** Leader / Strategist, or null for a general without a role skill. */
export const characterRole = character => (ARCHIVE_ROLE_FILTERS.includes(character?.roleSkill?.type) ? character.roleSkill.type : null)

/** Narrow a list by role and by every selected effect (all must match). */
export function filterCharactersByRoleAndEffects(characters, { role = null, effects = [] } = {}) {
  const wanted = effects.filter(id => FILTERS_BY_ID.has(id))
  if (!role && !wanted.length) return characters
  return characters.filter(character => (!role || characterRole(character) === role)
    && wanted.every(id => characterEffectFilterIds(character).has(id)))
}

/** How many generals each effect chip would leave, given everything else selected. */
export function effectFilterCounts(characters, effects = []) {
  const wanted = effects.filter(id => FILTERS_BY_ID.has(id))
  const base = characters.filter(character => wanted.every(id => characterEffectFilterIds(character).has(id)))
  return Object.fromEntries(ARCHIVE_EFFECT_FILTERS.map(filter => [
    filter.id,
    wanted.includes(filter.id) ? base.length : base.filter(character => characterEffectFilterIds(character).has(filter.id)).length,
  ]))
}
