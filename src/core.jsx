import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale, formatNumber as formatLocaleNumber, formatFixedNumber } from './i18n/index.js'
import { localizedCharacter } from './i18n/data.js'
import { LEGACY_CHARACTER_NAME_ALIASES } from './i18n/ar-character-names.js'
import { characterContentMatch } from './i18n/character-search.js'
import cw6SceneCards from '../data/cw6_scene_cards.json'
import mountainFolk from '../data/characters/mountain_folk.json'
import qin          from '../data/characters/qin.json'
import qinBatch2    from '../data/characters/qin_batch2.json'
import qinMajor     from '../data/characters/qin_major.json'
import zhao         from '../data/characters/zhao.json'
import zhaoBatch2   from '../data/characters/zhao_batch2.json'
import zhaoMajor    from '../data/characters/zhao_major.json'
import otherStates  from '../data/characters/other_states.json'
import chu          from '../data/characters/chu.json'
import chuMajor     from '../data/characters/chu_major.json'
import wei          from '../data/characters/wei.json'
import yan          from '../data/characters/yan.json'
import qi           from '../data/characters/qi.json'
import misc         from '../data/characters/misc.json'
import misc2        from '../data/characters/misc2.json'
import aiYanMajor   from '../data/characters/ai_yan_major.json'
import cwBuffsData  from '../data/cw_buffs.json'
import cwMaxStats   from '../data/cw_max_stats.json'
import sceneCardBuffs from '../data/scene_card_cw_buffs.json'
import rarityData from '../data/character_rarity.json'
import classification from '../data/character_classification.json'
import souhaRoleSkills from '../data/souha_role_skills.json'
import { PROGRESS_STORAGE_KEY, emptyProgress, parseProgressStorageValue, readProgressSnapshot, replaceProgressFromBackup, writeProgressState, writeProgressValue } from './progress-storage.js'
import { useHydratedState } from './use-hydrated-state.js'
import { getDocumentReleaseSnapshot, releaseStage, useReleaseStage } from './release-snapshot.js'
import Dialog from './Dialog.jsx'
import { buffOwnershipId, migrateBuffOwnership } from './buff-ownership.js'
import {
  BUILDER_MECHANICS,
  attachBuilderMechanicIds,
  stableCriterionMatches,
  stableRecipientsMatch,
  stableRosterHas,
} from './builder-mechanics.js'
export { PROGRESS_STORAGE_KEY, emptyProgress } from './progress-storage.js'

export const normalizeProgress=(raw={})=>{
  const base=emptyProgress()
  return Object.fromEntries(Object.keys(base).map(k=>[k,k==='buffSources'?migrateBuffOwnership(raw[k]||{}):{...(raw[k]||{})}]))
}
export const readProgress=()=>{
  if(typeof window==='undefined') return emptyProgress()
  try{return parseProgressStorageValue(window.localStorage.getItem(PROGRESS_STORAGE_KEY),normalizeProgress)||emptyProgress()}
  catch{return emptyProgress()}
}
const progressStorage=()=>{
  try{return typeof window==='undefined'?null:window.localStorage}
  catch{return null}
}
export function useProgressTracker(){
  const{t}=useTranslation('common')
  const[progress,setProgress]=useHydratedState(emptyProgress,readProgress)
  const progressRef=useRef(progress)
  progressRef.current=progress
  const[previousAvailable,setPreviousAvailable]=useState(false)
  const[saveStatus,setSaveStatus]=useState('idle')
  useEffect(()=>{
    try{setPreviousAvailable(readProgressSnapshot(window.localStorage)!==null)}catch{ /* storage unavailable */ }
  },[])
  useEffect(()=>{
    const onStorage=event=>{
      if(event.key!==PROGRESS_STORAGE_KEY) return
      const next=parseProgressStorageValue(event.newValue,normalizeProgress)
      if(!next) return
      progressRef.current=next
      setProgress(next)
      setSaveStatus('saved')
    }
    window.addEventListener('storage',onStorage)
    return()=>window.removeEventListener('storage',onStorage)
  },[setProgress])
  const isOwned=(bucket,id)=>!!progress[bucket]?.[id]
  const persistValue=(bucket,id,value)=>{
    const result=writeProgressValue(progressStorage(),progressRef.current,bucket,id,value,normalizeProgress)
    progressRef.current=result.progress
    setProgress(result.progress)
    setSaveStatus(result.saved?'saved':'failed')
  }
  const toggleOwned=(bucket,id)=>persistValue(bucket,id,!progressRef.current[bucket]?.[id])
  const setProgressValue=(bucket,id,value)=>{
    persistValue(bucket,id,value)
  }
  const countOwned=(bucket,ids)=>ids.reduce((n,id)=>n+(isOwned(bucket,id)?1:0),0)
  const exportProgress=async()=>{
    const text=JSON.stringify({version:1,exportedAt:new Date().toISOString(),progress},null,2)
    try{
      await navigator.clipboard.writeText(text)
      window.alert(t('progressCopied'))
    }catch{
      window.prompt(t('copyProgress'),text)
    }
  }
  const importProgress=()=>{
    const text=window.prompt(t('pasteProgress'))
    if(!text) return
    replaceBackup(text)
  }
  const replaceBackup=text=>{
    try{
      const result=replaceProgressFromBackup(text,window.localStorage,normalizeProgress)
      progressRef.current=result.progress
      setProgress(result.progress)
      setSaveStatus('saved')
      setPreviousAvailable(true)
      window.alert(`${t('progressImported')} ${t('progressImportSummary',result.counts)}`)
    }catch(error){
      if(error.code==='storage') setSaveStatus('failed')
      window.alert(t(error.code==='storage'?'progressStorageFailed':'progressImportFailed'))
    }
  }
  const restoreProgress=()=>{
    let previous
    try{previous=readProgressSnapshot(window.localStorage)}catch{ /* storage unavailable */ }
    if(previous!==null&&previous!==undefined&&window.confirm(t('restoreProgressConfirm'))) replaceBackup(previous)
  }
  const clearProgress=()=>{
    if(!window.confirm(t('clearProgressConfirm'))) return
    const next=emptyProgress()
    const saved=writeProgressState(progressStorage(),next,normalizeProgress)
    progressRef.current=next
    setProgress(next)
    setSaveStatus(saved?'saved':'failed')
  }
  return{progress,isOwned,toggleOwned,setProgressValue,countOwned,exportProgress,importProgress,clearProgress,previousAvailable,restoreProgress,saveStatus}
}
// `label` is the English default; `key` lets a caller translate it. The
// catalog already carries all/owned/missing for every locale.
export const progressFilterItems=[
  {id:'all',label:'All',key:'all'},
  {id:'owned',label:'Owned',key:'owned'},
  {id:'missing',label:'Missing',key:'missing'},
]
export const ProgressTools=({tracker})=>{
  const{t}=useTranslation('common')
  return(
    <div className="progress-tools" aria-label={t('toolsSummary')}>
      <span className="progress-tools-note" role="status" aria-live="polite" data-save-status={tracker.saveStatus}>{t(tracker.saveStatus==='failed'?'saveFailedBrowser':tracker.saveStatus==='saved'?'savedBrowser':'browserStorage')}</span>
      <button type="button" onClick={tracker.exportProgress}>{t('export')}</button>
      <button type="button" onClick={tracker.importProgress}>{t('import')}</button>
      {tracker.previousAvailable&&<button type="button" onClick={tracker.restoreProgress}>{t('restoreProgress')}</button>}
      <button type="button" onClick={tracker.clearProgress}>{t('clear')}</button>
    </div>
  )
}
export const OwnedToggle=({owned,onToggle,label,className=''})=>{
  const{t}=useTranslation('common')
  const displayLabel=label||t('owned')
  return(
    <button
      type="button"
      className={`owned-toggle${owned?' owned-toggle-on':''}${className?' '+className:''}`}
      onClick={onToggle}
      aria-pressed={owned}
      title={owned?t('markedOwned'):t('markOwned')}
    >
      {owned?displayLabel:t('own')}
    </button>
  )
}
export const SceneStarControl=({star,onChange})=>{
  const{t}=useTranslation('common')
  return(
    <div className="scene-star-control" aria-label={t('starSkill')}>
      {[1,2,3,4,5,6].map(level=>(
        <button
          key={level}
          type="button"
          className={level<=star?'active':''}
          aria-pressed={level<=star}
          title={star===level?t('clear'):`${level}/6 ★`}
          onClick={()=>onChange(star===level?0:level)}
        >
          {level<=star?'★':'☆'}
        </button>
      ))}
    </div>
  )
}
export const buffSourceId=(_kind,_key,_stat,entry,_i)=>buffOwnershipId(entry)

// ── Scene cards that have not gone live in the game yet ──────────────────────
// The source data carries the card's in-game release timestamp. A card dated in
// the future is real, verified data we already hold, but showing it early would
// publish content the game has not released. Gate on the date rather than
// holding rows out of the dataset, so provenance stays intact and the card
// appears on its own release day with no code change.
const cw6Cards=cw6SceneCards.cards||[]
const releaseTimes=[...new Set(cw6Cards.map(card=>card.publicTime*1000).filter(time=>Number.isFinite(time)&&time>0))].sort((a,b)=>a-b)
const isCardPublic=(card,time)=>!card?.publicTime||card.publicTime*1000<=time
// Star-6 skills reach a character through the same card, so an unreleased card
// must also keep its skill off the character page, the builder and Share Team.
const withoutUnreleasedStar6=(character,unreleasedIds)=>{
  const skills=(character.skills||[]).filter(
    skill=>!(skill?.star6&&unreleasedIds.has(skill.cwId)),
  )
  return skills.length===(character.skills||[]).length?character:{...character,skills}
}

export const SOUHA_ROLE_SKILLS=souhaRoleSkills.skills||[]
const ROLE_SKILL_BY_OWNER=Object.fromEntries(SOUHA_ROLE_SKILLS.map(entry=>[entry.owner_id,entry]))

const completeRoster = [
  ...mountainFolk,...qin,...qinBatch2,...qinMajor,
  ...zhao,...zhaoBatch2,...zhaoMajor,...otherStates,
  ...chu,...chuMajor,...wei,...yan,...qi,
  ...aiYanMajor,...misc,...misc2,
].filter(c=>c.country!=='unknown').map(c=>{
  const entry=ROLE_SKILL_BY_OWNER[c.id]
  if(!entry) return c
  return{
    ...c,
    roleSkill:{
      ...entry.skill,
      role:entry.role,
      role_jp:entry.role_jp,
      owner_id:entry.owner_id,
      characterId:entry.characterId,
    },
  }
}).map(attachBuilderMechanicIds)

// Verified game affiliations and unit types. Evidence and the full roster audit
// live in data/source/character-classification.json and docs/character-integrity.
// Do not infer game targeting memberships from story associations or `unit` copy.
export const UNIT_TYPES=Object.fromEntries(Object.entries(classification).map(([id,c])=>[id,c.unit_type]))
export const GROUPS={}
for(const c of completeRoster){
  const verified=classification[c.id]
  c.unit_type=verified?.unit_type||null
  c.groups=[...(verified?.groups||[])]
  for(const group of c.groups){
    if(!GROUPS[group]) GROUPS[group]=[]
    GROUPS[group].push(c.id)
  }
}

// Fast lookup by name_en (case-insensitive) — replaces repeated ALL.find() scans
const namesForRoster=roster=>{
  const map={}
  for(const character of roster){
    if(!character.name_en) continue
    map[character.name_en]=character
    map[character.name_en.toLowerCase()]=character
  }
  for(const [legacy,canonical] of Object.entries(LEGACY_CHARACTER_NAME_ALIASES)){
    const character=map[canonical]||map[canonical.toLowerCase()]
    if(!character) continue
    map[legacy]=character
    map[legacy.toLowerCase()]=character
  }
  return map
}
const releaseDataCache=new Map()
export function getReleaseData(time){
  const stage=releaseStage(releaseTimes,time)
  if(releaseDataCache.has(stage)) return releaseDataCache.get(stage)
  const cards=cw6Cards.filter(card=>isCardPublic(card,stage))
  const unreleasedIds=new Set(cw6Cards.filter(card=>!isCardPublic(card,stage)).flatMap(card=>card.cwIds||[]))
  const roster=completeRoster.map(character=>withoutUnreleasedStar6(character,unreleasedIds))
  const byId=Object.fromEntries(roster.map(character=>[character.id,character]))
  const byName=namesForRoster(roster)
  const data={
    ALL:roster,
    PUBLIC_CW6_CARDS:cards,
    ARCHIVE_BROWSE_CHARACTERS:roster.filter(character=>Boolean(character.image)),
    CHAR_BY_ID:byId,
    CHAR_BY_NAME:byName,
    findCharById:id=>typeof id==='string'&&Object.hasOwn(byId,id)?byId[id]:null,
    findCharByName:name=>typeof name==='string'?byName[name]||byName[name.toLowerCase()]||null:null,
  }
  releaseDataCache.set(stage,data)
  return data
}
// Pure consumers and SSR share the document's immutable data. Reactive UI uses
// the hook, so released skills receive new identities and invalidate text caches.
export const {ALL,PUBLIC_CW6_CARDS,CHAR_BY_NAME,CHAR_BY_ID,findCharByName,findCharById,ARCHIVE_BROWSE_CHARACTERS}=getReleaseData(getDocumentReleaseSnapshot())
export function useReleaseData(){
  return getReleaseData(useReleaseStage(releaseTimes))
}
// Keep icon-only generals in the complete roster for direct links and search,
// while the default Archive browse view shows only finished banner cards.
export const ARCHIVE_CHAR_COUNT = ARCHIVE_BROWSE_CHARACTERS.length

