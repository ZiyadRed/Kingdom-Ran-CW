import { describe, expect, it } from 'vitest'
import sourceSkillMap from '../data/source/cw_skills.map.json'
import japaneseSkills from '../data/generated/ja/skills.json'
import { BUILDER_MECHANIC_ROWS, BUILDER_MECHANICS } from './builder-mechanics.js'
import {
  ALL,
  BUFF_APPLICABILITY,
  builderMechanicCoverage,
  calcCharBuffs,
  calcTeamEnemyDebuffs,
  findCharByName,
  resolveBuilderMechanic,
} from './core.jsx'

const withoutSkills=character=>({...character,skills:[],roleSkill:null})
const publicTotals=result=>Object.fromEntries(Object.entries(result).map(([stat,bucket])=>[
  stat,
  Object.fromEntries(['up','down','potentialUp','potentialDown']
    .filter(key=>bucket[key]!==undefined)
    .map(key=>[key,bucket[key]])),
]))
const publicEnemyTotals=result=>Object.fromEntries(Object.entries(result).map(([target,bucket])=>[
  target,{
    up:bucket.up,down:bucket.down,
    potentialUp:bucket.potentialUp,potentialDown:bucket.potentialDown,
  },
]))

const locate=row=>{
  const owner=ALL.find(character=>character.id===row.sourceKey.split('#')[0])
  const found=(owner?.skills||[]).flatMap(skill=>(skill.effects||[]).map(effect=>({skill,effect})))
    .find(entry=>entry.effect.mechanicId===row.id)
  expect(owner,`owner for ${row.id}`).toBeTruthy()
  expect(found,`attached row for ${row.id}`).toBeTruthy()
  return{owner,...found}
}

const scopedOwner=(row,stable=true)=>{
  const{owner,skill,effect}=locate(row)
  const scopedEffect=stable?effect:Object.fromEntries(Object.entries(effect).filter(([key])=>key!=='mechanicId'))
  return{...owner,skills:[{...skill,effects:[scopedEffect]}],roleSkill:null}
}

