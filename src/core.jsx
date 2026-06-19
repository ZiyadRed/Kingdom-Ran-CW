import { useState, useRef, useEffect, useMemo } from 'react'
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

// Shared modal behavior: close on Escape and lock background scroll while a
// modal/overlay is open. `active` gates it so the hook is safe to call
// unconditionally (rules-of-hooks) even when the modal is closed.
export function useModalDismiss(active,onClose){
  useEffect(()=>{
    if(!active) return
    const onKey=e=>{if(e.key==='Escape')onClose()}
    document.addEventListener('keydown',onKey)
    const prev=document.body.style.overflow
    document.body.style.overflow='hidden'
    return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow=prev}
  },[active,onClose])
}

export const PROGRESS_STORAGE_KEY='ranhq-progress-v3'
export const emptyProgress=()=>({cw6Cards:{},sceneBuffCards:{},sceneBuffStars:{},buffSources:{}})
export const normalizeProgress=(raw={})=>{
  const base=emptyProgress()
  return Object.fromEntries(Object.keys(base).map(k=>[k,{...(raw[k]||{})}]))
}
export const readProgress=()=>{
  if(typeof window==='undefined') return emptyProgress()
  try{return normalizeProgress(JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)||'{}'))}
  catch{return emptyProgress()}
}
export function useProgressTracker(){
  const[progress,setProgress]=useState(readProgress)
  useEffect(()=>{
    try{window.localStorage.setItem(PROGRESS_STORAGE_KEY,JSON.stringify(progress))}
    catch{ /* localStorage unavailable (private mode / quota) — ignore */ }
  },[progress])
  const isOwned=(bucket,id)=>!!progress[bucket]?.[id]
  const toggleOwned=(bucket,id)=>{
    setProgress(prev=>{
      const next=normalizeProgress(prev)
      const group={...next[bucket]}
      if(group[id]) delete group[id]
      else group[id]=true
      next[bucket]=group
      return next
    })
  }
  const setProgressValue=(bucket,id,value)=>{
    setProgress(prev=>{
      const next=normalizeProgress(prev)
      const group={...next[bucket]}
      if(value===undefined||value===null||value===false||value===0||value==='') delete group[id]
      else group[id]=value
      next[bucket]=group
      return next
    })
  }
  const countOwned=(bucket,ids)=>ids.reduce((n,id)=>n+(isOwned(bucket,id)?1:0),0)
  const exportProgress=async()=>{
    const text=JSON.stringify({version:1,exportedAt:new Date().toISOString(),progress},null,2)
    try{
      await navigator.clipboard.writeText(text)
      window.alert('Progress backup copied.')
    }catch{
      window.prompt('Copy your RanHQ progress backup:',text)
    }
  }
  const importProgress=()=>{
    const text=window.prompt('Paste your RanHQ progress backup:')
    if(!text) return
    try{
      const parsed=JSON.parse(text)
      setProgress(normalizeProgress(parsed.progress||parsed))
      window.alert('Progress imported.')
    }catch{
      window.alert('That progress backup could not be read.')
    }
  }
  const clearProgress=()=>{
    if(window.confirm('Clear all saved RanHQ progress on this browser?')) setProgress(emptyProgress())
  }
  return{progress,isOwned,toggleOwned,setProgressValue,countOwned,exportProgress,importProgress,clearProgress}
}
export const progressFilterItems=[
  {id:'all',label:'All'},
  {id:'owned',label:'Owned'},
  {id:'missing',label:'Missing'},
]
export const ProgressTools=({tracker})=>(
  <div className="progress-tools" aria-label="Progress tools">
    <span className="progress-tools-note">Saved on this browser</span>
    <button type="button" onClick={tracker.exportProgress}>Export</button>
    <button type="button" onClick={tracker.importProgress}>Import</button>
    <button type="button" onClick={tracker.clearProgress}>Clear</button>
  </div>
)
export const OwnedToggle=({owned,onToggle,label='Owned',className=''})=>(
  <button
    type="button"
    className={`owned-toggle${owned?' owned-toggle-on':''}${className?' '+className:''}`}
    onClick={onToggle}
    aria-pressed={owned}
    title={owned?'Marked owned':'Mark as owned'}
  >
    {owned?label:'Own'}
  </button>
)
export const SceneStarControl=({star,onChange})=>(
  <div className="scene-star-control" aria-label="Scene card buff star level">
    {[1,2,3,4,5,6].map(level=>(
      <button
        key={level}
        type="button"
        className={level<=star?'active':''}
        aria-pressed={level<=star}
        title={star===level?'Clear scene card stars':`Set to ${level}/6 stars`}
        onClick={()=>onChange(star===level?0:level)}
      >
        {level<=star?'★':'☆'}
      </button>
    ))}
  </div>
)
export const buffSourceId=(kind,key,stat,e,i)=>`${kind}:${key}:${stat}:${e.name||''}:${e.name_jp||''}:${e.value||0}:${e.special_label||''}:${i}`

