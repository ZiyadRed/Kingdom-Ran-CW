import { classifyConditionParts, splitConditionParts } from './skillConditions.js'
import { absoluteUrl } from './seo.js'
import { encodeBuilderShareSearch } from './builder-share.js'

export const DISCORD_MESSAGE_LIMIT = 1900
export const SKILL_IMAGE_WIDTH = 1080
export const TEAM_IMAGE_WIDTH = 1800
const FACTION_COLORS = {qin:'#c0392b',zhao:'#2471a3',chu:'#8e44ad',wei:'#d19a2a',yan:'#1a8a72',han:'#6a4fc8',ai:'#b05070',qi:'#8a6a2a',mountain_folk:'#7d8a35',other:'#888'}
const FACTION_LABELS = {qin:'Qin',zhao:'Zhao',chu:'Chu',wei:'Wei',yan:'Yan',han:'Han',ai:'Ai',qi:'Qi',mountain_folk:'Mountain Folk',other:'Other'}
const displayName=entity=>entity?.displayName||entity?.name_en||entity?.name||''

/**
 * Shared semantic design tokens for every generated PNG. Skill/faction colors
 * are accents only; readable foregrounds are selected independently.
 */
export const SHARE_IMAGE_TOKENS=Object.freeze({
  colors:Object.freeze({
    parchment:'#f7efe3',navy:'#08294f',navyRaised:'#102f54',skillSurface:'#fffdf8',
    effectSurface:'#fff9f0',border:'#d8c5a8',text:'#102a43',secondary:'#5f513f',
    sourceOnDark:'#c8d6e5',metaOnDark:'#e5edf5',condition:'#6f3b17',
    conditionSurface:'#f4ddc9',conditionBorder:'#d9955f',duration:'#594b3b',
    brand:'#75502d',attack:'#b9342b',defense:'#235e9a',cw6:'#b98516',cw6Surface:'#f5dda0',
  }),
  spacing:Object.freeze({xs:6,sm:10,md:16,lg:24,xl:32}),
  radius:Object.freeze({badge:6,effect:9,skill:14,column:14}),
})

const SKILL_TYPE_VISUALS=Object.freeze({
  Combat:Object.freeze({accent:'#b9342b',badge:'#f4d9d6',text:'#6f1d18'}),
  Strategy:Object.freeze({accent:'#3d6eb5',badge:'#dce8f7',text:'#173f73'}),
  Leader:Object.freeze({accent:'#c76530',badge:'#f7dfd2',text:'#693013'}),
  Strategist:Object.freeze({accent:'#16806e',badge:'#d9eee9',text:'#0c5145'}),
  'Internal Affairs':Object.freeze({accent:'#167460',badge:'#d8ece7',text:'#0b4b3e'}),
})
const UNKNOWN_SKILL_VISUAL=Object.freeze({accent:'#687386',badge:'#e5e9ef',text:'#303a49'})

export function skillTypeVisual(type){
  return SKILL_TYPE_VISUALS[type]||UNKNOWN_SKILL_VISUAL
}

const hexRgb=hex=>{
  const value=String(hex||'').replace('#','')
  if(!/^[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value)) return null
  const full=value.length===3?value.split('').map(part=>part+part).join(''):value
  const number=parseInt(full,16)
  return[(number>>16)&255,(number>>8)&255,number&255]
}
export function contrastRatio(foreground,background){
  const luminance=color=>{
    const rgb=hexRgb(color)
    if(!rgb) return 0
    return rgb.map(value=>{
      const channel=value/255
      return channel<=.03928?channel/12.92:((channel+.055)/1.055)**2.4
    }).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0)
  }
  const a=luminance(foreground),b=luminance(background)
  return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)
}

export const shareEffectBodyColor=()=>SHARE_IMAGE_TOKENS.colors.text

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
  noSkillsSelected:'No skills selected',
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
  summaryConditions:'Calculated from selected formations and skills. Survival-dependent effects assume the required generals remain alive; battle-state effects are listed separately.',
  calculatedFromFormation:'Calculated from this formation',
  conditionalEffects:'Conditional effects',
  notCalculated:'Not calculated',
  selectOpponent:'Select an opposing formation to evaluate this effect.',
  upToValue:value=>`Up to ${value}%`,
  perCounterValue:(value,cap)=>`+${value}% per event (cap ${cap??'—'}%)`,
  chanceValue:value=>`${value}% chance`,
  dynamicValue:value=>`Up to ${value}%, scales with battle state`,
  conditionalOmitted:'conditional effects listed separately',
  unsupportedOmitted:'effects not calculated',
  noRelevantBuffs:'No relevant buffs.',
  enemyDebuffOn:'Enemy debuff on',
  sceneCardSkill:'CW6 Card Skill',
  unknown:'Unknown',
  truncated:'...truncated for Discord.',
  fullDetails:'Full details',
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

export function builderShareUrl(localeCode='en',state,options){
  const base=absoluteUrl('/builder', localeCode)
  return state?`${base}${encodeBuilderShareSearch(state,options)}`:base
}

export function sceneCardShareUrl(localeCode='en'){
  return absoluteUrl('/archive/cw6-scene-cards', localeCode)
}

