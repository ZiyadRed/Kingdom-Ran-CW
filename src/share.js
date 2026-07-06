import { classifyConditionParts } from './skillConditions.js'
import { absoluteUrl } from './seo.js'

export const DISCORD_MESSAGE_LIMIT = 1900
export const SKILL_IMAGE_WIDTH = 1080
export const TEAM_IMAGE_WIDTH = 1800
const TYPE_COLORS = {Combat:'#c0392b',Strategy:'#3d6eb5','Internal Affairs':'#1a8a72'}
const FACTION_COLORS = {qin:'#c0392b',zhao:'#2471a3',chu:'#8e44ad',wei:'#d19a2a',yan:'#1a8a72',han:'#6a4fc8',ai:'#b05070',qi:'#8a6a2a',mountain_folk:'#7d8a35',other:'#888'}
const FACTION_LABELS = {qin:'Qin',zhao:'Zhao',chu:'Chu',wei:'Wei',yan:'Yan',han:'Han',ai:'Ai',qi:'Qi',mountain_folk:'Mountain Folk',other:'Other'}

export async function shareText({title='RanHQ',text}){
  if(!text) return 'empty'
  const data={title,text}
  if(typeof navigator!=='undefined'&&navigator.share){
    try{
      await navigator.share(data)
      return 'shared'
    }catch(err){
      if(err?.name==='AbortError') return 'cancelled'
    }
  }
  if(typeof navigator!=='undefined'&&navigator.clipboard?.writeText){
    try{
      await navigator.clipboard.writeText(text)
      return 'copied'
    }catch{
      // Fall through to the prompt fallback used elsewhere in the app.
    }
  }
  if(typeof window!=='undefined'&&window.prompt){
    window.prompt('Copy this RanHQ share text:',text)
    return 'prompt'
  }
  throw new Error('No share target available')
}

export function characterShareUrl(character){
  return absoluteUrl(`/archive/characters/${character?.id||''}`)
}

export function builderShareUrl(){
  return absoluteUrl('/builder')
}

export async function createCharacterSkillsImage(character,{url=characterShareUrl(character)}={}){
  if(typeof document==='undefined') throw new Error('Image rendering requires a browser.')
  const measureCanvas=document.createElement('canvas')
  const measure=measureCanvas.getContext('2d')
  const layout=buildCharacterImageLayout(measure,character,url)
  const scale=Math.max(2,Math.min(3,window.devicePixelRatio||2))
  const canvas=document.createElement('canvas')
  canvas.width=layout.width*scale
  canvas.height=layout.height*scale
  canvas.style.width=`${layout.width}px`
  canvas.style.height=`${layout.height}px`
  const ctx=canvas.getContext('2d')
  ctx.scale(scale,scale)
  await drawCharacterSkillsImage(ctx,layout,character,url)
  const blob=await canvasToBlob(canvas)
  return {
    blob,
    fileName:`${safeFileName(character?.name_en||'ranhq-skills')}-skills.png`,
  }
}

export async function createTeamSkillsImage({team=[],title='RanHQ Team Skills',side='team',url=builderShareUrl()}={}){
  if(typeof document==='undefined') throw new Error('Image rendering requires a browser.')
  const members=(team||[]).filter(Boolean).slice(0,4)
  const measureCanvas=document.createElement('canvas')
  const measure=measureCanvas.getContext('2d')
  const layout=buildTeamImageLayout(measure,members,{title,side,url})
  const scale=Math.max(1.25,Math.min(2,window.devicePixelRatio||1.5))
  const canvas=document.createElement('canvas')
  canvas.width=Math.ceil(layout.width*scale)
  canvas.height=Math.ceil(layout.height*scale)
  canvas.style.width=`${layout.width}px`
  canvas.style.height=`${layout.height}px`
  const ctx=canvas.getContext('2d')
  ctx.scale(scale,scale)
  await drawTeamSkillsImage(ctx,layout,{title,side,url})
  const blob=await canvasToBlob(canvas)
  return {
    blob,
    fileName:`${safeFileName(title||side||'ranhq-team')}-skills.png`,
  }
}

