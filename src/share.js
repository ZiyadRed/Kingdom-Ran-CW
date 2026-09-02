import { classifyConditionParts } from './skillConditions.js'
import { absoluteUrl } from './seo.js'

export const DISCORD_MESSAGE_LIMIT = 1900
export const SKILL_IMAGE_WIDTH = 1080
export const TEAM_IMAGE_WIDTH = 1800
const TYPE_COLORS = {Combat:'#c0392b',Strategy:'#3d6eb5',Leader:'#e07f48',Strategist:'#16a085','Internal Affairs':'#1a8a72'}
const FACTION_COLORS = {qin:'#c0392b',zhao:'#2471a3',chu:'#8e44ad',wei:'#d19a2a',yan:'#1a8a72',han:'#6a4fc8',ai:'#b05070',qi:'#8a6a2a',mountain_folk:'#7d8a35',other:'#888'}
const FACTION_LABELS = {qin:'Qin',zhao:'Zhao',chu:'Chu',wei:'Wei',yan:'Yan',han:'Han',ai:'Ai',qi:'Qi',mountain_folk:'Mountain Folk',other:'Other'}
const displayName=entity=>entity?.displayName||entity?.name_en||entity?.name||''

/**
 * The Japanese line under a name exists to pair the localized name with the
 * game's own. In Japanese output the localized name IS the source name, so
 * emitting both prints it twice — return nothing in that case.
 */
const sourceLine=(primary,japanese)=>{
  const jp=japanese==null?'':String(japanese).trim()
  if(!jp) return ''
  return String(primary==null?'':primary).trim()===jp?'':jp
}
const skillEffects=skill=>skill?.displayEffects||skill?.effects||[]

/**
 * Chrome shown on generated share output.
 *
 * A share image is posted straight into Discord, so its wording is as
 * user-visible as anything on the page. Callers pass a translated bundle;
 * these English strings are the fallback when none is supplied.
 *
 * Canvas geometry is mirrored when `direction` is `rtl`; logical team order
 * remains untouched so every skill stays associated with its original slot.
 */
export const DEFAULT_SHARE_LABELS={
  skillCard:'RanHQ Skill Card',
  generatedFor:'Generated for Discord sharing',
  partyBuilder:'RanHQ Party Builder',
  builderNote:'Skill toggles reflected from the current builder team',
  teamSheet:'Team skill sheet for Discord sharing',
  teamSkills:'RanHQ Team Skills',
  noEffects:'No translated effects yet.',
  translationPending:'Translation pending',
  attackingFormation:'Attacking Formation',
  defendingFormation:'Defending Formation',
  duration:'Duration',
  effect:'Effect',
  skill:'Skill',
  star6:'6-star',
  unnamedSkill:'Unnamed skill',
  noGenerals:'No generals selected',
  teamBuffSummary:'RanHQ Team Buff Summary',
  withCombat:'Strategy + combat skill effects included.',
  strategyOnly:'Strategy skills only.',
  noRelevantBuffs:'No relevant buffs.',
  enemyDebuffOn:'Enemy debuff on',
  sceneCardSkill:'CW6 Card Skill',
  // Base paragraph direction for canvas text. The page's dir="rtl" does NOT
  // reach a detached canvas, so bidi inside each fillText call would otherwise
  // resolve left-to-right and misorder mixed Arabic/number/Latin strings.
  // Only the resolution changes: every draw uses explicit left/right alignment
  // at absolute coordinates, so the layout geometry is untouched.
  direction:'ltr',
  team:'Team',
  conditions:{},
  // English term -> localized term, for faction, unit type and skill type.
  terms:{},
  // Optional runtime resolver for dynamic buff stats and normalized targets.
  localizeTerm:null,
}
const withLabels=labels=>({...DEFAULT_SHARE_LABELS,...(labels||{})})
const chipLabel=(labels,chip)=>labels.conditions?.[chip.label]||chip.label
const term=(labels,value)=>{
  if(!value) return value
  const localized=typeof labels.localizeTerm==='function'?labels.localizeTerm(value):null
  return localized||labels.terms?.[value]||value
}

