import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { selectedRouteSource } from '../../src/route-modules.js'
import { test, expect, instrumentStorage, storage, settle, expectLocale, saved, progress, blankProgress, progressKey } from './fixtures.js'

test('saved Builder, Stats and progress hydrate the original server content without writes', async ({ page, path, locale }) => {
  await instrumentStorage(page, saved)
  for (const route of ['/builder', '/cw-stats', '/archive/cw6-scene-cards']) {
    for (const entry of ['direct', 'refresh']) {
      let releaseScripts
      const scripts = new Promise(resolve => { releaseScripts = resolve })
      const holdScript = async route => { await scripts; await route.continue() }
      await page.route(/\/assets\/.*\.js$/, holdScript)
      const response = entry === 'direct' ? await page.goto(path(route), { waitUntil: 'commit' }) : await page.reload({ waitUntil: 'commit' })
      expect(response.status()).toBe(200)
      expect(await response.text()).toContain('<div id="root"><')
      await expect(page.locator('main h1')).toBeVisible()
      const originalHeading = await page.locator('main h1').elementHandle()
      releaseScripts()
      await settle(page)
      if (route === '/builder') {
        await expect(page.locator('.builder-side-switch button').first()).toContainText('2/4')
        await expect(page.locator('.builder-side-switch button').nth(1)).toContainText('1/4')
      } else if (route === '/cw-stats') await expect(page.locator('.cwstats-team-total').first()).toContainText('346')
      else await expect(page.locator('.gallery-count')).toContainText(/1\/\d+/)
      await expectLocale(page, locale)
      expect(await page.evaluate(node => node === document.querySelector('main h1'), originalHeading)).toBe(true)
      expect(await storage(page)).toEqual(saved)
      expect(await page.evaluate(() => window.__storageWrites)).toEqual([])
      await page.unroute(/\/assets\/.*\.js$/, holdScript)
    }
  }
})

test('invalid backups make zero writes; legacy ownership, export and exact prior snapshot recover', async ({ page, path }) => {
  const prior = { ...progress, buffSources: { 'unit:Cavalry:HP:Bakukoshin:縛虎申:18.2:': true, 'unknown:9:shard': true } }
  const before = JSON.stringify(prior)
  await instrumentStorage(page, { [progressKey]: before })
  let input = ''
  page.on('dialog', dialog => dialog.accept(dialog.type() === 'prompt' ? input : undefined))
  await page.goto(path('/buffs'))
  await expect(page.locator('.buff-progress-panel')).toBeVisible()
  await settle(page)
  const toolbar = page.locator('.buff-progress-panel .progress-tools')
  const initialCount = await page.locator('.buff-progress-head p').innerText()
  async function importBackup(value) {
    input = JSON.stringify(value)
    const alert = page.waitForEvent('dialog', { predicate: dialog => dialog.type() === 'alert' })
    await toolbar.locator('button').nth(1).click()
    await alert
  }
  for (const invalid of [[], { unrelated: true }, { version: 99, progress: blankProgress }, { ...prior, sceneBuffStars: { bad: 7 } }, { ...prior, buffSources: { bad: 'true' } }]) {
    await importBackup(invalid)
    expect(await storage(page)).toEqual({ [progressKey]: before })
    await expect(page.locator('.buff-progress-head p')).toHaveText(initialCount)
    expect(await page.evaluate(() => window.__storageWrites)).toEqual([])
  }
  await importBackup({ version: 1, exportedAt: '2026-09-06T12:00:00.000Z', progress: blankProgress })
  await expect.poll(() => storage(page)).toMatchObject({ [progressKey]: JSON.stringify(blankProgress) })
  expect(JSON.parse((await storage(page))[progressKey + ':before-import']).raw).toBe(before)
  await toolbar.locator('button').nth(2).click()
  const restored = { ...prior, buffSources: { buff_a3734d62c7434ef898229b2e4548c760: true, 'unknown:9:shard': true } }
  await expect.poll(async () => JSON.parse((await storage(page))[progressKey])).toEqual(restored)
  await expect(page.locator('.buff-progress-head p')).toHaveText(initialCount)
  await page.reload()
  await expect(page.locator('.buff-progress-head p')).toHaveText(initialCount)
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__backupExport = value } } }))
  await toolbar.locator('button').first().click()
  const exported = await page.evaluate(() => JSON.parse(window.__backupExport))
  expect(exported.version).toBe(1)
  expect(exported.progress).toEqual(restored)
  await importBackup(exported)
  expect(JSON.parse((await storage(page))[progressKey])).toEqual(restored)
})

