/**
 * Semantic Japanese renderer for RanHQ's structured game data.
 *
 * SCOPE — read this before changing anything here.
 * Skill NAMES and DESCRIPTIONS are never produced by this module. Those come
 * from the game's own tables verbatim via `ja-source.js`, and paraphrasing them
 * is forbidden by the localization contract. What this module renders is
 * RanHQ's own decomposition of a skill into target / effect / condition /
 * duration triples, which has no counterpart string in the source and was
 * previously shipped to Japanese readers in English.
 *
 * The vocabulary is still the game's: every term in `ja-lexicon.js` was mined
 * from the authoritative descriptions, so a rendered row reads with the same
 * words as the 原文 block directly above it on the card.
 *
 * Structure mirrors `ar-render.js`:
 *
 *     recognise pattern -> extract operands -> build natural Japanese
 *
 * and it shares the same safety rule: an unrecognised string is returned in
 * English, unchanged. Japanese needs no number, gender or article agreement, so
 * the renderer is considerably simpler than the Arabic one.
 */
import {
  DIRECTION,
  GROUPS,
  MAX_FORMS,
  PHRASES,
  QUALIFIERS,
  STATS,
  STATUSES,
  STATUS_ADJECTIVES,
  SUPERLATIVE,
  TAGS,
} from './ja-lexicon.js'
import characterNamesDocument from '../../data/generated/ja/character_names.json'

/**
 * English character name -> Japanese name, so effect text that names an ally
 * reads 味方王賁 rather than 味方「Ouhon」. Built from data/characters, the same
 * source the archive renders from.
 */
const CHARACTER_NAMES = characterNamesDocument.names || {}

/** Resolve a character name to Japanese, or null when it is not a known one. */
function lookupCharacter(raw) {
  const text = String(raw == null ? '' : raw).trim().replace(/^"|"$/g, '')
  return CHARACTER_NAMES[text] || null
}

const SLASH = '／'

function buildIndex(source) {
  const index = new Map()
  for (const [key, value] of Object.entries(source)) index.set(key.toLowerCase(), value)
  return index
}

const STAT_INDEX = buildIndex(STATS)
const MAX_INDEX = buildIndex(MAX_FORMS)
const STATUS_INDEX = buildIndex(STATUSES)
const TAG_INDEX = buildIndex(TAGS)
const GROUP_INDEX = buildIndex(GROUPS)
const PHRASE_INDEX = buildIndex(PHRASES)
const QUALIFIER_INDEX = buildIndex(QUALIFIERS)

const clean = (value) => String(value == null ? '' : value).trim()

/** Look up a stat name, handling a leading "Max ". */
function lookupStat(raw) {
  const text = clean(raw).replace(/\s+/g, ' ')
  if (!text) return null
  const direct = STAT_INDEX.get(text.toLowerCase())
  if (direct) return direct

  const max = /^max(?:imum)?\s+(.+)$/i.exec(text)
  if (max) {
    // 体力 caps as 体力上限, 士気 as 最大士気 — the game is not uniform here.
    const special = MAX_INDEX.get(max[1].toLowerCase())
    if (special) return special
    const base = STAT_INDEX.get(max[1].toLowerCase())
    if (base) return `最大${base}`
  }
  return null
}

function lookupStatus(raw) {
  return STATUS_INDEX.get(clean(raw).replace(/^"|"$/g, '').toLowerCase()) || null
}

function lookupGroup(raw) {
  return GROUP_INDEX.get(clean(raw).toLowerCase()) || null
}

/** `[General]` -> `武将`. Japanese drops the brackets; they are an English cue. */
function renderTags(text) {
  return String(text).replace(/\[([^\]]+)\]/g, (whole, inner) => {
    const hit = TAG_INDEX.get(inner.trim().toLowerCase())
    return hit || whole
  }).replace(/\s+/g, '')
}

function renderQualifier(inner) {
  const hit = QUALIFIER_INDEX.get(clean(inner).toLowerCase())
  if (hit) return hit
  const max = /^max\s+([\d.,]+%?)$/i.exec(clean(inner))
  if (max) return `最大${max[1]}`
  return null
}

function splitQualifier(text) {
  const match = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(text)
  if (!match) return { body: text, qualifier: null }
  const rendered = renderQualifier(match[2])
  if (!rendered) return { body: text, qualifier: null }
  return { body: match[1].trim(), qualifier: rendered }
}

