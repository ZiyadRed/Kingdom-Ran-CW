import { describe, expect, it } from 'vitest'
import {
  arCount,
  definite,
  joinAnd,
  lamOf,
  renderArabicCondition,
  renderArabicDuration,
  renderArabicEffect,
  renderArabicTarget,
  renderArabicTerm,
  renderArabicText,
} from './ar-render.js'
import { ALL, normalizeEnemyTarget, parseBuffEffect } from '../core.jsx'

/**
 * Every input below is a verbatim string from data/characters/*.json, so these
 * tests describe what the site actually renders rather than mirroring the
 * implementation. The regressions they lock down are the defects found in the
 * independent Arabic audit.
 */

describe('Arabic grammar helpers', () => {
  it('counts in all four Arabic shapes, not just singular and plural', () => {
    const turns = { one: 'جولة واحدة', two: 'جولتان', few: 'جولات', many: 'جولة' }
    expect(arCount(1, turns)).toBe('جولة واحدة')
    expect(arCount(2, turns)).toBe('جولتان')
    expect(arCount(3, turns)).toBe('3 جولات')
    expect(arCount(10, turns)).toBe('10 جولات')
    expect(arCount(11, turns)).toBe('11 جولة')
    expect(arCount(0, turns)).toBe('0 جولة')
  })

  it('elides the article when attaching the preposition laam', () => {
    expect(lamOf('الصحة')).toBe('للصحة')
    expect(lamOf('المعنويات')).toBe('للمعنويات')
    // An ordinary Arabic word joins directly; only a Latin token needs tatweel.
    expect(lamOf('حليف')).toBe('لحليف')
    expect(lamOf('CW')).toBe('لـCW')
  })

  it('attaches waw to the following word without a space', () => {
    expect(joinAnd(['الهجوم', 'الدفاع'])).toBe('الهجوم والدفاع')
  })

  it('only makes single-word nouns definite', () => {
    expect(definite('منحدر')).toBe('المنحدر')
    expect(definite('نقطة تفتيش')).toBe('نقطة تفتيش')
    expect(definite('الماء')).toBe('الماء')
  })
})

