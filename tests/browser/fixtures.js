import { test as base, expect } from '@playwright/test'

export const progressKey = 'ranhq-progress-v3'
export const blankProgress = { cw6Cards: {}, sceneBuffCards: {}, sceneBuffStars: {}, buffSources: {} }
export const progress = { ...blankProgress, cw6Cards: { '40172': true } }
const defaultMask = { n: 3, s6: true, role: false }
export const builder = {
  version: 1, attack: ['moubu', 'renpa', null, null], defense: ['kyou', null, null, null],
  attackSkills: [{ n: 2, s6: true, role: false }, { n: 3, s6: true, role: true }, defaultMask, defaultMask],
  defenseSkills: [{ n: 1, s6: false, role: false }, defaultMask, defaultMask, defaultMask],
}
export const stats = {
  version: 1,
  characters: { moubu: { hp: '1000', atkMin: '100', atkMax: '200', def: '50', buffs: { hp: '', atk: '', def: '' }, buffChanges: { hp: '', atk: '', def: '' }, baseBuffs: { hp: '', atk: '', def: '' } } },
  teams: [['moubu', null, null, null]],
}
export const saved = {
  'ranhq:party-builder': JSON.stringify(builder),
  'ranhq-cw-stats-v1': JSON.stringify(stats),
  [progressKey]: JSON.stringify(progress),
}

export const test = base.extend({
  // Playwright requires destructuring even when this fixture has no dependencies.
  // eslint-disable-next-line no-empty-pattern
  locale: async ({}, use, testInfo) => use(testInfo.project.name),
  path: async ({ locale }, use) => use(route => (locale === 'en' ? '' : '/' + locale) + route),
  // Keep all pages free of uncaught errors. Expected failed HTTP requests in the
  // chunk test are not page errors; no global allow-list can hide hydration bugs.
  page: async ({ page }, use) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error' && /hydrat|React error #(418|421|423|425)/i.test(message.text())) errors.push(message.text())
    })
    // Acceptance is local and does not send test visits to Vercel Analytics.
    await page.route('**/_vercel/insights/**', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }))
    await use(page)
    expect(errors, 'uncaught or hydration errors').toEqual([])
  },
})
export { expect }

export async function instrumentStorage(page, seeds = {}) {
  await page.addInitScript(seeds => {
    // Seed once per context, never overwrite values on reload or locale changes.
    if (!sessionStorage.getItem('ranhq-test-seeded')) {
      for (const [key, value] of Object.entries(seeds)) localStorage.setItem(key, value)
      sessionStorage.setItem('ranhq-test-seeded', '1')
    }
    window.__storageWrites = []
    for (const method of ['setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method]
      Storage.prototype[method] = function (...args) {
        if (this === localStorage) window.__storageWrites.push({ method, args })
        return original.apply(this, args)
      }
    }
  }, seeds)
}

export async function storage(page) {
  return page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
}

export async function settle(page) {
  // Bounded quiet window catches delayed effects; assert actual UI readiness too.
  await page.waitForLoadState('networkidle')
}

export async function expectLocale(page, locale) {
  await expect(page.locator('html')).toHaveAttribute('lang', locale)
  await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
  await expect(page.getByRole('main')).toHaveCount(1)
  await expect(page.locator('header.hdr')).toHaveCount(1)
  if(page.viewportSize().width<=768&&await page.locator('.archive-layout.has-selection .detail-panel').count()){
    await expect(page.locator('header.hdr')).toBeHidden()
    await expect(page.getByRole('banner')).toHaveCount(0)
  }else await expect(page.getByRole('banner')).toHaveCount(1)
}
