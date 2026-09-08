import { test, expect, instrumentStorage, settle } from './fixtures.js'
import { CATALOGS } from '../../src/i18n/i18n.js'

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
    await expect(row.locator('.buff-source-condition')).not.toBeEmpty()
    if(locale==='en') await expect(row.locator('.buff-source-condition')).toHaveText(value===30?'When Garrisoning':'When Attacking')
  }
  await expect(summary.locator('.buff-summary-note')).toHaveText(CATALOGS[locale].buffs.summaryConditions)
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
  const ousenAttack=attacking.split('\n').find(line=>line.startsWith('- Ousen:'))
  const dukeDefense=defending.split('\n').find(line=>line.startsWith('- Duke Hyou:'))
  // A general with no active strategy buffs has no summary line; the team
  // roster still identifies him. Absence is the correct wrong-side outcome.
  expect(attacking).toContain('1. Ousen')
  expect(defending).toContain('2. Duke Hyou')
  const stat=await penetration(defense,'ousen').locator('.buff-stat-name').textContent()
  expect(ousenAttack || '').not.toContain(stat)
  expect(dukeDefense || '').not.toContain(stat)
  expect(attacking).toContain(`${stat} +20%`)
  expect(defending).toContain(`${stat} +30%`)
})
