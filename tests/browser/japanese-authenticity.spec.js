import { test, expect, instrumentStorage, settle } from './fixtures.js'
import { readFileSync } from 'node:fs'
const sceneCards = JSON.parse(readFileSync(new URL('../../data/scene_card_cw_buffs.json', import.meta.url), 'utf8')).cards

test('Japanese readings work on daily-use character searches and keep selections after refresh', async ({ page, path, locale }) => {
  test.skip(locale !== 'ja')
  await page.goto(path('/archive/characters'))
  const search = page.locator('input[type="search"]:visible').first()
  for (const query of ['もうぶ', 'モウブ', 'ﾓｳﾌﾞ']) {
    await search.fill(query)
    await expect(page.locator('.banner-card[data-detail-id="moubu"]')).toBeVisible()
  }
  await page.goto(path('/cost'))
  await page.locator('.tc-slot-empty').first().click()
  await page.locator('.picker-search').fill('ﾓｳﾌﾞ')
  await page.locator('.tc-picker-card').filter({ hasText: '蒙武' }).first().click()
  await expect(page.locator('.tc-slot-filled').first()).toContainText('蒙武')
  await expect(page.getByRole('main')).toContainText('争覇解放石')
  await expect(page.getByRole('main')).not.toContainText('赤の結晶')
  await page.reload()
  await expect(page.locator('.tc-slot-filled').first()).toContainText('蒙武')

  await page.goto(path('/buffs'))
  await page.locator('input[type="search"]:visible').fill('ｵﾙﾄﾞ')
  await expect(page.locator('.buff-pick-card').first()).toBeVisible()
})

test('Japanese source conditions distinguish general targets, weapons and unlock requirements', async ({ page, path, locale }) => {
  test.skip(locale !== 'ja')
  await page.goto(path('/archive/characters/ei_sei'))
  const skills = page.locator('.detail-panel .detail-skills')
  await expect(skills).toContainText('攻撃力が最も高い敵兵器1つ')
  await page.goto(path('/archive/characters/gohoumei'))
  await expect(page.locator('.detail-panel .detail-skills')).toContainText('自身以外の味方歩兵武将1名につき')
  await page.goto(path('/buffs'))
  await page.locator('input[type="search"]:visible').fill('奈棍')
  await page.locator('.buff-pick-card').filter({ hasText: '騎兵' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: /防御力/ }).click()
  await expect(page.getByRole('dialog').locator('img[alt="武運によるスキル強化"]').first()).toBeVisible()
  await expect(page.getByRole('dialog')).not.toContainText('Shard upgrade')
})

const completeBuilder = {
  version: 1,
  attack: ['moubu', 'renpa', 'ousen', 'kanki'],
  defense: ['kyou', 'shin', 'ei_sei', 'karin'],
  attackSkills: Array.from({ length: 4 }, () => ({ n: 3, s6: true, role: false })),
  defenseSkills: Array.from({ length: 4 }, () => ({ n: 3, s6: true, role: false })),
}

test('Japanese authored UI uses official terms and source-backed Scene Card owner names', async ({ page, path, locale }) => {
  test.skip(locale !== 'ja', 'Japanese authenticity contract')
  await instrumentStorage(page, {
    'ranhq:party-builder': JSON.stringify(completeBuilder),
    'ranhq-progress-v3': JSON.stringify({
      cw6Cards: {}, sceneBuffCards: {}, buffSources: {},
      sceneBuffStars: { '40148': 6, '40271': 6, '40274': 6 },
    }),
  })

  const response = await page.goto(path('/buffs'))
  // Raw prerendered attributes must survive the stream before hydration.
  // This previously contained a NUL in 岳雷's 追想カード alt attribute.
  const prerendered = await response.text()
  expect(prerendered).not.toContain(String.fromCharCode(0))
  expect(prerendered).not.toContain('\ufffd')
  await settle(page)
  await page.locator('.buff-scene-section details').evaluateAll(elements => {
    for (const element of elements) element.open = true
  })
  const cardAlts = await page.locator('.buff-scene-section img[alt*="追想カード"]').evaluateAll(images => images.map(image => image.alt))
  expect(cardAlts).toHaveLength(sceneCards.length)
  expect(cardAlts.every(alt => !/[A-Za-z]/.test(alt.replaceAll('CW6', '')))).toBe(true)
  const ownerAlts = await page.locator('.buff-scene-section img[src^="/icons/"]').evaluateAll(images => images.map(image => image.alt))
  expect(new Set(ownerAlts)).toEqual(new Set(['白翠', '樊於期', '李園', '考烈王', '嫪毐', '樊琉期', '岳雷', '媧燐', '嬴政', '桓騎', '黒桜', '青公', '春平君', '友里', '東美', '摎', '王翦', 'キタリ', '信']))
  await expect(page.getByRole('main')).not.toContainText(/Hakusui|Hanoki|Rien|Kouretsu|Rouai|Hanruki|Gakurai|Karin|Ei Sei|Kanki|Kokuou|Duke Sei|Shunpeikun|Yuri|Toubi|Kyou|Ousen|Kitari|Shin/)

  await page.goto(path('/guide/crystals'))
  await settle(page)
  await expect(page.getByRole('main')).toContainText('争覇解放石')
  await expect(page.getByRole('main')).not.toContainText('赤の結晶')
  await expect(page.getByRole('main')).toContainText('専用争覇解放石(飛信隊)')
  await expect(page.getByRole('main')).toContainText('争覇総大将解放石')
  await expect(page.getByRole('main')).toContainText('争覇軍師解放石')
  await expect(page.getByRole('main')).not.toContainText(/技能|[赤青橙緑]の争覇解放石/)

  await page.goto(path('/sim'))
  await settle(page)
  await expect(page.locator('.te-tag')).toContainText(['侵攻側', '侵攻側', '侵攻側', '侵攻側', '駐屯側', '駐屯側', '駐屯側', '駐屯側'])
  await expect(page.getByRole('main')).not.toContainText(/\b(?:ATK|DEF)\b/)

  for (const route of ['/archive/characters/shin', '/guide/roles']) {
    await page.goto(path(route))
    await settle(page)
    await expect(page.locator('nav.seo-breadcrumbs')).toHaveAttribute('aria-label', 'パンくずリスト')
  }
  await expect(page.locator('.foot-legal')).not.toContainText('Yasuhisa Hara')
})

