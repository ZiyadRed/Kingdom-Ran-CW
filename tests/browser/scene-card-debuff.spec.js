import { test, expect, instrumentStorage, progressKey, settle, expectLocale } from './fixtures.js'
import { CATALOGS } from '../../src/i18n/i18n.js'

for (const [size, viewport] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
  test.describe(`passive enemy scene card ${size}`, () => {
    test.use({ viewport })

    test('tracks flat reductions, rank changes and saved ownership independently', async ({ page, path, locale }) => {
      const prior = { cw6Cards: { '40225': true }, sceneBuffCards: { '40141': true }, sceneBuffStars: { '40142': 2 }, buffSources: { opaque: true } }
      await instrumentStorage(page, { [progressKey]: JSON.stringify(prior) })
      const errors = []
      page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()) })
      await page.goto(path('/buffs'))
      await settle(page)
      await expectLocale(page, locale)
      await expect(page).toHaveTitle(/RanHQ/)
      await expect(page.locator('vite-error-overlay')).toHaveCount(0)
      const section = page.locator('[data-scene-stat="enemy_def_down"]')
      await expect(section.locator('summary')).toContainText(CATALOGS[locale].buffs.enemyDefenseReduction)
      await expect(section.locator('summary [dir="ltr"]')).toHaveText('-500')
      await section.locator('summary').click()
      const card = section.locator('[data-scene-card="40276"]')
      await expect(card.locator('[data-scene-value]')).toHaveText('0')
      await expect(card.locator('.scene-star-control .active')).toHaveCount(0)
      const art = card.locator('img').first()
      await expect(art).toHaveAttribute('src', /Queen-Biki-Enemy-Defense-Reduction-thumb\.webp/)
      await expect.poll(() => art.evaluate(img => img.complete && img.naturalWidth)).toBe(320)
      await expect(art).toHaveAttribute('alt', new RegExp(CATALOGS[locale].buffs.enemyDefenseReduction))
      await expect(art).not.toHaveAttribute('alt', /CW6/)
      await expect(card.locator('.scene-star-control')).toHaveAttribute('aria-label', CATALOGS[locale].sceneCardRank)
      await expect(card.getByRole('group', { name: CATALOGS[locale].sceneCardRank, exact: true })).toBeVisible()
      if (locale === 'ja') {
        await expect(art).toHaveAttribute('alt', '太后 — 敵軍防御力低下 — 追想カード')
        await expect(art).toHaveAttribute('title', '太后 — 敵軍防御力低下 — 追想カード')
        await expect(card.locator('img').last()).toHaveAttribute('alt', '太后')
        await expect(page.locator('main')).toContainText('追想カードを所持しているだけで有効になります。')
        await expect(page.locator('main')).toContainText('各ランクの最大レベル時の効果値を表示しています。')
      }

      await page.locator('.buff-progress-details > summary').click()
      const total = stat => page.locator(`[data-scene-stat-total="${stat}"] > span`)
      await expect(total('enemy_def_down')).toHaveText('0')
      await expect(total('def')).toHaveText('+364')
      await expect(total('atk')).toHaveText('+500')
      await expect(total('def_down_resist')).toHaveText(locale === 'fr' ? '+0,00%' : '+0.00%')
      const values = [330, 364, 398, 432, 466, 500]
      for (const [index, value] of values.entries()) {
        await card.locator('.scene-star-control button').nth(index).click()
        await expect(card.locator('[data-scene-value]')).toHaveText(`-${value}`)
        await expect(total('enemy_def_down')).toHaveText(`-${value}`)
        await expect(total('def')).toHaveText('+364')
      }
      const current = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)
      expect(current).toEqual({ ...prior, sceneBuffStars: { ...prior.sceneBuffStars, '40276': 6 } })
      await page.reload()
      await settle(page)
      await section.locator('summary').click()
      await expect(card.locator('[data-scene-value]')).toHaveText('-500')
      await expect(card.locator('.scene-star-control .active')).toHaveCount(6)
      await card.locator('.scene-star-control button').nth(5).click()
      await expect(card.locator('[data-scene-value]')).toHaveText('0')
      await expect(card.locator('.scene-star-control .active')).toHaveCount(0)
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      expect(errors).toEqual([])
    })
  })
}