/** Set the canvas base paragraph direction so bidi resolves per the locale. */
function applyDirection(ctx,labels){
  if(!ctx) return
  try{ ctx.direction=labels?.direction==='rtl'?'rtl':'ltr' }catch{ /* older engines */ }
}

export async function shareText({title='RanHQ',text,promptLabel='Copy this RanHQ share text:'}){
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
    window.prompt(promptLabel,text)
    return 'prompt'
  }
  throw new Error('No share target available')
}

export function characterShareUrl(character, localeCode='en'){
  return absoluteUrl(`/archive/characters/${character?.id||''}`, localeCode)
}

export function builderShareUrl(localeCode='en'){
  return absoluteUrl('/builder', localeCode)
}

export function sceneCardShareUrl(localeCode='en'){
  return absoluteUrl('/archive/cw6-scene-cards', localeCode)
}

export async function createCharacterSkillsImage(character,{url=characterShareUrl(character),labels}={}){
  const L=withLabels(labels)
  if(typeof document==='undefined') throw new Error('Image rendering requires a browser.')
  const measureCanvas=document.createElement('canvas')
  const measure=measureCanvas.getContext('2d')
  applyDirection(measure,L)
  const layout=buildCharacterImageLayout(measure,character,url,L)
  const scale=Math.max(2,Math.min(3,window.devicePixelRatio||2))
  const canvas=document.createElement('canvas')
  canvas.width=layout.width*scale
  canvas.height=layout.height*scale
  canvas.style.width=`${layout.width}px`
  canvas.style.height=`${layout.height}px`
  const ctx=canvas.getContext('2d')
  ctx.scale(scale,scale)
  applyDirection(ctx,L)
  await drawCharacterSkillsImage(ctx,layout,character,url,L)
  const blob=await canvasToBlob(canvas)
  return {
    blob,
    fileName:`${safeFileName(displayName(character)||'ranhq-skills')}-skills.png`,
  }
}