// Unlock costs use initial game rarity, not the currently awakened card rank.
// Evidence: docs/character-integrity/CLASSIFICATION-AUDIT.md.
export const RED_CRYSTAL_TOTAL_COST={N:485,R:595,SR:800,UR:1750,LG:1750}
export const RED_CRYSTAL_SKILL_COSTS={N:[70,175,240],R:[70,175,350],SR:[80,240,480],UR:[100,550,1100],LG:[100,550,1100]}
export const RED_CRYSTAL_UNLOCK_COSTS=Object.fromEntries(
  Object.entries(RED_CRYSTAL_SKILL_COSTS).map(([rarity,costs])=>[
    rarity,
    costs.map((_,i)=>costs.slice(0,i+1).reduce((sum,v)=>sum+v,0)),
  ])
)
export const normalizeBuffText=s=>(s||'').toLowerCase().replace(/[[\]"'’‘“”・–—-]/g,' ').replace(/\s+/g,' ').trim()
export const buffValueMatches=(text,value)=>{
  const v=Number(value)
  if(!Number.isFinite(v)) return false
  const escaped=String(v).replace('.', '\\.')
  return new RegExp(`(?:^|\\D)${escaped}(?:0+)?\\s*(?:%|％)`).test(text||'')
}
export const buffStatMatches=(effect,stat)=>{
  const t=normalizeBuffText(effect)
  if(stat==='HP') return /\bmax hp up\b|\bhp up\b/.test(t)
  if(stat==='Attack') return /\batk up\b|\battack up\b/.test(t)
  if(stat==='Defense') return /\bdef up\b|\bdefense up\b/.test(t)
  if(/Damage Dealt Reduction|Damage Taken Increase|Starting Troop HP Loss/i.test(stat||'')) return true
  return false
}
export const buffTargetMatches=(skill,effect,kind,key)=>{
  if(kind==='terrain') return true
  const hay=normalizeBuffText([effect.target,effect.condition,effect.effect].filter(Boolean).join(' '))
  const needle=normalizeBuffText(key)
  if(!needle) return false
  if(hay.includes(needle)) return true
  if(kind==='unit') return hay.includes(needle.replace(/y$/,'ies'))||hay.includes(needle.replace(/s$/,''))
  if(kind==='state') return hay.includes(needle)
  if(kind==='army') return needle.split(' ').some(part=>part.length>3&&hay.includes(part))
  return false
}
export function redCrystalBuffUnlockCost(entry,kind,key,stat){
  if(!entry||entry.special_icon||entry.special_label||Number(entry.value)===5) return null
  const char=entry.name_jp?ALL.find(c=>c.name_jp===entry.name_jp):findCharByName(entry.name)
  if(!char) return null
  const rarity=buffEntryRarity(entry)||char.rarity||'SR'
  const costs=RED_CRYSTAL_UNLOCK_COSTS[rarity]
  if(!costs) return null
  const skills=(char.skills||[]).filter(skill=>!skill.star6).slice(0,3)
  const idx=skills.findIndex(skill=>(skill.effects||[]).some(effect=>
    buffValueMatches(effect.effect,entry.value)&&
    buffStatMatches(effect.effect,stat)&&
    buffTargetMatches(skill,effect,kind,key)
  ))
  if(idx>=0) return costs[idx]
  const fallbackIdx=skills.findIndex(skill=>(skill.effects||[]).some(effect=>
    buffValueMatches(effect.effect,entry.value)&&buffStatMatches(effect.effect,stat)
  ))
  if(fallbackIdx>=0) return costs[fallbackIdx]
  const targetStatIdx=skills.findIndex(skill=>(skill.effects||[]).some(effect=>
    buffStatMatches(effect.effect,stat)&&buffTargetMatches(skill,effect,kind,key)
  ))
  return targetStatIdx>=0?costs[targetStatIdx]:null
}
export function RedCrystalCostChip({cost,value}){
  const locale=useLocale()
  const { t } = useTranslation('common')
  if(!cost) return null
  const efficiency=value?cost/value:null
  const tooltip=efficiency
    ?t('efficiencyTooltip', { value: formatLocaleNumber(Math.round(efficiency),locale), cost: formatLocaleNumber(cost,locale), buff: formatFixedNumber(value,locale) })
    :t('redCrystalCostTooltip', { cost: formatLocaleNumber(cost,locale) })
  return(
    <span className="cost-chip" data-tooltip={tooltip} tabIndex={0} aria-label={tooltip} style={{
      display:'inline-flex',alignItems:'center',gap:'3px',
      padding:'3px 8px',borderRadius:'999px',
      background:'#6a30c814',border:'1px solid #6a30c844',
      color:'#6a30c8',fontSize:'.67rem',fontWeight:900,
      whiteSpace:'nowrap',
    }}>
      <span>{t('costLabel')}</span>
      <img src="/icons/Red_Crystal.webp" alt={t('redCrystalAlt')} loading="lazy" decoding="async" style={{width:13,height:13,objectFit:'contain'}}/>
      <span>{formatLocaleNumber(cost,locale)}</span>
    </span>
  )
}
export function BuffValueCluster({value,color,cost,icon,iconLabel,iconTitle,fontSize='1.1rem',minWidth='52px'}){
  const locale=useLocale()
  return(
    <div className="buff-value-cluster" style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'8px',minWidth:'150px',flexShrink:0}}>
      {icon&&!cost&&<img
        src={icon}
        alt={iconLabel||'Unlock source'}
        title={iconTitle||iconLabel}
        loading="lazy"
        decoding="async"
        style={{width:20,height:20,objectFit:'contain',flexShrink:0}}
      />}
      <RedCrystalCostChip cost={cost} value={value}/>
      <div style={{fontWeight:900,fontSize,color,minWidth,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>+{formatFixedNumber(value,locale)}%</div>
    </div>
  )
}

export const FACTIONS=[
  {id:'qin',           label:'Qin',           jp:'秦',    color:'#c0392b'},
  {id:'zhao',          label:'Zhao',          jp:'趙',    color:'#3d6eb5'},
  {id:'chu',           label:'Chu',           jp:'楚',    color:'#7d52a0'},
  {id:'wei',           label:'Wei',           jp:'魏',    color:'#1a8a72'},
  {id:'yan',           label:'Yan',           jp:'燕',    color:'#1a7a65'},
  {id:'ai',            label:'Ai',            jp:'毐',    color:'#5d3d8a'},
  {id:'han',           label:'Han',           jp:'韓',    color:'#9a7a10'},
  {id:'qi',            label:'Qi',            jp:'斉',    color:'#a04020'},
  {id:'mountain_folk', label:'Mountain Folk', jp:'山の民', color:'#5a7a30'},
]
/**
 * Preset comps built around a unit type rather than a state: their members come
 * from four different countries, so assigning one would misclassify them.
 */
export const MIXED_COUNTRY='mixed'

export const CC=Object.fromEntries(FACTIONS.map(f=>[f.id,f.color]))

/**
 * Preset teams grouped by country, in the canonical FACTIONS order so the
 * sections read the same in every locale. Mixed comps come last.
 */
export function metaTeamsByCountry(teams=META_TEAMS){
  const order=[...FACTIONS.map(f=>f.id), MIXED_COUNTRY]
  const groups=new Map(order.map(id=>[id,[]]))
  for(const team of teams){
    if(!groups.has(team.country)) groups.set(team.country,[])
    groups.get(team.country).push(team)
  }
  return order.filter(id=>groups.get(id)?.length).map(id=>({country:id,teams:groups.get(id)}))
}

// 320px-wide grid thumbnails generated by scripts/gen_optimized_images.py —
// use for any display ≤ ~200px so phones don't download the full 626×880 art.
export const persosThumb=img=>img&&img.startsWith('/persos/')?img.replace('/persos/','/persos/thumbs/'):img

// One attempt per distinct source, then initials. Keep state inside this keyed
// instance so changing character/source resets recovery without touching callers.
function CharacterIconImage({sources,displayName,style,className,load,color,size}){
  const[failed,setFailed]=useState([])
  const src=sources.find(source=>!failed.includes(source))
  const fail=useCallback(()=>{
    if(src) setFailed(previous=>previous.includes(src)?previous:[...previous,src])
  },[src])
  // An eager SSR image can fail before hydration attaches onError. Also handles
  // a cached failed thumbnail without retrying either URL on unrelated renders.
  const imageRef=useCallback(image=>{
    if(image?.getAttribute('src')&&image.complete&&image.naturalWidth===0) fail()
  },[fail])
  if(src) return <img key={src} ref={imageRef} src={src} style={style} className={className} alt={displayName} decoding="async" onError={fail} {...load}/>
  // Use an opaque parchment base so faction tint stays readable on dark headers.
  return <div role="img" aria-label={displayName} style={{...style,maxWidth:'100%',maxHeight:'100%',backgroundColor:'var(--sur)',backgroundImage:`linear-gradient(${color}33,${color}33)`,color:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:size*.38+'px'}} className={className}>{Array.from(displayName.trim())[0]||'?'}</div>
}

// Icon -> existing banner thumbnail -> initial; never invent replacement art.
export function CharIcon({c,size=40,round=false,className='',eager=false}){
  const locale=useLocale()
  const{t}=useTranslation('common')
  const r=round?'50%':'8px'
  const s={width:size,height:size,borderRadius:r,objectFit:'cover',objectPosition:'center top',flexShrink:0,display:'block'}
  const displayName=c?.displayName||localizedCharacter(c,locale).displayName||t('unknown')
  const load=eager?{loading:'eager',fetchpriority:'high'}:{loading:'lazy'}
  const sources=[...new Set([c?.icon,c?.image&&persosThumb(c.image)].filter(Boolean))]
  const col=(CC[c?.country]||'#888888')
  return <CharacterIconImage key={JSON.stringify([c?.id,...sources])} sources={sources} displayName={displayName} style={c?.icon?s:{...s,objectPosition:'top center'}} className={className} load={load} color={col} size={size}/>
}


export const ROLE_SKILL_TYPES=new Set(['Leader','Strategist'])
export const TYPE_COLOR={Combat:'#c0392b',Strategy:'#3d6eb5',Leader:'#e07f48',Strategist:'#16a085','Internal Affairs':'#1a8a72'}
export const isBuffSummarySkill=(skill,includeCombat=false)=>
  skill?.type==='Strategy'||ROLE_SKILL_TYPES.has(skill?.type)||(includeCombat&&skill?.type==='Combat')

// ── Tier List + Meta team data ────────────────────────────────────────────────
// Single source of truth: META_TEAMS. Teams tagged with a `tier` (SS/S/A/B/C)
// appear on the Metawatch tier list; untagged teams are Party-Builder-only
// extras. TIER_TEAMS is derived from META_TEAMS, so both pages stay in sync.
export const TIER_COLORS={SS:'#d4a32c',S:'#c0392b',A:'#e07f48',B:'#cc972d',C:'#3d6eb5'}
export const META_TEAMS=[
  // Every preset carries its `country`, resolved from the members' own
  // character records rather than from the team name. `MIXED_COUNTRY` is for
  // comps built around a unit type rather than a state, whose members come
  // from four different countries.
  // ── Metawatch tier list (carry a `tier`; order within a tier = display order) ──
  {tier:'SS',name:'Gyokuhou',       country:'qin',           members:['Shoutaku','Ouhon','Kyuukou','Kanjou']},
  {tier:'S',name:'YTW',             country:'mountain_folk', members:['Katari','Yotanwa','Kitari','Ramauji']},
  {tier:'S',name:'Archers',         country:MIXED_COUNTRY,   members:['Keisha','Seikai','Hakurei','Queen Biki']},
  {tier:'A',name:'Zhao',            country:'zhao',          members:['Shunsuiju','Houken','Shinseijou','Riboku']},
  {tier:'S',name:'Wei',             country:'wei',           members:['Ranbihaku','Tairoji','Reiou','Gokei']},
  {tier:'S',name:'Karin + Kanmei',  country:'chu',           members:['Kyoubou','Karin','Kanmei','Shunshinkun']},
  {tier:'S',name:'Chu Shields',     country:'chu',           members:['Rien','Karin','Goutoku','Shunshinkun']},
  {tier:'A',name:'Hakuki + Ousen',  country:'qin',           members:['Hakuki','Makou','Akou','Ousen']},
  {tier:'A',name:'Hi Shin',         country:'qin',           members:['Garo','Gakurai','Naki','Robin']},
  {tier:'A',name:'YTW + Triplets',  country:'mountain_folk', members:['Yotanwa','Toji','Fuji','Ramauji']},
  {tier:'A',name:'Chu Cavalry',     country:'chu',           members:['Kyoubou','Rinbukun','Rokin','Kanmei']},
  {tier:'B',name:'6GG',             country:'qin',           members:['Sho','Ouki','Tou','Kyou']},
  {tier:'B',name:'Renpa v1',        country:'wei',           members:['Rinko','Tairoji','Renpa','Kouretsu']},
  {tier:'B',name:'Karin Army',      country:'chu',           members:['Karin','Kaen','Goutoku','Shunshinkun']},
  {tier:'B',name:'Han',             country:'han',           members:['Seikai','Chouin','Bakan','Nakon']},
  {tier:'C',name:'Ai',              country:'ai',            members:['Rouai','Hanoki','Ryofui','Hanroki']},
  {tier:'C',name:'Archer Garrison', country:MIXED_COUNTRY,   members:['Rouai','Queen Biki','Seikai','Keisha']},
  {tier:'C',name:'Rigan',           country:'zhao',          members:['Kisui','Kishou','Batei','Duke Sei']},
  {tier:'C',name:'Kanki',           country:'qin',           members:['Zenou','Raido','Kanki','Naki']},
  {tier:'C',name:'Ousen Army',      country:'qin',           members:['Eiki','Makou','Akou','Ousen']},
  {tier:'C',name:'Yan',             country:'yan',           members:['Ordo','Gakuki','Yukii','Otaji']},
  // ── Party-Builder-only extras (no `tier`, not on the tier list) ──
  {name:'Ouhon',          country:'qin', members:['Shoutaku','Ouhon','Kanjou','Gakuki']},
  {name:'Ousen v3',       country:'qin', members:['Ousen','Akou','Makou','Kyuukou']},
  {name:'Karin',          country:'chu', members:['Rien','Karin','Kaen','Goutoku']},
  {name:'Chu',            country:'chu', members:['Kyoubou','Rinbukun','Kanmei','Shunshinkun']},
  {name:'Renpa v2',       country:'wei', members:['Rinko','Kouretsu','Renpa','Kaishibou']},
  {name:'Moubo',          country:'qin', members:['Choushi','Moubu','Raiki','Ouken']},
  {name:'Qin Shields',    country:'qin', members:['Hakuki','Akou','Ousen','Ei Sei']},
  {name:'Makou Army',     country:'qin', members:['Makou','Koujyun','Chouyou','Denrimi']},
]
// Tier list = the META_TEAMS that carry a tier, with their colour resolved.
export const TIER_TEAMS=META_TEAMS.filter(t=>t.tier).map(t=>({...t,color:TIER_COLORS[t.tier]}))

// Formation order advances first-to-last; only each general's combat skill
// slots reverse. Official FAQ evidence and scope: docs/BATTLE_ORDER_EVIDENCE.md.
export function simulate(a,d){
  const st={attack:[],defense:[]}
  const roles={attack:[],defense:[]}
  for(const g of a){const s=(g.skills||[]).filter(s=>s.type==='Strategy');if(s.length)st.attack.push({general:g,skills:s})}
  for(const g of d){const s=(g.skills||[]).filter(s=>s.type==='Strategy');if(s.length)st.defense.push({general:g,skills:s})}
  for(const g of a){const s=(g.skills||[]).filter(s=>ROLE_SKILL_TYPES.has(s.type));if(s.length)roles.attack.push({general:g,skills:s})}
  for(const g of d){const s=(g.skills||[]).filter(s=>ROLE_SKILL_TYPES.has(s.type));if(s.length)roles.defense.push({general:g,skills:s})}
  const aq=a.map(g=>[...(g.skills||[]).filter(s=>s.type==='Combat')].reverse())
  const dq=d.map(g=>[...(g.skills||[]).filter(s=>s.type==='Combat')].reverse())
  const turns=[]
  for(let t=1;t<=4;t++){
    const e=[];const mx=Math.max(a.length,d.length)
    for(let i=0;i<mx;i++){
      if(i<a.length)e.push({general:a[i],skill:aq[i].shift()||null,side:'attack'})
      if(i<d.length)e.push({general:d[i],skill:dq[i].shift()||null,side:'defense'})
    }
    turns.push({turn:t,entries:e})
  }
  return{roles,st,turns}
}

// ── CW SIMULATION ENGINE ─────────────────────────────────────────────────────
// Pre-computed MAXED stats (Lv 85 + max LG rank + max upgradeLv + max star +
// rank 6 enhancement "+3" + max weapon Lv18). Extracted from decrypted
// masters_*.bin tables: mstUnitGenerals, mstUnitGeneralLevels,
// mstUnionConquestGenerals, mstUnionConquestGeneralGrowths,
// mstUnitGeneralUpgradeSeconds, mstUnitGeneralLgTypes, mstUnionConquestConsts.
// See C:\Users\Admin\Desktop\CW_MAX_STATS_FINDINGS.md for the full formula.
// Battle-time buffs (union boost, elixirs, role, admin, skills) are applied
// on top by simulateBattle() — NOT baked into these stats.
export const CW_MAX = cwMaxStats
// Rarity-based maxed defaults for chars without a pre-computed entry
// (scaled approximations for the 5 unmatched site chars: denti, kakubi,
//  muten_grandpa, shosa, ringyoku)
export const CW_DEF_MAX={
  N:{hp:15000,atk:5000,def:4500,maxMp:6000,critRate:500,critDmgRate:150,hitRate:11250,dodgeRate:1500,adSlay:7000,daSlay:9500,defPen:0},
  R:{hp:22000,atk:8000,def:7000,maxMp:7000,critRate:750,critDmgRate:150,hitRate:11500,dodgeRate:1750,adSlay:8500,daSlay:9300,defPen:300},
  SR:{hp:40000,atk:11000,def:8500,maxMp:8500,critRate:1000,critDmgRate:150,hitRate:11750,dodgeRate:1875,adSlay:10000,daSlay:8800,defPen:500},
  SSR:{hp:55000,atk:13000,def:9500,maxMp:9500,critRate:1250,critDmgRate:150,hitRate:11875,dodgeRate:1875,adSlay:11375,daSlay:9075,defPen:600},
  UR:{hp:75000,atk:15000,def:10000,maxMp:10500,critRate:1625,critDmgRate:150,hitRate:12000,dodgeRate:2000,adSlay:11750,daSlay:9150,defPen:750},
}

// CW type buffs: each unit type gets its own type's buffs only.
// unitType field is set per-character in cw_max_stats.json (from Excel data).
// Sum all contributor % values from cw_buffs.json per type.
export const _st=(type,cat)=>(cwBuffsData[type]?.[cat]||[]).reduce((s,e)=>s+e.value,0)
export const CW_TYPE_BUFFS={
  Infantry:{hp:_st('Infantry','HP'), atk:_st('Infantry','Attack'), def:_st('Infantry','Defense')},
  Cavalry: {hp:_st('Cavalry','HP'),  atk:_st('Cavalry','Attack'),  def:_st('Cavalry','Defense')},
  Archer:  {hp:_st('Archer','HP'),   atk:_st('Archer','Attack'),   def:_st('Archer','Defense')},
  Shield:  {hp:_st('Shield','HP'),   atk:_st('Shield','Attack'),   def:_st('Shield','Defense')},
}
// Scene card global bonuses (flat or internal rate points, applied to all CW characters)
export const SCENE_CARD=sceneCardBuffs.totals

// Return fully-buffed CW stats for a character at max enhancement.
// Applies unit-type % buffs from the CW Buffs page + scene card flat bonuses.
export function calcCwStats(char){
  const fallbackTier=classification[char.id]?.stats_fallback_rarity||char.rarity||'SR'
  const M=CW_MAX[char.id]||CW_DEF_MAX[fallbackTier]||CW_DEF_MAX.SR
  const unitType=char.unit_type||M.unitType||'Cavalry'
  const tb=CW_TYPE_BUFFS[unitType]||CW_TYPE_BUFFS.Cavalry
  const hp =Math.round(M.hp *(1+tb.hp /100)+SCENE_CARD.hp)
  const atk=Math.round(M.atk*(1+tb.atk/100)+SCENE_CARD.atk)
  const def=Math.round(M.def*(1+tb.def/100)+SCENE_CARD.def)
  const maxMp=Math.round(M.maxMp+SCENE_CARD.maxMp)
  return{
    hp,atk,def,maxMp,
    critRate:Math.min(10000,(M.critRate||1250)+SCENE_CARD.critRate),
    critDmgRate:M.critDmgRate||150,
    hitRate:M.hitRate||11875,
    dodgeRate:Math.min(10000,(M.dodgeRate||1875)+SCENE_CARD.dodgeRate),
    adSlay:M.adSlay||11375, daSlay:M.daSlay||9075, defPen:M.defPen||0,
  }
}

// 30-turn Castle Wars combat simulation
// Based on mstUnionConquestConsts damage formula and turn structure
export function simulateBattle(atkTeam,defTeam){
  // Constants from mstUnionConquestConsts
  const MP_REC=0.10   // ~10% maxMp recovered per turn
  const SKILL_COST_RATE=0.20  // active skill costs ~20% of maxMp
  const mk=g=>{
    const s=calcCwStats(g)
    const combatSks=[...(g.skills||[]).filter(sk=>sk.type==='Combat')].reverse()
    return{g,...s,curHp:s.hp,mp:0,alive:true,skIdx:0,combatSks,totalDmgDone:0,totalDmgTaken:0}
  }
  const aS=atkTeam.map(mk)
  const dS=defTeam.map(mk)
  const log=[]
  let winner=null,finalTurn=30
  for(let t=1;t<=30;t++){
    const tev=[]
    // Action order: slots 0→3, each slot: ATK actor then DEF actor
    for(let i=0;i<4;i++){
      for(const{actor,enemies,side}of[{actor:aS[i],enemies:dS,side:'attack'},{actor:dS[i],enemies:aS,side:'defense'}]){
        if(!actor||!actor.alive) continue
        // MP recovery per turn
        actor.mp=Math.min(actor.maxMp,actor.mp+actor.maxMp*MP_REC)
        const alive=enemies.filter(e=>e.alive)
        if(!alive.length) continue
        // Target: lowest current HP (focus fire)
        const target=alive.reduce((a,b)=>a.curHp<b.curHp?a:b)
        // Active skill check
        let skill=null
        const cost=actor.maxMp*SKILL_COST_RATE
        if(actor.combatSks.length&&actor.mp>=cost){
          skill=actor.combatSks[actor.skIdx%actor.combatSks.length]
          actor.skIdx++; actor.mp-=cost
        }
        // Damage: ATK × rand(0.95–1.60) × (adSlay/10000) × (1 − daSlay/10000) × skillMult × critMult
        // Per-character adSlay/daSlay from mstUnionConquestGeneralGrowths (10000-basis)
        const rand=0.95+Math.random()*0.65
        const isCrit=Math.random()<(actor.critRate/10000)
        const adFactor=actor.adSlay/10000
        const daFactor=1-(target.daSlay/10000)
        const critMult=isCrit?(1+(actor.critDmgRate||150)/100):1.0
        const dmg=Math.max(
          Math.round(actor.atk*0.20),  // power competition floor: 20% ATK minimum
          Math.round(actor.atk*rand*adFactor*daFactor*(skill?1.5:1.0)*critMult)
        )
        target.curHp=Math.max(0,target.curHp-dmg)
        actor.totalDmgDone+=dmg; target.totalDmgTaken+=dmg
        const died=target.curHp===0&&target.alive
        if(died) target.alive=false
        tev.push({side,actor,target,dmg,skill,isCrit,died,turn:t})
      }
    }
    log.push({turn:t,events:tev})
    const aA=aS.filter(s=>s.alive).length,dA=dS.filter(s=>s.alive).length
    if(!dA){winner='attack';finalTurn=t;break}
    if(!aA){winner='defense';finalTurn=t;break}
  }
  if(!winner){
    const aHp=aS.reduce((s,g)=>s+g.curHp,0)/Math.max(1,aS.reduce((s,g)=>s+g.hp,0))
    const dHp=dS.reduce((s,g)=>s+g.curHp,0)/Math.max(1,dS.reduce((s,g)=>s+g.hp,0))
    winner=aHp>dHp?'atk_pts':'def_pts'
  }
  return{aS,dS,log,winner,finalTurn}
}

// ── BUFF ENGINE ───────────────────────────────────────────────────────────────
export const UNIT_TYPE_LIST=['Infantry','Cavalry','Archer','Shield']
export const FACTION_MAP={'qin':'qin','zhao':'zhao','chu':'chu','wei':'wei','yan':'yan','qi':'qi','han':'han','mountain folk':'mountain_folk','ai':'ai'}
export const STATUS_EFFECTS=['Confusion','Poison','Paralysis','Betrayal','Burn','Fear','Illusion','Reckless']
export const STATUS_RE=new RegExp('^('+STATUS_EFFECTS.join('|')+')','i')
export const TARGET_NAME_ALIASES={moubo:'moubu',ghm:'gohoumei'}
export const normalizeBuffStat=s=>/^Evasion Rate$/i.test(s)?'Evasion':s
export const BUFF_APPLICABILITY=Object.freeze({
  APPLICABLE:'applicable',
  IMPOSSIBLE:'impossible',
  CONDITIONAL:'conditional',
  UNSUPPORTED:'unsupported',
})

// Extract a matchup qualifier without throwing its meaning away.  The old
// parser deleted `vs X` before it built the numeric modifier, which made a
// restricted bonus indistinguishable from an unconditional one.
export function extractOpponentQualifier(value){
  const text=String(value||'').trim()
  const match=text.match(/(?:^|\s)\b(?:vs\.?|versus|against)\s+(.+?)(?=\s+(?:Up|Down)\s+\d+(?:\.\d+)?[%％]|\s+\d+(?:\.\d+)?[%％](?:\s|$)|$)/i)
  if(!match) return{text,raw:null}
  const start=match.index||0
  const end=start+match[0].length
  return{
    text:`${text.slice(0,start)} ${text.slice(end)}`.replace(/\s+/g,' ').trim(),
    raw:match[1].trim(),
  }
}

const decorateBuffQualifier=entry=>{
  const opponentRaw=entry.opponentRaw||entry.antiEnemy||null
  return{
    ...entry,
    recipientCriteria:entry.recipientRaw?parseCriterionExpression(entry.recipientRaw):null,
    opponentRaw,
    opponentCriteria:opponentRaw?parseCriterionExpression(opponentRaw):null,
  }
}
const mergeEquivalentOpponentModifiers=modifiers=>{
  const merged=[]
  const byMechanicalValue=new Map()
  for(const modifier of modifiers){
    if(!modifier.opponentRaw){
      merged.push(modifier)
      continue
    }
    const key=[modifier.stat,modifier.dir,modifier.val,modifier.recipientRaw||'',modifier.ownerType||''].join('|')
    const prior=byMechanicalValue.get(key)
    if(!prior){
      const copy={...modifier}
      copy.opponentAlternatives=[modifier.opponentRaw]
      byMechanicalValue.set(key,copy)
      merged.push(copy)
      continue
    }
    if(!prior.opponentAlternatives.includes(modifier.opponentRaw)) prior.opponentAlternatives.push(modifier.opponentRaw)
    prior.opponentRaw=prior.opponentAlternatives.join(' / ')
    prior.opponentCriteria=parseCriterionExpression(prior.opponentRaw)
    prior.antiEnemy=null
  }
  return merged
}
export function parseBuffEffect(str){
  if(!str) return []
  const results=[];let deferred=[],inheritedRecipientRaw=null
  for(let part of str.split(/[,、/]/)){
    part=part.trim().replace(/\\/g,'').replace(/["\u201C\u201D\u300C\u300D]/g,'').trim()
    part=part.replace(/^and\s+/i,'').replace(/\s*\(Dodge Chance\)/gi,'').replace(/\s+additional\b/gi,'').trim()
    if(!part) continue
    if(/^enemy/i.test(part)) continue
    if(/\d+[%％]\s*Damage|^%\s*(?:of\s+|Damage)|HP Drain|Stun Rate/i.test(part)) continue
    if(/^Provoke$/i.test(part)) continue
    if(/^Normal Attack(?!\s+Seal)/i.test(part)) continue
    let ownerType=null,antiEnemy=null,recipientRaw=inheritedRecipientRaw,m
    const versus=extractOpponentQualifier(part)
    part=versus.text
    const opponentRaw=versus.raw
    // "Ally [X] Anti-[Y] ..." — owner unit type + anti enemy type
    m=part.match(/^(?:Ally\s+)\[([A-Za-z]+)\]\s+Anti-\[([^\]]+)\]\s+(.+)/i)
    if(m){ownerType=m[1];recipientRaw=m[1].trim();antiEnemy=m[2].trim();part=m[3]}
    // "[X] Anti-[Y] ..." — owner unit type + anti enemy type
    if(!ownerType){
      m=part.match(/^\[([A-Za-z]+)\]\s+Anti-\[([^\]]+)\]\s+(.+)/i)
      if(m){ownerType=m[1];recipientRaw=m[1].trim();antiEnemy=m[2].trim();part=m[3]}
    }
    // "Anti-[X] ..." — bracketed anti target
    if(!antiEnemy){
      m=part.match(/^Anti-\[([^\]]+)\]\s+(.+)/i)
      if(m){antiEnemy=m[1].trim();part=m[2]}
    }
    // "Anti-GroupName ..."
    if(!antiEnemy){
      for(const gn of Object.keys(GROUPS)){
        const re=new RegExp('^Anti-'+gn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s+(.+)','i')
        m=part.match(re)
        if(m){antiEnemy=gn;part=m[1];break}
      }
    }
    // Some derived rows repeat a recipient scope inside the effect string.
    // Preserve it as a mechanical criterion instead of deleting it.
    m=part.match(/^Ally\s+\[([^\]]+)\]\s+(.+)/i)
    if(m){recipientRaw=m[1].trim();part=m[2]}
    if(recipientRaw) inheritedRecipientRaw=recipientRaw
    if(!part) continue
    const qualify=r=>decorateBuffQualifier({...r,ownerType,antiEnemy,recipientRaw,opponentRaw})
    const flush=r=>{
      results.push(qualify(r))
      for(const d of deferred){
        if(d.statusPrefix!==undefined){
          const suffix=r.stat.replace(/^[A-Za-z]+\s*/,'')
          if(suffix) results.push(decorateBuffQualifier({...d,stat:d.statusPrefix+' '+suffix,dir:r.dir,val:r.val}))
        } else if(d.dir===r.dir){
          results.push(decorateBuffQualifier({...d,val:r.val}))
        }
      }
      deferred=[]
    }
    // "Provoke Infliction"
    if(/^Provoke Infliction$/i.test(part)){flush({stat:'Provoke Infliction Rate',dir:'Up',val:100,ownerType,antiEnemy});continue}
    // boolean flag buffs (non-numeric — encoded as val=1 for display purposes)
    if(/^Attack Nullification$/i.test(part)){flush({stat:'Attack Nullification',dir:'Up',val:1,ownerType,antiEnemy});continue}
    if(/^Status(?:\s+Effect|\s+Abnormality)\s+(?:Immunity|Nullification)/i.test(part)){flush({stat:'Status Effect Immunity',dir:'Up',val:1,ownerType,antiEnemy});continue}
    if(/^Sure Hit$/i.test(part)){flush({stat:'Sure Hit',dir:'Up',val:1,ownerType,antiEnemy});continue}
    if(/^Less Likely to be Targeted$/i.test(part)){flush({stat:'Less Likely to be Targeted',dir:'Up',val:1,ownerType,antiEnemy});continue}
    if(/^Rampage$/i.test(part)){flush({stat:'Rampage',dir:'Up',val:1,ownerType,antiEnemy});continue}
    // "ATK Up (max X%)" — stacking buff with cap, no per-stack value given
    m=part.match(/^(.+?)\s+(Up|Down)\s+\(max\s+(\d+(?:\.\d+)?)[%％]\)$/i)
    if(m){flush({stat:normalizeBuffStat(m[1].trim()),dir:m[2],val:parseFloat(m[3]),ownerType,antiEnemy});continue}
    // "Stat Up/Down X%"
    m=part.match(/^(.+?)\s+(Up|Down)\s+(\d+(?:\.\d+)?)[%％]/)
    if(m){flush({stat:normalizeBuffStat(m[1].trim()),dir:m[2],val:parseFloat(m[3]),ownerType,antiEnemy});continue}
    // "Stat Up/Down" (no value) — deferred
    m=part.match(/^(.+?)\s+(Up|Down)\s*$/)
    if(m){deferred.push(qualify({stat:normalizeBuffStat(m[1].trim()),dir:m[2]}));continue}
    // "DEF Penetration [Resistance] X%"
    m=part.match(/^(DEF Penetration(?:\s+Resistance)?)\s+(\d+(?:\.\d+)?)[%％]$/)
    if(m){flush({stat:m[1],dir:'Up',val:parseFloat(m[2]),ownerType,antiEnemy});continue}
    // "StatusEffect Infliction X%" (e.g. "Confusion Infliction 30%")
    m=part.match(new RegExp('^('+STATUS_EFFECTS.join('|')+')\\s+Infliction\\s+(\\d+(?:\\.\\d+)?)[%％]$','i'))
    if(m){flush({stat:m[1]+' Infliction Rate',dir:'Up',val:parseFloat(m[2]),ownerType,antiEnemy});continue}
    // "StatusEffect Infliction" (no value) — treat as 100%
    m=part.match(new RegExp('^('+STATUS_EFFECTS.join('|')+')\\s+Infliction$','i'))
    if(m){flush({stat:m[1]+' Infliction Rate',dir:'Up',val:100,ownerType,antiEnemy});continue}
    // "StatusEffect Resistance X%"
    m=part.match(new RegExp('^('+STATUS_EFFECTS.join('|')+')\\s+Resistance\\s+(\\d+(?:\\.\\d+)?)[%％]$','i'))
    if(m){flush({stat:m[1]+' Resistance',dir:'Up',val:parseFloat(m[2]),ownerType,antiEnemy});continue}
    // "StatusEffect Resistance" (no value) — deferred
    m=part.match(new RegExp('^('+STATUS_EFFECTS.join('|')+')\\s+Resistance$','i'))
    if(m){deferred.push(qualify({stat:m[1]+' Resistance',dir:'Up'}));continue}
    // bare status name (e.g. "Confusion" from "Confusion / Poison / Paralysis Infliction Rate Up 40%")
    m=part.match(STATUS_RE)
    if(m&&part.trim()===m[1].trim()){deferred.push(qualify({statusPrefix:m[1]}));continue}
    // "Normal Attack Seal X%" / "Skill Attack Seal X%"
    m=part.match(/^(Normal|Skill)\s+Attack\s+Seal(?:\s+Infliction)?\s*(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:m[1]+' Attack Seal',dir:'Up',val:parseFloat(m[2]),ownerType,antiEnemy});continue}
    // "Attack Seal Infliction X%"
    m=part.match(/^Attack\s+Seal\s+Infliction\s+(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:'Attack Seal',dir:'Up',val:parseFloat(m[1]),ownerType,antiEnemy});continue}
    // Source text calls 体力回復無効 "HP Seal" in four derived rows. It is
    // the same mechanical state as the existing HP Recovery Nullification stat.
    m=part.match(/^HP\s+Seal\s*(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:'HP Recovery Nullification',dir:'Up',val:parseFloat(m[1]),ownerType,antiEnemy});continue}
    // Simple rate buffs
    m=part.match(/^(Guard|Hit Rate|Critical Rate|HP Recovery)\s+(\d+(?:\.\d+)?)[%％]$/)
    if(m){flush({stat:m[1],dir:'Up',val:parseFloat(m[2]),ownerType,antiEnemy});continue}
    // "Poison Damage Up X%"
    m=part.match(/^(Poison Damage)\s+(Up|Down)\s+(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:m[1],dir:m[2],val:parseFloat(m[3]),ownerType,antiEnemy});continue}
    // "Morale Recovery X%" / "Continuous Morale Recovery X%"
    m=part.match(/^(?:Continuous\s+)?Morale Recovery\s+(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:'Morale Recovery',dir:'Up',val:parseFloat(m[1]),ownerType,antiEnemy});continue}
    // "Continuous HP Recovery X%"
    m=part.match(/^Continuous HP Recovery\s+(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:'HP Recovery',dir:'Up',val:parseFloat(m[1]),ownerType,antiEnemy});continue}
    // "HP Recovery Nullification X%"
    m=part.match(/^HP Recovery Nullification\s+(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:'HP Recovery Nullification',dir:'Up',val:parseFloat(m[1]),ownerType,antiEnemy});continue}
    // "Morale Cost Reduction / Morale Consumption Down X%"
    m=part.match(/^(?:Morale Cost(?:\s+Reduction)?|Morale Consumption(?:\s+Reduction)?|Morale Cost Down)\s+(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:'Morale Consumption',dir:'Down',val:parseFloat(m[1]),ownerType,antiEnemy});continue}
    // Evasion/Dodge Chance X% (bare number, no Up/Down)
    m=part.match(/^(?:Evasion(?:\s*\([^)]*\))?|Dodge Chance)\s+(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:'Evasion',dir:'Up',val:parseFloat(m[1]),ownerType,antiEnemy});continue}
    // "Squad Damage Reduction X%"
    m=part.match(/^Squad Damage Reduction\s+(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:'Squad Damage Reduction',dir:'Up',val:parseFloat(m[1]),ownerType,antiEnemy});continue}
    // "ATK Down Resistance / DEF Down Resistance X%"
    m=part.match(/^((?:ATK|DEF)\s+(?:Up|Down)\s+Resistance)\s+(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:m[1],dir:'Up',val:parseFloat(m[2]),ownerType,antiEnemy});continue}
    // "Damage Taken/Dealt/Reduction Resistance X%"
    m=part.match(/^(Damage\s+(?:Taken Increase|Dealt Reduction|Reduction Effect)\s+Resistance)\s+(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:m[1].replace(/\s+/g,' '),dir:'Up',val:parseFloat(m[2]),ownerType,antiEnemy});continue}
  }
  return mergeEquivalentOpponentModifiers(results)
}
export const normalizeRosterLabel=s=>(s||'').toLowerCase().replace(/[^a-z]/g,'')
export function groupMatchesLabel(groupName,label){
  const g=normalizeRosterLabel(groupName)
  const l=normalizeRosterLabel(label)
  return !!l&&(g===l||g.includes(l)||l.includes(g)||g.includes(l.replace(/s$/,''))||l.includes(g.replace(/s$/,'')))
}
export function inGroup(c,groupName){
  return(c.groups||[]).some(gn=>groupMatchesLabel(gn,groupName))
}
export function cleanRosterCriterion(label){
  const normalized=(label||'')
    .replace(/[[\]"“”「」]/g,' ')
    .replace(/\bother\s+than\s+self\b/gi,'')
    .replace(/\bbesides\s+self\b/gi,'')
    .replace(/\bsurviving\b/gi,'')
    .replace(/^(?:when\s+)?(?:other\s+)?(?:ally|enemy)\b/gi,'')
    .replace(/\bally\b/gi,'')
    .replace(/\btroops?\b|\bsoldiers?\b|\bmembers?\b/gi,'')
    .replace(/\s+/g,' ')
    .trim()
  // Suffix removal must happen after bracket/whitespace normalization.  With
  // the old order, `[Qin] [General]` became `Qin General` too late for the
  // end-anchored rule and therefore meant something different from prose.
  return normalized
    .replace(/^(.+)\s+generals?$/i,'$1')
    .replace(/^(.+)\s+unit$/i,'$1')
    .trim()
}
export function parseRosterCriterion(label){
  if(label&&typeof label==='object'&&label.kind) return label
  const original=String(label||'').trim()
  if(!original) return null

  // Multiple bracket tags describe one mechanical recipient, e.g.
  // `[Qin] [Cavalry] [General]`.  General is the universal tag; the remaining
  // tags are an intersection on the same roster member.
  const bracketTags=[...original.matchAll(/\[([^\]]+)\]/g)].map(m=>m[1].trim())
  const meaningfulTags=bracketTags.filter(tag=>!/^generals?$/i.test(tag))
  if(meaningfulTags.length>1){
    const criteria=meaningfulTags.map(tag=>parseRosterCriterion(tag))
    if(criteria.every(Boolean)) return{kind:'allOf',criteria,raw:original}
    return null
  }
  if(meaningfulTags.length===1){
    const outside=cleanRosterCriterion(original.replace(/\[[^\]]+\]/g,' '))
    if(!outside||/^generals?$/i.test(outside)) return parseRosterCriterion(meaningfulTags[0])
  }

  const raw=cleanRosterCriterion(original)
  if(!raw) return null
  const norm=normalizeRosterLabel(raw)
  if(/^(?:general|generals)$/.test(norm)) return{kind:'all',id:'general',raw:original}
  const unit=UNIT_TYPE_LIST.find(u=>{
    const n=normalizeRosterLabel(u)
    return norm===n||norm===`${n}s`||(u==='Archer'&&norm==='archers')
  })
  if(unit) return{kind:'unitType',id:unit,raw:original}
  for(const [labelText,code] of Object.entries(FACTION_MAP)){
    if(norm===normalizeRosterLabel(labelText)) return{kind:'faction',id:code,raw:original}
  }
  // Exact stable character names win over fuzzy group aliases. "Renpa"
  // means the named general; "Renpa Army" means the group.
  const aliasId=TARGET_NAME_ALIASES[norm]
  if(aliasId) return{kind:'character',id:aliasId,raw:original}
  const named=ALL.filter(character=>normalizeRosterLabel(character.name_en)===norm)
  if(named.length===1) return{kind:'character',id:named[0].id,raw:original}
  const groups=Object.keys(GROUPS).filter(groupName=>groupMatchesLabel(groupName,raw))
  if(groups.length===1) return{kind:'group',id:groups[0],raw:original}
  return null
}
export function parseCriterionExpression(value,operator='any'){
  const raw=String(value||'').trim()
  if(!raw) return null
  const parts=raw
    .replace(/\bor\b/gi,'/')
    .split('/')
    .map(part=>part.trim())
    .filter(Boolean)
  const criteria=parts.map(parseRosterCriterion)
  if(!criteria.length||criteria.some(criterion=>!criterion)) return null
  return{kind:'expression',operator,criteria,raw}
}
export function rosterCriterionMatches(c,label,owner,forceOther=false){
  if(!c) return false
  const source=typeof label==='string'?label:label?.raw||''
  const other=forceOther||/\bother(?:\s+ally)?\b|\bother\s+than\s+self\b|\bbesides\s+self\b/i.test(source)
  if(other&&owner&&c.id===owner.id) return false
  const criterion=parseRosterCriterion(label)
  if(!criterion) return false
  if(criterion.kind==='expression'){
    const checks=criterion.criteria.map(part=>rosterCriterionMatches(c,part,owner,other))
    return criterion.operator==='all'?checks.every(Boolean):checks.some(Boolean)
  }
  if(criterion.kind==='allOf') return criterion.criteria.every(part=>rosterCriterionMatches(c,part,owner,other))
  if(criterion.kind==='all') return true
  if(criterion.kind==='unitType') return c.unit_type===criterion.id
  if(criterion.kind==='faction') return c.country===criterion.id
  if(criterion.kind==='group') return inGroup(c,criterion.id)
  if(criterion.kind==='character') return c.id===criterion.id&&(!owner||c.id!==owner.id)
  return false
}