describe('Arabic effect rendering', () => {
  it('renders a stat change as a verbal noun, not a reversed noun pair', () => {
    // Audit AR-003: this produced "الهجوم زيادة 20%" ("the-attack increase").
    expect(renderArabicEffect('ATK Up 20%')).toBe('زيادة الهجوم بنسبة 20%')
    expect(renderArabicEffect('DEF Up 20%')).toBe('زيادة الدفاع بنسبة 20%')
    expect(renderArabicEffect('ATK Down 20%')).toBe('خفض الهجوم بنسبة 20%')
    expect(renderArabicEffect('DEF Penetration Up 20%')).toBe('زيادة اختراق الدفاع بنسبة 20%')
  })

  it('builds a valid idafa for Max stats', () => {
    // Audit AR-003: "الحد الأقصى الصحة زيادة 100%" is not valid Arabic at all.
    expect(renderArabicEffect('Max HP Up 100%')).toBe('زيادة الحد الأقصى للصحة بنسبة 100%')
    expect(renderArabicEffect('Max Morale Up 60%')).toBe('زيادة الحد الأقصى للمعنويات بنسبة 60%')
  })

  it('puts the damage noun before its percentage', () => {
    // Audit AR-003: "150% الضرر" kept English order and wrong definiteness.
    expect(renderArabicEffect('150% Damage')).toBe('ضرر 150%')
    expect(renderArabicEffect('% of Remaining HP Damage 20%')).toBe('ضرر بنسبة 20% من الصحة المتبقية')
  })

  it('orders a resistance as a genitive construct', () => {
    // Audit AR-003: "ارتباك مقاومة 100%" reversed the genitive.
    expect(renderArabicEffect('Confusion Resistance 100%')).toBe('زيادة مقاومة الارتباك بنسبة 100%')
    expect(renderArabicText('Confusion Resistance')).toBe('مقاومة الارتباك')
    expect(renderArabicText('Betrayal Resistance')).toBe('مقاومة الخيانة')
    expect(renderArabicEffect('Attack Down Resistance Up 40%')).toBe('زيادة مقاومة خفض الهجوم بنسبة 40%')
  })

  it('merges shared stats into one verbal-noun phrase', () => {
    expect(renderArabicEffect('ATK Up, DEF Up 30%')).toBe('زيادة الهجوم والدفاع بنسبة 30%')
    expect(renderArabicEffect('ATK Up / DEF Up 30%')).toBe('زيادة الهجوم والدفاع بنسبة 30%')
    expect(renderArabicEffect('ATK Up 30%, DEF Up 30%')).toBe('زيادة الهجوم والدفاع بنسبة 30%')
  })

  it('preserves each value when compound stats have different percentages', () => {
    expect(renderArabicEffect('Max HP Up 100%, DEF Up 30%'))
      .toBe('زيادة الحد الأقصى للصحة بنسبة 100% / زيادة الدفاع بنسبة 30%')
    expect(renderArabicEffect('DEF Up 40%, Critical Damage Up 30%'))
      .toBe('زيادة الدفاع بنسبة 40% / زيادة الضرر الحرج بنسبة 30%')
    expect(renderArabicEffect('Max HP Up 100%, ATK Up 30%, DEF Up 30%'))
      .toBe('زيادة الحد الأقصى للصحة بنسبة 100% / زيادة الهجوم بنسبة 30% / زيادة الدفاع بنسبة 30%')
  })

  it('does not split a separator that sits inside a number', () => {
    expect(renderArabicEffect('HP Recovery 50,000')).toBe('استعادة الصحة 50,000')
  })

  it('uses the meaning of the Japanese source, not the English wording', () => {
    // 体力回復無効 — healing is nullified, so a literal "HP seal" misstates it.
    expect(renderArabicEffect('HP Seal 50%')).toBe('ختم استعادة الصحة 50%')
    // 体力に吸収する — the caster absorbs what it deals (lifesteal).
    expect(renderArabicEffect('HP Drain 100%')).toBe('امتصاص الصحة بنسبة 100%')
  })

  it('keeps a canonical phrase whole instead of translating its words', () => {
    // Audit AR-001: the generic 'of'/'General' entries produced
    // "Way من Great جنرال" inside a proper name.
    expect(renderArabicEffect('Way of The Great General')).toBe('طريق الجنرال العظيم')
    expect(renderArabicTerm('Way of The Great General')).toBe('طريق الجنرال العظيم')
  })

  it('returns the original English rather than emitting broken Arabic', () => {
    const unknown = 'Some Entirely Unmodelled Effect Phrase'
    expect(renderArabicEffect(unknown)).toBe(unknown)
    expect(renderArabicEffect('[Wizard] ATK Up 20%')).toBe('[Wizard] ATK Up 20%')
    expect(renderArabicEffect('ATK Up 20..%')).toBe('ATK Up 20..%')
  })
})

describe('Arabic target rendering', () => {
  it('agrees the enemy count with Arabic number rules', () => {
    // Audit AR-003: "1 عدو" / "3 عدو" ignored dual and plural agreement.
    expect(renderArabicTarget('1 enemy [General]')).toBe('جنرال واحد من العدو')
    expect(renderArabicTarget('2 enemy [General]')).toBe('جنرالان من العدو')
    expect(renderArabicTarget('3 enemy [General]')).toBe('3 جنرالات من العدو')
  })

  it('orders a possessive target correctly', () => {
    // Audit AR-003: "[سلاح حصار] إصلاح" and "حليف الهجوم" were reversed.
    expect(renderArabicTarget('[Siege Weapon] repair')).toBe('إصلاح أسلحة الحصار')
    expect(renderArabicTarget('Ally attack [Siege Weapon]')).toBe('هجوم أسلحة الحصار الحليفة')
  })

  it('renders an army as a noun plus its canonical Latin name', () => {
    // Audit AR-004: "حليف Kanki جيش" mixed scripts in the wrong order.
    expect(renderArabicTarget('Ally Kanki Army')).toBe('حليف من جيش كانكي')
    expect(renderArabicTarget('Ally Hi Shin Unit [General]')).toBe('حليف من وحدة الهاي شين')
  })

  it('translates a group whose name is a common noun', () => {
    // Audit AR-023: "Coalition" is not a proper name.
    expect(renderArabicTarget('Ally Coalition Army')).toBe('حليف من جيش التحالف')
  })

  it('uses the unit wording established by the guide', () => {
    expect(renderArabicTarget('Ally [Shield]')).toBe('حليف من جنود الدروع')
    expect(renderArabicTarget('1 poisoned enemy [General]')).toBe('جنرال واحد مسموم من العدو')
    expect(renderArabicTarget('All poisoned enemy [General]')).toBe('جميع جنرالات العدو المسمومين')
    expect(renderArabicTarget('Enemy General')).toBe('جنرال من العدو')
    expect(renderArabicTarget('Enemy generals')).toBe('جنرالات العدو')
    expect(renderArabicCondition('Confused enemy [General] present')).toBe('وجود جنرال مرتبك من العدو')
    expect(renderArabicCondition('Poisoned enemies present')).toBe('وجود أعداء مسمومين من العدو')
    expect(renderArabicCondition('When feared enemies are present')).toBe('عند وجود أعداء خائفين من العدو')
    expect(renderArabicTarget('Ally [Siege Weapon]')).toBe('حليف من أسلحة الحصار')
  })

  it('localizes the compact enemy labels emitted by the buff summary engine', () => {
    expect(renderArabicTarget('All enemies')).toBe('جميع الأعداء')
    expect(renderArabicTarget('Enemy Archer')).toBe('عدو من السهامين')
    expect(renderArabicTarget('Enemy Qin')).toBe('عدو من تشين')
  })

  it('falls back whole when a structured target contains an unknown tag', () => {
    expect(renderArabicTarget('Ally [Wizard]')).toBe('Ally [Wizard]')
    expect(renderArabicCondition('Enemy [Wizard] with highest ATK'))
      .toBe('Enemy [Wizard] with highest ATK')
    expect(renderArabicTarget('Ally [Hishin] Unit')).toBe('حليف من وحدة الهاي شين')
  })
})