export async function createCharacterSkillsImage(character,{url=characterShareUrl(character),labels}={}){
  const L=withLabels(labels)
  // URLs remain part of text/link sharing, but are deliberately excluded from
  // generated image chrome. Keep the option for API compatibility.
  void url
  if(typeof document==='undefined') throw new Error('Image rendering requires a browser.')
  const measureCanvas=document.createElement('canvas')
  const measure=measureCanvas.getContext('2d')
  applyDirection(measure,L)
  const layout=buildCharacterImageLayout(measure,character,L)
  const scale=Math.max(2,Math.min(3,window.devicePixelRatio||2))
  const canvas=document.createElement('canvas')
  canvas.width=layout.width*scale
  canvas.height=layout.height*scale
  canvas.style.width=`${layout.width}px`
  canvas.style.height=`${layout.height}px`
  const ctx=canvas.getContext('2d')
  ctx.scale(scale,scale)
  applyDirection(ctx,L)
  await drawCharacterSkillsImage(ctx,layout,character,L)
  const blob=await canvasToBlob(canvas)
  return {
    blob,
    fileName:`${safeFileName(displayName(character)||'ranhq-skills')}-skills.png`,layout,
  }
}

export async function createTeamSkillsImage({team=[],title,side='team',url=builderShareUrl(),labels}={}){
  const L=withLabels(labels)
  void url
  if(typeof document==='undefined') throw new Error('Image rendering requires a browser.')
  const members=(team||[]).filter(Boolean).slice(0,4)
  const measureCanvas=document.createElement('canvas')
  const measure=measureCanvas.getContext('2d')
  applyDirection(measure,L)
  const layout=buildTeamImageLayout(measure,members,{title:title||L.teamSkills,side,labels:L})
  const scale=Math.max(1.25,Math.min(2,window.devicePixelRatio||1.5))
  const canvas=document.createElement('canvas')
  canvas.width=Math.ceil(layout.width*scale)
  canvas.height=Math.ceil(layout.height*scale)
  canvas.style.width=`${layout.width}px`
  canvas.style.height=`${layout.height}px`
  const ctx=canvas.getContext('2d')
  ctx.scale(scale,scale)
  applyDirection(ctx,L)
  await drawTeamSkillsImage(ctx,layout,{title:title||L.teamSkills,side,labels:L})
  const blob=await canvasToBlob(canvas)
  return {
    blob,
    fileName:`${safeFileName(title||side||'ranhq-team')}-skills.png`,layout,
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
    `**${L.skillCard} — ${displayName(character)||L.unknown}**`,
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
      effects.forEach(effect=>lines.push(`- ${formatEffectForShare(effect,L)}`))
      lines.push('')
    })
  }

  return limitDiscordMessage(lines.join('\n').trim(),url,maxLength,L)
}

export function formatSceneCardShare(card,{url=sceneCardShareUrl(),maxLength=DISCORD_MESSAGE_LIMIT,labels}={}){
  const L=withLabels(labels)
  const skill=card?.skill||{}
  const skillName=displayName(skill)||card?.skill_en||L.unnamedSkill
  const skillJp=sourceLine(skillName,skill.name_jp||card?.skill_jp)
  const details=[card?.ownerName,term(L,skill.type),skill.star6&&L.star6].filter(Boolean).join(' - ')
  const lines=[
    `**${L.sceneCardSkill} — ${skillName}**`,
    details,
    `<${url}>`,
    '',
    `**${skillName}**`,
  ]
  if(skillJp) lines.push(`_${skillJp}_`)
  const effects=skillEffects(skill)
  if(!effects.length) lines.push(`- ${L.noEffects}`)
  effects.forEach(effect=>lines.push(`- ${formatEffectForShare(effect,L)}`))
  return limitDiscordMessage(lines.join('\n').trim(),url,maxLength,L)
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
    L.summaryConditions,
    `<${url}>`,
    '',
    ...formatBuffSideForShare(L.attackingFormation,atk,atkBuffs,atkEnemyDebuffs,{specialStats,statSortKey,labels:L}),
    '',
    ...formatBuffSideForShare(L.defendingFormation,def,defBuffs,defEnemyDebuffs,{specialStats,statSortKey,labels:L}),
  ]
  return limitDiscordMessage(lines.join('\n').trim(),url,maxLength,L)
}

export function formatEffectForShare(effect,labels){
  const L=withLabels(labels)
  const target=effect?.target||L.effect
  const value=effect?.effect||L.translationPending
  const duration=effect?.duration?` (${effect.duration})`:''
  const qualifiers=formatQualifiers(effect?.condition,L)
  // '->' is left as ASCII on purpose: '>' is bidi-mirrored, so the same string
  // reads as a left arrow inside an RTL run without per-locale branching, and
  // English output is unchanged.
  return `${target} -> ${value}${duration}${qualifiers?` | ${qualifiers}`:''}`
}

export function formatQualifiers(condition,labels){
  const L=withLabels(labels)
  return classifyConditionParts(condition).map(chip=>`${chipLabel(L,chip)}: ${chip.text}`).join('; ')
}

export function limitDiscordMessage(text,url,maxLength=DISCORD_MESSAGE_LIMIT,labels){
  if(text.length<=maxLength) return text
  const L=withLabels(labels)
  const suffix=`\n\n${L.truncated} ${L.fullDetails}: <${url}>`
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
  lines.push(`${L.team}: ${team.length?team.map((g,i)=>`${i+1}. ${L.localizeCharacterName?.(g)||displayName(g)}`).join(' / '):L.noGenerals}`)
  lines.push(`${L.calculatedFromFormation}:`)
  const buffLines=formatEntryBuffs(entries,opts)
  const debuffLines=formatEnemyDebuffs(enemyDebuffs,opts)
  if(!buffLines.length&&!debuffLines.length) lines.push(`- ${L.noRelevantBuffs}`)
  else lines.push(...buffLines,...debuffLines)
  const conditional=uniqueApplicabilitySources(entries,enemyDebuffs,'conditionalEffects')
  const missing=uniqueApplicabilitySources(entries,enemyDebuffs,'missingInputs')
  const unsupported=uniqueApplicabilitySources(entries,enemyDebuffs,'unsupported')
  if(conditional.length){
    lines.push(`${L.conditionalEffects}:`)
    lines.push(...conditional.map(source=>`- ${formatBuffSourceForShare(source,L)}`))
  }
  if(missing.length||unsupported.length){
    lines.push(`${L.notCalculated}:`)
    lines.push(...missing.map(source=>`- ${formatBuffSourceForShare(source,L)} — ${L.selectOpponent}`))
    lines.push(...unsupported.map(source=>`- ${formatBuffSourceForShare(source,L)} — ${L.unsupportedOmitted}`))
  }
  return lines
}

