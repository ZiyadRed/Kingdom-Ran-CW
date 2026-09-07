import { describe, expect, it } from 'vitest'
import evidence from '../data/source/character-classification.json'
import { ALL, FACTIONS, GROUPS, findCharById, rosterCriterionMatches, RARITY_DATA, RED_CRYSTAL_SKILL_COSTS, RED_CRYSTAL_TOTAL_COST, CW_MAX, characterInitialRarity } from './core.jsx'
import { localizedText } from './i18n/data.js'
import { characterContentMatch } from './i18n/character-search.js'
import * as buffData from './features/buffs/data.js'

const countries={秦:'qin',趙:'zhao',魏:'wei',楚:'chu',韓:'han',斉:'qi',燕:'yan',山の民:'mountain_folk',民:'other',毐:'ai'}
const types=['Infantry','Cavalry','Archer','Shield']
const affiliations={
  中華十弓:'Chinese Ten Bows',趙の三大天:"Zhao's Three Great Heavens",趙の新三大天:"Zhao's New Three Great Heavens",
  秦の六大将軍:'Six Great Generals',呂氏四柱:'Ryofui Four Pillars',魏火龍:'Wei Fire Dragon',廉頗四天王:"Renpa's Four Heavenly Kings",
  飛信隊:'Hi Shin Unit',王騎軍:'Ouki Army',桓騎軍:'Kanki Army',玉鳳隊:'Gyokuhou',楽華隊:'Gakuka Unit',
  媧燐軍:'Karin Army',羌族:'Qiang Tribe',汗明軍:'Kanmei Army',紀彗軍:'Kisui Army',合従軍:'Coalition Army',廉頗軍:'Renpa Army',
  成恢軍:'Seikai Army',メラ族:'Mera Tribe',フィゴ族:'Figo Tribe',王翦軍:'Ousen Army',亜光軍:'Akou Army',蒙武軍:'Moubo Army',麻鉱軍:'Makou Army',
}

describe('every character classification has independent exact-ID game evidence',()=>{
  it('covers the full roster and preserves the source identity',()=>{
    expect(Object.keys(evidence.characters).sort()).toEqual(ALL.map(c=>c.id).sort())
    for(const c of ALL){
      const source=evidence.characters[c.id]
      expect(source.characterId,c.id).toBe(c.source.characterId)
      expect(source.generals.every(g=>g.characterId===source.characterId&&c.source.generalIds.includes(g.id)),c.id).toBe(true)
      expect(new Set(source.generals.map(g=>countries[evidence.country_labels[g.countryId]])),c.id).toEqual(new Set([c.country]))
      expect(FACTIONS.some(f=>f.id===c.country),c.id).toBe(true)
      const rank=Math.max(...source.generals.map(g=>g.rarityId))
      const initial=['','N','R','SR','UR','LG'][Math.min(...source.generals.map(g=>g.rarityId))]
      expect(c.rarity,c.id).toBe(initial)
      expect(characterInitialRarity(c),c.id).toBe(initial)
      const selected=source.generals.filter(g=>g.rarityId===rank)
      expect(new Set(selected.map(g=>types[g.attributeId])),c.id).toEqual(new Set([c.unit_type]))
      if(CW_MAX[c.id])expect(CW_MAX[c.id].unitType,c.id).toBe(c.unit_type)
      const tags=[...new Set(selected.flatMap(g=>[g.belong1Id,g.belong2Id,g.belong3Id]).filter(Boolean).map(id=>affiliations[evidence.affiliation_labels[id]]))].sort()
      expect(tags,c.id).not.toContain(undefined)
      expect(c.groups,c.id).toEqual(tags)
      expect(new Set(c.groups).size,c.id).toBe(c.groups.length)
      if(c.unit)expect(c.groups,c.id).toContain(c.unit)
    }
  })

  it('uses the documented initial-rarity unlock costs, including N generals and legacy Romaji keys',()=>{
    expect(RED_CRYSTAL_SKILL_COSTS.N).toEqual([70,175,240])
    expect(RED_CRYSTAL_TOTAL_COST.N).toBe(485)
    for(const [rank,costs] of Object.entries(RED_CRYSTAL_SKILL_COSTS))expect(costs.reduce((a,b)=>a+b,0),rank).toBe(RED_CRYSTAL_TOTAL_COST[rank])
    for(const id of ['gii','hakukisei','kesshi','kou2'])expect(characterInitialRarity(findCharById(id)),id).toBe('N')
    expect(characterInitialRarity(findCharById('kou'))).toBe('UR')
    expect(characterInitialRarity(findCharById('shin'))).toBe('R')
    expect(RARITY_DATA.Soujin.rarity).toBe('UR')
    expect(RARITY_DATA.Soutan.rarity).toBe('UR')
  })

  it('keeps Domon in Qin, excludes story-derived false memberships, and targets corrected types',()=>{
    expect(findCharById('domon').country).toBe('qin')
    expect(findCharById('bananji').groups).toEqual([])
    expect(findCharById('rankai').groups).toEqual([])
    expect(findCharById('kouyoku').groups).not.toContain('Wei Fire Dragon')
    for(const id of ['en','hakukisei','roen','kou2'])expect(rosterCriterionMatches(findCharById(id),'Shield'),id).toBe(true)
    expect(rosterCriterionMatches(findCharById('douken'),'Cavalry')).toBe(false)
    expect(rosterCriterionMatches(findCharById('douken'),'Archer')).toBe(true)
  })

  it('localizes and searches every game affiliation in every supported locale',()=>{
    const missing=[]
    for(const locale of ['en','ja','ar','fr'])for(const [group,ids] of Object.entries(GROUPS)){
      const text=localizedText(group,locale)
      expect(text,`${locale}: ${group}`).toBeTruthy()
      // The established French short label for the proper name Gyokuhou is unchanged.
      if(locale!=='en'&&text===group&&!(locale==='fr'&&group==='Gyokuhou'))missing.push(`${locale}: ${group}`)
      for(const id of ids)expect(characterContentMatch(findCharById(id),text,locale),`${locale}: ${id} / ${group}`).toBeTruthy()
    }
    expect(missing).toEqual([])
  })

  it('keeps duplicate faction labels and authored buff entries consistent without changing ownership IDs',()=>{
    const byName=new Map(ALL.map(c=>[c.name_jp,c]))
    for(const value of Object.values(RARITY_DATA)){
      const c=byName.get(value.name_jp)
      if(c)expect(value.faction,c.id).toBe(FACTIONS.find(f=>f.id===c.country).label)
    }
    const visit=value=>{
      if(!value||typeof value!=='object')return
      if(value.name_jp&&value.faction&&byName.has(value.name_jp))expect(value.faction,value.name_jp).toBe(byName.get(value.name_jp).country)
      for(const child of Object.values(value))visit(child)
    }
    visit(buffData)
  })
})