test('CW6 keyboard controls are independent and the art dialog returns focus', async ({ page, path }) => {
  await page.goto(path('/archive/cw6-scene-cards'))
  const card = page.locator('.cw6-card').first()
  const owned = card.locator('.owned-toggle')
  const detail = card.locator('.cw6-card-detail')
  await expect(detail).toBeVisible()
  await owned.focus()
  await page.keyboard.press('Enter')
  await expect(owned).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.detail-panel')).toHaveCount(0)
  await page.keyboard.press('Space')
  await expect(owned).toHaveAttribute('aria-pressed', 'false')
  await detail.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.detail-panel')).toBeVisible()
  await page.locator('.detail-skills .owned-toggle').focus()
  await page.keyboard.press('Space')
  await expect(owned).toHaveAttribute('aria-pressed', 'true')
  await page.locator('.detail-close').click()
  const art = card.locator('.cw6-card-art button[aria-label]')
  await art.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('.detail-panel')).toHaveCount(0)
  expect(await page.getByRole('dialog').evaluate(node => node.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(art).toBeFocused()
  await page.reload()
  await expect(owned).toHaveAttribute('aria-pressed', 'true')
})

test('localized search finds effects and stable IDs; the picker traps focus and returns it', async ({ page, path, locale }) => {
  const effect = { en: 'Poison', ja: '毒', ar: 'سم', fr: 'Poison' }[locale]
  await page.goto(path('/archive/characters'))
  await expectLocale(page, locale)
  const search = page.locator('input[type="search"]:visible').first()
  await search.fill(effect)
  await expect(page.locator('.banner-card').first()).toBeVisible()
  for (const name of ['Moubu', '蒙武', 'موبو']) {
    await search.fill(name)
    await expect(page.locator('.banner-card[data-detail-id="moubu"]')).toBeVisible()
  }
  await search.fill('zzzz-unmatched-fixture')
  await expect(page.locator('.gallery-grid .search-empty')).toContainText('zzzz-unmatched-fixture')
  await page.locator('.mobile-search-clear:visible, .fac-search-wrap .search-clear:visible').click()
  await expect(search).toHaveValue('')
  await page.goto(path('/builder'))
  const trigger = page.locator('.side-attack .slot-empty').first()
  await trigger.click()
  const dialog = page.getByRole('dialog')
  const input = dialog.locator('.picker-search')
  await expect(input).toBeFocused()
  // Native modal inertness must exclude background content from the AX tree.
  const cdp = await page.context().newCDPSession(page)
  const { nodes } = await cdp.send('Accessibility.getFullAXTree')
  expect(nodes.filter(node => !node.ignored && node.role?.value === 'banner')).toEqual([])
  await cdp.detach()
  const first = dialog.locator('button').first()
  await first.focus()
  await page.keyboard.press('Shift+Tab')
  expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Tab')
  await expect(first).toBeFocused()
  await input.fill(effect)
  await expect(dialog.locator('.p-card').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await trigger.click()
  await input.fill('蒙武')
  await dialog.locator('.p-card').first().click()
  await expect.poll(async () => JSON.parse((await storage(page))['ranhq:party-builder']).attack[0]).toBe('moubu')
  await expect(page.locator('[data-builder-slot="attack-0"] button').first()).toBeFocused()
})

test('invalid deep links keep HTTP 404, localized noindex content and working recovery', async ({ page, path, locale }) => {
  const title = { en: 'Page not found', ja: 'ページが見つかりません', ar: 'الصفحة غير موجودة', fr: 'Page introuvable' }[locale]
  for (const [invalid, recovery] of [['/archive/characters/not-a-general', '/archive/characters'], ['/guide/not-a-section', '/guide']]) {
    for (const refresh of [false, true]) {
      const response = refresh ? await page.reload() : await page.goto(path(invalid))
      expect(response.status()).toBe(404)
      expect(await response.text()).toMatch(/name="robots" content="noindex,follow"/)
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow')
      await expectLocale(page, locale)
      await expect(page.locator('.gallery-grid, .guide-content')).toHaveCount(0)
    }
    await page.locator(`.not-found-actions a[href="${path(recovery)}"]`).click()
    await expect(page).toHaveURL(path(recovery))
    await expect(page.locator('.not-found-page')).toHaveCount(0)
    if (recovery === '/guide') await expect(page.locator('.guide-hub')).toBeVisible()
    else await expect(page.locator('.banner-card').first()).toBeVisible()
    // A client transition must agree with direct HTTP entry too.
    await page.evaluate(url => { history.pushState({}, '', url); dispatchEvent(new PopStateEvent('popstate')) }, path(invalid))
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  }
})

test('an observed failed route chunk leaves shell and Guide usable, then explicit reload recovers', async ({ page, path }) => {
  await instrumentStorage(page, saved)
  const manifest = JSON.parse(readFileSync(resolve(process.env.RANHQ_TEST_DIST || 'dist', '.vite/manifest.json'), 'utf8'))
  // Follow the build manifest instead of pinning a generated hash. This assertion
  // fails if the route boundary moves; update it to the new Archive owner then.
  const archiveChunk = manifest[selectedRouteSource('/archive')]?.file
  expect(archiveChunk, 'Archive route chunk exists').toBeTruthy()
  let blocked = true, intercepted = 0
  await page.route('**/' + archiveChunk, route => {
    if (!blocked) return route.continue()
    intercepted++
    return route.abort('failed')
  })
  await page.goto(path('/'))
  await page.locator('.home-primary').click()
  await expect(page.locator('.route-error')).toBeVisible()
  expect(intercepted).toBeGreaterThan(0)
  await expect(page.locator('#route-error-title')).toBeFocused()
  await expect(page.locator('.hdr')).toBeVisible()
  await expect(page.locator('.bottom-nav')).toBeVisible()
  expect(await storage(page)).toEqual(saved)
  await page.locator('.route-error a').click()
  await page.locator('.home-guide-copy a').click()
  await expect(page.locator('.guide-hub')).toBeVisible()
  await page.locator(`.guide-hub a[href="${path('/guide/basics')}"]`).click()
  await expect(page.locator('.guide-page')).toBeVisible()
  await page.locator('.logo').click()
  await page.locator('.home-primary').click()
  await expect(page.locator('.route-error')).toBeVisible()
  blocked = false
  await page.locator('.route-error button').click()
  await expect(page.locator('.archive-hub')).toBeVisible()
  await page.locator(`.archive-hub a[href="${path('/archive/characters')}"]`).click()
  await expect(page.locator('.gallery-grid')).toBeVisible()
  expect(await storage(page)).toEqual(saved)
})