const VALUE = String.raw`\d[\d.,]*%?`

const DIRECTION_WORDS = {
  up: 'up', increase: 'up',
  down: 'down', decrease: 'down', reduction: 'down',
}
const directionOf = (word) => DIRECTION_WORDS[clean(word).toLowerCase()] || null

const SCOPES = 'Ally|Other ally|Enemy|All ally|All enemy'

function splitClauses(text) {
  return text.split(/(?<!\d)\s*[,/]\s*(?!\d)/).map((s) => s.trim()).filter(Boolean)
}

const trailingValue = (text) => {
  const m = new RegExp(`\\s(${VALUE})$`).exec(text)
  return m ? m[1] : null
}

// ── Effects ─────────────────────────────────────────────────────────────────

function renderEffectBody(body) {
  const phrase = PHRASE_INDEX.get(body.toLowerCase())
  if (phrase) return phrase
  const group = lookupGroup(body)
  if (group) return group

  let match

  match = new RegExp(`^%\\s*of\\s+remaining\\s+HP\\s+Damage\\s+(${VALUE})$`, 'i').exec(body)
  if (match) return `残り体力の${match[1]}ダメージ`

  match = new RegExp(`^(\\d+)-Hit\\s+(${VALUE})\\s+Damage$`, 'i').exec(body)
  if (match) return `${match[2]}ダメージ×${match[1]}回`

  match = new RegExp(`^(${VALUE})\\s+Damage\\s+(\\d+)\\s+times?$`, 'i').exec(body)
  if (match) return `${match[1]}ダメージ×${match[2]}回`

  match = new RegExp(`^(${VALUE})\\s+Damage\\s+each$`, 'i').exec(body)
  if (match) return `対象ごとに${match[1]}ダメージ`

  match = new RegExp(`^(${VALUE})\\s+Damage to equipment$`, 'i').exec(body)
  if (match) return `装備に${match[1]}ダメージ`

  match = new RegExp(`^(${VALUE})\\s+Damage$`, 'i').exec(body)
  if (match) return `${match[1]}ダメージ`

  if (body.includes('+')) {
    const parts = body.split('+').map((s) => s.trim()).filter(Boolean)
    if (parts.length > 1) {
      const rendered = parts.map((part) => renderEffectBody(part))
      if (!rendered.some((p) => p == null)) return rendered.join('＋')
    }
  }

  // "Anti-[Cavalry] ATK Up 5%" -> 騎兵に対する攻撃力5%上昇
  match = new RegExp(
    `^(?:(${SCOPES})\\s+)?(\\[[^\\]]+\\]\\s+)?Anti-(.+)\\s+(Up|Down)\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const dir = directionOf(match[4])
    const split = splitTrailingStat(match[3])
    if (dir && split) {
      const against = lookupGroup(split.head) || renderTags(split.head)
      const scope = match[1] ? PHRASE_INDEX.get(match[1].toLowerCase()) : ''
      const scopeTag = match[2] ? renderTags(match[2].trim()) : ''
      return `${scope}${scopeTag}${against}に対する${split.stat}${match[5]}${DIRECTION[dir]}`
    }
  }

  match = new RegExp(`^(\\[[^\\]]+\\])\\s+repair\\s+(.+?)\\s+(Up|Down)\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const stat = lookupStat(match[2])
    const dir = directionOf(match[3])
    if (stat && dir) return `${renderTags(match[1])}修理時の${stat}${match[4]}${DIRECTION[dir]}`
  }

  match = new RegExp(`^(.+?)\\s+(Up|Down)\\s+vs\\s+(.+?)(?:\\s+(${VALUE}))?$`, 'i').exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) {
      const against = TAG_INDEX.get(clean(match[3]).toLowerCase()) || lookupGroup(match[3]) || renderTags(match[3])
      return `${against}に対する${stat}${match[4] || ''}${DIRECTION[dir]}`
    }
  }

  match = new RegExp(`^"?(.+?)"?\\s+Infliction\\s+Rate\\s+(Up|Down)\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    const dir = directionOf(match[2])
    if (status && dir) return `「${status}」付与確率${match[3]}${DIRECTION[dir]}`
  }

  match = new RegExp(`^"?(.+?)"?\\s+Infliction\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    if (status) return `「${status}」付与${match[2]}`
  }
  match = /^"?(.+?)"?\s+Infliction$/i.exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    if (status) return `「${status}」付与`
  }

  // "Attack Down Resistance Up 40%" -> 攻撃力低下耐性40%上昇
  match = new RegExp(
    `^(.+?)\\s+(Up|Down)\\s+Resistance(?:\\s+(Up|Down))?\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    const outer = directionOf(match[3] || 'up')
    if (stat && dir) return `${stat}${DIRECTION[dir]}耐性${match[4]}${DIRECTION[outer]}`
  }

  match = new RegExp(
    `^(${SCOPES})\\s+(\\[[^\\]]+\\])\\s+"?(.+?)"?\\s+Resistance\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const status = lookupStatus(match[3])
    const scope = PHRASE_INDEX.get(match[1].toLowerCase())
    if (status && scope) return `${scope}${renderTags(match[2])}の「${status}」耐性${match[4]}上昇`
  }

  match = new RegExp(`^"?(.+?)"?\\s+Resistance(?:\\s+(Up|Down))?\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    const stat = status ? `「${status}」` : lookupStat(match[1])
    if (stat) return `${stat}耐性${match[3]}${DIRECTION[directionOf(match[2] || 'up')]}`
  }

  match = new RegExp(
    `^(${SCOPES})\\s+(\\[[^\\]]+\\])\\s+(.+?)\\s+(Up|Down)\\s+(${VALUE})$`, 'i',
  ).exec(body)
  if (match) {
    const stat = lookupStat(match[3])
    const dir = directionOf(match[4])
    const scope = PHRASE_INDEX.get(match[1].toLowerCase())
    if (stat && dir && scope) return `${scope}${renderTags(match[2])}の${stat}${match[5]}${DIRECTION[dir]}`
  }

  match = new RegExp(`^(${SCOPES})\\s+(\\[[^\\]]+\\])\\s+"?(.+?)"?\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[3])
    const scope = PHRASE_INDEX.get(match[1].toLowerCase())
    if (status && scope) return `${scope}${renderTags(match[2])}に「${status}」${match[4]}`
  }

  match = new RegExp(`^(?:\\d+\\s+)?(\\[[^\\]]+\\])\\s+(.+?)\\s+(Up|Down)\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const stat = lookupStat(match[2])
    const dir = directionOf(match[3])
    if (stat && dir) return `${renderTags(match[1])}の${stat}${match[4]}${DIRECTION[dir]}`
  }

  match = /^(.+?)\s+significantly\s+(Up|Down)$/i.exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) return `${stat}が大幅に${DIRECTION[dir]}`
  }

  match = new RegExp(`^(.+?)\\s+(Up|Down)\\s+additional\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) return `${stat}がさらに${match[3]}${DIRECTION[dir]}`
  }

  // The dominant family: "{STAT} Up 20%" -> 攻撃力20%上昇
  match = new RegExp(`^(.+?)\\s+(Up|Down|Increase|Decrease|Reduction)\\s+(${VALUE})$`, 'i').exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) return `${stat}${match[3]}${DIRECTION[dir]}`
  }

  match = /^(.+?)\s+(Up|Down|Increase|Decrease|Reduction)$/i.exec(body)
  if (match) {
    const stat = lookupStat(match[1])
    const dir = directionOf(match[2])
    if (stat && dir) return `${stat}${DIRECTION[dir]}`
  }

  match = /^(.+?)\s*[x×]\s*(\d+)$/i.exec(body)
  if (match) {
    const inner = renderEffectBody(match[1].trim())
    if (inner) return `${inner}×${match[2]}回`
  }

  // "Guard 60%" / "HP Recovery 20%" — a status or stat with a bare value.
  match = new RegExp(`^"?(.+?)"?\\s*(${VALUE})$`, 'i').exec(body)
  if (match) {
    const status = lookupStatus(match[1])
    if (status) return `${status}${match[2]}`
    const stat = lookupStat(match[1])
    if (stat) return `${stat}${match[2]}`
  }

  const bare = lookupStatus(body)
  if (bare) return bare
  return null
}

