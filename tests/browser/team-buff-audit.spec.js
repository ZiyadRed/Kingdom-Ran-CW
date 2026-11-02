import {test,expect,instrumentStorage,settle} from './fixtures.js'
import {CATALOGS} from '../../src/i18n/i18n.js'
import {localizedTeamName} from '../../src/i18n/team-names.js'

const mask={n:3,s6:true,role:false}
const state=(attack,defense=[])=>({
  version:1,attack:[...attack,...Array(4-attack.length).fill(null)],defense:[...defense,...Array(4-defense.length).fill(null)],
  attackSkills:Array.from({length:4},()=>({...mask})),defenseSkills:Array.from({length:4},()=>({...mask})),
})
const presets=[
  ['Riboku Vanguard',['shunsuiju','houken','bananji','riboku']],
  ['Qin Bow Command',['shouheikun','sougen','soujin','soutan']],
  ['Wei v2',['tairoji','ranbihaku','reiou','gohoumei']],
  ['Kanmei Army',['kyoubou','kanmei','beiman','jinou']],
]
const viewports=[{width:1440,height:900},{width:390,height:844}]
async function openSummary(page){
  const toggle=page.locator('.builder-buff-toggle')
  if(await toggle.getAttribute('aria-expanded')==='false') await toggle.click()
  return page.locator('.buff-summary')
}

test('new presets preserve order on both sides and only explicitly ranked teams enter tiers',async({page,path,locale})=>{
  for(const viewport of viewports){
    await page.setViewportSize(viewport)
    await page.goto(path('/builder'))
    for(const [name,ids] of presets){
      const preset=page.locator(`.meta-card[data-team-preset="${name}"]`)
      const country=preset.locator('xpath=ancestor::details')
      if(!await country.evaluate(node=>node.open)) await country.locator('summary').click()
      await expect(preset.locator('.meta-name')).toHaveText(localizedTeamName(name,locale))
      expect(await preset.locator('[data-team-member]').evaluateAll(nodes=>nodes.map(node=>node.dataset.teamMember))).toEqual(ids)
      for(const side of ['attack','defense']){
        await preset.locator(side==='attack'?'.meta-atk':'.meta-def').click()
        expect(await page.locator(`.side-${side} [data-builder-character]`).evaluateAll(nodes=>nodes.map(node=>node.dataset.builderCharacter))).toEqual(ids)
      }
    }
    await page.goto(path('/tiers'))
    const section=tier=>page.locator('.mw-section').filter({has:page.locator('.mw-tier-badge',{hasText:new RegExp(`^${tier}$`)})})
    await expect(section('B').locator('[data-team-preset="Qin Bow Command"]')).toHaveCount(1)
    await expect(section('A').locator('[data-team-preset="Rigan"]')).toHaveCount(1)
    for(const name of ['Riboku Vanguard','Wei v2','Kanmei Army']) await expect(page.locator(`[data-team-preset="${name}"]`)).toHaveCount(0)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  }
})

test('Leader and Strategist switches are exclusive per role and persist across reload',async({page,path,locale})=>{
  await instrumentStorage(page,{'ranhq:party-builder':JSON.stringify(state(['kanmei','renpa','reiou','gohoumei'],['kanmei','renpa','reiou','gohoumei']))})
  for(const viewport of viewports){
    await page.setViewportSize(viewport)
    await page.goto(path('/builder'))
    await settle(page)
    await expect(page.locator('.side-attack .builder-role-note')).toHaveText(CATALOGS[locale].builder.roleLimit)
    const button=(id,role)=>page.locator(`.side-attack [data-builder-character="${id}"] .stog-role-${role}`)
    for(const [role,first,second] of [['leader','kanmei','renpa'],['strategist','reiou','gohoumei']]){
      await button(first,role).click()
      await expect(button(first,role)).toHaveAttribute('aria-pressed','true')
      await expect(button(second,role)).toHaveAttribute('aria-pressed','false')
      await button(second,role).click()
      await expect(button(first,role)).toHaveAttribute('aria-pressed','false')
      await expect(button(second,role)).toHaveAttribute('aria-pressed','true')
    }
    await expect(button('renpa','leader')).toHaveAttribute('aria-pressed','true')
    await page.reload()
    await expect(button('renpa','leader')).toHaveAttribute('aria-pressed','true')
    await expect(button('gohoumei','strategist')).toHaveAttribute('aria-pressed','true')
    await expect(page.locator('.side-defense .stog-role[aria-pressed="true"]')).toHaveCount(0)
  }
})

test('status-rate bonuses render, share, and retain every selected effect in the source reference',async({page,path,locale})=>{
  await instrumentStorage(page,{'ranhq:party-builder':JSON.stringify(state(['ryofui','hanoki','queen_biki','koreki']))})
  for(const viewport of viewports){
    await page.setViewportSize(viewport)
    await page.goto(path('/builder'))
    const summary=await openSummary(page)
    const betrayal=summary.locator('.scol.atk [data-buff-general="hanoki"] [data-buff-stat="Betrayal Infliction Rate"]')
    await expect(betrayal.locator('.buff-row')).toContainText('+60%')
    await betrayal.locator('.buff-row').click()
    await expect(betrayal.locator('.buff-source-contribution')).toHaveCount(3)
    await expect(summary.locator('[data-infliction-bonus-note]')).toHaveText(CATALOGS[locale].buffs.inflictionBonusHelp)
    const refs=summary.locator('.scol.atk .buff-effect-reference')
    await refs.locator('summary').click()
    await expect(refs.locator('[data-effect-owner]').first()).toBeVisible()
    const beforeCombat=await refs.locator('[data-effect-owner]').count()
    await summary.locator('input[type="checkbox"]').check()
    await expect.poll(()=>refs.locator('[data-effect-owner]').count()).toBeGreaterThan(beforeCombat)
    if(locale==='ja') expect((await refs.innerText()).replace(/\b(?:CW6|HP)\b/g,'')).not.toMatch(/[A-Za-z]/)
    await page.evaluate(()=>{
      Object.defineProperty(navigator,'share',{configurable:true,value:undefined})
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__statusRateShare=text}}})
    })
    await summary.locator('.share-btn').click()
    await expect(betrayal.locator('.buff-row')).toContainText('+95%')
    await expect.poll(()=>page.evaluate(()=>window.__statusRateShare)).toContain('+95%')
    const share=await page.evaluate(()=>window.__statusRateShare)
    if(locale==='ja') expect(share.replace(/https?:\/\/\S+/g,'').replace(/\b(?:RanHQ|CW6|Discord|HP|VS)\b/g,'')).not.toMatch(/[A-Za-z]/)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  }
})
