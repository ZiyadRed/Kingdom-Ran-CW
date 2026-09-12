import { test, expect, instrumentStorage, settle } from './fixtures.js'

const widths = [390, 768, 1024, 1440]
const resistanceLabels = {
  en: ['Attack Down Resistance', 'Defense Down Resistance'],
  ja: ['攻撃力低下耐性', '防御力低下耐性'],
  ar: ['مقاومة خفض الهجوم', 'مقاومة خفض الدفاع'],
  fr: ['Résistance à la baisse d’attaque', 'Résistance à la baisse de défense'],
}
const fivePercent = locale => locale === 'fr' ? '+5,00%' : '+5.00%'

const overlap = (one, two) => (
  Math.max(0, Math.min(one.right, two.right) - Math.max(one.left, two.left)) > 0.5
  && Math.max(0, Math.min(one.bottom, two.bottom) - Math.max(one.top, two.top)) > 0.5
)

test('Scene Card totals keep localized labels and values readable without collisions', async ({ page, path, locale }) => {
  await instrumentStorage(page, {
    'ranhq-progress-v3': JSON.stringify({
      cw6Cards: {}, sceneBuffCards: {}, buffSources: {},
      sceneBuffStars: { '40271': 6, '40274': 6 },
    }),
  })
  await page.goto(path('/buffs'))
  await settle(page)
  const details = page.locator('.buff-progress-details')
  await details.evaluate(node => { node.open = true })
  const section = page.locator('.buff-summary-section-scene')
  const stats = section.locator('.buff-summary-stats-scene')
  const cells = stats.locator('.buff-summary-stat')
  await expect(section).toBeVisible()
  await expect(cells).toHaveCount(9)

  for (const width of widths) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    await section.scrollIntoViewIfNeeded()
    await expect(cells).toHaveCount(9)
    await expect(cells.nth(7).locator('b')).toHaveText(resistanceLabels[locale][0])
    await expect(cells.nth(8).locator('b')).toHaveText(resistanceLabels[locale][1])
    await expect(cells.nth(7).locator('span')).toHaveText(fivePercent(locale))
    await expect(cells.nth(8).locator('span')).toHaveText(fivePercent(locale))

    const geometry = await stats.evaluate(node => {
      const rect = element => {
        const box = element.getBoundingClientRect()
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom }
      }
      return {
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        cells: [...node.querySelectorAll('.buff-summary-stat')].map(cell => ({
          cell: rect(cell),
          label: rect(cell.querySelector('b')),
          value: rect(cell.querySelector('span')),
        })),
      }
    })

    expect(geometry.scrollWidth, `${locale} ${width}px component overflow`).toBeLessThanOrEqual(geometry.clientWidth)
    for (const cell of geometry.cells) expect(overlap(cell.label, cell.value), `${locale} ${width}px label/value overlap`).toBe(false)
    for (let first = 0; first < geometry.cells.length; first++) {
      for (let second = first + 1; second < geometry.cells.length; second++) {
        expect(overlap(geometry.cells[first].cell, geometry.cells[second].cell), `${locale} ${width}px stat-cell overlap ${first}/${second}`).toBe(false)
        for (const firstPart of ['label', 'value']) for (const secondPart of ['label', 'value']) {
          expect(
            overlap(geometry.cells[first][firstPart], geometry.cells[second][secondPart]),
            `${locale} ${width}px text overlap ${first}.${firstPart}/${second}.${secondPart}`,
          ).toBe(false)
        }
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  }
})