export async function shareImageBlob(blob,fileName,title='RanHQ skills image'){
  const file=typeof File!=='undefined'?new File([blob],fileName,{type:'image/png'}):null
  if(file&&typeof navigator!=='undefined'&&navigator.share&&navigator.canShare?.({files:[file]})){
    try{
      await navigator.share({title,files:[file]})
      return 'shared'
    }catch(err){
      if(err?.name==='AbortError') return 'cancelled'
    }
  }
  if(typeof navigator!=='undefined'&&navigator.clipboard?.write&&typeof ClipboardItem!=='undefined'){
    try{
      await navigator.clipboard.write([new ClipboardItem({'image/png':blob})])
      return 'copied'
    }catch{
      return 'preview'
    }
  }
  return 'preview'
}

export function downloadBlob(blob,fileName){
  if(typeof document==='undefined') return
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url
  a.download=fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}

export function formatCharacterSkillsShare(character,{url=characterShareUrl(character),maxLength=DISCORD_MESSAGE_LIMIT}={}){
  const skills=character?.skills||[]
  const faction=[factionLabel(character?.country), character?.unit_type].filter(Boolean).join(' / ')
  const lines=[
    `**RanHQ Skills: ${character?.name_en||'Unknown'}**`,
    [character?.name_jp, faction].filter(Boolean).join(' - '),
    `<${url}>`,
    '',
  ]

  if(!skills.length){
    lines.push('Translation pending.')
  }else{
    skills.forEach((skill,idx)=>{
      const title=[`${idx+1}. ${skill.name_en||skill.name||'Unnamed skill'}`, skill.type&&`[${skill.type}]`, skill.star6&&'[6-star]'].filter(Boolean).join(' ')
      lines.push(`**${title}**`)
      if(skill.name_jp) lines.push(`_${skill.name_jp}_`)
      const effects=skill.effects||[]
      if(!effects.length) lines.push('- No translated effects yet.')
      effects.forEach(effect=>lines.push(`- ${formatEffectForShare(effect)}`))
      lines.push('')
    })
  }

  return limitDiscordMessage(lines.join('\n').trim(),url,maxLength)
}

export function formatTeamBuffShare({
  atk=[],
  def=[],
  atkBuffs=[],
  defBuffs=[],
  atkEnemyDebuffs={},
  defEnemyDebuffs={},
  includeCombat=false,
  url=builderShareUrl(),
  specialStats=new Set(),
  statSortKey,
  maxLength=DISCORD_MESSAGE_LIMIT,
}={}){
  const lines=[
    '**RanHQ Team Buff Summary**',
    includeCombat?'Strategy + combat skill effects included.':'Strategy skills only.',
    `<${url}>`,
    '',
    ...formatBuffSideForShare('Attacking Formation',atk,atkBuffs,atkEnemyDebuffs,{specialStats,statSortKey}),
    '',
    ...formatBuffSideForShare('Defending Formation',def,defBuffs,defEnemyDebuffs,{specialStats,statSortKey}),
  ]
  return limitDiscordMessage(lines.join('\n').trim(),url,maxLength)
}

export function formatEffectForShare(effect){
  const target=effect?.target||'Effect'
  const value=effect?.effect||'Translation pending'
  const duration=effect?.duration?` (${effect.duration})`:''
  const qualifiers=formatQualifiers(effect?.condition)
  return `${target} -> ${value}${duration}${qualifiers?` | ${qualifiers}`:''}`
}

export function formatQualifiers(condition){
  return classifyConditionParts(condition).map(chip=>`${chip.label}: ${chip.text}`).join('; ')
}

export function limitDiscordMessage(text,url,maxLength=DISCORD_MESSAGE_LIMIT){
  if(text.length<=maxLength) return text
  const suffix=`\n\n...truncated for Discord. Full details: <${url}>`
  const limit=Math.max(0,maxLength-suffix.length)
  const kept=[]
  let length=0
  for(const line of text.split('\n')){
    const nextLength=length+(kept.length?1:0)+line.length
    if(nextLength>limit) break
    kept.push(line)
    length=nextLength
  }
  return `${kept.join('\n').trimEnd()}${suffix}`
}

function formatBuffSideForShare(title,team,entries,enemyDebuffs,opts){
  const lines=[`**${title}**`]
  lines.push(`Team: ${team.length?team.map((g,i)=>`${i+1}. ${g.name_en}`).join(' / '):'No generals selected'}`)
  const buffLines=formatEntryBuffs(entries,opts)
  const debuffLines=formatEnemyDebuffs(enemyDebuffs,opts)
  if(!buffLines.length&&!debuffLines.length) lines.push('- No relevant buffs.')
  else lines.push(...buffLines,...debuffLines)
  return lines
}

