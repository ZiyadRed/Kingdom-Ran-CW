import { readCharacters } from '../../scripts/seo/routes.mjs'
import { test, expect, instrumentStorage, saved, storage, settle } from './fixtures.js'

const characters = readCharacters()
const moubu = characters.find(character => character.id === 'moubu')
const renpa = characters.find(character => character.id === 'renpa')
const thumb = moubu.image.replace('/persos/', '/persos/thumbs/')
const portrait = page => page.locator('.detail-portrait')
async function expectDecoded(image) {
  await image.evaluate(element => element.decode())
  expect(await image.evaluate(element => element.naturalWidth)).toBeGreaterThan(0)
}
async function clientNavigate(page, url) {
  await page.evaluate(url => {
    history.pushState({}, '', url)
    dispatchEvent(new PopStateEvent('popstate'))
  }, url)
}

test('an icon that failed before hydration recovers to its existing thumbnail without replacing the page', async ({ page, path }) => {
  await instrumentStorage(page, saved)
  let releaseScripts, iconRequests = 0, thumbnailRequests = 0
  const scripts = new Promise(resolve => { releaseScripts = resolve })
  await page.route(/\/assets\/.*\.js$/, async route => { await scripts; await route.continue() })
  await page.route('**' + moubu.icon, route => { iconRequests++; return route.abort('failed') })
  page.on('request', request => { if (new URL(request.url()).pathname === thumb) thumbnailRequests++ })
  try {
    await page.goto(path('/archive/characters/moubu'), { waitUntil: 'commit' })
    await expect(portrait(page)).toBeVisible()
    await expect.poll(() => portrait(page).evaluate(image => image.complete && image.naturalWidth === 0)).toBe(true)
    expect(iconRequests).toBe(1)
    const originalBox = await portrait(page).boundingBox()
    const originalHeading = await page.locator('.detail-info h1').elementHandle()
    const name = await portrait(page).getAttribute('alt')
    releaseScripts()
    await expect(portrait(page)).toHaveAttribute('src', thumb)
    await expectDecoded(portrait(page))
    expect(await portrait(page).boundingBox()).toEqual(originalBox)
    expect(await page.evaluate(heading => heading === document.querySelector('.detail-info h1'), originalHeading)).toBe(true)
    await expect(portrait(page)).toHaveAccessibleName(name)
    await expect(portrait(page)).toHaveAttribute('fetchpriority', 'high')
    await settle(page)
    expect(iconRequests).toBe(1)
    expect(thumbnailRequests).toBe(1)
    expect(await storage(page)).toEqual(saved)
    expect(await page.evaluate(() => window.__storageWrites)).toEqual([])
  } finally { releaseScripts() }
})

test('two failed sources end at an accessible initial; changing character and remount reset recovery', async ({ page, path }) => {
  await instrumentStorage(page, saved)
  const attempts = []
  await page.goto(path('/archive/characters/renpa'))
  await expectDecoded(portrait(page))
  const box = await portrait(page).boundingBox()
  let block = true
  for (const source of [moubu.icon, thumb]) await page.route('**' + source, route => {
    attempts.push(source)
    return block ? route.abort('failed') : route.continue()
  })
  await clientNavigate(page, path('/archive/characters/moubu'))
  await expect(portrait(page)).toHaveAttribute('role', 'img')
  const name = await page.locator('.detail-info h1').textContent()
  await expect(portrait(page)).toHaveAccessibleName(name)
  await expect(portrait(page)).toHaveText(Array.from(name.trim())[0])
  expect(await portrait(page).boundingBox()).toEqual(box)
  const contrast = await portrait(page).evaluate(element => {
    const style = getComputedStyle(element)
    const rgb = value => value.match(/[\d.]+/g).map(Number)
    const foreground = rgb(style.color), base = rgb(style.backgroundColor)
    const tint = rgb(style.backgroundImage.match(/rgba?\([^)]+\)/)[0])
    const alpha = tint[3] ?? 1
    const background = base.slice(0, 3).map((channel, i) => tint[i] * alpha + channel * (1 - alpha))
    const luminance = channels => channels.slice(0, 3).map(channel => {
      const value = channel / 255
      return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4
    }).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0)
    return (luminance(background) + .05) / (luminance(foreground) + .05)
  })
  expect(contrast).toBeGreaterThanOrEqual(4.5)
  await expect(page.locator('.detail-portrait img')).toHaveCount(0)
  await settle(page)
  expect(attempts).toEqual([moubu.icon, thumb])
  // An ordinary dialog/state change must not restart a failed resource chain.
  await page.locator('.detail-panel .share-image-btn').focus()
  await page.keyboard.press('Tab')
  await settle(page)
  expect(attempts).toEqual([moubu.icon, thumb])
  await clientNavigate(page, path('/archive/characters/renpa'))
  await expect(portrait(page)).toHaveAttribute('src', renpa.icon)
  await expectDecoded(portrait(page))
  block = false
  await clientNavigate(page, path('/archive/characters/moubu'))
  await expect(portrait(page)).toHaveAttribute('src', moubu.icon)
  await expectDecoded(portrait(page))
  expect(attempts).toEqual([moubu.icon, thumb, moubu.icon])
  expect(await storage(page)).toEqual(saved)
})

test('shared Builder icons preserve round dimensions when their requests fail', async ({ page, path }) => {
  await instrumentStorage(page, saved)
  let block = false
  for (const source of [moubu.icon, thumb]) await page.route('**' + source, route => block ? route.abort('failed') : route.continue())
  await page.goto(path('/builder'))
  const slot = page.locator('[data-builder-slot="attack-0"]')
  await expect(slot.locator('img').first()).toHaveAttribute('src', moubu.icon)
  const original = await slot.locator('img').first().evaluate(image => {
    const rect = image.getBoundingClientRect()
    return { width: rect.width, height: rect.height, radius: getComputedStyle(image).borderRadius, name: image.alt }
  })
  block = true
  await page.reload()
  const fallback = slot.locator('[role=img]')
  await expect(fallback).toHaveAccessibleName(original.name)
  const recovered = await fallback.evaluate(image => {
    const rect = image.getBoundingClientRect()
    return { width: rect.width, height: rect.height, radius: getComputedStyle(image).borderRadius }
  })
  expect(recovered).toEqual({ width: original.width, height: original.height, radius: original.radius })
  expect(await storage(page)).toEqual(saved)
})
