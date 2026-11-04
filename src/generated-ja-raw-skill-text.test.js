import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import generated from './generated/ja-raw-skill-text.js'
import { TEXT_ID_SOURCES, collectTextIds, deriveJaRawSkillText } from '../scripts/generate_ja_raw_skill_text.mjs'

const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'))

describe('client Japanese raw skill projection', () => {
  it('is in sync with the committed raw STBL tables', () => {
    expect(generated).toEqual(deriveJaRawSkillText())
  })

  it('keeps every referenced textId byte-identical to the raw tables', () => {
    const names = read('data/source/ja/skill_name.raw.json').values
    const descs = read('data/source/ja/skill_desc.raw.json').values
    const ids = new Set()
    for (const path of TEXT_ID_SOURCES) collectTextIds(read(path), ids)
    expect(ids.size).toBeGreaterThan(0)
    for (const id of ids) {
      if (!names[id]) continue
      expect(generated[id], String(id)).toEqual([names[id], descs[id] || ''])
    }
  })
})
