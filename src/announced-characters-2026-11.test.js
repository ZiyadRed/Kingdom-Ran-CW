import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import announcement from '../data/source/announced_characters_2026-11-23.json'
import sourceMap from '../data/source/cw_skills.map.json'
import characterMap from '../data/source/characters.map.json'
import rawSkillNames from '../data/source/ja/skill_name.raw.json'
import rawSkillDescs from '../data/source/ja/skill_desc.raw.json'
import units from '../data/cw_buffs.json'
import teams from '../data/cw_team_buffs.json'
import legacy from '../data/buff_ownership_legacy.json'
import { CHAR_BY_ID, normalizeProgress } from './core.jsx'
import { localizedCharacter } from './i18n/data.js'
import { AR_CHARACTER_NAMES, matchesCharacterName } from './i18n/ar-character-names.js'

const rowsFor = record => record.kind === 'unit'
  ? units[record.category][record.stat]
  : (record.kind === 'army' ? teams.armies : teams.states)[record.category][record.stat]

describe('November 23 announcement: Choukatsu, Maikou and Roen', () => {
  it('adds Choukatsu and Maikou as SR/UR Zhao cavalry with stable identities', () => {
    for (const source of announcement.characters) {
      const character = CHAR_BY_ID[source.id]
      expect(character.source).toEqual({ characterId: source.characterId, generalIds: source.generalIds })
      expect(characterMap.characters[source.id]).toMatchObject({ characterId: source.characterId, generalIds: source.generalIds, status: 'exact' })
      expect(character).toMatchObject({ country: 'zhao', rarity: source.initialRarity, unit_type: 'Cavalry' })
      for (const excluded of source.excludedFutureGeneralIds) expect(character.source.generalIds).not.toContain(excluded)
      for (const query of [character.name_en, character.name_jp, AR_CHARACTER_NAMES[character.name_en], source.rubyJp]) {
        expect(matchesCharacterName(character, query), `${character.id}: ${query}`).toBe(true)
      }
    }
  })

  it('maps the announced CW kits to the Ver8.9.0 master IDs, whose text matches the announcement verbatim', () => {
    const exactIds = { choukatsu: [[892, 891], [893, 892], [894, 893]], maikou: [[895, 894], [896, 895], [897, 896]] }
    for (const source of announcement.characters) {
      const character = CHAR_BY_ID[source.id]
      expect(character.skills.map(skill => skill.name_jp)).toEqual(source.cwSkills.map(skill => skill.nameJp))
      for (const [index, skill] of source.cwSkills.entries()) {
        const [skillId, textId] = exactIds[source.id][index]
        expect(sourceMap.skills[`${source.id}#${index}`]).toMatchObject({ status: 'exact', skillId, textId, sourceNameJp: skill.nameJp })
        expect(rawSkillNames.values[textId]).toBe(skill.nameJp)
        expect(rawSkillDescs.values[textId]).toBe(skill.descriptionJp)
      }
    }
  })

  it('renders the new Leader-damage and vs-Confusion rows in every locale without English leftovers', () => {
    const expected = {
      ar: ['قائد العدو', 'ضد جنرالات العدو المرتبكين'],
      ja: ['敵争覇総大将', '（対「錯乱」状態の敵武将）'],
      fr: ['Leader ennemi', 'contre les généraux ennemis sous Confusion'],
    }
    for (const [code, [leader, confused]] of Object.entries(expected)) {
      const choukatsu = localizedCharacter(CHAR_BY_ID.choukatsu, code)
      const maikou = localizedCharacter(CHAR_BY_ID.maikou, code)
      expect(choukatsu.skills.flatMap(skill => skill.displayEffects.map(row => row.target))).toContain(leader)
      expect(maikou.skills[0].displayEffects[0].target).toContain(confused)
      for (const skill of [...choukatsu.skills, ...maikou.skills]) {
        for (const row of skill.displayEffects) expect(`${row.target} ${row.effect}`, `${code}: ${skill.name_jp}`).not.toMatch(/\[(?:Leader|General|Zhao)\]|confused/i)
      }
    }
  })

  it('adds the four verified 5% CW buffs as independent new ownership sources', () => {
    const old = new Set(Object.values(legacy.legacyKeys).flat())
    const saved = normalizeProgress({ buffSources: Object.fromEntries([...old].map(id => [id, true])) })
    for (const record of announcement.verifiedBuffs) {
      expect(record.fieldRow.effectLvB / 10000).toBe(record.value)
      const entry = rowsFor(record).find(row => row.ownership_id === record.ownership_id)
      expect(entry).toMatchObject({ character_id: record.character_id, characterId: record.characterId, value: record.value })
      expect(old.has(entry.ownership_id)).toBe(false)
      expect(saved.buffSources[entry.ownership_id]).toBeUndefined()
      const selected = normalizeProgress({ ...saved, buffSources: { ...saved.buffSources, [entry.ownership_id]: true } })
      for (const other of announcement.verifiedBuffs) expect(!!selected.buffSources[other.ownership_id]).toBe(other.ownership_id === entry.ownership_id)
    }
    expect(new Set(announcement.verifiedBuffs.map(record => record.ownership_id)).size).toBe(announcement.verifiedBuffs.length)
  })

  it('uses the byte-verified official cards losslessly for the new banners', () => {
    for (const record of [...announcement.characters, ...announcement.upgrades]) {
      const { artwork } = record
      expect(CHAR_BY_ID[record.id].image).toContain(`/persos/${record.id}.webp`)
      const full = readFileSync(artwork.output)
      expect(createHash('sha256').update(full).digest('hex')).toBe(artwork.outputSha256)
      expect(readFileSync(artwork.thumbnail).equals(full)).toBe(true)
      expect(existsSync(`public/og/characters/${record.id}.jpg`)).toBe(true)
    }
    expect(CHAR_BY_ID.roen).toMatchObject({ rarity: 'R', unit_type: 'Shield' })
  })
})
