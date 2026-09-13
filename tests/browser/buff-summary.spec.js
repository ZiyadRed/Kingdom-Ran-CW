import { test, expect, instrumentStorage, settle } from './fixtures.js'
import { CATALOGS } from '../../src/i18n/i18n.js'

test('buff, Guard alternative and enemy disclosures support keyboard activation', async ({ page, path }) => {
  const mask={n:3,s6:true,role:false}
  await instrumentStorage(page, {'ranhq:party-builder':JSON.stringify({
    version:1, attack:['ouhon','ousen','renpa',null], defense:['duke_hyou',null,null,null],
    attackSkills:[mask,mask,mask,mask], defenseSkills:[mask,mask,mask,mask],
  })})
  await page.goto(path('/builder'))
  await settle(page)
  const summaryToggle=page.locator('.builder-buff-toggle')
  if(await summaryToggle.getAttribute('aria-expanded')==='false') await summaryToggle.click()
  const summary=page.locator('.buff-summary')
  await summary.locator('input[type="checkbox"]').check()
  const attack=summary.locator('.scol.atk')
  const rows=[
    attack.locator('[data-buff-general="ouhon"] [data-buff-stat]:not([data-buff-stat="Guard"]) .buff-row').first(),
    attack.locator('[data-buff-general="ouhon"] [data-buff-stat="Guard"] .buff-row'),
    attack.locator('.scol-gen:not([data-buff-general]) .buff-row').first(),
  ]
  for(const row of rows){
    await expect(row).toHaveJSProperty('tagName','BUTTON')
    await row.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(row).toBeFocused()
    expect(await row.evaluate(node=>getComputedStyle(node).outlineStyle)).not.toBe('none')
    await expect(row).toHaveAttribute('aria-expanded','false')
    const id=await row.getAttribute('aria-controls')
    const sources=page.locator(`[id="${id}"]`)
    await expect(sources).toHaveCount(1)
    await expect(sources).toBeHidden()
    await page.keyboard.press('Enter')
    await expect(row).toHaveAttribute('aria-expanded','true')
    await expect(sources).toBeVisible()
    await expect(sources.locator('.buff-source-skill').first()).not.toBeEmpty()
    if(await row.locator('.buff-more').count()) expect(await sources.locator('.buff-source-contribution').count()).toBeGreaterThan(1)
    await page.keyboard.press('Space')
    await expect(row).toHaveAttribute('aria-expanded','false')
    await expect(sources).toBeHidden()
    await expect(row).toBeFocused()
  }
  // Renpa's Guard requires another living Renpa Army ally. This formation has
  // none, so use his single-source combat contribution for the final keyboard
  // disclosure check instead of asserting the inapplicable Guard row exists.
  const singleContribution=attack.locator('[data-buff-general="renpa"] [data-buff-stat="DEF Penetration"] .buff-row')
  await singleContribution.focus()
  await page.keyboard.press('Space')
  await expect(singleContribution).toHaveAttribute('aria-expanded','true')
})

test('formation summaries, contribution evidence and shared totals respect attack and defense', async ({ page, path, locale }) => {
  const mask={ n:3, s6:false, role:false }
  await instrumentStorage(page, { 'ranhq:party-builder': JSON.stringify({
    version:1,
    attack:['ousen','duke_hyou',null,null], defense:['ousen','duke_hyou',null,null],
    attackSkills:[mask,mask,mask,mask], defenseSkills:[mask,mask,mask,mask],
  }) })
  await page.goto(path('/builder'))
  await settle(page)
  await expect(page.locator('.builder-side-switch button').first()).toContainText('2/4')
  await expect(page.locator('.builder-side-switch button').nth(1)).toContainText('2/4')
  const disclosure=page.locator('.builder-buff-toggle')
  if(await disclosure.getAttribute('aria-expanded')==='false') await disclosure.click()
  await expect(disclosure).toHaveAttribute('aria-expanded','true')
  const summary=page.locator('.buff-summary')
  await expect(summary).toBeVisible()
  const attack=summary.locator('.scol.atk')
  const defense=summary.locator('.scol.def')
  const penetration=(side,id)=>side.locator(`[data-buff-general="${id}"] [data-buff-stat="DEF Penetration"]`)
  await expect(penetration(attack,'ousen')).toHaveCount(0)
  await expect(penetration(defense,'duke_hyou')).toHaveCount(0)
  await expect(penetration(defense,'ousen').locator('.buff-row')).toContainText('+30%')
  await expect(penetration(attack,'duke_hyou').locator('.buff-row')).toContainText('+20%')
  for(const [row,value] of [[penetration(defense,'ousen'),30],[penetration(attack,'duke_hyou'),20]]) {
    await row.locator('.buff-row').click()
    await expect(row.locator('.buff-source-row')).toContainText(`+${value}%`)
    await expect(row.locator('.buff-source-skill')).not.toBeEmpty()
    await expect(row.locator('.buff-source-condition').first()).not.toBeEmpty()
    if(locale==='en') await expect(row.locator('.buff-source-condition').first()).toHaveText(value===30?'When Garrisoning':'When Attacking')
  }
  await expect(summary.locator('.buff-summary-note').first()).toHaveText(CATALOGS[locale].buffs.summaryCalculatedOnly)
  await page.evaluate(() => {
    Object.defineProperty(navigator,'share',{ configurable:true,value:undefined })
    Object.defineProperty(navigator,'clipboard',{ configurable:true,value:{writeText:async text=>{window.__buffShare=text}} })
  })
  await summary.locator('.share-btn').click()
  await expect.poll(()=>page.evaluate(()=>window.__buffShare)).toContain(CATALOGS[locale].buffs.summaryConditions)
  const text=await page.evaluate(()=>window.__buffShare)
  const attacking=text.split(`**${CATALOGS[locale].buffs.attackingFormation}**`)[1].split(`**${CATALOGS[locale].buffs.defendingFormation}**`)[0]
  const defending=text.split(`**${CATALOGS[locale].buffs.defendingFormation}**`)[1]
  // The export uses the exact BuffTable arrays. Distinct penetration amounts
  // identify these two contributions even when their labels are localized.
  const ousenName=await attack.locator('[data-buff-general="ousen"] .scol-gen-hdr b').textContent()
  const dukeName=await defense.locator('[data-buff-general="duke_hyou"] .scol-gen-hdr b').textContent()
  const ousenAttack=attacking.split('\n').find(line=>line.startsWith(`- ${ousenName}:`))
  const dukeDefense=defending.split('\n').find(line=>line.startsWith(`- ${dukeName}:`))
  // A general with no active strategy buffs has no summary line; the team
  // roster still identifies him. Absence is the correct wrong-side outcome.
  expect(attacking).toContain(`1. ${ousenName}`)
  expect(defending).toContain(`2. ${dukeName}`)
  const stat=await penetration(defense,'ousen').locator('.buff-stat-name').textContent()
  expect(ousenAttack || '').not.toContain(stat)
  expect(dukeDefense || '').not.toContain(stat)
  expect(attacking).toContain(`${stat} +20%`)
  expect(defending).toContain(`${stat} +30%`)
})