export const ALL = [
  ...mountainFolk,...qin,...qinBatch2,...qinMajor,
  ...zhao,...zhaoBatch2,...zhaoMajor,...otherStates,
  ...chu,...chuMajor,...wei,...yan,...qi,
  ...aiYanMajor,...misc,...misc2,
].filter(c=>c.country!=='unknown')

export const GROUPS={
  'Gyokuhou':           ['ouhon','kanjou','shoutaku','kyuukou'],
  'Six Great Generals': ['hakuki','ouki','kyou','shibasaku','koshou','oukotsu'],
  'Wei Fire Dragon':    ['ranbihaku','tairoji','reiou','gokei','gaimou','gohoumei','shihaku'],
  'Renpa Army':       ['renpa','rinko','genpo','kyouen','kaishibou'],
  "Renpa's Four Heavenly Kings": ['rinko','genpo','kyouen','kaishibou'],
  'Kanmei Army':      ['kanmei','beiman','goumasho','jinou','kyoubou'],
  'Karin Army':       ['karin','kaen','goutoku','bamyu','kouyoku','hakurei'],
  'Ouki Army':        ['ouki','tou'],
  'Hi Shin Unit':       ['shin','naki','robin','garo','gakurai'],
  'Kanki Army':       ['kanki','naki','robin','zenou','raido','ogiko','maron','kokuou','bain','kakuun'],
  'Kisui Army':       ['kisui','batei','ryuuto','duke_sei','kishou'],
  'Ousen Army':       ['akou','denrimi','kanjou','shoutaku','kyuukou','makou'],
  'Moubo Army':       ['moubu','choushi','raiki'],
  'Coalition Army':   ['karin','kanmei','riboku','houken','seikai','rinbukun','gohoumei','mangoku'],
  'Ryofui Four Pillars': ['ryofui','mougou'],
}
export const UNIT_TYPES={
  // Cavalry
  akou:'Cavalry',bajio:'Cavalry',bakan:'Cavalry',bakukoshin:'Cavalry',bananji:'Cavalry',
  batei:'Cavalry',beiman:'Cavalry',chouko:'Cavalry',chousou:'Cavalry',danto:'Cavalry',
  denyuu:'Cavalry',doukin:'Cavalry',douken:'Cavalry',futei:'Cavalry',gaimou:'Cavalry',
  gakuei:'Cavalry',gakuki:'Cavalry',gakurai:'Cavalry',garo:'Cavalry',gekishin:'Cavalry',
  hamui:'Cavalry',hanoki:'Cavalry',hyou:'Cavalry',hyoushiga:'Cavalry',duke_hyou:'Cavalry',
  kaen:'Cavalry',kaine:'Cavalry',kaishibou:'Cavalry',kanjou:'Cavalry',kanki:'Cavalry',
  kanmei:'Cavalry',kanou:'Cavalry',katari:'Cavalry',kisui:'Cavalry',kitari:'Cavalry',
  kouyoku:'Cavalry',kyou:'Cavalry',kyoubou:'Cavalry',kyoukai:'Cavalry',mangoku:'Cavalry',
  moubu:'Cavalry',mouten:'Cavalry',naki:'Cavalry',nakon:'Cavalry',ordo:'Cavalry',
  ouhon:'Cavalry',ouki:'Cavalry',renpa:'Cavalry',rikusen:'Cavalry',
  rinbou:'Cavalry',rinbukun:'Cavalry',ringyoku:'Cavalry',rinko:'Cavalry',shin:'Cavalry',
  shinseijou:'Cavalry',shihaku:'Cavalry',sho:'Cavalry',shouheikun:'Cavalry',shoumou:'Cavalry',
  shunsuiju:'Cavalry',sosui:'Cavalry',tou:'Cavalry',wategi:'Cavalry',yotanwa:'Cavalry',
  rokuomi:'Cavalry',makou:'Cavalry',
  // Archer
  amon:'Archer',budai:'Archer',denrimi:'Archer',domon:'Archer',duke_sei:'Archer',
  fuji:'Archer',gakujou:'Archer',genpo:'Archer',gii:'Archer',gika:'Archer',
  gohoumei:'Archer',goutoku:'Archer',hakukisei:'Archer',hakurei:'Archer',hakusui:'Archer',
  hanroki:'Archer',hoki:'Archer',hyouki:'Archer',jinou:'Archer',jiou:'Archer',
  kaioku:'Archer',karyoten:'Archer',keisha:'Archer',kesshi:'Archer',kou:'Archer',
  kourigen:'Archer',koshou:'Archer',kyouen:'Archer',kyougai:'Archer',maki:'Archer',
  ogiko:'Archer',otaji:'Archer',queen_biki:'Archer',ramauji:'Archer',reiou:'Archer',
  rishi:'Archer',robin:'Archer',roen:'Archer',rokin:'Archer',ryofui:'Archer',
  saizatsu:'Archer',seikai:'Archer',seikyou:'Archer',seki:'Archer',shibasaku:'Archer',
  shika:'Archer',shishi:'Archer',shoubunkun:'Archer',sougen:'Archer',takukei:'Archer',
  toji:'Archer',you:'Archer',yukii:'Archer',kokuou:'Archer',
  // Infantry
  bain:'Infantry',bamyu:'Infantry',bihei:'Infantry',chutetsu:'Infantry',entei:'Infantry',
  choushi:'Infantry',
  en:'Infantry',gotan:'Infantry',hairou:'Infantry',hokaku:'Infantry',houken:'Infantry',
  jokan:'Infantry',ka:'Infantry',kakukai:'Infantry',kei:'Infantry',kyomei:'Infantry',
  kyourei:'Infantry',kyoushou:'Infantry',kyuukou:'Infantry',maron:'Infantry',
  muta:'Infantry',oukotsu:'Infantry',pam:'Infantry',raiki:'Infantry',rankai:'Infantry',rui:'Infantry',
  ryuusen:'Infantry',ryuuto:'Infantry',ryuyu:'Infantry',saji:'Infantry',shikika:'Infantry',
  shousa:'Infantry',shoutaku:'Infantry',shuki:'Infantry',shunmen:'Infantry',shunpeikun:'Infantry',
  suugen:'Infantry',toumi:'Infantry',youka:'Infantry',yuri:'Infantry',yuuren:'Infantry',
  zenou:'Infantry',
  // Shield
  banyou:'Shield',bikou:'Shield',chouin:'Shield',choutou:'Shield',denei:'Shield',
  ei_sei:'Shield',gokei:'Shield',goumasho:'Shield',hakuki:'Shield',heki:'Shield',
  junso:'Shield',kakubi:'Shield',kakuun:'Shield',karin:'Shield',keibin:'Shield',
  kinmou:'Shield',kishou:'Shield',kousonryu:'Shield',kouretsu:'Shield',kuzen:'Shield',
  miyamoto:'Shield',mougou:'Shield',mouki:'Shield',ouken:'Shield',ousen:'Shield',
  raido:'Shield',ranbihaku:'Shield',riboku:'Shield',rien:'Shield',rihaku:'Shield',
  rouai:'Shield',ryuukoku:'Shield',shoukaku:'Shield',shunshinkun:'Shield',taijifu:'Shield',
  tairoji:'Shield',yugi:'Shield',
}
// Extend GROUPS from each character's `unit` field so JSON data is the source of truth.
// Any char with `"unit": "X Army"` is auto-added to GROUPS['X Army'] (creating it if absent).
ALL.forEach(c=>{
  if(!c.unit) return
  const u=c.unit.trim()
  if(!u) return
  if(['Infantry','Cavalry','Archer','Shield'].includes(u)) return
  if(!GROUPS[u]) GROUPS[u]=[]
  if(!GROUPS[u].includes(c.id)) GROUPS[u].push(c.id)
})

