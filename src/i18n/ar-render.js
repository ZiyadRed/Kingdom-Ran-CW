/**
 * Semantic Arabic renderer for Kingdom Ran game data.
 *
 * WHY THIS EXISTS
 * ---------------
 * The previous implementation translated dynamic effect text by substituting
 * English words for Arabic words one at a time and keeping English word order.
 * Arabic does not work that way: `ATK Up 20%` became `الهجوم زيادة 20%`
 * ("the-attack increase"), and `Max HP Up 100%` became
 * `الحد الأقصى الصحة زيادة 100%`, which is not valid Arabic at all.
 *
 * This module instead RECOGNISES a semantic pattern, extracts its operands and
 * renders a complete, grammatical Arabic construction:
 *
 *     recognise pattern -> extract operands -> build natural Arabic
 *
 * Precedence, highest first:
 *   1. exact canonical phrase (whole string)
 *   2. recognised semantic pattern
 *   3. context-specific term lookup
 *   4. safe structured partial rendering
 *   5. the original English, returned unchanged
 *
 * Rule 5 is deliberate: an untranslated English string is a known, honest
 * fallback, whereas a half-substituted string is broken Arabic. This module
 * never emits word-by-word output.
 *
 * Numbers pass through verbatim so Arabic pages keep Western digits (0-9),
 * matching the game client and the rest of the site.
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
} from './ar-lexicon.js'
import { AR_CHARACTER_NAMES, canonicalCharacterName } from './ar-character-names.js'

const SPACE = String.fromCharCode(32)
const SLASH = String.fromCharCode(32, 47, 32)
const PLUS = String.fromCharCode(32, 43, 32)

// ── Grammar helpers ─────────────────────────────────────────────────────────

/**
 * Arabic number agreement.
 *
 * Arabic counts in four shapes, not two:
 *   1        -> singular + واحدة          "جولة واحدة"
 *   2        -> dual                        "جولتان"
 *   3..10    -> numeral + broken plural     "3 جولات"
 *   0, 11+   -> numeral + singular (tamyiz) "12 جولة"
 *
 * @param {number} n
 * @param {{one:string,two:string,few:string,many:string}} forms
 */
export function arCount(n, forms) {
  if (n === 1) return forms.one
  if (n === 2) return forms.two
  if (n >= 3 && n <= 10) return `${n} ${forms.few}`
  return `${n} ${forms.many}`
}

/**
 * Attach the preposition لِ to a noun.
 *
 * The article's alif elides: لِ + الصحة -> للصحة (never لالصحة). An ordinary
 * Arabic word is joined directly (لِ + عدو -> لعدو). The tatweel form لـ is
 * reserved for a Latin token, which cannot be joined to an Arabic letter.
 */
export function lamOf(noun) {
  if (!noun) return ''
  if (noun.startsWith('ال')) return `ل${noun.slice(1)}`
  return /^[؀-ۿ]/.test(noun) ? `ل${noun}` : `لـ${noun}`
}

/**
 * Make a single-word noun definite. Multi-word nouns are already a genitive
 * construct (نقطة تفتيش) and must not take an article on the first word.
 */
export function definite(noun) {
  if (!noun || noun.startsWith('ال') || noun.includes(SPACE)) return noun
  return `ال${noun}`
}

/** Join Arabic items with و, which attaches to the next word without a space. */
export function joinAnd(items) {
  const parts = items.filter(Boolean)
  if (parts.length <= 1) return parts[0] || ''
  return parts.reduce((acc, item, i) => (i === 0 ? item : `${acc} و${item}`))
}

/** Join already-rendered Arabic fragments with a single space, skipping gaps. */
function words(...parts) {
  return parts.filter(Boolean).join(SPACE)
}

// ── Lookup helpers ──────────────────────────────────────────────────────────

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

/** Look up a stat, returning `{def, ind}` or null. Handles a leading "Max ". */
function lookupStat(raw) {
  const text = clean(raw).replace(/\s+/g, SPACE)
  if (!text) return null

  const direct = STAT_INDEX.get(text.toLowerCase())
  if (direct) return direct

  const max = /^max(?:imum)?\s+(.+)$/i.exec(text)
  if (max) {
    const base = STAT_INDEX.get(max[1].toLowerCase())
    if (base) {
      return { def: `الحد الأقصى ${lamOf(base.def)}`, ind: `حد أقصى ${lamOf(base.def)}` }
    }
  }
  return null
}

/**
 * Split "Renpa Army DEF" into `{head: "Renpa Army", stat: DEF}` by scanning
 * suffixes from the right, shortest first. A lazy regex group cannot do this:
 * it would swallow "Army" into the stat and then fail to resolve it.
 */
function splitTrailingStat(text) {
  const parts = clean(text).split(/\s+/)
  for (let i = parts.length - 1; i >= 1; i -= 1) {
    const stat = lookupStat(parts.slice(i).join(SPACE))
    if (stat) return { head: parts.slice(0, i).join(SPACE), stat }
  }
  return null
}

function lookupStatus(raw) {
  return STATUS_INDEX.get(clean(raw).replace(/^"|"$/g, '').toLowerCase()) || null
}

/**
 * Resolve a group phrase that may carry a trailing "member(s)" or a bare
 * unit-type word, e.g. "Hi Shin Unit member" or "Hi Shin Unit Shield".
 * @returns {{group:string, tag:string|null, member:boolean}|null}
 */
function lookupGroupPhrase(raw) {
  let text = clean(raw)
  if (!text) return null

  let member = false
  const trimmed = text.replace(/\s+members?$/i, '')
  if (trimmed !== text) { member = true; text = trimmed }

  const direct = lookupGroup(text)
  if (direct) return { group: direct, tag: null, member }

  const unit = /^(.+?)\s+(General|Infantry|Cavalry|Archer|Archers|Shield|Siege Weapon)$/i.exec(text)
  if (unit) {
    const group = lookupGroup(unit[1])
    const tag = TAG_INDEX.get(unit[2].toLowerCase())
    // "Hi Shin Unit [General]" is just the Hi Shin Unit — every CW unit is a
    // general, so repeating it adds nothing and reads as حليف من وحدة X الجنرالات.
    if (group && tag) return { group, tag: tag.sing === 'جنرال' ? null : tag.coll, member }
  }
  return null
}

function lookupGroup(raw) {
  return GROUP_INDEX.get(clean(raw).toLowerCase()) || null
}

/**
 * The source writes unit types and states as bracketed tokens — `[General]`,
 * `[Infantry]`. Those brackets are RanHQ's own parsing artifact, not game
 * wording: the Japanese source renders the same data as 「敵武将1名」 and
 * 「味方歩兵」 with no brackets at all. So Arabic drops them too and builds a
 * real phrase instead.
 *
 * Each tag carries the forms that needs: `coll` (definite collective, used
 * after من), `sing` (bare singular noun head) and counted one/two/few.
 */
function tagLabel(tag) {
  if (!tag) return null
  return tag.label || tag.coll
}

function tagOf(name) {
  return TAG_INDEX.get(clean(String(name).replace(/^\[|\]$/g, '')).toLowerCase()) || null
}

/** Translate `[General]` -> `الجنرالات`, leaving unknown tags untouched. */
function renderTags(text) {
  return String(text).replace(/\[([^\]]+)\]/g, (whole, inner) => {
    const hit = TAG_INDEX.get(inner.trim().toLowerCase())
    return hit ? hit.coll : whole
  }).replace(/\s{2,}/g, SPACE).trim()
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

/**
 * Pick the tag that should carry the noun. `[Archer] [General]` describes an
 * archer general, and since every CW unit is a general the specific type is
 * the informative one.
 */