function splitTrailingStat(text) {
  const parts = clean(text).split(/\s+/)
  for (let i = parts.length - 1; i >= 1; i -= 1) {
    const stat = lookupStat(parts.slice(i).join(' '))
    if (stat) return { head: parts.slice(0, i).join(' '), stat }
  }
  return null
}

function renderEffectClause(text) {
  const raw = clean(text)
  if (!raw) return null
  const { body, qualifier } = splitQualifier(raw)
  const rendered = renderEffectBody(body)
  if (!rendered) return null
  return qualifier ? `${rendered}（${qualifier}）` : rendered
}

export function renderJapaneseEffect(value) {
  const raw = clean(value)
  if (!raw) return value

  const segments = splitClauses(raw)
  if (segments.length === 1) return renderEffectClause(raw) ?? value

  const carried = trailingValue(segments[segments.length - 1])
  const framed = new RegExp(
    `^(.+?)\\s+(Infliction Rate(?:\\s+(?:Up|Down))?|Infliction|Resistance(?:\\s+(?:Up|Down))?)\\s+(${VALUE})$`, 'i',
  ).exec(segments[segments.length - 1])
  const sharedFrame = framed ? `${framed[2]} ${framed[3]}` : null

  const rendered = segments.map((segment, index) => {
    if (trailingValue(segment) || !carried) return renderEffectClause(segment)
    const bare = index < segments.length - 1 && (lookupStatus(segment) || lookupStat(segment))
    return renderEffectClause(sharedFrame && bare ? `${segment} ${sharedFrame}` : `${segment} ${carried}`)
  })
  if (rendered.some((part) => part == null)) return value
  return rendered.join('、')
}

