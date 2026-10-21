import {test,expect,settle} from './fixtures.js'

for(const width of [390,1440]){
  test(`Batei CW6 stays gated and renders after its data date at ${width}`,async({page,path,locale})=>{
    await page.setViewportSize({width,height:844})
    await page.clock.setFixedTime(new Date(1792573140000))
    await page.goto(path('/archive/cw6-scene-cards'))
    await settle(page)
    await expect(page.locator('[data-detail-id="42003"]')).toHaveCount(0)
    await page.goto(path('/archive/characters/batei'))
    await settle(page)
    await expect(page.locator('.detail-skills .t-star')).toHaveCount(0)
    await page.clock.setFixedTime(new Date(1792573200000))
    await page.goto(path('/archive/cw6-scene-cards?card=42003'))
    await settle(page)
    await expect(page.locator('.detail-panel')).toBeVisible()
    await expect(page.locator('.detail-panel')).toContainText(locale==='ja'?'離眼の豪力':'Rigan’s Mighty Strength')
    const art=page.locator('.detail-portrait')
    await expect.poll(()=>art.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true)
    if(locale!=='en') await expect(page.locator('.detail-skills')).not.toContainText(/When ally Kisui and Ryuuto are alive|HP Recovery Rate Up 50%/)
    if(locale==='en') await expect(page.locator('.detail-skills')).toContainText('HP Recovery Rate Up 50%')
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
}