function primaryTag(tags) {
  const unit = tags.find((t) => t.kind === 'unit' && t.sing !== 'جنرال')
  return unit || tags.find((t) => t.kind === 'unit') || tags[0] || null
}

/**
 * The genitive (iḍāfa) form of a scope + tag, for superlative selectors.
 * "Enemy [General] with highest ATK" reads best as جنرال العدو صاحب أعلى هجوم,
 * not جنرال من العدو ذو أعلى هجوم — a construct is what Arabic uses to say
 * "the enemy's general".
 */
function scopedTagsConstruct(scope, text) {
  const tags = tagsIn(text)
  const primary = primaryTag(tags)
  if (!primary || primary.kind !== 'unit') return null
  // A tanwin-kasr noun becomes its construct head before the scope noun.
  const head = primary.sing.replace(/ٍ$/, 'ي')
  if (scope === 'enemy') return `${head} العدو`
  if (scope === 'ally' || scope === 'otherAlly') return `${head} حليف`
  return null
}

/**
 * The plural of a scope + tag, for phrases that name a whole group:
 * "Enemy [General] ATK Down 40%" is خفض الهجوم لجنرالات العدو,
 * not خفض الهجوم لعدو الجنرالات — لعدو followed by a definite noun is not
 * a construct Arabic allows.
 */
function scopedTagsPlural(scopeKey, text) {
  const tags = tagsIn(text)
  const primary = primaryTag(tags)
  if (!primary || primary.kind !== 'unit') return null
  if (scopeKey === 'enemy' || scopeKey === 'allEnemy') {
    // الجنرالات heads a construct as جنرالات.
    return `${primary.coll.replace(/^ال/, '')} العدو`
  }
  return `${primary.coll} الحلفاء`
}

/**
 * A named general in effect text: resolve any alternate romanisation to the
 * archive's spelling, then show it in Arabic like the rest of the site.
 * Falls back to the Latin name if the map has no entry, so an unknown name
 * is still readable rather than dropped.
 */