describe('Arabic condition rendering', () => {
  it('leaves a superlative complement indefinite', () => {
    // Audit AR-003: "ذو أقل الهجوم" was ungrammatical, and inconsistent with
    // the "highest" variant which happened to have an exact dictionary entry.
    expect(renderArabicCondition('Enemy [General] with highest ATK')).toBe('جنرال العدو صاحب أعلى هجوم')
    expect(renderArabicCondition('Enemy [General] with lowest ATK')).toBe('جنرال العدو صاحب أقل هجوم')
  })

  it('builds a valid construct for a max-stat selector', () => {
    // Audit AR-003: "ذو أعلى الحد الأقصى المعنويات" stacked two definite nouns.
    expect(renderArabicCondition('Enemy [General] with highest max morale'))
      .toBe('جنرال العدو صاحب أعلى حد أقصى للمعنويات')
  })

  it('renders whole and chip-split conditions identically', () => {
    // The chip pipeline strips the leading "When" and supplies عند as a label.
    expect(renderArabicCondition('When repairing CW [Siege Weapon]'))
      .toBe('عند إصلاح أسلحة الحصار في حرب القلاع')
    expect(renderArabicCondition('repairing CW [Siege Weapon]'))
      .toBe('إصلاح أسلحة الحصار في حرب القلاع')
  })

  it('agrees gender and uses the Arabic comma between clauses', () => {
    // Audit AR-003/AR-016: "البوابة الصحة المتبقي" disagreed in gender and the
    // clause separator was a Latin comma.
    expect(renderArabicCondition('When Garrisoning, gate HP remaining'))
      .toBe('عند الدفاع، الصحة المتبقية للبوابة')
  })

  it('does not leave an English possessive inside Arabic', () => {
    // Audit AR-009: "عدو [جنرال]'s الصحة ≤ 50%".
    const rendered = renderArabicCondition("Enemy [General]'s HP ≤ 50%")
    expect(rendered).not.toContain("'s")
    expect(rendered).toBe('الصحة لجنرال من العدو ≤ 50%')
  })

  it('distinguishes "and" from "or" between allies, and agrees in number', () => {
    // A dual reading of an "or" condition would state a different mechanic,
    // so these must not collapse into the same Arabic.
    expect(renderArabicCondition('When ally Batei and Ryuuto are both alive'))
      .toBe('عند بقاء الحليفين باتي وريوتو حيّين')
    expect(renderArabicCondition('When ally Batei or Ryuuto is alive'))
      .toBe('عند بقاء الحليف باتي أو ريوتو حيًا')
  })

  it('does not leave an English connective inside Arabic', () => {
    const cases = [
      renderArabicTarget('Ally "Queen Biki" and ally [Ai]'),
      renderArabicTarget('Ally "Ouki" and Ouki Army'),
      renderArabicTarget('1 enemy [General] with highest ATK'),
      renderArabicCondition('When ally Batei and Ryuuto are alive'),
    ]
    for (const rendered of cases) {
      expect(rendered).not.toMatch(/\b(and|or|are|both|with|highest|lowest)\b/i)
    }
  })

  it('renders a character reference with the Arabic policy name', () => {
    expect(renderArabicCondition('When ally Makou is alive')).toBe('عند بقاء الحليف ماكو حيًا')
  })
})