function formatEntryBuffs(entries,{specialStats,statSortKey}){
  return entries.flatMap(({general,buffs})=>{
    const stats=sortBuffStats(Object.entries(buffs||{}),statSortKey)
    if(!stats.length) return []
    const values=stats.map(([stat,buff])=>formatBuffValue(stat,buff,specialStats)).filter(Boolean)
    return values.length?[`- ${general.name_en}: ${values.join(', ')}`]:[]
  })
}

function formatEnemyDebuffs(enemyDebuffs,{specialStats,statSortKey}){
  return Object.entries(enemyDebuffs||{}).flatMap(([target,{up={},down={}}])=>{
    const stats=sortBuffStats([
      ...Object.entries(down).map(([stat,value])=>[stat,{down:value,up:0}]),
      ...Object.entries(up).map(([stat,value])=>[stat,{up:value,down:0}]),
    ],statSortKey)
    const values=stats.map(([stat,buff])=>formatBuffValue(stat,buff,specialStats)).filter(Boolean)
    return values.length?[`- Enemy debuff on ${target}: ${values.join(', ')}`]:[]
  })
}

function sortBuffStats(entries,statSortKey){
  return entries
    .filter(([,buff])=>(buff?.up||0)>0||(buff?.down||0)>0)
    .sort(([a],[b])=>statSortKey?statSortKey(a)-statSortKey(b):a.localeCompare(b))
}

function formatBuffValue(stat,buff,specialStats){
  const parts=[]
  const up=buff?.up||0
  const down=buff?.down||0
  if(specialStats.has(stat)&&up>0) parts.push(`${fmt(up)}x`)
  else if(up>0) parts.push(`+${fmt(up)}%`)
  if(down>0) parts.push(`-${fmt(down)}%`)
  return parts.length?`${stat} ${parts.join('/')}`:''
}

function fmt(value){
  return Number.isInteger(value)?String(value):value.toFixed(1)
}

function buildCharacterImageLayout(ctx,character,url){
  const width=SKILL_IMAGE_WIDTH
  const margin=44
  const cardWidth=width-(margin*2)
  const skills=character?.skills||[]
  const skillLayouts=[]
  let y=190
  skills.forEach(skill=>{
    const skillLayout=measureSkill(ctx,skill,cardWidth)
    skillLayout.y=y
    skillLayouts.push(skillLayout)
    y+=skillLayout.height+18
  })
  if(!skills.length) y+=72
  y+=70
  return {width,height:y,margin,cardWidth,skillLayouts,url}
}

function buildTeamImageLayout(ctx,members,{title,side,url}){
  const width=TEAM_IMAGE_WIDTH
  const margin=28
  const gap=18
  const headerHeight=122
  const footerHeight=52
  const count=Math.max(1,Math.min(4,members.length||1))
  const colWidth=Math.floor((width-(margin*2)-(gap*(count-1)))/count)
  const memberLayouts=members.map((member,index)=>{
    const layout=measureTeamMember(ctx,member,colWidth)
    layout.x=margin+(index*(colWidth+gap))
    layout.y=headerHeight+24
    return layout
  })
  const columnHeight=Math.max(...memberLayouts.map(layout=>layout.height),240)
  const height=headerHeight+24+columnHeight+footerHeight+margin
  const sideColor=side==='attack'?'#c0392b':side==='defense'?'#1a5fa8':'#e07f48'
  const subtitle=members.length?members.map(member=>member.name_en).join(' / '):'No generals selected'
  return {width,height,margin,gap,headerHeight,footerHeight,colWidth,columnHeight,memberLayouts,title,url,sideColor,subtitle}
}

function measureTeamMember(ctx,member,width){
  const inner=width-28
  const headerHeight=112
  const skills=member?.skills||[]
  const skillLayouts=[]
  let y=headerHeight+14
  skills.forEach((skill,index)=>{
    const skillLayout=measureTeamSkill(ctx,skill,inner,index)
    skillLayout.x=14
    skillLayout.y=y
    skillLayouts.push(skillLayout)
    y+=skillLayout.height+9
  })
  if(!skills.length) y+=56
  y+=14
  return {member,width,height:y,skillLayouts,headerHeight}
}

