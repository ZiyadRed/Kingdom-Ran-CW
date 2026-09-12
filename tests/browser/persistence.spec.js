import { test, expect, blankProgress, progressKey, settle } from './fixtures.js'

const card = (page, id) => page.locator('.cw6-card').filter({
  has: page.locator(`[data-detail-id="${id}"]`),
})

test('ownership edits reconcile across tabs without losing unrelated progress', async ({ page, context, path }) => {
  await page.goto(path('/archive/cw6-scene-cards'))
  await settle(page)
  const second = await context.newPage()
  const secondErrors = []
  second.on('pageerror', error => secondErrors.push(error.message))
  await second.goto(path('/archive/cw6-scene-cards'))
  await second.waitForLoadState('networkidle')

  const raido = card(page, '40172').locator('.owned-toggle')
  const raidoSecond = card(second, '40172').locator('.owned-toggle')
  const futei = card(second, '40186').locator('.owned-toggle')
  const futeiFirst = card(page, '40186').locator('.owned-toggle')

  await raido.click()
  await expect(raido).toHaveAttribute('aria-pressed', 'true')
  await expect(raidoSecond).toHaveAttribute('aria-pressed', 'true')

  await futei.click()
  await expect(futei).toHaveAttribute('aria-pressed', 'true')
  await expect(futeiFirst).toHaveAttribute('aria-pressed', 'true')

  const expected = { ...blankProgress, cw6Cards: { '40172': true, '40186': true } }
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual(expected)
  await page.reload()
  await expect(card(page, '40172').locator('.owned-toggle')).toHaveAttribute('aria-pressed', 'true')
  await expect(card(page, '40186').locator('.owned-toggle')).toHaveAttribute('aria-pressed', 'true')
  expect(secondErrors).toEqual([])
})

test('Stats reports a rejected browser-storage write', async ({ page, path }) => {
  await page.addInitScript(() => {
    const key = 'ranhq-cw-stats-v1'
    const blank = { hp: '1000', atkMin: '100', atkMax: '200', def: '50', buffs: { hp: '', atk: '', def: '' }, buffChanges: { hp: '', atk: '', def: '' }, baseBuffs: { hp: '', atk: '', def: '' } }
    localStorage.setItem(key, JSON.stringify({ version: 1, characters: { moubu: blank }, teams: [['moubu', null, null, null]] }))
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (storageKey, value) {
      if (this === localStorage && storageKey === key) throw new DOMException('Quota exceeded', 'QuotaExceededError')
      return original.call(this, storageKey, value)
    }
  })
  await page.goto(path('/cw-stats'))
  await settle(page)

  const note = page.locator('.cwstats-save-note')
  await expect(note).toHaveAttribute('data-save-status', 'idle')
  const originalNote = await note.innerText()
  await page.locator('.cwstats-roster-slot').first().click()
  await page.locator('.cwstats-stat-section input').first().fill('2000')

  await expect(note).toHaveAttribute('data-save-status', 'failed')
  await expect(note).not.toHaveText(originalNote)
})

test('ownership stays usable in-session and reports a rejected storage write', async ({ page, path }) => {
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (storageKey, value) {
      if (this === localStorage && storageKey === key) throw new DOMException('Quota exceeded', 'QuotaExceededError')
      return original.call(this, storageKey, value)
    }
  }, progressKey)
  await page.goto(path('/archive/cw6-scene-cards'))
  await settle(page)

  const owned = card(page, '40172').locator('.owned-toggle')
  const note = page.locator('.progress-tools-note')
  await expect(note).toHaveAttribute('data-save-status', 'idle')
  await owned.click()
  await expect(owned).toHaveAttribute('aria-pressed', 'true')
  await expect(note).toHaveAttribute('data-save-status', 'failed')
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull()

  await page.reload()
  await expect(card(page, '40172').locator('.owned-toggle')).toHaveAttribute('aria-pressed', 'false')
})
