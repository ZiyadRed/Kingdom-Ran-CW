import { GUIDE_SECTION_IDS } from '../../src/seo.js'
import { readCharacters } from '../../scripts/seo/routes.mjs'
import { test, expect, expectLocale, instrumentStorage, saved, storage, settle } from './fixtures.js'

async function staticPage(page, url) {
  const response = await page.request.get(url)
  expect(response.status()).toBe(200)
  return page.evaluate(html => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return {
      heading: doc.querySelector('main h1')?.textContent,
      text: doc.querySelector('main')?.textContent,
      links: [...doc.querySelectorAll('main a')].map(link => link.getAttribute('href')),
      title: doc.title,
      description: doc.querySelector('meta[name=description]')?.content,
      canonical: doc.querySelector('link[rel=canonical]')?.href,
      alternates: [...doc.querySelectorAll('link[rel=alternate]')].map(link => link.hreflang),
    }
  }, await response.text())
}

test('Archive overview and collections retain distinct crawlable pages and saved state', async ({ page, path, locale }) => {
  await instrumentStorage(page, saved)
  const hub = await staticPage(page, path('/archive'))
  const collection = await staticPage(page, path('/archive/characters'))
  expect(hub.heading).toBeTruthy()
  expect(hub.heading).not.toBe(collection.heading)
  expect(hub.title).not.toBe(collection.title)
  expect(hub.description).not.toBe(collection.description)
  expect(hub.links).toEqual(expect.arrayContaining([path('/archive/characters'), path('/archive/cw6-scene-cards')]))
  for (const [result, route] of [[hub, '/archive'], [collection, '/archive/characters']]) {
    expect(result.canonical).toBe('https://ranhq.vercel.app' + path(route))
    expect(result.alternates.sort()).toEqual(['ar', 'en', 'fr', 'ja', 'x-default'])
  }
  await page.goto(path('/archive'))
  await expectLocale(page, locale)
  await expect(page.locator('.archive-hub h1')).toHaveText(hub.heading)
  await expect(page.locator('.gallery-grid,.archive-tabs')).toHaveCount(0)
  const cards = page.locator('.archive-hub .reference-hub-card')
  await expect(cards).toHaveCount(2)
  await expect(cards.first().locator('.reference-hub-count')).toHaveText(String(readCharacters().length))
  const cardCount = Number(await cards.last().locator('.reference-hub-count').textContent())
  await cards.first().focus()
  await expect(cards.first()).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('.gallery-grid')).toBeVisible()
  await expect(page.locator('.archive-tabs [aria-current=page]')).toHaveAttribute('href', path('/archive/characters'))
  await page.goBack()
  await expect(page.locator('.archive-hub')).toBeVisible()
  await cards.last().click()
  await expect(page.locator('.cw6-card')).toHaveCount(cardCount)
  await expect(page.locator('.archive-tabs [aria-current=page]')).toHaveAttribute('href', path('/archive/cw6-scene-cards'))
  await page.goBack()
  await expect(page.locator('.archive-hub')).toBeVisible()
  await page.reload()
  await expect(page.locator('.archive-hub')).toBeVisible()
  await settle(page)
  expect(await storage(page)).toEqual(saved)
  expect(await page.evaluate(() => window.__storageWrites)).toEqual([])
})

test('Guide contents link every preserved article and return through its breadcrumb', async ({ page, path, locale }) => {
  const hub = await staticPage(page, path('/guide'))
  const basics = await staticPage(page, path('/guide/basics'))
  const articles = GUIDE_SECTION_IDS.map(section => path('/guide/' + section))
  expect(hub.heading).toBeTruthy()
  expect(hub.heading).not.toBe(basics.heading)
  expect(hub.title).not.toBe(basics.title)
  expect(hub.description).not.toBe(basics.description)
  expect(hub.links.filter(link => articles.includes(link)).sort()).toEqual([...articles].sort())
  expect(hub.text.length).toBeLessThan(basics.text.length)
  for (const [result, route] of [[hub, '/guide'], [basics, '/guide/basics']]) {
    expect(result.canonical).toBe('https://ranhq.vercel.app' + path(route))
    expect(result.alternates.sort()).toEqual(['ar', 'en', 'fr', 'ja', 'x-default'])
  }
  await page.goto(path('/guide'))
  await expectLocale(page, locale)
  await expect(page.locator('.guide-hub h1')).toHaveText(hub.heading)
  await expect(page.locator('.guide-page')).toHaveCount(0)
  for (const article of articles) {
    const link = page.locator(`.guide-hub a[href="${article}"]`)
    const label = await link.textContent()
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.guide-page h1')).toContainText(label)
    await expect(page.locator('.guide-section-tabs [aria-current=page]')).toHaveAttribute('href', article)
    await page.locator(`.guide-breadcrumbs a[href="${path('/guide')}"]`).click()
    await expect(page.locator('.guide-hub')).toBeVisible()
  }
})