function measureTeamSkill(ctx,skill,width,index){
  const inner=width-22
  const titleLines=wrapText(ctx,teamSkillTitle(skill,index),inner-62,'900 16px Segoe UI, Meiryo, sans-serif')
  const jpLines=skill.name_jp?wrapText(ctx,skill.name_jp,inner,'700 11px Segoe UI, Meiryo, sans-serif').slice(0,2):[]
  const headingHeight=14+(titleLines.length*19)+(jpLines.length*14)+10
  const effects=(skill.effects||[]).map(effect=>{
    const conditionLines=classifyConditionParts(effect.condition).flatMap(chip=>
      wrapText(ctx,`${chip.label}: ${chip.text}`,inner-18,'700 11px Segoe UI, Meiryo, sans-serif')
    )
    const bodyLines=wrapText(ctx,formatEffectCompact(effect),inner-18,'800 13px Segoe UI, Meiryo, sans-serif')
    const durationLines=effect.duration?wrapText(ctx,`Duration: ${effect.duration}`,inner-18,'700 10px Consolas, monospace'):[]
    const height=10+(conditionLines.length*14)+(conditionLines.length?4:0)+(bodyLines.length*17)+(durationLines.length?14:0)+8
    return {effect,conditionLines,bodyLines,durationLines,height}
  })
  const effectsHeight=effects.length?effects.reduce((sum,e)=>sum+e.height+6,0)+4:42
  return {skill,width,height:headingHeight+effectsHeight,titleLines,jpLines,effects,headingHeight}
}

function measureSkill(ctx,skill,width){
  const inner=width-40
  let h=70
  const effects=skill.effects||[]
  const measuredEffects=effects.map(effect=>{
    const qualifierLines=classifyConditionParts(effect.condition).flatMap(chip=>wrapText(ctx,`${chip.label}: ${chip.text}`,inner-28,'700 18px Segoe UI, Meiryo, sans-serif'))
    const bodyText=[effect.target||'Effect','->',effect.effect||'Translation pending'].join(' ')
    const bodyLines=wrapText(ctx,bodyText,inner-28,'800 24px Segoe UI, Meiryo, sans-serif')
    const durationLines=effect.duration?wrapText(ctx,effect.duration,inner-28,'700 17px Consolas, monospace'):[]
    const height=22+(qualifierLines.length*24)+(qualifierLines.length?8:0)+(bodyLines.length*30)+(durationLines.length?26:0)+18
    return {effect,qualifierLines,bodyLines,durationLines,height}
  })
  h+=measuredEffects.reduce((sum,e)=>sum+e.height+10,0)
  if(!effects.length) h+=48
  return {skill,measuredEffects,height:h,width}
}

async function drawCharacterSkillsImage(ctx,layout,character,url){
  const {width,height,margin,cardWidth}=layout
  const factionColor=FACTION_COLORS[character?.country]||'#7a4a24'
  ctx.fillStyle='#f7efe3'
  ctx.fillRect(0,0,width,height)
  drawTexture(ctx,width,height)

  ctx.fillStyle='#06264c'
  roundedRect(ctx,0,0,width,154,0)
  ctx.fill()
  ctx.fillStyle=factionColor
  ctx.fillRect(0,150,width,6)

  const portrait=await loadImage(character?.icon||persosThumb(character?.image))
  ctx.save()
  roundedRect(ctx,margin,34,86,86,16)
  ctx.clip()
  if(portrait) drawImageCover(ctx,portrait,margin,34,86,86)
  else{
    ctx.fillStyle=factionColor
    ctx.fillRect(margin,34,86,86)
    ctx.fillStyle='#fff'
    drawText(ctx,(character?.name_en||'?')[0],margin+43,89,'900 42px Segoe UI, sans-serif','#fff','center')
  }
  ctx.restore()
  ctx.strokeStyle='rgba(255,255,255,.35)'
  ctx.lineWidth=3
  roundedRect(ctx,margin,34,86,86,16)
  ctx.stroke()

  drawText(ctx,character?.name_en||'Unknown',margin+108,64,'950 38px Segoe UI, Meiryo, sans-serif','#fff')
  drawText(ctx,character?.name_jp||'',margin+108,94,'700 21px Segoe UI, Meiryo, sans-serif','rgba(255,255,255,.68)')
  drawText(ctx,[factionLabel(character?.country),character?.unit_type].filter(Boolean).join(' / '),margin+108,120,'800 18px Segoe UI, sans-serif',factionColor)
  drawText(ctx,'RanHQ Skill Card',width-margin,54,'900 20px Segoe UI, sans-serif','rgba(255,255,255,.86)','right')
  drawText(ctx,url,width-margin,84,'700 15px Segoe UI, sans-serif','rgba(255,255,255,.55)','right')

  if(!(character?.skills||[]).length){
    drawEmptyCard(ctx,margin,190,cardWidth)
  }else{
    layout.skillLayouts.forEach(skillLayout=>drawSkill(ctx,margin,skillLayout.y,skillLayout))
  }

  drawText(ctx,'ranhq.vercel.app',margin,height-34,'800 18px Segoe UI, sans-serif','#81562a')
  drawText(ctx,'Generated for Discord sharing',width-margin,height-34,'700 17px Segoe UI, sans-serif','#9a7b5a','right')
}

