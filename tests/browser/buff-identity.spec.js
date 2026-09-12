import { test, expect, progressKey } from './fixtures.js'

for (const [size, viewport] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
  test.describe(`regular buff stable identity ${size}`, () => {
    test.use({ viewport })

    test('Archer Attack preserves the Kou source and its ownership across locales', async ({ page, path, locale }) => {
      await page.goto(path('/buffs'))
      await expect(page.locator('#root')).toBeVisible()
      await page.locator('.buff-pick-card').filter({ has: page.locator('img[src="/icons/controls/unit_archer.webp"]') }).click()
      await page.locator('.buff-stat-tabs button').nth(1).click()
      const row = page.locator('.buff-source-row').filter({ hasText: '向' }).first()
      await expect(row).toBeVisible()
      await expect(row.locator('.buff-source-avatar img')).toHaveAttribute('src', '/icons/Kou.webp')
      await expect(row.locator('.buff-source-avatar img')).not.toHaveAttribute('src', '/icons/Kou2.webp')
      await expect(row.locator('.buff-source-info')).toContainText('UR')
      await expect(row).toContainText(locale === 'fr' ? '+12,4%' : '+12.4%')
      await expect(row.locator('.buff-source-name-line')).not.toContainText('昂')
      if (locale === 'ja') await expect(row.locator('.buff-source-name-line')).toHaveText('向')
      if (locale === 'en') await expect(row.locator('.buff-source-name-line')).toContainText('Kou')
      expect(await row.locator('a').count()).toBe(0) // This UI has no character-detail link.

      await row.locator('[aria-pressed]').click()
      await expect(row.locator('[aria-pressed]')).toHaveAttribute('aria-pressed', 'true')
      expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).buffSources, progressKey))
        .toMatchObject({ buff_fbc9ed824fb448a588cd091db0027196: true })
      await page.reload()
      await page.locator('.buff-pick-card').filter({ has: page.locator('img[src="/icons/controls/unit_archer.webp"]') }).click()
      await page.locator('.buff-stat-tabs button').nth(1).click()
      await expect(page.locator('.buff-source-row').filter({ hasText: '向' }).first().locator('[aria-pressed]'))
        .toHaveAttribute('aria-pressed', 'true')
    })
  })
}