function canonicalName(raw) {
  // The source quotes some names — Ally "Sho". Strip the quotes for the lookup;
  // an Arabic name does not need them, and keeping them left the name in Latin.
  const trimmed = String(raw).trim().replace(/^["'“”]+|["'“”]+$/g, '').trim()
  const canonical = canonicalCharacterName(CHARACTER_ALIASES[trimmed.toLowerCase()] || trimmed)
  return AR_CHARACTER_NAMES[canonical] || String(raw).trim()
}

const ALLY_HEAD = 'حليف '

/**
 * Turn a noun clause with a bare "alive" predicate into its verbal-noun form.
 *
 * Standalone, `عدو من السهامين على قيد الحياة` is fine. After عند it is not —
 * Arabic wants the verbal noun there (`عند بقاء عدو من السهامين حيًا`), which
 * is the shape the named-ally path already produces. Clauses that are already
 * verbal are returned untouched.
 */
const ALIVE_PREDICATE = ' على قيد الحياة'
function verbalizeAlive(clause) {
  if (!clause.endsWith(ALIVE_PREDICATE)) return clause
  const subject = clause.slice(0, -ALIVE_PREDICATE.length).trim()
  if (!subject || subject.startsWith('بقاء') || subject.startsWith('البقاء')) return clause
  return `بقاء ${subject} حيًا`
}

const COUNT_KEYS = { 1: 'one', 2: 'two' }

/** "1 [General]" -> جنرال واحد · "3 [General]" -> 3 جنرالات */
function countedTag(n, tag) {
  if (!tag) return null
  const key = COUNT_KEYS[n]
  if (key && tag[key]) return tag[key]
  if (n >= 3 && n <= 10 && tag.few) return `${n} ${tag.few}`
  return tag.few ? `${n} ${tag.few}` : null
}

/**
 * A scope plus its tags as natural Arabic.
 * "Ally [Infantry]" -> حليف من المشاة · "Enemy [General]" -> جنرال من العدو
 */
function scopedTags(scope, text) {
  const tags = tagsIn(text)
  if (!tags.length) return null
  const primary = primaryTag(tags)
  if (!primary) return null
  const group = tags.find((t) => t.kind === 'group')
  const state = tags.find((t) => t.kind === 'state') || group
  const stateOf = (tag) => (tag && tag.kind === 'group' ? `وحدة ${tag.coll}` : tag && tag.coll)
  const isGeneral = primary.kind === 'unit' && primary.sing === 'جنرال'

  const qualify = (base) => (state && state !== primary ? words(base, `من ${stateOf(state)}`) : base)

  if (scope === 'ally' || scope === 'otherAlly') {
    const other = scope === 'otherAlly' ? 'آخر' : null
    // جنرال حليف reads better than حليف من الجنرالات, because in CW every unit
    // is a general and the tag is not narrowing anything.
    // آخر qualifies the ally, so it sits on the noun: حليف آخر من الفرسان,
    // not حليف من الفرسان آخر.
    if (isGeneral && !state) return words('جنرال حليف', other)
    if (isGeneral && state) return words('حليف', other, `من ${stateOf(state)}`)
    return words('حليف', other, `من ${primary.coll}`, state && state !== primary ? `من ${stateOf(state)}` : null)
  }
  if (scope === 'enemy') {
    if (isGeneral && !state) return 'جنرال من العدو'
    if (isGeneral && state) return `جنرال من ${stateOf(state)} لدى العدو`
    return qualify(words('عدو', `من ${primary.coll}`))
  }
  if (scope === 'allEnemy') {
    if (isGeneral && !state) return 'جميع جنرالات العدو'
    return qualify(words('جميع الأعداء', `من ${primary.coll}`))
  }
  if (scope === 'allAlly') {
    if (isGeneral && !state) return 'جميع الجنرالات الحلفاء'
    return qualify(words('جميع الحلفاء', `من ${primary.coll}`))
  }
  return null
}

/** Unknown bracket operands must fail closed instead of producing mixed output. */
function hasUnknownTags(text) {
  const tags = String(text).matchAll(/\[([^\]]+)\]/g)
  for (const match of tags) {
    if (!TAG_INDEX.has(match[1].trim().toLowerCase())) return true
  }
  return false
}

/** Translate a trailing parenthetical qualifier, e.g. "(effective even ...)". */
function renderQualifier(inner) {
  const hit = QUALIFIER_INDEX.get(clean(inner).toLowerCase())
  if (hit) return hit
  const max = /^max\s+([\d.,]+%?)$/i.exec(clean(inner))
  if (max) return `بحد أقصى ${max[1]}`
  return null
}

/**
 * Split a trailing "(...)" qualifier off a string.
 * @returns {{body:string, qualifier:string|null}}
 */
function splitQualifier(text) {
  const match = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(text)
  if (!match) return { body: text, qualifier: null }
  const rendered = renderQualifier(match[2])
  if (!rendered) return { body: text, qualifier: null }
  return { body: match[1].trim(), qualifier: rendered }
}

// A numeric operand: 20%, 5.5%, 50,000, 100. Commas are grouping separators,
// never arbitrary punctuation, so malformed near-misses fail closed.
const VALUE = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?`

/**
 * Split a compound value into clauses on a comma or a slash.
 *
 * A separator inside a number must NOT split it: "HP Recovery 50,000" is one
 * clause, not "HP Recovery 50" plus "000". The word "and" is handled per field,
 * because it usually joins operands rather than whole clauses
 * ("Ally [Infantry] and [Cavalry]" is a single target).
 */
function splitClauses(text) {
  return text.split(/(?<!\d)\s*[,/]\s*(?!\d)/).map((s) => s.trim()).filter(Boolean)
}

/** Trailing numeric operand of a clause, e.g. "30%" in "DEF Up 30%". */
function trailingValue(text) {
  const match = new RegExp(`\\s(${VALUE})$`).exec(text)
  return match ? match[1] : null
}

// ── Effect rendering ────────────────────────────────────────────────────────

const DIRECTION_WORDS = {
  up: 'up', increase: 'up',
  down: 'down', decrease: 'down', reduction: 'down',
}

function directionOf(word) {
  return DIRECTION_WORDS[clean(word).toLowerCase()] || null
}

const SCOPES = 'Ally|Other ally|Enemy|All ally|All enemy'

/**
 * Render one atomic effect clause.
 * @returns {string|null} Arabic, or null when the clause is not recognised.
 */
function renderEffectClause(text) {
  const raw = clean(text)
  if (!raw) return null
  const { body, qualifier } = splitQualifier(raw)
  const rendered = renderEffectBody(body)
  if (!rendered) return null
  return qualifier ? `${rendered} (${qualifier})` : rendered
}

function renderEffectBody(body) {
  // Whole-string canonical phrases first, so a canonical name is never taken
  // apart by a lower-level rule.
  const phrase = PHRASE_INDEX.get(body.toLowerCase())
  if (phrase) return phrase
  const group = lookupGroup(body)
  if (group) return group

  let match

  // "% of Remaining HP Damage 20%"
  match = new RegExp(`^%\\s*of\\s+remaining\\s+HP\\s+Damage\\s+(${VALUE})$`, 'i').exec(body)
  if (match) return `ضرر بنسبة ${match[1]} من الصحة المتبقية`

  // "2-Hit 100% Damage"
  match = new RegExp(`^(\\d+)-Hit\\s+(${VALUE})\\s+Damage$`, 'i').exec(body)
  if (match) {
    const hits = arCount(Number(match[1]), {
      one: 'ضربة واحدة', two: 'ضربتان', few: 'ضربات', many: 'ضربة',
    })
    return `${hits} بضرر ${match[2]}`
  }

  // "100% Damage 2 times" / "80% Damage each" / "150% Damage to equipment"
  match = new RegExp(`^(${VALUE})\\s+Damage\\s+(\\d+)\\s+times?$`, 'i').exec(body)
  if (match) {
    const times = arCount(Number(match[2]), {
      one: 'مرة واحدة', two: 'مرتان', few: 'مرات', many: 'مرة',
    })
    return `ضرر ${match[1]} (${times})`
  }
  match = new RegExp(`^(${VALUE})\\s+Damage\\s+each$`, 'i').exec(body)
  if (match) return `ضرر ${match[1]} لكل هدف`
  match = new RegExp(`^(${VALUE})\\s+Damage to equipment$`, 'i').exec(body)
  if (match) return `ضرر ${match[1]} على المعدات`

  // "150% Damage" — the single most common effect in the corpus.
  match = new RegExp(`^(${VALUE})\\s+Damage$`, 'i').exec(body)
  if (match) return `ضرر ${match[1]}`

  // "160% Damage + HP Drain 60%" — two effects joined by a plus.
  if (body.includes('+')) {
    const plusParts = body.split('+').map((s) => s.trim()).filter(Boolean)
    if (plusParts.length > 1) {
      const rendered = plusParts.map((part) => renderEffectBody(part))
      if (!rendered.some((p) => p == null)) return rendered.join(PLUS)
    }
  }

  // Anti-X families. X may be a bracket tag OR a multi-word group name, and the
  // clause may carry its own scope, so the stat is found by scanning suffixes
  // from the right rather than with a lazy regex group.
  //   "Anti-[Cavalry] ATK Up 5%"
  //   "Anti-Renpa Army DEF Down 30%"
  //   "[Shield] Anti-[Cavalry] DEF Up 25%"
  //   "Ally [Archer] Anti-[Infantry] DEF Up 20%"
  match = new RegExp(
    `^(?:(${SCOPES})\\s+)?(\\[[^\\]]+\\]\\s+)?Anti-(.+)\\s+(Up|Down)\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const dir = directionOf(match[4])
    const split = splitTrailingStat(match[3])
    if (dir && split) {
      const against = lookupGroup(split.head) || renderTags(split.head)
      const scope = match[1] ? PHRASE_INDEX.get(match[1].toLowerCase()) : null
      const scopeTag = match[2] ? renderTags(match[2].trim()) : null
      const who = scope ? words(lamOf(scope), scopeTag) : scopeTag
      return words(DIRECTION[dir], split.stat.def, who, `ضد ${against}`, match[5])
    }
  }

  // "[Siege Weapon] repair Ore Consumption Down 2.7%"
  match = new RegExp(`^(\\[[^\\]]+\\])\\s+repair\\s+(.+?)\\s+(Up|Down)\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const stat = lookupStat(match[2])
    const dir = directionOf(match[3])
    if (stat && dir) return `${DIRECTION[dir]} ${stat.def} لإصلاح ${renderTags(match[1])} ${match[4]}`
  }

  // "DEF Up vs Cavalry 20%"
  match = new RegExp(`^(.+?)\\s+(Up|Down)\\s+vs\\s+(.+?)(?:\\s+(${VALUE}))?$`, 'i').exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) {
      const against =
        TAG_INDEX.get(clean(match[3]).toLowerCase())?.coll || lookupGroup(match[3]) || renderTags(match[3])
      return words(DIRECTION[dir], stat.def, `ضد ${against}`, match[4])
    }
  }

  // "Confusion Infliction Rate Up 20%"
  match = new RegExp(`^"?(.+?)"?\\s+Infliction\\s+Rate\\s+(Up|Down)\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    const dir = directionOf(match[2])
    if (status && dir) return `${DIRECTION[dir]} معدل إلحاق ${status} ${match[3]}`
  }

  // "Confusion Infliction 100%" / "Provoke Infliction"
  match = new RegExp(`^"?(.+?)"?\\s+Infliction\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    if (status) return `إلحاق ${status} ${match[2]}`
  }
  match = /^"?(.+?)"?\s+Infliction$/i.exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    if (status) return `إلحاق ${status}`
  }

  // "Attack Down Resistance Up 40%" -> زيادة مقاومة خفض الهجوم 40%.
  // The guide's wording is مقاومة خفض الهجوم, so the debuff direction belongs to
  // the resisted thing, not to the resistance.
  match = new RegExp(
    `^(.+?)\\s+(Up|Down)\\s+Resistance(?:\\s+(Up|Down))?\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    const outer = directionOf(match[3] || 'up')
    if (stat && dir) return `${DIRECTION[outer]} مقاومة ${DIRECTION[dir]} ${stat.def} ${match[4]}`
  }

  // "Ally [Shield] "Poison" Resistance 60%" — scoped status resistance.
  match = new RegExp(
    `^(${SCOPES})\\s+(\\[[^\\]]+\\])\\s+"?(.+?)"?\\s+Resistance\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const status = lookupStatus(match[3])
    const scope = PHRASE_INDEX.get(match[1].toLowerCase())
    if (status && scope) {
      return `زيادة مقاومة ${status} ${lamOf(scope)} ${renderTags(match[2])} ${match[4]}`
    }
  }

  // "DEF Penetration Resistance 20%" / ""Betrayal" Resistance 35%"
  match = new RegExp(`^"?(.+?)"?\\s+Resistance(?:\\s+(Up|Down))?\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    const stat = status ? { def: status } : lookupStat(match[1])
    if (stat) {
      const dir = directionOf(match[2] || 'up')
      return `${DIRECTION[dir]} مقاومة ${stat.def} ${match[3]}`
    }
  }

  // "Ally [Shield] DEF Up 30%" — an effect carrying its own scope.
  match = new RegExp(
    `^(${SCOPES})\\s+(\\[[^\\]]+\\])\\s+(.+?)\\s+(Up|Down)\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const stat = lookupStat(match[3])
    const dir = directionOf(match[4])
    const scope = PHRASE_INDEX.get(match[1].toLowerCase())
    if (stat && dir && scope) {
      const scopeKey = /^all enemy$/i.test(match[1])
        ? 'allEnemy'
        : /enemy/i.test(match[1]) ? 'enemy' : 'ally'
      const group = hasUnknownTags(match[2]) ? null : scopedTagsPlural(scopeKey, match[2])
      if (group) return `${DIRECTION[dir]} ${stat.def} ${lamOf(group)} ${match[5]}`
      return `${DIRECTION[dir]} ${stat.def} ${lamOf(scope)} ${renderTags(match[2])} ${match[5]}`
    }
  }

  // "Ally [Shield] "Poison" 30%" — a status applied to a scoped ally.
  match = new RegExp(
    `^(${SCOPES})\\s+(\\[[^\\]]+\\])\\s+"?(.+?)"?\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const status = lookupStatus(match[3])
    const scope = PHRASE_INDEX.get(match[1].toLowerCase())
    if (status && scope) return `${status} ${lamOf(scope)} ${renderTags(match[2])} ${match[4]}`
  }

  // "[Infantry] ATK Up 20%" / "1 [Siege Weapon] ATK Up 20%"
  match = new RegExp(
    `^(?:\\d+\\s+)?(\\[[^\\]]+\\])\\s+(.+?)\\s+(Up|Down)\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const stat = lookupStat(match[2])
    const dir = directionOf(match[3])
    if (stat && dir) return `${DIRECTION[dir]} ${stat.def} ${renderTags(match[1])} ${match[4]}`
  }

  // "Damage Received significantly Down"
  match = /^(.+?)\s+significantly\s+(Up|Down)$/i.exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) return `${DIRECTION[dir]} ${stat.def} بدرجة كبيرة`
  }

  // "Max HP Up additional 50%" — the qualifier sits before the value.
  match = new RegExp(`^(.+?)\\s+(Up|Down)\\s+additional\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) return `${DIRECTION[dir]} ${stat.def} ${match[3]} (إضافي)`
  }

  // "ATK Up 20%" — the dominant family.
  match = new RegExp(
    `^(.+?)\\s+(Up|Down|Increase|Decrease|Reduction)\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) return `${DIRECTION[dir]} ${stat.def} ${match[3]}`
  }

  // "ATK Up" with no value of its own (the caller supplies one when merging).
  match = /^(.+?)\s+(Up|Down|Increase|Decrease|Reduction)$/i.exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) return `${DIRECTION[dir]} ${stat.def}`
  }

  // "Attack Immunity x3"
  match = /^(.+?)\s*[x×]\s*(\d+)$/i.exec(body)
  if (match) {
    const inner = renderEffectBody(match[1].trim())
    if (inner) return `${inner} ×${match[2]}`
  }

  // "Guard 60%" / ""Illusion"35%" / "HP Recovery 20%" — a status or a stat
  // with a bare value and no direction word. The space is optional because the
  // source contains `"Illusion"35%`.
  match = new RegExp(`^"?(.+?)"?\\s*(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    if (status) return `${status} ${match[2]}`
    const stat = lookupStat(match[1])
    if (stat) return `${stat.def} ${match[2]}`
  }

  // Bare status names: "Sure Hit", "Provoke", "Attack Nullification".
  const bareStatus = lookupStatus(body)
  if (bareStatus) return bareStatus

  return null
}