export function rosterHasCriterion(roster,expression,owner=null,forceOther=false){
  return(roster||[]).some(character=>rosterCriterionMatches(character,expression,owner,forceOther))
}

// Target wording can carry a matchup restriction as well as a recipient, e.g.
// `Self vs cavalry` or `Ally [Shield] vs cavalry`.  Keep those as two separate
// mechanical fields so recipient matching never has to discard the opponent.
export function parseTargetMechanics(target){
  const raw=String(target||'').trim()
  if(!raw) return{target:raw,opponentRaw:null,opponentCriteria:null}
  const bases=[]
  const opponentParts=[]
  for(const segment of raw.split('/')){
    const parsed=extractOpponentQualifier(segment)
    if(parsed.raw) opponentParts.push(parsed.raw)
    if(parsed.text) bases.push(parsed.text)
  }
  if(!opponentParts.length) return{target:raw,opponentRaw:null,opponentCriteria:null}
  const opponentRaw=opponentParts.join(' / ')
  return{
    target:bases.join(' / ').trim(),
    opponentRaw,
    opponentCriteria:parseCriterionExpression(opponentRaw),
  }
}
export function parseEnemyTargetState(target){
  const mechanics=parseTargetMechanics(target)
  const match=mechanics.target.match(/^((?:\d+\s+|all\s+|other\s+)?)(poisoned|burned|feared|confused|paralysed|paralyzed)\s+enemy\b(.*)$/i)
  if(!match) return null
  const statusLabel=match[2].toLowerCase()==='paralyzed'?'Paralysed':match[2][0].toUpperCase()+match[2].slice(1).toLowerCase()
  return{
    statusLabel,
    target:`${match[1]}enemy${match[3]}`.replace(/\s+/g,' ').trim(),
    raw:mechanics.target,
  }
}
export function parseEnemyTargetCriteria(target){
  const stateTarget=parseEnemyTargetState(target)
  const base=parseTargetMechanics(stateTarget?.target||target).target.trim()
  if(!/^(?:\d+\s+|all\s+|other\s+)?enemy\b/i.test(base)) return null
  const parts=base
    .replace(/\s+and\s+(?=\[)/gi,'/')
    .split('/')
    .map(part=>part
      .replace(/^\s*(?:\d+\s+|all\s+|other\s+)?enemy\s*/i,'')
      .replace(/\s+with\s+(?:the\s+)?(?:highest|lowest|earliest|latest)\b.*$/i,'')
      .replace(/\s+(?:earliest|latest|first|last)\s+in\s+formation(?:\s+order)?\b.*$/i,'')
      .replace(/\s+(?:in|at)\s+formation\b.*$/i,'')
      .trim())
    .filter(Boolean)
  if(!parts.length) return{restricted:false,criteria:null,unsupported:[],raw:base}
  const criteria=[]
  const unsupported=[]
  for(const part of parts){
    const criterion=parseRosterCriterion(part)
    if(!criterion) unsupported.push(part)
    else if(criterion.kind!=='all') criteria.push(criterion)
  }
  return{
    restricted:criteria.length>0||unsupported.length>0,
    criteria:criteria.length?{kind:'expression',operator:'any',criteria,raw:parts.join(' / ')}:null,
    unsupported,
    raw:base,
  }
}
export function matchAllyRosterListTarget(t,G,owner){
  if(!/^(?:surviving\s+)?(?:other\s+)?ally\b/i.test(t)) return null
  const globalOther=/^(?:surviving\s+)?other\s+ally\b/i.test(t)
  const parts=t
    .replace(/\band\b/gi,'/')
    .replace(/,/g,'/')
    .split('/')
    .map(p=>p.trim())
    .filter(Boolean)
  let sawRosterCriterion=false
  let matched=false
  for(let part of parts){
    let other=globalOther
    part=part
      .replace(/^surviving\s+/i,'')
      .replace(/^ally\s+/i,'')
      .replace(/^other\s+ally\s+/i,()=>{other=true;return''})
      .replace(/^other\s+/i,()=>{other=true;return''})
      .trim()
    const recognizes=team=>team.some(c=>rosterCriterionMatches(c,part,owner,other))
    if(!recognizes(ALL)) continue
    sawRosterCriterion=true
    if(rosterCriterionMatches(G,part,owner,other)) matched=true
  }
  return sawRosterCriterion?matched:null
}
export function isTargetedBy(target,G,owner,team){
  if(!target) return false
  const t=parseTargetMechanics(target).target.trim()
  if(/^enemy|^1\s*enemy|^other\s+enemy|^siege\s+weapon|^ally\s+siege|^gate|^\d+\s+enemy|^Enemy\s*\[/i.test(t)) return false
  // "Self and/or ally X"
  const selfAnd=/^self(?:\s+and|\s*[/,])\s*ally\s+(.+)/i.exec(t)
  if(selfAnd){if(G.id===owner.id) return true; return isTargetedBy('Ally '+selfAnd[1],G,owner,team)}
  // "Self" only
  if(/^self$/i.test(t)) return G.id===owner.id
  const rosterListMatch=matchAllyRosterListTarget(t,G,owner)
  if(rosterListMatch!==null) return rosterListMatch
  // Multi-target split on "/"
  if(t.includes('/')) return t.split('/').some(p=>isTargetedBy(p.trim(),G,owner,team))
  const isOther=/^other(?:\s+ally)?\s*/i.test(t)
  if(isOther&&G.id===owner.id) return false
  // "Ally [X] and [Y]" — two unit types
  const multiUT=t.match(/\[([A-Za-z]+)\]\s+and\s+\[([A-Za-z]+)\]/i)
  if(multiUT&&UNIT_TYPE_LIST.includes(multiUT[1])&&UNIT_TYPE_LIST.includes(multiUT[2])){
    if(/other than self/i.test(t)&&G.id===owner.id) return false
    return G.unit_type===multiUT[1]||G.unit_type===multiUT[2]
  }
  // Collect ALL brackets — handles [Infantry], [Qin], [Qin][Cavalry], [Mountain Folk], etc.
  const allBrackets=[...t.matchAll(/\[([A-Za-z ]+)\]/gi)].map(m=>m[1])
  const bUT=allBrackets.find(b=>UNIT_TYPE_LIST.includes(b))
  const bCtry=allBrackets.find(b=>FACTION_MAP[b.toLowerCase()])
  if(bUT||bCtry){
    if(/other than self/i.test(t)&&G.id===owner.id) return false
    const utOk=bUT?G.unit_type===bUT:true
    const ctryOk=bCtry?G.country===FACTION_MAP[bCtry.toLowerCase()]:true
    return utOk&&ctryOk
  }
  // "Ally shield soldiers", "Ally cavalry troops", "Ally archers vs ...", etc.
  const utWordM=/ally\s+(shield|infantry|cavalry|archers?)/i.exec(t)
  if(utWordM){
    const w=utWordM[1].toLowerCase()
    return G.unit_type===(w.startsWith('archer')?'Archer':w[0].toUpperCase()+w.slice(1))
  }
  // Group matching
  for(const gn of Object.keys(GROUPS)){
    if(t.toLowerCase().includes(gn.toLowerCase())) return inGroup(G,gn)
  }
  // "All ally generals", "Ally generals", "Ally [General]" → everyone
  if(/all\s+all(?:ies|y)|(?:^|\s)ally\s+\[?generals?\]?/i.test(t)) return true
  // "Other ally generals" / "Other ally" → everyone except self
  if(/other\s+ally/i.test(t)) return G.id!==owner.id
  // Bare country names: "Ally Qin", "Ally Zhao", "Other ally Chu", "Ally Mountain Folk", etc.
  for(const [label,code] of Object.entries(FACTION_MAP)){
    if(new RegExp('ally\\s+'+label.replace(/ /g,'\\s+'),'i').test(t)) return G.country===code
  }
  // Specific named general: "Ally Name"
  const nameM=/(?:surviving\s+)?ally\s+"?([^"/\n,[\]]+?)"?\s*(?:vs\s+\S.*)?$/i.exec(t)
  if(nameM){
    const nm=nameM[1].trim()
    if(!nm) return false
    const nmKey=nm.toLowerCase()
    const aliasId=TARGET_NAME_ALIASES[nmKey]
    if(aliasId) return G.id===aliasId&&G.id!==owner.id
    const nmFirst=nmKey.split(' ')[0]
    for(const gn of Object.keys(GROUPS)){if(gn.toLowerCase().split(' ')[0]===nmFirst) return inGroup(G,gn)}
    return G.name_en.toLowerCase()===nmKey&&G.id!==owner.id
  }
  return false
}
export function parseAllyCountCondition(cond){
  const text=String(cond||'')
  const perIdx=text.search(/\bper\s+(?:other\s+)?ally\b/i)
  if(perIdx<0) return null
  const tail=text.slice(perIdx)
  // Attack-event counts are battle state, not roster size.  Ordo's
  // "Per ally [General] attack count" previously scaled with team members.
  if(/\battack\s+count\b/i.test(tail)) return{kind:'battleCount',supported:true,terms:[],raw:tail}
  const parts=tail
    .replace(/、/g,'/')
    .split('/')
    .map(part=>part.trim())
    .filter(Boolean)
  const terms=[]
  let inheritedOther=false
  for(let part of parts){
    let excludeSelf=inheritedOther
    const explicit=/\bper\s+(other\s+)?ally\s+(.+)/i.exec(part)
    if(explicit){
      excludeSelf=!!explicit[1]
      inheritedOther=excludeSelf
      part=explicit[2]
    }
    if(/\b(?:besides\s+self|other\s+than\s+self)\b/i.test(part)) excludeSelf=true
    part=part
      .replace(/\b(?:besides\s+self|other\s+than\s+self)\b/gi,'')
      .replace(/\s*\((?:max(?:imum)?|up to)\b[^)]*\)\s*$/i,'')
      .trim()
    if(!part) continue
    terms.push({raw:part,excludeSelf,criteria:parseCriterionExpression(part)})
  }
  return{
    kind:'rosterCount',
    supported:terms.length>0&&terms.every(term=>term.criteria),
    terms,
    raw:tail,
  }
}
export function getMultiplier(cond,owner,team){
  const count=parseAllyCountCondition(cond)
  if(!count||count.kind==='battleCount') return 1
  if(!count.supported) return 0
  const matched=new Set()
  for(const term of count.terms){
    for(const member of team||[]){
      if(rosterCriterionMatches(member,term.criteria,owner,term.excludeSelf)) matched.add(member.id)
    }
  }
  return matched.size
}
export function isCondActive(cond,isDefense){
  if(!cond) return true
  const c=cond.toLowerCase()
  if(c.includes('garrison')) return isDefense
  if(c.includes('when defending')) return isDefense
  if(c.includes('when attacking')) return !isDefense
  return true
}

