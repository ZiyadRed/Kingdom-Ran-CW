import { test, expect, settle } from './fixtures.js'
import { encodeBuilderShareSearch } from '../../src/builder-share.js'
import { CATALOGS } from '../../src/i18n/i18n.js'

const mask = (role = false) => ({ n: 3, s6: true, role })
const sharedFormation = {
  version: 1,
  attack: ['shouheikun', 'renpa', 'shin', 'makou'],
  defense: ['rien', 'beiman', 'karin', 'shunshinkun'],
  attackSkills: [mask(true), mask(true), mask(), mask()],
  defenseSkills: [mask(true), mask(true), mask(), mask()],
}

test('shared role selections reconstruct the fixed turn-1 timeline in every locale', async ({ page, path, locale }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(`${path('/builder')}${encodeBuilderShareSearch(sharedFormation)}`)
  await settle(page)
  await page.getByRole('button', { name: CATALOGS[locale].builder.viewBattleOrder }).click()
  await expect(page).toHaveURL(/\/sim$/)

  const turnOne = page.locator('.turn').first()
  await expect(turnOne.locator('.te-role')).toHaveCount(4)
  const events = await turnOne.locator('.te').evaluateAll(rows => rows.map(row => ({
    kind: row.dataset.eventKind,
    side: row.classList.contains('te-attack') ? 'attack' : 'defense',
    role: row.dataset.role || null,
    name: row.querySelector('.te-name')?.textContent?.trim(),
    order: Number(row.dataset.order),
  })))
  expect(events.slice(0, 6)).toEqual([
    { kind: 'role', side: 'attack', role: 'Leader', name: locale === 'ja' ? '廉頗' : locale === 'ar' ? 'رينبا' : 'Renpa', order: 1 },
    { kind: 'role', side: 'attack', role: 'Strategist', name: locale === 'ja' ? '昌平君' : locale === 'ar' ? 'شوهيكون' : 'Shouheikun', order: 2 },
    { kind: 'character', side: 'attack', role: null, name: locale === 'ja' ? '昌平君' : locale === 'ar' ? 'شوهيكون' : 'Shouheikun', order: 3 },
    { kind: 'role', side: 'defense', role: 'Leader', name: locale === 'ja' ? '李園' : locale === 'ar' ? 'رين' : 'Rien', order: 4 },
    { kind: 'role', side: 'defense', role: 'Strategist', name: locale === 'ja' ? '貝満' : locale === 'ar' ? 'بيمان' : 'Beiman', order: 5 },
    { kind: 'character', side: 'defense', role: null, name: locale === 'ja' ? '李園' : locale === 'ar' ? 'رين' : 'Rien', order: 6 },
  ])
  expect(events.map(event => event.order)).toEqual(events.map((_, index) => index + 1))
  await expect(page.getByText(CATALOGS[locale].sim.openingRule)).toBeVisible()
  await expect(page.getByText(CATALOGS[locale].sim.roleConditional)).toBeVisible()
  await expect(page.getByText(CATALOGS[locale].sim.timelineLimit)).toBeVisible()
  await expect(page.locator('.turn').nth(1).locator('.te-role')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  if (locale === 'ar') expect(await page.locator('html').getAttribute('dir')).toBe('rtl')
  expect(errors).toEqual([])
})

test('desktop Battle Order keeps the same semantic sequence when role slots are reversed', async ({ page, path, locale }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${path('/builder')}${encodeBuilderShareSearch(sharedFormation)}`)
  await settle(page)
  await page.getByRole('button', { name: CATALOGS[locale].builder.viewBattleOrder }).click()
  await expect(page).toHaveURL(/\/sim$/)
  const roles = await page.locator('.turn').first().locator('.te-role').evaluateAll(rows =>
    rows.map(row => `${row.classList.contains('te-attack') ? 'attack' : 'defense'}:${row.dataset.role}`))
  expect(roles).toEqual(['attack:Leader', 'attack:Strategist', 'defense:Leader', 'defense:Strategist'])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})