/**
 * Render a full effect value, handling compound clauses.
 *
 * "ATK Up, DEF Up 30%" shares one percentage across both stats and is merged
 * into a single natural phrase: زيادة الهجوم والدفاع بنسبة 30%.
 */
/**
 * Arabic states a proportional change with بنسبة: زيادة الهجوم بنسبة 20%,
 * not زيادة الهجوم 20%. Applied to the verbal-noun families that take a
 * percentage; raw damage stays terse (ضرر 150%) because that is how it is
 * actually said.
 */
const PROPORTIONAL = /^(زيادة|خفض|استعادة|امتصاص)(?=\s)/

function withRatio(text) {
  if (typeof text !== 'string' || !text) return text
  if (!PROPORTIONAL.test(text) || text.includes('بنسبة')) return text
  return text.replace(/(\s)(\d+(?:\.\d+)?%)/, '$1بنسبة $2')
}

export function renderArabicEffect(value) {
  const raw = clean(value)
  if (!raw) return value
  if (hasUnknownTags(raw)) return value

  // Exact compound effects must win before comma/slash segmentation; some
  // source rows use punctuation to list targets inside a single mechanic.
  const phrase = PHRASE_INDEX.get(raw.toLowerCase())
  if (phrase) return phrase

  const segments = splitClauses(raw)
  if (segments.length === 1) {
    const single = renderEffectClause(raw)
    return single ? withRatio(single) : value
  }

  const carried = trailingValue(segments[segments.length - 1])

  // When every clause is "{STAT} {same direction}", merge the stats into one
  // verbal-noun phrase instead of repeating زيادة/خفض for each.
  const heads = segments.map((segment) => {
    const direct = new RegExp(
      `^(.+?)\\s+(Up|Down|Increase|Decrease|Reduction)(?:\\s+${VALUE})?$`, 'i',
    ).exec(segment)
    return direct ? { stat: lookupStat(direct[1]), dir: directionOf(direct[2]) } : null
  })
  const segmentValues = segments.map(trailingValue)
  const sharesOneValue = segmentValues.every((value) => !value || value === carried)
  if (carried && sharesOneValue && heads.every((h) => h && h.stat && h.dir === heads[0].dir)) {
    return withRatio(`${DIRECTION[heads[0].dir]} ${joinAnd(heads.map((h) => h.stat.def))} ${carried}`)
  }

  // A shared frame may also sit on the final clause and apply to all of them:
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
  return rendered.map(withRatio).join(SLASH)
}

// ── Target rendering ────────────────────────────────────────────────────────

const ENEMY_FORMS = { one: 'عدو واحد', two: 'عدوان', few: 'أعداء', many: 'عدوًا' }

