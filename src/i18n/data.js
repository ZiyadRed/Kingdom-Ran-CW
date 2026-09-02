import jaSkillsDocument from '../../data/generated/ja/skills.json'
import sourceIndexDocument from '../../data/generated/source_index.json'
import characterReadingsDocument from '../../data/generated/ja/character_readings.json'
import localizationTermsDocument from '../../data/glossary/localization_terms.json'
import rawSkillNamesDocument from '../../data/source/ja/skill_name.raw.json'
import rawSkillDescriptionsDocument from '../../data/source/ja/skill_desc.raw.json'
import roleSkillsDocument from '../../data/souha_role_skills.json'
import { AR_CHARACTER_NAMES } from './ar-character-names.js'
import {
  renderArabicCondition,
  renderArabicDuration,
  renderArabicEffect,
  renderArabicTarget,
  renderArabicText,
} from './ar-render.js'
import { GROUPS, PHRASES, STATUSES, TAGS } from './ar-lexicon.js'
import { resolveJapaneseEntities } from './ja-source.js'
import {
  renderJapaneseCondition,
  renderJapaneseDuration,
  renderJapaneseEffect,
  renderJapaneseTarget,
  renderJapaneseText,
} from './ja-render.js'

const JA_SKILLS = jaSkillsDocument.skills || {}
const SOURCE_INDEX = sourceIndexDocument.skills || {}
const JA_READINGS = characterReadingsDocument.characters || {}
const JA_RAW_SKILL_NAMES = rawSkillNamesDocument.values || []
const JA_RAW_SKILL_DESCRIPTIONS = rawSkillDescriptionsDocument.values || []
const ROLE_SKILL_TEXT_IDS = Object.fromEntries(
  (roleSkillsDocument.skills || [])
    .map((row) => [row?.skill?.cwId, row?.skill?.textId])
    .filter(([cwId, textId]) => Number.isInteger(cwId) && Number.isInteger(textId)),
)
/**
 * Character names on Arabic pages.
 *
 * POLICY: every character keeps its canonical Latin name.
 *
 * The previous implementation carried Arabic spellings for 20 of 208
 * characters, which made rosters, the Party Builder and the tier list
 * alternate unpredictably between Arabic and Latin within a single row, while
 * still sorting by the English name. A partial set is worse than either
 * consistent option, and inventing 188 unverified transliterations would risk
 * misidentifying generals. Latin names are also what the effect and condition
 * text references, so one form is now used everywhere.
 *
 * If a fully reviewed Arabic name set is ever produced, reintroduce it here as
 * a complete map rather than a partial one.
 */
// Owner policy 2026-08-30: a complete Arabic name set now exists.
// See src/i18n/ar-character-names.js.

/**
 * Canonical shared terminology, exposed for tooling and tests.
 *
 * The maintained glossary stays authoritative; the lexicon supplies the game
 * terms the renderer uses. This map is a read-only view over both — it is NOT
 * a substitution table, and nothing at runtime rewrites text word by word.
 */
const CANONICAL_AR_TERMS = Object.fromEntries(
  (localizationTermsDocument.terms || [])
    .filter((term) => term.english && term.arabic)
    .map((term) => [term.english, term.arabic]),
)

const LEXICON_TERMS = { ...TAGS, ...STATUSES, ...GROUPS, ...PHRASES }
const ARABIC_TERMS = { ...LEXICON_TERMS, ...CANONICAL_AR_TERMS }

export function japaneseSkillSource(characterId, skillIndex) {
  const key = `${characterId}#${skillIndex}`
  const row = SOURCE_INDEX[key]
  if (!row || row.skillId === null || row.skillId === undefined) return null
  const source = JA_SKILLS[String(row.skillId)]
  if (!source) return null
  return {
    ...source,
    skillId: row.skillId,
    status: row.status,
    key,
  }
}

function japaneseSkillSourceById(skillId, textId) {
  if (skillId === null || skillId === undefined) return null
  const source = JA_SKILLS[String(skillId)]
  if (source) return { ...source, skillId, status: 'exact', key: null }
  // Leader/Strategist role skills are stored in the role catalogue with a
  // stable textId, but are not ordinary four-slot rows in cw_skills.map.json.
  // Read those IDs directly from the committed raw STBL artifacts.
  const roleTextId = Number.isInteger(textId) ? textId : ROLE_SKILL_TEXT_IDS[skillId]
  if (Number.isInteger(roleTextId) && JA_RAW_SKILL_NAMES[roleTextId]) {
    return {
      skillId,
      textId: roleTextId,
      name: JA_RAW_SKILL_NAMES[roleTextId],
      desc: JA_RAW_SKILL_DESCRIPTIONS[roleTextId] || '',
      status: 'role_raw',
      key: null,
    }
  }
  return null
}