async function drawTeamSkillsImage(ctx,layout,{title,url}){
  const {width,height,margin,headerHeight,sideColor,subtitle,memberLayouts,columnHeight}=layout
  ctx.fillStyle='#f7efe3'
  ctx.fillRect(0,0,width,height)
  drawTexture(ctx,width,height)

  ctx.fillStyle='#06264c'
  roundedRect(ctx,0,0,width,headerHeight,0)
  ctx.fill()
  ctx.fillStyle=sideColor
  ctx.fillRect(0,headerHeight-6,width,6)
  ctx.fillStyle='rgba(255,255,255,.06)'
  ctx.fillRect(0,0,width,34)

  drawText(ctx,title||'RanHQ Team Skills',margin,48,'950 34px Segoe UI, Meiryo, sans-serif','#fff')
  wrapText(ctx,subtitle,width-margin*2-360,'800 17px Segoe UI, sans-serif').slice(0,2).forEach((line,index)=>{
    drawText(ctx,line,margin,78+(index*21),'800 17px Segoe UI, sans-serif','rgba(255,255,255,.72)')
  })
  drawText(ctx,'RanHQ Party Builder',width-margin,45,'900 18px Segoe UI, sans-serif','rgba(255,255,255,.86)','right')
  drawText(ctx,url,width-margin,72,'700 14px Segoe UI, sans-serif','rgba(255,255,255,.55)','right')
  drawText(ctx,'Skill toggles reflected from the current builder team',width-margin,98,'700 13px Segoe UI, sans-serif','rgba(255,255,255,.5)','right')

  for(const memberLayout of memberLayouts){
    await drawTeamMemberColumn(ctx,{...memberLayout,height:columnHeight})
  }

  drawText(ctx,'ranhq.vercel.app',margin,height-28,'800 17px Segoe UI, sans-serif','#81562a')
  drawText(ctx,'Team skill sheet for Discord sharing',width-margin,height-28,'700 16px Segoe UI, sans-serif','#9a7b5a','right')
}

async function drawTeamMemberColumn(ctx,layout){
  const {x,y,width,height,member,skillLayouts,headerHeight}=layout
  const factionColor=FACTION_COLORS[member?.country]||'#7a4a24'
  roundedRect(ctx,x,y,width,height,12)
  ctx.fillStyle='#fffdf8'
  ctx.fill()
  ctx.strokeStyle='rgba(90,60,30,.2)'
  ctx.lineWidth=1.5
  ctx.stroke()

  ctx.save()
  roundedRect(ctx,x,y,width,headerHeight,12)
  ctx.clip()
  ctx.fillStyle='#092f5f'
  ctx.fillRect(x,y,width,headerHeight)
  ctx.fillStyle=factionColor
  ctx.fillRect(x,y,7,headerHeight)
  ctx.restore()

  const portrait=await loadImage(member?.icon||persosThumb(member?.image))
  ctx.save()
  roundedRect(ctx,x+16,y+18,66,66,12)
  ctx.clip()
  if(portrait) drawImageCover(ctx,portrait,x+16,y+18,66,66)
  else{
    ctx.fillStyle=factionColor
    ctx.fillRect(x+16,y+18,66,66)
    drawText(ctx,(member?.name_en||'?')[0],x+49,y+62,'900 31px Segoe UI, sans-serif','#fff','center')
  }
  ctx.restore()
  ctx.strokeStyle='rgba(255,255,255,.32)'
  ctx.lineWidth=2
  roundedRect(ctx,x+16,y+18,66,66,12)
  ctx.stroke()

  const nameWidth=width-112
  const nameLines=wrapText(ctx,member?.name_en||'Unknown',nameWidth,'950 19px Segoe UI, Meiryo, sans-serif').slice(0,2)
  nameLines.forEach((line,index)=>drawText(ctx,line,x+94,y+38+(index*22),'950 19px Segoe UI, Meiryo, sans-serif','#fff'))
  drawText(ctx,member?.name_jp||'',x+94,y+86,'700 12px Segoe UI, Meiryo, sans-serif','rgba(255,255,255,.58)')
  drawText(ctx,[factionLabel(member?.country),member?.unit_type].filter(Boolean).join(' / '),x+16,y+102,'800 11px Segoe UI, sans-serif',lighten(factionColor))

  if(!skillLayouts.length){
    drawTeamEmpty(ctx,x+14,y+headerHeight+16,width-28)
  }else{
    skillLayouts.forEach(skillLayout=>drawTeamSkill(ctx,x+skillLayout.x,y+skillLayout.y,skillLayout))
  }
}

