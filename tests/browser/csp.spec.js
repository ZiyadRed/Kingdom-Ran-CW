import { readFileSync } from 'node:fs'
import { test, expect, settle, instrumentStorage, saved } from './fixtures.js'

const headers = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url))).headers
const policy = headers.find(rule => rule.source === '/(.*)').headers
  .find(header => header.key === 'Content-Security-Policy-Report-Only').value

async function observePolicy(page) {
  await page.addInitScript(() => {
    window.__cspViolations = []
    document.addEventListener('securitypolicyviolation', event => {
      window.__cspViolations.push({
        directive: event.effectiveDirective, blocked: event.blockedURI,
        disposition: event.disposition,
      })
    })
  })
}

async function expectQuietPolicy(page) {
  await settle(page)
  expect(await page.evaluate(() => window.__cspViolations)).toEqual([])
}

async function useLocalPreview(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true,
      value: { write: () => Promise.reject(new Error('Use the local preview')) } })
  })
}

test('CSP reports no violations for fonts, structured data, route chunks and share blobs', async ({ page, path }) => {
  const fontResponses = []
  page.on('response', response => {
    if (new URL(response.url()).origin === 'https://fonts.gstatic.com') {
      fontResponses.push({ url: response.url(), status: response.status() })
    }
  })
  await observePolicy(page)
  await instrumentStorage(page, saved)
  await useLocalPreview(page)
  // Exercise the installed SDK's actual same-origin script URL and a same-origin
  // beacon contract. This shim never contacts Vercel or claims remote acceptance.
  let scriptRequests = 0, beaconRequests = 0
  await page.route('**/_vercel/insights/**', route => {
    if (route.request().url().endsWith('/script.js')) {
      scriptRequests++
      return route.fulfill({ contentType: 'text/javascript', body:
        "fetch('/_vercel/insights/view', {method:'POST', body:'local CSP check'})" })
    }
    beaconRequests++
    return route.fulfill({ status: 204, body: '' })
  })
  const response = await page.goto(path('/'))
  expect(response.headers()['content-security-policy-report-only']).toBe(policy)
  expect(response.headers()['content-security-policy']).toBeUndefined()
  await expectQuietPolicy(page)
  expect(scriptRequests).toBe(1)
  expect(beaconRequests).toBe(1)
  // Actual Google Fonts are used by the app. A downloaded font, not just a CSS
  // declaration, proves the font directive was exercised on this browser run.
  await page.evaluate(() => document.fonts.ready)
  expect(fontResponses.some(response => response.status === 200)).toBe(true)
  expect(await page.evaluate(() => [...document.fonts].some(font => font.status === 'loaded'))).toBe(true)

  // Click real links across lazy routes, retaining a single CSP document.
  await page.locator(`main a[href="${path('/guide/basics')}"]`).first().click()
  await expect(page).toHaveURL(new RegExp(path('/guide/basics') + '$'))
  await expect(page.locator('.guide-page')).toBeVisible()
  // Text locators ignore script data; inspect the actual JSON-LD textContent.
  await expect.poll(() => page.locator('#ranhq-schema').textContent()).toContain('guide/basics')
  await expectQuietPolicy(page)
  const schema = await page.locator('#ranhq-schema').textContent()
  expect(JSON.parse(schema)['@graph'].length).toBeGreaterThan(0)

  const previewAndDownload = async trigger => {
    await trigger.click()
    const preview = page.locator('dialog:modal .share-preview-img-wrap img')
    await expect(preview).toBeVisible()
    await expect(preview).toHaveAttribute('src', /^blob:/)
    await preview.evaluate(image => image.decode())
    expect(await preview.getAttribute('alt')).toBeTruthy()
    const downloadPromise = page.waitForEvent('download')
    await page.locator('dialog:modal .share-preview-actions button').last().click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.png$/)
    expect(await download.failure()).toBeNull()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
    await expectQuietPolicy(page)
  }
  await page.goto(path('/archive/characters/moubu'))
  await expectQuietPolicy(page)
  expect(await page.locator('.detail-panel img').first().evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true)
  await previewAndDownload(page.locator('.detail-panel .share-image-btn'))
  await page.goto(path('/builder'))
  await expect(page.locator('.side-attack .slot-filled')).toHaveCount(2)
  expect(await page.locator('main [style]').count()).toBeGreaterThan(0)
  await previewAndDownload(page.locator('.side-attack .team-share-btn'))
})

test('CSP reports an untrusted script and inline execution without enforcing either', async ({ page, path }) => {
  await observePolicy(page)
  await page.goto(path('/'))
  await expectQuietPolicy(page)
  let intercepted = 0
  await page.route('https://csp-probe.invalid/attempt.js', route => {
    intercepted++
    return route.fulfill({ contentType: 'text/javascript', body: 'window.__externalCspProbe = true' })
  })
  await page.evaluate(() => {
    const inline = document.createElement('script')
    inline.textContent = 'window.__inlineCspProbe = true'
    document.body.append(inline)
    const external = document.createElement('script')
    external.src = 'https://csp-probe.invalid/attempt.js'
    document.body.append(external)
  })
  await expect.poll(() => page.evaluate(() => [window.__inlineCspProbe, window.__externalCspProbe])).toEqual([true, true])
  await expect.poll(() => page.evaluate(() => window.__cspViolations.length)).toBeGreaterThanOrEqual(2)
  const violations = await page.evaluate(() => window.__cspViolations)
  expect(violations).toEqual(expect.arrayContaining([
    { directive: 'script-src-elem', blocked: 'inline', disposition: 'report' },
    { directive: 'script-src-elem', blocked: 'https://csp-probe.invalid/attempt.js', disposition: 'report' },
  ]))
  expect(intercepted).toBe(1)
})

test('CSP removal probes report real prerendered styles and share blobs while preserving rendering', async ({ page, path }) => {
  await observePolicy(page)
  await useLocalPreview(page)
  // Modify only this response's report-only policy, never the application config.
  const probePolicy = policy.replace(" 'unsafe-inline'", '').replace(' blob:', '')
  await page.route('**/*', async route => {
    if (!route.request().isNavigationRequest()) return route.fallback()
    const response = await route.fetch()
    return route.fulfill({ response, headers: {
      ...response.headers(), 'content-security-policy-report-only': probePolicy,
    } })
  })
  await page.goto(path('/archive/characters/moubu'))
  await expect.poll(() => page.evaluate(() => window.__cspViolations.some(v =>
    v.directive === 'style-src-attr' && v.blocked === 'inline' && v.disposition === 'report'))).toBe(true)
  await page.locator('.detail-panel .share-image-btn').click()
  const preview = page.locator('dialog:modal .share-preview-img-wrap img')
  await expect(preview).toBeVisible()
  await preview.evaluate(image => image.decode())
  expect(await preview.evaluate(image => image.naturalWidth)).toBeGreaterThan(0)
  await expect.poll(() => page.evaluate(() => window.__cspViolations.some(v =>
    v.directive === 'img-src' && v.blocked.startsWith('blob') && v.disposition === 'report'))).toBe(true)
})