function formatBuffSourceForShare(source,L){
  const presentation=L.localizeBuffSource?.(source)||{}
  const owner=L.localizeCharacterName?.(source.owner)||displayName(source.owner)||L.unknown
  const skill=presentation.skillName||displayName(source.skill)||L.unnamedSkill
  const stat=source.stat?term(L,source.stat):L.effect
  const value=source.valueMeaning||{}
  let amount=''
  if(value.kind==='fixed') amount=`${source.dir==='down'?'-':'+'}${fmt(value.value)}%`
  else if(value.kind==='upperBound') amount=L.upToValue(value.max)
  else if(value.kind==='perCounter') amount=L.perCounterValue(value.amount,value.cap)
  else if(value.kind==='chance') amount=L.chanceValue(value.rate)
  else if(value.kind==='dynamicMultiplier') amount=L.dynamicValue(value.max)
  const condition=presentation.condition||source.effect?.condition
  return `${owner} — ${skill}: ${stat}${amount?` ${amount}`:''}${condition?` | ${condition}`:''}`
}

function uniqueApplicabilitySources(entries,enemyDebuffs,key){
  const sources=[
    ...(entries||[]).flatMap(({buffs})=>buffs?.meta?.[key]||[]),
    ...(enemyDebuffs?.meta?.[key]||[]),
  ]
  const ids=new Set()
  return sources.filter(source=>{
    const id=[source.owner?.id,source.skill?.name_en,source.effect?.condition,source.effect?.target,source.effect?.effect,source.stat].join('|')
    if(ids.has(id)) return false
    ids.add(id)
    return true
  })
}

function formatEntryBuffs(entries,{specialStats,statSortKey,labels}){
  const L=withLabels(labels)
  return entries.flatMap(({general,buffs})=>{
    const stats=sortBuffStats(Object.entries(buffs||{}),statSortKey)
    if(!stats.length) return []
    const values=stats.map(([stat,buff])=>formatBuffValue(stat,buff,specialStats,L)).filter(Boolean)
    return values.length?[`- ${L.localizeCharacterName?.(general)||displayName(general)}: ${values.join(', ')}`]:[]
  })
}

