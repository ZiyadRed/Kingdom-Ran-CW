/**
 * Semantic French renderer for RanHQ's structured game data.
 *
 * SCOPE — read this before changing anything here.
 * Skill NAMES and DESCRIPTIONS are never produced by this module. Those come
 * from the game's own tables verbatim via `ja-source.js`, and paraphrasing
 * them is forbidden by the localization contract. What this module renders is
 * RanHQ's own decomposition of a skill into target / effect / condition /
 * duration rows, which has no counterpart string in the source and would
 * otherwise be shipped to French readers in English.
 *
 * Structure mirrors `ar-render.js`:
 *
 *     recognise pattern -> extract operands -> build natural French
 *
 * and it shares the same safety rule: an unrecognised string is returned in
 * English, unchanged, rather than half-translated.
 *
 * The vocabulary is the French community's, not a dictionary's: every term in
 * `fr-lexicon.js` is either what TouranKo already shows French players or what
 * the French guide copy in `src/guide.jsx` uses.
 *
 * Percentages are written without a space before `%` — the form the game
 * client and TouranKo both use — so a rendered row matches what a player sees
 * in game. Decimal commas and grouped thousands still follow French usage.
 */
import {
  DIRECTION,
  GROUPS,
  PHRASES,
  QUALIFIERS,
  STATS,
  STATUSES,
  STATUS_ADJECTIVES,
  SUPERLATIVE,
  TAGS,
  CHARACTER_ALIASES,
} from './fr-lexicon.js'
import { canonicalCharacterName } from './ar-character-names.js'

const SLASH = ' / '
const PLUS = ' + '
// fr-FR groups thousands with a narrow no-break space, which is also what
// Intl.NumberFormat('fr-FR') emits, so data numbers match formatted ones.
const NARROW_NBSP = ' '

function buildIndex(source) {
  const index = new Map()
  for (const [key, value] of Object.entries(source)) index.set(key.toLowerCase(), value)
  return index
}

const STAT_INDEX = buildIndex(STATS)
const STATUS_INDEX = buildIndex(STATUSES)
const TAG_INDEX = buildIndex(TAGS)
const GROUP_INDEX = buildIndex(GROUPS)
const PHRASE_INDEX = buildIndex(PHRASES)
const QUALIFIER_INDEX = buildIndex(QUALIFIERS)

const clean = (value) => String(value == null ? '' : value).trim()

/** Join rendered fragments with single spaces, skipping empty slots. */
function words(...parts) {
  return parts.filter(Boolean).join(' ').replace(/\s{2,}/g, ' ').trim()
}

/** Strip the source's decorative quotes around a proper name or status. */
function unquote(value) {
  return clean(value).replace(/^["'“”]+|["'“”]+$/g, '').trim()
}

/** "50,000" -> "50 000" and "2.7%" -> "2,7%". */
function frenchNumber(value) {
  return String(value)
    .replace(/\b\d{1,3}(?:,\d{3})+\b/g, (n) => n.replace(/,/g, NARROW_NBSP))
    .replace(/\b(\d+)\.(\d+)(?=%|\b)/g, '$1,$2')
}

// ── Lookup helpers ──────────────────────────────────────────────────────────

/** Look up a stat, returning `{de, le, a}` or null. Handles a leading "Max ". */
function lookupStat(raw) {
  const text = clean(raw).replace(/\s+/g, ' ')
  if (!text) return null
  const direct = STAT_INDEX.get(text.toLowerCase())
  if (direct) return direct

  // French puts the cap after the noun — "PV max" — so a generic "Max X" is
  // built from the base stat rather than stored twice.
  const max = /^max(?:imum)?\s+(.+)$/i.exec(text)
  if (max) {
    const base = STAT_INDEX.get(max[1].toLowerCase())
    if (base) {
      return {
        de: `${base.de} max`,
        le: `${base.le} max`,
        a: `${base.a} max`,
      }
    }
  }
  return null
}

/** Split "Damage Taken Increase Resistance" into its stat head and tail. */
function splitTrailingStat(text) {
  const parts = clean(text).split(/\s+/)
  for (let index = 1; index < parts.length; index += 1) {
    const stat = lookupStat(parts.slice(index).join(' '))
    if (stat) return { head: parts.slice(0, index).join(' '), stat }
  }
  return null
}

function lookupStatus(raw) {
  return STATUS_INDEX.get(unquote(raw).toLowerCase()) || null
}

function lookupGroup(raw) {
  return GROUP_INDEX.get(unquote(raw).toLowerCase()) || null
}

function tagOf(name) {
  return TAG_INDEX.get(clean(String(name).replace(/^\[|\]$/g, '')).toLowerCase()) || null
}

/** Every bracketed tag in a string, in order, resolved to its entry. */
function tagsIn(text) {
  const out = []
  for (const match of String(text).matchAll(/\[([^\]]+)\]/g)) {
    const hit = TAG_INDEX.get(match[1].trim().toLowerCase())
    if (hit) out.push(hit)
  }
  return out
}

/** Unknown bracket operands must fail closed instead of producing mixed output. */
function hasUnknownTags(text) {
  for (const match of String(text).matchAll(/\[([^\]]+)\]/g)) {
    if (!TAG_INDEX.has(match[1].trim().toLowerCase())) return true
  }
  return false
}

/**
 * Pick the tag that carries the noun. `[Archer] [General]` describes an archer
 * general, and since every CW unit is a general the specific type is the
 * informative one.
 */
function primaryUnit(tags) {
  const unit = tags.find((tag) => tag.kind === 'unit' && !tag.general)
  return unit || tags.find((tag) => tag.kind === 'unit') || null
}

/** "de l’armée de Renpa" -> "l’armée de Renpa", for use after "contre". */
function direct(complement) {
  if (!complement) return complement
  return complement
    .replace(/^de l’/, 'l’')
    .replace(/^de la /, 'la ')
    .replace(/^des /, 'les ')
    .replace(/^du /, 'le ')
    .replace(/^de /, '')
}

/** "les PV restants" -> "PV restants": the definite form without its article. */
function bare(definite) {
  return String(definite || '').replace(/^(l’|la |le |les )/, '')
}

/** A stat as a standalone chip label: "l’attaque" -> "Attaque". */
function statLabel(stat) {
  if (!stat) return null
  return capitalize(bare(stat.le))
}

