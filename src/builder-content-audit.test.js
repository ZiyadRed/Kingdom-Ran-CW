import {describe,expect,it} from 'vitest'
import baseline from '../data/source/builder_audit_baseline.json'
import {ALL} from './core.jsx'
import {auditBuilderContent,newBuilderContentIssues} from './builder-content-audit.js'

const imported=(condition,target,effect,{mechanicId,type='Strategy'}={})=>[{
  id:'future_import',name_en:'Future Import',country:'qin',unit_type:'Cavalry',groups:[],
  skills:[{name_en:'Future Skill',type,effects:[{condition,target,effect,duration:null,...(mechanicId?{mechanicId}:{})}]}],
}]
const codes=issues=>new Set(issues.map(item=>item.code))

describe('Builder content-ingestion guard',()=>{
  it('rejects new semantic findings without locking live character/effect counts',()=>{
    const issues=auditBuilderContent(ALL)
    expect(newBuilderContentIssues(issues,baseline.acknowledgedIssueKeys)).toEqual([])
    expect(new Set(baseline.acknowledgedIssueKeys).size).toBe(baseline.acknowledgedIssueKeys.length)
  })

  it('flags unknown grammar, effect resolution, stable ID, recipient, and opponent',()=>{
    const cases=[
      [imported('When starlight fades','Self','ATK Up 25%'),'unknown-condition-grammar'],
      [imported(null,'Self','ATK Up mystery%'),'unresolved-effect'],
      [imported(null,'Self','ATK Up 25%',{mechanicId:'cw:999999:e1'}),'unknown-stable-id'],
      [imported(null,'Ally [Celestial Mechanist]','ATK Up 25%'),'unsupported-recipient'],
      [imported(null,'Self vs Celestial Mechanist','ATK Up 25%'),'unsupported-opponent'],
    ]
    for(const [roster,code] of cases) expect(codes(auditBuilderContent(roster,{locales:['en']})),code).toContain(code)
  })

  it('flags unknown structured value meaning and missing presentation fields',()=>{
    const roster=imported(null,'Self','ATK Up 25%')
    const resolve=()=>({resolution:'stable',mechanic:{recipients:[{side:'ally',criteria:{kind:'all'}}]},modifiers:[{
      stat:'ATK',dir:'Up',val:25,valueMeaning:{kind:'newUnresolvedMeaning'},
    }]})
    expect(codes(auditBuilderContent(roster,{locales:['en'],resolve}))).toContain('unknown-value-meaning')
    const presentSkill=()=>({displayEffects:[{target:'',effect:''}]})
    expect(codes(auditBuilderContent(roster,{locales:['fr'],presentSkill}))).toContain('localization-gap')
  })

  it('flags a new skill type for review while its fallback remains readable',()=>{
    const roster=imported(null,'Self','ATK Up 25%',{type:'Future Type'})
    const result=auditBuilderContent(roster,{locales:['en']})
    expect(codes(result)).toContain('unknown-skill-type')
    expect(codes(result)).not.toContain('unsafe-skill-visual')
  })
})