test('Japanese basics uses the official Japanese FAQ images', async ({ page, path, locale }) => {
  test.skip(locale !== 'ja')
  await page.goto(path('/'))
  await settle(page)
  await expect(page.locator('.home-guide-map-ja img')).toHaveAttribute('src', '/guide/basics-map-ja.png')

  await page.goto(path('/guide/basics'))
  await settle(page)
  await expect(page.locator('.guide-ja-basics-map-link')).toHaveAttribute('href', '/guide/basics-map-ja.png')
  await expect(page.locator('.guide-ja-basics-flow img')).toHaveAttribute('src', '/guide/basics-flow-ja.png')
  await expect(page.locator('main img[src$="-en.webp"]')).toHaveCount(0)
  await expect(page.locator('main a[href$="-en.webp"]')).toHaveCount(0)
})

test('Kishou shows source names and gate conditions in Japanese', async ({ page, path, locale }) => {
  test.skip(locale !== 'ja')
  await page.goto(path('/archive/characters/kishou'))
  await settle(page)
  const skills = page.locator('.detail-panel .detail-skills')
  await expect(skills).toContainText('駐屯時、城門の体力が残っており、味方紀彗が生存している場合')
  for (const name of ['紀彗', '馬呈', '劉冬']) await expect(skills).toContainText(`味方${name}が生存している場合`)
  await expect(skills).not.toContainText(/Gate|HP remaining|When ally/i)
})

test('Soujin shows the Hi Shin Unit Shield matchup in Japanese', async ({ page, path, locale }) => {
  test.skip(locale !== 'ja')
  await page.goto(path('/archive/characters/soujin'))
  await settle(page)
  const skills = page.locator('.detail-panel .detail-skills')
  await expect(skills).toContainText('敵盾兵武将に対する味方飛信隊武将')
  await expect(skills).not.toContainText(/Hi Shin Unit|Shield/)
})

test('expanded Japanese buff summary and copied text contain no English labels', async ({ page, path, locale }) => {
  test.skip(locale !== 'ja')
  const mask = { n: 3, s6: true, role: false }
  await instrumentStorage(page, { 'ranhq:party-builder': JSON.stringify({
    version: 1,
    attack: ['kishou', 'kisui', 'batei', 'ryuuto'],
    defense: ['moubu', 'renpa', 'ousen', 'kanki'],
    attackSkills: [mask, mask, mask, mask],
    defenseSkills: [mask, mask, mask, mask],
  }) })
  await page.goto(path('/builder'))
  await settle(page)
  const toggle = page.locator('.builder-buff-toggle')
  if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click()
  const summary = page.locator('.buff-summary')
  await summary.locator('input[type="checkbox"]').check()
  await expect(summary.locator('.buff-row').first()).toBeVisible()
  await expect(summary).toContainText('攻撃力低下耐性')
  const screenText = await summary.textContent()
  expect(screenText.replace(/\b(?:RanHQ|CW6|HP|VS)\b/g, '')).not.toMatch(/[A-Za-z]/)

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async text => { window.__japaneseBuffShare = text } },
    })
  })
  await summary.locator('.share-btn').click()
  await expect.poll(() => page.evaluate(() => window.__japaneseBuffShare)).toContain('攻撃力低下耐性')
  const shareText = await page.evaluate(() => window.__japaneseBuffShare)
  expect(shareText.replace(/https?:\/\/\S+/g, '').replace(/\b(?:RanHQ|CW6|Discord|HP|VS)\b/g, '')).not.toMatch(/[A-Za-z]/)
})
