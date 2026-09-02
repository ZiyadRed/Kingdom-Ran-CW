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

/**
 * Whole-corpus gate for the two semantic renderers.
 *
 * The unit tests above pin individual phrasings; this one guards the thing that
 * actually regressed historically — overall coverage, and the absence of hybrid
 * output. It reads the real character data rather than a fixture, so adding a
 * character with an unmodelled effect shape shows up here instead of on a page.
 */

const CHARACTERS_DIR = join(process.cwd(), 'data/characters')
const FIELDS = ['effect', 'target', 'condition', 'duration']

function buildCorpus() {
  const counts = Object.fromEntries(FIELDS.map((f) => [f, new Map()]))
  for (const file of readdirSync(CHARACTERS_DIR)) {
    if (!file.endsWith('.json')) continue
    const doc = JSON.parse(readFileSync(join(CHARACTERS_DIR, file), 'utf8'))
    for (const character of Array.isArray(doc) ? doc : Object.values(doc)) {
      if (!character || typeof character !== 'object') continue
      const skills = [...(character.skills || []), ...(character.roleSkill ? [character.roleSkill] : [])]
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
}

/**
 * English words that must never survive inside otherwise-translated output.
 * Proper names are excluded on purpose — a Latin character or army name is the
 * documented fallback, not a defect.
 */
const FUNCTION_WORDS = /(^|[^A-Za-z])(and|or|are|is|both|the|of|with|when|per|from|by|to|in|on|for|other|than|self|alive|present|each|besides|while|has|have|highest|lowest|Up|Down|Damage|Resistance|Immunity|turns?|times?)([^A-Za-z]|$)/

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
      if (out !== source && script.test(out)) {
        localized += count
        if (FUNCTION_WORDS.test(out)) hybrids.push(`${source}  =>  ${out}`)
      } else {
        untouched.push(source)
      }
    }
  }
  return { total, localized, hybrids, untouched }
}

describe.each(['ar', 'ja'])('%s effect corpus', (code) => {
  const result = measure(code)

  it('never emits hybrid English/translated output', () => {
    // The original defect class: partial substitution leaving English function
    // words stranded inside a translated string.
    expect(result.hybrids).toEqual([])
  })

  it('localizes the corpus to the level this locale has reached', () => {
    // Arabic reached full semantic coverage, so any new mechanic the renderer
    // cannot model must surface here rather than quietly shipping English.
    // Japanese still has a small set of unmodelled compound shapes, so it is
    // held to its coverage level instead of to zero.
    //
    // Both are asserted as properties of whatever data is present — adding
    // character 209 must not look like corruption.
    if (code === 'ar') {
      expect(result.untouched).toEqual([])
      expect(result.localized).toBe(result.total)
      return
    }
    const pct = (100 * result.localized) / result.total
    expect(pct).toBeGreaterThan(99)
  })

})
