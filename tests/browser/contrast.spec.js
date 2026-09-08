import {test,expect,settle} from './fixtures.js'

async function contrast(locator){
  return locator.evaluate(node=>{
    const rgba=value=>value.match(/[\d.]+/g).map(Number)
    const over=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*(fg[3]??1)+bg[i]*(1-(fg[3]??1)))
    const ancestors=[]
    for(let current=node;current;current=current.parentElement) ancestors.unshift(current)
    let bg=[255,255,255]
    for(const ancestor of ancestors) bg=over(rgba(getComputedStyle(ancestor).backgroundColor),bg)
    const style=getComputedStyle(node)
    const fg=over(rgba(style.color),bg)
    const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0)
    const [light,dark]=[luminance(fg),luminance(bg)].sort((a,b)=>b-a)
    return {ratio:(light+.05)/(dark+.05),foreground:style.color,background:bg,fontSize:style.fontSize,fontWeight:style.fontWeight}
  })
}

test('audited text surfaces retain readable contrast at every target width',async({page,path},testInfo)=>{
  const samples=[]
  for(const width of [320,390,820,1440]){
    await page.setViewportSize({width,height:900})
    for(const [route,selector,interactive] of [
      ['/','.home-guide-copy a',true],
      ['/archive/characters','.fac-active .fac-n',true],
      ['/archive/characters','.gallery-count',false],
      ['/archive/cw6-scene-cards','.gallery-count',false],
      ['/archive/characters/moubu','.detail-faction',false],
      ['/tiers','.mw-source',false],
    ]){
      await page.goto(path(route))
      await settle(page)
      const target=page.locator(selector)
      await expect(target).toBeVisible()
      for(const state of interactive?['normal','hover','focus']:['normal']){
        const control=selector.includes('fac-n')?target.locator('..'):target
        if(state==='hover') await control.hover()
        if(state==='focus'){
          await control.focus()
          await page.keyboard.press('Shift+Tab')
          await page.keyboard.press('Tab')
          await expect(control).toBeFocused()
        }
        const sample={width,route,selector,state,...await contrast(target)}
        samples.push(sample)
        expect(sample.ratio,JSON.stringify(sample)).toBeGreaterThanOrEqual(4.5)
      }
    }
  }
  await testInfo.attach('rendered-contrast.json',{body:JSON.stringify(samples,null,2),contentType:'application/json'})
})