function renderTargetClause(text) {
  const raw = clean(text)
  if (!raw) return null

  const phrase = PHRASE_INDEX.get(raw.toLowerCase())
  if (phrase) return phrase

  let match

  // "1 poisoned enemy [General]" / "All poisoned enemy [General]"
  match = /^(\d+|All)\s+(poisoned|burned|feared|confused|paralysed|paralyzed)\s+enemy\s*(.*)$/i.exec(raw)
  if (match) {
    const adj = STATUS_ADJECTIVES[match[2].toLowerCase()]
    const tagText = clean(match[3])
    const tags = tagsIn(tagText)
    if (tags.length) {
      const primary = primaryTag(tags)
      const state = tags.find((tag) => tag.kind === 'state')
      if (/^all$/i.test(match[1])) {
        const scoped = scopedTags('allEnemy', tagText)
        return scoped ? words(scoped, adj.p) : null
      }
      const n = Number(match[1])
      const counted = countedTag(n, primary)
      if (!counted) return null
      const affected = words(counted, n === 1 ? adj.m : adj.p)
      return state && state !== primary
        ? `${affected} من ${state.coll} لدى العدو`
        : `${affected} من العدو`
    }
    const renderedTags = renderTags(tagText)
    if (/^all$/i.test(match[1])) return words('جميع الأعداء', adj.p, renderedTags)
    const n = Number(match[1])
    const head = n === 1 ? `عدو ${adj.m} واحد` : words(arCount(n, ENEMY_FORMS), adj.p)
    return words(head, renderedTags)
  }

  // "1 enemy [General]" -> جنرال واحد من العدو · "3 enemy [General]" -> 3 جنرالات من العدو
  match = /^(\d+)\s+enemy\s*((?:\[[^\]]+\]\s*)*)$/i.exec(raw)
  if (match) {
    const n = Number(match[1])
    const tags = tagsIn(match[2])
    if (!tags.length) return arCount(n, ENEMY_FORMS)
    const primary = primaryTag(tags)
    const state = tags.find((t) => t.kind === 'state')
    const counted = countedTag(n, primary)
    if (counted) {
      if (state && state !== primary) return `${counted} من ${state.coll} لدى العدو`
      return `${counted} من العدو`
    }
  }

  // "1 [Qin] enemy" — the tag precedes the noun in this row shape.
  match = /^(\d+)\s+(\[[^\]]+\])\s+enemy$/i.exec(raw)
  if (match) {
    const tag = tagOf(match[2])
    if (tag) return words(arCount(Number(match[1]), ENEMY_FORMS), `من ${tag.coll}`)
  }

  // "All enemy [General]" -> جميع جنرالات العدو
  match = /^All\s+(enemy|ally)\s*(.*)$/i.exec(raw)
  if (match) {
    const isEnemy = /enemy/i.test(match[1])
    const head = isEnemy ? 'جميع الأعداء' : 'جميع الحلفاء'
    const rest = clean(match[2])
    if (rest && !/^(\[[^\]]+\]\s*)*$/.test(rest)) {
      const phrase = lookupGroupPhrase(rest)
      if (phrase) return words(head, `من ${phrase.group}`, phrase.tag)
    }
    if (!rest) return head
    const scoped = scopedTags(isEnemy ? 'allEnemy' : 'allAlly', rest)
    if (scoped) return scoped
    return words(head, renderTags(rest))
  }

  // "[Siege Weapon] repair"
  match = /^(\[[^\]]+\])\s+repair$/i.exec(raw)
  if (match) return `إصلاح ${renderTags(match[1])}`

  // "Ally attack [Siege Weapon]" / "Ally defense [Siege Weapon]"
  match = /^Ally\s+(attack|defense)\s*(.*)$/i.exec(raw)
  if (match) {
    const noun = /attack/i.test(match[1]) ? 'هجوم' : 'دفاع'
    const rest = clean(match[2])
    // "Ally attack [Siege Weapon]" is the attack OF the allied siege weapons,
    // so the tag heads the construct: هجوم أسلحة الحصار الحليفة.
    const tag = rest ? primaryTag(tagsIn(rest)) : null
    if (tag) return `${noun} ${tag.coll} الحليفة`
    return words(`${noun} الحليف`, renderTags(rest))
  }

  // "Surviving ally [Chu]"
  match = /^Surviving\s+(.+)$/i.exec(raw)
  if (match) {
    const inner = renderTargetClause(match[1])
    if (inner) return `${inner} على قيد الحياة`
  }

  // "[Hishin] Unit" — a bracketed marker followed by its group noun.
  match = /^(\[[^\]]+\])\s+(Unit|Army|Squad)$/i.exec(raw)
  if (match) {
    const noun = { unit: 'وحدة', army: 'جيش', squad: 'وحدة' }[match[2].toLowerCase()]
    return `${noun} ${renderTags(match[1])}`
  }

  // "Six Great Generals of Qin"
  match = /^(.+?)\s+of\s+(.+)$/i.exec(raw)
  if (match) {
    const group = lookupGroup(match[1])
    const where = TAG_INDEX.get(clean(match[2]).toLowerCase())
    if (group && where) return `${group} في ${where.coll}`
  }

  // "Ally Kanki Army" / "Ally Hi Shin Unit [General]" / "Ally Yotanwa"
  match = /^(Other ally|Ally|Enemy)\s+(.+)$/i.exec(raw)
  if (match) {
    const head = PHRASE_INDEX.get(match[1].toLowerCase())
    let rest = clean(match[2])

    // A scope followed by nothing but tags is the commonest shape of all
    // ("Ally [Infantry]", "Enemy [General]"), and it is the one the brackets
    // made read like parser output.
    if (/^(\[[^\]]+\]\s*)+$/.test(rest) && !hasUnknownTags(rest)) {
      const scopeKey = /^other ally$/i.test(match[1])
        ? 'otherAlly'
        : /^ally$/i.test(match[1]) ? 'ally' : 'enemy'
      const scoped = scopedTags(scopeKey, rest)
      if (scoped) return scoped
    }

    // The buff engine deliberately normalizes targets to compact labels such
    // as "Enemy Archer" and "Enemy Qin". Treat those bare canonical tag names
    // exactly like their source-data forms ("Enemy [Archer]", "Enemy [Qin]")
    // so the summary never leaks a half-Arabic label such as "عدو Archer".
    const bareTag = TAG_INDEX.get(rest.toLowerCase())
    if (bareTag) {
      const scopeKey = /^other ally$/i.test(match[1])
        ? 'otherAlly'
        : /^ally$/i.test(match[1]) ? 'ally' : 'enemy'
      const scoped = scopedTags(scopeKey, `[${rest}]`)
      if (scoped) return scoped
    }

    // Trailing tags stay at the end of the Arabic phrase. A trailing
    // [General] is dropped: every CW unit is a general, so "Kanki Army
    // [General]" is just جيش Kanki, not جيش Kanki الجنرالات.
    const tags = []
    while (/\s*\[[^\]]+\]$/.test(rest)) {
      rest = rest.replace(/\s*(\[[^\]]+\])$/, (whole, tag) => {
        const entry = tagOf(tag)
        if (!entry) tags.unshift(renderTags(tag))
        else if (entry.sing !== 'جنرال') tags.unshift(entry.coll)
        return ''
      }).trim()
    }
    const tail = tags.join(SPACE)

    if (!rest) return words(head, tail)

    const phrase = lookupGroupPhrase(rest)
    if (phrase) {
      const noun = phrase.member ? `عضو من ${phrase.group}` : `من ${phrase.group}`
      return words(head, noun, phrase.tag, tail)
    }

    if (/^\[[^\]]+\]$/.test(rest)) return words(head, renderTags(rest), tail)

    // A scoped roster name is a direct apposition: حليف أوهون, not حليف من
    // أوهون. Resolve it before the generic tail renderer, which uses من for
    // groups and units.
    if (/^[A-Za-zÀ-ɏ"' .-]+$/.test(rest) && !/\b(and|or|with|than|besides|both)\b/i.test(rest)) {
      const name = canonicalName(rest)
      if (name !== rest) return words(head, name, tail)
    }

    // "Ally [Hishin] Unit" — the remainder is itself a renderable group.
    const inner = renderTargetTail(rest)
    if (inner) return words(head, `من ${inner}`, tail)

    return null
  }

  // A bare, known roster name is still a valid target. Unknown names keep the
  // fail-closed path because canonicalName returns them unchanged.
  const named = canonicalName(raw)
  if (named !== raw) return named

  return null
}

/**
 * Render a trailing member of a slash list that omits its head, e.g. the
 * "Ousen Army" of "Ally Gyokuhou Unit / Ousen Army", or a bare "[Wei]".
 */
function renderTargetTail(text) {
  const raw = clean(text)
  if (!raw) return null

  const full = renderTargetClause(raw)
  if (full) return full

  const other = /^Other\s+(.+)$/i.exec(raw)
  if (other) {
    const inner = renderTargetTail(other[1])
    return inner ? `${inner} آخر` : null
  }

  const group = lookupGroup(raw)
  if (group) return group
  if (/^(\[[^\]]+\]\s*)+$/.test(raw)) return renderTags(raw)
  return null
}

