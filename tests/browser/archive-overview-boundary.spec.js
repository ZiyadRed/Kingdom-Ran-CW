import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { routePreloads } from '../../scripts/route-preloads.mjs'
import { test, expect, settle } from './fixtures.js'

test('Archive overview loads without the character tools graph and opens both collections', async ({ page, path }) => {
  const manifest = JSON.parse(readFileSync(resolve(process.env.RANHQ_TEST_DIST || 'dist', '.vite/manifest.json'), 'utf8'))
  const overviewGraph = routePreloads(manifest, '/archive').scripts
  const heavyFiles = Object.values(manifest).filter(chunk => ['core', 'data', 'pages'].includes(chunk.name)).map(chunk => '/' + chunk.file)
  expect(heavyFiles.length).toBeGreaterThan(0)
  expect(overviewGraph.filter(file => heavyFiles.includes(file))).toEqual([])
  const requested = []
  page.on('request', request => requested.push(new URL(request.url()).pathname))
  await page.goto(path('/archive'))
  await settle(page)
  await expect(page.locator('.archive-hub')).toBeVisible()
  expect(requested.filter(file => heavyFiles.includes(file))).toEqual([])
  await page.locator('.reference-hub-card').first().click()
  await expect(page.locator('.gallery-grid')).toBeVisible()
  await page.goBack()
  await expect(page.locator('.archive-hub')).toBeVisible()
  await page.locator('.reference-hub-card').nth(1).click()
  await expect(page.locator('.cw6-card').first()).toBeVisible()
})