ALL.forEach(c=>{
  c.unit_type=UNIT_TYPES[c.id]||null
  c.groups=Object.entries(GROUPS).filter(([,ids])=>ids.includes(c.id)).map(([gn])=>gn)
})

// Fast lookup by name_en (case-insensitive) — replaces repeated ALL.find() scans
export const CHAR_BY_NAME = (()=>{const m={};for(const c of ALL){if(!c.name_en) continue;m[c.name_en]=c;m[c.name_en.toLowerCase()]=c}return m})()
export const findCharByName = n => n && (CHAR_BY_NAME[n] || CHAR_BY_NAME[n.toLowerCase()]) || null
// Number of browsable characters (those with art) — matches the per-faction
// sidebar counts. Derived so the Archive tab badge can't drift from the data.
export const ARCHIVE_CHAR_COUNT = ALL.filter(c=>c.image).length

export const RED_CRYSTAL_TOTAL_COST={R:595,SR:800,UR:1750,LG:1750}
export const RED_CRYSTAL_SKILL_COSTS={R:[70,175,350],SR:[80,240,480],UR:[100,550,1100],LG:[100,550,1100]}
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
  const char=findCharByName(entry.name)||ALL.find(c=>c.name_jp===entry.name_jp)
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
  if(!cost) return null
  const efficiency=value?cost/value:null
  const tooltip=efficiency
    ?`Efficiency: ${Math.round(efficiency).toLocaleString()} red crystals per 1% buff. Lower is better. (${cost.toLocaleString()} cost / ${value.toFixed(1)}% buff)`
    :`Red Crystal unlock cost: ${cost.toLocaleString()}`
  return(
    <span className="cost-chip" data-tooltip={tooltip} tabIndex={0} aria-label={tooltip} style={{
      display:'inline-flex',alignItems:'center',gap:'3px',
      padding:'3px 8px',borderRadius:'999px',
      background:'#6a30c814',border:'1px solid #6a30c844',
      color:'#6a30c8',fontSize:'.67rem',fontWeight:900,
      whiteSpace:'nowrap',
    }}>
      <span>Cost</span>
      <img src="/icons/Red_Crystal.webp" alt="Red Crystal" loading="lazy" decoding="async" style={{width:13,height:13,objectFit:'contain'}}/>
      <span>{cost.toLocaleString()}</span>
    </span>
  )
}
export function BuffValueCluster({value,color,cost,icon,iconLabel,iconTitle,fontSize='1.1rem',minWidth='52px'}){
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
      <div style={{fontWeight:900,fontSize,color,minWidth,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>+{value.toFixed(1)}%</div>
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
export const CC=Object.fromEntries(FACTIONS.map(f=>[f.id,f.color]))

// 320px-wide grid thumbnails generated by scripts/gen_optimized_images.py —
// use for any display ≤ ~200px so phones don't download the full 626×880 art.
export const persosThumb=img=>img&&img.startsWith('/persos/')?img.replace('/persos/','/persos/thumbs/'):img

// Icon: use c.icon if available, else fall back to c.image cropped, else initials
export function CharIcon({c,size=40,round=false,className=''}){
  const r=round?'50%':'8px'
  const s={width:size,height:size,borderRadius:r,objectFit:'cover',objectPosition:'center top',flexShrink:0,display:'block'}
  if(c?.icon) return <img src={c.icon} style={s} className={className} alt={c.name_en} loading="lazy" decoding="async"/>
  if(c?.image) return <img src={persosThumb(c.image)} style={{...s,objectPosition:'top center'}} className={className} alt={c.name_en} loading="lazy" decoding="async"/>
  const col=(CC[c?.country]||'#888')
  return <div style={{...s,background:col+'33',color:col,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:size*.38+'px'}} className={className}>{c?.name_en?.[0]||'?'}</div>
}


export const TYPE_COLOR={Combat:'#c0392b',Strategy:'#3d6eb5','Internal Affairs':'#1a8a72'}

// ── Tier List + Meta team data ────────────────────────────────────────────────
// Single source of truth: META_TEAMS. Teams tagged with a `tier` (SS/S/A/B/C)
// appear on the Metawatch tier list; untagged teams are Party-Builder-only
// extras. TIER_TEAMS is derived from META_TEAMS, so both pages stay in sync.
export const TIER_COLORS={SS:'#d4a32c',S:'#c0392b',A:'#e07f48',B:'#cc972d',C:'#3d6eb5'}
export const META_TEAMS=[
  // ── Metawatch tier list (carry a `tier`; order within a tier = display order) ──
  {tier:'SS',name:'Gyokuhou',       members:['Shoutaku','Ouhon','Kyuukou','Kanjou']},
  {tier:'S',name:'YTW',             members:['Katari','Yotanwa','Kitari','Ramauji']},
  {tier:'S',name:'Archers',         members:['Keisha','Seikai','Hakurei','Queen Biki']},
  {tier:'S',name:'Zhao',            members:['Shunsuiju','Houken','Shinseijou','Riboku']},
  {tier:'S',name:'Wei',             members:['Ranbihaku','Tairoji','Reiou','Gokei']},
  {tier:'A',name:'Karin + Kanmei',  members:['Kyoubou','Karin','Kanmei','Shunshinkun']},
  {tier:'A',name:'Hakuki + Ousen',  members:['Hakuki','Makou','Akou','Ousen']},
  {tier:'A',name:'Hi Shin',         members:['Garo','Gakurai','Naki','Robin']},
  {tier:'A',name:'YTW + Triplets',  members:['Yotanwa','Toji','Fuji','Ramauji']},
  {tier:'B',name:'6GG',             members:['Sho','Ouki','Tou','Kyou']},
  {tier:'B',name:'Renpa v1',        members:['Rinko','Tairoji','Renpa','Kouretsu']},
  {tier:'B',name:'Karin Army',      members:['Karin','Kaen','Goutoku','Shunshinkun']},
  {tier:'B',name:'Han',             members:['Seikai','Chouin','Bakan','Nakon']},
  {tier:'C',name:'Ai',              members:['Rouai','Hanoki','Ryofui','Hanroki']},
  {tier:'C',name:'Archer Garrison', members:['Rouai','Queen Biki','Seikai','Keisha']},
  {tier:'C',name:'Rigan',           members:['Kisui','Kishou','Batei','Duke Sei']},
  {tier:'C',name:'Kanki',           members:['Zenou','Raido','Kanki','Naki']},
  {tier:'C',name:'Ousen Army',      members:['Eiki','Makou','Akou','Ousen']},
  {tier:'C',name:'Yan',             members:['Ordo','Gakuki','Yukii','Otaji']},
  // ── Party-Builder-only extras (no `tier`, not on the tier list) ──
  {name:'Ouhon',          members:['Shoutaku','Ouhon','Kanjou','Gakuki']},
  {name:'Ousen v3',       members:['Ousen','Akou','Makou','Kyuukou']},
  {name:'Karin',          members:['Rien','Karin','Kaen','Goutoku']},
  {name:'Chu',            members:['Kyoubou','Rinbukun','Kanmei','Shunshinkun']},
  {name:'Renpa v2',       members:['Rinko','Kouretsu','Renpa','Kaishibou']},
  {name:'Moubo',          members:['Choushi','Moubu','Raiki','Ouken']},
  {name:'Qin Shields',    members:['Hakuki','Akou','Ousen','Ei Sei']},
]
// Tier list = the META_TEAMS that carry a tier, with their colour resolved.
export const TIER_TEAMS=META_TEAMS.filter(t=>t.tier).map(t=>({...t,color:TIER_COLORS[t.tier]}))

// Simulate
export function simulate(a,d){
  const st={attack:[],defense:[]}
  for(const g of a){const s=(g.skills||[]).filter(s=>s.type==='Strategy');if(s.length)st.attack.push({general:g,skills:s})}
  for(const g of d){const s=(g.skills||[]).filter(s=>s.type==='Strategy');if(s.length)st.defense.push({general:g,skills:s})}
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
  return{st,turns}
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
  const M=CW_MAX[char.id]||CW_DEF_MAX[char.rarity||'SR']||CW_DEF_MAX.SR
  const unitType=M.unitType||'Cavalry'   // unitType set per-char in cw_max_stats.json
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
export function parseBuffEffect(str){
  if(!str) return []
  const results=[];let deferred=[]
  for(let part of str.split(/[,、/]/)){
    part=part.trim().replace(/\\/g,'').replace(/["\u201C\u201D\u300C\u300D]/g,'').trim()
    part=part.replace(/^and\s+/i,'').replace(/\s*\(Dodge Chance\)/gi,'').replace(/\s+additional\b/gi,'').replace(/\s+vs\s+\S+/gi,'').trim()
    if(!part) continue
    if(/^enemy/i.test(part)) continue
    if(/\d+[%％]\s*Damage|^%\s*(?:of\s+|Damage)|HP Drain|Stun Rate/i.test(part)) continue
    if(/^Provoke$/i.test(part)) continue
    if(/^Normal Attack(?!\s+Seal)/i.test(part)) continue
    // strip embedded "Ally [X]" target prefix from effect strings
    part=part.replace(/^Ally\s+\[[^\]]+\]\s*/i,'')
    if(!part) continue
    let ownerType=null,antiEnemy=null,m
    // "Ally [X] Anti-[Y] ..." — owner unit type + anti enemy type
    m=part.match(/^(?:Ally\s+)\[([A-Za-z]+)\]\s+Anti-\[([^\]]+)\]\s+(.+)/i)
    if(m){ownerType=m[1];antiEnemy=m[2].trim();part=m[3]}
    // "[X] Anti-[Y] ..." — owner unit type + anti enemy type
    if(!ownerType){
      m=part.match(/^\[([A-Za-z]+)\]\s+Anti-\[([^\]]+)\]\s+(.+)/i)
      if(m){ownerType=m[1];antiEnemy=m[2].trim();part=m[3]}
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
    const flush=r=>{
      results.push(r)
      for(const d of deferred){
        if(d.statusPrefix!==undefined){
          const suffix=r.stat.replace(/^[A-Za-z]+\s*/,'')
          if(suffix) results.push({stat:d.statusPrefix+' '+suffix,dir:r.dir,val:r.val,ownerType:d.ownerType,antiEnemy:d.antiEnemy})
        } else if(d.dir===r.dir){
          results.push({...d,val:r.val})
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
    if(m){deferred.push({stat:normalizeBuffStat(m[1].trim()),dir:m[2],ownerType,antiEnemy});continue}
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
    if(m){deferred.push({stat:m[1]+' Resistance',dir:'Up',ownerType,antiEnemy});continue}
    // bare status name (e.g. "Confusion" from "Confusion / Poison / Paralysis Infliction Rate Up 40%")
    m=part.match(STATUS_RE)
    if(m&&part.trim()===m[1].trim()){deferred.push({statusPrefix:m[1],ownerType,antiEnemy});continue}
    // "Normal Attack Seal X%" / "Skill Attack Seal X%"
    m=part.match(/^(Normal|Skill)\s+Attack\s+Seal(?:\s+Infliction)?\s+(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:m[1]+' Attack Seal',dir:'Up',val:parseFloat(m[2]),ownerType,antiEnemy});continue}
    // "Attack Seal Infliction X%"
    m=part.match(/^Attack\s+Seal\s+Infliction\s+(\d+(?:\.\d+)?)[%％]$/i)
    if(m){flush({stat:'Attack Seal',dir:'Up',val:parseFloat(m[1]),ownerType,antiEnemy});continue}
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
  return results
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
  return(label||'')
    .replace(/[[\]"“”「」]/g,' ')
    .replace(/\bother\s+than\s+self\b/gi,'')
    .replace(/\bbesides\s+self\b/gi,'')
    .replace(/\bsurviving\b/gi,'')
    .replace(/\bally\b/gi,'')
    .replace(/\btroops?\b|\bsoldiers?\b|\bmembers?\b/gi,'')
    .replace(/\bgenerals?\b$/gi,'')
    .replace(/\bunit\b$/gi,'')
    .replace(/\s+/g,' ')
    .trim()
}
export function rosterCriterionMatches(c,label,owner,forceOther=false){
  if(!c) return false
  const other=forceOther||/\bother(?:\s+ally)?\b|\bother\s+than\s+self\b|\bbesides\s+self\b/i.test(label||'')
  if(other&&owner&&c.id===owner.id) return false
  const raw=cleanRosterCriterion(label)
  if(!raw) return false
  const norm=normalizeRosterLabel(raw)
  if(/^(?:general|generals|generalattackcount|attackcount)$/.test(norm)) return !other||!owner||c.id!==owner.id
  const unit=UNIT_TYPE_LIST.find(u=>{
    const n=normalizeRosterLabel(u)
    return norm===n||norm===`${n}s`||(u==='Archer'&&norm==='archers')
  })
  if(unit) return c.unit_type===unit
  for(const [labelText,code] of Object.entries(FACTION_MAP)){
    if(norm===normalizeRosterLabel(labelText)) return c.country===code
  }
  for(const gn of Object.keys(GROUPS)){
    if(groupMatchesLabel(gn,raw)) return inGroup(c,gn)
  }
  const aliasId=TARGET_NAME_ALIASES[norm]
  if(aliasId) return c.id===aliasId&&(!owner||c.id!==owner.id)
  const named=findCharByName(raw)
  if(named) return c.id===named.id&&(!owner||c.id!==owner.id)
  return false
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
  const t=target.trim()
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
export function getMultiplier(cond,owner,team){
  if(!cond) return 1
  // Count forms like "Per ally cavalry", "Per other ally Qin",
  // "Per other ally Qin / Mountain Folk", and named/group variants.
  const perIdx=cond.search(/\bper\s+(?:other\s+)?ally\b/i)
  if(perIdx>=0){
    const parts=cond.slice(perIdx)
      .replace(/、/g,'/')
      .split('/')
      .map(p=>p.trim())
      .filter(Boolean)
    let inheritedOther=false
    let total=0
    let sawCriterion=false
    for(let part of parts){
      let other=inheritedOther
      const explicit=/\bper\s+(other\s+)?ally\s+(.+)/i.exec(part)
      if(explicit){
        other=!!explicit[1]
        inheritedOther=other
        part=explicit[2]
      }
      part=part
        .replace(/\s+besides\s+self\b/gi,'')
        .replace(/\s+(?:members?|generals?)\b.*$/i,'')
        .trim()
      if(!part) continue
      total+=team.filter(m=>rosterCriterionMatches(m,part,owner,other)).length
      sawCriterion=true
    }
    return sawCriterion?total:0
  }
  const perNameM=/per\s+ally\s+"?([A-Za-z]+)"?/i.exec(cond)
  if(perNameM){const nm=perNameM[1].toLowerCase();return team.some(m=>m.name_en.toLowerCase()===nm)?1:0}
  return 1
}
export function isCondActive(cond,isDefense){
  if(!cond) return true
  const c=cond.toLowerCase()
  if(c.includes('garrison')) return isDefense
  if(c.includes('when attacking')) return !isDefense
  return true
}
export function calcCharBuffs(G,team,enemyTeam,isDefense,showAll=false,includeCombat=false){
  const stats={}
  for(const owner of team){
    for(const skill of(owner.skills||[])){
      if(skill.type!=='Strategy'&&!(includeCombat&&skill.type==='Combat')) continue
      for(const eff of(skill.effects||[])){
        if(!isTargetedBy(eff.target,G,owner,team)) continue
        if(!showAll&&!isCondActive(eff.condition,isDefense)) continue
        const mult=getMultiplier(eff.condition,owner,team)
        if(mult===0) continue
        for(const{stat,dir,val,ownerType,antiEnemy} of parseBuffEffect(eff.effect)){
          // ownerType: G must be that unit type (from effect string like "[Archer] Anti-...")
          if(ownerType&&G.unit_type!==ownerType) continue
          // antiEnemy: if enemy team has chars, check match; if empty show all (max mode)
          if(antiEnemy&&enemyTeam.length>0){
            const ae=antiEnemy.toLowerCase()
            const fcode=FACTION_MAP[ae]
            const inEnemyTeam=enemyTeam.some(e=>{
              if(UNIT_TYPE_LIST.map(x=>x.toLowerCase()).includes(ae))
                return e.unit_type&&e.unit_type.toLowerCase()===ae
              for(const [gn,ids] of Object.entries(GROUPS))
                if(gn.toLowerCase()===ae&&ids.includes(e.id)) return true
              return e.country&&(e.country.toLowerCase()===ae||(fcode&&e.country===fcode))
            })
            if(!inEnemyTeam) continue
          }
          if(!stats[stat]) stats[stat]={up:0,down:0,sources:[]}
          if(SPECIAL_STATS.has(stat)){
            const times=(parseInt(eff.duration)||1)*mult
            stats[stat].up+=times
            stats[stat].sources.push({owner,contribution:times,dir:'up'})
          } else if(stat==='Guard'&&dir==='Up'){
            // Guard doesn't stack — only the highest is active. Track instances separately.
            if(!stats[stat].instances) stats[stat].instances=[]
            stats[stat].instances.push({val:val*mult,duration:eff.duration||null,owner})
            stats[stat].up=Math.max(stats[stat].up,val*mult)
            stats[stat].sources.push({owner,contribution:val*mult,dir:'up',duration:eff.duration||null})
          } else if(dir==='Up'){
            stats[stat].up+=val*mult
            stats[stat].sources.push({owner,contribution:val*mult,dir:'up'})
          } else {
            stats[stat].down+=val*mult
            stats[stat].sources.push({owner,contribution:val*mult,dir:'down'})
          }
        }
      }
    }
  }
  return stats
}

export function normalizeEnemyTarget(t){
  const tl=t.toLowerCase().replace(/[[\]]/g,'')
  if(/^enemy\s+generals?\s+vs\b/.test(tl)) return 'Enemy generals'
  if(/all\s+enemy|all\s+generals/i.test(tl)) return 'All enemies'
  const ut=UNIT_TYPE_LIST.find(u=>tl.includes(u.toLowerCase()))
  if(ut) return `Enemy ${ut}`
  for(const [label] of Object.entries(FACTION_MAP))
    if(tl.includes(label)) return `Enemy ${label[0].toUpperCase()+label.slice(1)}`
  return 'Enemies'
}
export function calcTeamEnemyDebuffs(team,enemyTeam=[],includeCombat=false){
  const byTarget={}
  function addToTarget(key,parsed,owner){
    if(!parsed.length) return
    if(enemyTeam.length>0){
      const ut=UNIT_TYPE_LIST.find(u=>key===`Enemy ${u}`)
      if(ut&&!enemyTeam.some(g=>g.unit_type===ut)) return
      for(const[label] of Object.entries(FACTION_MAP)){
        const cap=label[0].toUpperCase()+label.slice(1)
        if(key===`Enemy ${cap}`&&!enemyTeam.some(g=>g.country===FACTION_MAP[label])) return
      }
    }
    if(!byTarget[key]) byTarget[key]={up:{},down:{},sources:{}}
    for(const{stat,dir,val,antiEnemy} of parsed){
      if(antiEnemy&&enemyTeam.length>0){
        const isUT=UNIT_TYPE_LIST.includes(antiEnemy)
        if(isUT&&!enemyTeam.some(g=>g.unit_type===antiEnemy)) continue
        if(!isUT&&FACTION_MAP[antiEnemy.toLowerCase()]&&!enemyTeam.some(g=>g.country===FACTION_MAP[antiEnemy.toLowerCase()])) continue
      }
      const d=dir==='Up'?'up':'down'
      byTarget[key][d][stat]=(byTarget[key][d][stat]||0)+val
      const skey=`${d}|${stat}`
      if(!byTarget[key].sources[skey]) byTarget[key].sources[skey]=[]
      byTarget[key].sources[skey].push({owner,contribution:val,dir:d})
    }
  }
  for(const owner of team){
    for(const sk of(owner.skills||[])){
      if(sk.type!=='Strategy'&&!(includeCombat&&sk.type==='Combat')) continue
      for(const eff of(sk.effects||[])){
        const t=(eff.target||'').trim()
        // skip effects whose condition requires an enemy unit type not present
        if(enemyTeam.length>0){
          const cm=(eff.condition||'').match(/enemy\s+\[?(infantry|cavalr\w*|archers?|shield)\]?/i)
          if(cm){const raw=cm[1].toLowerCase();const ut=raw.startsWith('arch')?'Archer':raw.startsWith('cav')?'Cavalry':raw.startsWith('inf')?'Infantry':'Shield';if(!enemyTeam.some(g=>g.unit_type===ut)) continue}
        }
        if(/^enemy|^all\s+enemy/i.test(t)){
          addToTarget(normalizeEnemyTarget(t),parseBuffEffect(eff.effect),owner)
        } else {
          // collect embedded "Enemy [X] Stat Dir Val" parts from ally-target effects
          for(const part of (eff.effect||'').split(/[,、]/)){
            const p=part.trim()
            if(!/^enemy\s*\[/i.test(p)) continue
            const m=p.match(/^Enemy\s+\[([^\]]+)\]\s+(.+?)\s+(Up|Down)\s+(\d+(?:\.\d+)?)[%％]/i)
            if(!m) continue
            const targetType=m[1].trim()
            const key=UNIT_TYPE_LIST.includes(targetType)?`Enemy ${targetType}`:`Enemy ${targetType[0].toUpperCase()+targetType.slice(1)}`
            addToTarget(key,[{stat:m[2].trim(),dir:m[3],val:parseFloat(m[4])}],owner)
          }
        }
      }
    }
  }
  return byTarget
}

// Picker
export function Picker({onSelect,onClose,excl=[]}){
  const[q,setQ]=useState(''),ref=useRef(null)
  useModalDismiss(true,onClose)
  useEffect(()=>{ref.current?.focus()},[])
  const exclKey=excl.join('|')
  const chars=useMemo(()=>{
    const ql=q.toLowerCase()
    const factionLabel=c=>FACTIONS.find(f=>f.id===c.country)?.label||''
    return ALL.filter(c=>!excl.includes(c.id)&&(!q||(
      c.name_en.toLowerCase().includes(ql)||
      c.name_jp.includes(q)||
      (c.unit_type&&c.unit_type.toLowerCase().includes(ql))||
      (c.groups&&c.groups.some(g=>g.toLowerCase().includes(ql)))||
      factionLabel(c).toLowerCase().includes(ql)||
      (c.country&&c.country.toLowerCase().includes(ql))
    )))
  // exclKey is the stable representation of `excl`; ESLint can't see that.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[q,exclKey])
  return(
    <div className="overlay" onClick={onClose}>
      <div className="picker" role="dialog" aria-modal="true" aria-label="Select General" onClick={e=>e.stopPropagation()}>
        <div className="picker-head"><span>Select General</span><button className="x-btn" aria-label="Close" onClick={onClose}>✕</button></div>
        <div className="picker-filters"><input ref={ref} className="picker-search" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}/></div>
        <div className="picker-grid">
          {chars.map(c=>(
            <button key={c.id} className="p-card" style={{borderTopColor:CC[c.country]||'#999'}} onClick={()=>{onSelect(c);onClose()}}>
              <div className="p-ico-wrap">
                <CharIcon c={c} size={52} round={true} className="p-ico"/>
              </div>
              <span className="p-name">{c.name_en}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TEAM COST ─────────────────────────────────────────────────────────────────
export const RARITY_COST=RED_CRYSTAL_TOTAL_COST
export const RARITY_COLOR={R:'#3d9970',SR:'#3d6eb5',UR:'#c0392b',LG:'#d4af37'}

export const RARITY_DATA=rarityData

// Authoritative rarity lookup for buff entries. character_rarity.json is the
// single source of truth; the `type` field hand-coded on buff entries had
// drifted (and even held an invalid "SSR"). Match ONLY by Japanese name — it is
// unique, whereas a few romanizations collide (e.g. 昂 and 向 both romanize to
// "Kou", so matching by English name would mix them up). Fall back to the
// entry's own `type` only for the handful of minor generals not yet in the
// rarity file (currently 昂 and 英紀).
const RARITY_BY_JP=Object.fromEntries(
  Object.values(rarityData).filter(v=>v&&v.name_jp).map(v=>[v.name_jp,v.rarity])
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
export const CHAR_GROUPS={
  'Hi Shin Unit':['Shin','Garo','Gakurai','Kyoukai'],
  'HiShin':['Shin','Garo','Gakurai','Kyoukai'],
  'Gakuka':['Mouten','Rikusen'],
  'Moubo Army':['Moubu','Choushi','Raiki'],
}

// Per-slot skill mask for the Party Builder.
// n: 0-3 skill-unlock level (cascading — n=2 means S1+S2 enabled, S3 off).
// s6: independent boolean for the 6★ skill (only matters if character has one).
export const DEFAULT_SK = {n:3, s6:true}
export const defaultSks = () => Array.from({length:4}, () => ({...DEFAULT_SK}))
export function hasStar6(char){ return !!(char?.skills||[]).some(s=>s.star6) }
export function applyMask(char, mask){
  if(!char) return null
  const m = mask || DEFAULT_SK
  const base = (char.skills||[]).filter(s=>!s.star6).slice(0, m.n|0)
  const s6 = (char.skills||[]).find(s=>s.star6)
  return {...char, skills: (m.s6 && s6) ? [...base, s6] : base}
}