function parsePresenceExpression(raw){
  const text=String(raw||'').replace(/\bboth\b/gi,'').trim()
  if(!text) return{kind:'presence',operator:'any',criteria:[{kind:'all',id:'general',raw:'General'}],raw:text}
  if(/\s+and\s+/i.test(text)){
    const criteria=text.split(/\s+and\s+/i).map(parseRosterCriterion)
    return criteria.every(Boolean)?{kind:'presence',operator:'all',criteria,raw:text}:null
  }
  const expression=parseCriterionExpression(text)
  return expression?{kind:'presence',operator:expression.operator,criteria:expression.criteria,raw:text}:null
}
export function parsePresenceRequirements(cond){
  const text=String(cond||'')
  const requirements=[]
  const seen=new Set()
  const add=(side,raw,excludeSelf,stateWord)=>{
    const cleaned=String(raw||'')
      .replace(/^when\s+/i,'')
      .replace(/\b(?:other\s+than\s+self|besides\s+self)\b/gi,'')
      .trim()
    const forceOther=excludeSelf||/\b(?:other\s+than\s+self|besides\s+self)\b/i.test(String(raw||''))
    const key=`${side}|${cleaned}|${forceOther}|${stateWord}`
    if(seen.has(key)) return
    seen.add(key)
    requirements.push({side,raw:cleaned,excludeSelf:forceOther,stateWord,criteria:parsePresenceExpression(cleaned)})
  }
  // Presence conditions in the corpus are short clauses. Parse each clause
  // once, in specificity order, so "enemy [Archer] is alive" cannot also be
  // re-read as a bogus criterion named "[Archer] is".
  const clauses=text
    .replace(/\s+when\s+(?=(?:allies|enemies)\b)/gi,', ')
    .split(',')
    .map(clause=>clause.trim().replace(/^when\s+/i,''))
    .filter(Boolean)
  for(const clause of clauses){
    let match
    // "Surviving ally [Zhao]" / "surviving ally [Cavalry]".
    match=clause.match(/\bsurviving\s+(other\s+)?(ally|enemy)\s*(.*?)(?=\s+when\b|$)/i)
    if(match){
      const side=match[2].toLowerCase()
      add(side,match[3],!!match[1]||(side==='ally'&&!match[3].trim()),'surviving')
      continue
    }
    // "Other [Zhao] ally alive" (tag appears before the ally noun).
    match=clause.match(/\bother\s+(.+?)\s+ally\s+(?:is\s+|are(?:\s+both)?\s+)?(alive|present)\b/i)
    if(match){add('ally',match[1],true,match[2].toLowerCase());continue}
    // HP-qualified surviving ally forms put "surviving" at the end.
    match=clause.match(/\bother\s+ally\s+(.+?)(?:'s|')?\s+HP\b.*\band\s+surviving\b/i)
    if(match){add('ally',match[1],true,'surviving');continue}
    // "Other [Mountain Folk] alive" omits the ally noun.
    match=clause.match(/\bother\s+(\[[^\]]+\]|[A-Za-z][A-Za-z ]+?)\s+(alive|present)\b/i)
    if(match){add('ally',match[1],true,match[2].toLowerCase());continue}
    // Generic singular/plural clauses: "ally is alive", "enemies are alive".
    match=clause.match(/\b(ally|enemy)\s+(?:is\s+)?(alive|present)\b/i)
    if(match){add(match[1].toLowerCase(),'',match[1].toLowerCase()==='ally',match[2].toLowerCase());continue}
    match=clause.match(/\b(allies|enemies)\s+(?:are\s+)?(alive|present)\b/i)
    if(match){add(match[1].toLowerCase()==='allies'?'ally':'enemy','',match[1].toLowerCase()==='allies',match[2].toLowerCase());continue}
    // Named/tagged copular and terse forms.
    match=clause.match(/\b(other\s+)?(ally|enemy)\s+(.+?)\s+(?:is|are)(?:\s+both)?\s+(alive|present)\b/i)
    if(match){add(match[2].toLowerCase(),match[3],!!match[1],match[4].toLowerCase());continue}
    match=clause.match(/\b(other\s+)?(ally|enemy)\s+(.+?)\s+(alive|present)\b/i)
    if(match) add(match[2].toLowerCase(),match[3],!!match[1],match[4].toLowerCase())
  }
  return requirements
}
function rosterSatisfiesPresence(roster,requirement,owner){
  const criteria=requirement.criteria?.criteria||[]
  const checks=criteria.map(criterion=>rosterHasCriterion(roster,criterion,owner,requirement.excludeSelf))
  return requirement.criteria?.operator==='all'?checks.every(Boolean):checks.some(Boolean)
}
function raiseApplicability(current,next){
  const rank={
    [BUFF_APPLICABILITY.APPLICABLE]:0,
    [BUFF_APPLICABILITY.CONDITIONAL]:1,
    [BUFF_APPLICABILITY.IMPOSSIBLE]:2,
    [BUFF_APPLICABILITY.UNSUPPORTED]:3,
  }
  return rank[next]>rank[current]?next:current
}
const DYNAMIC_CONDITION_RE=/\b(?:hp|morale|turn|damage|attack\s+count|defeated|alive|surviving|poison(?:ed)?|burn(?:ed)?|fear(?:ed)?|confus(?:ed|ion)|paralys(?:ed|is)|paraly(?:zed|sis)|illusion|betrayal|reckless|while|upon|after|highest|lowest|random|death|dies|remaining|afflicted|status)\b/i
const DYNAMIC_MULTIPLIER_RE=/\b(?:per|for\s+each)\b[^,]*(?:attack|turn|defeat|defeated|damage)|\b(?:attack|skill)\s+count\b/i
const PASSIVE_CONTEXT_RE=/^CW\s+battle\s*\(active\s+even\s+(?:when|if)\s+not\s+deployed\)$/i