export async function createTeamSkillsImage({team=[],title,side='team',url=builderShareUrl(),labels}={}){
  const L=withLabels(labels)
  if(typeof document==='undefined') throw new Error('Image rendering requires a browser.')
  const members=(team||[]).filter(Boolean).slice(0,4)
  const measureCanvas=document.createElement('canvas')
  const measure=measureCanvas.getContext('2d')
  applyDirection(measure,L)
  const layout=buildTeamImageLayout(measure,members,{title:title||L.teamSkills,side,url,labels:L})
  const scale=Math.max(1.25,Math.min(2,window.devicePixelRatio||1.5))
  const canvas=document.createElement('canvas')
  canvas.width=Math.ceil(layout.width*scale)
  canvas.height=Math.ceil(layout.height*scale)
  canvas.style.width=`${layout.width}px`
  canvas.style.height=`${layout.height}px`
  const ctx=canvas.getContext('2d')
  ctx.scale(scale,scale)
  applyDirection(ctx,L)
  await drawTeamSkillsImage(ctx,layout,{title:title||L.teamSkills,side,url,labels:L})
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

const characterSkillsWithRole=character=>[
  ...(character?.skills||[]),
  ...(character?.roleSkill?[character.roleSkill]:[]),
]

export function formatCharacterSkillsShare(character,{url=characterShareUrl(character),maxLength=DISCORD_MESSAGE_LIMIT,labels}={}){
  const L=withLabels(labels)
  const skills=characterSkillsWithRole(character)
  const faction=[term(L,factionLabel(character?.country)), term(L,character?.unit_type)].filter(Boolean).join(' / ')
  const lines=[
    `**RanHQ Skills: ${displayName(character)||'Unknown'}**`,
    [sourceLine(displayName(character),character?.name_jp), faction].filter(Boolean).join(' - '),
    `<${url}>`,
    '',
  ]

  if(!skills.length){
    lines.push(`${L.translationPending}.`)
  }else{
    skills.forEach((skill,idx)=>{
      const title=[`${idx+1}. ${displayName(skill)}`, skill.type&&`[${term(L,skill.type)}]`, skill.star6&&`[${L.star6}]`].filter(Boolean).join(' ')
      lines.push(`**${title}**`)
      const skillSource=sourceLine(displayName(skill),skill.name_jp)
      if(skillSource) lines.push(`_${skillSource}_`)
      const effects=skillEffects(skill)
      if(!effects.length) lines.push(`- ${L.noEffects}`)
      effects.forEach(effect=>lines.push(`- ${formatEffectForShare(effect)}`))
      lines.push('')
    })
  }

  return limitDiscordMessage(lines.join('\n').trim(),url,maxLength)
}

export function formatSceneCardShare(card,{url=sceneCardShareUrl(),maxLength=DISCORD_MESSAGE_LIMIT,labels}={}){
  const L=withLabels(labels)
  const skill=card?.skill||{}
  const skillName=displayName(skill)||card?.skill_en||L.unnamedSkill
  const skillJp=sourceLine(skillName,skill.name_jp||card?.skill_jp)
  const details=[card?.ownerName,term(L,skill.type),skill.star6&&L.star6].filter(Boolean).join(' - ')
  const lines=[
    `**RanHQ CW6 Scene Card: ${skillName}**`,
    details,
    `<${url}>`,
    '',
    `**${skillName}**`,
  ]
  if(skillJp) lines.push(`_${skillJp}_`)
  const effects=skillEffects(skill)
  if(!effects.length) lines.push(`- ${L.noEffects}`)
  effects.forEach(effect=>lines.push(`- ${formatEffectForShare(effect)}`))
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
  labels,
}={}){
  const L=withLabels(labels)
  const lines=[
    `**${L.teamBuffSummary}**`,
    includeCombat?L.withCombat:L.strategyOnly,
    `<${url}>`,
    '',
    ...formatBuffSideForShare(L.attackingFormation,atk,atkBuffs,atkEnemyDebuffs,{specialStats,statSortKey,labels:L}),
    '',
    ...formatBuffSideForShare(L.defendingFormation,def,defBuffs,defEnemyDebuffs,{specialStats,statSortKey,labels:L}),
  ]
  return limitDiscordMessage(lines.join('\n').trim(),url,maxLength)
}

export function formatEffectForShare(effect,labels){
  const L=withLabels(labels)
  const target=effect?.target||L.effect
  const value=effect?.effect||L.translationPending
  const duration=effect?.duration?` (${effect.duration})`:''
  const qualifiers=formatQualifiers(effect?.condition)
  // '->' is left as ASCII on purpose: '>' is bidi-mirrored, so the same string
  // reads as a left arrow inside an RTL run without per-locale branching, and
  // English output is unchanged.
  return `${target} -> ${value}${duration}${qualifiers?` | ${qualifiers}`:''}`
}

export function formatQualifiers(condition,labels){
  const L=withLabels(labels)
  return classifyConditionParts(condition).map(chip=>`${chipLabel(L,chip)}: ${chip.text}`).join('; ')
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
  const L=withLabels(opts?.labels)
  const lines=[`**${title}**`]
  lines.push(`${L.team}: ${team.length?team.map((g,i)=>`${i+1}. ${displayName(g)}`).join(' / '):L.noGenerals}`)
  const buffLines=formatEntryBuffs(entries,opts)
  const debuffLines=formatEnemyDebuffs(enemyDebuffs,opts)
  if(!buffLines.length&&!debuffLines.length) lines.push(`- ${L.noRelevantBuffs}`)
  else lines.push(...buffLines,...debuffLines)
  return lines
}

