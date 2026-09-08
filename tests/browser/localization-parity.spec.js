import {readFileSync} from 'node:fs'
import {test,expect,settle} from './fixtures.js'
const roles=JSON.parse(readFileSync(new URL('../../data/souha_role_skills.json',import.meta.url),'utf8')).skills

test('marked Arabic names retain the same Archive results in every locale',async({page,path})=>{
  await page.goto(path('/archive/characters'))
  await settle(page)
  const search=page.locator('input[type="search"]:visible').first()
  let expected
  for(const query of ['موبو','مُوبُو','مـوبـو']){
    await search.fill(query)
    await expect(page.locator('.banner-card[data-detail-id="moubu"]')).toBeVisible()
    const ids=await page.locator('.banner-card').evaluateAll(nodes=>nodes.map(node=>node.dataset.detailId))
    if(expected) expect(ids).toEqual(expected)
    else expected=ids
  }
})

test('Guide role names preserve the source-backed Japanese owners',async({page,path,locale})=>{
  await page.goto(path('/guide/leaders'))
  await settle(page)
  for(const role of roles){
    const owner=page.locator(`[data-role-owner="${role.owner_id}"]`)
    await expect(owner).toBeVisible()
    if(locale==='ja'){
      await expect(owner.locator('img')).toHaveAttribute('alt',role.ownerNameJp)
      await expect(owner).toContainText(role.ownerNameJp)
      await expect(owner).not.toContainText(role.ownerName)
    }
  }
})

test('French infantry concepts produce identical rendered results',async({page,locale})=>{
  test.skip(locale!=='fr','French authored concepts')
  await page.goto('/fr/archive/characters')
  await settle(page)
  const search=page.locator('input[type="search"]:visible').first()
  let expected
  for(const query of ['infanterie','fantassin','fantassins']){
    await search.fill(query)
    await expect.poll(()=>page.locator('.banner-card').count()).toBeGreaterThan(0)
    await expect(page.locator('.gallery-title')).not.toBeEmpty()
    await settle(page)
    const ids=await page.locator('.banner-card').evaluateAll(nodes=>nodes.map(node=>node.dataset.detailId))
    if(expected) expect(ids).toEqual(expected)
    else expected=ids
  }
})