// ── Targets ─────────────────────────────────────────────────────────────────

function renderTargetClause(text) {
  const raw = clean(text)
  if (!raw) return null

  const phrase = PHRASE_INDEX.get(raw.toLowerCase())
  if (phrase) return phrase

  let match

  // "1 poisoned enemy [General]" -> 毒状態の敵武将1名
  match = /^(\d+|All)\s+(poisoned|burned|feared|confused|paralysed|paralyzed)\s+enemy\s*(.*)$/i.exec(raw)
  if (match) {
    const adj = STATUS_ADJECTIVES[match[2].toLowerCase()]
    const tags = renderTags(clean(match[3]))
    if (/^all$/i.test(match[1])) return `${adj}敵全${tags || '武将'}`
    return `${adj}敵${tags || '武将'}${match[1]}名`
  }

  // "1 enemy [General]" -> 敵武将1名 (the game's own phrasing)
  match = /^(\d+)\s+enemy\s*((?:\[[^\]]+\]\s*)*)$/i.exec(raw)
  if (match) return `敵${renderTags(clean(match[2])) || '武将'}${match[1]}名`

  match = /^(\d+)\s+(\[[^\]]+\])\s+enemy$/i.exec(raw)
  if (match) return `敵${renderTags(match[2])}${match[1]}名`

  match = /^All\s+(enemy|ally)\s*(.*)$/i.exec(raw)
  if (match) {
    const rest = clean(match[2])
    const head = /enemy/i.test(match[1]) ? '敵全' : '味方全'
    if (rest && !/^(\[[^\]]+\]\s*)*$/.test(rest)) {
      const group = lookupGroup(rest)
      if (group) return `${/enemy/i.test(match[1]) ? '敵' : '味方'}${group}全武将`
    }
    return `${head}${renderTags(rest) || '武将'}`
  }

  match = /^(\[[^\]]+\])\s+repair$/i.exec(raw)
  if (match) return `${renderTags(match[1])}の修理`

  match = /^Ally\s+(attack|defense)\s*(.*)$/i.exec(raw)
  if (match) {
    const tags = renderTags(clean(match[2]))
    return `味方${tags}の${/attack/i.test(match[1]) ? '攻撃' : '防御'}`
  }

  match = /^Surviving\s+(.+)$/i.exec(raw)
  if (match) {
    const inner = renderTargetClause(match[1])
    if (inner) return `生存している${inner}`
  }

  match = /^(\[[^\]]+\])\s+(Unit|Army|Squad)$/i.exec(raw)
  if (match) return renderTags(match[1])

  match = /^(.+?)\s+of\s+(.+)$/i.exec(raw)
  if (match) {
    const group = lookupGroup(match[1])
    const where = TAG_INDEX.get(clean(match[2]).toLowerCase())
    if (group && where) return `${where}の${group}`
  }

  // "Ally Kanki Army [General]" -> 味方桓騎軍武将
  match = /^(Other ally|Ally|Enemy)\s+(.+)$/i.exec(raw)
  if (match) {
    const head = PHRASE_INDEX.get(match[1].toLowerCase())
    let rest = clean(match[2])
    const tags = []
    while (/\s*\[[^\]]+\]$/.test(rest)) {
      rest = rest.replace(/\s*(\[[^\]]+\])$/, (whole, tag) => { tags.unshift(renderTags(tag)); return '' }).trim()
    }
    const tail = tags.join('')
    if (!rest) return `${head}${tail || ''}`

    const group = lookupGroup(rest.replace(/\s+members?$/i, ''))
    if (group) return `${head}${group}${tail || '武将'}`

    // "[Gyokuhou] Unit" — the source sometimes brackets the group name instead
    // of writing it plainly, so the trailing-tag loop above cannot reach it.
    const bracketedGroup = /^\[([^\]]+)\]\s+(Unit|Army|Squad)$/i.exec(rest)
    if (bracketedGroup) {
      const bracketed = lookupGroup(`${bracketedGroup[1]} ${bracketedGroup[2]}`)
      if (bracketed) return `${head}${bracketed}${tail || '武将'}`
    }

    // "Six Great Generals of Qin" -> 秦国の六大将軍
    const of = /^(.+?)\s+of\s+(.+)$/i.exec(rest)
    if (of) {
      const ofGroup = lookupGroup(of[1])
      const where = TAG_INDEX.get(clean(of[2]).toLowerCase())
      if (ofGroup && where) return `${head}${where}の${ofGroup}${tail}`
    }
    if (/^\[[^\]]+\]$/.test(rest)) return `${head}${renderTags(rest)}${tail}`
    // A named ally: use the project's Japanese name where one exists, and
    // only fall back to a quoted Latin name when there is none.
    if (/^[A-Za-z"' .-]+$/.test(rest) && !/\b(and|or|with|than|besides|both)\b/i.test(rest)) {
      const jp = lookupCharacter(rest)
      return jp ? `${head}${jp}${tail}` : `${head}「${rest}」${tail}`
    }
    return null
  }

  return null
}

