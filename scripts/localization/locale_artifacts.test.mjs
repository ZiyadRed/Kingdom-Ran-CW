// Phase 3 artifact contract tests.
//
// Deliberately placed OUTSIDE src/ and reading the artifacts with fs rather than
// importing them, so no Japanese artifact ever enters the application module
// graph while Phase 3 is data-only.
//
// These mirror the prebuild validator so `npm test` also catches artifact drift
// during development, without waiting for a build.
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const J = (p) => JSON.parse(readFileSync(join(root, p), 'utf-8'))

const SNAPSHOT = '59408FDF1D9E5A6B0A18DA30D4175EE90B2D0B2554E7D17D53FFD04B91A931E0'
const AMBIGUOUS_KEYS = ['futei#0', 'gakuki#0', 'jiou#1', 'kousonryu#0']

const skillName = J('data/source/ja/skill_name.raw.json')
const skillDesc = J('data/source/ja/skill_desc.raw.json')
const generalRuby = J('data/source/ja/general_ruby.raw.json')
const effectDesc = J('data/source/ja/skill_effect_desc.raw.json')
const skills = J('data/generated/ja/skills.json')
const index = J('data/generated/source_index.json')
const readings = J('data/generated/ja/character_readings.json')
const provenance = J('data/source/_provenance.json')
const skillMap = J('data/source/cw_skills.map.json')

const characters = []
for (const f of readdirSync(join(root, 'data/characters'))) {
  if (!f.endsWith('.json')) continue
  for (const c of J(`data/characters/${f}`)) if (c?.id) characters.push(c)
}

describe('raw STBL snapshots', () => {
  it.each([
    ['skill name', skillName, 'MsgUnionConquestSkillName.stbl', 869],
    ['skill desc', skillDesc, 'MsgUnionConquestSkillDesc.stbl', 869],
    ['general ruby', generalRuby, 'MsgUnitGeneralRubyName.stbl', 609],
    ['effect desc', effectDesc, 'MsgUnionConquestSkillEffectDesc.stbl', 1020],
  ])('%s is a verbatim table of the expected size', (_label, doc, table, count) => {
    expect(doc._meta.schema).toBe('ranhq.stbl_raw/1')
    expect(doc._meta.table).toBe(table)
    expect(doc._meta.entries).toBe(count)
    expect(doc.values).toHaveLength(count)
    expect(doc._meta.sha256).toMatch(/^[0-9A-F]{64}$/)
    expect(provenance.stblTables[table]).toEqual({ sha256: doc._meta.sha256, entries: count })
  })

  it('preserves source artefacts verbatim, including literal "null" entries', () => {
    expect(skillName.values[0]).toBe('null')
    expect(skillDesc.values[0]).toBe('null')
    expect(generalRuby.values[0]).toBe('null')
    expect(effectDesc.values[0]).toBe('')
    // Multi-clause descriptions keep their embedded newlines.
    expect(skillDesc.values[731]).toContain('\n')
  })
})