export function localizedSkill(skill, characterId, skillIndex, localeOrCode = 'en') {
  const code = typeof localeOrCode === 'string' ? localeOrCode : localeOrCode?.code || 'en'
  const source = japaneseSkillSource(characterId, skillIndex) || japaneseSkillSourceById(skill?.cwId, skill?.textId)
  const next = { ...skill }
  if (source) {
    next.sourceStatus = 'VERIFIED_ORIGINAL'
    next.sourceSkillId = source.skillId
    // Original Japanese is presented with its general references resolved:
    // 味方「{-1:261}」… reads 味方「蒼仁」…. The raw artifact keeps the token.
    next.sourceNameJp = resolveJapaneseEntities(source.name)
    next.descriptionJp = resolveJapaneseEntities(source.desc)
  } else {
    next.sourceStatus = 'UNKNOWN'
  }
  next.displayName = code === 'ja'
    ? (source?.name || skill?.name_jp || skill?.name_en || '名称未設定')
    : code === 'ar'
      ? (skill?.name_en || source?.name || 'مهارة بلا اسم')
      : (skill?.name_en || skill?.name || 'Unnamed skill')
  // Each field gets its own renderer: a target, a condition and an effect have
  // different grammar even when they share vocabulary. Skill names and
  // descriptions are never rendered here — those stay source-verbatim.
  const RENDERERS = {
    ar: [renderArabicCondition, renderArabicTarget, renderArabicEffect, renderArabicDuration],
    ja: [renderJapaneseCondition, renderJapaneseTarget, renderJapaneseEffect, renderJapaneseDuration],
  }
  const renderers = RENDERERS[code]
  if (renderers) {
    const [condition, target, effect, duration] = renderers
    next.displayEffects = (skill?.effects || []).map((row) => ({
      ...row,
      condition: condition(row?.condition),
      target: target(row?.target),
      effect: effect(row?.effect),
      duration: duration(row?.duration),
    }))
  } else {
    next.displayEffects = skill?.effects || []
  }
  return next
}

export function localizedCharacter(character, localeOrCode = 'en') {
  const code = typeof localeOrCode === 'string' ? localeOrCode : localeOrCode?.code || 'en'
  const skills = (character?.skills || []).map((skill, index) =>
    localizedSkill(skill, character?.id, index, code),
  )
  const roleSkill = character?.roleSkill
    ? localizedSkill(character.roleSkill, character?.id, -1, code)
    : character?.roleSkill
  const displayName = code === 'ja'
    ? (character?.name_jp || character?.name_en || '名称未設定')
    : code === 'ar'
      ? (AR_CHARACTER_NAMES[character?.name_en] || character?.name_en || 'جنرال غير معروف')
      : (character?.name_en || character?.name_jp || 'Unknown')
  return {
    ...character,
    skills,
    roleSkill,
    displayName,
    displaySecondaryName: character?.name_jp || '',
    sourceReading: JA_READINGS[character?.id] || null,
  }
}

/**
 * Localize a game-data string whose field type is unknown at the call site
 * (filter chips, buff stat labels, condition chips). Non-Arabic locales are
 * returned untouched.
 */
export function localizedText(value, localeOrCode = 'en') {
  const code = typeof localeOrCode === 'string' ? localeOrCode : localeOrCode?.code || 'en'
  if (code === 'ar') return renderArabicText(value)
  if (code === 'ja') return renderJapaneseText(value)
  return value
}

/** Localize a field with known grammar instead of relying on generic inference. */
export function localizedTarget(value, localeOrCode = 'en') {
  const code = typeof localeOrCode === 'string' ? localeOrCode : localeOrCode?.code || 'en'
  if (code === 'ar') return renderArabicTarget(value)
  if (code === 'ja') return renderJapaneseTarget(value)
  return value
}

/** Localize a turn/time/attack count shown outside a skill card. */
export function localizedDuration(value, localeOrCode = 'en') {
  const code = typeof localeOrCode === 'string' ? localeOrCode : localeOrCode?.code || 'en'
  if (code === 'ar') return renderArabicDuration(value)
  if (code === 'ja') return renderJapaneseDuration(value)
  return value
}

export const ARABIC_CHARACTER_NAMES = AR_CHARACTER_NAMES
export { CANONICAL_AR_TERMS }
export { ARABIC_TERMS }