describe('Arabic duration rendering', () => {
  it('uses dual and tamyiz forms, not a bare plural', () => {
    // Audit AR-003: "2 أدوار" and "12 أدوار" were both wrong.
    expect(renderArabicDuration('1 time')).toBe('مرة واحدة')
    expect(renderArabicDuration('2 turns')).toBe('جولتان')
    expect(renderArabicDuration('3 turns')).toBe('3 جولات')
    expect(renderArabicDuration('12 turns')).toBe('12 جولة')
    expect(renderArabicDuration('2 times')).toBe('مرتان')
    expect(renderArabicCondition('Per turn elapsed')).toBe('لكل جولة تنقضي')
  })

  it('uses the owner-locked Unit/Squad wording', () => {
    expect(renderArabicTarget('Passing squad')).toBe('الوحدة العابرة')
    expect(renderArabicTarget('[Gyokuhou] Squad')).toBe('وحدة الغيوكوهو')
    expect(renderArabicEffect('Squad Damage Reduction 6.2%')).toBe('خفض ضرر الوحدة بنسبة 6.2%')
  })
})

describe('Arabic terminology', () => {
  it('treats a State as a country, never as a status', () => {
    // Audit AR-002: الحالات means statuses and collided with Status Effects.
    for (const state of ['Qin', 'Zhao', 'Wei', 'Chu', 'Yan', 'Han', 'Qi', 'Ai']) {
      expect(renderArabicTerm(state)).toBeTruthy()
      expect(renderArabicTerm(state)).not.toContain('حالة')
      expect(renderArabicTerm(state)).not.toContain('الحالات')
    }
    expect(renderArabicTerm('Qin')).toBe('تشين')
    expect(renderArabicTerm('Mountain Folk')).toBe('جيش الجبال')
    expect(renderArabicTerm('Archer')).toBe('سهامين')
  })

  it('gives a canonical phrase precedence over any word-level reading', () => {
    expect(renderArabicText('Six Great Generals')).toBe('الجنرالات الستة العظام')
    expect(renderArabicText('Way of The Great General')).toBe('طريق الجنرال العظيم')
  })

  it('keeps Western digits on Arabic pages', () => {
    // Owner decision: Arabic output uses 0-9, never Arabic-Indic digits.
    const samples = [
      renderArabicEffect('ATK Up 20%'),
      renderArabicEffect('150% Damage'),
      renderArabicEffect('HP Recovery 50,000'),
      renderArabicDuration('12 turns'),
      renderArabicTarget('3 enemy [General]'),
      renderArabicCondition('Own HP < 90%'),
    ]
    for (const sample of samples) {
      expect(sample).not.toMatch(/[٠-٩]/)
      expect(sample).toMatch(/[0-9]/)
    }
  })
})

describe('Arabic effect corpus safety', () => {
  it('keeps every render either semantic Arabic or a whole-English fallback', () => {
    const renderers = {
      condition: renderArabicCondition,
      target: renderArabicTarget,
      effect: renderArabicEffect,
      duration: renderArabicDuration,
    }
    const rows = []

    for (const character of ALL) {
      // The documented 4,292-render baseline is the 658 raw character skills.
      // Runtime-enriched role skills have their own source/share coverage.
      for (const skill of character.skills || []) {
        for (const record of skill.effects || []) {
          for (const [field, render] of Object.entries(renderers)) {
            const input = record?.[field]
            if (typeof input !== 'string' || !input.trim()) continue
            rows.push({ field, input, output: render(input) })
          }
        }
      }
    }

    const semantic = rows.filter(row => row.output !== row.input && /[؀-ۿ]/.test(row.output))
    const fallback = rows.filter(row => row.output === row.input)
    const strandedMechanic = /\b(?:up|down|increase|decrease|damage|enemy|ally|self|with|highest|lowest|when|while|upon|alive|present|turns?|times?|and|or|resistance|recovery|seal|drain|attack|defense|general|army|unit|squad|remaining|from|per|of|the|significantly|repair|infliction|rate|status)\b/i

    // Sized from the data rather than frozen: adding character 209 must not
    // look like corruption. What must hold is that nothing falls back.
    expect(rows.length).toBeGreaterThan(4000)
    // The owner terminology pass and deterministic compound-row sweep cover
    // all 4,292 current fields without producing partial mixed output.
    expect(semantic).toHaveLength(rows.length)
    expect(fallback).toEqual([])
    expect(semantic.filter(row => strandedMechanic.test(row.output))).toEqual([])
  })

  it('preserves every explicit percentage in compound effect rows', () => {
    const missing = []
    for (const character of ALL) {
      const skills = [...(character.skills || []), ...(character.roleSkill ? [character.roleSkill] : [])]
      for (const skill of skills) {
        for (const record of skill.effects || []) {
          const input = record?.effect
          if (typeof input !== 'string') continue
          const output = renderArabicEffect(input)
          const values = [...new Set([...input.matchAll(/\d+(?:\.\d+)?%/g)].map((match) => match[0]))]
          for (const value of values) {
            if (!output.includes(value)) missing.push({ character: character.id, input, output, value })
          }
        }
      }
    }
    expect(missing).toEqual([])
  })
})