function drawTeamSkill(ctx,x,y,layout){
  const {skill,width,height,titleLines,jpLines,effects,headingHeight}=layout
  const typeColor=skill.star6?'#cc972d':TYPE_COLORS[skill.type]||'#777'
  roundedRect(ctx,x,y,width,height,9)
  ctx.fillStyle=skill.star6?'#fff8e6':'#fffaf2'
  ctx.fill()
  ctx.strokeStyle=skill.star6?'rgba(204,151,45,.55)':'rgba(208,184,152,.85)'
  ctx.lineWidth=1.4
  ctx.stroke()

  ctx.save()
  roundedRect(ctx,x,y,width,headingHeight,9)
  ctx.clip()
  ctx.fillStyle=darken(typeColor)
  ctx.fillRect(x,y,width,headingHeight)
  ctx.fillStyle=typeColor
  ctx.fillRect(x,y,6,headingHeight)
  ctx.restore()

  let ty=y+21
  titleLines.forEach(line=>{
    drawText(ctx,line,x+16,ty,'900 16px Segoe UI, Meiryo, sans-serif','#fff')
    ty+=19
  })
  jpLines.forEach(line=>{
    drawText(ctx,line,x+16,ty,'700 11px Segoe UI, Meiryo, sans-serif','rgba(255,255,255,.6)')
    ty+=14
  })
  const tagText=skill.star6?'CW6':skill.type||'Skill'
  drawTeamTag(ctx,tagText,x+width-14,y+13,typeColor)

  let cy=y+headingHeight+9
  if(!effects.length){
    drawText(ctx,'No translated effects yet.',x+16,cy+22,'700 13px Segoe UI, sans-serif','#7d6a53')
    return
  }
  effects.forEach(({conditionLines,bodyLines,durationLines,height:effectHeight})=>{
    roundedRect(ctx,x+11,cy,width-22,effectHeight,7)
    ctx.fillStyle='#fff'
    ctx.fill()
    ctx.strokeStyle='rgba(208,184,152,.65)'
    ctx.lineWidth=1
    ctx.stroke()
    drawText(ctx,'>',x+21,cy+21,'900 13px Consolas, monospace','#c0392b')
    let ey=cy+18
    conditionLines.forEach(line=>{
      drawText(ctx,line,x+38,ey,'700 11px Segoe UI, Meiryo, sans-serif','#7a4a24')
      ey+=14
    })
    if(conditionLines.length) ey+=4
    bodyLines.forEach((line,index)=>{
      drawText(ctx,line,x+38,ey,'800 13px Segoe UI, Meiryo, sans-serif',index===0?'#06264c':'#9a3925')
      ey+=17
    })
    durationLines.forEach(line=>{
      drawText(ctx,line,x+38,ey,'700 10px Consolas, monospace','#65513b')
      ey+=14
    })
    cy+=effectHeight+6
  })
}

function drawTeamEmpty(ctx,x,y,width){
  roundedRect(ctx,x,y,width,54,9)
  ctx.fillStyle='#fff7eb'
  ctx.fill()
  ctx.strokeStyle='rgba(208,184,152,.75)'
  ctx.stroke()
  drawText(ctx,'Translation pending',x+16,y+32,'800 14px Segoe UI, sans-serif','#7d6a53')
}

