import {describe,expect,it} from 'vitest'
import {
  applyMask,buffValueMeaning,calcCharBuffs,calcTeamEnemyDebuffs,defaultSks,
  findCharById,getReleaseData,isBuffSummarySkill,META_TEAMS,parseBuffEffect,
  resolveBuilderMechanic,teamEffectReferences,TIER_TEAMS,updateSkillMasks,
} from './core.jsx'
import {localizedSkill,localizedText} from './i18n/data.js'

const bare=id=>({...findCharById(id),skills:[],roleSkill:null})
const selected=id=>applyMask(findCharById(id),{n:3,s6:true,role:true})
const scope=(id,slot,effectIndex)=>{
  const owner=findCharById(id),skill=owner.skills[slot]
  return {...owner,skills:[{...skill,effects:[skill.effects[effectIndex]]}],roleSkill:null}
}

describe('complete Conquest effect review',()=>{
  it('keeps every selected effect available once, including non-additive and non-buff effects',()=>{
    for(const owner of getReleaseData(Infinity).ALL){
      const masked=applyMask(owner,{n:3,s6:true,role:true})
      for(const includeCombat of [false,true]){
        const buffs=calcCharBuffs(masked,[masked],[],false,false,includeCombat)
        const enemy=calcTeamEnemyDebuffs([masked],[],includeCombat,false)
        const refs=teamEffectReferences([masked],[{general:masked,buffs}],enemy,includeCombat)
        const expected=masked.skills.filter(skill=>isBuffSummarySkill(skill,includeCombat)).flatMap(skill=>skill.effects)
        expect(refs.map(ref=>ref.effect),owner.id).toEqual(expected)
        for(const ref of refs) expect(ref.skill.effects).toContain(ref.effect)
      }
    }
  })

  it('distinguishes every current status-rate bonus from a status application chance',()=>{
    let reviewed=false
    for(const owner of getReleaseData(Infinity).ALL){
      for(const skill of [...owner.skills,...(owner.roleSkill?[owner.roleSkill]:[])]){
        for(const effect of skill.effects||[]){
          if(!/Infliction Rate (?:Up|Down)/i.test(effect.effect)) continue
          reviewed=true
          const modifiers=resolveBuilderMechanic(effect).modifiers.filter(modifier=>/Infliction Rate$/.test(modifier.stat))
          expect(modifiers.length,`${owner.id}: ${effect.effect}`).toBeGreaterThan(0)
          for(const modifier of modifiers) expect(buffValueMeaning(modifier,effect),`${owner.id}: ${modifier.stat}`).toMatchObject({kind:'fixed',value:modifier.val})
        }
      }
    }
    expect(reviewed).toBe(true)
    for(const effect of ['Betrayal Infliction 40%','Confusion Infliction 70%','Poison Infliction 100%']){
      expect(buffValueMeaning(parseBuffEffect(effect)[0],{effect})).toMatchObject({kind:'chance'})
    }
  })

  it('counts both terms in shared and repeated status-rate phrases',()=>{
    for(const effect of ['Confusion / Betrayal Infliction Rate Up 35%','"Confusion" Infliction Rate Up, "Betrayal" Infliction Rate Up 35%']){
      const mods=parseBuffEffect(effect)
      expect(new Set(mods.map(mod=>mod.stat))).toEqual(new Set(['Confusion Infliction Rate','Betrayal Infliction Rate']))
      for(const mod of mods) expect(buffValueMeaning(mod,{effect})).toEqual({kind:'fixed',value:35})
    }
  })

  it('adds Ai status bonuses while keeping direct applications out of totals',()=>{
    const team=['ryofui','hanoki','rouai','koreki'].map(selected)
    const hanoki=team[1]
    const buffs=calcCharBuffs(hanoki,team,[],false)
    expect(buffs['Betrayal Infliction Rate'].up).toBe(110)
    expect(buffs['Confusion Infliction Rate'].up).toBe(70)
    for(const source of buffs['Betrayal Infliction Rate'].sources) expect(source.valueMeaning.kind).toBe('fixed')
    const hit=scope('queen_biki',1,1)
    const enemy=calcTeamEnemyDebuffs([hit],[bare('moubu')],true)
    expect(Object.keys(enemy)).toEqual([])
    expect(enemy.meta.conditionalEffects).toEqual(expect.arrayContaining([expect.objectContaining({valueMeaning:expect.objectContaining({kind:'chance',rate:40})})]))
  })

  it('resolves Gikou’s recipient-only clause through source effect 1147',()=>{
    const owner=scope('gii',0,0),shin=bare('shin')
    expect(owner.skills[0].effects[0].mechanicId).toBe('cw:30:e1147')
    expect(calcCharBuffs(owner,[owner,shin],[],false)['Confusion Infliction Rate']).toBeUndefined()
    expect(calcCharBuffs(shin,[owner,shin],[],false)['Confusion Infliction Rate'].up).toBe(20)
  })

  it('requires another Renpa Army general for the CW6 guard',()=>{
    const owner=scope('renpa',3,1),rinko=bare('rinko'),moubu=bare('moubu')
    expect(owner.skills[0].effects[0].mechanicId).toBe('cw:567:e2217+2223')
    expect(calcCharBuffs(owner,[owner,moubu],[],false).Guard).toBeUndefined()
    const result=calcCharBuffs(moubu,[owner,rinko,moubu],[],false)
    expect(result.Guard.up).toBe(60)
    expect(result.Guard.sources[0].survivalCaveats).toHaveLength(1)
    expect(result.Guard.instances[0].duration).toBe('2 times')
  })

  it('counts Ei Sei’s three nullifications only when garrisoning',()=>{
    const owner=scope('ei_sei',2,1)
    expect(owner.skills[0].effects[0].mechanicId).toBe('cw:147:e1445')
    expect(calcCharBuffs(owner,[owner],[],false,false,true)['Attack Nullification']).toBeUndefined()
    expect(calcCharBuffs(owner,[owner],[],true,false,true)['Attack Nullification'].up).toBe(3)
    expect(calcCharBuffs(owner,[owner],[],true,false,false)['Attack Nullification']).toBeUndefined()
  })

  it('uses source Japanese status names rather than confusing 錯乱 with 混乱',()=>{
    expect(localizedText('Confusion Infliction Rate','ja')).toBe('「錯乱」付与確率')
    expect(localizedText('Betrayal Infliction Rate','ja')).toBe('「裏切り」付与確率')
  })

  it.each([
    ['shuki',0,0,'Infantry','ATK'],['ryuusen',0,1,'Infantry','ATK'],
    ['shoumou',0,1,'Cavalry','ATK'],['rinbou',0,1,'Cavalry','ATK'],['doukin',0,1,'Cavalry','DEF'],
  ])('%s contributes its typed bonus to matching other allies only',(id,si,ei,unit,stat)=>{
    const owner=scope(id,si,ei)
    for(const candidate of [owner,bare('moubu'),bare('ouki'),bare('ousen'),bare('hakurei')]){
      const team=owner.id===candidate.id?[owner]:[owner,candidate]
      const result=calcCharBuffs(candidate,team,[],false,false,true)
      expect(result[stat]?.up||0).toBe(candidate.id!==owner.id&&candidate.unit_type===unit?20:0)
      expect(Object.keys(result).every(key=>!key.includes('['))).toBe(true)
    }
    const display=localizedSkill(owner.skills[0],id,si,'ja').displayEffects[0]
    expect(display.target).toBe(unit==='Infantry'?'自身以外の味方歩兵武将':'自身以外の味方騎兵武将')
    expect(display.effect).toBe(`${stat==='ATK'?'攻撃力':'防御力'}20%上昇`)
  })

  it('combines equivalent resistance and morale-cost labels into canonical rows',()=>{
    const owner={...bare('moubu'),skills:[{type:'Strategy',effects:[
      {target:'Self',effect:'ATK Down Resistance 30%'},
      {target:'Self',effect:'Attack Down Resistance Up 40%'},
      {target:'Self',effect:'Morale Cost Down 30%'},
      {target:'Self',effect:'Morale Consumption Down 20%'},
    ]}]}
    const result=calcCharBuffs(owner,[owner],[],false)
    expect(result['ATK Down Resistance'].up).toBe(70)
    expect(result['Morale Consumption'].down).toBe(50)
    expect(result['Attack Down Resistance']).toBeUndefined()
    expect(result['Morale Cost']).toBeUndefined()
  })

  it('keeps regeneration separate from immediate recovery and preserves its duration',()=>{
    const kisui=findCharById('kisui')
    const result=calcCharBuffs(kisui,[kisui],[],false,false,true)
    expect(result['Continuous HP Recovery'].up).toBe(8)
    expect(result['Continuous HP Recovery'].sources[0].effect.duration).toBe('4 turns')
    expect(result['Continuous Morale Recovery'].up).toBe(3)
    expect(result['HP Recovery']).toBeUndefined()
    expect(localizedText('Continuous HP Recovery','ja')).toBe('体力継続回復')
  })

  it('never turns a turn duration into a number of nullifications or applications',()=>{
    const owner={...bare('moubu'),skills:[{type:'Strategy',effects:[
      {target:'Self',effect:'Sure Hit',duration:'3 turns'},
      {target:'Self',effect:'Attack Nullification',duration:'2 times'},
    ]}]}
    const result=calcCharBuffs(owner,[owner],[],false)
    expect(result['Sure Hit'].up).toBe(1)
    expect(result['Sure Hit'].sources[0].effect.duration).toBe('3 turns')
    expect(result['Attack Nullification'].up).toBe(2)
  })
})