describe('Arabic buff-summary label coverage', () => {
  it('localizes every stat and normalized enemy target the current engine can emit', () => {
    const stats = new Set()
    const targets = new Set()

    for (const character of ALL) {
      const skills = [...(character.skills || []), ...(character.roleSkill ? [character.roleSkill] : [])]
      for (const skill of skills) {
        for (const record of skill.effects || []) {
          for (const parsed of parseBuffEffect(record?.effect)) stats.add(parsed.stat)
          if (typeof record?.target === 'string' && /enemy/i.test(record.target)) {
            targets.add(normalizeEnemyTarget(record.target))
          }
        }
      }
    }

    const leakedStats = [...stats]
      .map((input) => ({ input, output: renderArabicText(input) }))
      .filter(({ output }) => /[A-Za-z[\]]/.test(output))
    const leakedTargets = [...targets]
      .map((input) => ({ input, output: renderArabicTarget(input) }))
      .filter(({ output }) => /[A-Za-z[\]]/.test(output))

    expect(leakedStats).toEqual([])
    expect(leakedTargets).toEqual([])
  })

  it('uses the approved Arabic mechanics for summary-only labels', () => {
    expect(renderArabicText('ATK Down Resistance')).toBe('مقاومة خفض الهجوم')
    expect(renderArabicText('DEF Down Resistance')).toBe('مقاومة خفض الدفاع')
    expect(renderArabicText('Confusion Infliction Rate')).toBe('معدل إلحاق الارتباك')
    expect(renderArabicText('Damage Taken Increase Resistance')).toBe('مقاومة ارتفاع الضرر المتلقى')
    expect(renderArabicText('[Cavalry] ATK')).toBe('هجوم الفرسان')
    expect(renderArabicText('[Siege Weapon] repair Ore Consumption'))
      .toBe('استهلاك الخام لإصلاح أسلحة الحصار')
  })
})