function formatEntryBuffs(entries,{specialStats,statSortKey,labels}){
  const L=withLabels(labels)
  return entries.flatMap(({general,buffs})=>{
    const stats=sortBuffStats(Object.entries(buffs||{}),statSortKey)
    if(!stats.length) return []
    const values=stats.map(([stat,buff])=>formatBuffValue(stat,buff,specialStats,L)).filter(Boolean)
    return values.length?[`- ${displayName(general)}: ${values.join(', ')}`]:[]
  })
}

function formatEnemyDebuffs(enemyDebuffs,{specialStats,statSortKey,labels}){
  const L=withLabels(labels)
  return Object.entries(enemyDebuffs||{}).flatMap(([target,{up={},down={}}])=>{
    const stats=sortBuffStats([
      ...Object.entries(down).map(([stat,value])=>[stat,{down:value,up:0}]),
      ...Object.entries(up).map(([stat,value])=>[stat,{up:value,down:0}]),
    ],statSortKey)
    const values=stats.map(([stat,buff])=>formatBuffValue(stat,buff,specialStats,L)).filter(Boolean)
    return values.length?[`- ${L.enemyDebuffOn} ${term(L,target)}: ${values.join(', ')}`]:[]
  })
}

function sortBuffStats(entries,statSortKey){
  return entries
    .filter(([,buff])=>(buff?.up||0)>0||(buff?.down||0)>0)
    .sort(([a],[b])=>statSortKey?statSortKey(a)-statSortKey(b):a.localeCompare(b))
}

function formatBuffValue(stat,buff,specialStats,labels){
  const L=withLabels(labels)
  const parts=[]
  const up=buff?.up||0
  const down=buff?.down||0
  if(specialStats.has(stat)&&up>0) parts.push(`${fmt(up)}x`)
  else if(up>0) parts.push(`+${fmt(up)}%`)
  if(down>0) parts.push(`-${fmt(down)}%`)
  return parts.length?`${term(L,stat)} ${parts.join('/')}`:''
}

function fmt(value){
  return Number.isInteger(value)?String(value):value.toFixed(1)
}

function buildCharacterImageLayout(ctx,character,url,L=DEFAULT_SHARE_LABELS){
  const width=SKILL_IMAGE_WIDTH
  const margin=44
  const cardWidth=width-(margin*2)
  const skills=characterSkillsWithRole(character)
  const skillLayouts=[]
  let y=190
  skills.forEach(skill=>{
    const skillLayout=measureSkill(ctx,skill,cardWidth,L)
    skillLayout.y=y
    skillLayouts.push(skillLayout)
    y+=skillLayout.height+18
  })
  if(!skills.length) y+=72
  y+=70
  return {width,height:y,margin,cardWidth,skillLayouts,url}
}

function buildTeamImageLayout(ctx,members,{title,side,url,labels:L=DEFAULT_SHARE_LABELS}){
  const width=TEAM_IMAGE_WIDTH
  const margin=28
  const gap=18
  const headerHeight=122
  const footerHeight=52
  const count=Math.max(1,Math.min(4,members.length||1))
  const presentation=teamImagePresentationLayout({count,direction:L.direction,width,margin,gap})
  const {colWidth}=presentation
  const memberLayouts=members.map((member,index)=>{
    const layout=measureTeamMember(ctx,member,colWidth,L)
    layout.x=presentation.columnX[index]
    layout.y=headerHeight+24
    return layout
  })
  const columnHeight=Math.max(...memberLayouts.map(layout=>layout.height),240)
  const height=headerHeight+24+columnHeight+footerHeight+margin
  const sideColor=side==='attack'?'#c0392b':side==='defense'?'#1a5fa8':'#e07f48'
  const subtitle=members.length?members.map(member=>displayName(member)).join(' / '):L.noGenerals
  return {width,height,margin,gap,headerHeight,footerHeight,colWidth,columnHeight,memberLayouts,title,url,sideColor,subtitle,...presentation}
}

