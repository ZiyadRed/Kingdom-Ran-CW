import { describe, expect, it } from 'vitest'
import announcements from '../data/source/announced_characters_2026-10-26.json'
import sourceMap from '../data/source/cw_skills.map.json'
import release from '../data/source/released_content_2026-10-28.json'
import units from '../data/cw_buffs.json'
import teams from '../data/cw_team_buffs.json'
import legacy from '../data/buff_ownership_legacy.json'
import { CHAR_BY_ID, PUBLIC_CW6_CARDS, applyMask, calcCharBuffs, calcTeamEnemyDebuffs, normalizeProgress, simulate } from './core.jsx'
import { localizedCharacter, japaneseSkillSource } from './i18n/data.js'
import { AR_CHARACTER_NAMES, matchesCharacterName } from './i18n/ar-character-names.js'

describe('released October 28 characters and role skills', () => {
  it('uses announced SR/UR identities and keeps future LG placeholders out', () => {
    for (const source of announcements.characters) {
      const character = CHAR_BY_ID[source.id]
      expect(character.source).toEqual({ characterId: source.characterId, generalIds: source.generalIds })
      expect(character.rarity).toBe(source.initialRarity)
      expect(character.unit_type).toBe('Infantry')
      expect(character.groups).toEqual([])
      expect(character.skills.map(skill => skill.name_jp)).toEqual(source.cwSkills.map(skill => skill.nameJp))
      for (const excluded of source.excludedFutureGeneralIds) expect(character.source.generalIds).not.toContain(excluded)
      for (const query of [character.name_en, character.name_jp, AR_CHARACTER_NAMES[character.name_en], source.rubyJp]) {
        expect(matchesCharacterName(character, query), `${character.id}: ${query}`).toBe(true)
      }
      for (const code of ['en', 'ja', 'ar', 'fr']) {
        const localized = localizedCharacter(character, code)
        for (const skill of localized.skills) expect(skill.sourceStatus).toBe('VERIFIED_ORIGINAL')
      }
    }
    expect(matchesCharacterName(CHAR_BY_ID.koshuu, 'Koshu')).toBe(true)
    expect(CHAR_BY_ID.koreki.country).toBe('ai')
    expect(CHAR_BY_ID.koshuu.country).toBe('zhao')
  })

  it('promotes every released CW slot through its actual master assignment', () => {
    for (const character of release.characters) for (const [index, source] of character.cwSkills.entries()) {
      const mapping = sourceMap.skills[`${character.id}#${index}`]
      expect(mapping).toMatchObject({ status: 'exact', characterId: character.characterId, skillId: source.id, textId: source.textId })
      expect(character.cwProfile[`skill${index + 1}id`]).toBe(source.id)
      const text = japaneseSkillSource(character.id, index)
      expect(text).toMatchObject({ name: source.name, skillId: source.id, status: 'exact' })
      expect(CHAR_BY_ID[character.id].skills[index]).toMatchObject({ cwId: source.id, textId: source.textId, mp: source.mp })
    }
    const known = localizedCharacter(CHAR_BY_ID.koshuu, 'ja').skills[1]
    expect(known.descriptionJp).toContain('味方「李牧」')
    expect(known.descriptionJp).not.toContain('《？》')
    expect(known.displayEffects[3].target).toContain('李牧')
  })

  it('adds independently selectable normal 5% sources and both CW HP passives', () => {
    const old = new Set(Object.values(legacy.legacyKeys).flat())
    const saved = normalizeProgress({ buffSources: Object.fromEntries([...old].map(id => [id, true])) })
    const sources = [...announcements.corrections, ...announcements.cwPassives]
    for (const record of sources) {
      const group = record.kind === 'state' ? teams.states : units
      const entry = group[record.category][record.stat].find(row => row.ownership_id === record.ownership_id)
      expect(entry).toMatchObject({ character_id: record.character_id, characterId: record.characterId, value: record.value })
      expect(old.has(entry.ownership_id)).toBe(false)
      expect(saved.buffSources[entry.ownership_id]).toBeUndefined()
      const selected = normalizeProgress({ ...saved, buffSources: { ...saved.buffSources, [entry.ownership_id]: true } })
      for (const other of sources) expect(!!selected.buffSources[other.ownership_id]).toBe(other.ownership_id === entry.ownership_id)
    }
    for (const source of announcements.corrections) expect(source.fieldRow.effectLvB / 10000).toBe(source.value)
    expect(new Set(sources.map(source => source.ownership_id)).size).toBe(sources.length)
  })

  it('applies Koshuu bonuses to assigned roles and the source-identified Riboku', () => {
    expect(release.cwEffects.find(effect => effect.id === 3602)).toMatchObject({ targetType: 17, targetParam: 72, effectValue1: 3000 })
    expect(CHAR_BY_ID.riboku.source.characterId).toBe(72)
    const owner = { ...CHAR_BY_ID.koshuu, skills: [CHAR_BY_ID.koshuu.skills[1]] }
    for (const id of ['kanki', 'kaioku']) {
      const role = { ...applyMask(CHAR_BY_ID[id], { n: 0, s6: false, role: true }), skills: [] }
      const ordinary = { ...applyMask(CHAR_BY_ID[id], { n: 0, s6: false, role: false }), skills: [] }
      const result = calcCharBuffs(role, [owner, role], [], false)
      expect(result.DEF?.up, id).toBe(30)
      expect(calcCharBuffs(ordinary, [owner, ordinary], [], false).DEF?.up, id).toBeUndefined()
      expect(result.meta.unsupported).toEqual([])
    }
    expect(calcCharBuffs(owner, [owner], [], false).DEF.up).toBe(20)
    const riboku = { ...CHAR_BY_ID.riboku, skills: [] }
    expect(calcCharBuffs(riboku, [owner, riboku], [], false).DEF.up).toBe(50)
  })

  it('applies the released Kanmei and Reiou roles only while selected', () => {
    const kanmei = applyMask(CHAR_BY_ID.kanmei, { n: 0, s6: false, role: true })
    const reiou = applyMask(CHAR_BY_ID.reiou, { n: 0, s6: false, role: true })
    const bare = id => ({ ...CHAR_BY_ID[id], skills: [], roleSkill: null })
    const kyoubou = bare('kyoubou'), wei = bare('gokei'), shin = bare('shin')
    const team = [kanmei, reiou, kyoubou, wei]
    for (const member of [kanmei, kyoubou]) {
      expect(calcCharBuffs(member, team, [], false).DEF?.up).toBe(60)
      expect(calcCharBuffs(member, team, [], false)['Morale Recovery']?.up).toBe(20)
    }
    for (const member of [reiou, wei]) {
      expect(calcCharBuffs(member, team, [], false).DEF?.up).toBe(30)
      expect(calcCharBuffs(member, team, [], false)['Morale Recovery']?.up).toBe(20)
    }
    expect(calcCharBuffs(shin, team, [], false).DEF).toBeUndefined()
    expect(calcTeamEnemyDebuffs(team)['All enemies']?.down).toMatchObject({ DEF: 30, Morale: 30 })
    for (const owner of [kanmei, reiou]) {
      const disabled = applyMask(owner, { n: 0, s6: false, role: false })
      expect(disabled.skills).toEqual([])
    }
    for (const source of release.roleSkills) {
      const role = CHAR_BY_ID[source.owner_id].roleSkill
      expect(role).toMatchObject({ cwId: source.skill.id, textId: source.skill.textId, mp: source.skill.mp, timing: source.skill.timing })
      for (const code of ['en', 'ja', 'ar', 'fr']) {
        expect(localizedCharacter(CHAR_BY_ID[source.owner_id], code).roleSkill.sourceStatus).toBe('VERIFIED_ORIGINAL')
      }
    }
    const firstTurn = simulate([kanmei, reiou], [shin]).turns.find(turn => turn.turn === 1)
    expect(firstTurn.entries.filter(entry => entry.kind === 'role').map(entry => entry.role)).toEqual(['Leader', 'Strategist'])
  })

  it('keeps the next Ryuuto CW6 and unreleased character records outside the public roster', () => {
    expect(PUBLIC_CW6_CARDS.some(card => card.id === 42005)).toBe(false)
    expect(CHAR_BY_ID.ryuuto.skills.some(skill => release.excludedFuture.cwSkillIds.includes(skill.cwId))).toBe(false)
    for (const character of Object.values(CHAR_BY_ID)) {
      expect(release.excludedFuture.characterIds).not.toContain(character.source?.characterId)
    }
  })
})
