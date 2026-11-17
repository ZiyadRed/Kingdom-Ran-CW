import {test,expect,settle} from './fixtures.js'

for(const width of [390,1440]){
  test(`Ryuuto CW6 stays gated and renders after its data date at ${width}`,async({page,path,locale})=>{
    await page.setViewportSize({width,height:844})
    await page.clock.setFixedTime(new Date(1794995940000))
    await page.goto(path('/archive/cw6-scene-cards'))
    await settle(page)
    await expect(page.locator('[data-detail-id="42005"]')).toHaveCount(0)
    await page.goto(path('/archive/characters/ryuuto'))
    await settle(page)
    await expect(page.locator('.detail-skills .t-star')).toHaveCount(0)
    await page.clock.setFixedTime(new Date(1794996000000))
    await page.goto(path('/archive/cw6-scene-cards?card=42005'))
    await settle(page)
    await expect(page.locator('.detail-panel')).toBeVisible()
    await expect(page.locator('.detail-panel')).toContainText(locale==='ja'?'守り子の加護':'Guardian’s Blessing')
    const art=page.locator('.detail-portrait')
    await expect.poll(()=>art.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true)
    if(locale!=='en') await expect(page.locator('.detail-skills')).not.toContainText(/When ally Kisui and Batei are alive|Illusion Resistance 60%/)
    if(locale==='en') await expect(page.locator('.detail-skills')).toContainText('Illusion Resistance 60%')
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
}
