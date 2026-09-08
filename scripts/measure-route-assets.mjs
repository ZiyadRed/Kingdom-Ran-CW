// Compare cold browser asset bodies using the same built server and viewport.
// This measures transfer scope, not field performance or compressed wire bytes.
import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { chromium } from 'playwright'

const output = process.argv[2]
if (!output) throw new Error('Pass an output JSON path')
const origin = process.env.RANHQ_MEASURE_ORIGIN || 'http://127.0.0.1:4190'
const browser = await chromium.launch()
const result = { browser: browser.version(), viewport: { width: 390, height: 844 }, samples: [] }
try {
  for (const route of ['/archive', '/archive/cw6-scene-cards', '/castle-points', '/buffs', '/', '/guide']) {
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext({ viewport: result.viewport })
      const page = await context.newPage()
      await page.route('**/_vercel/insights/**', request => request.fulfill({ status: 200, body: '' }))
      await page.goto(origin + route)
      await page.waitForLoadState('networkidle')
      const assets = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => ({
        path: new URL(entry.name).pathname, type: entry.initiatorType, bytes: entry.encodedBodySize,
      })))
      const images = assets.filter(asset => /\.(webp|png|jpg|svg)$/.test(asset.path))
      const js = assets.filter(asset => asset.path.endsWith('.js'))
      const jsGzip = js.reduce((sum, asset) => {
        const file = path.join('dist', asset.path)
        return sum + (fs.existsSync(file) ? gzipSync(fs.readFileSync(file)).length : 0)
      }, 0)
      result.samples.push({ route, run, imageRequests: images.length, imageBytes: images.reduce((sum, asset) => sum + asset.bytes, 0), jsRequests: js.length, jsBytes: js.reduce((sum, asset) => sum + asset.bytes, 0), jsGzip, assets })
      await context.close()
    }
    console.log(route, result.samples.at(-1).imageBytes, result.samples.at(-1).jsGzip)
  }
} finally {
  await browser.close()
}
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