/** Pure geometry contract used by canvas rendering and RTL regression tests. */
export function teamImagePresentationLayout({count,direction='ltr',width=TEAM_IMAGE_WIDTH,margin=28,gap=18}){
  const normalizedCount=Math.max(1,Math.min(4,Number(count)||1))
  const rtl=direction==='rtl'
  const colWidth=Math.floor((width-(margin*2)-(gap*(normalizedCount-1)))/normalizedCount)
  const columnX=Array.from({length:normalizedCount},(_,logicalIndex)=>{
    const visualIndex=rtl?normalizedCount-1-logicalIndex:logicalIndex
    return margin+(visualIndex*(colWidth+gap))
  })
  return {
    rtl,
    colWidth,
    columnX,
    primaryAnchor:{x:rtl?width-margin:margin,align:rtl?'right':'left'},
    secondaryAnchor:{x:rtl?margin:width-margin,align:rtl?'left':'right'},
  }
}

function measureTeamMember(ctx,member,width,L=DEFAULT_SHARE_LABELS){
  const inner=width-28
  const headerHeight=112
  const skills=member?.skills||[]
  const skillLayouts=[]
  let y=headerHeight+14
  skills.forEach((skill,index)=>{
    const skillLayout=measureTeamSkill(ctx,skill,inner,index,L)
    skillLayout.x=14
    skillLayout.y=y
    skillLayouts.push(skillLayout)
    y+=skillLayout.height+9
  })
  if(!skills.length) y+=56
  y+=14
  return {member,width,height:y,skillLayouts,headerHeight,labels:L}
}

function measureTeamSkill(ctx,skill,width,index,L=DEFAULT_SHARE_LABELS){
  const inner=width-22
  const titleLines=wrapText(ctx,teamSkillTitle(skill,index,L),inner-62,'900 16px Segoe UI, Meiryo, sans-serif')
  const skillSource=sourceLine(displayName(skill),skill.name_jp)
  const jpLines=skillSource?wrapText(ctx,skillSource,inner,'700 11px Segoe UI, Meiryo, sans-serif').slice(0,2):[]
  const headingHeight=14+(titleLines.length*19)+(jpLines.length*14)+10
  const effects=skillEffects(skill).map(effect=>{
    const conditionLines=classifyConditionParts(effect.condition).flatMap(chip=>
      wrapText(ctx,`${chipLabel(L,chip)}: ${chip.text}`,inner-18,'700 11px Segoe UI, Meiryo, sans-serif')
    )
    const bodyLines=wrapText(ctx,formatEffectCompact(effect,L),inner-18,'800 13px Segoe UI, Meiryo, sans-serif')
    const durationLines=effect.duration?wrapText(ctx,`${L.duration}: ${effect.duration}`,inner-18,'700 10px Consolas, monospace'):[]
    const height=10+(conditionLines.length*14)+(conditionLines.length?4:0)+(bodyLines.length*17)+(durationLines.length?14:0)+8
    return {effect,conditionLines,bodyLines,durationLines,height}
  })
  const effectsHeight=effects.length?effects.reduce((sum,e)=>sum+e.height+6,0)+4:42
  return {skill,width,height:headingHeight+effectsHeight,titleLines,jpLines,effects,headingHeight,labels:L}
}

function measureSkill(ctx,skill,width,L=DEFAULT_SHARE_LABELS){
  const inner=width-40
  let h=70
  const effects=skillEffects(skill)
  const measuredEffects=effects.map(effect=>{
    const qualifierLines=classifyConditionParts(effect.condition).flatMap(chip=>wrapText(ctx,`${chipLabel(L,chip)}: ${chip.text}`,inner-28,'700 18px Segoe UI, Meiryo, sans-serif'))
    const bodyText=[effect.target||L.effect,'->',effect.effect||L.translationPending].join(' ')
    const bodyLines=wrapText(ctx,bodyText,inner-28,'800 24px Segoe UI, Meiryo, sans-serif')
    const durationLines=effect.duration?wrapText(ctx,effect.duration,inner-28,'700 17px Consolas, monospace'):[]
    const height=22+(qualifierLines.length*24)+(qualifierLines.length?8:0)+(bodyLines.length*30)+(durationLines.length?26:0)+18
    return {effect,qualifierLines,bodyLines,durationLines,height}
  })
  h+=measuredEffects.reduce((sum,e)=>sum+e.height+10,0)
  if(!effects.length) h+=48
  return {skill,measuredEffects,height:h,width,labels:L}
}

