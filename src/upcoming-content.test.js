import {describe,expect,it} from 'vitest'
import {getReleaseData,applyMask,calcCharBuffs,calcTeamEnemyDebuffs} from './core.jsx'

const release=1792573200000
const after=getReleaseData(release)
const owner=applyMask(after.findCharById('batei'),{n:0,s6:true,role:false})
const empty=id=>({...after.findCharById(id),skills:[],roleSkill:null})

describe('Batei future CW6',()=>{
  it('gates the card and character skill at the same source boundary',()=>{
    const before=getReleaseData(release-1)
    expect(before.PUBLIC_CW6_CARDS.some(card=>card.id===42003)).toBe(false)
    expect(before.findCharById('batei').skills.some(skill=>skill.cwId===877)).toBe(false)
    expect(after.PUBLIC_CW6_CARDS.find(card=>card.id===42003)).toMatchObject({owner_id:'batei',publicTime:1792573200,cwIds:[872,873,874,875,876,877]})
    expect(owner.skills).toHaveLength(1)
    expect(owner.skills[0].cwId).toBe(877)
  })
  it('keeps healing effectiveness on Kisui army recipients and never adds flat healing',()=>{
    const kisui=empty('kisui'),shin=empty('shin')
    const team=[owner,kisui,shin]
    expect(calcCharBuffs(kisui,team,[],false,true)['HP Recovery Rate']?.up).toBe(50)
    expect(calcCharBuffs(kisui,team,[],false,true)['HP Recovery']).toBeUndefined()
    expect(calcCharBuffs(shin,team,[],false,true)['HP Recovery Rate']).toBeUndefined()
    expect(calcTeamEnemyDebuffs(team)).toEqual({})
  })
  it('requires both surviving partners for betrayal resistance',()=>{
    const kisui=empty('kisui'),ryuuto=empty('ryuuto')
    const full=calcCharBuffs(owner,[owner,kisui,ryuuto],[],false,true)
    expect(full['Betrayal Resistance']?.up).toBe(50)
    expect(calcCharBuffs(owner,[owner,kisui],[],false,true)['Betrayal Resistance']?.up||0).toBe(0)
    expect(calcCharBuffs(owner,[owner,ryuuto],[],false,true)['Betrayal Resistance']?.up||0).toBe(0)
  })
})