// Evaluate formation knowledge before aggregation.  A known mismatch is
// impossible, a battle-state dependency remains potential, and a recognized
// formation grammar we cannot resolve is unsupported (fail closed).
export function evaluateBuffApplicability(effect,modifier,owner,team,enemyTeam,isDefense,showAll=false){
  const cond=String(effect?.condition||'').trim()
  let state=BUFF_APPLICABILITY.APPLICABLE
  let multiplier=1
  let recognized=false
  const reasons=[]
  if(cond&&/garrison|when attacking|when defending/i.test(cond)){
    recognized=true
    if(!isCondActive(cond,isDefense)){
      if(!showAll) return{state:BUFF_APPLICABILITY.IMPOSSIBLE,multiplier:0,reasons:['side']}
    }
  }
  const count=parseAllyCountCondition(cond)
  if(count){
    recognized=true
    if(count.kind==='battleCount'){
      state=raiseApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
      multiplier=null
      reasons.push('battle-count')
    }else if(!count.supported){
      return{state:BUFF_APPLICABILITY.UNSUPPORTED,multiplier:0,reasons:['ally-count-criterion']}
    }else{
      multiplier=getMultiplier(cond,owner,team)
      if(multiplier===0) return{state:BUFF_APPLICABILITY.IMPOSSIBLE,multiplier:0,reasons:['ally-count-zero']}
    }
  }
  if(DYNAMIC_MULTIPLIER_RE.test(cond)&&count?.kind!=='rosterCount'){
    recognized=true
    state=raiseApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
    multiplier=null
    if(!reasons.includes('battle-count')) reasons.push('dynamic-multiplier')
  }
  for(const requirement of parsePresenceRequirements(cond)){
    recognized=true
    if(!requirement.criteria) return{state:BUFF_APPLICABILITY.UNSUPPORTED,multiplier:0,reasons:['presence-criterion']}
    const roster=requirement.side==='enemy'?(enemyTeam||[]):(team||[])
    if(requirement.side==='enemy'&&!roster.length){
      state=raiseApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
      reasons.push('enemy-roster-unknown')
      continue
    }
    if(!rosterSatisfiesPresence(roster,requirement,owner))
      return{state:BUFF_APPLICABILITY.IMPOSSIBLE,multiplier:0,reasons:[`${requirement.side}-presence`]}
    if(requirement.stateWord!=='present'||new RegExp(`(?:${STATUS_EFFECTS.join('|')})\\s+enemy`,'i').test(cond)){
      state=raiseApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
      reasons.push(`${requirement.side}-${requirement.stateWord}`)
    }
  }

  const bareRoster=cond.match(/^(?:(other)\s+)?(ally|enemy)\s+(.+)$/i)
  if(bareRoster&&!/\b(?:alive|present|status|highest|lowest|remaining)\b/i.test(cond)){
    const criteria=parseCriterionExpression(bareRoster[3])
    if(criteria){
      recognized=true
      const roster=bareRoster[2].toLowerCase()==='enemy'?(enemyTeam||[]):(team||[])
      if(bareRoster[2].toLowerCase()==='enemy'&&!roster.length){
        state=raiseApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
        reasons.push('enemy-roster-unknown')
      }else if(!rosterHasCriterion(roster,criteria,owner,!!bareRoster[1])){
        return{state:BUFF_APPLICABILITY.IMPOSSIBLE,multiplier:0,reasons:[`${bareRoster[2].toLowerCase()}-roster`]}
      }
    }
  }

  if(modifier?.recipientRaw){
    recognized=true
    if(!modifier.recipientCriteria) return{state:BUFF_APPLICABILITY.UNSUPPORTED,multiplier:0,reasons:['recipient-criterion']}
  }

  const targetState=parseEnemyTargetState(effect?.target)
  if(targetState){
    recognized=true
    state=raiseApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
    reasons.push(`target-status:${targetState.statusLabel.toLowerCase()}`)
  }
  const targetMechanics=parseTargetMechanics(targetState?.target||effect?.target)
  const enemyTarget=parseEnemyTargetCriteria(effect?.target)
  if(enemyTarget?.restricted){
    recognized=true
    const hasKnownMatch=enemyTarget.criteria&&rosterHasCriterion(enemyTeam||[],enemyTarget.criteria)
    if(hasKnownMatch){
      // A supported alternative is enough for an OR target even if another
      // alternative is a siege weapon the Builder cannot represent.
    }else if(enemyTarget.unsupported.length){
      return{state:BUFF_APPLICABILITY.UNSUPPORTED,multiplier:0,reasons:[`enemy-target:${enemyTarget.unsupported.join(' / ')}`]}
    }else if(!(enemyTeam||[]).length){
      state=raiseApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
      reasons.push('enemy-target-roster-unknown')
    }else{
      return{state:BUFF_APPLICABILITY.IMPOSSIBLE,multiplier:0,reasons:['enemy-target']}
    }
  }
  const conditionMechanics=/\b(?:vs\.?|versus|against)\b/i.test(cond)?parseTargetMechanics(cond):null
  const opponentQualifiers=[
    modifier?.opponentRaw?{raw:modifier.opponentRaw,criteria:modifier.opponentCriteria}:null,
    targetMechanics.opponentRaw?{raw:targetMechanics.opponentRaw,criteria:targetMechanics.opponentCriteria}:null,
    conditionMechanics?.opponentRaw?{raw:conditionMechanics.opponentRaw,criteria:conditionMechanics.opponentCriteria}:null,
  ].filter(Boolean)
  const versusRoster=parseEnemyTargetCriteria(effect?.target)?(team||[]):(enemyTeam||[])
  for(const qualifier of opponentQualifiers){
    recognized=true
    if(!qualifier.criteria) return{state:BUFF_APPLICABILITY.UNSUPPORTED,multiplier:0,reasons:[`opponent:${qualifier.raw}`]}
    if(!versusRoster.length){
      state=raiseApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
      reasons.push('opponent-roster-unknown')
    }else if(!rosterHasCriterion(versusRoster,qualifier.criteria)){
      return{state:BUFF_APPLICABILITY.IMPOSSIBLE,multiplier:0,reasons:[`opponent:${qualifier.raw}`]}
    }
  }
  if(cond&&PASSIVE_CONTEXT_RE.test(cond)) recognized=true
  if(cond&&!recognized&&DYNAMIC_CONDITION_RE.test(cond)){
    recognized=true
    state=raiseApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
    reasons.push('battle-state')
  }else if(cond&&recognized&&DYNAMIC_CONDITION_RE.test(cond)){
    state=raiseApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
    if(!reasons.some(reason=>reason.includes('alive')||reason==='battle-count'||reason==='dynamic-multiplier')) reasons.push('battle-state')
  }
  if(cond&&!recognized)
    return{state:BUFF_APPLICABILITY.UNSUPPORTED,multiplier:0,reasons:['condition-grammar']}
  return{state,multiplier,reasons}
}