async function drawCharacterSkillsImage(ctx,layout,character,url,L=DEFAULT_SHARE_LABELS){
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

  drawText(ctx,displayName(character)||'Unknown',margin+108,64,'950 38px Segoe UI, Meiryo, sans-serif','#fff')
  drawText(ctx,sourceLine(displayName(character),character?.name_jp),margin+108,94,'700 21px Segoe UI, Meiryo, sans-serif','rgba(255,255,255,.68)')
  drawText(ctx,[term(L,factionLabel(character?.country)),term(L,character?.unit_type)].filter(Boolean).join(' / '),margin+108,120,'800 18px Segoe UI, sans-serif',factionColor)
  drawText(ctx,L.skillCard,width-margin,54,'900 20px Segoe UI, sans-serif','rgba(255,255,255,.86)','right')
  drawText(ctx,url,width-margin,84,'700 15px Segoe UI, sans-serif','rgba(255,255,255,.55)','right')

  if(!characterSkillsWithRole(character).length){
    drawEmptyCard(ctx,margin,190,cardWidth,L)
  }else{
    layout.skillLayouts.forEach(skillLayout=>drawSkill(ctx,margin,skillLayout.y,skillLayout))
  }

  drawText(ctx,'ranhq.vercel.app',margin,height-34,'800 18px Segoe UI, sans-serif','#81562a')
  drawText(ctx,L.generatedFor,width-margin,height-34,'700 17px Segoe UI, sans-serif','#9a7b5a','right')
}

async function drawTeamSkillsImage(ctx,layout,{title,url,labels:L=DEFAULT_SHARE_LABELS}){
  const {width,height,margin,headerHeight,sideColor,subtitle,memberLayouts,columnHeight,primaryAnchor,secondaryAnchor}=layout
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

  drawText(ctx,title||L.teamSkills,primaryAnchor.x,48,'950 34px Segoe UI, Meiryo, sans-serif','#fff',primaryAnchor.align)
  wrapText(ctx,subtitle,width-margin*2-360,'800 17px Segoe UI, sans-serif').slice(0,2).forEach((line,index)=>{
    drawText(ctx,line,primaryAnchor.x,78+(index*21),'800 17px Segoe UI, sans-serif','rgba(255,255,255,.72)',primaryAnchor.align)
  })
  drawText(ctx,L.partyBuilder,secondaryAnchor.x,45,'900 18px Segoe UI, sans-serif','rgba(255,255,255,.86)',secondaryAnchor.align)
  drawText(ctx,url,secondaryAnchor.x,72,'700 14px Segoe UI, sans-serif','rgba(255,255,255,.55)',secondaryAnchor.align)
  drawText(ctx,L.builderNote,secondaryAnchor.x,98,'700 13px Segoe UI, sans-serif','rgba(255,255,255,.5)',secondaryAnchor.align)

  for(const memberLayout of memberLayouts){
    await drawTeamMemberColumn(ctx,{...memberLayout,height:columnHeight})
  }

  drawText(ctx,'ranhq.vercel.app',secondaryAnchor.x,height-28,'800 17px Segoe UI, sans-serif','#81562a',secondaryAnchor.align)
  drawText(ctx,L.teamSheet,primaryAnchor.x,height-28,'700 16px Segoe UI, sans-serif','#9a7b5a',primaryAnchor.align)
}

