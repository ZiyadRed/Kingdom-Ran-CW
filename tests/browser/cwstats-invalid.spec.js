import { test, expect, settle } from './fixtures.js'

const storageKey = 'ranhq-cw-stats-v1'
const character = {
  hp: '10000', atkMin: '1000', atkMax: '2000', def: '1000',
  buffs: { hp: '0', atk: '0', def: '0' },
}

test('Stats rejects negative input and restored invalid values without changing power', async ({ page, path }) => {
  const state = {
    version: 2,
    characters: { shin: { ...character, hp: '-100' } },
    teams: [{ id: 'team-1', slots: ['shin', null, null, null], scenarios: {
      shin: { buffChanges: { hp: '-99', atk: '', def: '' }, baseBuffs: { hp: '', atk: '', def: '' } },
    } }],
  }
  await page.addInitScript(({ key, data }) => {
    if (sessionStorage.getItem('ranhq-negative-stats-seeded')) return
    localStorage.setItem(key, JSON.stringify(data))
    sessionStorage.setItem('ranhq-negative-stats-seeded', '1')
  }, { key: storageKey, data: state })
  await page.goto(path('/cw-stats'))
  await settle(page)
  await page.locator('.cwstats-roster-slot').first().click()
  const editor = page.locator('.cwstats-editor')
  const hp = editor.locator('.cwstats-stat-section input').first()
  const buff = editor.locator('.cwstats-buff-grid input').first()
  await expect(hp).toHaveValue('')
  await expect(buff).toHaveValue('')

  await hp.fill('10000')
  await buff.fill('0')
  const power = editor.locator('.cwstats-slot-power strong')
  const readPower = async () => Number((await power.innerText()).replace(/\D/g, ''))
  await expect.poll(readPower).toBe(3962)
  await buff.fill('1')
  await expect.poll(readPower).toBe(3982)
  for (const invalid of ['-1', '-99', '-100', '-101']) {
    await buff.fill(invalid)
    await expect(buff).toHaveValue('')
    await expect.poll(readPower).toBe(3962)
  }
  await page.reload()
  await settle(page)
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey)
  expect(stored.characters.shin.hp).toBe('10000')
  expect(stored.teams[0].scenarios.shin.buffChanges.hp).toBe('')
})