describe('generated Japanese skills', () => {
  it('holds 600 canonical entries covering 657 deterministic project rows', () => {
    expect(skills._meta.schema).toBe('ranhq.ja_skills/1')
    expect(skills._meta.sourceSnapshot).toBe(SNAPSHOT)
    expect(Object.keys(skills.skills)).toHaveLength(600)
    expect(skills._meta.rows).toBe(600)
    expect(skills._meta.coveredProjectRows).toBe(657)
  })

  it('matches the raw source byte-for-byte at every mapped textId', () => {
    let verified = 0
    for (const [key, entry] of Object.entries(index.skills)) {
      if (entry.status === 'ambiguous' || entry.status === 'pending_source') continue
      const textId = skillMap.skills[key].textId
      const generated = skills.skills[String(entry.skillId)]
      expect(generated, `missing generated skill for ${key}`).toBeDefined()
      expect(generated.name).toBe(skillName.values[textId])
      expect(generated.desc).toBe(skillDesc.values[textId])
      verified++
    }
    expect(verified).toBe(657)
  })

  it('carries no provenance, evidence or candidate metadata', () => {
    for (const entry of Object.values(skills.skills)) {
      expect(Object.keys(entry).sort()).toEqual(['desc', 'name'])
    }
  })

  it('resolves the representative rows to their verified source text', () => {
    const nameFor = (key) => skills.skills[String(index.skills[key].skillId)].name
    expect(index.skills['ka#0'].skillId).toBe(733)
    expect(nameFor('ka#0')).toBe('士気回復【赤羊】')
    expect(nameFor('ka#1')).toBe('希望の光')
    expect(nameFor('ka#2')).toBe('部隊保護・特大改')
    expect(index.skills['raido#3'].skillId).toBe(506)
    expect(nameFor('raido#3')).toBe('野盗の腹心☆6')
    // Source spelling is preserved; the project's own name_jp is NOT rewritten.
    expect(index.skills['kakuun#2'].skillId).toBe(600)
    expect(nameFor('kakuun#2')).toBe('不動の守護')
    expect(characters.find((c) => c.id === 'kakuun').skills[2].name_jp).toBe('不動の守備')
  })
})

describe('source index', () => {
  it('covers every current project skill row exactly once', () => {
    const projectKeys = []
    for (const c of characters) {
      ;(c.skills || []).forEach((_, i) => projectKeys.push(`${c.id}#${i}`))
    }
    expect(projectKeys).toHaveLength(661)
    expect(Object.keys(index.skills).sort()).toEqual(projectKeys.sort())
  })

  it('assigns 657 canonical ids and leaves exactly 4 unassigned', () => {
    const entries = Object.values(index.skills)
    expect(entries.filter((e) => e.skillId !== null)).toHaveLength(657)
    // Four ambiguous rows remain fail-closed by design.
    expect(entries.filter((e) => e.skillId === null)).toHaveLength(4)
    expect(entries.filter((e) => e.status === 'ambiguous')).toHaveLength(4)
    expect(entries.filter((e) => e.status === 'pending_source')).toHaveLength(0)
  })
})

describe('ambiguous rows', () => {
  it('are exactly the four known rows and stay unassigned', () => {
    const ambiguous = Object.entries(index.skills)
      .filter(([, e]) => e.status === 'ambiguous')
      .map(([k]) => k)
    expect(ambiguous.sort()).toEqual([...AMBIGUOUS_KEYS].sort())
    for (const key of AMBIGUOUS_KEYS) {
      expect(index.skills[key].skillId).toBeNull()
      expect(skillMap.skills[key].skillId).toBeNull()
    }
  })

  it('never receives generated Japanese text', () => {
    for (const key of AMBIGUOUS_KEYS) {
      for (const candidate of skillMap.skills[key].candidates || []) {
        // A candidate id may coincidentally be canonical for a DIFFERENT project
        // row; what must never happen is this row resolving to one.
        expect(index.skills[key].skillId).not.toBe(candidate.skillId)
      }
    }
  })
})

describe('character readings', () => {
  it('covers all 209 slugs with 188 readings and 21 nulls', () => {
    expect(readings._meta.schema).toBe('ranhq.ja_character_readings/1')
    const values = Object.values(readings.characters)
    expect(values).toHaveLength(209)
    expect(values.filter((v) => typeof v === 'string' && v.length > 0)).toHaveLength(188)
    expect(values.filter((v) => v === null)).toHaveLength(21)
    expect(readings._meta.available).toBe(188)
    expect(readings._meta.missing).toBe(21)
  })

  it('uses only real character slugs and invents no readings', () => {
    const slugs = new Set(characters.map((c) => c.id))
    for (const slug of Object.keys(readings.characters)) expect(slugs.has(slug)).toBe(true)
    expect(readings.characters.ka).toBe('たいしか')
    expect(readings.characters.ordo).toBeNull()
  })
})