function renderTargetTail(text) {
  const raw = clean(text)
  if (!raw) return null
  const full = renderTargetClause(raw)
  if (full) return full
  const other = /^Other\s+(.+)$/i.exec(raw)
  if (other) {
    const inner = renderTargetTail(other[1])
    return inner ? `自身以外の${inner}` : null
  }
  const group = lookupGroup(raw)
  if (group) return group
  if (/^(\[[^\]]+\]\s*)+$/.test(raw)) return renderTags(raw)
  return null
}

function renderTargetExpression(raw) {
  const excluded = /^(.*?)\s+other than self$/i.exec(raw)
  if (excluded) {
    const inner = renderTargetExpression(excluded[1])
    if (inner) return `${inner}（自身を除く）`
  }

  const versus = /^(.*?)\s+vs\s+(.+)$/i.exec(raw)
  if (versus) {
    const inner = renderTargetExpression(versus[1])
    const target = clean(versus[2])
    const against = TAG_INDEX.get(target.toLowerCase()) || lookupGroup(target) ||
      (/^\[[^\]]+\]$/.test(target) ? renderTags(target) : null)
    if (inner && against) return `${against}に対する${inner}`
  }

  const direct = renderTargetClause(raw)
  if (direct) return direct

  if (/^(\[[^\]]+\][,\s]*)+$/.test(raw)) return renderTags(raw)

  if (/,/.test(raw)) {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
    const rendered = parts.map((part, i) => {
      const tail = /^and\s+(.+)$/i.exec(part)
      const body = tail ? tail[1] : part
      return i === 0 ? renderTargetExpression(body) : (renderTargetExpression(body) || renderTargetTail(body))
    })
    if (!rendered.some((p) => p == null)) return rendered.join('、')
  }

  const alternative = /^(.+?)\s+or\s+(.+)$/i.exec(raw)
  if (alternative) {
    const left = renderTargetExpression(alternative[1])
    const right = renderTargetExpression(alternative[2]) || renderTargetTail(alternative[2])
    if (left && right) return `${left}または${right}`
  }

  const conjunction = /^(.+?)\s+and\s+(.+)$/i.exec(raw)
  if (conjunction) {
    const left = renderTargetExpression(conjunction[1])
    const right = renderTargetExpression(conjunction[2]) || renderTargetTail(conjunction[2])
    if (left && right) return `${left}と${right}`
  }

  if (raw.includes('/')) {
    const parts = raw.split('/').map((s) => s.trim()).filter(Boolean)
    const rendered = parts.map((part, i) => (i === 0 ? renderTargetExpression(part) : renderTargetTail(part)))
    if (!rendered.some((p) => p == null)) return rendered.join(SLASH)
  }

  return renderConditionClause(raw)
}