describe('November preset teams and role limits',()=>{
  it.each([
    ['Riboku Vanguard',['Shunsuiju','Houken','Bananji','Riboku'],undefined],
    ['Qin Bow Command',['Shouheikun','Sougen','Soujin','Soutan'],'B'],
    ['Wei v2',['Tairoji','Ranbihaku','Reiou','Gohoumei'],undefined],
    ['Kanmei Army',['Kyoubou','Kanmei','Beiman','Jinou'],undefined],
    ['Rigan',['Kishou','Kisui','Batei','Ryuuto'],'A'],
  ])('%s keeps the supplied order and explicit tier placement',(name,members,tier)=>{
    const teams=META_TEAMS.filter(team=>team.name===name)
    expect(teams).toHaveLength(1)
    expect(teams[0].members).toEqual(members)
    expect(teams[0].tier).toBe(tier)
    expect(TIER_TEAMS.some(team=>team.name===name)).toBe(Boolean(tier))
  })

  it.each([['Strategist','reiou','gohoumei'],['Leader','kanmei','renpa']])('switches %s without affecting the other role',(role,first,second)=>{
    const other=role==='Leader'?'shouheikun':'kanmei'
    const party=[first,second,other,'moubu'].map(findCharById)
    let masks=defaultSks()
    masks=updateSkillMasks(masks,party,2,{...masks[2],role:true})
    masks=updateSkillMasks(masks,party,0,{...masks[0],role:true})
    masks=updateSkillMasks(masks,party,1,{...masks[1],role:true})
    expect(masks.map(mask=>mask.role)).toEqual([false,true,true,false])
    expect(party.map((char,index)=>applyMask(char,masks[index])).filter(char=>char.assignedRole===role)).toHaveLength(1)
  })
})
