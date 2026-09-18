import { test, expect, settle } from './fixtures.js'

for (const id of ['eiki', 'pam']) {
  test(`${id} artwork uses a content-versioned URL`, async ({ page, path }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(path(`/archive/characters/${id}`))
    await settle(page)
    const portrait = page.locator('.detail-portrait').first()
    await expect(portrait).toHaveAttribute('src', new RegExp(`/icons/${id === 'eiki' ? 'Eiki' : 'Pam'}\\.webp\\?v=[0-9a-f]{16}$`))
    await expect.poll(() => portrait.evaluate(image => image.naturalWidth)).toBeGreaterThan(0)
    const banner = page.locator(`.banner-card[data-detail-id="${id}"] img.banner-img`)
    await banner.scrollIntoViewIfNeeded()
    await expect(banner).toHaveAttribute('srcset', new RegExp(`/persos/${id}\\.webp\\?v=[0-9a-f]{16} 626w`))
  })
}
