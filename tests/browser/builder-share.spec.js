import { test, expect, instrumentStorage, settle } from './fixtures.js'
import { CATALOGS } from '../../src/i18n/i18n.js'
import { decodeBuilderShareSearch, encodeBuilderShareSearch } from '../../src/builder-share.js'

const defaultMask = { n: 3, s6: true, role: false }
const senderState = {
  version: 1,
  attack: ['shouheikun', 'renpa', 'shin', 'makou'],
  defense: ['rien', 'beiman', 'karin', 'shunshinkun'],
  attackSkills: [
    { n: 3, s6: true, role: true },
    { n: 3, s6: true, role: true },
    defaultMask,
    defaultMask,
  ],
  defenseSkills: [
    { n: 3, s6: true, role: true },
    { n: 3, s6: true, role: true },
    defaultMask,
    defaultMask,
  ],
}

const localRecipientUrl = (senderPage, sharedUrl) => {
  const shared = new URL(sharedUrl)
  return `${new URL(senderPage.url()).origin}${shared.pathname}${shared.search}`
}

async function expectRecipient(page, url, viewport, expectedStoredBuilder = null) {
  const errors = []
  await page.route('**/_vercel/insights/**', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }))
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.setViewportSize(viewport)
  await page.goto(url)
  await settle(page)

  await expect(page.locator('.slot-filled')).toHaveCount(8)
  for (const [side, ids] of [['attack', senderState.attack], ['defense', senderState.defense]]) {
    for (const [index, id] of ids.entries()) {
      await expect(page.locator(`[data-builder-slot="${side}-${index}"]`)).toHaveAttribute('data-builder-character', id)
    }
  }

  const first = page.locator('[data-builder-slot="attack-0"]')
  await expect(first.locator('.stog').nth(0)).toHaveAttribute('aria-pressed', 'true')
  await expect(first.locator('.stog').nth(2)).toHaveAttribute('aria-pressed', 'true')
  await expect(first.locator('.stog-role')).toHaveAttribute('aria-pressed', 'true')

  const disclosure = page.locator('.builder-buff-toggle')
  if (await disclosure.getAttribute('aria-expanded') === 'false') await disclosure.click()
  await expect(page.locator('.buff-summary input[type="checkbox"]')).toBeChecked()
  expect(await page.evaluate(() => localStorage.getItem('ranhq:party-builder'))).toBe(expectedStoredBuilder)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  expect(errors).toEqual([])
}

test('truncated Builder shares restore full plans in fresh desktop and mobile contexts', async ({ page, browser, path, locale }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await instrumentStorage(page, { 'ranhq:party-builder': JSON.stringify(senderState) })
  await page.goto(path('/builder'))
  await settle(page)
  const disclosure = page.locator('.builder-buff-toggle')
  if (await disclosure.getAttribute('aria-expanded') === 'false') await disclosure.click()
  const summary = page.locator('.buff-summary')
  await summary.locator('input[type="checkbox"]').check()
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__builderShare = text } } })
  })
  await summary.locator('.share-btn').click()
  const text = await expect.poll(() => page.evaluate(() => window.__builderShare)).toBeTruthy().then(() => page.evaluate(() => window.__builderShare))
  expect(text.length).toBeLessThanOrEqual(1900)
  if (locale === 'en') {
    expect(text).toContain(CATALOGS.en.shareOutput.truncated)
    expect(text).toContain(`${CATALOGS.en.shareOutput.fullDetails}:`)
  }

  const sharedUrl = text.match(/https:\/\/ranhq\.vercel\.app\/(?:ja\/|ar\/|fr\/)?builder\?[^>\s]+/)?.[0]
  expect(sharedUrl).toBeTruthy()
  const decoded = decodeBuilderShareSearch(new URL(sharedUrl).search)
  expect(decoded).toMatchObject({ status: 'valid', state: senderState, includeCombat: true })
  const recipientUrl = localRecipientUrl(page, sharedUrl)

  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const context = await browser.newContext()
    const recipient = await context.newPage()
    await expectRecipient(recipient, recipientUrl, viewport)
    await context.close()
  }

  const unrelatedSavedState = JSON.stringify({
    version: 1,
    attack: ['moubu', null, null, null],
    defense: [null, null, null, null],
    attackSkills: [defaultMask, defaultMask, defaultMask, defaultMask],
    defenseSkills: [defaultMask, defaultMask, defaultMask, defaultMask],
  })
  const existingContext = await browser.newContext()
  await existingContext.addInitScript(saved => localStorage.setItem('ranhq:party-builder', saved), unrelatedSavedState)
  const existingRecipient = await existingContext.newPage()
  await expectRecipient(existingRecipient, recipientUrl, { width: 1440, height: 900 }, unrelatedSavedState)
  await existingContext.close()

  const invalidContext = await browser.newContext()
  const invalidPage = await invalidContext.newPage()
  await invalidPage.goto(`${new URL(page.url()).origin}${path('/builder')}?plan=99`)
  await settle(invalidPage)
  await expect(invalidPage.getByRole('alert')).toHaveText(CATALOGS[locale].builder.sharedPlanInvalid)
  await expect(invalidPage.locator('.slot-filled')).toHaveCount(0)
  expect(await invalidPage.evaluate(() => localStorage.getItem('ranhq:party-builder'))).toBeNull()
  await invalidContext.close()

  const unknownState = { ...senderState, attack: ['not_a_real_general', ...senderState.attack.slice(1)] }
  const unknownContext = await browser.newContext()
  const unknownPage = await unknownContext.newPage()
  await unknownPage.goto(`${new URL(page.url()).origin}${path('/builder')}${encodeBuilderShareSearch(unknownState)}`)
  await settle(unknownPage)
  await expect(unknownPage.getByRole('alert')).toHaveText(CATALOGS[locale].builder.sharedPlanInvalid)
  await expect(unknownPage.locator('[data-builder-slot="attack-0"]')).not.toHaveAttribute('data-builder-character')
  await unknownContext.close()
})
