import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BuffTable, BuffSourceEvidence } from './pages.jsx'
import { calcCharBuffs, findCharById } from './core.jsx'
import { CATALOGS, getLocale, initI18n, LocaleProvider } from './i18n/index.js'

function renderForLocale(element, code) {
  const locale=getLocale(code)
  initI18n(locale)
  return renderToStaticMarkup(<LocaleProvider locale={locale}>{element}</LocaleProvider>)
}

const syntheticGeneral=(id,effects=[],unit_type='Infantry')=>({
  id,name_en:id,name_jp:`未来${id}`,country:'qin',unit_type,
  skills:effects.length?[{name_en:`${id} skill`,name_jp:`${id}技能`,type:'Strategy',effects}]:[],
})
const occurrences=(value,needle)=>value.split(needle).length-1

describe('real BuffTable formation summaries', () => {
  for(const code of ['en','ja','ar','fr']) {
    it(`${code}: excludes the wrong side at the UI call site`, () => {
      for(const [id,activeSide,value] of [['ousen','def',30],['duke_hyou','atk',20]]) {
        const general=findCharById(id)
        for(const side of ['atk','def']) {
          const html=renderForLocale(<BuffTable atk={side==='atk'?[general]:[]} def={side==='def'?[general]:[]}/>,code)
          if(side===activeSide) {
            expect(html).toContain('data-buff-stat="DEF Penetration"')
            expect(html).toContain(`+${value}%`)
          } else expect(html).not.toContain('data-buff-stat="DEF Penetration"')
          expect(html).toContain(CATALOGS[code].buffs.summaryCalculatedOnly)
          expect(html).not.toContain(CATALOGS[code].buffs.conditionalEffects)
          expect(html).not.toContain(CATALOGS[code].buffs.notCalculated)
        }
      }
    })
  }

  it('preserves original source references and exposes localized contribution evidence', () => {
    for(const [id,defense,condition] of [['ousen',true,'When Garrisoning'],['duke_hyou',false,'When Attacking']]) {
      const general=findCharById(id)
      const source=calcCharBuffs(general,[general],[],defense)['DEF Penetration'].sources[0]
      expect(source.effect.condition).toBe(condition)
      expect(general.skills).toContain(source.skill)
      expect(source.skill.effects).toContain(source.effect)
      const html=renderForLocale(<BuffSourceEvidence source={source}/>,'en')
      expect(html).toContain(condition)
      expect(html).toContain(source.effect.effect)
      expect(html).toContain(source.effect.target)
    }
  })

  it('renders Makou\'s enemy-Archer effect as a composition amount with survival detail', () => {
    const makou=findCharById('makou')
    const shin=findCharById('shin')
    const hakurei=findCharById('hakurei')
    const karin=findCharById('karin')
    const qualifying=renderForLocale(<BuffTable atk={[makou,shin]} def={[hakurei]}/>,'en')
    const impossible=renderForLocale(<BuffTable atk={[makou,shin]} def={[karin]}/>,'en')
    expect(qualifying).toContain(CATALOGS.en.buffs.calculatedFromFormation)
    expect(qualifying).toContain('data-buff-stat="Hit Rate"')
    expect(qualifying).not.toContain(CATALOGS.en.buffs.potential)
    expect(qualifying).toContain(CATALOGS.en.buffs.survivalCaveat)
    expect(qualifying).toContain('When enemy [Archer] [General] is alive')
    expect(impossible).not.toContain('When enemy [Archer] [General] is alive')
  })

  it('keeps an actual unsupported source fail-closed and out of the player table',()=>{
    const eiSei=findCharById('ei_sei')
    const karin=findCharById('karin')
    const result=calcCharBuffs(eiSei,[eiSei],[karin],false,false,true)
    expect(result.meta.unsupported.length).toBeGreaterThan(0)
    const html=renderForLocale(<BuffTable atk={[eiSei]} def={[karin]} initialIncludeCombat={true}/>,'en')
    expect(html).not.toContain(CATALOGS.en.buffs.unsupported)
    expect(html).not.toContain(CATALOGS.en.buffs.notCalculated)
    expect(html).not.toContain('buff-applicability-notice')
  })
})