async function drawTeamMemberColumn(ctx,layout){
  const L=layout.labels||DEFAULT_SHARE_LABELS
  const {x,y,width,height,member,skillLayouts,headerHeight}=layout
  const rtl=L.direction==='rtl'
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
  ctx.fillRect(rtl?x+width-7:x,y,7,headerHeight)
  ctx.restore()

  const portrait=await loadImage(member?.icon||persosThumb(member?.image))
  ctx.save()
  const portraitX=rtl?x+width-82:x+16
  roundedRect(ctx,portraitX,y+18,66,66,12)
  ctx.clip()
  if(portrait) drawImageCover(ctx,portrait,portraitX,y+18,66,66)
  else{
    ctx.fillStyle=factionColor
    ctx.fillRect(portraitX,y+18,66,66)
    drawText(ctx,(member?.name_en||'?')[0],portraitX+33,y+62,'900 31px Segoe UI, sans-serif','#fff','center')
  }
  ctx.restore()
  ctx.strokeStyle='rgba(255,255,255,.32)'
  ctx.lineWidth=2
  roundedRect(ctx,portraitX,y+18,66,66,12)
  ctx.stroke()

  const nameWidth=width-112
  const nameLines=wrapText(ctx,displayName(member)||'Unknown',nameWidth,'950 19px Segoe UI, Meiryo, sans-serif').slice(0,2)
  const nameX=rtl?x+width-94:x+94
  const textAlign=rtl?'right':'left'
  nameLines.forEach((line,index)=>drawText(ctx,line,nameX,y+38+(index*22),'950 19px Segoe UI, Meiryo, sans-serif','#fff',textAlign))
  drawText(ctx,sourceLine(displayName(member),member?.name_jp),nameX,y+86,'700 12px Segoe UI, Meiryo, sans-serif','rgba(255,255,255,.58)',textAlign)
  drawText(ctx,[term(L,factionLabel(member?.country)),term(L,member?.unit_type)].filter(Boolean).join(' / '),rtl?x+width-16:x+16,y+102,'800 11px Segoe UI, sans-serif',lighten(factionColor),textAlign)

  if(!skillLayouts.length){
    drawTeamEmpty(ctx,x+14,y+headerHeight+16,width-28,layout.labels||DEFAULT_SHARE_LABELS)
  }else{
    skillLayouts.forEach(skillLayout=>drawTeamSkill(ctx,x+skillLayout.x,y+skillLayout.y,skillLayout))
  }
}

function drawTeamSkill(ctx,x,y,layout){
  const L=layout.labels||DEFAULT_SHARE_LABELS
  const rtl=L.direction==='rtl'
  const textAlign=rtl?'right':'left'
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
  ctx.fillRect(rtl?x+width-6:x,y,6,headingHeight)
  ctx.restore()

  let ty=y+21
  titleLines.forEach(line=>{
    drawText(ctx,line,rtl?x+width-16:x+16,ty,'900 16px Segoe UI, Meiryo, sans-serif','#fff',textAlign)
    ty+=19
  })
  jpLines.forEach(line=>{
    drawText(ctx,line,rtl?x+width-16:x+16,ty,'700 11px Segoe UI, Meiryo, sans-serif','rgba(255,255,255,.6)',textAlign)
    ty+=14
  })
  const tagText=skill.star6?'CW6':term(L,skill.type)||L.skill
  drawTeamTag(ctx,tagText,rtl?x+14:x+width-14,y+13,typeColor,rtl?'left':'right')

  let cy=y+headingHeight+9
  if(!effects.length){
    drawText(ctx,L.noEffects,rtl?x+width-16:x+16,cy+22,'700 13px Segoe UI, sans-serif','#7d6a53',textAlign)
    return
  }
  effects.forEach(({conditionLines,bodyLines,durationLines,height:effectHeight})=>{
    roundedRect(ctx,x+11,cy,width-22,effectHeight,7)
    ctx.fillStyle='#fff'
    ctx.fill()
    ctx.strokeStyle='rgba(208,184,152,.65)'
    ctx.lineWidth=1
    ctx.stroke()
    drawText(ctx,rtl?'<':'>',rtl?x+width-21:x+21,cy+21,'900 13px Consolas, monospace','#c0392b',rtl?'right':'left')
    let ey=cy+18
    conditionLines.forEach(line=>{
      drawText(ctx,line,rtl?x+width-38:x+38,ey,'700 11px Segoe UI, Meiryo, sans-serif','#7a4a24',textAlign)
      ey+=14
    })
    if(conditionLines.length) ey+=4
    bodyLines.forEach((line,index)=>{
      drawText(ctx,line,rtl?x+width-38:x+38,ey,'800 13px Segoe UI, Meiryo, sans-serif',index===0?'#06264c':'#9a3925',textAlign)
      ey+=17
    })
    durationLines.forEach(line=>{
      drawText(ctx,line,rtl?x+width-38:x+38,ey,'700 10px Consolas, monospace','#65513b',textAlign)
      ey+=14
    })
    cy+=effectHeight+6
  })
}