export function renderJapaneseTarget(value) {
  const raw = clean(value)
  if (!raw) return value
  return renderTargetExpression(raw) ?? value
}

// ── Conditions ──────────────────────────────────────────────────────────────

function renderSelectorHead(text) {
  let raw = clean(text)
  if (!raw) return null
  raw = raw.replace(/\benemies\b/gi, 'enemy').replace(/\ballies\b/gi, 'ally').replace(/^The\s+/i, '')

  let match = /^((?:\[[^\]]+\][,\s]*)+)(enemy|ally)?$/i.exec(raw)
  if (match) {
    const tags = renderTags(match[1].replace(/,/g, ''))
    if (!match[2]) return tags
    return `${/enemy/i.test(match[2]) ? '敵' : '味方'}${tags}`
  }

  match = /^(\S+)\s+(\[[^\]]+\])$/i.exec(raw)
  if (match) {
    const tag = TAG_INDEX.get(match[1].toLowerCase())
    if (tag) return `${tag}${renderTags(match[2])}`
  }

  match = /^(poisoned|burned|feared|confused|paralysed|paralyzed|surviving)\s+(.+)$/i.exec(raw)
  if (match) {
    const inner = renderTargetClause(match[2]) || renderSelectorHead(match[2])
    if (!inner) return null
    if (/surviving/i.test(match[1])) return `生存している${inner}`
    return `${STATUS_ADJECTIVES[match[1].toLowerCase()]}${inner}`
  }

  match = /^(\[[^\]]+\])\s+(enemy|ally)$/i.exec(raw)
  if (match) return `${/enemy/i.test(match[2]) ? '敵' : '味方'}${renderTags(match[1])}`

  match = /^(enemy|ally|other ally)\s*(.*)$/i.exec(raw)
  if (match) {
    const head = PHRASE_INDEX.get(match[1].toLowerCase())
    const rest = clean(match[2])
    if (!head) return null
    if (!rest) return head
    if (/^(\[[^\]]+\]\s*)+$/.test(rest)) return `${head}${renderTags(rest)}`
    const group = lookupGroup(rest)
    if (group) return `${head}${group}`
    if (/^[A-Za-z"' .-]+$/.test(rest)) {
      const jp = lookupCharacter(rest)
      return jp ? `${head}${jp}` : `${head}「${rest}」`
    }
  }
  return null
}

const selector = (text) => renderTargetClause(text) || renderSelectorHead(text)