describe('Arabic that reads like a person wrote it', () => {
  /**
   * The owner-approved editorial pass. The source writes unit types as
   * bracketed tokens; those brackets are RanHQ's parsing artifact, not game
   * wording, and leaving them in was the main reason the Arabic read as
   * parser output.
   */
  it('never shows a bracketed parser token', () => {
    for (const source of [
      '1 enemy [General]', 'Ally [Infantry]', 'Enemy [Cavalry]',
      'All enemy [General]', 'Other ally [Archer]', 'Ally [Zhao]',
    ]) {
      expect(renderArabicTarget(source), source).not.toMatch(/[[\]]/)
    }
  })

  it('builds a phrase around the unit type instead of appending a tag', () => {
    expect(renderArabicTarget('1 enemy [General]')).toBe('جنرال واحد من العدو')
    expect(renderArabicTarget('3 enemy [General]')).toBe('3 جنرالات من العدو')
    expect(renderArabicTarget('Ally [Infantry]')).toBe('حليف من المشاة')
    expect(renderArabicTarget('Other ally [Cavalry]')).toBe('حليف آخر من الفرسان')
    expect(renderArabicTarget('All enemy [General]')).toBe('جميع جنرالات العدو')
  })

  it('uses a construct for a superlative selector', () => {
    // جنرال العدو صاحب أعلى هجوم, not جنرال من العدو ذو أعلى هجوم.
    expect(renderArabicCondition('Enemy [General] with highest ATK'))
      .toBe('جنرال العدو صاحب أعلى هجوم')
  })

  it('uses the owner-approved archer wording in Akou selectors', () => {
    expect(renderArabicCondition('Enemy [Archer] with lowest remaining HP'))
      .toBe('سهام العدو صاحب أقل صحة متبقية')
    expect(renderArabicTarget('1 enemy [Archer]')).toBe('سهام واحد من العدو')
  })

  it('renders the remaining Reiou and Yotanwa compound rows semantically', () => {
    expect(renderArabicTarget('Surviving ally "Ranbihaku", "GHM", and Wei Fire Dragon [General]'))
      .toBe('الحلفاء على قيد الحياة: رانبيهاكو، غوهومي، وجنرالات تنين نار وي')
    expect(renderArabicCondition('Other ally [Qin] or [Mountain Folk] alive, first enemy in formation'))
      .toBe('حليف آخر من تشين أو جيش الجبال على قيد الحياة، وأول عدو في التشكيلة')
  })

  it('localizes known bare-name targets and punctuated compound effects', () => {
    expect(renderArabicTarget('Shikika')).toBe('شيكيكا')
    expect(renderArabicTarget('Riboku')).toBe('ريبوكو')
    expect(renderArabicEffect('Enemy "Riboku", "Ei Sei", "Queen Biki" "Attack Seal" 70%'))
      .toBe('ختم الهجوم بنسبة 70% على ريبوكو وإي سي والملكة بيكي من العدو')
  })

  it('uses a construct plural when a whole group is named', () => {
    // لعدو + a definite noun is not a construct Arabic allows.
    expect(renderArabicEffect('Enemy [General] ATK Down 40%'))
      .toBe('خفض الهجوم لجنرالات العدو بنسبة 40%')
    expect(renderArabicEffect('Ally [Cavalry] DEF Up 20%'))
      .toBe('زيادة الدفاع للفرسان الحلفاء بنسبة 20%')
  })

  it('states a proportional change with بنسبة', () => {
    expect(renderArabicEffect('ATK Up 20%')).toContain('بنسبة')
    // Raw damage stays terse, because that is how it is actually said.
    expect(renderArabicEffect('150% Damage')).toBe('ضرر 150%')
  })

  it('describes the mechanic where the English label is misleading', () => {
    // 攻撃封印 disables attacking; ختم would be a stamp pressed on paper.
    expect(renderArabicEffect('Attack Seal 50%')).toContain('ختم الهجوم')
    // ガード効果 blocks damage; الحراسة means custody.
    expect(renderArabicEffect('Guard 60%')).toContain('الصد')
  })

  it('says صاحب المهارة for Self, not the abstract الذات', () => {
    expect(renderArabicTarget('Self')).toBe('صاحب المهارة')
  })
})

describe('ally names match the archive', () => {
  /**
   * Four effect rows spell a roster general a second way, so the Arabic named
   * a character the archive does not list. Each mapping is resolved from the
   * skill's own 「{-N:characterId}」 token in the Japanese source.
   */
  it('resolves an alternate romanisation to the archive spelling', () => {
    // 霊凰 (id 181) is listed as Reiou.
    expect(renderArabicCondition('When ally Reihō is alive')).toBe('عند بقاء الحليف ري او حيًا')
    // 戎翟公 (id 190) is listed as Wategi — and this row used to fall back to English.
    expect(renderArabicTarget('Ally Juutekkō')).toBe('حليف واتيغي')
    expect(renderArabicCondition('When ally Seikyo is alive')).toBe('عند بقاء الحليف سيكيو حيًا')
    expect(renderArabicTarget('Ally Gaimo')).toBe('حليف غايمو')
  })

  it('leaves a name that is already canonical alone', () => {
    expect(renderArabicTarget('Ally Ouhon')).toBe('حليف أوهون')
    expect(renderArabicTarget('Ally Kanki Army')).toBe('حليف من جيش كانكي')
  })
})

describe('compound conditions that were safe to model', () => {
  it('reads a two-clause condition whose halves were already modelled', () => {
    // Only the article blocked this: the pattern required "From the N% Damage".
    expect(renderArabicCondition('Own HP < 90%, from 70% Damage above'))
      .toBe('صحته < 90%، من ضرر 70%')
  })
})