test('survival-qualified formation values and missing-opponent disclosures stay distinct',async({page,path,locale})=>{
  const mask={n:3,s6:false,role:false}
  let seeded=false
  const open=async defense=>{
    const value=JSON.stringify({
      version:1,attack:['makou','shin',null,null],defense:[defense,null,null,null],
      attackSkills:[mask,mask,mask,mask],defenseSkills:[mask,mask,mask,mask],
    })
    if(!seeded){
      await instrumentStorage(page,{'ranhq:party-builder':value})
      seeded=true
    }else await page.evaluate(next=>localStorage.setItem('ranhq:party-builder',next),value)
    await page.goto(path('/builder'))
    await settle(page)
    const toggle=page.locator('.builder-buff-toggle')
    if(await toggle.getAttribute('aria-expanded')==='false') await toggle.click()
    return page.locator('.buff-summary')
  }
  const matched=await open('hakurei')
  const hit=matched.locator('.scol.atk [data-buff-general="shin"] [data-buff-stat="Hit Rate"]')
  await expect(hit.locator('.buff-row')).toContainText('+30%')
  await expect(hit.locator('.buff-row')).not.toContainText('Potential')
  await expect(matched.locator('[data-buff-opponent-notice]')).toHaveCount(0)
  await expect(matched.locator('.buff-applicability-notice')).toHaveCount(0)
  await hit.locator('.buff-row').click()
  await expect(hit.locator('.buff-source-evidence')).toContainText(CATALOGS[locale].buffs.survivalCaveat)

  const nonmatch=await open('karin')
  await expect(nonmatch.locator('.scol.atk [data-buff-general="shin"] [data-buff-stat="Hit Rate"]')).toHaveCount(0)
  await expect(nonmatch.locator('[data-buff-opponent-notice]')).toHaveCount(0)
  await expect(nonmatch.locator('.buff-applicability-notice')).toHaveCount(0)

  const missing=await open(null)
  await expect(missing.locator('.scol.atk [data-buff-general="shin"] [data-buff-stat="Hit Rate"]')).toHaveCount(0)
  await expect(missing.locator('[data-buff-opponent-notice]')).toHaveCount(1)
  await expect(missing.locator('[data-buff-opponent-notice]')).toHaveText(CATALOGS[locale].buffs.opponentNotSelected)
  await expect(missing.locator('.buff-applicability-notice')).toHaveCount(0)
  await expect(missing).not.toContainText(CATALOGS[locale].buffs.conditionalEffects)
  await expect(missing).not.toContainText(CATALOGS[locale].buffs.notCalculated)

  const manyMatchups=JSON.stringify({
    version:1,attack:['mangoku','makou','shin',null],defense:[null,null,null,null],
    attackSkills:[mask,mask,mask,mask],defenseSkills:[mask,mask,mask,mask],
  })
  await page.evaluate(next=>localStorage.setItem('ranhq:party-builder',next),manyMatchups)
  await page.goto(path('/builder'))
  await settle(page)
  const toggle=page.locator('.builder-buff-toggle')
  if(await toggle.getAttribute('aria-expanded')==='false') await toggle.click()
  const multiSummary=page.locator('.buff-summary')
  await expect(multiSummary.locator('[data-buff-opponent-notice]')).toHaveCount(1)
  await expect(multiSummary.locator('.buff-applicability-notice')).toHaveCount(0)
})
