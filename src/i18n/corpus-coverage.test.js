import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  renderArabicCondition,
  renderArabicDuration,
  renderArabicEffect,
  renderArabicTarget,
} from './ar-render.js'
import {
  renderJapaneseCondition,
  renderJapaneseDuration,
  renderJapaneseEffect,
  renderJapaneseTarget,
} from './ja-render.js'
import {
  renderFrenchCondition,
  renderFrenchDuration,
  renderFrenchEffect,
  renderFrenchTarget,
} from './fr-render.js'

/**
 * Whole-corpus gate for the three semantic renderers.
 *
 * The unit tests above pin individual phrasings; this one guards the thing that
 * actually regressed historically — overall coverage, and the absence of hybrid
 * output. It reads the real character data rather than a fixture, so adding a
 * character with an unmodelled effect shape shows up here instead of on a page.
 */

const CHARACTERS_DIR = join(process.cwd(), 'data/characters')
const FIELDS = ['effect', 'target', 'condition', 'duration']
const ROLE_SKILLS=JSON.parse(readFileSync(join(process.cwd(),'data/souha_role_skills.json'),'utf8')).skills
const ROLES_BY_OWNER=new Map(ROLE_SKILLS.map(entry=>[entry.owner_id,entry.skill]))

function buildCorpus() {
  const counts = Object.fromEntries(FIELDS.map((f) => [f, new Map()]))
  for (const file of readdirSync(CHARACTERS_DIR)) {
    if (!file.endsWith('.json')) continue
    const doc = JSON.parse(readFileSync(join(CHARACTERS_DIR, file), 'utf8'))
    for (const character of Array.isArray(doc) ? doc : Object.values(doc)) {
      if (!character || typeof character !== 'object') continue
      const roleSkill=ROLES_BY_OWNER.get(character.id)||character.roleSkill
      const skills = [...(character.skills || []), ...(roleSkill ? [roleSkill] : [])]
      for (const skill of skills) {
        for (const row of skill?.effects || []) {
          for (const field of FIELDS) {
            const value = row?.[field]
            if (typeof value === 'string' && value.trim()) {
              counts[field].set(value, (counts[field].get(value) || 0) + 1)
            }
          }
        }
      }
    }
  }
  return counts
}

const CORPUS = buildCorpus()

const RENDERERS = {
  ar: {
    script: /[؀-ۿ]/,
    effect: renderArabicEffect,
    target: renderArabicTarget,
    condition: renderArabicCondition,
    duration: renderArabicDuration,
  },
  ja: {
    script: /[぀-ヿ一-鿿]/,
    effect: renderJapaneseEffect,
    target: renderJapaneseTarget,
    condition: renderJapaneseCondition,
    duration: renderJapaneseDuration,
  },
  // French shares the Latin script with the source, so "did this row get
  // translated?" cannot be answered by a script test. A row counts as done
  // when the renderer changed it, or when nothing English is left to change
  // (a bare canonical general name such as "Riboku").
  fr: {
    script: null,
    effect: renderFrenchEffect,
    target: renderFrenchTarget,
    condition: renderFrenchCondition,
    duration: renderFrenchDuration,
  },
}

/**
 * English words that must never survive inside otherwise-translated output.
 * Proper names are excluded on purpose — a Latin character or army name is the
 * documented fallback, not a defect.
 */
// Accented letters are word characters too: without them in the boundary
// class, French "forêt" would read as the English word "for".
const FUNCTION_WORDS = /(^|[^A-Za-zÀ-ÖØ-öø-ÿ])(and|or|are|is|both|the|of|with|when|per|from|by|to|in|on|for|other|than|self|alive|present|each|besides|while|has|have|highest|lowest|Up|Down|Damage|Resistance|Immunity|turns?|times?)([^A-Za-zÀ-ÖØ-öø-ÿ]|$)/

function measure(code) {
  const { script, ...renderers } = RENDERERS[code]
  let total = 0
  let localized = 0
  const hybrids = []
  const untouched = []
  for (const field of FIELDS) {
    for (const [source, count] of CORPUS[field]) {
      total += count
      const out = renderers[field](source)
      const translated = script ? out !== source && script.test(out) : out !== source || !FUNCTION_WORDS.test(out)
      if (translated) {
        localized += count
        if (FUNCTION_WORDS.test(out)) hybrids.push(`${source}  =>  ${out}`)
      } else {
        untouched.push(source)
      }
    }
  }
  return { total, localized, hybrids, untouched }
}

describe.each(['ar', 'ja', 'fr'])('%s effect corpus', (code) => {
  const result = measure(code)

  it('never emits hybrid English/translated output', () => {
    // The original defect class: partial substitution leaving English function
    // words stranded inside a translated string.
    expect(result.hybrids).toEqual([])
  })

  it('localizes the corpus to the level this locale has reached', () => {
    // Every runtime character and merged role field must be modelled. New
    // unrecognised mechanics fail closed in production and fail this gate.
    expect(result.untouched).toEqual([])
    expect(result.localized).toBe(result.total)
  })

})
