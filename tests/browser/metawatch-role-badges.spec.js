import { test, expect } from './fixtures.js'

const labels = {
  en: { renpa: 'Renpa v3', shou: 'Shouheikun', role: 'Leader' },
  ja: { renpa: '廉頗 v3', shou: '昌平君編成', role: '総大将' },
  ar: { renpa: 'رينبا (نسخة 3)', shou: 'تشكيلة شوهيكون', role: 'قائد' },
  fr: { renpa: 'Renpa v3', shou: 'Compo Shouheikun', role: 'Leader' },
}

const overlap = (one, two) => (
  Math.max(0, Math.min(one.right, two.right) - Math.max(one.left, two.left)) > 0.5
  && Math.max(0, Math.min(one.bottom, two.bottom) - Math.max(one.top, two.top)) > 0.5
)

test('Metawatch renders new formations and compact structured role badges', async ({ page, path, locale }) => {
  const expected = labels[locale]
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    await page.setViewportSize({ width, height })
    await page.goto(path('/tiers'))
    await expect(page.locator('.mw-team').filter({ hasText: expected.renpa })).toBeVisible()
    await expect(page.locator('.mw-team').filter({ hasText: expected.shou })).toBeVisible()

    const renpa = page.locator('.mw-member').filter({ has: page.locator('img[src*="/icons/Renpa.webp"]') }).first()
    const gohoumei = page.locator('.mw-member').filter({ has: page.locator('img[src*="/icons/Gohoumei.webp"]') }).first()
    const rinko = page.locator('.mw-member').filter({ has: page.locator('img[src*="/icons/Rinko.webp"]') }).first()
    await expect(renpa.locator('.mw-role-badge[data-role-badge="Leader"]')).toHaveAttribute('aria-label', expected.role)
    await expect(renpa.locator('.mw-role-badge img[src*="royal_helmet_hex_badge"]')).toHaveCount(1)
    await expect(gohoumei.locator('.mw-role-badge[data-role-badge="Strategist"] img[src*="feather_fan_hex_badge"]')).toHaveCount(1)
    await expect(rinko.locator('.mw-role-badge')).toHaveCount(0)

    const geometry = await renpa.evaluate(member => {
      const box = element => {
        const rect = element.getBoundingClientRect()
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
      }
      return {
        member: box(member),
        role: box(member.querySelector('.mw-role-badge')),
        cw6: box(member.querySelector('[data-cw6-badge="true"]')),
      }
    })
    expect(overlap(geometry.role, geometry.cw6), `${locale} ${width}px role/CW6 overlap`).toBe(false)
    const gap = geometry.role.left < geometry.cw6.left
      ? geometry.cw6.left - geometry.role.right
      : geometry.role.left - geometry.cw6.right
    expect(gap, `${locale} ${width}px role/CW6 gap`).toBeGreaterThanOrEqual(0)
    expect(gap, `${locale} ${width}px role/CW6 adjacency`).toBeLessThanOrEqual(4)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    expect(await page.locator('.mw-role-badge img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true)
  }
})