describe('simplified Buff Summary presentation',()=>{
  const runtimeEffects=[
    {condition:'Own HP ≤ 50%',target:'Self',effect:'DEF Up 40%',duration:null},
    {condition:'Per own attack count',target:'Self',effect:'ATK Up 5% per attack, max 30%',duration:null},
    {condition:null,target:'Self',effect:'Illusion Infliction 20%',duration:null},
    {condition:'When blue moon rises',target:'Self',effect:'Max Morale Up 999%',duration:null},
  ]
  const matchupEffects=[
    {condition:'When enemy [Archer] is alive',target:'Self',effect:'ATK Up 25%',duration:null},
    {condition:'When enemy [Cavalry] is alive',target:'Self',effect:'DEF Up 20%',duration:null},
  ]

  for(const code of ['en','ja','ar','fr']){
    it(`${code}: keeps runtime and unsupported bookkeeping out of the calculated table`,()=>{
      const owner=syntheticGeneral('future_runtime',[
        {condition:null,target:'Self',effect:'ATK Up 30%',duration:null},
        ...runtimeEffects,
      ])
      const html=renderForLocale(<BuffTable atk={[owner]} def={[]}/>,code)
      expect(html).toContain('data-buff-stat="ATK"')
      expect(html).toContain('+30%')
      expect(html).not.toContain('data-buff-stat="DEF"')
      expect(html).not.toContain('data-buff-stat="Illusion Infliction Rate"')
      expect(html).not.toContain('data-buff-stat="Max Morale"')
      expect(html).not.toContain('buff-applicability-notice')
      expect(html).not.toContain(CATALOGS[code].buffs.conditionalEffects)
      expect(html).not.toContain(CATALOGS[code].buffs.notCalculated)
      expect(html).not.toContain(CATALOGS[code].buffs.potential)

      const runtimeOnly=renderForLocale(<BuffTable atk={[syntheticGeneral('runtime_only',runtimeEffects)]} def={[]}/>,code)
      expect(runtimeOnly).toContain(CATALOGS[code].noRelevantBuffs)
      expect(runtimeOnly).not.toContain('data-buff-stat=')
      expect(runtimeOnly).not.toContain('buff-applicability-notice')
    })

    it(`${code}: deduplicates missing-opponent guidance and removes it for known opponents`,()=>{
      const owner=syntheticGeneral('future_matchup',matchupEffects)
      const missing=renderForLocale(<BuffTable atk={[owner]} def={[]}/>,code)
      expect(occurrences(missing,'data-buff-opponent-notice')).toBe(1)
      expect(occurrences(missing,CATALOGS[code].buffs.opponentNotSelected)).toBe(1)
      expect(missing).not.toContain(CATALOGS[code].buffs.conditionalEffects)
      expect(missing).not.toContain(CATALOGS[code].buffs.notCalculated)

      const matching=renderForLocale(<BuffTable atk={[owner]} def={[syntheticGeneral('future_enemy',[],'Archer')]}/>,code)
      expect(matching).toContain('data-buff-stat="ATK"')
      expect(matching).toContain('+25%')
      expect(matching).not.toContain('data-buff-stat="DEF"')
      expect(matching).not.toContain('data-buff-opponent-notice')

      const nonmatching=renderForLocale(<BuffTable atk={[owner]} def={[syntheticGeneral('future_enemy',[],'Shield')]}/>,code)
      expect(nonmatching).not.toContain('data-buff-stat="ATK"')
      expect(nonmatching).not.toContain('data-buff-stat="DEF"')
      expect(nonmatching).not.toContain('data-buff-opponent-notice')
      expect(nonmatching).not.toContain(CATALOGS[code].buffs.notCalculated)
    })
  }
})
