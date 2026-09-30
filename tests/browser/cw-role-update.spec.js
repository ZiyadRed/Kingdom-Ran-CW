import {test,expect,settle} from './fixtures.js'
import {encodeBuilderShareSearch} from '../../src/builder-share.js'

const roleMask={n:0,s6:false,role:true}
const offMask={n:0,s6:false,role:false}
const plan={version:1,attack:['kanki','kaioku','raido','toujouou'],defense:[null,null,null,null],attackSkills:[roleMask,roleMask,offMask,offMask],defenseSkills:[offMask,offMask,offMask,offMask]}

for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  test(`September 30 role skills, guide and icon at ${viewport.width}`,async({page,path,locale})=>{
    await page.setViewportSize(viewport)
    await page.goto(path('/guide/leaders'))
    await settle(page)
    for(const id of ['kanki','kaioku']) await expect(page.locator(`[data-role-owner="${id}"]`)).toBeVisible()
    await page.goto(path('/archive/characters/kanki'))
    await settle(page)
    await expect(page.locator('main')).toContainText(locale==='ja'?'狂気の心理戦':'Madness of Psychological Warfare')
    await page.goto(path('/archive/characters/kaioku'))
    await settle(page)
    await expect(page.locator('main')).toContainText(locale==='ja'?'有能な陪臣':'Capable Retainer')
    await page.goto(path('/builder')+encodeBuilderShareSearch(plan))
    await settle(page)
    await expect(page.locator('[data-builder-slot="attack-0"]')).toHaveAttribute('data-builder-character','kanki')
    await expect(page.locator('[data-builder-slot="attack-1"]')).toHaveAttribute('data-builder-character','kaioku')
    const icon=page.locator('[data-builder-slot="attack-3"] img[src*="/icons/Toujou.webp"]').first()
    await expect(icon).toBeVisible()
    await expect.poll(()=>icon.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true)
    const toggle=page.locator('.builder-buff-toggle')
    if(await toggle.getAttribute('aria-expanded')==='false') await toggle.click()
    await expect(page.locator('.buff-summary')).toBeVisible()
    const row=page.locator('.buff-row').filter({hasText:'+60%'}).first()
    await expect(row).toBeVisible()
    const roleToggle=page.locator('[data-builder-slot="attack-1"] .stog-role')
    await expect(roleToggle).toHaveAttribute('aria-pressed','true')
    await roleToggle.click()
    await expect(roleToggle).toHaveAttribute('aria-pressed','false')
    await expect(page.locator('.buff-row').filter({hasText:'+60%'})).toHaveCount(0)
    await roleToggle.click()
    await expect(row).toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
}
