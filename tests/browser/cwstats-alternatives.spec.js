import { test, expect, settle } from './fixtures.js'

const statsKey = 'ranhq-cw-stats-v1'

const legacySharedCharacter = {
  hp: '10000',
  atkMin: '1000',
  atkMax: '2000',
  def: '1000',
  buffs: { hp: '0', atk: '0', def: '0' },
  buffChanges: { hp: '100', atk: '0', def: '0' },
  baseBuffs: { hp: '0', atk: '0', def: '0' },
}

test('legacy Stats scenarios migrate, isolate by team, keep current values shared, and reset globally', async ({ page, path, locale }) => {
  const seededState = {
    version: 1,
    characters: { shin: legacySharedCharacter },
    teams: [
      ['shin', null, null, null],
      ['shin', null, null, null],
    ],
  }
  await page.addInitScript(({ key, state }) => {
    if (sessionStorage.getItem('ranhq-f05-seeded')) return
    localStorage.setItem(key, JSON.stringify(state))
    sessionStorage.setItem('ranhq-f05-seeded', '1')
  }, { key: statsKey, state: seededState })
  await page.goto(path('/cw-stats'))
  await settle(page)

  await expect(page.locator('html')).toHaveAttribute('lang', locale)
  const teams = page.locator('.cwstats-team')
  await expect(teams).toHaveCount(2)
  const team1 = teams.nth(0)
  const team2 = teams.nth(1)
  const team1Total = team1.locator('.cwstats-team-total strong')
  const team2Total = team2.locator('.cwstats-team-total strong')
  const power = async locator => Number((await locator.innerText()).replace(/\D/g, ''))
  await expect.poll(() => power(team1Total)).toBe(5962)
  await expect.poll(() => power(team2Total)).toBe(5962)

  await team2.locator('.cwstats-roster-slot').first().click()
  const editor = team2.locator('.cwstats-editor')
  const sharedScreenLabel = editor.locator('.cwstats-stat-section .cwstats-section-label small')
  const sharedBuffLabel = editor.locator('.cwstats-current-percent-row .cwstats-section-label small')
  const currentTeamBuffLabel = editor.locator('.cwstats-section-label-buff small')
  const currentTeamBaseLabel = editor.locator('.cwstats-scene-card-buffs summary small')
  await expect(sharedScreenLabel).toHaveText(/\S+/)
  await expect(sharedBuffLabel).toHaveText(/\S+/)
  await expect(currentTeamBuffLabel).toHaveText(/\S+/)
  await expect(currentTeamBaseLabel).toHaveText(/\S+/)
  expect((await sharedScreenLabel.innerText()).trim()).not.toBe((await currentTeamBuffLabel.innerText()).trim())

  const team2Hypothesis = team2.locator('.cwstats-buff-grid input').first()
  await expect(team2Hypothesis).toBeVisible()
  await expect(team2Hypothesis).toHaveValue('100')
  await team2Hypothesis.fill('0')
  await team2Hypothesis.press('Tab')

  await expect.poll(() => power(team1Total)).toBe(5962)
  await expect.poll(() => power(team2Total)).toBe(3962)

  const sharedHp = editor.locator('.cwstats-stat-section input').first()
  await sharedHp.fill('11000')
  await sharedHp.press('Tab')
  await expect.poll(() => power(team1Total)).toBe(6362)
  await expect.poll(() => power(team2Total)).toBe(4162)

  await expect.poll(
    () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), statsKey),
  ).toMatchObject({ version: 2 })
  const persisted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), statsKey)
  const storedTeam1 = persisted.teams.find(team => team.id === 'team-1')
  const storedTeam2 = persisted.teams.find(team => team.id === 'team-2')
  expect(storedTeam1.scenarios.shin.buffChanges.hp).toBe('100')
  expect(storedTeam2.scenarios.shin.buffChanges.hp).toBe('0')
  expect(persisted.characters.shin.hp).toBe('11000')
  expect(persisted.characters.shin).not.toHaveProperty('buffChanges')
  expect(persisted.characters.shin).not.toHaveProperty('baseBuffs')

  await page.reload()
  await settle(page)
  const reloadedTeams = page.locator('.cwstats-team')
  const reloadedTeam1Total = reloadedTeams.nth(0).locator('.cwstats-team-total strong')
  const reloadedTeam2 = reloadedTeams.nth(1)
  await expect.poll(() => power(reloadedTeam1Total)).toBe(6362)
  await expect.poll(() => power(reloadedTeam2.locator('.cwstats-team-total strong'))).toBe(4162)
  await reloadedTeam2.locator('.cwstats-roster-slot').first().click()
  await expect(reloadedTeam2.locator('.cwstats-buff-grid input').first()).toHaveValue('0')

  await page.once('dialog', dialog => dialog.accept())
  await page.locator('.cwstats-clear-button').click()
  await expect(page.locator('.cwstats-team')).toHaveCount(1)
  await expect(page.locator('.cwstats-team .cwstats-empty-slot')).toHaveCount(4)
  await expect.poll(
    () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), statsKey),
  ).toMatchObject({
    version: 2,
    characters: {},
    teams: [{ id: 'team-1', slots: [null, null, null, null], scenarios: {} }],
  })
})
