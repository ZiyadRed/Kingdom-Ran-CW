import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SkillCard } from './pages.jsx'
import { findCharById } from './core.jsx'
import { localizedCharacter } from './i18n/data.js'
import { getLocale, initI18n, LocaleProvider } from './i18n/index.js'

function renderForLocale(element, code) {
  const locale = getLocale(code)
  initI18n(locale)
  return renderToStaticMarkup(<LocaleProvider locale={locale}>{element}</LocaleProvider>)
}

const roleSkill = (id, code) => localizedCharacter(findCharById(id), code).roleSkill

describe('effect keywords on a skill card', () => {
  it('renders each keyword as a button described by the Guide copy, with no popup in the static HTML', () => {
    // Beiman's Strategist skill: Less Likely to be Targeted (self).
    const html = renderForLocale(<SkillCard skill={roleSkill('beiman', 'ja')}/>, 'ja')
    const button = html.match(/<span class="eff-val"><button type="button" class="eff-term eff-term-buff" aria-describedby="([^"]+)" data-effect-term="Less Likely to be Targeted">狙われにくい<\/button><\/span>/)
    expect(button).toBeTruthy()
    // One shared, hidden description per keyword, outside the effect text.
    const id = button[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    expect(html).toMatch(new RegExp(`<div hidden=""><span id="${id}">敵武将から狙われにくい状態：敵の通常攻撃・スキル攻撃の対象から除外されます。`))
    expect(html).not.toContain('eff-tip')
  })

  it('describes a keyword used twice on one card only once', () => {
    // Renpa's Leader skill names no status twice, so build a card that does.
    const skill = { ...roleSkill('renpa', 'en'), displayEffects: [
      { target: 'Self', effect: 'Guard 60%', sourceEffect: 'Guard 60%' },
      { target: 'Ally [Qin]', effect: 'Guard 100%, Sure Hit', sourceEffect: 'Guard 100%, Sure Hit' },
    ] }
    const html = renderForLocale(<SkillCard skill={skill}/>, 'en')
    const ids = [...html.matchAll(/data-effect-term="Guard"/g)].length
    expect(ids).toBe(2)
    expect([...html.matchAll(/<span id="[^"]+">Guard: /g)]).toHaveLength(1)
    expect([...html.matchAll(/<span id="[^"]+">Sure Hit: /g)]).toHaveLength(1)
  })

  it('leaves plain stat effects as text', () => {
    const html = renderForLocale(<SkillCard skill={roleSkill('beiman', 'ja')}/>, 'ja')
    expect(html).toContain('防御力20%上昇')
    expect(html).not.toContain('data-effect-term="DEF Penetration"')
  })

  it('shows the role icon on a Leader or Strategist skill tag', () => {
    const html = renderForLocale(<SkillCard skill={roleSkill('renpa', 'en')}/>, 'en')
    expect(html).toMatch(/class="sk-type-icon" src="\/icons\/royal_helmet_hex_badge\.webp\?v=[0-9a-f]{16}"/)
    expect(renderForLocale(<SkillCard skill={roleSkill('beiman', 'fr')}/>, 'fr')).toContain('/icons/feather_fan_hex_badge.webp')
  })

  it('explains statuses in English, Arabic and French too', () => {
    const renpa = { en: roleSkill('renpa', 'en'), ar: roleSkill('renpa', 'ar'), fr: roleSkill('renpa', 'fr') }
    expect(renderForLocale(<SkillCard skill={renpa.en}/>, 'en')).toMatch(/data-effect-term="Confusion">Confusion<\/button>/)
    expect(renderForLocale(<SkillCard skill={renpa.ar}/>, 'ar')).toMatch(/data-effect-term="Confusion">الارتباك<\/button>/)
    expect(renderForLocale(<SkillCard skill={renpa.fr}/>, 'fr')).toMatch(/data-effect-term="Confusion">confusion<\/button>/)
  })
})
