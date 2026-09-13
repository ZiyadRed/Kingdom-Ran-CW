import { test, expect, instrumentStorage, settle } from './fixtures.js'

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

  await page.goto(path('/buffs'))
  await settle(page)
  await page.locator('.buff-scene-section details').evaluateAll(elements => {
    for (const element of elements) element.open = true
  })
  const cardAlts = await page.locator('.buff-scene-section img[alt*="追想カード"]').evaluateAll(images => images.map(image => image.alt))
  expect(cardAlts).toHaveLength(23)
  expect(cardAlts.every(alt => !/[A-Za-z]/.test(alt.replaceAll('CW6', '')))).toBe(true)
  const ownerAlts = await page.locator('.buff-scene-section img[src^="/icons/"]').evaluateAll(images => images.map(image => image.alt))
  expect(new Set(ownerAlts)).toEqual(new Set(['白翠', '樊於期', '李園', '考烈王', '嫪毐', '樊琉期', '岳雷', '媧燐', '嬴政', '桓騎', '黒桜', '青公', '春平君', '友里', '東美', '摎', '王翦', 'キタリ', '信']))
  await expect(page.getByRole('main')).not.toContainText(/Hakusui|Hanoki|Rien|Kouretsu|Rouai|Hanruki|Gakurai|Karin|Ei Sei|Kanki|Kokuou|Duke Sei|Shunpeikun|Yuri|Toubi|Kyou|Ousen|Kitari|Shin/)

  await page.goto(path('/guide/crystals'))
  await settle(page)
  await expect(page.getByRole('main')).toContainText('赤の結晶')
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