function renderConditionBody(body) {
  const phrase = PHRASE_INDEX.get(body.toLowerCase())
  if (phrase) return phrase

  let match

  // "When X" adds the conditional ending only when the inner clause does not
  // already carry one — several rules end in 時 or 場合 by themselves.
  match = /^(?:When|While)\s+(.+)$/i.exec(body)
  if (match) {
    const inner = renderConditionBody(match[1])
    if (inner) return /(?:時|場合|ごと|から|ほど)$/.test(inner) ? inner : `${inner}の場合`
  }

  if (/^CW battle$/i.test(body)) return '同盟争覇戦'
  if (/^Garrisoning$/i.test(body)) return '駐屯時'
  if (/^Attacking$/i.test(body)) return '侵攻時'

  match = /^repairing CW\s*(.*)$/i.exec(body)
  if (match) return `争覇${renderTags(clean(match[1]))}修理時`

  match = /^passing(?:\s+through)?\s+terrain\s*(\[[^\]]+\])?$/i.exec(body)
  if (match) return `${match[1] ? `地形【${renderTags(match[1])}】` : '地形'}通過時`
  match = /^passing(?:\s+through)?\s+(.+?)\s+terrain$/i.exec(body)
  if (match) {
    const terrain = TAG_INDEX.get(clean(match[1]).toLowerCase())
    if (terrain) return `地形【${terrain}】通過時`
  }

  // "ally Batei and Ryuuto are both alive" — Japanese needs no dual form, but
  // and/or must stay distinct because they are different mechanics.
  match = /^ally\s+(.+?)\s+(?:is|are)(?:\s+both)?\s+(alive|present)$/i.exec(body)
  if (match) {
    const alternative = /\bor\b/i.test(match[1])
    const names = match[1].split(/\s+(?:and|or)\s+/i).map((n) => n.trim()).filter(Boolean)
    const rendered = names.map((n) => lookupGroup(n) || lookupCharacter(n) || `「${n}」`)
    const joined = rendered.join(alternative ? 'または' : 'と')
    return /alive/i.test(match[2]) ? `味方${joined}が生存している場合` : `味方${joined}がいる場合`
  }

  match = new RegExp(`^Own\\s+(?:remaining\\s+)?HP\\s*(<|≤|>|≥|<=|>=)\\s*(${VALUE})$`, 'i').exec(body)
  if (match) return `自身の残り体力が${match[2]}${/[<≤]/.test(match[1]) ? '未満' : '以上'}`

  match = new RegExp(`^(.+?)'s?\\s+(?:(remaining)\\s+)?HP\\s*(<|≤|>|≥|<=|>=)\\s*(${VALUE})$`, 'i').exec(body)
  if (match) {
    const owner = selector(match[1])
    if (owner) return `${owner}の${match[2] ? '残り' : ''}体力が${match[4]}${/[<≤]/.test(match[3]) ? '未満' : '以上'}`
  }

  match = new RegExp(`^(.+?)\\s+(?:(remaining)\\s+)?HP\\s*(<|≤|>|≥|<=|>=)\\s*(${VALUE})$`, 'i').exec(body)
  if (match && !/^own\b/i.test(match[1])) {
    const owner = selector(match[1])
    if (owner) return `${owner}の${match[2] ? '残り' : ''}体力が${match[4]}${/[<≤]/.test(match[3]) ? '未満' : '以上'}`
  }

  match = new RegExp(`^From the\\s+(${VALUE})\\s+Damage(?:\\s+above)?$`, 'i').exec(body)
  if (match) return `上記${match[1]}ダメージから`
  if (/^From (?:the )?% HP Damage(?:\s+above)?$/i.test(body)) return '残り体力割合ダメージから'
  if (/^% HP Damage triggered$/i.test(body)) return '残り体力割合ダメージ発生時'
  if (/^from damage$/i.test(body)) return 'ダメージから'

  // "Enemy [General] with highest ATK" -> 攻撃力が最も高い敵武将
  match = /^(.+?)\s+with\s+(?:the\s+)?(highest|lowest|higher|lower)\s+(.+)$/i.exec(body)
  if (match) {
    const stat = lookupStat(match[3])
    const who = selector(match[1])
    if (stat && who) return `${stat}が${SUPERLATIVE[match[2].toLowerCase()]}${who}`
  }

  match = /^(.+?)\s+(earliest|latest|first|last)\s+in\s+formation(?:\s+order)?$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    if (who) return `編成順が最も${/earliest|first/i.test(match[2]) ? '早い' : '遅い'}${who}`
  }

  match = /^Per\s+(own|allied|.+?)\s+attack count$/i.exec(body)
  if (match) {
    if (/^own$/i.test(match[1])) return '自身の攻撃回数ごと'
    if (/^allied$/i.test(match[1])) return '味方の攻撃回数ごと'
    const who = selector(match[1])
    if (who) return `${who}の攻撃回数ごと`
  }

  match = /^Per\s+attack by\s+(.+)$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    if (who) return `${who}の攻撃ごと`
  }

  match = /^Per\s+(?:defeated\s+)?(.+?)(?:\s+defeated)?(?:\s+while skill is active)?$/i.exec(body)
  if (match && /defeated/i.test(body)) {
    const who = selector(match[1])
    if (who) return `${who}を撃破するごと`
  }

  match = /^Per\s+(.+?)(\s+members?)?$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    if (who) return `${who}ごと`
  }

  match = /^(.+?)\s+(?:have|has)\s+(.+?)\s+status$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    const status = lookupStatus(match[2])
    if (who && status) return `${who}が「${status}」状態`
  }

  // "Ally Renpa Army (other than self) alive" — a qualifier between the
  // selector and its predicate rather than at the end of the clause.
  // "The higher own remaining HP" — a scaling phrase without the (scales) tag.
  match = /^(?:The )?(higher|lower) own remaining HP$/i.exec(body)
  if (match) return /higher/i.test(match[1]) ? '自身の残り体力が高いほど' : '自身の残り体力が低いほど'

  match = /^(.+?)\s*\(([^()]*)\)\s+(present|alive)$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    const qualifier = renderQualifier(match[2])
    if (who && qualifier) {
      return `${who}（${qualifier}）が${/present/i.test(match[3]) ? 'いる場合' : '生存している場合'}`
    }
  }

  match = /^(.+?)\s+(?:members?\s+)?(?:are\s+|is\s+)?(present|alive)$/i.exec(body)
  if (match) {
    const head = match[1].replace(/\benemies\b/i, 'enemy').replace(/\ballies\b/i, 'ally')
    const who = selector(head)
    if (who) return `${who}が${/present/i.test(match[2]) ? 'いる場合' : '生存している場合'}`
  }

  match = /^Other\s+(\[[^\]]+\].*|[A-Z].*)$/.exec(body)
  if (match) {
    const inner = renderConditionBody(match[1])
    if (inner) return `自身以外の${inner}`
  }

  match = /^vs\s+(.+)$/i.exec(body)
  if (match) {
    const target = clean(match[1])
    const against = TAG_INDEX.get(target.toLowerCase()) || selector(target) ||
      (/^(\[[^\]]+\]\s*)+$/.test(target) ? renderTags(target) : null)
    if (against) return `${against}に対して`
  }

  match = /^(.+?)\s+alive in same formation$/i.exec(body)
  if (match) {
    const who = selector(match[1])
    if (who) return `同じ編成に${who}が生存している場合`
  }

  return selector(body)
}