/**
 * Does this rendered noun phrase read as a plural? French agreement needs to
 * know, and the head noun is not always the last word ("Alliés Chu").
 */
function isPlural(text) {
  const lower = String(text || '').toLowerCase()
  if (/^(tous|toutes)\s/.test(lower)) return true
  if (/\b(alliés|ennemis|généraux|autres)\b/.test(lower)) return true
  return /s$/.test(lower)
}

/** "cavaliers alliés" -> "des cavaliers alliés"; "allié Renpa" -> "de l’allié Renpa". */
function possessiveOf(text) {
  const lower = lowerFirstArticle(text)
  if (/^tous les /.test(lower)) return `de ${lower}`
  if (isPlural(lower)) return `des ${lower}`
  if (/^[aeiouéèêh]/i.test(lower)) return `de l’${lower}`
  return `du ${lower}`
}

function capitalize(text) {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * A named general in effect text: resolve any alternate romanisation to the
 * archive's spelling. French keeps canonical Latin names, exactly as English
 * and TouranKo do, so nothing is transliterated here.
 */
function canonicalName(raw) {
  const trimmed = unquote(raw)
  if (!trimmed) return trimmed
  return canonicalCharacterName(CHARACTER_ALIASES[trimmed.toLowerCase()] || trimmed)
}

/** Is this token a bare proper name rather than a tag, group or keyword? */
function looksLikeName(raw) {
  const text = unquote(raw)
  if (!text) return false
  if (tagOf(text) || lookupGroup(text) || lookupStat(text) || lookupStatus(text)) return false
  return /^[A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*)*$/.test(text)
}

// ── Scope rendering (ally / enemy / other ally) ──────────────────────────────

const SCOPE_ADJECTIVE = {
  ally: { s: 'allié', sf: 'alliée', p: 'alliés' },
  enemy: { s: 'ennemi', sf: 'ennemie', p: 'ennemis' },
}

// A proper name makes the selector singular, so its ally/enemy adjective must
// agree with the person. This set only contains characters whose gender is
// explicit in the current roster; unknown names keep the generic masculine.
const FEMININE_CHARACTER_NAMES = new Set([
  'Kaine',
  'Karin',
  'Kitari',
  'Kyou',
  'Queen Biki',
  'Shikika',
  'Yotanwa',
])

/**
 * Turn a scope plus its operand into natural French.
 *
 * The community's own frames are used: a unit type takes the adjective
 * ("cavaliers alliés"), a state follows the noun ("alliés Qin"), and a named
 * army or unit becomes a complement ("alliés de l’armée de Kanki").
 *
 * @param {'ally'|'enemy'} side
 * @param {string} rest Everything after the scope word.
 * @param {{other?: boolean, all?: boolean, count?: number|null}} [options]
 * @returns {string|null} French, or null when the operand is not recognised.
 */
function scoped(side, rest, options = {}) {
  const { other = false, all = false, count = null } = options
  let text = clean(rest)
  if (hasUnknownTags(text)) return null

  // "[Hishin] Unit" — the tag already names the unit, so drop the noun.
  text = text.replace(/\]\s+Unit\b/gi, ']')

  const tags = tagsIn(text)
  const withoutTags = text.replace(/\[[^\]]+\]/g, ' ').replace(/\s{2,}/g, ' ').trim()

  const unit = primaryUnit(tags)
  const state = tags.find((tag) => tag.kind === 'state')
  const groupTag = tags.find((tag) => tag.kind === 'group')

  // A siege-weapon buff category written as a modifier: "attack [Siege Weapon]".
  let sideRole = null
  let remainder = withoutTags
  const role = /^(attack|defense)\b\s*/i.exec(remainder)
  if (role && unit) {
    sideRole = /^attack$/i.test(role[1]) ? 'd’attaque' : 'de défense'
    remainder = remainder.slice(role[0].length).trim()
  }

  const group = groupTag || (remainder ? lookupGroup(remainder) : null)
  if (remainder && !group && !looksLikeName(remainder)) return null
  const name = remainder && !group ? canonicalName(remainder) : null
  if (remainder && !group && !name) return null

  const adjective = SCOPE_ADJECTIVE[side]
  const complement = group ? (group.de || `de ${group.name}`) : null

  // No unit type: the scope word itself is the noun. A single named general
  // reads in the singular ("Allié Yotanwa"), and so does a distributive
  // "Per …" frame; a bare state or army is a group and stays plural.
  if (!unit) {
    const singular = count === 1 || (Boolean(name) && !all)
    const feminine = singular && name && FEMININE_CHARACTER_NAMES.has(name)
    const noun = singular ? (feminine ? adjective.sf : adjective.s) : adjective.p
    const head = all
      ? `Tous les ${adjective.p}`
      : capitalize(other ? `${singular ? 'autre' : 'autres'} ${noun}` : noun)
    if (name) return words(head, name)
    if (state) return words(head, state.after || state.s)
    if (complement) return words(head, complement)
    return head
  }

  const noun = count === 1 ? unit.s : unit.p
  const nounWithRole = sideRole ? words(noun, sideRole) : noun
  const scopeWord = count === 1 ? adjective.s : adjective.p
  const head = words(
    all ? 'Tous les' : null,
    other ? (count === 1 ? 'autre' : 'autres') : null,
    nounWithRole,
    scopeWord,
  )
  const qualified = words(
    head,
    state ? (state.after || state.s) : null,
    complement,
    name ? `de ${name}` : null,
  )
  return all || other ? capitalize(qualified) : capitalize(qualified)
}

/** A bare operand with no ally/enemy scope: "[Mountain Folk]", "Riboku". */
function bareOperand(text) {
  const raw = clean(text)
  if (!raw) return null
  const tags = tagsIn(raw)
  if (tags.length === 1 && raw.replace(/\[[^\]]+\]/g, '').trim() === '') {
    const tag = tags[0]
    return capitalize(tag.after && tag.kind === 'group' ? direct(tag.after) : tag.p)
  }
  const group = lookupGroup(raw)
  if (group) return capitalize(group.name)
  if (looksLikeName(raw)) return canonicalName(raw)
  return null
}

