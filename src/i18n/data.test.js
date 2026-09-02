import { describe, expect, it } from 'vitest'
import { ARABIC_TERMS, localizedCharacter, localizedSkill, localizedText, japaneseSkillSource } from './data.js'
import { AR_CHARACTER_NAMES, LEGACY_CHARACTER_NAME_ALIASES, matchesCharacterName, missingArabicCharacterNames } from './ar-character-names.js'
import { ALL } from '../core.jsx'

describe('localized source data', () => {
  it('joins a deterministic project row to the current Japanese source artifact', () => {
    const source = japaneseSkillSource('soutan', 0)
    expect(source).toMatchObject({ skillId: 861, name: '鉄壁一閃【青牛】' })
    expect(source.desc).toContain('防御力')
  })

  it('preserves the English skill while exposing verified Japanese source text', () => {
    const skill = localizedSkill({ name_en: 'Ironclad Flash', name_jp: '鉄壁一閃【青牛】', effects: [] }, 'soutan', 0, 'ja')
    expect(skill.displayName).toBe('鉄壁一閃【青牛】')
    expect(skill.sourceStatus).toBe('VERIFIED_ORIGINAL')
    expect(skill.descriptionJp).toContain('防御力')
  })

  it('provides Arabic display effects without mutating the source object', () => {
    const original = { condition: 'Enemy [General]', target: 'Self', effect: 'Attack Nullification', duration: null }
    const skill = localizedSkill({ name_en: 'Test', effects: [original] }, 'unknown', 0, 'ar')
    expect(skill.displayEffects[0].condition).toContain('عدو')
    expect(skill.displayEffects[0].effect).toContain('إبطال الهجوم')
    expect(original.condition).toBe('Enemy [General]')
  })

  it('uses Japanese character names and stable ruby readings', () => {
    const character = localizedCharacter({ id: 'soutan', name_en: 'Soutan', name_jp: '蒼淡', skills: [] }, 'ja')
    expect(character.displayName).toBe('蒼淡')
    expect(character.sourceReading).toBeTruthy()
  })

  it('keeps shared Arabic terminology backed by the canonical glossary', () => {
    expect(ARABIC_TERMS['Castle War']).toBe('حرب القلعة')
    expect(ARABIC_TERMS.Infantry).toBe('مشاة')
  })

  it('localizes role skills by their stable CW ID and exposes provenance', () => {
    const character = localizedCharacter({
      id: 'renpa', name_en: 'Renpa', name_jp: '廉頗', skills: [],
      roleSkill: { cwId: 851, name_en: "Great General's Roar", name_jp: '大将軍の一喝', effects: [] },
    }, 'ja')
    expect(character.roleSkill.displayName).toBe('大将軍の一喝')
    expect(character.roleSkill.sourceSkillId).toBe(851)
    expect(character.roleSkill.sourceStatus).toBe('VERIFIED_ORIGINAL')
  })

  it('routes Arabic game text through the semantic renderer', () => {
    // Values are verbatim from data/characters/*.json.
    expect(localizedText('When Garrisoning', 'ar')).toBe('عند الدفاع')
    expect(localizedText('4 turns', 'ar')).toBe('4 جولات')
    expect(localizedText('Evasion (Dodge Chance) Up 20%', 'ar')).toBe('زيادة التفادي بنسبة 20%')
    expect(localizedText('Effect Resistance 5.4%', 'ar')).toContain('مقاومة التأثير')
    expect(localizedText('Infantry', 'ar')).toBe('مشاة')
  })

  it('leaves an unrecognised string in English instead of half-translating it', () => {
    // The old word-substitution pipeline produced things like "Way من Great
    // جنرال". Returning English is the designed fallback.
    const unknown = 'Some Entirely Unmodelled Effect Phrase'
    expect(localizedText(unknown, 'ar')).toBe(unknown)
    expect(localizedText('ATK Up 20%', 'en')).toBe('ATK Up 20%')
  })

  it('renders Arabic effects per field, with correct grammar', () => {
    const skill = localizedSkill({
      name_en: 'Test',
      effects: [{
        condition: 'Enemy [General] with highest ATK',
        target: '1 enemy [General]',
        effect: 'Max HP Up 100%',
        duration: '2 turns',
      }],
    }, 'unknown', 0, 'ar')
    const [rendered] = skill.displayEffects
    expect(rendered.condition).toBe('جنرال العدو صاحب أعلى هجوم')
    expect(rendered.target).toBe('جنرال واحد من العدو')
    expect(rendered.effect).toBe('زيادة الحد الأقصى للصحة بنسبة 100%')
    expect(rendered.duration).toBe('جولتان')
  })

  it('shows every character name in the locale’s own script', () => {
    // Owner policy 2026-08-30: Romaji for English, Japanese for Japanese,
    // Arabic for Arabic. Audit AR-005 was about a PARTIAL set alternating
    // scripts mid-roster, so the guard is completeness, not Latin.
    const ouhon = { id: 'ouhon', name_en: 'Ouhon', name_jp: '王賁', skills: [] }
    expect(localizedCharacter(ouhon, 'ar').displayName).toBe('أوهون')
    expect(localizedCharacter(ouhon, 'ja').displayName).toBe('王賁')
    expect(localizedCharacter(ouhon, 'en').displayName).toBe('Ouhon')
  })

  it('has an Arabic name for every general, not a partial set', () => {
    expect(Object.keys(AR_CHARACTER_NAMES)).toHaveLength(new Set(ALL.map(character => character.name_en)).size)
    expect(missingArabicCharacterNames(ALL)).toEqual([])
    expect(missingArabicCharacterNames([...ALL, { name_en: 'Future General' }])).toEqual(['Future General'])
  })

  it('matches every character script plus common long-vowel spellings', () => {
    const karin = ALL.find((character) => character.name_en === 'Karin')
    const kyoukai = ALL.find((character) => character.name_en === 'Kyoukai')
    expect(['Karin', 'كارين', '媧燐'].every((query) => matchesCharacterName(karin, query))).toBe(true)
    expect(['Kyoukai', 'Kyokai', 'Kyōkai', 'كيوكاي', '羌瘣'].every((query) => matchesCharacterName(kyoukai, query))).toBe(true)
  })

  it('keeps deliberate Arabic collisions as multiple search results', () => {
    expect(ALL.filter((character) => matchesCharacterName(character, 'دوكين')).map((character) => character.name_en).sort()).toEqual(['Douken', 'Doukin'])
    expect(ALL.filter((character) => matchesCharacterName(character, 'سوغين')).map((character) => character.name_en).sort()).toEqual(['Sougen', 'Suugen'])
  })

  it('keeps corrected Romaji names findable through every legacy spelling', () => {
    for (const [legacy, canonical] of Object.entries(LEGACY_CHARACTER_NAME_ALIASES)) {
      const character = ALL.find((entry) => entry.name_en === canonical)
      expect(character?.id, `${legacy} -> ${canonical}`).toBeTruthy()
      expect(matchesCharacterName(character, legacy), legacy).toBe(true)
      expect(matchesCharacterName(character, canonical), canonical).toBe(true)
      expect(ALL.filter((entry) => matchesCharacterName(entry, legacy))).toEqual([character])
      expect(ALL.filter((entry) => matchesCharacterName(entry, canonical))).toEqual([character])
    }
  })
})
