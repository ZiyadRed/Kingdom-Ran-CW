import { describe, expect, it } from 'vitest'
import statusEffects from '../data/glossary/status_effects.json'
import { getReleaseData } from './core.jsx'
import { localizedCharacter } from './i18n/data.js'
import { EFFECT_TERMS, STATUS_EFFECT_COPY, effectTermInfo, effectTermSegments } from './effect-glossary.js'

const STATUS_NAMES = [...statusEffects.buffs, ...statusEffects.debuffs].map(entry => entry.name_en)
const marked = (text, source, locale) => effectTermSegments(text, source, locale)
  .filter(segment => typeof segment !== 'string')
  .map(segment => [segment.text, segment.term.key])

describe('status effect copy shared by the Guide and the skill cards', () => {
  it('covers every Guide status in every translated locale', () => {
    for (const code of ['ja', 'ar', 'fr']) {
      expect(Object.keys(STATUS_EFFECT_COPY[code]).sort(), code).toEqual([...STATUS_NAMES].sort())
      for (const [name, copy] of Object.entries(STATUS_EFFECT_COPY[code])) {
        expect(copy.name, `${code}.${name}`).toBeTruthy()
        expect(copy.description, `${code}.${name}`).toBeTruthy()
      }
    }
  })

  it('keeps the Japanese copy free of English', () => {
    for (const term of EFFECT_TERMS) {
      const { name, description } = effectTermInfo(term, 'ja')
      expect(`${name}${description}`, term.key).not.toMatch(/[A-Za-z]/)
    }
  })

  it('has a keyword and an icon for every Guide status', () => {
    const keys = new Set(EFFECT_TERMS.map(term => term.key))
    for (const name of STATUS_NAMES) expect(keys.has(name), name).toBe(true)
    // Content-versioned like character art, so a redrawn icon is never served stale.
    for (const term of EFFECT_TERMS.filter(term => STATUS_NAMES.includes(term.key))) expect(term.icon, term.key).toMatch(/^\/icons\/status\/.+\.webp\?v=[0-9a-f]{16}$/)
  })

  it('explains a keyword with the Guide’s own name and description', () => {
    const nullify = EFFECT_TERMS.find(term => term.key === 'Attack Nullification')
    expect(effectTermInfo(nullify, 'ja')).toMatchObject({ name: '無効効果', kind: 'buff', icon: expect.stringMatching(/^\/icons\/status\/nullify\.webp\?v=/) })
    expect(effectTermInfo(nullify, 'en').description).toBe(statusEffects.buffs.find(entry => entry.name_en === 'Attack Nullification').description)
    const penetration = EFFECT_TERMS.find(term => term.key === 'DEF Penetration')
    expect(effectTermInfo(penetration, 'ja')).toMatchObject({ name: '防御力貫通', kind: 'stat', icon: null })
  })

  it('heads an Arabic explanation with the word the Arabic skill text uses', () => {
    // Owner decision (2026-11-24): Attack Seal is ختم الهجوم in the Guide too.
    expect(STATUS_EFFECT_COPY.ar['Attack Seal'].name).toBe('ختم الهجوم')
    for (const term of EFFECT_TERMS.filter(term => STATUS_EFFECT_COPY.ar[term.key])) {
      const surface = new RegExp(term.surface.ar.source, term.surface.ar.flags.replace('g', ''))
      expect(STATUS_EFFECT_COPY.ar[term.key].name, term.key).toMatch(surface)
    }
  })
})

