import fs from 'node:fs'
import { test, expect, expectLocale, instrumentStorage, saved, settle, storage } from './fixtures.js'

const audit = JSON.parse(fs.readFileSync('docs/character-integrity/banner-rework.json', 'utf8'))
const accepted = audit.characters.filter(entry => entry.outcome === 'ACCEPTED NEW BANNER')

async function expectTransparentBanner(image) {
  await image.evaluate(element => element.decode())
  const metrics = await image.evaluate(async element => {
    // naturalWidth is density-corrected for a srcset candidate. Decode the
    // fetched file itself so this checks the stored pixel dimensions and alpha.
    const bitmap = await createImageBitmap(await (await fetch(element.currentSrc)).blob())
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(bitmap, 0, 0)
    bitmap.close()
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
    let outer = 0
    let transparent = 0
    let opaqueDark = 0
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      if (x >= 4 && y >= 4 && x < canvas.width - 4 && y < canvas.height - 4) continue
      const offset = (y * canvas.width + x) * 4
      const red = data[offset], green = data[offset + 1], blue = data[offset + 2], alpha = data[offset + 3]
      outer++
      if (alpha < 16) transparent++
      if (alpha > 240 && Math.max(red, green, blue) < 32) opaqueDark++
    }
    return {
      width: canvas.width,
      height: canvas.height,
      transparentFraction: transparent / outer,
      opaqueDarkFraction: opaqueDark / outer,
    }
  })
  expect(metrics.width).toBe(313)
  expect(metrics.height).toBe(440)
  expect(metrics.transparentFraction).toBeGreaterThan(0.8)
  expect(metrics.opaqueDarkFraction).toBeLessThan(0.01)
}

test('accepted banners render with clean transparent edges in all target viewports', async ({ page, path, locale }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 820, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    for (const entry of accepted) {
      await page.goto(path(`/archive/characters/${entry.id}`))
      await expectLocale(page, locale)
      await expect(page.locator('.detail-info h1')).toBeVisible()
      await page.locator('.detail-close').click()
      const card = page.locator(`.banner-card[data-detail-id="${entry.id}"]`)
      await card.scrollIntoViewIfNeeded()
      const image = card.locator('img')
      await expect(image).toHaveAttribute('src', `/persos/thumbs/${entry.id}.webp`)
      await expectTransparentBanner(image)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
  }
})

test('new banners join the existing icon recovery while unresolved characters retain initials', async ({ page, path }) => {
  await instrumentStorage(page, saved)
  await page.route('**/icons/Yugi.webp', route => route.abort('failed'))
  await page.goto(path('/archive/characters/yugi'))
  const yugi = page.locator('.detail-portrait')
  await expect(yugi).toHaveAttribute('src', '/persos/thumbs/yugi.webp')
  await yugi.evaluate(element => element.decode())

  await page.route('**/icons/Hyou.webp', route => route.abort('failed'))
  await page.goto(path('/archive/characters/hyou'))
  const fallback = page.locator('.detail-portrait')
  const heading = await page.locator('.detail-info h1').textContent()
  await expect(fallback).toHaveAttribute('role', 'img')
  await expect(fallback).toHaveAccessibleName(heading)
  await settle(page)
  expect(await storage(page)).toEqual(saved)
  expect(await page.evaluate(() => window.__storageWrites)).toEqual([])
})

test('bannerless generals appear through search but not faction browsing', async ({ page, path, locale }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await page.goto(path('/archive/characters'))
    await expectLocale(page, locale)
    const hiddenCard = page.locator('.banner-card[data-detail-id="hyou"]')
    await expect(hiddenCard).toHaveCount(0)

    const search = page.locator('input[type="search"]:visible').first()
    await search.fill('Hyou')
    await expect(hiddenCard).toBeVisible()
    await page.locator('.mobile-search-clear:visible, .fac-search-wrap .search-clear:visible').click()
    await expect(search).toHaveValue('')
    await expect(hiddenCard).toHaveCount(0)
  }
})