function renderTargetExpression(raw) {
  // A bare tag or tag list standing alone as the target.
  if (/^(\[[^\]]+\][,\s]*)+$/.test(raw)) return renderTags(raw).replace(/,/g, '،')

  // "Self, Ally [Cavalry]" / "Ally [Qin], [Zhao], and [Yan]" — comma lists use
  // the Arabic comma, and a trailing "and" becomes the attached waw.
  if (/,/.test(raw)) {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
    const rendered = parts.map((part, i) => {
      const tail = /^and\s+(.+)$/i.exec(part)
      const body = tail ? tail[1] : part
      const out = i === 0 ? renderTargetExpression(body) : (renderTargetExpression(body) || renderTargetTail(body))
      if (!out) return null
      return tail ? `و${out}` : out
    })
    if (!rendered.some((p) => p == null)) {
      return rendered.reduce((acc, part, i) => (i === 0 ? part : (part.startsWith('و') ? `${acc} ${part}` : `${acc}، ${part}`)))
    }
  }

  // "Enemy [Qin] or [Mountain Folk]" — an alternative rather than a list.
  const alternative = /^(.+?)\s+or\s+(.+)$/i.exec(raw)
  if (alternative) {
    const left = renderTargetExpression(alternative[1])
    const right = renderTargetExpression(alternative[2]) || renderTargetTail(alternative[2])
    if (left && right) return `${left} أو ${right}`
  }

  // "Ally [Cavalry] other than self"
  const excluded = /^(.*?)\s+other than self$/i.exec(raw)
  if (excluded) {
    const inner = renderTargetExpression(excluded[1])
    if (inner) return `${inner} عدا نفسه`
  }

  // "Self vs Qin" / "Enemy [General] vs cavalry"
  const versus = /^(.*?)\s+vs\s+(.+)$/i.exec(raw)
  if (versus) {
    const inner = renderTargetExpression(versus[1])
    const target = clean(versus[2])
    const against =
      TAG_INDEX.get(target.toLowerCase())?.coll ||
      lookupGroup(target) ||
      (/^\[[^\]]+\]$/.test(target) ? renderTags(target) : null)
    if (inner && against) return `${inner} ضد ${against}`
  }

  const direct = renderTargetClause(raw)
  if (direct) return direct

  // "Ally [Infantry] and [Cavalry]" / "Self and ally Renpa Army"
  const conjunction = /^(.+?)\s+and\s+(.+)$/i.exec(raw)
  if (conjunction) {
    const left = renderTargetExpression(conjunction[1])
    const right = renderTargetExpression(conjunction[2]) || renderTargetTail(conjunction[2])
    if (left && right) return `${left} و${right}`
  }

  // Slash lists, where later members may omit the head.
  if (raw.includes('/')) {
    const parts = raw.split('/').map((s) => s.trim()).filter(Boolean)
    const rendered = parts.map((part, i) => (i === 0 ? renderTargetExpression(part) : renderTargetTail(part)))
    if (!rendered.some((p) => p == null)) return rendered.join(SLASH)
  }

  // Some rows put a full selector in the target column, e.g.
  // "Enemy [General] with highest ATK". The condition renderer already knows
  // that grammar, so reuse it rather than duplicating the rules.
  return renderConditionClause(raw)
}

export function renderArabicTarget(value) {
  const raw = clean(value)
  if (!raw) return value
  if (hasUnknownTags(raw)) return value
  return renderTargetExpression(raw) ?? value
}

// ── Condition rendering ─────────────────────────────────────────────────────

/**
 * Render a selector that is not a full target clause: a bare tag list, a
 * lowercase head, a state word qualifying a tag, or a status adjective.
 */
function renderSelectorHead(text) {
  let raw = clean(text)
  if (!raw) return null

  const pluralEnemies = /\benemies\b/i.test(raw)
  raw = raw.replace(/\benemies\b/gi, 'enemy').replace(/\ballies\b/gi, 'ally').replace(/^The\s+/i, '')

  // A bare tag, or a comma-separated list of them, optionally with a head:
  // "[Zhao], [Wei], [Chu], [Qi] enemy".
  let match = /^((?:\[[^\]]+\][,\s]*)+)(enemy|ally)?$/i.exec(raw)
  if (match) {
    const tags = renderTags(match[1].replace(/,/g, '')).replace(/\s+/g, SPACE).trim()
    if (!match[2]) return tags
    return `${/enemy/i.test(match[2]) ? 'عدو' : 'حليف'} ${tags}`
  }

  // "Qin [General]" — a state word directly qualifying a tag.
  match = /^(\S+)\s+(\[[^\]]+\])$/i.exec(raw)
  if (match) {
    const tag = TAG_INDEX.get(match[1].toLowerCase())
    if (tag) return words(renderTags(match[2]), `من ${tag.coll}`)
  }

  // "Feared enemy [General]" — a status adjective qualifying a selector.
  match = /^(poisoned|burned|feared|confused|paralysed|paralyzed|surviving)\s+(.+)$/i.exec(raw)
  if (match) {
    const inner = renderTargetClause(match[2]) || renderSelectorHead(match[2])
    if (!inner) return null
    if (/surviving/i.test(match[1])) return `${inner} على قيد الحياة`
    const adjective = STATUS_ADJECTIVES[match[1].toLowerCase()]
    if (pluralEnemies) {
      const tagText = clean(match[2]).replace(/^enemy\s*/i, '')
      const tags = tagsIn(tagText)
      const primary = primaryTag(tags)
      const noun = primary?.sing === 'جنرال' ? 'جنرالات' : 'أعداء'
      return `${noun} ${adjective.p.replace(/^ال/, '')} من العدو`
    }
    if (inner.endsWith(' من العدو')) return `${inner.slice(0, -' من العدو'.length)} ${adjective.m} من العدو`
    return `${inner} ${adjective.m}`
  }

  // "[Qin] enemy"
  match = /^(\[[^\]]+\])\s+(enemy|ally)$/i.exec(raw)
  if (match) return `${/enemy/i.test(match[2]) ? 'عدو' : 'حليف'} ${renderTags(match[1])}`

  match = /^(enemy|ally|other ally)\s*(.*)$/i.exec(raw)
  if (match) {
    const head = PHRASE_INDEX.get(match[1].toLowerCase())
    const rest = clean(match[2])
    if (!head) return null
    if (!rest) return head
    if (/^(\[[^\]]+\]\s*)+$/.test(rest)) return `${head} ${renderTags(rest)}`
    const group = lookupGroup(rest)
    if (group) return `${head} من ${group}`
    if (/^[A-Za-zÀ-ɏ"' .-]+$/.test(rest)) return `${head} ${canonicalName(rest)}`
  }
  return null
}

/** Resolve a selector by any available strategy. */
function selector(text) {
  return renderTargetClause(text) || renderSelectorHead(text)
}

function renderConditionClause(text) {
  const raw = clean(text).replace(/\.$/, '')
  if (!raw) return null

  const phrase = PHRASE_INDEX.get(raw.toLowerCase())
  if (phrase) return phrase

  const { body, qualifier } = splitQualifier(raw)
  const rendered = renderConditionBody(body)
  if (!rendered) return null
  return qualifier ? `${rendered} (${qualifier})` : rendered
}