/** Everything a "vs"/"Anti-" operand can be, as a "contre X" complement. */
function against(text) {
  const raw = clean(text)
  if (!raw) return null
  const tags = tagsIn(raw)
  const residue = raw.replace(/\[[^\]]+\]/g, '').trim()
  const tag = tagOf(raw) || (tags.length === 1 && !residue ? tags[0] : null)
  if (tag) {
    if (tag.kind === 'state') return tag.s
    if (tag.kind === 'group') return direct(tag.de || tag.s)
    return `les ${tag.p}`
  }
  // "Qin [General]" — a unit type narrowed by a state, as one noun phrase.
  if (tags.length > 1 || (tags.length === 1 && residue)) {
    const unit = primaryUnit(tags)
    const state = tags.find((entry) => entry.kind === 'state')
      || (raw.replace(/\[[^\]]+\]/g, '').trim() ? tagOf(raw.replace(/\[[^\]]+\]/g, '').trim()) : null)
    if (unit) return words(`les ${unit.p}`, state && state !== unit ? (state.after || state.s) : null)
  }
  const group = lookupGroup(raw)
  if (group) return direct(group.de || group.name)
  if (looksLikeName(raw)) return canonicalName(raw)
  return null
}

// ── Shared clause plumbing ──────────────────────────────────────────────────