function drawTeamTag(ctx,text,rightX,y,color){
  ctx.font='900 10px Segoe UI, sans-serif'
  const w=Math.ceil(ctx.measureText(text).width)+16
  const x=rightX-w
  roundedRect(ctx,x,y,w,20,5)
  ctx.fillStyle=color
  ctx.fill()
  drawText(ctx,text,x+w/2,y+14,'900 10px Segoe UI, sans-serif','#fff','center')
}

function drawSkill(ctx,x,y,layout){
  const {skill,width,height,measuredEffects}=layout
  const typeColor=TYPE_COLORS[skill.type]||'#777'
  roundedRect(ctx,x,y,width,height,14)
  ctx.fillStyle='#fffdf8'
  ctx.fill()
  ctx.strokeStyle='rgba(90,60,30,.18)'
  ctx.lineWidth=2
  ctx.stroke()

  roundedRect(ctx,x,y,width,64,14)
  ctx.fillStyle=darken(typeColor)
  ctx.fill()
  ctx.fillStyle=typeColor
  ctx.fillRect(x,y,8,64)
  drawText(ctx,skill.name_en||skill.name||'Unnamed skill',x+24,y+29,'900 24px Segoe UI, Meiryo, sans-serif','#fff')
  drawText(ctx,skill.name_jp||'',x+24,y+52,'700 16px Segoe UI, Meiryo, sans-serif','rgba(255,255,255,.6)')
  drawTag(ctx,skill.type||'Skill',x+width-168,y+19,typeColor)
  if(skill.star6) drawTag(ctx,'6-star',x+width-254,y+19,'#cc972d')

  let cy=y+82
  if(!measuredEffects.length){
    drawText(ctx,'No translated effects yet.',x+24,cy+22,'700 20px Segoe UI, sans-serif','#7d6a53')
    return
  }
  measuredEffects.forEach(({qualifierLines,bodyLines,durationLines,height:effectHeight})=>{
    roundedRect(ctx,x+20,cy,width-40,effectHeight,10)
    ctx.fillStyle='#fff7eb'
    ctx.fill()
    ctx.strokeStyle='rgba(208,184,152,.75)'
    ctx.lineWidth=1.5
    ctx.stroke()
    let ey=cy+22
    qualifierLines.forEach(line=>{
      drawPillLine(ctx,line,x+34,ey)
      ey+=24
    })
    if(qualifierLines.length) ey+=8
    bodyLines.forEach((line,idx)=>{
      drawText(ctx,line,x+34,ey+20,idx===0?'900 22px Segoe UI, Meiryo, sans-serif':'800 21px Segoe UI, Meiryo, sans-serif',idx===0?'#06264c':'#c0392b')
      ey+=30
    })
    durationLines.forEach(line=>{
      drawText(ctx,line,x+34,ey+18,'800 17px Consolas, monospace','#65513b')
      ey+=24
    })
    cy+=effectHeight+10
  })
}

function drawEmptyCard(ctx,x,y,width){
  roundedRect(ctx,x,y,width,82,14)
  ctx.fillStyle='#fffdf8'
  ctx.fill()
  ctx.strokeStyle='rgba(90,60,30,.18)'
  ctx.stroke()
  drawText(ctx,'Translation pending',x+24,y+48,'800 23px Segoe UI, sans-serif','#7d6a53')
}

function drawTag(ctx,text,x,y,color){
  ctx.font='900 15px Segoe UI, sans-serif'
  const w=Math.ceil(ctx.measureText(text).width)+24
  roundedRect(ctx,x,y,w,28,7)
  ctx.fillStyle=`${color}33`
  ctx.fill()
  ctx.strokeStyle=`${color}88`
  ctx.lineWidth=1.5
  ctx.stroke()
  drawText(ctx,text,x+w/2,y+19,'900 15px Segoe UI, sans-serif','#fff','center')
}

function drawPillLine(ctx,line,x,y){
  const [label,...rest]=line.split(':')
  const value=rest.join(':').trim()
  ctx.font='900 14px Consolas, monospace'
  const labelW=Math.ceil(ctx.measureText(label).width)+18
  roundedRect(ctx,x,y-15,labelW,22,5)
  ctx.fillStyle='#e07f48'
  ctx.fill()
  drawText(ctx,label.toUpperCase(),x+labelW/2,y+1,'900 13px Consolas, monospace','#fff','center')
  drawText(ctx,value,x+labelW+10,y+2,'700 17px Segoe UI, Meiryo, sans-serif','#704315')
}

