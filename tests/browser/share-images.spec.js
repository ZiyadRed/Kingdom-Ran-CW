import { test, expect } from './fixtures.js'

const characters={en:'moubu',ja:'kisui',ar:'ka',fr:'gokei'}
const localized={
  en:{disabled:'No skills selected',cw6:'Morale Consumption Down 30%'},
  ja:{disabled:'スキル未選択',cw6:'士気消費30%低下'},
  ar:{disabled:'لم تُحدد أي مهارات',cw6:'خفض استهلاك المعنويات بنسبة 30%'},
  fr:{disabled:'Aucune compétence sélectionnée',cw6:'-30% de consommation de moral'},
}
const team='?plan=1&a=shouheikun%2Crenpa%2Cshin%2Cmakou&d=rien%2Cbeiman%2Ckarin%2Cshunshinkun&as=311%2C311%2C310%2C310&ds=310%2C310%2C310%2C310&c=1'
const disabledTeam=team.replace('as=311%2C311%2C310%2C310','as=000%2C311%2C310%2C310')

async function instrumentShareCanvas(page){
  await page.addInitScript(()=>{
    window.__shareCanvasText=[]
    const original=CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText=function(text,x,y,maxWidth){
      window.__shareCanvasText.push({text:String(text),x,y,align:this.textAlign,color:this.fillStyle,font:this.font})
      return original.call(this,text,x,y,maxWidth)
    }
    Object.defineProperty(navigator,'share',{configurable:true,value:undefined})
    Object.defineProperty(navigator,'canShare',{configurable:true,value:undefined})
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{write:()=>Promise.reject(new Error('preview'))}})
  })
}

async function renderPreview(page,trigger){
  await page.evaluate(()=>{ window.__shareCanvasText=[] })
  await trigger.click()
  const image=page.locator('dialog:modal .share-preview-img-wrap img')
  await expect(image).toBeVisible()
  await image.evaluate(node=>node.decode())
  const dimensions=await image.evaluate(async node=>{
    const blob=await fetch(node.src).then(response=>response.blob())
    return {width:node.naturalWidth,height:node.naturalHeight,bytes:blob.size}
  })
  const paint=await page.evaluate(()=>window.__shareCanvasText)
  await page.keyboard.press('Escape')
  await expect(page.locator('dialog:modal')).toHaveCount(0)
  return {dimensions,paint}
}

function expectImage(result,width){
  expect(result.dimensions.width).toBe(width)
  expect(result.dimensions.height).toBeGreaterThan(500)
  expect(result.dimensions.bytes).toBeGreaterThan(10_000)
  expect(result.dimensions.bytes).toBeLessThan(8_000_000)
  const text=result.paint.map(item=>item.text).join(' ')
  expect(text).not.toMatch(/https?:\/\//i)
  expect(text).not.toMatch(/discord/i)
  expect(text).toContain('ranhq.vercel.app')
}

test.beforeEach(async({page})=>instrumentShareCanvas(page))

test('character share PNG uses the unified measured renderer',async({page,path,locale})=>{
  await page.goto(path(`/archive/characters/${characters[locale]}`))
  const result=await renderPreview(page,page.locator('.detail-panel .share-image-btn'))
  expectImage(result,2160)
})

test('attack and defense team PNGs preserve slots and readable mixed skill types',async({page,path})=>{
  await page.goto(path(`/builder${team}`))
  for(const side of ['attack','defense']){
    if(side==='defense') await page.locator('.builder-side-switch button').nth(1).click()
    const result=await renderPreview(page,page.locator(`.side-${side} .team-share-btn`))
    expectImage(result,2250)
  }
})

test('CW6 PNG localizes presentation while retaining the Strategy type',async({page,path,locale})=>{
  await page.goto(path('/archive/cw6-scene-cards'))
  await page.locator('[data-detail-id="42004"]').click()
  const result=await renderPreview(page,page.locator('.detail-panel .share-image-btn'))
  expectImage(result,2160)
  const paint=result.paint.map(item=>item.text).join(' ')
  expect(paint).toContain(localized[locale].cw6)
  if(locale!=='en'){
    expect(paint).not.toContain('Morale Consumption Down')
    expect(paint).not.toContain('When ally Batei')
  }
})

test('a deliberate zero-skill mask paints localized selection state',async({page,path,locale})=>{
  await page.goto(path(`/builder${disabledTeam}`))
  const result=await renderPreview(page,page.locator('.side-attack .team-share-btn'))
  expectImage(result,2250)
  expect(result.paint.map(item=>item.text).join(' ')).toContain(localized[locale].disabled)
})