const VALUE = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?`

/**
 * Split a compound value into clauses on a comma or a slash.
 *
 * A separator inside a number must NOT split it: "HP Recovery 50,000" is one
 * clause. "and" is handled per field, because it usually joins operands rather
 * than whole clauses ("Ally [Infantry] and [Cavalry]" is a single target).
 */
function splitClauses(text) {
  return text.split(/(?<!\d)\s*[,/]\s*(?!\d)/).map((s) => s.trim()).filter(Boolean)
}

/** Trailing numeric operand of a clause, e.g. "30%" in "DEF Up 30%". */
function trailingValue(text) {
  const match = new RegExp(`\\s(${VALUE})$`).exec(text)
  return match ? match[1] : null
}

/** Translate a trailing parenthetical qualifier, e.g. "(scales)". */
function renderQualifier(inner) {
  const known = QUALIFIER_INDEX.get(clean(inner).toLowerCase())
  if (known) return known
  const cap = new RegExp(`^max\\s+(${VALUE})$`, 'i').exec(clean(inner))
  if (cap) return `max. ${cap[1]}`
  return null
}

/** Peel a trailing "(...)" off a clause; fails closed on unknown qualifiers. */
function splitQualifier(text) {
  const match = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(text)
  if (!match) return { body: text, qualifier: null }
  const qualifier = renderQualifier(match[2])
  if (!qualifier) return { body: text, qualifier: null }
  return { body: match[1].trim(), qualifier }
}

const DIRECTION_WORDS = {
  up: 'up', increase: 'up',
  down: 'down', decrease: 'down', reduction: 'down',
}

function directionOf(word) {
  return DIRECTION_WORDS[clean(word).toLowerCase()] || null
}

const SCOPES = 'Ally|Other ally|Enemy|All ally|All enemy'

function scopeParts(word) {
  const text = clean(word).toLowerCase()
  return {
    side: text.includes('enemy') ? 'enemy' : 'ally',
    other: text.startsWith('other'),
    // "All ally", not "Ally" — the scope word itself starts with the letters
    // of "all", so the space is what distinguishes them.
    all: /^all\s/.test(text),
  }
}

// ── Effect rendering ────────────────────────────────────────────────────────

/** "+" / "-" prefixed percentage: "+20% d’attaque". */
function signed(dir, value, complement) {
  return words(`${DIRECTION[dir]}${frenchNumber(value)}`, complement)
}

/** Recovery families read as "Soin de 20% de PV" / "Regain de 10% de moral". */
const RECOVERY_FRAMES = {
  'hp recovery': { verb: 'Soin', of: 'de PV' },
  'morale recovery': { verb: 'Regain', of: 'de moral' },
  'continuous hp recovery': { verb: 'Soin continu', of: 'de PV' },
  'continuous morale recovery': { verb: 'Regain continu', of: 'de moral' },
}

function renderRecovery(head, value) {
  const frame = RECOVERY_FRAMES[clean(head).toLowerCase()]
  if (!frame) return null
  const amount = frenchNumber(value)
  // A flat amount is already the resource: "Soin de 50 000 PV".
  return amount.endsWith('%')
    ? `${frame.verb} de ${amount} ${frame.of}`
    : `${frame.verb} de ${amount} ${frame.of.replace(/^de /, '')}`
}

function renderEffectBody(body) {
  // Whole-string canonical phrases first, so a canonical name is never taken
  // apart by a lower-level rule.
  const phrase = PHRASE_INDEX.get(body.toLowerCase())
  if (phrase) return frenchNumber(phrase)
  const group = lookupGroup(body)
  if (group) return capitalize(group.name)

  let match

  // "% of Remaining HP Damage 20%"
  match = new RegExp(`^%\\s*of\\s+remaining\\s+HP\\s+Damage\\s+(${VALUE})$`, 'i').exec(body)
  if (match) return `Dégâts égaux à ${match[1]} des PV restants`

  // "2-Hit 100% Damage"
  match = new RegExp(`^(\\d+)-Hit\\s+(${VALUE})\\s+Damage$`, 'i').exec(body)
  if (match) return `${match[1]} coups à ${match[2]} de dégâts`

  // "100% Damage 2 times" / "80% Damage each" / "150% Damage to equipment"
  match = new RegExp(`^(${VALUE})\\s+Damage\\s+(\\d+)\\s+times?$`, 'i').exec(body)
  if (match) return `${match[2]} fois ${match[1]} de dégâts`
  match = new RegExp(`^(${VALUE})\\s+Damage\\s+each$`, 'i').exec(body)
  if (match) return `${match[1]} de dégâts par cible`
  match = new RegExp(`^(${VALUE})\\s+Damage to equipment$`, 'i').exec(body)
  if (match) return `${match[1]} de dégâts à l’équipement`

  // "150% Damage" — the single most common effect in the corpus.
  match = new RegExp(`^(${VALUE})\\s+Damage$`, 'i').exec(body)
  if (match) return `${match[1]} de dégâts`

  // "160% Damage + HP Drain 60%" — two effects joined by a plus.
  if (body.includes('+')) {
    const plusParts = body.split('+').map((s) => s.trim()).filter(Boolean)
    if (plusParts.length > 1) {
      const rendered = plusParts.map((part) => renderEffectBody(part))
      if (!rendered.some((part) => part == null)) return rendered.join(PLUS)
    }
  }

  // Anti-X families. X may be a bracket tag OR a multi-word group name, and
  // the clause may carry its own scope.
  //   "Anti-[Cavalry] ATK Up 5%" · "Anti-Renpa Army DEF Down 30%"
  //   "[Shield] Anti-[Cavalry] DEF Up 25%"
  //   "Ally [Archer] Anti-[Infantry] DEF Up 20%"
  match = new RegExp(
    `^(?:(${SCOPES})\\s+)?(\\[[^\\]]+\\]\\s+)?Anti-(.+)\\s+(Up|Down)\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const dir = directionOf(match[4])
    const split = splitTrailingStat(match[3])
    if (dir && split) {
      const target = against(split.head)
      if (target) {
        const who = match[1]
          ? scoped(scopeParts(match[1]).side, match[2] || '', scopeParts(match[1]))
          : (match[2] ? capitalize(tagOf(match[2].trim())?.p || '') : null)
        return signed(dir, match[5], words(split.stat.de, `contre ${target}`, who ? `pour les ${who.toLowerCase()}` : null))
      }
    }
  }

  // "[Siege Weapon] repair Ore Consumption Down 2.7%"
  match = new RegExp(`^(\\[[^\\]]+\\])\\s+repair\\s+(.+?)\\s+(Up|Down)\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const tag = tagOf(match[1])
    const stat = lookupStat(match[2])
    const dir = directionOf(match[3])
    if (tag && stat && dir) {
      // "vitesse de réparation pour la réparation des engins" says it twice.
      const repairSpeed = /^repair speed$/i.test(clean(match[2]))
      return signed(dir, match[4], repairSpeed
        ? `de vitesse de réparation des ${tag.p}`
        : words(stat.de, `pour la réparation des ${tag.p}`))
    }
  }

  // "DEF Up vs Cavalry 20%"
  match = new RegExp(`^(.+?)\\s+(Up|Down)\\s+vs\\s+(.+?)(?:\\s+(${VALUE}))?$`, 'i').exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    const target = against(match[3])
    if (stat && dir && target) {
      if (!match[4]) return words(capitalize(direct(stat.de)), `contre ${target}`, dir === 'up' ? 'en hausse' : 'en baisse')
      return signed(dir, match[4], words(stat.de, `contre ${target}`))
    }
  }

  // "Confusion Infliction Rate Up 20%"
  match = new RegExp(`^"?(.+?)"?\\s+Infliction\\s+Rate\\s+(Up|Down)\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    const dir = directionOf(match[2])
    if (status && dir) return signed(dir, match[3], `de chances d’infliger ${status.def}`)
  }

  // "Confusion Infliction 100%" / "Provoke Infliction"
  match = new RegExp(`^"?(.+?)"?\\s+Infliction\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    if (status) return `${match[2]} de chances d’infliger ${status.def}`
  }
  match = /^"?(.+?)"?\s+Infliction$/i.exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    if (status) return `Inflige ${status.def}`
  }

  // "Attack Down Resistance Up 40%" — the debuff direction belongs to the
  // resisted thing, so it reads "résistance à la baisse d’attaque".
  match = new RegExp(
    `^(.+?)\\s+(Up|Down)\\s+Resistance(?:\\s+(Up|Down))?\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    const outer = directionOf(match[3] || 'up')
    if (stat && dir) {
      const movement = dir === 'up' ? 'à la hausse' : 'à la baisse'
      return signed(outer, match[4], `de résistance ${movement} ${stat.de}`)
    }
  }

  // "Ally [Shield] "Poison" Resistance 60%" — scoped status resistance.
  match = new RegExp(
    `^(${SCOPES})\\s+(\\[[^\\]]+\\])\\s+"?(.+?)"?\\s+Resistance\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const status = lookupStatus(match[3])
    const who = scoped(scopeParts(match[1]).side, match[2], scopeParts(match[1]))
    if (status && who) return signed('up', match[4], `de résistance ${status.a} pour les ${who.toLowerCase()}`)
  }

  // "DEF Penetration Resistance 20%" / ""Betrayal" Resistance 35%"
  match = new RegExp(`^"?(.+?)"?\\s+Resistance(?:\\s+(Up|Down))?\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    const stat = status ? null : lookupStat(match[1])
    const complement = status ? status.a : stat?.a
    if (complement) return signed(directionOf(match[2] || 'up'), match[3], `de résistance ${complement}`)
  }

  // "Ally [Shield] DEF Up 30%" — an effect carrying its own scope.
  match = new RegExp(
    `^(${SCOPES})\\s+(\\[[^\\]]+\\])\\s+(.+?)\\s+(Up|Down)\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const stat = lookupStat(match[3])
    const dir = directionOf(match[4])
    const who = scoped(scopeParts(match[1]).side, match[2], scopeParts(match[1]))
    if (stat && dir && who) return signed(dir, match[5], words(stat.de, `pour les ${who.toLowerCase()}`))
  }

  // "Ally [Shield] "Poison" 30%" — a status applied to a scoped ally.
  match = new RegExp(
    `^(${SCOPES})\\s+(\\[[^\\]]+\\])\\s+"?(.+?)"?\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const status = lookupStatus(match[3])
    const who = scoped(scopeParts(match[1]).side, match[2], scopeParts(match[1]))
    if (status && who) return `${status.label} ${match[4]} pour les ${who.toLowerCase()}`
  }

  // "[Infantry] ATK Up 20%" / "1 [Siege Weapon] ATK Up 20%"
  match = new RegExp(
    `^(?:(\\d+)\\s+)?(\\[[^\\]]+\\])\\s+(.+?)\\s+(Up|Down)\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const tag = tagOf(match[2])
    const stat = lookupStat(match[3])
    const dir = directionOf(match[4])
    if (tag && stat && dir) {
      const count = match[1] ? Number(match[1]) : null
      const who = count === 1 ? `pour 1 ${tag.s}` : count ? `pour ${count} ${tag.p}` : `pour les ${tag.p}`
      return signed(dir, match[5], words(stat.de, who))
    }
  }

  // "Damage Received significantly Down"
  match = /^(.+?)\s+significantly\s+(Up|Down)$/i.exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) return `${capitalize(bare(stat.le))} fortement ${dir === 'up' ? 'augmentés' : 'réduits'}`
  }

  // "Max HP Up additional 50%" — the qualifier sits before the value.
  match = new RegExp(`^(.+?)\\s+(Up|Down)\\s+additional\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) return `${signed(dir, match[3], stat.de)} (supplémentaire)`
  }

  // "HP Recovery 20%" / "HP Recovery 50,000" — recovery keeps its own frame.
  match = new RegExp(`^(.+?)\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const recovery = renderRecovery(match[1], match[2])
    if (recovery) return recovery
  }

  // "ATK Up 20%" — the dominant family.
  match = new RegExp(
    `^(.+?)\\s+(Up|Down|Increase|Decrease|Reduction)\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) return signed(dir, match[3], stat.de)
  }

  // "ATK Up" with no value of its own (the caller supplies one when merging).
  match = /^(.+?)\s+(Up|Down|Increase|Decrease|Reduction)$/i.exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) return `${dir === 'up' ? 'Hausse' : 'Baisse'} ${stat.de}`
  }

  // "Attack Immunity x3"
  match = /^(.+?)\s*[x×]\s*(\d+)$/i.exec(body)
  if (match) {
    const inner = renderEffectBody(match[1].trim())
    if (inner) return `${inner} ×${match[2]}`
  }

  // "Guard 60%" / ""Illusion"35%" / "DEF Penetration 30%" — a status or a stat
  // with a bare value and no direction word. The space is optional because the
  // source contains `"Illusion"35%`.
  match = new RegExp(`^"?(.+?)"?\\s*(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    if (status) return `${status.label} ${match[2]}`
    const stat = lookupStat(match[1])
    if (stat) return `${frenchNumber(match[2])} ${stat.de}`
  }

  // Bare status names: "Sure Hit", "Provoke", "Attack Nullification".
  const bareStatus = lookupStatus(body)
  if (bareStatus) return bareStatus.label

  return null
}

/**
 * Render one atomic effect clause.
 * @returns {string|null} French, or null when the clause is not recognised.
 */
function renderEffectClause(text) {
  const raw = clean(text)
  if (!raw) return null
  // Try the whole string first: "Evasion (Dodge Chance) 40%" carries its
  // parenthesis inside the stat name, not as a trailing qualifier.
  const whole = renderEffectBody(raw)
  if (whole) return whole
  const { body, qualifier } = splitQualifier(raw)
  if (!qualifier) return null
  const rendered = renderEffectBody(body)
  if (!rendered) return null
  return `${rendered} (${qualifier})`
}

/** Join a French list with commas and a final "et". */
function joinAnd(items) {
  if (items.length <= 1) return items[0] || ''
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`
}

