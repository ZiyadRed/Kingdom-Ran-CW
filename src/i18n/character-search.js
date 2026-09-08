import { correctedCharacterSearchTarget, matchesCharacterName, normalizeArabicSearchText } from './ar-character-names.js'
import { localizedCharacter, localizedText } from './data.js'
import { TAGS as AR_TAGS } from './ar-lexicon.js'
import { TAGS as FR_TAGS } from './fr-lexicon.js'

// Fold French accents and Arabic vowel marks, retaining Japanese dakuten.
// The existing Romaji/alias normalizer remains owned by matchesCharacterName.
export function normalizeContentSearch(value) {
  return normalizeArabicSearchText(value).toLowerCase().normalize('NFD')
    .replace(/(\p{Script=Latin})\p{M}+/gu, '$1')
    .normalize('NFC').replace(/\s+/g, ' ').trim()
}

const cache = new WeakMap()
function termForms(value, code) {
  const tag = (code === 'ar' ? AR_TAGS : code === 'fr' ? FR_TAGS : {})[value]
  return [value, localizedText(value, code), ...['coll', 'sing', 'one', 'two', 'few', 'label', 's', 'p'].map(key => tag?.[key]), ...(tag?.searchAliases || [])]
}

// Authored synonyms search the same concept in rendered sentences as well as
// unit badges (e.g. French "infanterie" and the site's "fantassins").
const queryAliases = new Map(['ar', 'fr'].map(code => [code, new Map(
  Object.entries(code === 'ar' ? AR_TAGS : FR_TAGS).flatMap(([term, tag]) =>
    (tag.searchAliases?.length?termForms(term,code).filter(Boolean):[]).map(alias => [normalizeContentSearch(alias), termForms(term, code).filter(Boolean).map(normalizeContentSearch)]),
  ),
)]))

function contentFields(character, code) {
  let locales = cache.get(character)
  if (!locales) { locales = new Map(); cache.set(character, locales) }
  if (locales.has(code)) return locales.get(code)
  const display = localizedCharacter(character, code), fields = []
  const add = (values, hint = null) => {
    for (const value of values) if (typeof value === 'string' && value.trim()) fields.push({ text: normalizeContentSearch(value), hint })
  }
  add([display.displayName, display.displaySecondaryName, display.sourceReading])
  for (const value of [character.unit_type, character.unit, character.country, character.rarity, ...(character.groups || [])].filter(Boolean)) add(termForms(value, code))
  for (const skill of [...display.skills, ...(display.roleSkill ? [display.roleSkill] : [])]) {
    const label = `${localizedText(skill.type, code)}: ${skill.displayName}`
    add([skill.type, localizedText(skill.type, code), skill.name_en, skill.name_jp, skill.displayName, skill.sourceNameJp, skill.descriptionJp], label)
    for (const [index, effect] of (skill.effects || []).entries()) {
      const rendered = skill.displayEffects?.[index] || effect
      for (const key of ['condition', 'target', 'effect', 'duration']) add([effect[key], rendered[key]], rendered[key])
    }
  }
  locales.set(code, fields)
  return fields
}

// Return the rendered field for Archive's existing match hint; all pickers use
// the same truth value. Data objects are immutable per load; new objects get a
// new cache entry, so a correction with the same ID cannot reuse stale text.
export function characterContentMatch(character, query, locale = 'en', extraTerms = []) {
  if (!String(query ?? '').trim()) return { hint: null }
  if (matchesCharacterName(character, query)) return { hint: null, nameMatch: matchesCharacterName(character, query, { exact: true }) ? 'exact' : 'partial' }
  if (correctedCharacterSearchTarget(query)) return null
  const code = typeof locale === 'string' ? locale : locale.code
  const normalized = normalizeContentSearch(query)
  if (!normalized) return null
  const queries = queryAliases.get(code)?.get(normalized) || [normalized]
  const includesQuery = value => queries.some(query => value.includes(query))
  const field = contentFields(character, code).find(field => includesQuery(field.text))
  if (field) return field
  if (extraTerms.some(term => termForms(term, code).some(value => value && includesQuery(normalizeContentSearch(value))))) return { hint: null }
  return null
}
