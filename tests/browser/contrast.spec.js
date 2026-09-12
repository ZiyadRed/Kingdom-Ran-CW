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

async function compactActionContrast(locator){
  return locator.evaluate(node=>{
    const rgba=value=>{
      const values=String(value).match(/[\d.]+/g)?.map(Number)||[]
      return [values[0]||0,values[1]||0,values[2]||0,values[3]??1]
    }
    const over=(fg,bg)=>fg.slice(0,3).map((value,index)=>value*fg[3]+bg[index]*(1-fg[3]))
    const constantGradient=value=>{
      const colors=[...String(value).matchAll(/rgba?\([^)]+\)/g)].map(match=>rgba(match[0]))
      if(colors.length<2) return null
      return colors.every(color=>color.every((value,index)=>Math.abs(value-colors[0][index])<.001))?colors[0]:null
    }
    const ancestors=[]
    for(let current=node;current;current=current.parentElement) ancestors.unshift(current)
    let background=[255,255,255]
    for(const ancestor of ancestors){
      const style=getComputedStyle(ancestor)
      background=over(rgba(style.backgroundColor),background)
      const gradient=constantGradient(style.backgroundImage)
      if(gradient) background=over(gradient,background)
    }
    const style=getComputedStyle(node)
    let opacity=1
    for(const ancestor of ancestors) opacity*=Number(getComputedStyle(ancestor).opacity||1)
    const rawForeground=rgba(style.color)
    rawForeground[3]*=opacity
    const foreground=over(rawForeground,background)
    const luminance=rgb=>rgb.map(value=>value/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4).reduce((total,value,index)=>total+value*[.2126,.7152,.0722][index],0)
    const ratio=(one,two)=>{
      const [light,dark]=[luminance(one),luminance(two)].sort((a,b)=>b-a)
      return (light+.05)/(dark+.05)
    }
    const outline=rgba(style.outlineColor)
    return {
      ratio:ratio(foreground,background),
      foreground:style.color,
      background,
      fontSize:style.fontSize,
      fontWeight:style.fontWeight,
      opacity,
      semanticForeground:style.getPropertyValue('--accent-action-fg').trim(),
      outline:`${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
      outlineRatio:style.outlineStyle==='none'?null:ratio(over(outline,background),background),
    }
  })
}

async function expectCompactActionStates(page,locator,samples,identity){
  await expect(locator).toBeVisible()
  for(const state of ['normal','hover','focus','active']){
    if(state==='hover'){
      await locator.hover()
      await page.waitForTimeout(180)
    }
    if(state==='focus'){
      await locator.focus()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
      await expect(locator).toBeFocused()
    }
    if(state==='active'){
      await locator.hover()
      await page.mouse.down()
      await page.waitForTimeout(180)
    }
    const sample={identity,state,...await compactActionContrast(locator)}
    samples.push(sample)
    expect(sample.semanticForeground,JSON.stringify(sample)).toBe('#7b4628')
    expect(sample.ratio,JSON.stringify(sample)).toBeGreaterThanOrEqual(4.5)
    if(state==='focus') expect(sample.outlineRatio,JSON.stringify(sample)).toBeGreaterThanOrEqual(3)
    if(state==='active'){
      await page.mouse.move(0,0)
      await page.mouse.up()
    }
  }
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

test('F09 compact actions retain semantic contrast across locales and responsive layouts',async({page,path},testInfo)=>{
  const samples=[]
  const mask={n:3,s6:true,role:false}
  for(const width of [390,1440]){
    await page.setViewportSize({width,height:width===390?844:900})
    await page.addInitScript(({state})=>localStorage.setItem('ranhq:party-builder',JSON.stringify(state)),{state:{
      version:1,
      attack:['shin','makou',null,null],
      defense:['karin',null,null,null],
      attackSkills:[mask,mask,mask,mask],
      defenseSkills:[mask,mask,mask,mask],
    }})
    await page.goto(path('/builder'))
    await settle(page)
    const disclosure=page.locator('.builder-buff-toggle')
    if(await disclosure.getAttribute('aria-expanded')==='false') await disclosure.click()
    await expectCompactActionStates(page,page.locator('.side-attack .team-share-btn'),samples,`${width}: Builder Share team`)
    await expectCompactActionStates(page,page.locator('.buff-summary .share-btn'),samples,`${width}: Builder summary Share`)
    const disabledShare=page.locator('.side-attack .team-share-btn')
    await disabledShare.evaluate(node=>{node.disabled=true})
    const disabledShareSample={identity:`${width}: Builder Share team`,state:'disabled',...await compactActionContrast(disabledShare)}
    samples.push(disabledShareSample)
    expect(disabledShareSample.ratio,JSON.stringify(disabledShareSample)).toBeGreaterThanOrEqual(4.5)

    await page.evaluate(()=>localStorage.removeItem('ranhq-cw-stats-v1'))
    await page.goto(path('/cw-stats'))
    await settle(page)
    await expectCompactActionStates(page,page.locator('.cwstats-add-team'),samples,`${width}: Stats Add team`)
    await page.locator('.cwstats-empty-slot').first().click()
    await page.locator('.cwstats-search-input').fill('Shin')
    const searchAction=page.locator('.cwstats-search-result').first()
    await expectCompactActionStates(page,searchAction,samples,`${width}: Stats Add character`)
    const actionLabel=searchAction.locator('.cwstats-result-add')
    const labelSample={identity:`${width}: Stats Add character label`,state:'normal',...await compactActionContrast(actionLabel)}
    samples.push(labelSample)
    expect(labelSample.semanticForeground,JSON.stringify(labelSample)).toBe('#7b4628')
    expect(labelSample.ratio,JSON.stringify(labelSample)).toBeGreaterThanOrEqual(4.5)
    await searchAction.click()
    for(let teamCount=1;teamCount<5;teamCount+=1) await page.locator('.cwstats-add-team').click()
    const disabledAddTeam=page.locator('.cwstats-add-team')
    await expect(disabledAddTeam).toBeDisabled()
    const disabledTeamSample={identity:`${width}: Stats maximum teams`,state:'disabled',...await compactActionContrast(disabledAddTeam)}
    samples.push(disabledTeamSample)
    expect(disabledTeamSample.ratio,JSON.stringify(disabledTeamSample)).toBeGreaterThanOrEqual(4.5)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true)
    expect(await page.locator('html').getAttribute('dir')).toBe(testInfo.project.name==='ar'?'rtl':'ltr')
  }
  await testInfo.attach('f09-compact-action-contrast.json',{body:JSON.stringify(samples,null,2),contentType:'application/json'})
})