const newBuffMeta=()=>({
  conditionalUnquantified:[],
  unsupported:[],
  mechanicResolution:{stable:[],parserFallback:[],failClosed:[]},
})
const attachBuffMeta=(result,meta)=>{
  Object.defineProperty(result,'meta',{value:meta,enumerable:false})
  return result
}
const pushBuffMeta=(meta,key,source)=>{
  const list=meta[key]
  if(!list.some(item=>item.owner===source.owner&&item.skill===source.skill&&item.effect===source.effect&&item.stat===source.stat)) list.push(source)
}
const ensureBuffStat=(stats,stat)=>{
  if(!stats[stat]) stats[stat]={up:0,down:0,potentialUp:0,potentialDown:0,sources:[],potentialSources:[]}
  return stats[stat]
}
const buffSource=(owner,skill,effect,modifier,application,contribution=null,dir=null)=>({
  owner,skill,effect,stat:modifier?.stat||null,contribution,dir,
  mechanicId:effect?.mechanicId||null,
  mechanicResolution:effect?.mechanicId?(BUILDER_MECHANICS[effect.mechanicId]?'stable':'failClosed'):'parserFallback',
  applicability:application.state,reasons:application.reasons,
})
const parseUnsupportedBuffEffect=effect=>{
  const match=String(effect||'').trim().match(/^(.+?)\s+(?:significantly|greatly)\s+(Up|Down)$/i)
  return match?{stat:normalizeBuffStat(match[1].trim()),dir:match[2],val:null}:null
}

