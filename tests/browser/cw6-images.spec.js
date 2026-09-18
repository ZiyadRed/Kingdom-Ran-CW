import { test, expect, settle, instrumentStorage, saved, storage } from './fixtures.js'

for (const width of [320, 390, 820, 1440]) test(`${width}px CW6 reveals visible artwork without changing cards or saved ownership`, async ({ page, path }) => {
  await page.setViewportSize({ width, height: 844 })
  await instrumentStorage(page, saved)
  await page.goto(path('/archive/cw6-scene-cards'))
  await settle(page)
  const cards = page.locator('.cw6-card')
  const last = cards.last()
  const lastArt = last.locator('.cw6-card-art > img')
  const lastOwner = last.locator('.cw6-card-owner-ico')
  await expect(lastArt).not.toHaveAttribute('src')
  await expect(lastOwner).not.toHaveAttribute('src')
  const before = await last.locator('.cw6-card-art').boundingBox()
  expect(before.width).toBeGreaterThan(50)
  expect(Math.abs(before.width - before.height)).toBeLessThan(1)
  const initialSources = await cards.locator('img[src]').count()
  expect(initialSources).toBeLessThan((await cards.count()) * 2)
  await last.scrollIntoViewIfNeeded()
  await expect(lastArt).toHaveAttribute('src', /.+/)
  await expect(lastOwner).toHaveAttribute('src', /.+/)
  await expect(lastArt).toHaveClass(/is-loaded/)
  await expect.poll(() => lastArt.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true)
  const after = await last.locator('.cw6-card-art').boundingBox()
  expect(after.width).toBe(before.width)
  expect(after.height).toBe(before.height)
  await last.locator('.cw6-card-detail').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.detail-panel')).toBeVisible()
  await expect.poll(() => page.locator('.detail-portrait').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true)
  if (width <= 768) {
    await expect(page.locator('.gallery-wrap')).toBeHidden()
    await expect(cards.locator('img[src]')).toHaveCount(0)
  }
  await page.locator('.detail-close').click()
  if (width <= 768) await expect(last.locator('.cw6-card-detail')).toBeFocused()
  await expect(lastArt).toHaveAttribute('src', /.+/)
  expect(await storage(page)).toEqual(saved)
})

test('CW6 selection is stable in the URL across reload and history', async ({ page, path, browser }) => {
  await page.goto(path('/archive/cw6-scene-cards'))
  const card = page.locator('.cw6-card').filter({ has: page.locator('[data-detail-id="42004"]') })
  await expect(card).toHaveCount(1)
  await card.locator('.cw6-card-detail').click()
  await expect(page).toHaveURL(/[?&]card=42004(?:&|$)/)
  await expect(page.locator('.detail-panel')).toBeVisible()

  const fresh = await browser.newPage()
  try {
    await fresh.goto(page.url())
    await expect(fresh.locator('.detail-panel')).toBeVisible()
  } finally {
    await fresh.close()
  }

  await page.reload()
  await expect(page).toHaveURL(/[?&]card=42004(?:&|$)/)
  await expect(page.locator('.detail-panel')).toBeVisible()

  await page.goBack()
  await expect(page).not.toHaveURL(/[?&]card=/)
  await expect(page.locator('.detail-panel')).toHaveCount(0)
  await page.goForward()
  await expect(page).toHaveURL(/[?&]card=42004(?:&|$)/)
  await expect(page.locator('.detail-panel')).toBeVisible()
})

test('CW6 unknown card links fall back to the collection safely', async ({ page, path }) => {
  for (const cardId of ['unknown-card', '']) {
    await page.goto(path(`/archive/cw6-scene-cards?card=${cardId}`))
    await expect(page.locator('.detail-panel')).toHaveCount(0)
    await expect(page).not.toHaveURL(/[?&]card=/)
    await expect(page.locator('.cw6-card').first()).toBeVisible()
  }
})

test('CW6 text sharing includes the selected card URL', async ({ page, path }) => {
  await page.addInitScript(() => {
    window.__cw6SharedText = ''
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async value => { window.__cw6SharedText = String(value) } },
    })
  })
  await page.goto(path('/archive/cw6-scene-cards?card=42004'))
  await expect(page.locator('.detail-panel')).toBeVisible()
  await page.locator('.detail-panel .share-btn:not(.share-image-btn)').click()
  await expect.poll(() => page.evaluate(() => window.__cw6SharedText)).toContain('/archive/cw6-scene-cards?card=42004')
})

test('CW6 gallery only shows a Japanese subtitle when it adds information', async ({ page, path, locale }) => {
  await page.goto(path('/archive/cw6-scene-cards'))
  const first = page.locator('.cw6-card').first()
  await expect(first.locator('.cw6-card-skill')).not.toBeEmpty()
  if (locale === 'ja') {
    await expect(first.locator('.cw6-card-jp')).toHaveCount(0)
  } else {
    await expect(first.locator('.cw6-card-jp')).toHaveCount(1)
    await expect(first.locator('.cw6-card-jp')).not.toHaveText(await first.locator('.cw6-card-skill').innerText())
  }
})