export function renderFrenchEffect(value) {
  const raw = clean(value)
  if (!raw) return value
  if (hasUnknownTags(raw)) return value

  // Exact compound effects must win before comma/slash segmentation; some
  // source rows use punctuation to list targets inside a single mechanic.
  const phrase = PHRASE_INDEX.get(raw.toLowerCase())
  if (phrase) return frenchNumber(phrase)

  const segments = splitClauses(raw)
  if (segments.length === 1) {
    const rendered = renderEffectClause(raw)
    return rendered ? frenchNumber(rendered) : value
  }

  const carried = trailingValue(segments[segments.length - 1])

  // When every clause is "{STAT} {same direction}", merge the stats into one
  // phrase instead of repeating the sign for each.
  const heads = segments.map((segment) => {
    const direct_ = new RegExp(
      `^(.+?)\\s+(Up|Down|Increase|Decrease|Reduction)(?:\\s+${VALUE})?$`, 'i',
    ).exec(segment)
    return direct_ ? { stat: lookupStat(direct_[1]), dir: directionOf(direct_[2]) } : null
  })
  const segmentValues = segments.map(trailingValue)
  const sharesOneValue = segmentValues.every((each) => !each || each === carried)
  if (carried && sharesOneValue && heads.every((head) => head && head.stat && head.dir === heads[0].dir)) {
    return signed(heads[0].dir, carried, joinAnd(heads.map((head) => head.stat.de)))
  }

  // A shared frame may sit on the final clause and apply to all of them:
  // "Confusion / Poison / Paralysis Infliction Rate Up 40%" is three infliction
  // rates, not two bare statuses followed by one.
  const framed = new RegExp(
    `^(.+?)\\s+(Infliction Rate(?:\\s+(?:Up|Down))?|Infliction|Resistance(?:\\s+(?:Up|Down))?)\\s+(${VALUE})$`, 'i',
  ).exec(segments[segments.length - 1])
  const sharedFrame = framed ? `${framed[2]} ${framed[3]}` : null

  // Otherwise render each clause independently. A clause with no value of its
  // own borrows the trailing one, so "Poison Resistance / Burn Resistance 100%"
  // applies 100% to both halves.
  const rendered = segments.map((segment, index) => {
    if (trailingValue(segment)) return renderEffectClause(segment)
    if (!carried) return renderEffectClause(segment)
    const isBareTerm = index < segments.length - 1 && (lookupStatus(segment) || lookupStat(segment))
    const complete = sharedFrame && isBareTerm ? words(segment, sharedFrame) : words(segment, carried)
    return renderEffectClause(complete)
  })
  if (rendered.some((part) => part == null)) return value
  return frenchNumber(rendered.join(SLASH))
}

// ── Target rendering ────────────────────────────────────────────────────────

const STATUS_ADJ_PATTERN = Object.keys(STATUS_ADJECTIVES).join('|')