function renderConditionClause(text) {
  const raw = clean(text).replace(/\.$/, '')
  if (!raw) return null
  const phrase = PHRASE_INDEX.get(raw.toLowerCase())
  if (phrase) return phrase
  const { body, qualifier } = splitQualifier(raw)
  const rendered = renderConditionBody(body)
  if (!rendered) return null
  return qualifier ? `${rendered}（${qualifier}）` : rendered
}

function renderConditionExpression(raw) {
  const direct = renderConditionClause(raw)
  if (direct) return direct

  if (raw.includes(',')) {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean).map(renderConditionExpression)
    if (!parts.some((p) => p == null)) return parts.join('、')
  }

  const conjunction = /^(.+?)\s+and\s+(.+)$/i.exec(raw)
  if (conjunction) {
    const left = renderConditionExpression(conjunction[1])
    const right = renderConditionExpression(conjunction[2])
    if (left && right) return `${left}かつ${right}`
  }
  return null
}

export function renderJapaneseCondition(value) {
  const raw = clean(value)
  if (!raw) return value
  return renderConditionExpression(raw) ?? value
}

// ── Durations ───────────────────────────────────────────────────────────────

export function renderJapaneseDuration(value) {
  const raw = clean(value)
  if (!raw) return value
  let match = /^(\d+)\s+turns?$/i.exec(raw)
  if (match) return `${match[1]}ターン`
  match = /^(\d+)\s+times?$/i.exec(raw)
  if (match) return `${match[1]}回`
  match = /^(\d+)\s+attacks?$/i.exec(raw)
  if (match) return `${match[1]}回の攻撃`
  return value
}

// ── Short labels ────────────────────────────────────────────────────────────

/** Translate a standalone label (faction, unit type, stat, status, group). */
export function renderJapaneseTerm(value) {
  const raw = clean(value)
  if (!raw) return null
  return (
    PHRASE_INDEX.get(raw.toLowerCase()) ||
    TAG_INDEX.get(raw.toLowerCase()) ||
    STATUS_INDEX.get(raw.toLowerCase()) ||
    GROUP_INDEX.get(raw.toLowerCase()) ||
    lookupStat(raw)
  )
}

/** Generic entry point for call sites where the field type is unknown. */
export function renderJapaneseText(value) {
  const raw = clean(value)
  if (!raw) return value
  const term = renderJapaneseTerm(raw)
  if (term) return term
  const duration = renderJapaneseDuration(raw)
  if (duration !== raw) return duration
  const condition = renderConditionExpression(raw)
  if (condition) return condition
  const effect = renderEffectClause(raw)
  if (effect) return effect
  const target = renderJapaneseTarget(raw)
  if (target !== raw) return target
  return value
}
