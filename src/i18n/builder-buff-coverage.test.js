import { describe, expect, it } from 'vitest'
import {
  calcCharBuffs,
  calcTeamEnemyDebuffs,
  getReleaseData,
  isBuffSummarySkill,
  normalizeEnemyTarget,
  parseBuffEffect,
  parseEnemyTargetCriteria,
  resolveBuilderMechanic,
} from '../core.jsx'
import { formatTeamBuffShare } from '../share.js'
import { japaneseSkillSource, localizedSkill, localizedTarget, localizedText } from './data.js'
import { renderJapaneseTerm } from './ja-render.js'

// Use every declared release stage, never the date on the test machine.
// Walk the same skill filter and stable/parser resolution as the Builder, then
// include actual ally/enemy calculation outputs and share-only source metadata.
function builderTerms(){
  const roster=getReleaseData(Infinity).ALL
  const stats=new Set()
  const targets=new Set()
  const includeResult=result=>{
    for(const [key,bucket] of Object.entries(result)){
      if(typeof bucket?.up==='number'){
        stats.add(key)
      }else{
        targets.add(key)
        for(const stat of [...Object.keys(bucket?.up||{}),...Object.keys(bucket?.down||{})]) stats.add(stat)
      }
    }
    for(const key of ['conditionalEffects','missingInputs','unsupported']){
      for(const source of result.meta?.[key]||[]) if(source.stat) stats.add(source.stat)
    }
  }
  for(const owner of roster){
    for(const skill of [...owner.skills||[],...(owner.roleSkill?[owner.roleSkill]:[])]){
      if(!isBuffSummarySkill(skill,true)) continue
      for(const effect of skill.effects||[]){
        const resolved=resolveBuilderMechanic(effect)
        for(const modifier of resolved.modifiers) stats.add(modifier.stat)
        if(resolved.modifiers.length){
          if(resolved.mechanic?.recipients.some(recipient=>recipient.side==='enemy')){
            targets.add(resolved.mechanic.targetLabel||normalizeEnemyTarget(effect.target))
          }else if(parseEnemyTargetCriteria(effect.target)) targets.add(normalizeEnemyTarget(effect.target))
        }
        // The parser is the compatibility path for unkeyed content. Testing it
        // for every current row also catches a new fallback term on migration.
        if(!effect.mechanicId){
          for(const modifier of parseBuffEffect(effect.effect)) stats.add(modifier.stat)
        }
      }
    }
    includeResult(calcCharBuffs(owner,[owner],[],false,false,true))
    includeResult(calcTeamEnemyDebuffs([owner],[],true,false))
  }
  return {stats:[...stats].sort(),targets:[...targets].sort()}
}

function unexplainedJapaneseStats(terms){
  return terms.filter(term=>{
    // A stat must be modeled as a complete short term. The generic text
    // renderer may understand longer clauses, which would hide a partial stat
    // fallback here. This avoids a blanket ban on legitimate Latin names.
    const modeled=renderJapaneseTerm(term)
    const rendered=localizedText(term,'ja')
    return !modeled || modeled===term || rendered!==modeled
  })
}

describe('Builder Buff Summary Japanese terminology',()=>{
  it('keeps abbreviated and long-form resistance keys equivalent',()=>{
    expect(localizedText('ATK Down Resistance','ja')).toBe('攻撃力低下耐性')
    expect(localizedText('DEF Down Resistance','ja')).toBe('防御力低下耐性')
    expect(localizedText('Attack Down Resistance','ja')).toBe('攻撃力低下耐性')
    expect(localizedText('Defense Down Resistance','ja')).toBe('防御力低下耐性')
  })

  it('localizes every term the current Builder mechanics corpus can emit',()=>{
    const {stats,targets}=builderTerms()
    expect(stats.length).toBeGreaterThan(0)
    expect(unexplainedJapaneseStats(stats),`emitted stats: ${stats.join(', ')}`).toEqual([])
    for(const target of targets){
      const rendered=localizedTarget(target,'ja')
      expect(rendered,`enemy target: ${target}`).not.toBe(target)
    }
  })

  it('rejects newly emitted terminology that has no Japanese presentation',()=>{
    expect(unexplainedJapaneseStats(['Future Unknown Stat Resistance'])).toEqual(['Future Unknown Stat Resistance'])
  })

  it('uses the same term localizer in Buff Summary sharing',()=>{
    const general={id:'example',name_en:'Example'}
    const result=formatTeamBuffShare({
      atk:[general],atkBuffs:[{general,buffs:{
        'ATK Down Resistance':{up:30,down:0},
        'DEF Down Resistance':{up:20,down:0},
      }}],url:'https://example.com/builder',
      labels:{localizeTerm:term=>localizedText(term,'ja'),localizeCharacterName:()=> '試験武将'},
    })
    expect(result).toContain('攻撃力低下耐性')
    expect(result).toContain('防御力低下耐性')
    expect(result).not.toMatch(/(?:ATK|DEF) Down Resistance/)
  })

  it('preserves verified Japanese skill names verbatim',()=>{
    const character=getReleaseData(Infinity).ALL.find(row=>row.id==='shin')
    const index=character.skills.findIndex((_,i)=>Boolean(japaneseSkillSource(character.id,i)))
    const source=japaneseSkillSource(character.id,index)
    expect(source).toBeTruthy()
    expect(localizedSkill(character.skills[index],character.id,index,'ja').displayName).toBe(source.name)
  })
})
