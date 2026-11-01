import { describe, expect, it } from 'vitest'
import cards from '../data/scene_card_cw_buffs.json'
import cw6 from '../data/cw6_scene_cards.json'
import source from '../data/source/queen_biki_scene_card_2026-11-01.json'
import characters from '../data/source/characters.map.json'
import { CATALOGS } from './i18n/i18n.js'
import { emptyProgress, parseProgressBackup, progressImportCounts } from './progress-storage.js'

const biki = cards.cards.find(card => card.id === source.sceneCard.id)

describe('Queen Biki passive enemy DEF reduction', () => {
  it('joins the released card, owner, normal skill and original Japanese by exact IDs', () => {
    expect(source.provenance).toBe('VERIFIED_ORIGINAL')
    expect(biki.source.sceneCardId).toBe(source.sceneCard.id)
    expect(biki.imageId).toBe(source.sceneCard.imageId)
    expect(biki.source.characterId).toBe(source.sceneCard.extraEffectCharacterId)
    expect(biki.source.characterId).toBe(characters.characters[biki.ownerId].characterId)
    expect(biki.source.normalSkillId).toBe(source.sceneCard.normalSkillId)
    expect(biki.source.normalSkillId).toBe(source.normalSkill.id)
    expect(biki.source.normalSkillTextId).toBe(source.sceneCard.normalSkillTextId)
    expect(biki.name_jp).toBe(source.texts['MsgSceneCardName.stbl'].value)
    expect(source.texts['MsgSceneCardName.stbl'].slot).toBe(source.sceneCard.textId)
    expect(source.texts['MsgSceneCardSkillDesc.stbl'].slot).toBe(source.sceneCard.normalSkillTextId)
    expect(source.texts['MsgSceneCardSkillDesc.stbl'].value).toContain('敵全部隊の防御力が低下する')
    expect(source.texts['MsgSceneCardSkillDesc.stbl'].value).toContain('所持しているだけで効果が有効')
    expect(CATALOGS.ja.buffs.enemyDefenseReduction).toBe(source.texts['MsgSceneCardSkillName.stbl'].value.replace('【同盟争覇戦】', ''))
    expect(cw6.cards.some(card => card.id === biki.id)).toBe(false)
  })

  it('keeps flat enemy reductions separate from allied stats and percentage resistance', () => {
    expect(source.normalSkill.skillTypeId).toBe(11)
    expect(biki).toMatchObject({ stat: 'enemy_def_down', direction: 'down', target: 'enemy', valueMode: 'flat' })
    expect(biki.value).toBe(source.normalSkill.param3Max)
    expect(cards.totals.enemyDefReduction).toBe(cards.cards.filter(card => card.stat === 'enemy_def_down').reduce((total, card) => total + card.value, 0))
    expect(cards.totals.def).toBe(cards.cards.filter(card => card.stat === 'def').reduce((total, card) => total + card.value, 0))
    expect(cards.totals.defDownResist).toBe(cards.cards.filter(card => card.stat === 'def_down_resist').reduce((total, card) => total + card.value * 100, 0))
  })

  it('uses each UR rank level cap with the existing equivalent flat-stat progression', () => {
    const { param3Min: min, param3Max: max } = source.normalSkill
    expect(source.ranks.every(rank => rank.rarityId === source.sceneCard.rarityId)).toBe(true)
    const values = source.ranks.map(rank => Math.floor(min + (max - min) * (rank.maxLevel - 1) / (source.scaling.maxCardLevel - 1)))
    expect(biki.starValues).toEqual(values)
    expect(biki.starValues).toEqual([330, 364, 398, 432, 466, 500])
    for (const id of [40141, 40142]) expect(biki.starValues).toEqual(cards.cards.find(card => card.id === id).starValues)
    expect(biki.starValues.at(-1)).toBe(biki.value)
  })

  it('leaves the new card unowned in old saves and round-trips its rank independently', () => {
    const prior = { ...emptyProgress(), cw6Cards: { '40225': true }, sceneBuffCards: { '40141': true }, sceneBuffStars: { '40142': 2 }, buffSources: { opaque: true } }
    const imported = parseProgressBackup(JSON.stringify(prior))
    expect(imported.sceneBuffStars[biki.id]).toBeUndefined()
    for (const rank of source.ranks.map(row => row.rank)) {
      const next = { ...imported, sceneBuffStars: { ...imported.sceneBuffStars, [biki.id]: rank } }
      const roundTrip = parseProgressBackup(JSON.stringify({ version: 1, exportedAt: '2026-11-01T10:00:00.000Z', progress: next }))
      expect(roundTrip).toEqual(next)
      expect(progressImportCounts(roundTrip)).toEqual({ cw6: 1, scene: 3, buffs: 1 })
    }
    expect(imported).toEqual(prior)
  })
})
