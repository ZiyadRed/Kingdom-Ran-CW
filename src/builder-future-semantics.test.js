import {describe,expect,it} from 'vitest'
import {
  BUFF_APPLICABILITY,calcCharBuffs,calcTeamEnemyDebuffs,
  evaluateBuffApplicability,evaluateStableMechanicApplicability,findCharByName,
} from './core.jsx'
import {contrastRatio,skillTypeVisual} from './share.js'

const member=(id,country='qin',unit_type='Cavalry',groups=[])=>({id,name_en:id,country,unit_type,groups,skills:[]})
const ownerWith=(condition,effect='ATK Up 25%',target='Self',extra={})=>({
  ...member('future_owner'),
  skills:[{name_en:'Future source-backed skill',type:'Strategy',effects:[{condition,target,effect,duration:null,...extra}]}],
})
const bare=character=>({...character,skills:[]})
const akou=()=>bare(findCharByName('Akou'))

describe('future Builder semantics do not need character-specific calculator branches',()=>{
  it('puts a fixed named-ally effect in the main total only when its ally is selected',()=>{
    const owner=ownerWith('When ally Akou is present')
    expect(calcCharBuffs(owner,[owner,akou()],[],false).ATK.up).toBe(25)
    expect(calcCharBuffs(owner,[owner],[],false).ATK).toBeUndefined()
  })

  it('resolves faction and unit intersections on one member, and group presence generically',()=>{
    const zhaoCavalry=member('future_zhao_cavalry','zhao','Cavalry')
    const zhaoInfantry=member('future_zhao_infantry','zhao','Infantry')
    const intersection=ownerWith('When ally [Zhao] [Cavalry] is present')
    expect(calcCharBuffs(intersection,[intersection,zhaoCavalry],[],false).ATK.up).toBe(25)
    expect(calcCharBuffs(intersection,[intersection,zhaoInfantry],[],false).ATK).toBeUndefined()
    const groupOwner=ownerWith('When ally Ousen Army is present')
    expect(calcCharBuffs(groupOwner,[groupOwner,member('future_group_member','qin','Archer',['Ousen Army'])],[],false).ATK.up).toBe(25)
  })

  it('counts survival-only with a caveat, but survival plus HP or status stays runtime',()=>{
    const survival=ownerWith('When ally Akou is alive')
    const applied=calcCharBuffs(survival,[survival,akou()],[],false)
    expect(applied.ATK.up).toBe(25)
    expect(applied.ATK.sources[0].survivalCaveats).toHaveLength(1)
    for(const condition of ['When ally Akou is alive and own HP ≤ 50%','When ally Akou is alive and target is poisoned']){
      const owner=ownerWith(condition)
      const result=calcCharBuffs(owner,[owner,akou()],[],false)
      expect(result.ATK?.up||0,condition).toBe(0)
      expect(result.meta.conditionalEffects,condition).toEqual([expect.objectContaining({stat:'ATK',survivalCaveats:expect.any(Array)})])
      expect(result.meta.conditionalEffects[0].runtimeRequirements.length,condition).toBeGreaterThan(0)
    }
  })

  it('keeps attack counts, caps, HP scaling, and chance meanings non-additive',()=>{
    const cases=[
      ['Per own attack count','ATK Up 5% per attack, max 30%','perCounter'],
      [null,'ATK Up (max 20%)','upperBound'],
      ['Own HP ≤ 50%','ATK Up 20% based on remaining HP','dynamicMultiplier'],
      [null,'Poison Infliction 70%','chance'],
    ]
    for(const [condition,effect,kind] of cases){
      const owner=ownerWith(condition,effect)
      const result=calcCharBuffs(owner,[owner],[],false)
      const stat=kind==='chance'?'Poison Infliction Rate':'ATK'
      expect(result[stat]?.up||0,kind).toBe(0)
      expect(result.meta.conditionalEffects,kind).toEqual([expect.objectContaining({stat,valueMeaning:expect.objectContaining({kind})})])
    }
  })

  it('distinguishes an absent opponent from a known nonmatching opponent',()=>{
    const owner=ownerWith('When enemy [Archer] is alive')
    const missing=calcCharBuffs(owner,[owner],[],false)
    expect(missing.ATK).toBeUndefined()
    expect(missing.meta.missingInputs[0].missingInputs).toEqual([{kind:'opposingFormation'}])
    expect(calcCharBuffs(owner,[owner],[member('future_enemy','wei','Shield')],false).ATK).toBeUndefined()
    expect(calcCharBuffs(owner,[owner],[member('future_archer','wei','Archer')],false).ATK.up).toBe(25)
  })

  it('preserves OR, AND, and self exclusion for future skills',()=>{
    const batei=bare(findCharByName('Batei'))
    const ryuuto=bare(findCharByName('Ryuuto'))
    const either=ownerWith('When ally Batei or Ryuuto is alive')
    const both=ownerWith('When ally Batei and Ryuuto are both alive')
    expect(calcCharBuffs(either,[either,batei],[],false).ATK.up).toBe(25)
    expect(calcCharBuffs(both,[both,batei],[],false).ATK).toBeUndefined()
    expect(calcCharBuffs(both,[both,batei,ryuuto],[],false).ATK.up).toBe(25)
    const counted=ownerWith('Per other ally [Qin] [General]','ATK Up 5%')
    expect(calcCharBuffs(counted,[counted],[],false).ATK).toBeUndefined()
    expect(calcCharBuffs(counted,[counted,member('future_ally')],[],false).ATK.up).toBe(5)
  })

  it('fails closed for unknown grammar, unresolved value, recipient, and stable identity',()=>{
    for(const owner of [
      ownerWith('When blue moon rises'),
      ownerWith('When ally Akou is alive during an eclipse'),
      ownerWith(null,'ATK Up mystery%'),
      ownerWith(null,'ATK Up 25%','Ally [Celestial Mechanist]'),
      ownerWith(null,'ATK Up 25%','Self',{mechanicId:'cw:999999:e1'}),
    ]){
      const result=calcCharBuffs(owner,[owner,akou()],[],false)
      expect(result.ATK?.up||0).toBe(0)
      expect(result.meta.unsupported.length+result.meta.mechanicResolution.failClosed.length,`${owner.skills[0].effects[0].condition} | ${owner.skills[0].effects[0].target} | ${owner.skills[0].effects[0].effect}`).toBeGreaterThan(0)
    }
  })

  it('fails closed on future stable condition/recipient/value kinds',()=>{
    const owner=member('future_owner')
    const mechanic={recipients:[{side:'ally',criteria:{kind:'all'}}],conditions:[{kind:'presence',side:'ally',criteria:{kind:'dragon',id:'x'},state:'present'}]}
    expect(evaluateStableMechanicApplicability(mechanic,owner,[owner],[],false).state).toBe(BUFF_APPLICABILITY.UNSUPPORTED)
    expect(evaluateStableMechanicApplicability({...mechanic,conditions:[],recipients:[{side:'ally',criteria:{kind:'dragon'}}]},owner,[owner],[],false).state).toBe(BUFF_APPLICABILITY.UNSUPPORTED)
  })

  it('can classify formation requirements without a parsed numeric modifier',()=>{
    const owner=member('future_owner')
    const result=evaluateBuffApplicability(
      {condition:'When ally Akou is alive',target:'All enemy [General]',effect:'DEF Down 20%'},
      null,owner,[owner,akou()],[],false,
    )
    expect(result.state).toBe(BUFF_APPLICABILITY.APPLICABLE)
    expect(result.survivalCaveats).toHaveLength(1)
    expect(result.valueMeaning).toBeNull()
  })

  it('does not require a calculator branch for another CW6 Strategy skill',()=>{
    const owner=ownerWith('When ally Akou is alive')
    owner.skills[0].star6=true
    expect(calcCharBuffs(owner,[owner,akou()],[],false).ATK.up).toBe(25)
  })

  it('keeps poisoned targets runtime rather than inferring activation from an enemy roster',()=>{
    const owner=ownerWith(null,'ATK Down 20%','All poisoned enemy [General]')
    const result=calcTeamEnemyDebuffs([owner],[member('future_enemy','wei')],false,false)
    expect(result['All poisoned enemy [General]']?.down?.ATK).toBeUndefined()
    expect(result.meta.conditionalEffects[0].runtimeRequirements).toEqual(expect.arrayContaining([expect.objectContaining({kind:'targetStatus'})]))
  })

  it('uses a contrast-safe visual fallback for an unknown future skill type',()=>{
    const visual=skillTypeVisual('Future Skill Type')
    expect(contrastRatio(visual.text,visual.badge)).toBeGreaterThanOrEqual(4.5)
  })
})