function formatEnemyDebuffs(enemyDebuffs,{specialStats,statSortKey,labels}){
  const L=withLabels(labels)
  return Object.entries(enemyDebuffs||{}).flatMap(([target,{up={},down={}}])=>{
    const names=new Set([...Object.keys(up),...Object.keys(down)])
    const stats=sortBuffStats([...names].map(stat=>[stat,{
      up:up[stat]||0,
      down:down[stat]||0,
    }]),statSortKey)
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

const IMAGE_FONT='Segoe UI, Meiryo, sans-serif'
const MONO_FONT='Consolas, monospace'
const CHARACTER_HEADER_HEIGHT=178

/**
 * Build the complete character-image geometry. This is intentionally public:
 * rendering tests can exercise the same measured contract without pixel OCR.
 */
export function buildCharacterImageLayout(ctx,character,labels=DEFAULT_SHARE_LABELS){
  const L=withLabels(labels)
  const width=SKILL_IMAGE_WIDTH
  const margin=44
  const cardWidth=width-(margin*2)
  const rtl=L.direction==='rtl'
  const portrait={x:rtl?width-margin-96:margin,y:48,w:96,h:96}
  const profileX=rtl?margin:margin+118
  const profileWidth=cardWidth-118
  const profileAnchor=rtl?'right':'left'
  const labelBlock=measureTextBlock(ctx,L.skillCard,{
    x:profileX,y:15,w:profileWidth,font:`900 18px ${IMAGE_FONT}`,lineHeight:22,align:rtl?'left':'right',maxLines:1,
  })
  const nameBlock=measureTextBlock(ctx,displayName(character)||L.unknown,{
    x:profileX,y:46,w:profileWidth,font:`950 36px ${IMAGE_FONT}`,lineHeight:40,align:profileAnchor,maxLines:2,
  })
  const sourceText=sourceLine(displayName(character),character?.name_jp)
  const sourceBlock=sourceText?measureTextBlock(ctx,sourceText,{
    x:profileX,y:Math.min(126,nameBlock.y+nameBlock.h+4),w:profileWidth,font:`700 18px ${IMAGE_FONT}`,lineHeight:22,align:profileAnchor,maxLines:1,
  }):null
  const metaText=[term(L,factionLabel(character?.country)),term(L,character?.unit_type)].filter(Boolean).join(' / ')
  const metaBlock=measureTextBlock(ctx,metaText,{
    x:profileX,y:148,w:profileWidth,font:`800 16px ${IMAGE_FONT}`,lineHeight:20,align:profileAnchor,maxLines:1,
  })
  const profile={portrait,labelBlock,nameBlock,sourceBlock,metaBlock,anchor:profileAnchor}

  const skillLayouts=[]
  let y=CHARACTER_HEADER_HEIGHT+24
  characterSkillsWithRole(character).forEach((skill,index)=>{
    const skillLayout=buildSkillCardLayout(ctx,skill,{x:margin,y,width:cardWidth,mode:'character',labels:L,index})
    skillLayouts.push(skillLayout)
    y+=skillLayout.height+18
  })
  let empty=null
  if(!skillLayouts.length){
    empty=measureEmptyState(ctx,{x:margin,y,w:cardWidth,h:82,text:L.translationPending,labels:L,fontSize:18})
    y+=empty.h+18
  }
  const footerHeight=54
  const height=y+footerHeight
  return {kind:'character',width,height,margin,cardWidth,headerHeight:CHARACTER_HEADER_HEIGHT,profile,skillLayouts,empty,footerHeight,labels:L,character}
}

/** Build the shared team-image geometry used for attack and defense exports. */
export function buildTeamImageLayout(ctx,members,{title,side,labels=DEFAULT_SHARE_LABELS}={}){
  const L=withLabels(labels)
  const width=TEAM_IMAGE_WIDTH
  const margin=28
  const gap=18
  const footerHeight=52
  const count=Math.max(1,Math.min(4,members.length||1))
  const presentation=teamImagePresentationLayout({count,direction:L.direction,width,margin,gap})
  const rtl=L.direction==='rtl'
  const headerTitle=measureTextBlock(ctx,title||L.teamSkills,{
    x:margin,y:42,w:width-(margin*2),font:`950 34px ${IMAGE_FONT}`,lineHeight:38,align:rtl?'right':'left',maxLines:2,
  })
  const subtitle=members.length?members.map(member=>displayName(member)).join(' / '):L.noGenerals
  const subtitleBlock=measureTextBlock(ctx,subtitle,{
    x:margin,y:headerTitle.y+headerTitle.h+5,w:width-(margin*2),font:`800 17px ${IMAGE_FONT}`,lineHeight:22,align:rtl?'right':'left',maxLines:2,
  })
  const headerHeight=Math.max(136,subtitleBlock.y+subtitleBlock.h+18)
  const brandBlock=measureTextBlock(ctx,L.partyBuilder,{
    x:margin,y:12,w:width-(margin*2),font:`900 17px ${IMAGE_FONT}`,lineHeight:21,align:rtl?'left':'right',maxLines:1,
  })
  const memberLayouts=members.map((member,index)=>buildTeamMemberLayout(ctx,member,{
    x:presentation.columnX[index],y:headerHeight+24,width:presentation.colWidth,labels:L,index,
  }))
  const columnHeight=Math.max(240,...memberLayouts.map(layout=>layout.height))
  memberLayouts.forEach(layout=>{
    layout.height=columnHeight
    layout.box.h=columnHeight
  })
  const teamEmpty=members.length?null:measureEmptyState(ctx,{x:margin,y:headerHeight+24,w:width-(margin*2),h:180,text:L.noGenerals,labels:L,fontSize:20})
  const contentHeight=teamEmpty?.h||columnHeight
  const height=headerHeight+24+contentHeight+footerHeight+margin
  const sideColor=side==='attack'?SHARE_IMAGE_TOKENS.colors.attack:side==='defense'?SHARE_IMAGE_TOKENS.colors.defense:SKILL_TYPE_VISUALS.Leader.accent
  return {
    kind:'team',width,height,margin,gap,headerHeight,footerHeight,colWidth:presentation.colWidth,columnHeight,
    memberLayouts,title:title||L.teamSkills,sideColor,subtitle,subtitleBlock,headerTitle,brandBlock,teamEmpty,labels:L,...presentation,
  }
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

function buildTeamMemberLayout(ctx,member,{x,y,width,labels,index}){
  const L=withLabels(labels)
  const rtl=L.direction==='rtl'
  const padding=14
  const profileHeight=124
  const portrait={x:rtl?x+width-82:x+16,y:y+18,w:66,h:66}
  const textX=rtl?x+16:x+94
  const textWidth=width-110
  const textAlign=rtl?'right':'left'
  const nameBlock=measureTextBlock(ctx,displayName(member)||L.unknown,{
    x:textX,y:y+18,w:textWidth,font:`950 19px ${IMAGE_FONT}`,lineHeight:22,align:textAlign,maxLines:2,
  })
  const sourceText=sourceLine(displayName(member),member?.name_jp)
  const sourceBlock=sourceText?measureTextBlock(ctx,sourceText,{
    x:textX,y:y+64,w:textWidth,font:`700 12px ${IMAGE_FONT}`,lineHeight:15,align:textAlign,maxLines:1,
  }):null
  const metaBlock=measureTextBlock(ctx,[term(L,factionLabel(member?.country)),term(L,member?.unit_type)].filter(Boolean).join(' / '),{
    x:x+16,y:y+94,w:width-32,font:`800 11px ${IMAGE_FONT}`,lineHeight:15,align:textAlign,maxLines:1,
  })
  const skillLayouts=[]
  let cursorY=y+profileHeight+14
  ;(member?.skills||[]).forEach((skill,skillIndex)=>{
    const skillLayout=buildSkillCardLayout(ctx,skill,{x:x+padding,y:cursorY,width:width-(padding*2),mode:'team',labels:L,index:skillIndex})
    skillLayouts.push(skillLayout)
    cursorY+=skillLayout.height+10
  })
  const emptyText=member?.skillsDisabled?L.noSkillsSelected:L.translationPending
  const empty=skillLayouts.length?null:measureEmptyState(ctx,{x:x+padding,y:cursorY,w:width-(padding*2),h:58,text:emptyText,labels:L,fontSize:14})
  if(empty) cursorY+=empty.h+10
  const height=cursorY-y+padding
  return {
    kind:'member',x,y,width,height,index,member,labels:L,box:{x,y,w:width,h:height},profileHeight,
    portrait,nameBlock,sourceBlock,metaBlock,skillLayouts,empty,
  }
}

function buildSkillCardLayout(ctx,skill,{x,y,width,mode,labels,index}){
  const L=withLabels(labels)
  const rtl=L.direction==='rtl'
  const compact=mode==='team'
  const pad=compact?14:22
  const gap=compact?8:12
  const badgeFont=`900 ${compact?10:14}px ${IMAGE_FONT}`
  const badgeLineHeight=compact?13:18
  const typeVisual=skillTypeVisual(skill?.type)
  const badges=[{
    id:'type',text:term(L,skill?.type)||skill?.type||L.skill,bg:typeVisual.badge,fg:typeVisual.text,border:typeVisual.accent,
  }]
  if(skill?.star6) badges.push({id:'cw6',text:L.star6,bg:SHARE_IMAGE_TOKENS.colors.cw6Surface,fg:'#624400',border:SHARE_IMAGE_TOKENS.colors.cw6})
  const badgeLayout=measureBadgeFlow(ctx,badges,{
    x:x+pad,y:y+pad,w:width-(pad*2),font:badgeFont,lineHeight:badgeLineHeight,direction:L.direction,gap:compact?6:8,
  })
  const titleFont=`900 ${compact?16:24}px ${IMAGE_FONT}`
  const titleLineHeight=compact?19:29
  const titleText=compact?teamSkillTitle(skill,index,L):(displayName(skill)||L.unnamedSkill)
  const titleBlock=measureTextBlock(ctx,titleText,{
    x:x+pad,y:badgeLayout.y+badgeLayout.h+gap,w:width-(pad*2),font:titleFont,lineHeight:titleLineHeight,align:rtl?'right':'left',
  })
  const sourceText=sourceLine(displayName(skill),skill?.name_jp)
  const sourceBlock=sourceText?measureTextBlock(ctx,sourceText,{
    x:x+pad,y:titleBlock.y+titleBlock.h+(compact?3:5),w:width-(pad*2),font:`700 ${compact?11:16}px ${IMAGE_FONT}`,
    lineHeight:compact?14:20,align:rtl?'right':'left',maxLines:2,
  }):null
  const headerBottom=(sourceBlock?sourceBlock.y+sourceBlock.h:titleBlock.y+titleBlock.h)+pad
  const header={x,y,w:width,h:headerBottom-y}
  const effects=[]
  let cursorY=headerBottom+gap
  pairedSkillEffects(skill).forEach(pair=>{
    const effect=measureEffectLayout(ctx,pair,{x:x+pad,y:cursorY,width:width-(pad*2),mode,labels:L})
    effects.push(effect)
    cursorY+=effect.h+gap
  })
  const noEffects=effects.length?null:measureTextBlock(ctx,L.noEffects,{
    x:x+pad,y:cursorY+8,w:width-(pad*2),font:`700 ${compact?13:20}px ${IMAGE_FONT}`,lineHeight:compact?17:25,align:rtl?'right':'left',maxLines:2,
  })
  if(noEffects) cursorY=noEffects.y+noEffects.h+pad
  else cursorY+=Math.max(0,pad-gap)
  const height=cursorY-y
  return {
    kind:'skill',x,y,width,height,box:{x,y,w:width,h:height},mode,skill,labels:L,typeVisual,header,
    badgeLayout,titleBlock,sourceBlock,effects,noEffects,
  }
}

function pairedSkillEffects(skill){
  const source=skill?.effects||[]
  const display=skill?.displayEffects||source
  return display.map((effect,index)=>({effect,source:source[index]||effect,index}))
}

function localizedConditionChips(pair){
  const sourceChips=classifyConditionParts(pair?.source?.condition)
  const displayParts=splitConditionParts(pair?.effect?.condition)
  if(!sourceChips.length) return classifyConditionParts(pair?.effect?.condition)
  return sourceChips.map((chip,index)=>({...chip,text:displayParts[index]||chip.text}))
}

function measureEffectLayout(ctx,pair,{x,y,width,mode,labels}){
  const L=withLabels(labels)
  const compact=mode==='team'
  const rtl=L.direction==='rtl'
  const pad=compact?12:16
  const contentX=x+pad+(compact?10:0)
  const contentW=width-(pad*2)-(compact?10:0)
  const align=rtl?'right':'left'
  let cursorY=y+pad
  const conditionFont=`700 ${compact?11:17}px ${IMAGE_FONT}`
  const conditionLineHeight=compact?14:22
  const conditionBlocks=localizedConditionChips(pair).map(chip=>{
    const block=measureTextBlock(ctx,`${chipLabel(L,chip)}: ${chip.text}`,{
      x:contentX,y:cursorY,w:contentW,font:conditionFont,lineHeight:conditionLineHeight,align,
    })
    block.semanticKind=chip.kind
    cursorY+=block.h+(compact?3:5)
    return block
  })
  if(conditionBlocks.length) cursorY+=compact?2:4
  const bodyFont=`800 ${compact?13:22}px ${IMAGE_FONT}`
  const bodyLineHeight=compact?17:28
  const bodyBlock=measureTextBlock(ctx,formatEffectCompact(pair.effect,L),{
    x:contentX,y:cursorY,w:contentW,font:bodyFont,lineHeight:bodyLineHeight,align,
  })
  cursorY+=bodyBlock.h
  const durationText=pair.effect?.duration?`${L.duration}: ${pair.effect.duration}`:''
  const durationBlock=durationText?measureTextBlock(ctx,durationText,{
    x:contentX,y:cursorY+(compact?2:5),w:contentW,font:`700 ${compact?10:16}px ${MONO_FONT}`,
    lineHeight:compact?14:21,align,
  }):null
  if(durationBlock) cursorY=durationBlock.y+durationBlock.h
  const h=cursorY-y+pad
  return {kind:'effect',x,y,w:width,h,box:{x,y,w:width,h},pair,conditionBlocks,bodyBlock,durationBlock,mode,labels:L}
}

function measureTextBlock(ctx,text,{x,y,w,font,lineHeight,align='left',maxLines=Infinity}){
  const lines=wrapText(ctx,text,w,font).slice(0,maxLines)
  return {kind:'text',text:String(text||''),x,y,w,h:lines.length*lineHeight,lines,font,lineHeight,align}
}

function measureEmptyState(ctx,{x,y,w,h,text,labels,fontSize=16}){
  const rtl=labels?.direction==='rtl'
  const block=measureTextBlock(ctx,text,{
    x:x+18,y:y+18,w:w-36,font:`800 ${fontSize}px ${IMAGE_FONT}`,lineHeight:fontSize+5,align:rtl?'right':'left',
  })
  return {kind:'empty',x,y,w,h,text,block}
}

function measureBadgeFlow(ctx,badges,{x,y,w,font,lineHeight,direction='ltr',gap=8}){
  const maxBadgeWidth=Math.max(40,w)
  const measured=badges.map(badge=>{
    const lines=wrapText(ctx,badge.text,Math.max(20,maxBadgeWidth-20),font)
    ctx.font=font
    const textWidth=Math.max(0,...lines.map(line=>ctx.measureText(line).width))
    return {...badge,lines,font,lineHeight,w:Math.min(maxBadgeWidth,Math.ceil(textWidth)+20),h:(lines.length*lineHeight)+10}
  })
  const rows=[]
  let row=[]
  let used=0
  measured.forEach(item=>{
    if(row.length&&used+gap+item.w>w){ rows.push(row); row=[]; used=0 }
    row.push(item)
    used+=item.w+(row.length>1?gap:0)
  })
  if(row.length) rows.push(row)
  let cursorY=y
  const items=[]
  rows.forEach(rowItems=>{
    const rowHeight=Math.max(...rowItems.map(item=>item.h))
    if(direction==='rtl'){
      let cursorX=x+w
      rowItems.forEach(item=>{
        cursorX-=item.w
        items.push({...item,x:cursorX,y:cursorY+(rowHeight-item.h)/2})
        cursorX-=gap
      })
    }else{
      let cursorX=x
      rowItems.forEach(item=>{
        items.push({...item,x:cursorX,y:cursorY+(rowHeight-item.h)/2})
        cursorX+=item.w+gap
      })
    }
    cursorY+=rowHeight+gap
  })
  return {kind:'badges',x,y,w,h:Math.max(0,cursorY-y-gap),items}
}

/** Return layout-boundary and sibling-overlap failures for deterministic QA. */
export function inspectShareImageLayout(layout){
  const issues=[]
  const root={x:0,y:0,w:layout?.width||0,h:layout?.height||0}
  const within=(child,parent,label)=>{
    if(!child) return
    if(child.x<parent.x-.01||child.y<parent.y-.01||child.x+child.w>parent.x+parent.w+.01||child.y+child.h>parent.y+parent.h+.01){
      issues.push(`${label} escapes its measured parent`)
    }
  }
  const disjoint=(items,label)=>{
    for(let i=0;i<items.length;i+=1){
      for(let j=i+1;j<items.length;j+=1){
        if(rectsIntersect(items[i],items[j])) issues.push(`${label} ${i+1} overlaps ${j+1}`)
      }
    }
  }
  const inspectSkill=(skill,label)=>{
    within(skill.box,root,`${label} card`)
    skill.badgeLayout.items.forEach((badge,index)=>within(badge,skill.header,`${label} badge ${index+1}`))
    within(skill.titleBlock,skill.header,`${label} title`)
    within(skill.sourceBlock,skill.header,`${label} source`)
    disjoint([...skill.badgeLayout.items,skill.titleBlock,...(skill.sourceBlock?[skill.sourceBlock]:[])],`${label} header item`)
    disjoint(skill.effects.map(effect=>effect.box),`${label} effect`)
    skill.effects.forEach((effect,index)=>{
      within(effect.box,skill.box,`${label} effect ${index+1}`)
      const blocks=[...effect.conditionBlocks,effect.bodyBlock,...(effect.durationBlock?[effect.durationBlock]:[])]
      blocks.forEach((block,blockIndex)=>within(block,effect.box,`${label} effect ${index+1} block ${blockIndex+1}`))
      disjoint(blocks,`${label} effect ${index+1} block`)
    })
    within(skill.noEffects,skill.box,`${label} empty state`)
  }
  if(layout?.kind==='character'){
    within(layout.profile.portrait,root,'character portrait')
    ;[layout.profile.labelBlock,layout.profile.nameBlock,layout.profile.sourceBlock,layout.profile.metaBlock].filter(Boolean).forEach((block,index)=>within(block,root,`character header ${index+1}`))
    disjoint(layout.skillLayouts.map(skill=>skill.box),'character skill')
    layout.skillLayouts.forEach((skill,index)=>inspectSkill(skill,`character skill ${index+1}`))
    within(layout.empty,root,'character empty state')
    if(layout.empty) within(layout.empty.block,layout.empty,'character empty text')
  }else if(layout?.kind==='team'){
    within(layout.headerTitle,root,'team title')
    within(layout.subtitleBlock,root,'team subtitle')
    within(layout.brandBlock,root,'team brand')
    disjoint(layout.memberLayouts.map(member=>member.box),'team member')
    layout.memberLayouts.forEach((member,memberIndex)=>{
      within(member.box,root,`team member ${memberIndex+1}`)
      within(member.portrait,member.box,`team member ${memberIndex+1} portrait`)
      ;[member.nameBlock,member.sourceBlock,member.metaBlock,member.empty].filter(Boolean).forEach((block,index)=>within(block,member.box,`team member ${memberIndex+1} item ${index+1}`))
      if(member.empty) within(member.empty.block,member.empty,`team member ${memberIndex+1} empty text`)
      disjoint(member.skillLayouts.map(skill=>skill.box),`team member ${memberIndex+1} skill`)
      member.skillLayouts.forEach((skill,index)=>inspectSkill(skill,`team member ${memberIndex+1} skill ${index+1}`))
    })
    within(layout.teamEmpty,root,'team empty state')
    if(layout.teamEmpty) within(layout.teamEmpty.block,layout.teamEmpty,'team empty text')
  }
  return {ok:issues.length===0,issues}
}

/** Visible strings in paint order, excluding non-rendered layout metadata. */
export function shareImagePaintText(layout){
  const text=[]
  const add=block=>{ if(block?.lines) text.push(...block.lines) }
  const addSkill=skill=>{
    skill.badgeLayout.items.forEach(add)
    add(skill.titleBlock)
    add(skill.sourceBlock)
    skill.effects.forEach(effect=>{
      effect.conditionBlocks.forEach(add)
      add(effect.bodyBlock)
      add(effect.durationBlock)
    })
    add(skill.noEffects)
  }
  if(layout?.kind==='character'){
    add(layout.profile.labelBlock)
    add(layout.profile.nameBlock)
    add(layout.profile.sourceBlock)
    add(layout.profile.metaBlock)
    layout.skillLayouts.forEach(addSkill)
    add(layout.empty?.block)
  }else if(layout?.kind==='team'){
    add(layout.brandBlock)
    add(layout.headerTitle)
    add(layout.subtitleBlock)
    layout.memberLayouts.forEach(member=>{
      add(member.nameBlock)
      add(member.sourceBlock)
      add(member.metaBlock)
      member.skillLayouts.forEach(addSkill)
      add(member.empty?.block)
    })
    add(layout.teamEmpty?.block)
  }
  text.push('ranhq.vercel.app')
  return text
}

function rectsIntersect(a,b){
  if(!a||!b||a.w<=0||a.h<=0||b.w<=0||b.h<=0) return false
  return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y
}

async function drawCharacterSkillsImage(ctx,layout,character,L=DEFAULT_SHARE_LABELS){
  const {width,height,margin,headerHeight,profile,skillLayouts,empty}=layout
  const colors=SHARE_IMAGE_TOKENS.colors
  const factionColor=FACTION_COLORS[character?.country]||UNKNOWN_SKILL_VISUAL.accent
  ctx.fillStyle=colors.parchment
  ctx.fillRect(0,0,width,height)
  drawTexture(ctx,width,height)
  ctx.fillStyle=colors.navy
  ctx.fillRect(0,0,width,headerHeight)
  ctx.fillStyle=factionColor
  ctx.fillRect(0,headerHeight-6,width,6)
  await drawPortrait(ctx,character,profile.portrait,factionColor)
  drawTextBlock(ctx,profile.labelBlock,colors.metaOnDark)
  drawTextBlock(ctx,profile.nameBlock,'#ffffff')
  drawTextBlock(ctx,profile.sourceBlock,colors.sourceOnDark)
  drawTextBlock(ctx,profile.metaBlock,'#ffffff')
  skillLayouts.forEach(skill=>drawSkillCard(ctx,skill))
  if(empty) drawEmptyState(ctx,empty,L)
  drawText(ctx,'ranhq.vercel.app',L.direction==='rtl'?width-margin:margin,height-24,`800 18px ${IMAGE_FONT}`,colors.brand,L.direction==='rtl'?'right':'left')
}

async function drawTeamSkillsImage(ctx,layout){
  const {width,height,margin,headerHeight,sideColor,memberLayouts,teamEmpty,labels:L}=layout
  const colors=SHARE_IMAGE_TOKENS.colors
  ctx.fillStyle=colors.parchment
  ctx.fillRect(0,0,width,height)
  drawTexture(ctx,width,height)
  ctx.fillStyle=colors.navy
  ctx.fillRect(0,0,width,headerHeight)
  ctx.fillStyle=sideColor
  ctx.fillRect(0,headerHeight-6,width,6)
  drawTextBlock(ctx,layout.brandBlock,colors.metaOnDark)
  drawTextBlock(ctx,layout.headerTitle,'#ffffff')
  drawTextBlock(ctx,layout.subtitleBlock,colors.sourceOnDark)
  for(const memberLayout of memberLayouts) await drawTeamMemberColumn(ctx,memberLayout)
  if(teamEmpty) drawEmptyState(ctx,teamEmpty,L)
  drawText(ctx,'ranhq.vercel.app',L.direction==='rtl'?width-margin:margin,height-24,`800 17px ${IMAGE_FONT}`,colors.brand,L.direction==='rtl'?'right':'left')
}

async function drawTeamMemberColumn(ctx,layout){
  const {x,y,width,height,member,skillLayouts,profileHeight,labels:L}=layout
  const colors=SHARE_IMAGE_TOKENS.colors
  const factionColor=FACTION_COLORS[member?.country]||UNKNOWN_SKILL_VISUAL.accent
  drawPanel(ctx,{x,y,w:width,h:height},colors.skillSurface,colors.border,SHARE_IMAGE_TOKENS.radius.column)
  ctx.save()
  roundedRect(ctx,x,y,width,profileHeight,SHARE_IMAGE_TOKENS.radius.column)
  ctx.clip()
  ctx.fillStyle=colors.navyRaised
  ctx.fillRect(x,y,width,profileHeight)
  ctx.fillStyle=factionColor
  ctx.fillRect(L.direction==='rtl'?x+width-7:x,y,7,profileHeight)
  ctx.restore()
  await drawPortrait(ctx,member,layout.portrait,factionColor)
  drawTextBlock(ctx,layout.nameBlock,'#ffffff')
  drawTextBlock(ctx,layout.sourceBlock,colors.sourceOnDark)
  drawTextBlock(ctx,layout.metaBlock,'#ffffff')
  skillLayouts.forEach(skill=>drawSkillCard(ctx,skill))
  if(layout.empty) drawEmptyState(ctx,layout.empty,L)
}

function drawSkillCard(ctx,layout){
  const colors=SHARE_IMAGE_TOKENS.colors
  const {box,header,typeVisual,labels:L}=layout
  drawPanel(ctx,box,colors.skillSurface,colors.border,SHARE_IMAGE_TOKENS.radius.skill)
  ctx.save()
  roundedRect(ctx,header.x,header.y,header.w,header.h,SHARE_IMAGE_TOKENS.radius.skill)
  ctx.clip()
  ctx.fillStyle=colors.navyRaised
  ctx.fillRect(header.x,header.y,header.w,header.h)
  ctx.fillStyle=typeVisual.accent
  ctx.fillRect(L.direction==='rtl'?header.x+header.w-7:header.x,header.y,7,header.h)
  ctx.restore()
  layout.badgeLayout.items.forEach(badge=>drawBadge(ctx,badge))
  drawTextBlock(ctx,layout.titleBlock,'#ffffff')
  drawTextBlock(ctx,layout.sourceBlock,colors.sourceOnDark)
  layout.effects.forEach(effect=>drawEffect(ctx,effect,typeVisual.accent))
  if(layout.noEffects) drawTextBlock(ctx,layout.noEffects,colors.secondary)
}

function drawEffect(ctx,layout,accent){
  const colors=SHARE_IMAGE_TOKENS.colors
  drawPanel(ctx,layout.box,colors.effectSurface,colors.border,SHARE_IMAGE_TOKENS.radius.effect)
  ctx.fillStyle=accent
  const markerX=layout.labels.direction==='rtl'?layout.x+layout.w-5:layout.x
  ctx.fillRect(markerX,layout.y,5,layout.h)
  layout.conditionBlocks.forEach(block=>{
    drawTextBlockBackground(ctx,block,colors.conditionSurface,colors.conditionBorder)
    drawTextBlock(ctx,block,colors.condition)
  })
  // Continuation lines are intentionally semantic-neutral. Line position never
  // changes meaning or color.
  drawTextBlock(ctx,layout.bodyBlock,shareEffectBodyColor())
  drawTextBlock(ctx,layout.durationBlock,colors.duration)
}

async function drawPortrait(ctx,entity,box,fallbackColor){
  const portrait=await loadImage(entity?.icon||persosThumb(entity?.image))
  ctx.save()
  roundedRect(ctx,box.x,box.y,box.w,box.h,12)
  ctx.clip()
  if(portrait) drawImageCover(ctx,portrait,box.x,box.y,box.w,box.h)
  else{
    ctx.fillStyle=fallbackColor
    ctx.fillRect(box.x,box.y,box.w,box.h)
    drawText(ctx,(entity?.name_en||'?')[0],box.x+(box.w/2),box.y+(box.h*.65),`900 ${Math.round(box.h*.45)}px ${IMAGE_FONT}`,'#ffffff','center')
  }
  ctx.restore()
  ctx.strokeStyle='rgba(255,255,255,.45)'
  ctx.lineWidth=2
  roundedRect(ctx,box.x,box.y,box.w,box.h,12)
  ctx.stroke()
}

function drawBadge(ctx,badge){
  drawPanel(ctx,badge,badge.bg,badge.border,SHARE_IMAGE_TOKENS.radius.badge)
  badge.lines.forEach((line,index)=>{
    drawText(ctx,line,badge.x+(badge.w/2),badge.y+6+(badge.lineHeight*.78)+(index*badge.lineHeight),badge.font,badge.fg,'center')
  })
}

function drawTextBlock(ctx,block,color){
  if(!block) return
  const anchor=block.align==='right'?block.x+block.w:block.align==='center'?block.x+(block.w/2):block.x
  block.lines.forEach((line,index)=>drawText(ctx,line,anchor,block.y+(block.lineHeight*.78)+(index*block.lineHeight),block.font,color,block.align))
}

function drawTextBlockBackground(ctx,block,fill,stroke){
  if(!block||block.h<=0) return
  const pad=3
  drawPanel(ctx,{x:block.x-pad,y:block.y-1,w:block.w+(pad*2),h:block.h+2},fill,stroke,5)
}

function drawPanel(ctx,box,fill,stroke,radius){
  roundedRect(ctx,box.x,box.y,box.w,box.h,radius)
  ctx.fillStyle=fill
  ctx.fill()
  if(stroke){
    ctx.strokeStyle=stroke
    ctx.lineWidth=1.2
    ctx.stroke()
  }
}

function drawEmptyState(ctx,box,L=DEFAULT_SHARE_LABELS){
  drawPanel(ctx,box,SHARE_IMAGE_TOKENS.colors.skillSurface,SHARE_IMAGE_TOKENS.colors.border,SHARE_IMAGE_TOKENS.radius.skill)
  void L
  drawTextBlock(ctx,box.block,SHARE_IMAGE_TOKENS.colors.secondary)
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