describe('F03 stable Builder identity',()=>{
  it('uses deterministic source effect identities with validated skill joins and Japanese evidence',()=>{
    expect(BUILDER_MECHANIC_ROWS).toHaveLength(44)
    expect(new Set(BUILDER_MECHANIC_ROWS.map(row=>row.id)).size).toBe(BUILDER_MECHANIC_ROWS.length)
    expect(new Set(BUILDER_MECHANIC_ROWS.map(row=>`${row.sourceKey}:${row.effectIndex}`)).size).toBe(BUILDER_MECHANIC_ROWS.length)

    const sourceEffectIds=new Map()
    for(const row of BUILDER_MECHANIC_ROWS){
      const source=sourceSkillMap.skills[row.sourceKey]
      expect(source,`source map ${row.sourceKey}`).toMatchObject({
        characterId:row.source.characterId,
        skillId:row.source.skillId,
        textId:row.source.textId,
        status:row.source.status,
      })
      expect(japaneseSkills.skills[String(row.source.skillId)].desc).toContain(row.source.evidence)
      const sorted=[...row.source.effectIds].sort((a,b)=>a-b)
      expect(sorted.every(effectId=>row.source.skillEffectIds.includes(effectId)),`${row.id} atomic effect belongs to source skill`).toBe(true)
      expect(row.id).toBe(`cw:${row.source.skillId}:e${sorted.join('+')}`)
      for(const effectId of sorted){
        const key=`${row.source.skillId}:${effectId}`
        expect(sourceEffectIds.has(key),`duplicate atomic source effect ${key}`).toBe(false)
        sourceEffectIds.set(key,row.id)
      }
      expect(resolveBuilderMechanic(locate(row).effect)).toMatchObject({resolution:'stable',mechanic:{id:row.id}})
    }
  })

  it('keeps mechanics independent of English and localized presentation wording',()=>{
    const original=findCharByName('Shunshinkun')
    const stableSkill=original.skills.find(skill=>skill.name_en==='Peerless Leader')
    const mutated={
      ...original,
      skills:[{
        ...stableSkill,
        displayEffects:[{condition:'条件',target:'対象',effect:'効果',duration:'期間'}],
        effects:stableSkill.effects.map(effect=>({
          ...effect,
          condition:'totally different formatting',
          target:'texte de présentation',
          effect:'نص عرض مترجم بلا أرقام',
          duration:'changed presentation',
        })),
      }],
      roleSkill:null,
    }
    const target=withoutSkills(findCharByName('Gokei'))
    const enemy=[withoutSkills(findCharByName('Shin'))]
    const expected=calcCharBuffs(target,[scopedOwner(BUILDER_MECHANIC_ROWS.find(row=>row.sourceKey==='shunshinkun#2')) ,target],enemy,false)
    const actual=calcCharBuffs(target,[mutated,target],enemy,false)
    expect(publicTotals(actual)).toEqual(publicTotals(expected))
    expect(actual.meta.mechanicResolution.stable).toHaveLength(1)
    expect(actual.meta.mechanicResolution.parserFallback).toHaveLength(0)
  })

  it('fails closed for a declared identity that is not mapped',()=>{
    const owner={...findCharByName('Shin'),skills:[{
      name_en:'Unknown stable row',type:'Strategy',effects:[{
        mechanicId:'cw:999999:e1',condition:null,target:'Self',effect:'ATK Up 999%',duration:null,
      }],
    }],roleSkill:null}
    const result=calcCharBuffs(owner,[owner],[],false)
    expect(result.ATK).toBeUndefined()
    expect(result.meta.mechanicResolution.failClosed).toHaveLength(1)
    expect(result.meta.unsupported[0]).toMatchObject({
      mechanicId:'cw:999999:e1',
      applicability:BUFF_APPLICABILITY.UNSUPPORTED,
      reasons:['stable-identity-unmapped'],
    })
  })

  it('never lets presentation parsing override an attached stable identity',()=>{
    const row=BUILDER_MECHANIC_ROWS.find(entry=>entry.sourceKey==='shin#1'&&entry.effectIndex===0)
    const{owner,skill,effect}=locate(row)
    const adversarialOwner={...owner,skills:[{
      ...skill,
      effects:[{...effect,target:'All enemy [General]',effect:'ATK Down 999%'}],
    }],roleSkill:null}
    const result=calcTeamEnemyDebuffs([adversarialOwner],[withoutSkills(findCharByName('Riboku'))],true,false)
    expect(publicEnemyTotals(result)).toEqual({})
    expect(result.meta.mechanicResolution.stable).toHaveLength(1)
    expect(result.meta.mechanicResolution.parserFallback).toHaveLength(0)
  })

  it('leaves ambiguous source-map joins explicit and parser-only',()=>{
    for(const sourceKey of ['futei#0','gakuki#0','jiou#1','kousonryu#0']){
      const source=sourceSkillMap.skills[sourceKey]
      expect(source.status).toBe('ambiguous')
      expect(source.skillId).toBeNull()
      const owner=ALL.find(character=>character.id===sourceKey.split('#')[0])
      const skill=owner.skills[Number(sourceKey.split('#')[1])]
      expect((skill.effects||[]).every(effect=>!effect.mechanicId),sourceKey).toBe(true)
    }
  })

  it('matches the compatibility parser for every migrated row across the roster corpus',()=>{
    const enemyCases=[
      [],
      [withoutSkills(findCharByName('Shin'))],
      [withoutSkills(findCharByName('Riboku'))],
      [withoutSkills(findCharByName('Gokei'))],
      [withoutSkills(findCharByName('Hakurei'))],
      [withoutSkills(findCharByName('Ouhon'))],
      [withoutSkills(findCharByName('Shoutaku'))],
    ]
    for(const row of BUILDER_MECHANIC_ROWS){
      const stable=scopedOwner(row,true)
      const legacy=scopedOwner(row,false)
      const mechanic=BUILDER_MECHANICS[row.id]
      const allyTarget=mechanic.recipients.some(recipient=>recipient.side==='ally')
      if(allyTarget){
        for(const candidate of ALL){
          for(const enemies of enemyCases){
            for(const isDefense of [false,true]){
              const stableTarget=candidate.id===stable.id?stable:withoutSkills(candidate)
              const legacyTarget=candidate.id===legacy.id?legacy:withoutSkills(candidate)
              const stableTeam=stableTarget.id===stable.id?[stable]:[stable,stableTarget]
              const legacyTeam=legacyTarget.id===legacy.id?[legacy]:[legacy,legacyTarget]
              const actual=calcCharBuffs(stableTarget,stableTeam,enemies,isDefense,false,true)
              const expected=calcCharBuffs(legacyTarget,legacyTeam,enemies,isDefense,false,true)
              expect(publicTotals(actual),`${row.id} target=${candidate.id} defense=${isDefense}`).toEqual(publicTotals(expected))
            }
          }
        }
      }else{
        const allyCases=[[],[withoutSkills(findCharByName('Karin'))],[withoutSkills(findCharByName('Shin'))]]
        for(const candidate of ALL){
          for(const allies of allyCases){
            for(const isDefense of [false,true]){
              const stableTeam=[stable,...allies]
              const legacyTeam=[legacy,...allies]
              const enemies=[withoutSkills(candidate)]
              const actual=calcTeamEnemyDebuffs(stableTeam,enemies,true,isDefense)
              const expected=calcTeamEnemyDebuffs(legacyTeam,enemies,true,isDefense)
              expect(publicEnemyTotals(actual),`${row.id} enemy=${candidate.id} defense=${isDefense}`).toEqual(publicEnemyTotals(expected))
            }
          }
        }
      }
    }
  },60000)

  it('reports stable, parser fallback, unsupported and fail-closed coverage explicitly',()=>{
    expect(builderMechanicCoverage(ALL,true)).toMatchObject({
      total:885,
      stable:44,
      parserFallback:840,
      unsupported:1,
      failClosed:0,
    })
  })
})