function renderTargetClause(text, options = {}) {
  const raw = clean(text)
  if (!raw) return null

  const phrase = PHRASE_INDEX.get(raw.toLowerCase())
  if (phrase) return phrase

  let match

  // "X other than self" — peel the qualifier and render the head.
  match = /^(.+?)\s+other than self$/i.exec(raw)
  if (match) {
    const head = renderTargetClause(match[1])
    if (head) return `${head} ${isPlural(head) ? 'autres que soi' : 'autre que soi'}`
  }

  // "Self and ally X" / "Self, Ally X"
  match = /^self\s+and\s+ally\s+(.+)$/i.exec(raw)
  if (match) {
    const rest = renderTargetClause(`Ally ${match[1]}`)
    if (rest) return `Soi-même et ${withArticle(rest)}`
  }

  // "X vs Y" — a matchup qualifier on an otherwise ordinary selector.
  match = /^(.+?)\s+vs\s+(.+)$/i.exec(raw)
  if (match) {
    const head = renderTargetClause(match[1])
    const target = against(match[2]) || against(capitalize(match[2]))
    if (head && target) return `${head} contre ${target}`
  }

  // "1 poisoned enemy [General]" / "All poisoned enemy [General]"
  match = new RegExp(`^(\\d+|All)\\s+(${STATUS_ADJ_PATTERN})\\s+enem(?:y|ies)\\s*(.*)$`, 'i').exec(raw)
  if (match) {
    const adjective = STATUS_ADJECTIVES[match[2].toLowerCase()]
    const all = /^all$/i.test(match[1])
    const count = all ? null : Number(match[1])
    const head = scoped('enemy', match[3], { all, count })
    if (head) {
      const phrase = words(head, count === 1 ? adjective.m : adjective.p)
      return all ? phrase : `${count} ${lowerFirstArticle(phrase)}`
    }
  }

  // "1 enemy [General]" / "3 enemy [General]" / "2 enemy [Siege Weapon]"
  match = /^(\d+)\s+enemy\s+(.+)$/i.exec(raw)
  if (match) {
    const count = Number(match[1])
    const head = scoped('enemy', match[2], { count })
    if (head) return `${count} ${head.charAt(0).toLowerCase()}${head.slice(1)}`
  }

  // "1 [Qin] enemy" — the tag precedes the scope word.
  match = /^(\d+)\s+((?:\[[^\]]+\]\s*)+)enemy$/i.exec(raw)
  if (match) {
    const count = Number(match[1])
    const head = scoped('enemy', match[2], { count })
    if (head) return `${count} ${head.charAt(0).toLowerCase()}${head.slice(1)}`
  }

  // "Surviving ally [Chu]" / "Surviving ally Moubu"
  match = /^surviving\s+(.+)$/i.exec(raw)
  if (match) {
    const head = renderTargetClause(match[1])
    if (head) {
      const agreement = isPlural(head)
        ? 'survivants'
        : /^(Alliée|Ennemie)\b/.test(head) ? 'survivante' : 'survivant'
      return `${head} ${agreement}`
    }
  }

  // "All ally [General]" / "All enemy [General]" / "Other ally [Cavalry]"
  match = new RegExp(`^(${SCOPES})\\s*(.*)$`, 'i').exec(raw)
  if (match) {
    const parts = scopeParts(match[1])
    const head = scoped(parts.side, match[2], { ...parts, ...options })
    if (head) return head
  }

  // A bare tag, group or proper name.
  return bareOperand(raw)
}

/** "with highest ATK" / "with lowest remaining HP", appended to a selector. */
function renderSuperlativeTail(text) {
  const match = /^with\s+(highest|lowest)\s+(.+)$/i.exec(clean(text))
  if (!match) return null
  const stat = lookupStat(match[2])
  if (!stat) return null
  return `avec ${SUPERLATIVE[match[1].toLowerCase()]} ${stat.de}`
}

export function renderFrenchTarget(value) {
  const raw = clean(value)
  if (!raw) return value
  if (hasUnknownTags(raw)) return value

  const phrase = PHRASE_INDEX.get(raw.toLowerCase())
  if (phrase) return phrase

  // A selector may carry a superlative tail: "1 enemy [General] with highest ATK".
  const superlative = /^(.+?)\s+(with\s+(?:highest|lowest)\s+.+)$/i.exec(raw)
  if (superlative) {
    // A highest/lowest selector chooses one unit unless the source gives an
    // explicit count ("3 enemy ... with lowest ATK").
    const explicitCount = /^\d+\s/.test(superlative[1])
    const head = renderTargetClause(superlative[1], explicitCount ? {} : { count: 1 })
    const tail = renderSuperlativeTail(superlative[2])
    if (head && tail) return `${head} ${tail}`
  }

  const segments = raw.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean)
  if (segments.length === 1) return renderTargetClause(raw) || value

  const rendered = segments.map((segment) => renderTargetClause(segment))
  if (rendered.some((part) => part == null)) return value
  return rendered.join(SLASH)
}

// ── Condition rendering ─────────────────────────────────────────────────────

const COMPARATOR = /^(.+?)\s*(<=|>=|<|>|≤|≥|=)\s*(.+)$/