function drawText(ctx,text,x,y,font,color,align='left'){
  if(!text) return
  ctx.font=font
  ctx.fillStyle=color
  ctx.textAlign=align
  ctx.textBaseline='alphabetic'
  ctx.fillText(text,x,y)
}

function wrapText(ctx,text,maxWidth,font){
  if(!text) return []
  ctx.font=font
  const words=String(text).split(/\s+/).filter(Boolean)
  const lines=[]
  let line=''
  words.forEach(word=>{
    const test=line?`${line} ${word}`:word
    if(ctx.measureText(test).width<=maxWidth) line=test
    else{
      if(line) lines.push(line)
      line=fitWord(ctx,word,maxWidth,lines)
    }
  })
  if(line) lines.push(line)
  return lines
}

function fitWord(ctx,word,maxWidth,lines){
  if(ctx.measureText(word).width<=maxWidth) return word
  let part=''
  for(const ch of word){
    if(ctx.measureText(part+ch).width>maxWidth){
      if(part) lines.push(part)
      part=ch
    }else part+=ch
  }
  return part
}

function roundedRect(ctx,x,y,w,h,r){
  const radius=Math.min(r,w/2,h/2)
  ctx.beginPath()
  ctx.moveTo(x+radius,y)
  ctx.lineTo(x+w-radius,y)
  ctx.quadraticCurveTo(x+w,y,x+w,y+radius)
  ctx.lineTo(x+w,y+h-radius)
  ctx.quadraticCurveTo(x+w,y+h,x+w-radius,y+h)
  ctx.lineTo(x+radius,y+h)
  ctx.quadraticCurveTo(x,y+h,x,y+h-radius)
  ctx.lineTo(x,y+radius)
  ctx.quadraticCurveTo(x,y,x+radius,y)
  ctx.closePath()
}

function drawImageCover(ctx,img,x,y,w,h){
  const scale=Math.max(w/img.width,h/img.height)
  const sw=w/scale
  const sh=h/scale
  const sx=(img.width-sw)/2
  const sy=(img.height-sh)/5
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h)
}

function loadImage(src){
  return new Promise(resolve=>{
    if(!src){resolve(null);return}
    const img=new Image()
    img.crossOrigin='anonymous'
    img.onload=()=>resolve(img)
    img.onerror=()=>resolve(null)
    img.src=src
  })
}

function canvasToBlob(canvas){
  return new Promise((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not render image.')),'image/png')
  })
}

function persosThumb(img){
  return img&&img.startsWith('/persos/')?img.replace('/persos/','/persos/thumbs/'):img
}

function safeFileName(name){
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'ranhq-skills'
}

function factionLabel(country){
  return FACTION_LABELS[country]||country||''
}

function teamSkillTitle(skill,index){
  const name=skill?.name_en||skill?.name||'Unnamed skill'
  return skill?.star6?`CW6 Card Skill: ${name}`:`${index+1}. ${name}`
}

function formatEffectCompact(effect){
  const target=effect?.target||'Effect'
  const value=effect?.effect||'Translation pending'
  return `${target} -> ${value}`
}

function darken(hex){
  const value=hex.replace('#','')
  const n=parseInt(value.length===3?value.split('').map(ch=>ch+ch).join(''):value,16)
  const r=Math.max(10,Math.round(((n>>16)&255)*0.34))
  const g=Math.max(10,Math.round(((n>>8)&255)*0.34))
  const b=Math.max(10,Math.round((n&255)*0.34))
  return `rgb(${r},${g},${b})`
}

function lighten(hex){
  const value=hex.replace('#','')
  const n=parseInt(value.length===3?value.split('').map(ch=>ch+ch).join(''):value,16)
  const r=Math.min(255,Math.round(((n>>16)&255)*1.38))
  const g=Math.min(255,Math.round(((n>>8)&255)*1.38))
  const b=Math.min(255,Math.round((n&255)*1.38))
  return `rgb(${r},${g},${b})`
}

function drawTexture(ctx,width,height){
  ctx.save()
  ctx.globalAlpha=.08
  ctx.strokeStyle='#b58a55'
  for(let x=-height;x<width;x+=34){
    ctx.beginPath()
    ctx.moveTo(x,0)
    ctx.lineTo(x+height,height)
    ctx.stroke()
  }
  ctx.restore()
}