const mechanicResolutionKey=(owner,skill,effect)=>[
  owner?.id||owner?.name_en||'unknown-owner',
  skill?.sourceSkillId||skill?.cwId||skill?.name_jp||skill?.name_en||'unknown-skill',
  effect?.mechanicId||effect?.effect||'unknown-effect',
].join('|')
const recordMechanicResolution=(meta,resolution,owner,skill,effect)=>{
  const list=meta.mechanicResolution[resolution]
  const key=mechanicResolutionKey(owner,skill,effect)
  if(!list.some(entry=>entry.key===key)) list.push({key,owner,skill,effect,mechanicId:effect?.mechanicId||null})
}

export function resolveBuilderMechanic(effect){
  if(!effect?.mechanicId) return{
    resolution:'parserFallback',
    mechanic:null,
    modifiers:parseBuffEffect(effect?.effect),
  }
  const mechanic=BUILDER_MECHANICS[effect.mechanicId]
  if(!mechanic) return{resolution:'failClosed',mechanic:null,modifiers:[]}
  return{
    resolution:'stable',
    mechanic,
    modifiers:mechanic.modifiers.map(entry=>({
      stat:entry.stat,
      dir:entry.direction==='down'?'Down':'Up',
      val:entry.value,
      mechanicId:mechanic.id,
    })),
  }
}

export function builderMechanicCoverage(roster=ALL,includeCombat=true){
  const rows=[]
  for(const owner of roster||[]){
    const skills=[...(owner.skills||[]),...(owner.roleSkill?[owner.roleSkill]:[])]
    for(const skill of skills){
      if(!isBuffSummarySkill(skill,includeCombat)) continue
      for(const effect of skill.effects||[]){
        const resolved=resolveBuilderMechanic(effect)
        const qualitative=parseUnsupportedBuffEffect(effect.effect)
        if(resolved.resolution==='stable') rows.push({owner:owner.id,mechanicId:effect.mechanicId,resolution:'stable'})
        else if(resolved.resolution==='failClosed') rows.push({owner:owner.id,mechanicId:effect.mechanicId,resolution:'failClosed'})
        else if(resolved.modifiers.length) rows.push({owner:owner.id,mechanicId:null,resolution:'parserFallback'})
        else if(qualitative) rows.push({owner:owner.id,mechanicId:null,resolution:'unsupported'})
      }
    }
  }
  const counts=rows.reduce((result,row)=>{
    result[row.resolution]+=1
    return result
  },{stable:0,parserFallback:0,unsupported:0,failClosed:0})
  return{total:rows.length,...counts,rows}
}

const raiseStableApplicability=(state,next)=>{
  const rank={
    [BUFF_APPLICABILITY.APPLICABLE]:0,
    [BUFF_APPLICABILITY.CONDITIONAL]:1,
    [BUFF_APPLICABILITY.IMPOSSIBLE]:2,
    [BUFF_APPLICABILITY.UNSUPPORTED]:3,
  }
  return rank[next]>rank[state]?next:state
}

export function evaluateStableMechanicApplicability(mechanic,owner,team,enemyTeam,isDefense,showAll=false){
  if(!mechanic) return{state:BUFF_APPLICABILITY.UNSUPPORTED,multiplier:0,reasons:['stable-identity-unmapped']}
  let state=BUFF_APPLICABILITY.APPLICABLE
  let multiplier=1
  const reasons=[]
  for(const condition of mechanic.conditions||[]){
    if(condition.kind==='side'){
      const active=condition.side==='defense'?isDefense:!isDefense
      if(!active&&!showAll) return{state:BUFF_APPLICABILITY.IMPOSSIBLE,multiplier:0,reasons:['side']}
      continue
    }
    if(condition.kind==='rosterCount'){
      const roster=condition.side==='enemy'?(enemyTeam||[]):(team||[])
      const matched=new Set(roster
        .filter(member=>stableCriterionMatches(member,condition.criteria,owner,condition.excludeSelf))
        .map(member=>member.id))
      multiplier=matched.size
      if(multiplier===0) return{state:BUFF_APPLICABILITY.IMPOSSIBLE,multiplier:0,reasons:['ally-count-zero']}
      continue
    }
    if(condition.kind==='presence'){
      const roster=condition.side==='enemy'?(enemyTeam||[]):(team||[])
      if(condition.side==='enemy'&&!roster.length){
        state=raiseStableApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
        reasons.push('enemy-roster-unknown')
        continue
      }
      if(!stableRosterHas(roster,condition.criteria,owner,condition.excludeSelf))
        return{state:BUFF_APPLICABILITY.IMPOSSIBLE,multiplier:0,reasons:[`${condition.side}-presence`]}
      if(condition.state!=='present'){
        state=raiseStableApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
        reasons.push(`${condition.side}-${condition.state}`)
      }
      continue
    }
    if(condition.kind==='battleState'||condition.kind==='targetState'){
      state=raiseStableApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
      reasons.push(condition.kind==='targetState'?`target-status:${condition.state}`:'battle-state')
      continue
    }
    return{state:BUFF_APPLICABILITY.UNSUPPORTED,multiplier:0,reasons:['stable-condition-kind']}
  }

  const enemyRecipients=(mechanic.recipients||[]).filter(recipient=>recipient.side==='enemy')
  if(enemyRecipients.length&&enemyRecipients.some(recipient=>recipient.criteria?.kind!=='all')){
    if(!(enemyTeam||[]).length){
      state=raiseStableApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
      reasons.push('enemy-target-roster-unknown')
    }else if(!(enemyTeam||[]).some(member=>stableRecipientsMatch(mechanic,'enemy',member,owner))){
      return{state:BUFF_APPLICABILITY.IMPOSSIBLE,multiplier:0,reasons:['enemy-target']}
    }
  }

  if(mechanic.opponent){
    const opponentRoster=enemyRecipients.length?(team||[]):(enemyTeam||[])
    if(!opponentRoster.length){
      state=raiseStableApplicability(state,BUFF_APPLICABILITY.CONDITIONAL)
      reasons.push('opponent-roster-unknown')
    }else if(!stableRosterHas(opponentRoster,mechanic.opponent)){
      return{state:BUFF_APPLICABILITY.IMPOSSIBLE,multiplier:0,reasons:['opponent']}
    }
  }
  return{state,multiplier,reasons}
}