/** "Own HP < 90%" / "Ally Soujin's remaining HP < 70%". */
function renderComparison(text) {
  const match = COMPARATOR.exec(clean(text))
  if (!match) return null
  const operand = clean(match[1])
  const value = frenchNumber(clean(match[3]))

  const own = /^own\s+(.+)$/i.exec(operand)
  if (own) {
    const stat = lookupStat(own[1])
    if (stat) return `${capitalize(bare(stat.le))} de l’unité ${match[2]} ${value}`
  }

  // "Enemy [General]'s HP" / "Other ally [Qin] [General]' HP"
  const possessive = /^(.+?)['’]s?\s+(.+)$/.exec(operand)
  if (possessive) {
    const stat = lookupStat(possessive[2])
    const owner = renderTargetClause(possessive[1])
    if (stat && owner) return `${capitalize(stat.le)} ${possessiveOf(owner)} ${match[2]} ${value}`
  }

  // "Ally [Cavalry] HP ≤ 50%"
  const split = splitTrailingStat(operand)
  if (split) {
    const owner = renderTargetClause(split.head)
    if (owner) return `${capitalize(split.stat.le)} ${possessiveOf(owner)} ${match[2]} ${value}`
  }
  return null
}

function renderConditionPart(text) {
  const raw = clean(text)
  if (!raw) return null

  const phrase = PHRASE_INDEX.get(raw.toLowerCase())
  if (phrase) return phrase

  let match

  // "X and Y" at clause level, e.g. "… with highest DEF and own HP > 90%".
  match = /^(.+?)\s+and\s+(own\s+.+|surviving)$/i.exec(raw)
  if (match) {
    const head = renderConditionPart(match[1])
    const tail = renderConditionPart(match[2])
    if (head && tail) return `${head} et ${lowerFirstArticle(tail)}`
  }

  // "When passing Slope terrain" / "When passing terrain [Ambush]" /
  // "When passing through Ambush terrain"
  match = /^when\s+passing\s+(?:through\s+)?(?:terrain\s+)?(.+?)(?:\s+terrain)?$/i.exec(raw)
  if (match) {
    const tag = tagOf(match[1])
    if (tag && tag.kind === 'terrain') return `En empruntant ${tag.pass || `un terrain ${tag.of}`}`
  }

  // "When ally Makou is alive" / "When enemy [Archer] are alive". Preserve
  // the source number: a singular selector must not become every archer.
  match = /^when\s+(.+?)\s+(is|are)\s+alive$/i.exec(raw)
  if (match) {
    const who = renderConditionSelector(match[1], /^is$/i.test(match[2]) ? { count: 1 } : {})
    if (who) return `Quand ${withArticle(who)} ${isPlural(who) ? 'sont' : 'est'} en vie`
  }

  // "When ally Kaine is present" / "When feared enemies are present"
  match = /^when\s+(.+?)\s+(is|are)\s+present$/i.exec(raw)
  if (match) {
    const who = renderConditionSelector(match[1], /^is$/i.test(match[2]) ? { count: 1 } : {})
    if (who) return `En présence ${withDe(who)}`
  }
  match = /^when\s+(.+?)\s+present$/i.exec(raw)
  if (match) {
    const who = renderConditionSelector(match[1])
    if (who) return `En présence ${withDe(who)}`
  }

  // "When Attacking, when enemy [Qin] alive" — a lowercase inner "when".
  match = /^when\s+(.+?)\s+alive$/i.exec(raw)
  if (match) {
    const who = renderConditionSelector(match[1])
    if (who) return `Quand ${withArticle(who)} ${isPlural(who) ? 'sont' : 'est'} en vie`
  }

  // "Per ally [Cavalry] [General]" / "Per other ally Kanki Army member"
  match = /^per\s+(.+)$/i.exec(raw)
  if (match) {
    const who = renderConditionSelector(match[1].replace(/\s+members?$/i, ''), { count: 1 })
    if (who) return `Par ${lowerFirstArticle(who)}`
  }

  // "From the 170% Damage above" / "From the 60% Damage"
  match = new RegExp(`^from\\s+(?:the\\s+)?(${VALUE})\\s+damage(\\s+above)?$`, 'i').exec(raw)
  if (match) return `À partir des dégâts de ${match[1]}${match[2] ? ' ci-dessus' : ''}`

  // A comparison such as "Own HP < 90%".
  const comparison = renderComparison(raw)
  if (comparison) return comparison

  // "<selector> with highest ATK"
  match = /^(.+?)\s+(with\s+(?:highest|lowest)\s+.+)$/i.exec(raw)
  if (match) {
    const explicitCount = /^\d+\s/.test(match[1])
    const head = renderConditionSelector(match[1], explicitCount ? {} : { count: 1 })
    const tail = renderSuperlativeTail(match[2])
    if (head && tail) return `${head} ${tail}`
  }

  // "Enemy [Qin] present" / "Feared enemies present"
  match = /^(.+?)\s+present$/i.exec(raw)
  if (match) {
    const who = renderConditionSelector(match[1])
    if (who) return `${who} ${isPlural(who) ? 'présents' : 'présent'}`
  }

  // "Other ally [Chu] alive" / "Enemy [General] alive"
  match = /^(.+?)\s+(?:members?\s+)?alive$/i.exec(raw)
  if (match) {
    const who = renderConditionSelector(match[1])
    if (who) return `${who} en vie`
  }

  // "vs Qin [General]" — a bare matchup qualifier.
  match = /^vs\s+(.+)$/i.exec(raw)
  if (match) {
    const target = against(match[1]) || renderConditionSelector(match[1])
    if (target) return `Contre ${target.charAt(0).toLowerCase()}${target.slice(1)}`
  }

  return renderConditionSelector(raw)
}

/**
 * A noun phrase inside a condition: everything a target can be, plus the
 * status-participle selectors ("Poisoned enemy", "Feared enemies") and the
 * unscoped "Other [Mountain Folk]" / "Other [Zhao] ally" shapes.
 */
function renderConditionSelector(text, options = {}) {
  // "Hi Shin Unit member" names the unit, not a separate noun.
  const raw = clean(text).replace(/\s+members?$/i, '')
  if (!raw) return null
  // "Per …" is distributive, so its operand reads in the singular.
  const { count = null } = options

  const phrase = PHRASE_INDEX.get(raw.toLowerCase())
  if (phrase) return phrase

  let match

  // "defeated ally [General]" — the participle leads in English, trails in French.
  match = /^defeated\s+(.+)$/i.exec(raw)
  if (match) {
    const head = renderConditionSelector(match[1], options)
    if (head) return `${head} ${isPlural(head) ? 'vaincus' : 'vaincu'}`
  }

  // "Poisoned enemy" / "Feared enemies" / "Confused enemy [General]"
  match = new RegExp(`^(${STATUS_ADJ_PATTERN})\\s+enem(y|ies)\\s*(.*)$`, 'i').exec(raw)
  if (match) {
    const adjective = STATUS_ADJECTIVES[match[1].toLowerCase()]
    const plural = /ies$/i.test(match[2])
    const head = scoped('enemy', match[3], { count: plural ? null : 1 })
    if (head) return words(head, plural ? adjective.p : adjective.m)
  }

  // "Other [Mountain Folk]" / "Other [Zhao] ally" — the scope word is implied
  // or trails the tag.
  match = /^other\s+((?:\[[^\]]+\]\s*)+)(?:ally)?$/i.exec(raw)
  if (match) {
    const head = scoped('ally', match[1], { other: true, count })
    if (head) return head
  }

  // "[Qin] enemy" / "[Qin] [General] enemy"
  match = /^((?:\[[^\]]+\]\s*)+)(enemy|ally)$/i.exec(raw)
  if (match) {
    const head = scoped(/enemy/i.test(match[2]) ? 'enemy' : 'ally', match[1], { count })
    if (head) return head
  }

  // "Ally [Cavalry] [General]" and friends, in the number the frame asks for.
  match = new RegExp(`^(${SCOPES})\\s*(.*)$`, 'i').exec(raw)
  if (match && count != null) {
    const parts = scopeParts(match[1])
    const head = scoped(parts.side, match[2], { ...parts, count })
    if (head) return head
  }

  // "Enemy" / "Enemy [General]" and the ally forms, via the target renderer.
  const rendered = renderTargetClause(raw)
  if (rendered) return rendered

  // A named group used bare: "Hi Shin Unit enemy" handled above; here a
  // group or general on its own.
  return bareOperand(raw)
}

