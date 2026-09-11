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
          expect(html).toContain(CATALOGS[code].buffs.summaryConditions)
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

  it('renders Makou\'s enemy-Archer effect as potential and removes it for a known non-Archer', () => {
    const makou=findCharById('makou')
    const shin=findCharById('shin')
    const hakurei=findCharById('hakurei')
    const karin=findCharById('karin')
    const qualifying=renderForLocale(<BuffTable atk={[makou,shin]} def={[hakurei]}/>,'en')
    const impossible=renderForLocale(<BuffTable atk={[makou,shin]} def={[karin]}/>,'en')
    expect(qualifying).toContain(CATALOGS.en.buffs.potential)
    expect(qualifying).toContain('When enemy [Archer] [General] is alive')
    expect(impossible).not.toContain('When enemy [Archer] [General] is alive')
  })
})