function drawTeamEmpty(ctx,x,y,width,L=DEFAULT_SHARE_LABELS){
  roundedRect(ctx,x,y,width,54,9)
  ctx.fillStyle='#fff7eb'
  ctx.fill()
  ctx.strokeStyle='rgba(208,184,152,.75)'
  ctx.stroke()
  const rtl=L.direction==='rtl'
  drawText(ctx,L.translationPending,rtl?x+width-16:x+16,y+32,'800 14px Segoe UI, sans-serif','#7d6a53',rtl?'right':'left')
}

function drawTeamTag(ctx,text,anchorX,y,color,side='right'){
  ctx.font='900 10px Segoe UI, sans-serif'
  const w=Math.ceil(ctx.measureText(text).width)+16
  const x=side==='left'?anchorX:anchorX-w
  roundedRect(ctx,x,y,w,20,5)
  ctx.fillStyle=color
  ctx.fill()
  drawText(ctx,text,x+w/2,y+14,'900 10px Segoe UI, sans-serif','#fff','center')
}

function drawSkill(ctx,x,y,layout){
  const L=layout.labels||DEFAULT_SHARE_LABELS
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
  drawText(ctx,displayName(skill)||L.unnamedSkill,x+24,y+29,'900 24px Segoe UI, Meiryo, sans-serif','#fff')
  drawText(ctx,sourceLine(displayName(skill),skill.name_jp),x+24,y+52,'700 16px Segoe UI, Meiryo, sans-serif','rgba(255,255,255,.6)')
  drawTag(ctx,term(L,skill.type)||L.skill,x+width-168,y+19,typeColor)
  if(skill.star6) drawTag(ctx,L.star6,x+width-254,y+19,'#cc972d')

  let cy=y+82
  if(!measuredEffects.length){
    drawText(ctx,L.noEffects,x+24,cy+22,'700 20px Segoe UI, sans-serif','#7d6a53')
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

function drawEmptyCard(ctx,x,y,width,L=DEFAULT_SHARE_LABELS){
  roundedRect(ctx,x,y,width,82,14)
  ctx.fillStyle='#fffdf8'
  ctx.fill()
  ctx.strokeStyle='rgba(90,60,30,.18)'
  ctx.stroke()
  drawText(ctx,L.translationPending,x+24,y+48,'800 23px Segoe UI, sans-serif','#7d6a53')
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

function teamSkillTitle(skill,index,labels){
  const L=withLabels(labels)
  const name=displayName(skill)||L.unnamedSkill
  return skill?.star6?`${L.sceneCardSkill}: ${name}`:`${index+1}. ${name}`
}

function formatEffectCompact(effect,labels){
  const L=withLabels(labels)
  const target=effect?.target||L.effect
  const value=effect?.effect||L.translationPending
  // '->' is left as ASCII on purpose: '>' is bidi-mirrored, so the same string
  // reads as a left arrow inside an RTL run without any per-locale branching,
  // and English output is unchanged.
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