export function calcCharBuffs(G,team,enemyTeam,isDefense,showAll=false,includeCombat=false){
  const stats={}
  const meta=newBuffMeta()
  for(const owner of team){
    for(const skill of(owner.skills||[])){
      if(!isBuffSummarySkill(skill,includeCombat)) continue
      for(const eff of(skill.effects||[])){
        const resolved=resolveBuilderMechanic(eff)
        recordMechanicResolution(meta,resolved.resolution,owner,skill,eff)
        if(resolved.resolution==='failClosed'){
          pushBuffMeta(meta,'unsupported',buffSource(owner,skill,eff,null,{state:BUFF_APPLICABILITY.UNSUPPORTED,reasons:['stable-identity-unmapped']}))
          continue
        }
        const baseTargeted=resolved.mechanic
          ?stableRecipientsMatch(resolved.mechanic,'ally',G,owner)
          :isTargetedBy(eff.target,G,owner,team)
        const modifiers=resolved.modifiers
        const bareNamedTarget=findCharByName(String(eff.target||'').replace(/["“”]/g,'').trim())
        const qualitativeTargeted=bareNamedTarget?.id===G.id
        if(!modifiers.length&&(baseTargeted||qualitativeTargeted)){
          const unsupported=parseUnsupportedBuffEffect(eff.effect)
          if(unsupported) pushBuffMeta(meta,'unsupported',buffSource(owner,skill,eff,unsupported,{state:BUFF_APPLICABILITY.UNSUPPORTED,reasons:['effect-value']}))
        }
        for(const modifier of modifiers){
          const{stat,dir,val}=modifier
          const additionalTargeted=modifier.recipientRaw&&modifier.recipientCriteria&&rosterCriterionMatches(G,modifier.recipientCriteria,owner,false)
          // In the derived corpus an effect-level `Ally [X]` supplements the
          // row target; it does not narrow it.  Examples such as target
          // `Self`, effect `Ally [Cavalry] DEF Up` represent self + cavalry.
          if(!baseTargeted&&!additionalTargeted) continue
          const application=resolved.mechanic
            ?evaluateStableMechanicApplicability(resolved.mechanic,owner,team,enemyTeam,isDefense,showAll)
            :evaluateBuffApplicability(eff,modifier,owner,team,enemyTeam,isDefense,showAll)
          if(application.state===BUFF_APPLICABILITY.IMPOSSIBLE) continue
          const source=buffSource(owner,skill,eff,modifier,application)
          if(application.state===BUFF_APPLICABILITY.UNSUPPORTED){
            pushBuffMeta(meta,'unsupported',source)
            continue
          }
          if(application.multiplier===null){
            pushBuffMeta(meta,'conditionalUnquantified',source)
            continue
          }
          const mult=application.multiplier
          const bucket=ensureBuffStat(stats,stat)
          const potential=application.state===BUFF_APPLICABILITY.CONDITIONAL
          const sourceList=potential?bucket.potentialSources:bucket.sources
          if(SPECIAL_STATS.has(stat)){
            const times=(resolved.mechanic?val:(parseInt(eff.duration)||1))*mult
            if(potential) bucket.potentialUp+=times
            else bucket.up+=times
            sourceList.push({...source,contribution:times,dir:'up'})
          } else if(stat==='Guard'&&dir==='Up'){
            // Guard doesn't stack — only the highest is active. Track instances separately.
            const instanceKey=potential?'potentialInstances':'instances'
            if(!bucket[instanceKey]) bucket[instanceKey]=[]
            bucket[instanceKey].push({val:val*mult,duration:eff.duration||null,owner,skill,effect:eff,applicability:application.state,reasons:application.reasons})
            if(potential) bucket.potentialUp=Math.max(bucket.potentialUp,val*mult)
            else bucket.up=Math.max(bucket.up,val*mult)
            sourceList.push({...source,contribution:val*mult,dir:'up',duration:eff.duration||null})
          } else if(dir==='Up'){
            if(potential) bucket.potentialUp+=val*mult
            else bucket.up+=val*mult
            sourceList.push({...source,contribution:val*mult,dir:'up'})
          } else {
            if(potential) bucket.potentialDown+=val*mult
            else bucket.down+=val*mult
            sourceList.push({...source,contribution:val*mult,dir:'down'})
          }
        }
      }
    }
  }
  return attachBuffMeta(stats,meta)
}

export function normalizeEnemyTarget(t){
  const stateTarget=parseEnemyTargetState(t)
  if(stateTarget) return stateTarget.raw
  const mechanics=parseTargetMechanics(stateTarget?.target||t)
  const tl=mechanics.target.toLowerCase().replace(/[[\]]/g,'')
  if(/all\s+enemy|all\s+generals/i.test(tl)) return 'All enemies'
  if(/^enemy\s+generals\b/.test(tl)||/^enemy\s+\[general\](?:\s|$)/i.test(mechanics.target)) return 'Enemy generals'
  const parsed=parseEnemyTargetCriteria(t)
  if(parsed&&(parsed.restricted||parsed.unsupported.length)){
    const criteria=parsed.criteria?.criteria||[]
    const tokens=[
      ...criteria.map(criterion=>{
        if(criterion.kind==='unitType') return `[${criterion.id}]`
        if(criterion.kind==='faction') return `[${cleanRosterCriterion(criterion.raw)}]`
        if(criterion.kind==='group') return `${criterion.id} [General]`
        if(criterion.kind==='character') return findCharById(criterion.id)?.name_en||cleanRosterCriterion(criterion.raw)
        if(criterion.kind==='allOf') return criterion.criteria.map(part=>`[${cleanRosterCriterion(part.raw)}]`).join(' ')
        return cleanRosterCriterion(criterion.raw)
      }),
      ...parsed.unsupported.map(value=>`[${cleanRosterCriterion(value)}]`),
    ].filter(Boolean)
    if(tokens.length>1) return `Enemy ${tokens.join(' / ')}`
    if(criteria[0]?.kind==='group') return `Enemy ${tokens[0]}`
    if(criteria[0]?.kind==='allOf') return `Enemy ${tokens[0]}`
    if(tokens.length) return `Enemy ${cleanRosterCriterion(tokens[0])}`
  }
  if(/^enemy\s+general\b/i.test(tl)||/^\d+\s+enemy\s+generals?\b/i.test(tl)) return 'Enemy General'
  return 'Enemies'
}
// Is `crit` a real roster criterion (unit type, faction, group, or named general)?
// Distinguishes composition gates ("ally Makou", "[Chu]") from dynamic battle
// states ("burned", "feared", "surviving") that should always show as potential.
export function isRosterCriterion(crit){
  return !!crit&&ALL.some(c=>rosterCriterionMatches(c,crit,null,false))
}
// How strongly an enemy-targeting effect's condition is met for this side:
// 0 = inactive (skip), ≥1 = active (per-ally conditions scale by the ally count).
// Mirrors the timing/per-ally gating calcCharBuffs applies to ally buffs, and
// additionally respects ally/enemy *presence* conditions.
export function enemyDebuffFactor(cond,isDefense,owner,team,enemyTeam=[]){
  const application=evaluateBuffApplicability(
    {condition:cond,target:'All enemy [General]'},
    null,owner,team,enemyTeam,isDefense,false,
  )
  if(application.state===BUFF_APPLICABILITY.IMPOSSIBLE||application.state===BUFF_APPLICABILITY.UNSUPPORTED||application.multiplier===null) return 0
  return application.multiplier
}
export function calcTeamEnemyDebuffs(team,enemyTeam=[],includeCombat=false,isDefense=false){
  const byTarget={}
  const meta=newBuffMeta()
  function addToTarget(key,parsed,owner,skill,effect,evaluationEffect=effect,stableMechanic=null){
    if(!parsed.length) return
    for(const modifier of parsed){
      const{stat,dir,val}=modifier
      let application=stableMechanic
        ?evaluateStableMechanicApplicability(stableMechanic,owner,team,enemyTeam,isDefense,false)
        :evaluateBuffApplicability(evaluationEffect,modifier,owner,team,enemyTeam,isDefense,false)
      if(application.state===BUFF_APPLICABILITY.IMPOSSIBLE) continue
      if(!stableMechanic&&!enemyTeam.length&&parseEnemyTargetCriteria(evaluationEffect.target)?.restricted){
        application={...application,state:raiseApplicability(application.state,BUFF_APPLICABILITY.CONDITIONAL),reasons:[...application.reasons,'enemy-target-roster-unknown']}
      }
      const source=buffSource(owner,skill,effect,modifier,application)
      if(application.state===BUFF_APPLICABILITY.UNSUPPORTED){
        pushBuffMeta(meta,'unsupported',source)
        continue
      }
      if(application.multiplier===null){
        pushBuffMeta(meta,'conditionalUnquantified',source)
        continue
      }
      if(!byTarget[key]) byTarget[key]={up:{},down:{},potentialUp:{},potentialDown:{},sources:{},potentialSources:{}}
      const d=dir==='Up'?'up':'down'
      const potential=application.state===BUFF_APPLICABILITY.CONDITIONAL
      const values=potential?(d==='up'?byTarget[key].potentialUp:byTarget[key].potentialDown):byTarget[key][d]
      const v=val*application.multiplier
      values[stat]=(values[stat]||0)+v
      const skey=`${d}|${stat}`
      const sourceMap=potential?byTarget[key].potentialSources:byTarget[key].sources
      if(!sourceMap[skey]) sourceMap[skey]=[]
      sourceMap[skey].push({...source,contribution:v,dir:d})
    }
  }
  for(const owner of team){
    for(const sk of(owner.skills||[])){
      if(!isBuffSummarySkill(sk,includeCombat)) continue
      for(const eff of(sk.effects||[])){
        const resolved=resolveBuilderMechanic(eff)
        recordMechanicResolution(meta,resolved.resolution,owner,sk,eff)
        if(resolved.resolution==='failClosed'){
          pushBuffMeta(meta,'unsupported',buffSource(owner,sk,eff,null,{state:BUFF_APPLICABILITY.UNSUPPORTED,reasons:['stable-identity-unmapped']}))
          continue
        }
        if(resolved.mechanic){
          if(resolved.mechanic.recipients.some(recipient=>recipient.side==='enemy')){
            addToTarget(
              resolved.mechanic.targetLabel||normalizeEnemyTarget(eff.target),
              resolved.modifiers,owner,sk,eff,eff,resolved.mechanic,
            )
          }
          continue
        }
        const t=(eff.target||'').trim()
        if(parseEnemyTargetCriteria(t)){
          addToTarget(normalizeEnemyTarget(t),parseBuffEffect(eff.effect),owner,sk,eff)
        } else {
          const bareNamedTarget=findCharByName(t.replace(/["“”]/g,'').trim())
          if(bareNamedTarget&&/\b(?:Infliction|Seal)\b/i.test(String(eff.effect||''))){
            const namedTarget=`Enemy ${bareNamedTarget.name_en}`
            addToTarget(normalizeEnemyTarget(namedTarget),parseBuffEffect(eff.effect),owner,sk,eff,{...eff,target:namedTarget})
            continue
          }
          // One exact source row carries a named enemy list inside a Self-target
          // effect. Preserve those stable names as an OR target.
          const namedAttackSeal=[...String(eff.effect||'').matchAll(/["“”]([^"“”]+)["“”]/g)]
            .map(match=>match[1].trim())
            .filter(name=>!/^Attack Seal$/i.test(name))
          const attackSealValue=String(eff.effect||'').match(/["“”]Attack Seal["“”]\s*(\d+(?:\.\d+)?)[%％]/i)
          if(/^Enemy\b/i.test(String(eff.effect||''))&&namedAttackSeal.length&&attackSealValue){
            const namedTarget=`Enemy ${namedAttackSeal.join(' / ')}`
            addToTarget(
              normalizeEnemyTarget(namedTarget),
              [decorateBuffQualifier({stat:'Attack Seal',dir:'Up',val:parseFloat(attackSealValue[1])})],
              owner,sk,eff,{...eff,target:namedTarget},
            )
            continue
          }
          // collect embedded "Enemy [X] Stat Dir Val" parts from ally-target effects
          for(const part of (eff.effect||'').split(/[,、]/)){
            const p=part.trim()
            if(!/^enemy\s*\[/i.test(p)) continue
            const m=p.match(/^Enemy\s+\[([^\]]+)\]\s+(.+?)\s+(Up|Down)\s+(\d+(?:\.\d+)?)[%％]/i)
            if(!m) continue
            const targetType=m[1].trim()
            const key=UNIT_TYPE_LIST.includes(targetType)?`Enemy ${targetType}`:`Enemy ${targetType[0].toUpperCase()+targetType.slice(1)}`
            addToTarget(key,[decorateBuffQualifier({stat:m[2].trim(),dir:m[3],val:parseFloat(m[4])})],owner,sk,eff,{...eff,target:`Enemy [${targetType}]`})
          }
        }
      }
    }
  }
  return attachBuffMeta(byTarget,meta)
}

// Picker
const searchTerms = new WeakMap()
export function matchCharacterSearch(character, query, locale) {
  if (!String(query ?? '').trim()) return { hint: null }
  if (!searchTerms.has(character)) {
    const faction = FACTIONS.find(f => f.id === character.country)
    const groups = [...(character.groups||[])]
    if(groups.includes('Hi Shin Unit')) groups.push('HiShin')
    if(groups.includes('Gakuka Unit')) groups.push('Gakuka')
    searchTerms.set(character, { groups, terms: [faction?.label, faction?.jp, ...groups].filter(Boolean) })
  }
  const { groups, terms } = searchTerms.get(character)
  const match = characterContentMatch(character, query, locale, terms)
  if (match) return match
  // Keep the existing hidden-tag phrase search, e.g. "HiShin team".
  return groups.some(tag => String(query).toLowerCase().includes(tag.toLowerCase())) ? { hint: null } : null
}

export function searchCharacters(characters, query, locale) {
  const exactNames = [], partialNames = [], content = []
  for (const character of characters) {
    const match = matchCharacterSearch(character, query, locale)
    if (match) (match.nameMatch === 'exact' ? exactNames : match.nameMatch ? partialNames : content).push(character)
  }
  // A general's name comes before skills that mention that general. This also
  // keeps name matches reachable in the Stats picker's bounded result list.
  return [...exactNames, ...partialNames, ...content]
}

export function Picker({onSelect,onClose,excl=[],returnFocus}){
  const {ALL}=useReleaseData()
  const locale=useLocale()
  const{t}=useTranslation('common')
  const[q,setQ]=useState(''),ref=useRef(null)
  const exclKey=excl.join('|')
  const chars=useMemo(()=>{
    return searchCharacters(ALL.filter(c=>!excl.includes(c.id)),q,locale)
  // exclKey is the stable representation of `excl`; ESLint can't see that.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[q,exclKey,locale,ALL])
  return(
    <Dialog className="overlay" onClose={onClose} aria-label={t('archive.searchGenerals')} initialFocus={()=>ref.current} returnFocus={returnFocus}>
      <div className="picker" onClick={e=>e.stopPropagation()}>
        <div className="picker-head"><span>{t('archive.searchGenerals')}</span><button className="x-btn" aria-label={t('close')} onClick={onClose}>✕</button></div>
        <div className="picker-filters"><input ref={ref} type="search" className="picker-search" aria-label={t('archive.searchGenerals')} placeholder={`${t('search')}…`} value={q} onChange={e=>setQ(e.target.value)}/>{q&&<button type="button" onClick={()=>{setQ('');ref.current?.focus()}}>{t('clear')}</button>}</div>
        {!chars.length&&<p className="search-empty" role="status">{t('stats.noCharacterMatches',{query:q})}</p>}
        <div className="picker-grid">
          {chars.map(c=>(
            <button key={c.id} className="p-card" style={{borderTopColor:CC[c.country]||'#999'}} onClick={()=>{onSelect(c);onClose()}}>
              <div className="p-ico-wrap">
                <CharIcon c={c} size={52} round={true} className="p-ico"/>
              </div>
              <span className="p-name">{localizedCharacter(c,locale).displayName}</span>
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  )
}

// ── TEAM COST ─────────────────────────────────────────────────────────────────
export const RARITY_COST=RED_CRYSTAL_TOTAL_COST
export const RARITY_COLOR={N:'#68704a',R:'#3d9970',SR:'#3d6eb5',UR:'#c0392b',LG:'#d4af37'}

export const RARITY_DATA=rarityData
// Never join cost categories by display name: 向 and 昂 both display as Kou.
export const characterInitialRarity=c=>classification[c?.id]?.initial_rarity||c?.rarity||'SR'

// Authoritative rarity lookup for buff entries. character_rarity.json is the
// single source of truth; the `type` field hand-coded on buff entries had
// drifted (and even held an invalid "SSR"). Match ONLY by Japanese name — it is
// unique, whereas a few romanizations collide (e.g. 昂 and 向 both romanize to
// "Kou", so matching by English name would mix them up). Preserve the entry's
// own `type` as a defensive fallback for records outside the mapped roster.
const RARITY_BY_JP=Object.fromEntries(
  Object.values(RARITY_DATA).filter(v=>v&&v.name_jp).map(v=>[v.name_jp,v.rarity])
)
export function buffEntryRarity(entry){
  if(!entry) return null
  return RARITY_BY_JP[entry.name_jp]||entry.type||null
}

// ----- shared stat ordering (used by buff engine + buff tables) -----
// Stats where "Down" is beneficial for the buff receiver (e.g. less morale cost = good)
export const INVERSE_STATS=new Set(['Morale Consumption','Skill Cooldown','Damage Received'])
export const SPECIAL_STATS=new Set(['Attack Nullification','Sure Hit','Status Effect Immunity','Rampage','Less Likely to be Targeted'])
// Canonical display order for buff stats
export const STAT_ORDER=['Max HP','ATK','DEF','DEF Penetration','DEF Penetration Resistance','Guard','Attack Nullification','Sure Hit','Status Effect Immunity','Less Likely to be Targeted','Rampage','Max Morale','Morale Consumption','Morale Recovery','Critical Rate','Critical Damage','Hit Rate','HP Recovery','HP Recovery Nullification','Evasion','Squad Damage Reduction']
export function statSortKey(s){const i=STAT_ORDER.indexOf(s);return i===-1?STAT_ORDER.length:i}

// ----- party-builder skill masks + hidden search tags (shared) -----
// Hidden search tags — searching these strings finds the listed characters
export const CHAR_GROUPS=Object.fromEntries(Object.entries(GROUPS).map(([group,ids])=>[
  group,[...ids],
]))
CHAR_GROUPS.HiShin=CHAR_GROUPS['Hi Shin Unit']
CHAR_GROUPS.Gakuka=CHAR_GROUPS['Gakuka Unit']


// Per-slot skill mask for the Party Builder.
// n: 0-3 skill-unlock level (cascading — n=2 means S1+S2 enabled, S3 off).
// s6: independent boolean for the 6★ skill (only matters if character has one).
// role: optional Leader/Strategist assignment; only one of each role may be on
// a formation, enforced by updateSkillMasks().
export const DEFAULT_SK = {n:3, s6:true, role:false}
export const defaultSks = () => Array.from({length:4}, () => ({...DEFAULT_SK}))
export function hasStar6(char){ return !!(char?.skills||[]).some(s=>s.star6) }
export function hasRoleSkill(char){ return !!char?.roleSkill }
export function updateSkillMasks(masks,party,idx,nextMask){
  const next=Array.from({length:4},(_,i)=>i===idx
    ?{...DEFAULT_SK,...nextMask}
    :{...DEFAULT_SK,...masks?.[i]}
  )
  const selectedRole=next[idx]?.role&&party?.[idx]?.roleSkill?.type
  if(selectedRole){
    for(let i=0;i<next.length;i++){
      if(i!==idx&&party?.[i]?.roleSkill?.type===selectedRole) next[i].role=false
    }
  }
  return next
}
export function applyMask(char, mask){
  if(!char) return null
  const m = mask || DEFAULT_SK
  const base = (char.skills||[]).filter(s=>!s.star6).slice(0, m.n|0)
  const s6 = (char.skills||[]).find(s=>s.star6)
  const skills=(m.s6&&s6)?[...base,s6]:base
  if(m.role&&char.roleSkill) skills.push(char.roleSkill)
  return {...char, skills}
}
