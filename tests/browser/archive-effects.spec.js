import { test, expect, settle } from './fixtures.js'

// Real touch input, so a tap is a touch pointer and not an emulated mouse.
test.use({ hasTouch: true })

const params = (page, key) => new URL(page.url()).searchParams.getAll(key)
const chipCount = async chip => Number(await chip.locator('.effect-chip-n').textContent())

// Shunsuiju's combat skill inflicts Confusion; the explanation is the Guide's.
const CONFUSION = {
  en: { word: 'Confusion', name: 'Confusion', description: 'Attacks both allies and enemies indiscriminately.' },
  ja: { word: '錯乱', name: '錯乱', description: '味方と敵を区別せず攻撃します。' },
  ar: { word: 'الارتباك', name: 'الارتباك', description: 'تهاجم الحلفاء والأعداء بلا تمييز.' },
  fr: { word: 'confusion', name: 'Confusion', description: 'Attaque alliés et ennemis sans distinction.' },
}

test('Archive filters by role and by several effects, kept in the URL', async ({ page, path }) => {
  await page.goto(path('/archive/characters'))
  await settle(page)
  // Unit type and Leader/Strategist; the rarity chips are gone.
  await expect(page.locator('.archive-filters .filter-chip-group')).toHaveCount(2)

  const roles = page.locator('.archive-role-filter .filter-chip')
  await roles.nth(2).click()
  await expect.poll(() => params(page, 'role')).toEqual(['strategist'])
  const cards = page.locator('.banner-card')
  await expect(cards.first()).toBeVisible()
  const strategists = await cards.count()
  expect(strategists).toBeGreaterThan(0)
  await expect(page.locator('.banner-card .banner-role-badge[data-role-badge="Strategist"]')).toHaveCount(strategists)
  await roles.first().click()
  await expect.poll(() => params(page, 'role')).toEqual([])

  const toggle = page.locator('.effect-filter-toggle')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  const confusion = page.locator('[data-effect-filter="confusion"]')
  const confused = await chipCount(confusion)
  await confusion.click()
  await expect(confusion).toHaveAttribute('aria-pressed', 'true')
  await expect(cards).toHaveCount(confused)

  // A second effect narrows further; the chip said how far beforehand.
  const guard = page.locator('[data-effect-filter="guard"]')
  const both = await chipCount(guard)
  expect(both).toBeGreaterThan(0)
  await guard.click()
  await expect(cards).toHaveCount(both)
  await expect.poll(() => params(page, 'effect')).toEqual(['guard', 'confusion'])
  // A chip that would leave nobody cannot be pressed.
  for (const chip of await page.locator('.effect-chip:not(.is-on)').all()) {
    if (await chipCount(chip) === 0) await expect(chip).toBeDisabled()
  }
  await page.locator('.effect-filter-done').click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(toggle).toBeFocused()

  await page.reload()
  await settle(page)
  await expect(page.locator('.effect-pill')).toHaveCount(2)
  await expect(cards).toHaveCount(both)
  await page.locator('.effect-pill').first().click()
  await expect(cards).toHaveCount(confused)
  await expect.poll(() => params(page, 'effect')).toEqual(['confusion'])
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test('a status named in a skill explains itself on tap, hover and keyboard focus', async ({ page, path, locale }) => {
  const copy = CONFUSION[locale]
  await page.goto(path('/archive/characters/shunsuiju'))
  await settle(page)
  const term = page.locator('.detail-skills .eff-term[data-effect-term="Confusion"]').first()
  await term.scrollIntoViewIfNeeded()
  await expect(term).toHaveText(copy.word)
  // Screen readers get the same explanation as the visible card.
  const describedBy = await term.getAttribute('aria-describedby')
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveText(new RegExp(`^${copy.name}.+${copy.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))

  const tip = page.locator('.eff-tip')
  await term.tap()
  await expect(tip).toBeVisible()
  await expect(tip.locator('.eff-tip-name')).toHaveText(copy.name)
  await expect(tip.locator('.eff-tip-desc')).toHaveText(copy.description)
  await expect(tip).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
  const box = await tip.boundingBox()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(390)
  await page.locator('.detail-name').tap()
  await expect(tip).toHaveCount(0)

  await term.hover()
  await expect(tip).toBeVisible()
  await page.mouse.move(1, 1)
  await expect(tip).toHaveCount(0)

  // Keyboard: Tab onto the keyword from the profile heading, then dismiss it.
  await page.locator('.detail-name').focus()
  for (let step = 0; step < 80; step += 1) {
    await page.keyboard.press('Tab')
    if (await term.evaluate(element => element === document.activeElement)) break
  }
  await expect(term).toBeFocused()
  await expect(tip).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tip).toHaveCount(0)
  await expect(term).toBeFocused()
})