describe('effect keywords inside rendered effects', () => {
  it('marks the Japanese status words the renderer prints', () => {
    expect(marked('「錯乱」付与確率20%上昇', 'Confusion Infliction Rate Up 20%', 'ja')).toEqual([['錯乱', 'Confusion']])
    expect(marked('「猛毒」付与確率40%', 'Severe Poison Infliction 40%', 'ja')).toEqual([['猛毒', 'Severe Poison']])
    expect(marked('毒ダメージ100%上昇', 'Poison Damage Up 100%', 'ja')).toEqual([['毒', 'Poison']])
    expect(marked('状態異常無効（挑発を除く）', 'Status Effect Immunity (excl. Provoke)', 'ja')).toEqual([['状態異常無効', 'Status Effect Immunity'], ['挑発', 'Provoke']])
    expect(marked('「通常攻撃封印」付与確率50%', 'Normal Attack Seal 50%', 'ja')).toEqual([['通常攻撃封印', 'Attack Seal']])
    expect(marked('防御力貫通20%上昇、防御力貫通耐性40%上昇', 'DEF Penetration Up 20%, DEF Penetration Resistance Up 40%', 'ja')).toEqual([['防御力貫通', 'DEF Penetration']])
  })

  it('marks the new Reflect effect where each locale names it', () => {
    const source = 'Reflect Cavalry Attacks'
    expect(marked(source, source, 'en')).toEqual([['Reflect', 'Reflect']])
    expect(marked('騎兵武将の攻撃を反射', source, 'ja')).toEqual([['反射', 'Reflect']])
    expect(marked('عكس هجمات الفرسان', source, 'ar')).toEqual([['عكس', 'Reflect']])
    expect(marked('Renvoie les attaques de cavalerie', source, 'fr')).toEqual([['Renvoie', 'Reflect']])
    const reflect = EFFECT_TERMS.find(term => term.key === 'Reflect')
    expect(effectTermInfo(reflect, 'ja')).toMatchObject({ name: '反射効果', kind: 'buff', icon: expect.stringMatching(/^\/icons\/status\/reflect\.webp\?v=/) })
  })

  it('separates the dodge status (見切り) from a raised evasion rate (回避率)', () => {
    expect(marked('見切り20%', 'Evasion (Dodge Chance) 20%', 'ja')).toEqual([['見切り', 'Evasion (Dodge Chance)']])
    expect(marked('回避率20%上昇', 'Evasion (Dodge Chance) Up 20%', 'ja')).toEqual([])
    expect(marked('زيادة التفادي بنسبة 20%', 'Evasion (Dodge Chance) Up 20%', 'ar')).toEqual([])
    expect(marked('Evasion (Dodge Chance) Up 20%', 'Evasion (Dodge Chance) Up 20%', 'en')).toEqual([])
    expect(marked('Evasion (Dodge Chance) 20%', 'Evasion (Dodge Chance) 20%', 'en')).toEqual([['Evasion (Dodge Chance)', 'Evasion (Dodge Chance)']])
  })

  it('matches whole words in Arabic and French, including elision', () => {
    expect(marked('إلحاق السم الشديد 40%', 'Severe Poison Infliction 40%', 'ar')).toEqual([['السم الشديد', 'Severe Poison']])
    expect(marked('زيادة معدل إلحاق الوهم بنسبة 45%', 'Illusion Infliction Rate Up 45%', 'ar')).toEqual([['الوهم', 'Illusion']])
    expect(marked('+45% de chances d’infliger l’illusion', 'Illusion Infliction Rate Up 45%', 'fr')).toEqual([['illusion', 'Illusion']])
    expect(marked('40% de chances d’infliger le poison violent', 'Severe Poison Infliction 40%', 'fr')).toEqual([['poison violent', 'Severe Poison']])
    expect(marked('+30% de résistance à la pénétration de défense', 'DEF Penetration Resistance 30%', 'fr')).toEqual([])
  })

  it('never marks a word the English row does not carry', () => {
    expect(marked('攻撃力20%上昇', 'ATK Up 20%', 'ja')).toEqual([])
    expect(effectTermSegments('攻撃力20%上昇', 'ATK Up 20%', 'ja')).toEqual(['攻撃力20%上昇'])
    expect(effectTermSegments('', 'Guard 60%', 'ja')).toEqual([])
  })

  // Whole-corpus gate: every status an English row carries must be findable in
  // the text each locale actually shows, so no explanation silently disappears
  // when a renderer changes its wording.
  it.each(['en', 'ja', 'ar', 'fr'])('finds every carried keyword in the %s effect text', code => {
    const missing = []
    let checked = 0
    for (const character of getReleaseData(Infinity).ALL) {
      const localized = localizedCharacter(character, code)
      const skills = [...localized.skills, ...(localized.roleSkill ? [localized.roleSkill] : [])]
      for (const skill of skills) {
        for (const row of skill.displayEffects || []) {
          const source = row.sourceEffect ?? row.effect
          const found = new Set(marked(row.effect, source, code).map(([, key]) => key))
          for (const term of EFFECT_TERMS.filter(term => term.source.test(String(source || '')))) {
            checked += 1
            if (!found.has(term.key)) missing.push(`${character.id}: ${source} => ${row.effect} (${term.key})`)
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(300)
    expect(missing).toEqual([])
  })
})
