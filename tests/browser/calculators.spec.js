import { test, expect, instrumentStorage, storage, saved, settle, expectLocale } from './fixtures.js'

test('Castle boards and Team Cost choices persist through refresh and locale changes', async ({ page, path, locale }) => {
  await instrumentStorage(page, saved)
  await page.goto(path('/castle-points'))
  await expectLocale(page, locale)
  const row = page.locator('.cp-table tbody tr').first()
  await row.locator('.cp-name-cell input').fill('My Alliance')
  for (const [i, value] of ['2', '3', '4'].entries()) await row.locator('.cp-stepper input').nth(i).fill(value)
  await row.locator('.cp-total-input').fill('12345')
  await expect(row.locator('.cp-projected')).toHaveText(/26[,\s]?545/)
  await page.getByRole('tab', { name: '2.0', exact: true }).click()
  await row.locator('.cp-stepper input').first().fill('1')
  await row.locator('.cp-total-input').fill('77')
  await expect(row.locator('.cp-projected')).toHaveText(/2[,\s]?777/)
  await settle(page)
  const castle = (await storage(page))['ranhq:castle-points']
  expect(JSON.parse(castle).boards.normal[0]).toMatchObject({ name: 'My Alliance', large: 2, medium: 3, small: 4, carried: 12345 })
  await page.reload()
  await expect(row.locator('.cp-projected')).toHaveText(/2[,\s]?777/)
  await page.getByRole('tab', { name: '1.0', exact: true }).click()
  await expect(row.locator('.cp-name-cell input')).toHaveValue('My Alliance')
  await expect(row.locator('.cp-projected')).toHaveText(/26[,\s]?545/)
  await page.goto(path('/cost'))
  await page.locator('.tc-slot-empty').first().click()
  await page.locator('.picker-search').fill('蒙武')
  await page.locator('.tc-picker-card:enabled').first().click()
  const secondSkill = page.locator('.tc-slot-filled .tc-skill-toggle').nth(1)
  await expect(secondSkill).toHaveAttribute('aria-label', /Moubu|蒙武|موبو/)
  await expect(secondSkill).toHaveAttribute('aria-pressed', 'false')
  await secondSkill.focus()
  await page.keyboard.press('Space')
  await expect(secondSkill).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.tc-summary-main strong')).toHaveText(/1[,\s]?100/)
  await expect.poll(async () => JSON.parse((await storage(page))['ranhq:team-cost'])).toEqual({ version: 1, slots: ['moubu', null, null, null], skillsDone: [2, 0, 0, 0] })
  const beforeSwitch = await storage(page)
  const next = locale === 'ar' ? 'fr' : 'ar'
  await page.locator('.locale-switcher select:visible').first().selectOption(next)
  await expect(page).toHaveURL('/' + next + '/cost')
  await expectLocale(page, next)
  await page.reload()
  await expect(secondSkill).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.tc-summary-main strong')).toHaveText(/1[,\s]?100/)
  expect(await storage(page)).toEqual({ ...beforeSwitch, 'ranhq-locale': next })
  for (const [key, value] of Object.entries(saved)) expect((await storage(page))[key]).toBe(value)
})

for (const width of [320, 820, 1440]) test(`Castle ${width}px stepper hit areas are fully visible and usable`, async ({ page, path, locale }) => {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(path('/castle-points'))
  await expect(page.locator('.cp-stepper').first()).toBeVisible()
  const steppers = page.locator('.cp-table tbody tr').first().locator('.cp-stepper')
  const geometry = await steppers.evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect()
    return [...node.querySelectorAll('button,input')].map(control => {
      const rect = control.getBoundingClientRect()
      return { width: rect.width, visible: Math.max(0, Math.min(box.right, rect.right) - Math.max(box.left, rect.left)) }
    })
  }))
  for (const controls of geometry) for (const control of controls) {
    expect(control.width).toBeGreaterThanOrEqual(34)
    expect(control.visible).toBeGreaterThanOrEqual(control.width - 0.1)
  }
  for (const stepper of await steppers.all()) {
    const plus = stepper.locator('button').last()
    const box = await plus.boundingBox()
    // Click the edge that was previously clipped, not the easy center point.
    await plus.click({ position: { x: box.width - 2, y: box.height / 2 } })
    await expect(stepper.locator('input')).toHaveValue('1')
    await stepper.locator('input').fill('42')
  }
  await page.reload()
  for (const input of await steppers.locator('input').all()) await expect(input).toHaveValue('42')
  await expectLocale(page, locale)
})
