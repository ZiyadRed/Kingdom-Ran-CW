import { createServer } from 'vite'
import { readFileSync } from 'node:fs'
import { htmlOutputPath } from '../../scripts/seo/routes.mjs'
import { test, expect, instrumentStorage, storage, settle, expectLocale, saved, builder, progressKey, progress } from './fixtures.js'

const boundary = 1789290000000
const before = boundary - 60_000
const routes = ['/archive', '/archive/cw6-scene-cards', '/archive/characters/kisui', '/builder']
const documents = new Map()
const seeds = {
  ...saved,
  'ranhq:party-builder': JSON.stringify({ ...builder, attack: ['kisui', 'renpa', null, null] }),
  [progressKey]: JSON.stringify({ ...progress, cw6Cards: { ...progress.cw6Cards, '42004': true } }),
}

// Render authentic pre-release documents with the same source entry as the
// production prerender. Keep dist's actual hashed JS/CSS: this regression still
// exercises optimized hydration, and stays valid after September 13/rebuilds.
// Playwright requires destructuring even without fixture dependencies.
// eslint-disable-next-line no-empty-pattern
test.beforeAll(async ({}, testInfo) => {
  testInfo.setTimeout(120_000)
  const vite = await createServer({ appType: 'custom', logLevel: 'error', server: { middlewareMode: true } })
  try {
    const snapshot = await vite.ssrLoadModule('/src/release-snapshot.js')
    snapshot.setDocumentReleaseSnapshot(before)
    const { render } = await vite.ssrLoadModule('/src/entry-server.jsx')
    const prefix = testInfo.project.name === 'en' ? '' : '/' + testInfo.project.name
    for (const route of routes) {
      const path = prefix + route
      const original = readFileSync(htmlOutputPath('dist', path), 'utf8')
      expect(original).toMatch(/data-ranhq-release-time="\d+"/)
      const html = (await render(path))
      const document = original
        .replace(/data-ranhq-release-time="\d+"/, `data-ranhq-release-time="${before}"`)
        .replace(/<div id="root">[\s\S]*<\/div>(\s*<\/body>)/, (_match, end) => `<div id="root">${html}</div>${end}`)
      expect(document).toContain(`<div id="root">${html}</div>`)
      documents.set(path, document)
    }
  } finally { await vite.close() }
})

async function loadSnapshot(page, url) {
  await page.route(url, route => route.fulfill({ status: 200, contentType: 'text/html', body: documents.get(url) }))
  let release
  const scripts = new Promise(resolve => { release = resolve })
  const hold = async route => { await scripts; await route.continue() }
  await page.route(/\/assets\/.*\.js$/, hold)
  await page.goto(url, { waitUntil: 'commit' })
  await expect(page.locator('main h1')).toBeVisible()
  const heading = await page.locator('main h1').elementHandle()
  return { heading, release: async () => { release(); await settle(page); await page.unroute(/\/assets\/.*\.js$/, hold) } }
}

async function expectRelease(page, route, released) {
  if (route === '/archive') await expect(page.locator('.reference-hub-card').nth(1).locator('.reference-hub-count')).toHaveText(released ? '34' : '33')
  if (route === '/archive/cw6-scene-cards') {
    const card = page.locator('.cw6-card').filter({ has: page.locator('[data-detail-id="42004"]') })
    await expect(card).toHaveCount(released ? 1 : 0)
    if (released) await expect(card.locator('.owned-toggle')).toHaveAttribute('aria-pressed', 'true')
  }
  if (route === '/archive/characters/kisui') await expect(page.locator('.detail-skills .t-star')).toHaveCount(released ? 1 : 0)
}

for (const route of routes.slice(0, 3)) {
  test(`pre-release ${route} hydrates after the boundary without replacing SSR or saved state`, async ({ page, path, locale }) => {
    await instrumentStorage(page, seeds)
    await page.clock.setFixedTime(new Date(boundary + 1000))
    const snapshot = await loadSnapshot(page, path(route))
    await expectRelease(page, route, false)
    await snapshot.release()
    await expectRelease(page, route, true)
    await expectLocale(page, locale)
    expect(await page.evaluate(node => node === document.querySelector('main h1'), snapshot.heading)).toBe(true)
    expect(await storage(page)).toEqual(seeds)
    expect(await page.evaluate(() => window.__storageWrites)).toEqual([])
  })

  test(`open ${route} crosses the scheduled boundary without losing session state`, async ({ page, path }) => {
    await instrumentStorage(page, seeds)
    await page.clock.install({ time: new Date(before) })
    const snapshot = await loadSnapshot(page, path(route))
    await snapshot.release()
    await expectRelease(page, route, false)
    await page.clock.fastForward(61_000)
    await expectRelease(page, route, true)
    expect(await page.evaluate(node => node === document.querySelector('main h1'), snapshot.heading)).toBe(true)
    expect(await storage(page)).toEqual(seeds)
    expect(await page.evaluate(() => window.__storageWrites)).toEqual([])
  })
}

test('saved Kisui Builder slot receives the released skill without resetting its mask', async ({ page, path }) => {
  await instrumentStorage(page, seeds)
  await page.clock.install({ time: new Date(before) })
  const snapshot = await loadSnapshot(page, path('/builder'))
  await snapshot.release()
  const slot = page.locator('.slot-filled').first()
  await expect(slot).toBeVisible()
  await expect(slot.locator('img[src*="neon_cw6"]')).toHaveCount(0)
  await page.clock.fastForward(61_000)
  await expect(slot.locator('button').filter({ has: page.locator('img[src*="neon_cw6"]') })).toHaveAttribute('aria-pressed', 'true')
  expect(await storage(page)).toEqual(seeds)
  expect(await page.evaluate(() => window.__storageWrites)).toEqual([])
})