/** "Les cavaliers alliés" -> "les cavaliers alliés" after "Quand". */
function lowerFirstArticle(text) {
  // Keep initialisms such as PV intact when a condition follows a comma or
  // conjunction; "pV" is neither French nor a valid game label.
  if (/^[A-Z]{2,}(?:\b|\s)/.test(text)) return text
  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`
}

/** "Allié Renpa" -> "l’allié Renpa"; "Cavaliers alliés" -> "les cavaliers alliés". */
function withArticle(text) {
  const lower = lowerFirstArticle(text)
  if (/^tous les /.test(lower)) return lower
  if (/^alli[ée]e?\s/.test(lower)) return `l’${lower}`
  if (/^ennemi(?:e)?\s/.test(lower)) return `l’${lower}`
  if (isPlural(lower)) return `les ${lower}`
  if (/^(porte|unité|armée)\b/.test(lower)) return `une ${lower}`
  return `un ${lower}`
}

/** "Allié Kaine" -> "de l’allié Kaine"; "Ennemis Qin" -> "d’ennemis Qin". */
function withDe(text) {
  const lower = lowerFirstArticle(text)
  if (/^(allié|alliés|autre|autres)/.test(lower)) return `de l’${lower}`.replace('de l’alliés', 'des alliés').replace('de l’autres', 'des autres')
  if (/^[aeiouéèêh]/i.test(lower)) return `d’${lower}`
  return `de ${lower}`
}

/**
 * A whole condition value with its trailing "(…)" qualifier handled.
 * @returns {string|null} French, or null when nothing matched.
 */
function renderConditionValue(raw) {
  const phrase = PHRASE_INDEX.get(raw.toLowerCase())
  if (phrase) return phrase
  const { body, qualifier } = splitQualifier(raw)
  const rendered = renderConditionExpression(body)
  if (!rendered) return null
  return qualifier ? `${rendered} (${qualifier})` : rendered
}

export function renderFrenchCondition(value) {
  const raw = clean(value)
  if (!raw) return value
  if (hasUnknownTags(raw)) return value
  const rendered = renderConditionValue(raw)
  return rendered ? frenchNumber(rendered) : value
}

function renderConditionExpression(raw) {
  // Conditions chain with commas: "When Garrisoning, enemy [General] with …".
  const parts = raw.split(/(?<!\d)\s*,\s*(?!\d)/).map((s) => s.trim()).filter(Boolean)
  const rendered = parts.map((part) => renderConditionPart(part))
  if (rendered.some((part) => part == null)) return null
  return rendered
    .map((part, index) => (index === 0 ? part : lowerFirstArticle(part)))
    .join(', ')
}

// ── Duration rendering ──────────────────────────────────────────────────────

export function renderFrenchDuration(value) {
  const raw = clean(value)
  if (!raw) return value
  let match = /^(\d+)\s+turns?$/i.exec(raw)
  if (match) return `${match[1]} ${Number(match[1]) > 1 ? 'tours' : 'tour'}`
  match = /^(\d+)\s+times?$/i.exec(raw)
  if (match) return `${match[1]} fois`
  match = /^(\d+)\s+attacks?$/i.exec(raw)
  if (match) return `${match[1]} ${Number(match[1]) > 1 ? 'attaques' : 'attaque'}`
  return value
}

// ── Short label lookup ──────────────────────────────────────────────────────

/**
 * Translate a short standalone label — a faction, unit type, stat or status
 * name as used by filter chips and buff tables. Returns null when unknown so
 * callers can fall back to the English label.
 */
export function renderFrenchTerm(value) {
  const raw = clean(value)
  if (!raw) return null

  // Compact labels emitted by the buff parser carry no percentage, so they
  // cannot use the full effect renderer.
  const directionalResistance = /^(.+?)\s+(Up|Down)\s+Resistance$/i.exec(raw)
  if (directionalResistance) {
    const stat = lookupStat(directionalResistance[1])
    const dir = directionOf(directionalResistance[2])
    if (stat && dir) return `Résistance ${dir === 'up' ? 'à la hausse' : 'à la baisse'} ${stat.de}`
  }

  const resistance = /^(.+?)\s+Resistance$/i.exec(raw)
  if (resistance) {
    const status = lookupStatus(resistance[1])
    if (status) return `Résistance ${status.a}`
    const stat = lookupStat(resistance[1])
    if (stat) return `Résistance ${stat.a}`
  }

  const inflictionRate = /^(.+?)\s+Infliction Rate$/i.exec(raw)
  if (inflictionRate) {
    const status = lookupStatus(inflictionRate[1])
    if (status) return `Chance d’infliger ${status.def}`
  }

  const repairStat = /^(\[[^\]]+\])\s+repair\s+(.+)$/i.exec(raw)
  if (repairStat) {
    const tag = tagOf(repairStat[1])
    const stat = lookupStat(repairStat[2])
    if (tag && stat) return `${capitalize(direct(stat.de))} pour la réparation des ${tag.p}`
  }

  const scopedStat = /^(?:(\d+)\s+)?(\[[^\]]+\])\s+(.+)$/i.exec(raw)
  if (scopedStat) {
    const tag = tagOf(scopedStat[2])
    const stat = lookupStat(scopedStat[3])
    if (tag && stat) return `${capitalize(direct(stat.de))} — ${tag.p}`
  }

  const known = PHRASE_INDEX.get(raw.toLowerCase())
  if (known) return known
  const tag = TAG_INDEX.get(raw.toLowerCase())
  if (tag) return capitalize(tag.label || tag.p)
  const status = STATUS_INDEX.get(raw.toLowerCase())
  if (status) return status.label
  const group = GROUP_INDEX.get(raw.toLowerCase())
  if (group) return capitalize(group.name)
  return statLabel(lookupStat(raw))
}

/**
 * Generic entry point for call sites where the field type is not known.
 * Tries the term lookup, then each structured renderer, and finally returns
 * the original English unchanged.
 */
export function renderFrenchText(value) {
  const raw = clean(value)
  if (!raw) return value
  if (hasUnknownTags(raw)) return value

  const term = renderFrenchTerm(raw)
  if (term) return frenchNumber(term)

  const duration = renderFrenchDuration(raw)
  if (duration !== raw) return duration

  const condition = renderConditionValue(raw)
  if (condition) return frenchNumber(condition)

  const effect = renderEffectClause(raw)
  if (effect) return frenchNumber(effect)

  const target = renderFrenchTarget(raw)
  if (target !== raw) return target

  return value
}