function renderConditionBody(body) {
  const phrase = PHRASE_INDEX.get(body.toLowerCase())
  if (phrase) return phrase

  let match

  // Conditions arrive either whole ("When repairing CW [...]") or already split
  // into chips whose label supplies the "when" ("repairing CW [...]").
  // Normalise by stripping a leading When/While and prefixing عند, so both
  // entry points produce the same Arabic.
  match = /^(?:When|While)\s+(.+)$/i.exec(body)
  if (match) {
    const inner = renderConditionBody(match[1])
    if (inner) return `عند ${verbalizeAlive(inner)}`
  }

  if (/^CW battle$/i.test(body)) return 'حرب القلاع'
  if (/^Garrisoning$/i.test(body)) return 'الدفاع'
  if (/^Attacking$/i.test(body)) return 'الهجوم'

  // "repairing CW [Siege Weapon]"
  match = /^repairing CW\s*(.*)$/i.exec(body)
  if (match) return words('إصلاح', renderTags(clean(match[1])), 'في حرب القلاع')

  // "passing terrain [Ambush]" / "passing Water terrain"
  match = /^passing(?:\s+through)?\s+terrain\s*(\[[^\]]+\])?$/i.exec(body)
  if (match) return words('العبور عبر تضاريس', match[1] ? renderTags(match[1]) : '')
  match = /^passing(?:\s+through)?\s+(.+?)\s+terrain$/i.exec(body)
  if (match) {
    const terrain = TAG_INDEX.get(clean(match[1]).toLowerCase())
    // تضاريس + a definite noun is a genitive construct: تضاريس المنحدر.
    // Multi-word terrain names are already a construct, so leave those alone.
    if (terrain) return `العبور عبر تضاريس ${definite(terrain.coll)}`
  }

  // "ally Makou is alive" / "ally Batei and Ryuuto are both alive" /
  // "ally Batei or Ryuuto is alive".
  //
  // The names may be joined by and/or, and Arabic must agree in number: two
  // allies take the dual (الحليفين … حيّين), three or more the plural, and an
  // alternative keeps the singular.
  match = /^ally\s+(.+?)\s+(?:is|are)(?:\s+both)?\s+(alive|present)$/i.exec(body)
  if (match) {
    const alive = /alive/i.test(match[2])
    const alternative = /\bor\b/i.test(match[1])
    const names = match[1].split(/\s+(?:and|or)\s+/i).map((n) => n.trim()).filter(Boolean)
    const rendered = names.map((n) => lookupGroup(n) || canonicalName(n))

    if (rendered.length === 1) {
      const phrase = lookupGroupPhrase(match[1])
      const who = phrase
        ? (phrase.member ? `عضو من ${phrase.group}` : phrase.group)
        : `الحليف ${rendered[0]}`
      return alive ? `بقاء ${who} حيًا` : `وجود ${who}`
    }
    if (alternative) {
      const who = `الحليف ${rendered.join(' أو ')}`
      return alive ? `بقاء ${who} حيًا` : `وجود ${who}`
    }
    const joined = joinAnd(rendered)
    if (rendered.length === 2) {
      return alive ? `بقاء الحليفين ${joined} حيّين` : `وجود الحليفين ${joined}`
    }
    return alive ? `بقاء الحلفاء ${joined} أحياءً` : `وجود الحلفاء ${joined}`
  }

  // "Ally "Renpa" alive in same formation"
  match = /^(.+?)\s+alive in same formation$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    if (who) return `${who} حي في التشكيلة نفسها`
  }

  // "Own HP < 90%" / "Own remaining HP >= 90%"
  match = new RegExp(`^Own\\s+(?:remaining\\s+)?HP\\s*(<|≤|>|≥|<=|>=)\\s*(${VALUE})$`, 'i').exec(body)
  if (match) return `صحته ${match[1]} ${match[2]}`

  // "Enemy [General]'s HP <= 50%" / "Ally Soujin's remaining HP < 70%"
  match = new RegExp(
    `^(.+?)'s?\\s+(?:(remaining)\\s+)?HP\\s*(<|≤|>|≥|<=|>=)\\s*(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const owner = selector(match[1])
    if (owner) {
      return `${match[2] ? 'الصحة المتبقية' : 'الصحة'} ${lamOf(owner)} ${match[3]} ${match[4]}`
    }
  }

  // "Ally [Cavalry] HP <= 50%" — a comparison with no possessive marker.
  match = new RegExp(
    `^(.+?)\\s+(?:(remaining)\\s+)?HP\\s*(<|≤|>|≥|<=|>=)\\s*(${VALUE})$`, 'i',
  ).exec(body)
  if (match && !/^own\b/i.test(match[1])) {
    const owner = selector(match[1])
    if (owner) {
      return `${match[2] ? 'الصحة المتبقية' : 'الصحة'} ${lamOf(owner)} ${match[3]} ${match[4]}`
    }
  }

  // "From the 170% Damage" / "from 70% Damage above" — the article is optional.
  match = new RegExp(`^From(?: the)?\\s+(${VALUE})\\s+Damage(?:\\s+above)?$`, 'i').exec(body)
  if (match) return `من ضرر ${match[1]}`
  if (/^From (?:the )?% HP Damage(?:\s+above)?$/i.test(body)) return 'من الضرر بنسبة من الصحة'
  // "The higher own remaining HP" — a scaling phrase without the (scales) tag.
  match = /^(?:The )?(higher|lower) own remaining HP$/i.exec(body)
  if (match) return /higher/i.test(match[1]) ? 'كلما زادت صحتك المتبقية' : 'كلما قلّت صحتك المتبقية'
  if (/^% HP Damage triggered$/i.test(body)) return 'عند تفعيل الضرر بنسبة من الصحة'
  if (/^from damage$/i.test(body)) return 'من الضرر'

  // "Enemy [General] with highest ATK" — the dominant condition family (277
  // rows). The complement of a superlative must be INDEFINITE in Arabic, and
  // the selector reads as a construct: جنرال العدو صاحب أعلى هجوم.
  match = /^(.+?)\s+with\s+(?:the\s+)?(highest|lowest|higher|lower)\s+(.+)$/i.exec(body)
  if (match) {
    const stat = lookupStat(match[3])
    if (stat) {
      const scopeMatch = /^(Other ally|Ally|Enemy)\s+((?:\[[^\]]+\]\s*)+)$/i.exec(clean(match[1]))
      const superlative = SUPERLATIVE[match[2].toLowerCase()]
      if (scopeMatch && !hasUnknownTags(scopeMatch[2])) {
        const scopeKey = /^other ally$/i.test(scopeMatch[1])
          ? 'otherAlly'
          : /^ally$/i.test(scopeMatch[1]) ? 'ally' : 'enemy'
        const construct = scopedTagsConstruct(scopeKey, scopeMatch[2])
        if (construct) return `${construct} صاحب ${superlative} ${stat.ind}`
      }
      const who = selector(match[1])
      if (who) return `${who} صاحب ${superlative} ${stat.ind}`
    }
  }

  // "Enemy [General] earliest in formation order"
  match = /^(.+?)\s+(earliest|latest|first|last)\s+in\s+formation(?:\s+order)?$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    if (who) return `${who} ${/earliest|first/i.test(match[2]) ? 'الأسبق' : 'الأخير'} في ترتيب التشكيلة`
  }

  // "Per own attack count" / "Per ally [General] attack count"
  match = /^Per\s+(own|allied|.+?)\s+attack count$/i.exec(body)
  if (match) {
    if (/^own$/i.test(match[1])) return 'لكل هجمة من هجماتك'
    if (/^allied$/i.test(match[1])) return 'لكل هجمة للحلفاء'
    const who = selector(match[1])
    if (who) return `لكل هجمة ${lamOf(who)}`
  }

  // "Per attack by other ally [General]"
  match = /^Per\s+attack by\s+(.+)$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    if (who) return `لكل هجمة ${lamOf(who)}`
  }

  // "Per enemy [General] defeated while skill is active"
  match = /^Per\s+(?:defeated\s+)?(.+?)(?:\s+defeated)?(?:\s+while skill is active)?$/i.exec(body)
  if (match && /defeated/i.test(body)) {
    const who = selector(match[1])
    if (who) return `لكل ${who} يُهزم`
  }

  // "Per other ally [Qin] [General]" / "Per other ally Gyokuhou Unit member"
  match = /^Per\s+(.+?)(\s+members?)?$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    if (who) return `لكل ${who}`
  }

  // "enemy [General] have Illusion status"
  match = /^(.+?)\s+(?:have|has)\s+(.+?)\s+status$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    const status = lookupStatus(match[2])
    if (who && status) return `إصابة ${who} بحالة ${status}`
  }

  // "Ally Renpa Army (other than self) alive" — a qualifier sitting between
  // the selector and its predicate rather than at the end of the clause.
  match = /^(.+?)\s*\(([^()]*)\)\s+(present|alive)$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    const qualifier = renderQualifier(match[2])
    if (who && qualifier) {
      // "(other than self) alive" reads as a bracketed aside followed by a
      // bare adjective. آخر folds the qualifier into the noun instead:
      // حليف آخر من جيش Renpa على قيد الحياة.
      const present = /present/i.test(match[3])
      const predicate = 'على قيد الحياة'
      if (/^عدا نفسه$/.test(qualifier)) {
        const qualified = who.startsWith(ALLY_HEAD) ? `حليف آخر ${who.slice(ALLY_HEAD.length)}` : who
        return present ? `وجود ${qualified}` : `${qualified} ${predicate}`
      }
      return present ? `وجود ${who} (${qualifier})` : `${who} (${qualifier}) ${predicate}`
    }
  }

  // "Enemy [Qin] present" / "Enemy alive" / "Other ally [Chu] members alive"
  match = /^(.+?)\s+(?:members?\s+)?(?:are\s+|is\s+)?(present|alive)$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    if (who) return /present/i.test(match[2]) ? `وجود ${who}` : `${who} على قيد الحياة`
  }

  // "Other [Mountain Folk] alive" — "Other" standing in for "Other ally".
  // Rendering the tail first and appending آخر strands the qualifier after the
  // predicate, so restore the implied scope and let the ally path fold آخر
  // into the noun: حليف آخر من جيش الجبال على قيد الحياة.
  match = /^Other\s+(\[[^\]]+\].*|[A-Z].*)$/.exec(body)
  if (match) {
    const scoped = renderConditionBody(`Other ally ${match[1]}`)
    if (scoped) return scoped
    const inner = renderConditionBody(match[1])
    if (inner) return `${inner} آخر`
  }

  // "vs Qin [General]"
  match = /^vs\s+(.+)$/i.exec(body)
  if (match) {
    const target = clean(match[1])
    const against =
      TAG_INDEX.get(target.toLowerCase())?.coll ||
      selector(target) ||
      (/^(\[[^\]]+\]\s*)+$/.test(target) ? renderTags(target) : null)
    if (against) return `ضد ${against}`
  }

  return selector(body)
}

function renderConditionExpression(raw) {
  const direct = renderConditionClause(raw)
  if (direct) return direct

  // Arabic uses its own comma (U+060C) between clauses.
  if (raw.includes(',')) {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean).map(renderConditionExpression)
    if (!parts.some((p) => p == null)) return parts.join('، ')
  }

  // "Enemy [General] with highest DEF and own HP > 90%" — two requirements.
  const conjunction = /^(.+?)\s+and\s+(.+)$/i.exec(raw)
  if (conjunction) {
    const left = renderConditionExpression(conjunction[1])
    const right = renderConditionExpression(conjunction[2])
    if (left && right) return `${left} و${right}`
  }
  return null
}

export function renderArabicCondition(value) {
  const raw = clean(value)
  if (!raw) return value
  if (hasUnknownTags(raw)) return value
  return renderConditionExpression(raw) ?? value
}

// ── Duration rendering ──────────────────────────────────────────────────────

export function renderArabicDuration(value) {
  const raw = clean(value)
  if (!raw) return value

  let match = /^(\d+)\s+turns?$/i.exec(raw)
  if (match) {
    return arCount(Number(match[1]), { one: 'جولة واحدة', two: 'جولتان', few: 'جولات', many: 'جولة' })
  }
  match = /^(\d+)\s+times?$/i.exec(raw)
  if (match) {
    return arCount(Number(match[1]), { one: 'مرة واحدة', two: 'مرتان', few: 'مرات', many: 'مرة' })
  }
  match = /^(\d+)\s+attacks?$/i.exec(raw)
  if (match) {
    return arCount(Number(match[1]), { one: 'هجوم واحد', two: 'هجومان', few: 'هجمات', many: 'هجومًا' })
  }
  return value
}

// ── Short label lookup ──────────────────────────────────────────────────────

/**
 * Translate a short standalone label — a faction, unit type, stat or status
 * name as used by filter chips and buff tables. Returns null when unknown so
 * callers can fall back to the English label.
 */
export function renderArabicTerm(value) {
  const raw = clean(value)
  if (!raw) return null

  // Compact labels emitted by the buff parser do not include a percentage,
  // so they cannot use the full effect renderer. Model their grammar here at
  // the standalone-label boundary used by BuffSideTable and share output.
  const directionalResistance = /^(.+?)\s+(Up|Down)\s+Resistance$/i.exec(raw)
  if (directionalResistance) {
    const stat = lookupStat(directionalResistance[1])
    const dir = directionOf(directionalResistance[2])
    if (stat && dir) return `مقاومة ${DIRECTION[dir]} ${stat.def}`
  }

  const resistance = /^(.+?)\s+Resistance$/i.exec(raw)
  const resistanceStatus = resistance ? lookupStatus(resistance[1]) : null
  if (resistanceStatus) return `مقاومة ${resistanceStatus}`
  const resistanceStat = resistance ? lookupStat(resistance[1]) : null
  if (resistanceStat) return `مقاومة ${resistanceStat.def}`

  const inflictionRate = /^(.+?)\s+Infliction Rate$/i.exec(raw)
  const inflictionStatus = inflictionRate ? lookupStatus(inflictionRate[1]) : null
  if (inflictionStatus) return `معدل إلحاق ${inflictionStatus}`

  const repairStat = /^(\[[^\]]+\])\s+repair\s+(.+)$/i.exec(raw)
  if (repairStat) {
    const tag = tagOf(repairStat[1])
    const stat = lookupStat(repairStat[2])
    if (tag && stat) return `${stat.def} لإصلاح ${renderTags(repairStat[1])}`
  }

  const scopedStat = /^(?:(\d+)\s+)?(\[[^\]]+\])\s+(.+)$/i.exec(raw)
  if (scopedStat) {
    const count = scopedStat[1] ? Number(scopedStat[1]) : null
    const tag = tagOf(scopedStat[2])
    const stat = lookupStat(scopedStat[3])
    const subject = count == null ? tag?.coll : countedTag(count, tag)
    if (stat && subject) return `${stat.ind} ${subject}`
  }

  return (
    PHRASE_INDEX.get(raw.toLowerCase()) ||
    // A bare unit type used as a chip label reads as an indefinite plural
    // (مشاة), not the definite collective the من phrases need (المشاة).
    tagLabel(TAG_INDEX.get(raw.toLowerCase())) ||
    STATUS_INDEX.get(raw.toLowerCase()) ||
    GROUP_INDEX.get(raw.toLowerCase()) ||
    (lookupStat(raw)?.def ?? null)
  )
}

/**
 * Generic entry point for call sites where the field type is not known.
 * Tries the term lookup, then each structured renderer, and finally returns
 * the original English unchanged.
 */
export function renderArabicText(value) {
  const raw = clean(value)
  if (!raw) return value
  if (hasUnknownTags(raw)) return value

  const term = renderArabicTerm(raw)
  if (term) return term

  const duration = renderArabicDuration(raw)
  if (duration !== raw) return duration

  const condition = renderConditionExpression(raw)
  if (condition) return condition

  const effect = withRatio(renderEffectClause(raw))
  if (effect) return effect

  const target = renderArabicTarget(raw)
  if (target !== raw) return target

  return value
}
