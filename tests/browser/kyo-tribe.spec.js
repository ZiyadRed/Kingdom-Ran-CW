import { test, expect, instrumentStorage, progressKey } from './fixtures.js'

const labels = { en: 'Kyo Tribe', ja: '羌族', ar: 'قبيلة كيو', fr: 'Tribu Kyo' }
const ownedSource = 'buff_7bea9e0a1b1b429794a43b402bd56b0c'

test('Kyo Tribe uses Romaji, retains both search labels and preserves saved buff ownership', async ({ page, path, locale }, testInfo) => {
  await instrumentStorage(page, {
    [progressKey]: JSON.stringify({ cw6Cards: {}, sceneBuffCards: {}, sceneBuffStars: {}, buffSources: { [ownedSource]: true } }),
  })
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await page.goto(path('/buffs'))
    const search = page.locator('input[type="search"]:visible')
    const category = page.locator('.buff-pick-card').filter({ hasText: labels[locale] })
    for (const query of ['Kyo Tribe', 'Qiang Tribe']) {
      await search.fill(query)
      await expect(category).toBeVisible()
    }
    await expect(category.locator('img')).toHaveAttribute('src', /\/icons\/Kyoukai\.webp\?v=[0-9a-f]{16}$/)
    await category.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toHaveAttribute('aria-label', new RegExp(labels[locale]))
    await dialog.locator('.buff-stat-tabs button').nth(1).click()
    const row = dialog.locator('.buff-source-row').filter({ hasText: '羌明' })
    await expect(row).toContainText(locale === 'fr' ? '+5,0%' : '+5.0%')
    await expect(row.locator('[aria-pressed]')).toHaveAttribute('aria-pressed', 'true')
    await expect(dialog).not.toContainText('Qiang')
    await page.screenshot({ path: testInfo.outputPath(`kyo-${locale}-${viewport.width}.png`) })
    await page.keyboard.press('Escape')
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).buffSources, progressKey))
      .toMatchObject({ [ownedSource]: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  }
})
