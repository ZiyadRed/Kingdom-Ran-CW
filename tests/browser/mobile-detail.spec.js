import {test,expect,settle,expectLocale} from './fixtures.js'

async function checkPhonePage(page,locale){
  await expectLocale(page,locale)
  const heading=page.locator('.detail-name')
  await expect(heading).toBeFocused()
  await expect(page.getByRole('heading',{level:1})).toHaveCount(1)
  for(const selector of ['.hdr','.foot','.bottom-nav','.archive-tabs','.gallery-wrap']) await expect(page.locator(selector)).toBeHidden()
  // Traverse forward and backward past every page control. Focus may leave
  // the document for browser chrome, but never enter a covered app control.
  for(const key of ['Tab','Shift+Tab']){
    await heading.focus()
    for(let i=0;i<18;i++){
      await page.keyboard.press(key)
      expect(await page.evaluate(()=>document.activeElement===document.body||Boolean(document.activeElement.closest('.detail-panel')))).toBe(true)
    }
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
}

for(const width of [320,390]) test(`${width}px detail pages hide covered controls and return focus`,async({page,path,locale})=>{
  await page.setViewportSize({width,height:844})
  await page.goto(path('/archive/characters'))
  await settle(page)
  const card=page.locator('.banner-card[data-detail-id="moubu"]')
  await card.focus()
  await page.keyboard.press('Enter')
  await checkPhonePage(page,locale)
  await page.locator('.detail-close').click()
  await expect(card).toBeFocused()
  await page.goBack()
  await checkPhonePage(page,locale)
  await page.goForward()
  await expect(card).toBeFocused()
  await page.goto(path('/archive/characters/moubu'))
  await checkPhonePage(page,locale)
  await page.locator('.detail-close').click()
  await expect(card).toBeFocused()
  await page.goto(path('/archive/cw6-scene-cards'))
  const scene=page.locator('.cw6-card-detail').first()
  await scene.focus()
  await page.keyboard.press('Enter')
  await checkPhonePage(page,locale)
  await page.locator('.detail-close').click()
  await expect(scene).toBeFocused()
})

for(const width of [820,1440]) test(`${width}px detail keeps desktop navigation and gallery actionable`,async({page,path,locale})=>{
  await page.setViewportSize({width,height:900})
  await page.goto(path('/archive/characters/moubu'))
  await settle(page)
  await expectLocale(page,locale)
  await expect(page.locator('.gallery-wrap')).toBeVisible()
  await expect(page.locator('.fac-search')).toBeVisible()
  await page.locator('.fac-search').focus()
  await expect(page.locator('.fac-search')).toBeFocused()
  await page.setViewportSize({width:390,height:844})
  await checkPhonePage(page,locale)
  await page.setViewportSize({width,height:900})
  await expect(page.locator('.hdr')).toBeVisible()
  await expect(page.locator('.gallery-wrap')).toBeVisible()
})
