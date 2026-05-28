import { useState, useRef, useEffect, useMemo } from 'react'
import { Routes, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom'
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
import cwTeamBuffs  from '../data/cw_team_buffs.json'
import cwMaxStats   from '../data/cw_max_stats.json'
import sceneCardBuffs from '../data/scene_card_cw_buffs.json'
import cw6SceneCards from '../data/cw6_scene_cards.json'
import statusEffects from '../data/glossary/status_effects.json'
import unitMatchups  from '../data/glossary/unit_matchups.json'
import skillTypesGlossary from '../data/glossary/skill_types.json'
import rarityData from '../data/character_rarity.json'

const PROGRESS_STORAGE_KEY='ranhq-progress-v3'
const emptyProgress=()=>({cw6Cards:{},sceneBuffCards:{},sceneBuffStars:{},buffSources:{}})
const normalizeProgress=(raw={})=>{
  const base=emptyProgress()
  return Object.fromEntries(Object.keys(base).map(k=>[k,{...(raw[k]||{})}]))
}
const readProgress=()=>{
  if(typeof window==='undefined') return emptyProgress()
  try{return normalizeProgress(JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)||'{}'))}
  catch{return emptyProgress()}
}
function useProgressTracker(){
  const[progress,setProgress]=useState(readProgress)
  useEffect(()=>{
    try{window.localStorage.setItem(PROGRESS_STORAGE_KEY,JSON.stringify(progress))}
    catch{}
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
const progressFilterItems=[
  {id:'all',label:'All'},
  {id:'owned',label:'Owned'},
  {id:'missing',label:'Missing'},
]
const ProgressTools=({tracker})=>(
  <div className="progress-tools" aria-label="Progress tools">
    <span className="progress-tools-note">Saved on this browser</span>
    <button type="button" onClick={tracker.exportProgress}>Export</button>
    <button type="button" onClick={tracker.importProgress}>Import</button>
    <button type="button" onClick={tracker.clearProgress}>Clear</button>
  </div>
)
const OwnedToggle=({owned,onToggle,label='Owned',className=''})=>(
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
const SceneStarControl=({star,onChange})=>(
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
const buffSourceId=(kind,key,stat,e,i)=>`${kind}:${key}:${stat}:${e.name||''}:${e.name_jp||''}:${e.value||0}:${e.special_label||''}:${i}`

const ALL = [
  ...mountainFolk,...qin,...qinBatch2,...qinMajor,
  ...zhao,...zhaoBatch2,...zhaoMajor,...otherStates,
  ...chu,...chuMajor,...wei,...yan,...qi,
  ...aiYanMajor,...misc,...misc2,
].filter(c=>c.country!=='unknown')

const GROUPS={
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
  'Kisei Army':       ['kisui','batei','ryuuto','duke_sei','kishou'],
  'Ousen Army':       ['akou','denrimi','kanjou','shoutaku','kyuukou','makou'],
  'Moubo Army':       ['moubu','choushi','raiki'],
  'Coalition Army':   ['karin','kanmei','riboku','houken','seikai','rinbukun','gohoumei','mangoku'],
  'Ryofui Four Pillars': ['ryofui','mougou'],
}
const UNIT_TYPES={
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
  ouhon:'Cavalry',ouki:'Cavalry',qingxiang:'Cavalry',renpa:'Cavalry',rikusen:'Cavalry',
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
  kyourei:'Infantry',kyoushou:'Infantry',kyuukou:'Infantry',linhtama:'Infantry',maron:'Infantry',
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
const CHAR_BY_NAME = (()=>{const m={};for(const c of ALL){if(!c.name_en) continue;m[c.name_en]=c;m[c.name_en.toLowerCase()]=c}return m})()
const findCharByName = n => n && (CHAR_BY_NAME[n] || CHAR_BY_NAME[n.toLowerCase()]) || null

const RED_CRYSTAL_TOTAL_COST={R:595,SR:800,UR:1750,LG:1750}
const RED_CRYSTAL_SKILL_COSTS={R:[70,175,350],SR:[80,240,480],UR:[100,550,1100],LG:[100,550,1100]}
const RED_CRYSTAL_UNLOCK_COSTS=Object.fromEntries(
  Object.entries(RED_CRYSTAL_SKILL_COSTS).map(([rarity,costs])=>[
    rarity,
    costs.map((_,i)=>costs.slice(0,i+1).reduce((sum,v)=>sum+v,0)),
  ])
)
const normalizeBuffText=s=>(s||'').toLowerCase().replace(/[\[\]"'’‘“”・–—\-]/g,' ').replace(/\s+/g,' ').trim()
const buffValueMatches=(text,value)=>{
  const v=Number(value)
  if(!Number.isFinite(v)) return false
  const escaped=String(v).replace('.', '\\.')
  return new RegExp(`(?:^|\\D)${escaped}(?:0+)?\\s*(?:%|％|ï¼…)`).test(text||'')
}
const buffStatMatches=(effect,stat)=>{
  const t=normalizeBuffText(effect)
  if(stat==='HP') return /\bmax hp up\b|\bhp up\b/.test(t)
  if(stat==='Attack') return /\batk up\b|\battack up\b/.test(t)
  if(stat==='Defense') return /\bdef up\b|\bdefense up\b/.test(t)
  if(/Damage Dealt Reduction|Damage Taken Increase|Starting Troop HP Loss/i.test(stat||'')) return true
  return false
}
const buffTargetMatches=(skill,effect,kind,key)=>{
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
function redCrystalBuffUnlockCost(entry,kind,key,stat){
  if(!entry||entry.special_icon||entry.special_label||Number(entry.value)===5) return null
  const char=findCharByName(entry.name)||ALL.find(c=>c.name_jp===entry.name_jp)
  if(!char) return null
  const rarity=RARITY_DATA[char.name_en]?.rarity||char.rarity||entry.type||'SR'
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
function RedCrystalCostChip({cost,value}){
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
function BuffValueCluster({value,color,cost,icon,iconLabel,iconTitle,shardBonus,shardOwned,mainOwned,fontSize='1.1rem',minWidth='52px'}){
  const shardFade=shardBonus&&!shardOwned?.55:1
  const crystalFade=shardBonus&&!mainOwned?.55:1
  return(
    <div className="buff-value-cluster" style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'8px',minWidth:shardBonus?'200px':'150px',flexShrink:0,flexWrap:'wrap',rowGap:'4px'}}>
      {shardBonus&&<span className="buff-value-shard" style={{display:'inline-flex',alignItems:'center',gap:'4px',opacity:shardFade}}>
        <span style={{fontWeight:900,fontSize,color,fontVariantNumeric:'tabular-nums'}}>+5.0%</span>
        <img src="/icons/Shard.webp" alt="Shard upgrade" title="Shard upgrade" loading="lazy" decoding="async" style={{width:20,height:20,objectFit:'contain',flexShrink:0}}/>
      </span>}
      {shardBonus&&<span style={{color:'var(--txt3)',fontWeight:800,fontSize:'.9rem'}}>+</span>}
      {icon&&!cost&&!shardBonus&&<img
        src={icon}
        alt={iconLabel||'Unlock source'}
        title={iconTitle||iconLabel}
        loading="lazy"
        decoding="async"
        style={{width:20,height:20,objectFit:'contain',flexShrink:0}}
      />}
      <span className="buff-value-crystal" style={{display:'inline-flex',alignItems:'center',gap:'8px',opacity:crystalFade}}>
        <RedCrystalCostChip cost={cost} value={value}/>
        <span style={{fontWeight:900,fontSize,color,minWidth,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>+{value.toFixed(1)}%</span>
      </span>
    </div>
  )
}

const FACTIONS=[
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
const CC=Object.fromEntries(FACTIONS.map(f=>[f.id,f.color]))

// Icon: use c.icon if available, else fall back to c.image cropped, else initials
function CharIcon({c,size=40,round=false,className=''}){
  const r=round?'50%':'8px'
  const s={width:size,height:size,borderRadius:r,objectFit:'cover',objectPosition:'center top',flexShrink:0,display:'block'}
  if(c?.icon) return <img src={c.icon} style={s} className={className} alt={c.name_en} loading="lazy" decoding="async"/>
  if(c?.image) return <img src={c.image} style={{...s,objectPosition:'top center'}} className={className} alt={c.name_en} loading="lazy" decoding="async"/>
  const col=(CC[c?.country]||'#888')
  return <div style={{...s,background:col+'33',color:col,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:size*.38+'px'}} className={className}>{c?.name_en?.[0]||'?'}</div>
}


const TYPE_COLOR={Combat:'#c0392b',Strategy:'#3d6eb5','Internal Affairs':'#1a8a72'}

// ── Tier List + Meta team data ────────────────────────────────────────────────
// Single source of truth: TIER_TEAMS. META_TEAMS is derived from this + a few
// builder-only extras. Keeps tier/builder pages in sync automatically.
const TIER_COLORS={S:'#c0392b',A:'#e07f48',B:'#cc972d',C:'#3d6eb5'}
const TIER_TEAMS=[
  {tier:'S',name:'Ouhon',           members:['Shoutaku','Ouhon','Kanjou','Gakuki']},
  {tier:'S',name:'Archers',         members:['Keisha','Seikai','Hakurei','Queen Biki']},
  {tier:'S',name:'Zhao',            members:['Shunsuiju','Houken','Shinseijou','Riboku']},
  {tier:'S',name:'YTW',             members:['Katari','Yotanwa','Kitari','Ramauji']},
  {tier:'A',name:'Renpa',           members:['Rinko','Tairoji','Renpa','Kouretsu']},
  {tier:'A',name:'Karin + Kanmei',  members:['Kyoubou','Karin','Kanmei','Shunshinkun']},
  {tier:'A',name:'Hi Shin',         members:['Garo','Gakurai','Naki','Robin']},
  {tier:'A',name:'Wei',             members:['Ranbihaku','Tairoji','Reiou','Gokei']},
  {tier:'B',name:'Ai',              members:['Wategi','Budai','Hanoki','Hamui']},
  {tier:'B',name:'Ousen Army',      members:['Eiki','Makou','Akou','Ousen']},
  {tier:'B',name:'6GG',             members:['Sho','Ouki','Tou','Kyou']},
  {tier:'B',name:'Karin',           members:['Rien','Karin','Kaen','Goutoku']},
  {tier:'B',name:'Chu',             members:['Kyoubou','Rinbukun','Kanmei','Shunshinkun']},
  {tier:'C',name:'Han',             members:['Seikai','Chouin','Bakan','Nakon']},
  {tier:'C',name:'Archer Garrison', members:['Rouai','Queen Biki','Seikai','Keisha']},
  {tier:'C',name:'Rigan',           members:['Kisui','Kishou','Batei','Duke Sei']},
  {tier:'C',name:'Kanki',           members:['Zenou','Raido','Kanki','Naki']},
].map(t=>({...t,color:TIER_COLORS[t.tier]}))

// Builder-only extras (not part of the Metawatch tier list)
const META_TEAM_EXTRAS=[
  {name:'Qin Shields',    members:['Hakuki','Akou','Ousen','Ei Sei']},
  {name:'YTW + Triplets', members:['Yotanwa','Toji','Fuji','Ramauji']},
  {name:'Gyokuhou',       members:['Shoutaku','Ouhon','Kyuukou','Kanjou']},
]
const META_TEAMS=[...TIER_TEAMS.map(({name,members})=>({name,members})),...META_TEAM_EXTRAS]

// Simulate
function simulate(a,d){
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
const CW_MAX = cwMaxStats
// Rarity-based maxed defaults for chars without a pre-computed entry
// (scaled approximations for the 7 unmatched site chars: denti, kakubi,
//  muten_grandpa, shosa, linhtama, qingxiang, ringyoku)
const CW_DEF_MAX={
  N:{hp:15000,atk:5000,def:4500,maxMp:6000,critRate:500,critDmgRate:150,hitRate:11250,dodgeRate:1500,adSlay:7000,daSlay:9500,defPen:0},
  R:{hp:22000,atk:8000,def:7000,maxMp:7000,critRate:750,critDmgRate:150,hitRate:11500,dodgeRate:1750,adSlay:8500,daSlay:9300,defPen:300},
  SR:{hp:40000,atk:11000,def:8500,maxMp:8500,critRate:1000,critDmgRate:150,hitRate:11750,dodgeRate:1875,adSlay:10000,daSlay:8800,defPen:500},
  SSR:{hp:55000,atk:13000,def:9500,maxMp:9500,critRate:1250,critDmgRate:150,hitRate:11875,dodgeRate:1875,adSlay:11375,daSlay:9075,defPen:600},
  UR:{hp:75000,atk:15000,def:10000,maxMp:10500,critRate:1625,critDmgRate:150,hitRate:12000,dodgeRate:2000,adSlay:11750,daSlay:9150,defPen:750},
}

// CW type buffs: each unit type gets its own type's buffs only.
// unitType field is set per-character in cw_max_stats.json (from Excel data).
// Sum all contributor % values from cw_buffs.json per type.
const _st=(type,cat)=>(cwBuffsData[type]?.[cat]||[]).reduce((s,e)=>s+e.value,0)
const CW_TYPE_BUFFS={
  Infantry:{hp:_st('Infantry','HP'), atk:_st('Infantry','Attack'), def:_st('Infantry','Defense')},
  Cavalry: {hp:_st('Cavalry','HP'),  atk:_st('Cavalry','Attack'),  def:_st('Cavalry','Defense')},
  Archer:  {hp:_st('Archer','HP'),   atk:_st('Archer','Attack'),   def:_st('Archer','Defense')},
  Shield:  {hp:_st('Shield','HP'),   atk:_st('Shield','Attack'),   def:_st('Shield','Defense')},
}
// Scene card global bonuses (flat or internal rate points, applied to all CW characters)
const SCENE_CARD=sceneCardBuffs.totals

// Return fully-buffed CW stats for a character at max enhancement.
// Applies unit-type % buffs from the CW Buffs page + scene card flat bonuses.
function calcCwStats(char){
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
function simulateBattle(atkTeam,defTeam){
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
const UNIT_TYPE_LIST=['Infantry','Cavalry','Archer','Shield']
const FACTION_MAP={'qin':'qin','zhao':'zhao','chu':'chu','wei':'wei','yan':'yan','qi':'qi','han':'han','mountain folk':'mountain_folk','ai':'ai'}
const STATUS_EFFECTS=['Confusion','Poison','Paralysis','Betrayal','Burn','Fear','Illusion','Reckless']
const STATUS_RE=new RegExp('^('+STATUS_EFFECTS.join('|')+')','i')
const TARGET_NAME_ALIASES={moubo:'moubu',ghm:'gohoumei'}
const normalizeBuffStat=s=>/^Evasion Rate$/i.test(s)?'Evasion':s
function parseBuffEffect(str){
  if(!str) return []
  const results=[];let deferred=[]
  for(let part of str.split(/[,、\/]/)){
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
    function flush(r){
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
const normalizeRosterLabel=s=>(s||'').toLowerCase().replace(/[^a-z]/g,'')
function groupMatchesLabel(groupName,label){
  const g=normalizeRosterLabel(groupName)
  const l=normalizeRosterLabel(label)
  return !!l&&(g===l||g.includes(l)||l.includes(g)||g.includes(l.replace(/s$/,''))||l.includes(g.replace(/s$/,'')))
}
function inGroup(c,groupName){
  return(c.groups||[]).some(gn=>groupMatchesLabel(gn,groupName))
}
function cleanRosterCriterion(label){
  return(label||'')
    .replace(/[\[\]"“”「」]/g,' ')
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
function rosterCriterionMatches(c,label,owner,forceOther=false){
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
function matchAllyRosterListTarget(t,G,owner){
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
function isTargetedBy(target,G,owner,team){
  if(!target) return false
  const t=target.trim()
  if(/^enemy|^1\s*enemy|^other\s+enemy|^siege\s+weapon|^ally\s+siege|^gate|^\d+\s+enemy|^Enemy\s*\[/i.test(t)) return false
  // "Self and/or ally X"
  const selfAnd=/^self(?:\s+and|\s*[\/,])\s*ally\s+(.+)/i.exec(t)
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
  // "All ally generals", "Ally generals" → everyone
  if(/all\s+all(?:ies|y)|(?:^|\s)ally\s+generals?/i.test(t)) return true
  // "Other ally generals" / "Other ally" → everyone except self
  if(/other\s+ally/i.test(t)) return G.id!==owner.id
  // Bare country names: "Ally Qin", "Ally Zhao", "Other ally Chu", "Ally Mountain Folk", etc.
  for(const [label,code] of Object.entries(FACTION_MAP)){
    if(new RegExp('ally\\s+'+label.replace(/ /g,'\\s+'),'i').test(t)) return G.country===code
  }
  // Specific named general: "Ally Name"
  const nameM=/(?:surviving\s+)?ally\s+"?([^"\/\n,\[\]]+?)"?\s*(?:vs\s+\S.*)?$/i.exec(t)
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
function getMultiplier(cond,owner,team){
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
function isCondActive(cond,isDefense){
  if(!cond) return true
  const c=cond.toLowerCase()
  if(c.includes('garrison')) return isDefense
  if(c.includes('when attacking')) return !isDefense
  return true
}
function calcCharBuffs(G,team,enemyTeam,isDefense,showAll=false){
  const stats={}
  for(const owner of team){
    for(const skill of(owner.skills||[])){
      if(skill.type!=='Strategy') continue
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

function normalizeEnemyTarget(t){
  const tl=t.toLowerCase()
  if(/^enemy\s+generals?\s+vs\b/i.test(t)) return 'Enemy generals'
  if(/all\s+enemy|all\s+generals/i.test(tl)) return 'All enemies'
  const ut=UNIT_TYPE_LIST.find(u=>tl.includes(u.toLowerCase()))
  if(ut) return `Enemy ${ut}`
  for(const [label] of Object.entries(FACTION_MAP))
    if(tl.includes(label)) return `Enemy ${label[0].toUpperCase()+label.slice(1)}`
  return 'Enemies'
}
function calcTeamEnemyDebuffs(team,enemyTeam=[]){
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
      if(sk.type!=='Strategy') continue
      for(const eff of(sk.effects||[])){
        const t=(eff.target||'').trim()
        // skip effects whose condition requires an enemy unit type not present
        if(enemyTeam.length>0){
          const cm=(eff.condition||'').match(/enemy\s+(infantry|cavalr\w*|archers?|shield)/i)
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
function Picker({onSelect,onClose,excl=[]}){
  const[q,setQ]=useState(''),ref=useRef(null)
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
      <div className="picker" onClick={e=>e.stopPropagation()}>
        <div className="picker-head"><span>Select General</span><button className="x-btn" onClick={onClose}>✕</button></div>
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
const RARITY_COST=RED_CRYSTAL_TOTAL_COST
const RARITY_COLOR={R:'#3d9970',SR:'#3d6eb5',UR:'#c0392b',LG:'#d4af37'}

const RARITY_DATA=rarityData

const PAGES=['Home','Archive','Guide','Party Builder','Buffs','Tier List','Team Cost']
const PAGE_ICONS={
  'Home':'\u2302',
  'Archive':'\uD83D\uDC64',
  'Guide':'\uD83D\uDCD6',
  'Party Builder':'\u2694\uFE0F',
  'Buffs':'\uD83D\uDCCA',
  'Tier List':'\uD83C\uDFC6',
  'Team Cost':{img:'/icons/Red_Crystal.webp'},
}
const PAGE_SHORT={'Home':'Home','Archive':'Archive','Guide':'Guide','Party Builder':'Builder','Buffs':'Buffs','Tier List':'Tiers','Team Cost':'Cost'}
const PAGE_TO_ROUTE={'Home':'/','Archive':'/archive','Guide':'/guide','Party Builder':'/builder','Buffs':'/buffs','Tier List':'/tiers','Team Cost':'/cost'}
function routeMatches(pathname,page){
  const r=PAGE_TO_ROUTE[page]
  if(pathname===r||pathname===r+'/') return true
  if(pathname.startsWith(r+'/')) return true
  return false
}
function currentPage(pathname){
  return PAGES.find(p=>routeMatches(pathname,p))||(pathname.startsWith('/sim')?'':'Home')
}
function PageIcon({p}){
  const v=PAGE_ICONS[p]
  if(v&&typeof v==='object'&&v.img) return <img src={v.img} alt="" className="bntab-img"/>
  return <span>{v}</span>
}
// Hidden search tags — searching these strings finds the listed characters
const CHAR_GROUPS={
  'Hi Shin Unit':['Shin','Garo','Gakurai','Kyoukai'],
  'HiShin':['Shin','Garo','Gakurai','Kyoukai'],
  'Gakuka':['Mouten','Rikusen'],
  'Moubo Army':['Moubu','Choushi','Raiki'],
}

// Per-slot skill mask for the Party Builder.
// n: 0-3 skill-unlock level (cascading — n=2 means S1+S2 enabled, S3 off).
// s6: independent boolean for the 6★ skill (only matters if character has one).
const DEFAULT_SK = {n:3, s6:true}
const defaultSks = () => Array.from({length:4}, () => ({...DEFAULT_SK}))
function hasStar6(char){ return !!(char?.skills||[]).some(s=>s.star6) }
function applyMask(char, mask){
  if(!char) return null
  const m = mask || DEFAULT_SK
  const base = (char.skills||[]).filter(s=>!s.star6).slice(0, m.n|0)
  const s6 = (char.skills||[]).find(s=>s.star6)
  return {...char, skills: (m.s6 && s6) ? [...base, s6] : base}
}

export default function App(){
  const location=useLocation()
  const navigate=useNavigate()
  const page=currentPage(location.pathname)
  const go=p=>navigate(PAGE_TO_ROUTE[p])
  const[atk,setAtk]=useState([null,null,null,null])
  const[def,setDef]=useState([null,null,null,null])
  const[atkSk,setAtkSk]=useState(defaultSks())
  const[defSk,setDefSk]=useState(defaultSks())
  const rm=(char,side)=>{
    const isAtk=side==='attack'
    const team=isAtk?atk:def
    const idx=team.findIndex(x=>x?.id===char.id)
    const setTeam=isAtk?setAtk:setDef
    const setSk=isAtk?setAtkSk:setDefSk
    setTeam(p=>p.map(x=>x?.id===char.id?null:x))
    if(idx>=0) setSk(p=>p.map((m,i)=>i===idx?{...DEFAULT_SK}:m))
  }
  const setSlot=(char,side,idx)=>{
    const isAtk=side==='attack'
    const setTeam=isAtk?setAtk:setDef
    const setSk=isAtk?setAtkSk:setDefSk
    setTeam(p=>{const n=[...p];const e=n.findIndex(x=>x?.id===char.id);if(e!==-1)n[e]=null;n[idx]=char;return n})
    setSk(p=>{const n=[...p];n[idx]={...DEFAULT_SK};return n})
  }
  const loadMetaTeam=(team,side)=>{
    const chars=team.members.map(findCharByName).filter(Boolean).slice(0,4)
    const slots=[...chars,...Array(4-chars.length).fill(null)]
    if(side==='attack'){ setAtk(slots); setAtkSk(defaultSks()) }
    else { setDef(slots); setDefSk(defaultSks()) }
    navigate('/builder')
  }
  // Scroll to top when switching top-level tab (not on character deep-link changes within Archive)
  useEffect(()=>{window.scrollTo(0,0)},[page])
  return(
    <div className="app">
      <header className="hdr">
        <div className="hdr-in">
          <button className="logo" onClick={()=>navigate('/')} style={{background:'none',border:'none',padding:0,cursor:'pointer',color:'inherit'}}>
            <img src="/ranhq-icon.webp" alt="RanHQ" className="logo-icon"/>
            <div>
              <div className="logo-ja">キングダム乱</div>
              <div className="logo-en">RanHQ</div>
            </div>
          </button>
          <nav className="nav">
            {PAGES.map(p=>(
              <button key={p} className={`nb${page===p?' nb-on':''}`} onClick={()=>go(p)}>
                {p}{p==='Party Builder'&&(atk.filter(Boolean).length+def.filter(Boolean).length)>0&&<span className="nb-dot">{atk.filter(Boolean).length+def.filter(Boolean).length}</span>}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div className="app-body">
        <Routes>
          <Route path="/" element={<HomePage go={go}/>}/>
          <Route path="/archive" element={<ArchiveHubPage/>}/>
          <Route path="/archive/characters" element={<><ArchiveTabs active="characters"/><ArchivePage/></>}/>
          <Route path="/archive/characters/:charId" element={<><ArchiveTabs active="characters"/><ArchivePage/></>}/>
          <Route path="/archive/cw6-scene-cards" element={<CW6SceneCardsPage/>}/>
          <Route path="/archive/:charId" element={<><ArchiveTabs active="characters"/><ArchivePage/></>}/>
          <Route path="/builder" element={<BuilderPage atk={atk} def={def} atkSk={atkSk} defSk={defSk} setAtkSk={setAtkSk} setDefSk={setDefSk} setSlot={setSlot} rm={rm} goSim={()=>navigate('/sim')} loadMetaTeam={loadMetaTeam}/>}/>
          <Route path="/sim" element={<SimPage atk={atk} def={def} atkSk={atkSk} defSk={defSk} goBuilder={()=>navigate('/builder')}/>}/>
          <Route path="/buffs" element={<BuffsPage/>}/>
          <Route path="/tiers" element={<TierPage/>}/>
          <Route path="/cost" element={<TeamCostPage/>}/>
          <Route path="/guide" element={<CWGuidePage/>}/>
          <Route path="/guide/:section" element={<CWGuidePage/>}/>
          <Route path="*" element={<Navigate to="/archive" replace/>}/>
        </Routes>
      </div>
      <footer className="foot">
        <div style={{marginTop:'.35rem'}}>Made by <strong>@ZiyadRed</strong> · Purgatory 復活</div>
        <div style={{marginTop:'.2rem'}}>Special thanks <strong>@WiperLuffy</strong> · <a href="https://touranko.vercel.app" target="_blank" rel="noopener noreferrer" style={{color:'var(--txt3)',textDecoration:'underline'}}>touranko.vercel.app</a></div>
        <div style={{marginTop:'.35rem',color:'var(--txt3)'}}>©Hara Yasuhisa/Shueisha・Kingdom Production Committee ©でらゲー</div>
        <div style={{marginTop:'.2rem'}}><a href="https://discord.gg/8fJvWtgR" target="_blank" rel="noopener noreferrer" style={{color:'var(--txt3)',textDecoration:'underline'}}>Join the Discord</a></div>
      </footer>
      <nav className="bottom-nav">
        {PAGES.map(p=>(
          <button key={p} className={`bntab${page===p?' bntab-on':''}`} onClick={()=>go(p)}>
            <span className="bntab-icon"><PageIcon p={p}/></span>
            {PAGE_SHORT[p]}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ── ARCHIVE ───────────────────────────────────────────────────────────────────
function HomePage({go}){
  const tools=[
    {page:'Archive',title:'Archive',desc:'Browse character skills and CW scene-card references.'},
    {page:'Guide',title:'Guide',desc:'Learn mechanics, status effects, terrain rules, targeting behavior, and matchups.'},
    {page:'Party Builder',title:'Party Builder',desc:'Build attacking and defending formations, adjust unlocked skills, then open the battle order view.'},
    {page:'Buffs',title:'Buffs',desc:'Review buffs by unit type, source, and stat impact.'},
    {page:'Tier List',title:'Metawatch',desc:'See current team tiers and strong Castle War formations.'},
    {page:'Team Cost',title:'Team Cost',desc:'Calculate the red crystals needed for characters and teams.'},
  ]
  return(
    <main className="home-page">
      <section className="home-hero">
        <img src="/ranhq-home-banner.webp" alt="" className="home-hero-img" width="1881" height="836" decoding="async" fetchPriority="high"/>
        <div className="home-hero-shade"/>
        <div className="home-hero-content">
          <div className="home-kicker">Kingdom Ran Castle War companion</div>
          <h1>RanHQ</h1>
          <p>
            RanHQ is a fan-made English project for Kingdom Ran's Castle War mode,
            built to help players learn the mode, understand skills and buffs, and plan stronger strategies.
          </p>
          <div className="home-actions">
            <button className="home-primary" onClick={()=>go('Archive')}>Open Archive</button>
            <button className="home-secondary" onClick={()=>go('Guide')}>Read Guide</button>
          </div>
        </div>
      </section>

      <section className="home-tools">
        <div className="home-section-head">
          <h2>Start Here</h2>
        </div>
        <div className="home-tool-grid">
          {tools.map((tool,i)=>(
            <button key={tool.page} className={`home-tool-card${i<2?' home-tool-card-main':''}`} onClick={()=>go(tool.page)}>
              <span className="home-tool-index">{String(i+1).padStart(2,'0')}</span>
              <strong>{tool.title}</strong>
              <span>{tool.desc}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

function ArchiveTabs({active}){
  const navigate=useNavigate()
  const tabs=[
    {id:'characters',label:'Characters',count:'201',route:'/archive/characters'},
    {id:'cw6',label:'CW6★ Scene Cards',count:String(cw6SceneCards.cards?.length||0),route:'/archive/cw6-scene-cards'},
  ]
  return(
    <div style={{
      display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',flexWrap:'wrap',
      padding:'12px 1rem',borderBottom:'1px solid var(--bdr)',background:'rgba(250,246,240,.68)',
    }}>
      {tabs.map(tab=>{
        const on=active===tab.id
        return(
          <button key={tab.id} onClick={()=>navigate(tab.route)} style={{
            display:'inline-flex',alignItems:'center',gap:'7px',borderRadius:999,
            border:`1px solid ${on?'var(--terra)':'var(--bdr)'}`,
            background:on?'var(--terra)':'var(--sur)',color:on?'#fff':'var(--txt)',
            padding:'.46rem .82rem',fontSize:'.78rem',fontWeight:900,
          }}>
            {tab.label}
            <span style={{
              fontSize:'.62rem',padding:'1px 7px',borderRadius:999,
              background:on?'rgba(255,255,255,.22)':'var(--bg2)',color:on?'#fff':'var(--txt3)',
              border:`1px solid ${on?'rgba(255,255,255,.24)':'var(--bdr)'}`,
            }}>{tab.count}</span>
          </button>
        )
      })}
    </div>
  )
}

function ArchiveHubPage(){
  return(
    <>
      <ArchiveTabs active="characters"/>
      <ArchivePage hideTabs/>
    </>
  )
}

function CW6SceneCardsPage(){
  const[selected,setSelected]=useState(null)
  const[progressFilter,setProgressFilter]=useState('all')
  const tracker=useProgressTracker()
  const cards=cw6SceneCards.cards||[]
  const visibleCards=cards.filter(card=>{
    const owned=tracker.isOwned('cw6Cards',card.id)
    return progressFilter==='all'||(progressFilter==='owned'?owned:!owned)
  })
  const ownedCount=tracker.countOwned('cw6Cards',cards.map(c=>c.id))
  const pickCard=card=>setSelected(selected?.id===card.id?null:card)
  const clearSelection=()=>setSelected(null)
  const sceneCardFileName=card=>card.name_en||`${card.ownerName||'Scene'} CW6 star`
  return(
    <>
    <ArchiveTabs active="cw6"/>
    <div className={'archive-layout cw6-scene-page' + (selected?' has-selection':'')}>
      <div className="gallery-wrap">
        <div className="gallery-header" style={{alignItems:'flex-start',gap:'12px',flexWrap:'wrap'}}>
          <div>
            <h2 className="gallery-title" style={{fontSize:'1rem'}}>CW6{'\u2605'} Scene Cards</h2>
            <div style={{fontSize:'.72rem',color:'var(--txt3)',marginTop:'3px'}}>6{'\u2605'} scene-card skills and owners</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'9px',flexWrap:'wrap',marginLeft:'auto'}}>
            <span className="gallery-count">{ownedCount}/{cards.length} owned</span>
            <div className="progress-filter-group" aria-label="CW6 ownership filter">
              {progressFilterItems.map(item=>(
                <button key={item.id} type="button" className={progressFilter===item.id?'active':''} onClick={()=>setProgressFilter(item.id)}>{item.label}</button>
              ))}
            </div>
            <ProgressTools tracker={tracker}/>
          </div>
        </div>
        <div className="cw6-scene-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'14px',padding:'14px',alignContent:'start'}}>
          {visibleCards.map((card,i)=>(
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              onClick={()=>pickCard(card)}
              onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pickCard(card)}}}
              style={{
              background:'var(--sur)',border:'2px solid ' + (selected?.id===card.id?'var(--terra)':'var(--bdr)'),
              borderRadius:8,overflow:'hidden',cursor:'pointer',textAlign:'left',
              boxShadow:selected?.id===card.id?'0 8px 22px rgba(6,38,76,.18)':'0 3px 14px rgba(6,38,76,.07)',
              transform:selected?.id===card.id?'translateY(-2px)':'none',
              transition:'transform .15s, box-shadow .15s, border-color .15s',
              display:'flex',flexDirection:'column',
            }}>
              <div style={{position:'relative',aspectRatio:'1 / 1',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <img src={card.thumb||card.image} alt={sceneCardFileName(card)} title={sceneCardFileName(card)} loading="eager" decoding="async" fetchPriority={i<7?'high':'auto'} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
                <OwnedToggle
                  owned={tracker.isOwned('cw6Cards',card.id)}
                  className="owned-toggle-overlay"
                  onToggle={e=>{e.stopPropagation();tracker.toggleOwned('cw6Cards',card.id)}}
                />
              </div>
              <div style={{padding:'10px 11px 11px',display:'flex',flexDirection:'column',gap:'6px'}}>
                <div>
                  <strong style={{display:'block',fontSize:'.84rem',color:'var(--txt)',lineHeight:1.25}}>{card.skill_en}</strong>
                  <span style={{display:'block',fontSize:'.68rem',color:'var(--txt3)',lineHeight:1.25,marginTop:'2px'}}>{card.skill_jp}</span>
                </div>
                {card.ownerName&&(
                  <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'.68rem',fontWeight:800,color:'var(--navy)',minWidth:0}}>
                    {card.ownerIcon&&<img src={card.ownerIcon} alt="" loading="lazy" decoding="async" style={{width:20,height:20,borderRadius:'50%',objectFit:'cover',objectPosition:'center top',border:'1px solid var(--bdr)',flexShrink:0}}/>}
                    <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{card.ownerName}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected&&(
        <aside className="detail-panel">
          <div className="detail-header">
            <img src={selected.image} alt={sceneCardFileName(selected)} className="detail-portrait" loading="eager" decoding="async" fetchPriority="high" style={{objectFit:'contain',background:'rgba(255,255,255,.08)',objectPosition:'center'}}/>
            <div className="detail-info">
              <div className="detail-name">{selected.skill_en}</div>
              <div className="detail-jp">{selected.skill_jp}</div>
              {selected.ownerName&&(
                <div className="detail-faction" style={{display:'flex',alignItems:'center',gap:'6px',color:'rgba(255,255,255,.82)'}}>
                  {selected.ownerIcon&&<img src={selected.ownerIcon} alt="" loading="lazy" decoding="async" style={{width:18,height:18,borderRadius:'50%',objectFit:'cover',objectPosition:'center top',border:'1px solid rgba(255,255,255,.22)'}}/>}
                  <span>{selected.ownerName}</span>
                </div>
              )}
            </div>
            <button className="detail-close" onClick={clearSelection}>{'\u00d7'}</button>
          </div>
          <div className="detail-skills">
            <OwnedToggle
              owned={tracker.isOwned('cw6Cards',selected.id)}
              onToggle={()=>tracker.toggleOwned('cw6Cards',selected.id)}
            />
            {selected.skill?<SkillCard skill={selected.skill}/>:<p className="no-skills">Translation pending</p>}
          </div>
        </aside>
      )}
    </div>
    </>
  )
}

function ArchivePage(){
  const{charId}=useParams()
  const navigate=useNavigate()
  const[activeFac,setActiveFac]=useState('qin')
  const[selected,setSelected]=useState(null)
  const[search,setSearch]=useState('')
  // Sync selection from URL param
  useEffect(()=>{
    if(!charId){setSelected(null);return}
    const c=ALL.find(x=>x.id===charId)
    if(c){setSelected(c);if(c.country)setActiveFac(c.country)}
  },[charId])
  const pickChar=c=>{
    if(selected?.id===c.id){navigate('/archive/characters');return}
    navigate(`/archive/characters/${c.id}`)
  }
  const clearSelection=()=>navigate('/archive/characters')
  const facChars=ALL.filter(c=>c.country===activeFac&&c.image)
  const filtered=(search
    ?ALL.filter(c=>{
      const q=search.toLowerCase()
      if(c.name_en.toLowerCase().includes(q)||c.name_jp.includes(search)) return true
      if(c.unit_type&&c.unit_type.toLowerCase().includes(q)) return true
      if(c.groups&&c.groups.some(g=>g.toLowerCase().includes(q))) return true
      // hidden group tags
      const groupMatch=Object.entries(CHAR_GROUPS).find(([tag])=>tag.toLowerCase().includes(q)||q.includes(tag.toLowerCase()))
      if(groupMatch&&groupMatch[1].includes(c.name_en)) return true
      if(c.skills?.some(sk=>sk.effects?.some(e=>e.effect&&e.effect.toLowerCase().includes(q)))) return true
      return false
    })
    :facChars
  ).slice().sort((a,b)=>a.name_en.localeCompare(b.name_en))
  const handleFacClick=(fid)=>{setActiveFac(fid);if(selected)navigate('/archive/characters');setSearch('')}

  return(
    <div className={`archive-layout${selected?' has-selection':''}`}>
      {/* Sidebar */}
      <aside className="fac-sidebar">
        <div className="fac-search-wrap">
          <input className="fac-search" placeholder="Search generals…" value={search} onChange={e=>{setSearch(e.target.value);if(selected)navigate('/archive/characters')}}/>
        </div>
        <div className="fac-nav">
          {FACTIONS.map(f=>{
            const n=ALL.filter(c=>c.country===f.id&&c.image).length
            if(!n) return null
            return(
              <button key={f.id} className={`fac-item${activeFac===f.id&&!search?' fac-active':''}`}
                style={activeFac===f.id&&!search?{'--fc':f.color}:{}} onClick={()=>handleFacClick(f.id)}>
                <span className="fac-stripe" style={{background:f.color}}/>
                <span className="fac-name">{f.label}</span>
                <span className="fac-jp">{f.jp}</span>
                <span className="fac-n">{n}</span>
              </button>
            )
          })}
        </div>
      </aside>

      {/* Gallery */}
      <div className="gallery-wrap">
        {/* Mobile-only search bar — visible on small screens */}
        <div className="mobile-search-bar">
          <span className="mobile-search-icon">⌕</span>
          <input
            className="mobile-search-input"
            placeholder="Search generals…"
            value={search}
            onChange={e=>{setSearch(e.target.value);if(selected)navigate('/archive/characters')}}/>
          {search&&<button className="mobile-search-clear" onClick={()=>setSearch('')}>✕</button>}
        </div>
        <div className="gallery-header">
          <h2 className="gallery-title">{search?`Results (${filtered.length})`:`${FACTIONS.find(f=>f.id===activeFac)?.label} Roster`}</h2>
          <span className="gallery-count">{filtered.length} generals</span>
        </div>
        <div className="gallery-grid">
          {filtered.map(c=>{
            const skillTag=search?(()=>{
              const q=search.toLowerCase()
              if(c.name_en.toLowerCase().includes(q)||c.name_jp.includes(search)) return null
              if(c.unit_type&&c.unit_type.toLowerCase().includes(q)) return null
              for(const sk of(c.skills||[]))
                for(const e of(sk.effects||[]))
                  if(e.effect&&e.effect.toLowerCase().includes(q)) return e.effect
              return null
            })():null
            return(
            <button key={c.id}
              className={`banner-card${selected?.id===c.id?' banner-selected':''}`}
              onClick={()=>pickChar(c)}
              style={selected?.id===c.id?{outline:`3px solid ${CC[c.country]||'#999'}`}:{}}>
              <div className="banner-faction-tag" style={{background:CC[c.country]||'#666'}}>
                {FACTIONS.find(f=>f.id===c.country)?.jp||c.country}
              </div>
              {c.image?<img src={c.image} alt={c.name_en} className="banner-img" loading="lazy"/>
                :<div className="banner-ph" style={{background:(CC[c.country]||'#555')+'33',color:CC[c.country]||'#888'}}>{c.name_en[0]}</div>}
              <div className="banner-footer">
                <span className="banner-name">{c.name_en}</span>
                {skillTag&&<span className="banner-skill-tag" title={skillTag}>{skillTag.length>22?skillTag.slice(0,21)+'…':skillTag}</span>}
              </div>
            </button>
            )
          })}
        </div>
      </div>

      {/* Skills panel — desktop: right column, mobile: bottom sheet */}
      {selected&&(
        <aside className="detail-panel">
          <div className="detail-header">
            <CharIcon c={selected} size={64} round={false} className="detail-portrait"/>
            <div className="detail-info">
              <div className="detail-name">{selected.name_en}</div>
              <div className="detail-jp">{selected.name_jp}</div>
              <div className="detail-faction" style={{color:CC[selected.country]||'#999'}}>
                {FACTIONS.find(f=>f.id===selected.country)?.label}
              </div>
            </div>
            <button className="detail-close" onClick={clearSelection}>✕</button>
          </div>
          <div className="detail-skills">
            {(selected.skills||[]).length===0
              ?<p className="no-skills">Translation pending</p>
              :(selected.skills||[]).map((sk,i)=>(
                <SkillCard key={i} skill={sk}/>
              ))
            }
          </div>
        </aside>
      )}
    </div>
  )
}

function SkillCard({skill}){
  const col=TYPE_COLOR[skill.type]||'#888'
  return(
    <div className="sk" data-type={skill.type}>
      <div className="sk-head" style={{borderLeftColor:col}}>
        <div>
          <span className="sk-name">{skill.name_en}</span>
          <span className="sk-jp">{skill.name_jp}</span>
        </div>
        <div className="sk-tags">
          {skill.star6&&<span className="tag t-star">☆6</span>}
          <span className="tag" style={{background:col+'22',color:col,border:`1px solid ${col}55`}}>{skill.type}</span>
          {skill.type==='Internal Affairs'&&<span className="tag t-map">Map</span>}
        </div>
      </div>
      <div className="sk-effects">
        {(skill.effects||[]).map((e,i)=>(
          <div key={i} className="eff">
            {e.condition&&<div className="eff-if"><span className="eff-if-lbl">IF</span>{e.condition}</div>}
            <div className="eff-body">
              <span className="eff-tgt">{e.target}</span>
              <span className="eff-sep">→</span>
              <span className="eff-val">{e.effect}</span>
              {e.duration&&<span className="eff-dur">{e.duration}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── META TEAM CARD ────────────────────────────────────────────────────────────
function MetaTeamCard({team,onLoad}){
  const chars=team.members.map(findCharByName).filter(Boolean)
  const accent=team.color||CC[chars[0]?.country]||'var(--terra)'
  return(
    <div className="meta-card" style={{borderTopColor:accent}}>
      <div className="meta-card-head">
        <span className="meta-name">{team.name}</span>
      </div>
      <div className="meta-members">
        {chars.map((c,i)=>(
          <div key={i} className="meta-member">
            <CharIcon c={c} size={60} round={true} className="meta-member-img"/>
            <span className="meta-member-name">{c.name_en}</span>
          </div>
        ))}
      </div>
      <div className="meta-btns">
        <button className="meta-btn meta-atk" onClick={()=>onLoad(team,'attack')}>⚔ Set as Attacker</button>
        <button className="meta-btn meta-def" onClick={()=>onLoad(team,'defense')}>🛡 Set as Defender</button>
      </div>
    </div>
  )
}

// ── PARTY BUILDER ─────────────────────────────────────────────────────────────
function BuilderPage({atk,def,atkSk,defSk,setAtkSk,setDefSk,setSlot,rm,goSim,loadMetaTeam}){
  const[picker,setPicker]=useState(null)
  const atkF=atk.filter(Boolean),defF=def.filter(Boolean)
  const atkM=atk.map((c,i)=>applyMask(c,atkSk[i])).filter(Boolean)
  const defM=def.map((c,i)=>applyMask(c,defSk[i])).filter(Boolean)
  // Only exclude chars already on the SAME side — opposing-team chars must remain searchable
  const excl=picker ? (picker.side==='attack'?atkF:defF).map(c=>c.id) : []
  const updateSk=(side,idx,mask)=>(side==='attack'?setAtkSk:setDefSk)(p=>{const n=[...p];n[idx]=mask;return n})
  return(
    <div className="main-page">
      {picker&&<Picker onSelect={c=>setSlot(c,picker.side,picker.idx)} onClose={()=>setPicker(null)} excl={excl}/>}
      <h2 className="pg-title">Party Builder</h2>
      <p className="pg-sub">Click slots to add generals. Last slot fires first.</p>
      <div className="two-sides">
        <SideSlots side="attack"  label="⚔ Attacking" party={atk} skMask={atkSk}
                   onSlot={i=>setPicker({side:'attack',idx:i})}  onRm={c=>rm(c,'attack')}
                   onSkChange={(i,mk)=>updateSk('attack',i,mk)}/>
        <div className="vs-sep">VS</div>
        <SideSlots side="defense" label="🛡 Defending" party={def} skMask={defSk}
                   onSlot={i=>setPicker({side:'defense',idx:i})} onRm={c=>rm(c,'defense')}
                   onSkChange={(i,mk)=>updateSk('defense',i,mk)}/>
      </div>
      {(atkF.length&&defF.length)>0&&<div className="cta-row"><button className="cta-btn" onClick={goSim}>Simulate Battle Order</button></div>}
      <BuffTable atk={atkM} def={defM}/>

      {/* Meta Teams */}
      <div className="meta-section">
        <h3 className="meta-section-title">Meta Teams</h3>
        <p className="meta-section-sub">Click Attack or Defense to load a team into the formation above.</p>
        <div className="meta-grid">
          {META_TEAMS.map((team,i)=><MetaTeamCard key={i} team={team} onLoad={loadMetaTeam}/>)}
        </div>
      </div>
    </div>
  )
}

function SideSlots({side,label,party,skMask,onSlot,onRm,onSkChange}){
  const ac=side==='attack'?'var(--red)':'var(--blue)'
  return(
    <div className="side">
      <div className="side-lbl" style={{color:ac,borderBottomColor:ac}}>{label}</div>
      {Array.from({length:4}).map((_,i)=>{
        const m=party[i]
        return m?(
          <div key={i} className="slot-filled" style={{borderLeftColor:CC[m.country]||'#999'}}>
            <span className="sn" style={{color:ac}}>{i+1}</span>
            <CharIcon c={m} size={36} round={true}/>
            <div className="slot-info"><span className="slot-en">{m.name_en}</span><span className="slot-jp">{m.name_jp}</span></div>
            <SkillToggles char={m} mask={skMask?.[i]||DEFAULT_SK} onChange={nm=>onSkChange(i,nm)}/>
            <button className="slot-rm" onClick={()=>onRm(m)} aria-label="Remove">✕</button>
          </div>
        ):(
          <button key={i} className="slot-empty" style={{borderColor:ac+'44'}} onClick={()=>onSlot(i)}>
            <span style={{color:ac+'88',fontSize:'1.3rem'}}>+</span>
            <span style={{color:ac+'77',fontSize:'.78rem'}}>{i+1} — Click to add</span>
          </button>
        )
      })}
    </div>
  )
}

function SkillToggles({char,mask,onChange}){
  const s6Exists=hasStar6(char)
  const n=mask?.n??3
  const s6on=mask?.s6!==false
  const clickNum=k=>{
    // Cascade: clicking k while n>=k => dim down to k-1; else unlock up to k.
    const nextN=n>=k?k-1:k
    onChange({...mask, n:nextN, s6:s6on})
  }
  const toggleS6=()=>onChange({...mask, n, s6:!s6on})
  return(
    <div className="skill-toggles" onClick={e=>e.stopPropagation()}>
      {[1,2,3].map(k=>(
        <button key={k}
                className={`stog${n>=k?' stog-on':''}`}
                onClick={e=>{e.stopPropagation();clickNum(k)}}
                aria-label={`Skill ${k} ${n>=k?'enabled':'disabled'}`}
                aria-pressed={n>=k}>
          {k}
        </button>
      ))}
      {s6Exists && (
        <button className={`stog-s6-btn${s6on?' stog-s6-on':''}`}
                onClick={e=>{e.stopPropagation();toggleS6()}}
                aria-label={`Star 6 skill ${s6on?'enabled':'disabled'}`}
                aria-pressed={s6on}>
          <img src="/icons/star6-banner.webp" alt="6★ skill" loading="lazy"/>
          <span className="stog-s6-badge">6★</span>
        </button>
      )}
    </div>
  )
}

// ── ACTIVATION ORDER ──────────────────────────────────────────────────────────
function SimPage({atk,def,atkSk,defSk,goBuilder}){
  const[tick,setTick]=useState(0)
  const atkF=atk.map((c,i)=>applyMask(c,atkSk?.[i])).filter(Boolean)
  const defF=def.map((c,i)=>applyMask(c,defSk?.[i])).filter(Boolean)
  if(!atkF.length||!defF.length) return(
    <div className="main-page empty-cta"><p>Choose both attacking and defending teams first.</p><button className="cta-btn" onClick={goBuilder}>Go to Party Builder</button></div>
  )
  const{st,turns}=simulate(atkF,defF)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const battle=useMemo(()=>simulateBattle(atkF,defF),[tick,atkF.map(g=>g.id).join(),defF.map(g=>g.id).join()])
  return(
    <div className="main-page">
      {/* ── Battle Result (hidden for now) ──────────────── */}
      {/* <BattleResult battle={battle} atkTeam={atkF} defTeam={defF} rerun={()=>setTick(t=>t+1)}/> */}

      {/* ── Formation bars ─────────────────────────────────── */}
      <div className="form-bars">
        <FormBar generals={atkF} side="attack" label="⚔ Attacking"/>
        <div className="form-vs">VS</div>
        <FormBar generals={defF} side="defense" label="🛡 Defending"/>
      </div>
      <div className="sim-sec">
        <div className="sec-hd sec-strat">⚑ Strategy Skills — Always Active</div>
        <div className="strat-cols">
          <StratCol label="⚔ Attacking Formation" entries={st.attack} side="attack"/>
          <StratCol label="🛡 Defending Formation" entries={st.defense} side="defense"/>
        </div>
      </div>
      <div className="sim-sec">
        <div className="sec-hd sec-combat">⚔ Skill Activation Order</div>
        {turns.map(({turn,entries})=>(
          <div key={turn} className="turn">
            <div className="turn-lbl">Turn {turn}</div>
            <div className="turn-entries">
              {entries.map(({general,skill,side},i)=>(
                <div key={i} className={`te te-${side}`}>
                  <div className="te-stripe" style={{background:side==='attack'?'var(--red)':'var(--blue)'}}/>
                  <div className="te-body">
                    <div className="te-gen">
                      <CharIcon c={general} size={38} round={true}/>
                      <div><b className="te-name">{general.name_en}</b><span className="te-jp">{general.name_jp}</span></div>
                      <span className="te-tag" style={{background:side==='attack'?'rgba(192,57,43,.18)':'rgba(26,95,168,.18)',color:side==='attack'?'#c0392b':'#1a5fa8',border:`1px solid ${side==='attack'?'rgba(192,57,43,.3)':'rgba(26,95,168,.3)'}`}}>{side==='attack'?'ATK':'DEF'}</span>
                    </div>
                    {skill?<SkillCard skill={skill}/>:<div className="normal-atk">Normal Attack</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BattleResult({battle,atkTeam,defTeam,rerun}){
  const{aS,dS,winner,finalTurn,log}=battle
  const isAtkWin=winner==='attack'||winner==='atk_pts'
  const isPoints=winner==='atk_pts'||winner==='def_pts'
  const winSide=isAtkWin?'attack':'defense'
  const winColor=isAtkWin?'var(--red)':'var(--blue)'
  const loseColor=isAtkWin?'var(--blue)':'var(--red)'
  const kills=log.flatMap(({turn,events})=>events.filter(e=>e.died).map(e=>({...e,turn})))
  const fmtK=(n)=>n>=1000?`${(n/1000).toFixed(1)}k`:String(n)
  const HpBar=({state,side})=>{
    const pct=Math.round(state.curHp/state.hp*100)
    const col=side==='attack'?'var(--red)':'var(--blue)'
    const died=!state.alive
    return(
      <div className="br-gen-row">
        <CharIcon c={state.g} size={32} round={true}/>
        <div className="br-gen-info">
          <div className="br-gen-name">{state.g.name_en}{died&&<span className="br-dead">☠</span>}</div>
          <div className="br-hp-bar">
            <div className="br-hp-fill" style={{width:`${pct}%`,background:died?'#555':col}}/>
          </div>
          <div className="br-hp-nums">
            <span style={{color:died?'var(--txt3)':col}}>{fmtK(state.curHp)}</span>
            <span style={{color:'var(--txt3)'}}> / {fmtK(state.hp)}</span>
            <span style={{color:'var(--txt3)',marginLeft:'auto',fontSize:'.65rem'}}>{died?'☠ KO':`${pct}%`}</span>
          </div>
        </div>
      </div>
    )
  }
  return(
    <div className="sim-sec">
      <div className="sec-hd" style={{background:winColor+'22',borderColor:winColor+'66',color:winColor}}>
        {isAtkWin?'⚔':'🛡'} {isAtkWin?'Attacking':'Defending'} Team Wins
        {isPoints?' (Points)':''} — Turn {finalTurn}
      </div>
      <div className="br-body">
        <div className="br-cols">
          {/* Attacking team HP */}
          <div className="br-side">
            <div className="br-side-lbl" style={{color:'var(--red)'}}>⚔ Attacking</div>
            {aS.map((s,i)=><HpBar key={i} state={s} side="attack"/>)}
            <div className="br-dmg-total">
              Total dmg dealt: <strong>{fmtK(aS.reduce((t,s)=>t+s.totalDmgDone,0))}</strong>
            </div>
          </div>
          {/* Kill log */}
          {kills.length>0&&(
            <div className="br-kills">
              <div className="br-kills-lbl">Kill Log</div>
              {kills.map((k,i)=>(
                <div key={i} className="br-kill-row">
                  <span className="br-kill-t">T{k.turn}</span>
                  <CharIcon c={k.actor.g} size={16} round/>
                  <span className="br-kill-arrow" style={{color:k.side==='attack'?'var(--red)':'var(--blue)'}}>→☠</span>
                  <CharIcon c={k.target.g} size={16} round/>
                  <span className="br-kill-name">{k.target.g.name_en}</span>
                </div>
              ))}
            </div>
          )}
          {/* Defending team HP */}
          <div className="br-side">
            <div className="br-side-lbl" style={{color:'var(--blue)'}}>🛡 Defending</div>
            {dS.map((s,i)=><HpBar key={i} state={s} side="defense"/>)}
            <div className="br-dmg-total">
              Total dmg dealt: <strong>{fmtK(dS.reduce((t,s)=>t+s.totalDmgDone,0))}</strong>
            </div>
          </div>
        </div>
        <div className="br-note">
          <button className="resim-btn" onClick={rerun}>🎲 Re-Simulate</button>
          <span className="br-note-txt">Results may vary each run</span>
        </div>
      </div>
    </div>
  )
}
function FormBar({generals,side,label}){
  const ac=side==='attack'?'var(--red)':'var(--blue)'
  return(
    <div className="form-side">
      <div className="form-lbl" style={{color:ac}}>{label}</div>
      <div className="form-chips">
        {generals.map((g,i)=>(
          <div key={g.id} className="f-chip" style={{borderTopColor:CC[g.country]||'#999'}}>
            <CharIcon c={g} size={36} round={true}/>
            <span className="f-chip-name">{g.name_en}</span>
          </div>
        ))}
        {!generals.length&&<span className="form-none">None</span>}
      </div>
    </div>
  )
}
function StratCol({label,entries,side}){
  const ac=side==='attack'?'var(--red)':'var(--blue)'
  return(
    <div className={`scol ${side==='attack'?'atk':'def'}`}>
      <div className="scol-lbl" style={{color:ac,borderBottomColor:ac+'44'}}>{label}</div>
      {!entries.length?<p className="scol-none">None</p>:entries.map(({general:g,skills:gs})=>(
        <div key={g.id} className="scol-gen">
          <div className="scol-gen-hdr" style={{color:ac}}>
            <CharIcon c={g} size={32} round={true}/>
            <b>{g.name_en}</b><span className="scol-jp">{g.name_jp}</span>
          </div>
          {gs.map((sk,i)=><SkillCard key={i} skill={sk}/>)}
        </div>
      ))}
    </div>
  )
}

// ── BUFF TABLE ────────────────────────────────────────────────────────────────
function BuffTable({atk,def}){
  if(!atk.length&&!def.length) return null
  const atkBuffs=atk.map(g=>({general:g,buffs:calcCharBuffs(g,atk,def,false,true)}))
  const defBuffs=def.map(g=>({general:g,buffs:calcCharBuffs(g,def,atk,true,true)}))
  const atkEnemyDebuffs=calcTeamEnemyDebuffs(atk,def)
  const defEnemyDebuffs=calcTeamEnemyDebuffs(def,atk)
  const hasAny=arr=>arr.some(({buffs})=>Object.keys(buffs).length>0)
  if(!hasAny(atkBuffs)&&!hasAny(defBuffs)&&!Object.keys(atkEnemyDebuffs).length&&!Object.keys(defEnemyDebuffs).length) return null
  return(
    <div className="sim-sec">
      <div className="sec-hd sec-buff">⚡ Team Buff Summary</div>
      <div className="strat-cols">
        <BuffSideTable label="⚔ Attacking Formation" entries={atkBuffs} side="attack" enemyDebuffs={atkEnemyDebuffs}/>
        <BuffSideTable label="🛡 Defending Formation" entries={defBuffs} side="defense" enemyDebuffs={defEnemyDebuffs}/>
      </div>
    </div>
  )
}
// Stats where "Down" is beneficial for the buff receiver (e.g. less morale cost = good)
const INVERSE_STATS=new Set(['Morale Consumption','Skill Cooldown','Damage Received'])
const SPECIAL_STATS=new Set(['Attack Nullification','Sure Hit','Status Effect Immunity','Rampage','Less Likely to be Targeted'])
// Canonical display order for buff stats
const STAT_ORDER=['Max HP','ATK','DEF','DEF Penetration','DEF Penetration Resistance','Guard','Attack Nullification','Sure Hit','Status Effect Immunity','Less Likely to be Targeted','Rampage','Max Morale','Morale Consumption','Morale Recovery','Critical Rate','Critical Damage','Hit Rate','HP Recovery','HP Recovery Nullification','Evasion','Squad Damage Reduction']
function statSortKey(s){const i=STAT_ORDER.indexOf(s);return i===-1?STAT_ORDER.length:i}
function BuffSideTable({label,entries,side,enemyDebuffs={}}){
  const[expanded,setExpanded]=useState(null)
  const ac=side==='attack'?'var(--red)':'var(--blue)'
  const hasAny=entries.some(({buffs})=>Object.keys(buffs).length>0)
  const hasEnemyDebuffs=Object.keys(enemyDebuffs).length>0
  const fmt=v=>Number.isInteger(v)?v:v.toFixed(1)
  return(
    <div className={`scol ${side==='attack'?'atk':'def'}`}>
      <div className="scol-lbl" style={{color:ac,borderBottomColor:ac+'44'}}>{label}</div>
      {!hasAny?<p className="scol-none">No relevant buffs</p>:entries.map(({general:g,buffs})=>{
        const stats=Object.entries(buffs).filter(([,v])=>v.up>0||v.down>0).sort(([a],[b])=>statSortKey(a)-statSortKey(b))
        return(
          <div key={g.id} className="scol-gen">
            <div className="scol-gen-hdr" style={{color:ac}}>
              <CharIcon c={g} size={26} round={true}/>
              <b>{g.name_en}</b>
              {g.unit_type&&<span className="scol-unit-badge" style={{background:ac+'22',color:ac,border:`1px solid ${ac}44`}}>{g.unit_type}</span>}
            </div>
            {!stats.length?<div className="buff-none-row">—</div>:(
              <div className="buff-stats">
                {stats.map(([stat,buff])=>{
                  const{up,down,sources=[],instances}=buff
                  const inv=INVERSE_STATS.has(stat)
                  const isFlag=SPECIAL_STATS.has(stat)
                  // Guard doesn't stack — render each instance as its own row, sorted desc.
                  if(stat==='Guard'&&instances&&instances.length){
                    const sorted=[...instances].sort((a,b)=>b.val-a.val)
                    return(
                      <div key={stat}>
                        {sorted.map((inst,idx)=>{
                          const key=`${g.id}|Guard|${idx}`
                          const isOpen=expanded===key
                          return(
                            <div key={idx}>
                              <div className={`buff-row buff-row-click${isOpen?' buff-row-open':''}`}
                                   onClick={()=>setExpanded(isOpen?null:key)}>
                                <span className="buff-stat-name">Guard</span>
                                <span className="buff-vals">
                                  <span className="buff-up">+{fmt(inst.val)}%</span>
                                  {inst.duration&&<span className="buff-dur" style={{fontSize:'.65rem',color:'var(--txt3)',marginLeft:'.3rem'}}>{inst.duration}</span>}
                                  <span className="buff-chevron">{isOpen?'▴':'▾'}</span>
                                </span>
                              </div>
                              {isOpen&&(
                                <div className="buff-sources">
                                  <div className="buff-source-row">
                                    <CharIcon c={inst.owner} size={16} round={true}/>
                                    <span className="buff-source-name">{inst.owner.name_en}</span>
                                    <span className="buff-up">+{fmt(inst.val)}%{inst.duration?` · ${inst.duration}`:''}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  }
                  const key=`${g.id}|${stat}`
                  const isOpen=expanded===key
                  return(
                    <div key={stat}>
                      <div className={`buff-row buff-row-click${isOpen?' buff-row-open':''}`}
                           onClick={()=>setExpanded(isOpen?null:key)}>
                        <span className="buff-stat-name">{stat}</span>
                        <span className="buff-vals">
                          {isFlag
                            ?<span className="buff-up" style={{fontSize:'.75rem',letterSpacing:'.02em'}}>● {up}×</span>
                            :<>{up>0&&<span className={inv?'buff-down':'buff-up'}>+{fmt(up)}%</span>}
                               {down>0&&<span className={inv?'buff-up':'buff-down'}>−{fmt(down)}%</span>}</>
                          }
                          <span className="buff-chevron">{isOpen?'▴':'▾'}</span>
                        </span>
                      </div>
                      {isOpen&&sources.length>0&&(
                        <div className="buff-sources">
                          {sources.map((s,i)=>(
                            <div key={i} className="buff-source-row">
                              <CharIcon c={s.owner} size={16} round={true}/>
                              <span className="buff-source-name">{s.owner.name_en}</span>
                              <span className={s.dir==='up'?(inv?'buff-down':'buff-up'):(inv?'buff-up':'buff-down')}>
                                {isFlag?`${s.contribution}×`:`${s.dir==='up'?'+':'−'}${fmt(s.contribution)}%`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      {hasEnemyDebuffs&&Object.entries(enemyDebuffs).map(([target,{up,down,sources={}}])=>{
        const allStats=[
          ...Object.entries(down).map(([s,v])=>({s,v,d:'down'})),
          ...Object.entries(up).map(([s,v])=>({s,v,d:'up'})),
        ].filter(x=>x.v>0)
        if(!allStats.length) return null
        return(
          <div key={target} className="scol-gen" style={{marginTop:'.5rem',borderColor:'rgba(176,80,0,.35)'}}>
            <div className="scol-gen-hdr" style={{color:'#b05000',fontSize:'.78rem',fontWeight:800,letterSpacing:'.02em'}}>
              <span style={{fontSize:'.85rem'}}>↓</span> {target}
            </div>
            <div className="buff-stats">
              {allStats.map(({s,v,d})=>{
                const skey=`${d}|${s}`
                const srcs=sources[skey]||[]
                const rowKey=`deb|${target}|${skey}`
                const isOpen=expanded===rowKey
                return(
                  <div key={s}>
                    <div className={`buff-row buff-row-click${isOpen?' buff-row-open':''}`}
                         style={{background:'rgba(176,80,0,.07)',borderColor:'rgba(176,80,0,.22)'}}
                         onClick={()=>setExpanded(isOpen?null:rowKey)}>
                      <span className="buff-stat-name" style={{color:'#b05000',fontWeight:700,fontSize:'.75rem'}}>{s}</span>
                      <span className="buff-vals">
                        <span className="buff-down">{d==='down'?'−':'+'}{fmt(v)}%</span>
                        <span className="buff-chevron">{isOpen?'▴':'▾'}</span>
                      </span>
                    </div>
                    {isOpen&&srcs.length>0&&(
                      <div className="buff-sources">
                        {srcs.map((x,i)=>(
                          <div key={i} className="buff-source-row">
                            <CharIcon c={x.owner} size={16} round={true}/>
                            <span className="buff-source-name">{x.owner.name_en}</span>
                            <span className="buff-down">{x.dir==='down'?'−':'+'}{fmt(x.contribution)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── CW BUFFS ──────────────────────────────────────────────────────────────────
const BUFF_UNIT_CATS = ['Infantry','Cavalry','Archer','Shield']
const BUFF_STAT_COLORS = {HP:'#1a8a72', Attack:'#c0392b', Defense:'#2471a3'}
const CAT_COLOR = {Infantry:'#b8880a', Cavalry:'#c0392b', Archer:'#27ae60', Shield:'#6a4fc8'}
const TERRAIN_EFFECTS = [
  {
    id:'slope', name:'Slope', jp:'坂', icon:'/icons/terrain_effect/slope.webp', color:'#c79b26',
    effect:'Damage dealt -50%',
    detail:'Your attacking unit deals 50% less damage when it invades through a Slope route.',
    mitigatedBy:'Slope Aptitude reduces this damage dealt penalty.',
  },
  {
    id:'forest', name:'Forest', jp:'森', icon:'/icons/terrain_effect/forest.webp', color:'#2f8f4e',
    effect:'Damage dealt -50%',
    detail:'Your attacking unit deals 50% less damage when it invades through a Forest route.',
    mitigatedBy:'Forest Aptitude reduces this damage dealt penalty.',
  },
  {
    id:'river', name:'River', jp:'川', icon:'/icons/terrain_effect/river.webp', color:'#2b80c9',
    effect:'Damage taken +50%',
    detail:'Your attacking unit takes 50% more damage when it invades through a River route.',
    mitigatedBy:'Waterway Aptitude reduces this damage taken increase.',
  },
  {
    id:'swamp', name:'Swamp', jp:'湿地', icon:'/icons/terrain_effect/swamp.webp', color:'#9a7b26',
    effect:'Damage taken +50%',
    detail:'Your attacking unit takes 50% more damage when it invades through a Swamp route.',
    mitigatedBy:'Mud Aptitude reduces this damage taken increase.',
  },
  {
    id:'checkpoint', name:'Checkpoint', jp:'関所', icon:'/icons/terrain_effect/checkpoint.webp', color:'#b98b35',
    effect:'Starting HP -30%',
    detail:'Your attacking unit starts the battle with 30% less HP when it invades through a Checkpoint route.',
    mitigatedBy:'Scout reduces this starting HP loss.',
  },
  {
    id:'ambush', name:'Ambush', jp:'伏兵', icon:'/icons/terrain_effect/ambush.webp', color:'#8a5a3a',
    effect:'Starting HP -30%',
    detail:'Your attacking unit starts the battle with 30% less HP when it invades through an Ambush route.',
    mitigatedBy:'Unit Protection reduces this starting HP loss.',
  },
]
const TERRAIN_BUFFS = [
  {
    id:'slope', name:'Slope', jp:'坂', icon:'/icons/terrain/slope.webp', color:'#c79b26',
    typeLabel:'Damage Dealt Reduction',
    description:'Increases resistance to damage dealt reduction from Slope terrain.',
    entries:[
      {name:'Maki', name_jp:'麻鬼', faction:'mountain_folk', type:'SR', value:5.4},
      {name:'Bihei', name_jp:'尾平', faction:'qin', type:'R', value:6.3},
      {name:'Kourigen', name_jp:'黄離弦', faction:'wei', type:'SR', value:7.2},
      {name:'Rinbou', name_jp:'鱗坊', faction:'qin', type:'SR', value:14.5},
      {name:'Domon', name_jp:'土門', faction:'zhao', type:'SR', value:16.6},
    ],
  },
  {
    id:'forest', name:'Forest', jp:'森', icon:'/icons/terrain/forest.webp', color:'#2f8f4e',
    typeLabel:'Damage Dealt Reduction',
    description:'Increases resistance to damage dealt reduction from Forest terrain.',
    entries:[
      {name:'Douken', name_jp:'道剣', faction:'zhao', type:'R', value:5.4},
      {name:'Bikou', name_jp:'尾到', faction:'qin', type:'SR', value:6.3},
      {name:'Kyomei', name_jp:'羌明', faction:'qin', type:'SR', value:7.2},
      {name:'Heki', name_jp:'壁', faction:'qin', type:'SR', value:14.5},
      {name:'Kokuou', name_jp:'黒桜', faction:'qin', type:'SR', value:16.6},
    ],
  },
  {
    id:'river', name:'River', jp:'川', icon:'/icons/terrain/river.webp', color:'#2b80c9',
    typeLabel:'Damage Taken Increase',
    description:'Increases resistance to damage taken increase from River terrain.',
    entries:[
      {name:'Kei', name_jp:'慶', faction:'qin', type:'SR', value:5.4},
      {name:'En', name_jp:'渕', faction:'qin', type:'SR', value:6.3},
      {name:'Kyoushou', name_jp:'羌象', faction:'qin', type:'SR', value:7.2},
      {name:'Doukin', name_jp:'同金', faction:'qin', type:'SR', value:14.5},
      {name:'Ryuusen', name_jp:'竜川', faction:'qin', type:'SR', value:16.6},
    ],
  },
  {
    id:'wetland', name:'Swamp', jp:'湿地', icon:'/icons/terrain/wetland.webp', color:'#9a7b26',
    typeLabel:'Damage Taken Increase',
    description:'Increases resistance to damage taken increase from Swamp terrain.',
    entries:[
      {name:'Kou', name_jp:'昂', faction:'qin', type:'SR', value:5.4},
      {name:'Jokan', name_jp:'徐完', faction:'zhao', type:'SR', value:6.3},
      {name:'Yuuren', name_jp:'幽連', faction:'wei', type:'SR', value:7.2},
      {name:'Saji', name_jp:'左慈', faction:'zhao', type:'SR', value:14.5},
      {name:'Mangoku', name_jp:'万極', faction:'zhao', type:'UR', value:16.6},
    ],
  },
  {
    id:'ambush', name:'Ambush', jp:'伏兵', icon:'/icons/terrain/ambush.webp', color:'#8a5a3a',
    typeLabel:'Starting Troop HP Loss',
    description:'Reduces the unit damage effect from Ambush terrain.',
    entries:[
      {name:'Gii', name_jp:'魏興', faction:'wei', type:'R', value:2.0},
      {name:'Seki', name_jp:'石', faction:'qin', type:'SR', value:2.4},
      {name:'Chousou', name_jp:'趙荘', faction:'zhao', type:'R', value:2.7},
      {name:'Douken', name_jp:'道剣', faction:'zhao', type:'R', value:4.6},
      {name:'Ryuukoku', name_jp:'隆国', faction:'qin', type:'SR', value:5.5},
      {name:'Kaishibou', name_jp:'介子坊', faction:'wei', type:'SR', value:6.2},
      {name:'Ka', name_jp:'太子嘉', faction:'zhao', type:'SR', value:7.8},
    ],
  },
  {
    id:'checkpoint', name:'Checkpoint', jp:'関所', icon:'/icons/terrain/checkpoint.webp', color:'#b98b35',
    typeLabel:'Starting Troop HP Loss',
    description:'Reduces the unit damage effect from Checkpoint terrain.',
    entries:[
      {name:'Shuki', name_jp:'朱鬼', faction:'mountain_folk', type:'SR', value:2.0},
      {name:'Hyou', name_jp:'漂', faction:'qin', type:'R', value:2.4},
      {name:'Bakukoshin', name_jp:'縛虎申', faction:'qin', type:'SR', value:2.7},
      {name:'Gii', name_jp:'魏興', faction:'wei', type:'R', value:4.6},
      {name:'Kyougai', name_jp:'去亥', faction:'qin', type:'SR', value:5.5},
      {name:'Jiou', name_jp:'江彰', faction:'zhao', type:'R', value:5.5},
      {name:'Rankai', name_jp:'ランカイ', faction:'mountain_folk', type:'R', value:6.2},
    ],
  },
]

const BUFF_STATES = ['Qin','Zhao','Wei','Chu','Han','Ai','Mountain Folk']
const STATE_FACTION_ID = {Qin:'qin',Zhao:'zhao',Wei:'wei',Chu:'chu',Han:'han',Ai:'ai','Mountain Folk':'mountain_folk'}
const BUFF_ARMIES = ['Gyokuhou Squad','Hishin Unit','Kanki Army','Karin Army','Ousen Army','Ouki Army','Gakuka Unit','Six Great Generals']
const ARMY_PARENT_STATE = {'Gyokuhou Squad':'qin','Hishin Unit':'qin','Kanki Army':'qin','Karin Army':'chu','Ousen Army':'qin','Ouki Army':'qin','Gakuka Unit':'qin','Six Great Generals':'qin'}
const ARMY_ICON_CHAR = {'Gyokuhou Squad':'Ouhon','Hishin Unit':'Shin','Kanki Army':'Kanki','Karin Army':'Karin','Ousen Army':'Ousen','Ouki Army':'Ouki','Gakuka Unit':'Mouten','Six Great Generals':'Sho'}

const UNIT_ICON_SCALE={Infantry:1.18,Cavalry:1.18,Archer:1,Shield:1}
function UnitCatIcon({cat,size=80}){
  const imgs={'Infantry':'/icons/unit_infantry.webp','Cavalry':'/icons/unit_cavalry.webp','Archer':'/icons/unit_archer.webp','Shield':'/icons/unit_shield.webp'}
  const s=Math.round(size*( UNIT_ICON_SCALE[cat]||1))
  return <img src={imgs[cat]} alt={cat} loading="lazy" decoding="async" style={{width:s,height:s,objectFit:'contain',flexShrink:0}}/>
}

function TerrainIcon({terrain,size=72}){
  if(!terrain) return null
  return <img src={terrain.icon} alt={terrain.name} loading="lazy" decoding="async" style={{width:size,height:size,objectFit:'contain',flexShrink:0}}/>
}

function TerrainEffectIcon({terrain,size=64}){
  if(!terrain) return null
  return <img src={terrain.icon} alt={terrain.name} loading="lazy" decoding="async" style={{width:size,height:size,objectFit:'contain',flexShrink:0}}/>
}

function BuffsPage(){
  const[activeKind,setActiveKind]=useState(null) // 'unit'|'state'|'army'|'terrain'
  const[activeKey,setActiveKey]=useState(null)
  const[activeStat,setActiveStat]=useState('HP')
  const[sceneProgressFilter,setSceneProgressFilter]=useState('all')
  const tracker=useProgressTracker()
  const lookupEntries=(kind,key,stat)=>{
    if(kind==='unit') return (cwBuffsData[key]||{})[stat]||[]
    if(kind==='state') return ((cwTeamBuffs.states||{})[key]||{})[stat]||[]
    if(kind==='army')  return ((cwTeamBuffs.armies||{})[key]||{})[stat]||[]
    return []
  }
  const handlePick=(kind,key)=>{
    if(activeKind===kind&&activeKey===key){setActiveKind(null);setActiveKey(null)}
    else{setActiveKind(kind);setActiveKey(key);setActiveStat('HP')}
  }
  const renderCard=(kind,key,col,iconNode,countLabel)=>{
    const isActive=activeKind===kind&&activeKey===key
    return(
      <button key={kind+':'+key} onClick={()=>handlePick(kind,key)} style={{
        display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',
        padding:'16px 18px 12px',borderRadius:'18px',cursor:'pointer',width:'138px',
        border:`2px solid ${isActive?col:'var(--bdr)'}`,
        background:isActive?`linear-gradient(135deg,${col}18,${col}08)`:'var(--sur)',
        boxShadow:isActive?`0 6px 24px ${col}35`:'0 2px 8px rgba(0,0,0,0.06)',
        transform:isActive?'translateY(-4px) scale(1.03)':'scale(1)',
        transition:'all .2s ease',
      }}>
        <div style={{width:72,height:72,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{iconNode}</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontWeight:800,fontSize:'.88rem',color:isActive?col:'var(--txt)',marginBottom:'4px',lineHeight:'1.15'}}>{key}</div>
          <div style={{fontSize:'.64rem',color:'var(--txt3)',background:'var(--bg2)',padding:'2px 9px',borderRadius:'20px',border:'1px solid var(--bdr)',display:'inline-block'}}>{countLabel}</div>
        </div>
      </button>
    )
  }
  const stateCount=(key)=>new Set(Object.values((cwTeamBuffs.states||{})[key]||{}).flat().map(e=>e.name)).size
  const armyCount=(key)=>new Set(Object.values((cwTeamBuffs.armies||{})[key]||{}).flat().map(e=>e.name)).size
  const StateBadge=({id,size=72})=>{
    const f=FACTIONS.find(x=>x.id===id)
    const c=f?.color||'#888'
    const jp=f?.jp||'?'
    const fs=jp.length>=3?size*.32:jp.length===2?size*.42:size*.5
    return(
      <div style={{width:size,height:size,borderRadius:'50%',background:`linear-gradient(135deg,${c},${c}cc)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:fs+'px',boxShadow:`0 4px 14px ${c}55`,border:`2px solid ${c}`,fontFamily:'serif',lineHeight:'1',letterSpacing:jp.length>=3?'-1px':0}}>{jp}</div>
    )
  }
  const ArmyBadge=({name,size=72})=>{
    const c=CC[ARMY_PARENT_STATE[name]]||'#888'
    const leaderName=ARMY_ICON_CHAR[name]
    const leader=leaderName&&findCharByName(leaderName)
    if(leader)
      return <div style={{width:size,height:size,borderRadius:'50%',overflow:'hidden',border:`2.5px solid ${c}`,background:c+'18',flexShrink:0}}><CharIcon c={leader} size={size} round={true}/></div>
    return(
      <div style={{width:size,height:size,borderRadius:'14px',background:`linear-gradient(135deg,${c}30,${c}10)`,border:`2px solid ${c}`,display:'flex',alignItems:'center',justifyContent:'center',color:c,fontWeight:900,fontSize:size*.28+'px',textAlign:'center',lineHeight:'1.05',padding:'4px'}}>{name.split(' ').map(w=>w[0]).join('')}</div>
    )
  }
  // ── details panel ──
  const renderTerrainDetails=(terrain)=>{
    const entries=[...(terrain.entries||[])].sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name))
    return(
      <div>
        <div style={{
          display:'flex',gap:'14px',alignItems:'center',
          padding:'14px 16px',borderRadius:'14px',marginBottom:'1rem',
          background:`linear-gradient(90deg,${terrain.color}18,${terrain.color}08)`,
          border:`1.5px solid ${terrain.color}44`,
        }}>
          <TerrainIcon terrain={terrain} size={54}/>
          <div style={{minWidth:0}}>
            <div style={{display:'flex',alignItems:'baseline',gap:'8px',flexWrap:'wrap',marginBottom:'4px'}}>
              <div style={{fontWeight:900,fontSize:'1.05rem',color:'var(--txt)'}}>{terrain.name}</div>
              <div style={{fontSize:'.78rem',color:'var(--txt3)'}}>{terrain.jp}</div>
            </div>
            <div style={{fontSize:'.82rem',lineHeight:1.45,color:'var(--txt2)'}}>{terrain.description}</div>
            <div style={{fontSize:'.68rem',color:terrain.color,fontWeight:800,marginTop:'5px',letterSpacing:'.03em',textTransform:'uppercase'}}>{terrain.typeLabel}</div>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {entries.map((e,i)=>{
            const char=findCharByName(e.name)||ALL.find(c=>c.name_jp===e.name_jp)
            const fc=CC[e.faction]||'#888'
            const sourceId=buffSourceId('terrain',terrain.name,'terrain',e,i)
            const owned=tracker.isOwned('buffSources',sourceId)
            const unlockCost=redCrystalBuffUnlockCost(e,'terrain',terrain.name,terrain.typeLabel)
            return(
              <div key={e.name+i} className="buff-source-row" style={{
                display:'flex',alignItems:'center',gap:'14px',padding:'12px 16px',borderRadius:'14px',
                background:owned?'linear-gradient(90deg,rgba(26,138,90,.1),var(--sur))':'var(--sur)',
                border:`1px solid ${owned?'#1a8a5a55':'var(--bdr)'}`,
              }}>
                <div className="buff-source-rank" style={{minWidth:'28px',textAlign:'center',fontSize:'.72rem',fontWeight:800,color:'var(--txt3)'}}>{i+1}</div>
                <div className="buff-source-avatar" style={{width:52,height:52,borderRadius:'50%',overflow:'hidden',flexShrink:0,border:`2.5px solid ${fc}`,background:fc+'22',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {char?.icon?<img src={char.icon} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}} alt={e.name}/>
                  :char?.image?<img src={char.image} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={e.name}/>
                  :<span style={{fontSize:'1.15rem',fontWeight:800,color:fc}}>{e.name[0]}</span>}
                </div>
                <div className="buff-source-info" style={{flex:1,minWidth:0}}>
                  <div className="buff-source-name-line" style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap',marginBottom:'3px'}}>
                    <span style={{fontWeight:800,fontSize:'.92rem',color:'var(--txt)'}}>{e.name}</span>
                    <span style={{fontSize:'.65rem',color:'var(--txt3)'}}>{e.name_jp}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{fontSize:'.62rem',padding:'1px 7px',borderRadius:'4px',background:fc+'22',color:fc,border:`1px solid ${fc}44`,fontWeight:700}}>{e.type}</span>
                    <span style={{fontSize:'.62rem',color:'var(--txt3)'}}>{FACTIONS.find(f=>f.id===e.faction)?.label||e.faction}</span>
                  </div>
                </div>
                <div className="buff-source-actions" style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'12px',flexShrink:0,minWidth:'240px'}}>
                  <BuffValueCluster
                    value={e.value}
                    color={terrain.color}
                    cost={unlockCost}
                    icon="/icons/Red_Crystal.webp"
                    iconLabel="Red Crystal"
                    iconTitle="Red Crystal upgrade"
                    fontSize="1.05rem"
                  />
                  <OwnedToggle
                    owned={owned}
                    onToggle={()=>tracker.toggleOwned('buffSources',sourceId)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  const renderDetails=()=>{
    if(!activeKey) return null
    if(activeKind==='terrain'){
      const terrain=TERRAIN_BUFFS.find(t=>t.name===activeKey)
      return terrain?renderTerrainDetails(terrain):null
    }
    const col = activeKind==='unit'?CAT_COLOR[activeKey]
              : activeKind==='state'?(CC[STATE_FACTION_ID[activeKey]]||'#888')
              : (CC[ARMY_PARENT_STATE[activeKey]]||'#888')
    const entries=lookupEntries(activeKind,activeKey,activeStat)
    const total=entries.reduce((s,e)=>s+(e.value||0)+(e.shard_bonus?5:0),0)
    const sc=BUFF_STAT_COLORS[activeStat]
    return(
      <div>
        <div style={{display:'flex',justifyContent:'center',gap:'10px',marginBottom:'1.5rem'}}>
          {['HP','Attack','Defense'].map(stat=>{
            const isOn=activeStat===stat
            const c=BUFF_STAT_COLORS[stat]
            const ents=lookupEntries(activeKind,activeKey,stat)
            const t=ents.reduce((s,e)=>s+(e.value||0)+(e.shard_bonus?5:0),0)
            return(
              <button key={stat} onClick={()=>setActiveStat(stat)} style={{
                display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',
                padding:'10px 28px',borderRadius:'12px',cursor:'pointer',
                border:`2px solid ${isOn?c:'var(--bdr)'}`,
                background:isOn?c+'15':'var(--sur)',transition:'all .15s',
              }}>
                <span style={{fontWeight:700,fontSize:'.85rem',color:isOn?c:'var(--txt)'}}>{stat}</span>
                <span style={{fontSize:'.7rem',fontWeight:700,color:c}}>+{t.toFixed(1)}%</span>
              </button>
            )
          })}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderRadius:'14px',marginBottom:'1rem',background:`linear-gradient(90deg,${sc}18,${sc}08)`,border:`1.5px solid ${sc}44`}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            {activeKind==='unit'
              ?<UnitCatIcon cat={activeKey} size={36}/>
              :activeKind==='state'
                ?<StateBadge id={STATE_FACTION_ID[activeKey]} size={36}/>
                :<ArmyBadge name={activeKey} size={36}/>}
            <div>
              <div style={{fontWeight:700,fontSize:'.88rem',color:col}}>{activeKey} · {activeStat}</div>
              <div style={{fontSize:'.7rem',color:'var(--txt3)'}}>Total stackable buff from {entries.length} generals</div>
            </div>
          </div>
          <div style={{fontWeight:900,fontSize:'1.5rem',color:sc}}>+{total.toFixed(1)}%</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {entries.length===0&&<div style={{textAlign:'center',padding:'2rem 1rem',color:'var(--txt3)',fontSize:'.85rem'}}>No {activeStat} buff for {activeKey}</div>}
          {entries.map((e,i)=>{
            const char=findCharByName(e.name)
            const fc=CC[e.faction]||'#888'
            const isTop=i<3
            const unlockIcon=e.special_icon|| (e.value===5?'/icons/Shard.webp':'/icons/Red_Crystal.webp')
            const unlockLabel=e.special_label|| (e.value===5?'Shard upgrade':'Red Crystal upgrade')
            const unlockTitle=e.special_label|| (e.value===5?'Unlocked with Shards':'Unlocked with Red Crystals')
            const sourceId=buffSourceId(activeKind,activeKey,activeStat,e,i)
            const shardSourceId=sourceId+':shard'
            const owned=tracker.isOwned('buffSources',sourceId)
            const shardOwned=e.shard_bonus?tracker.isOwned('buffSources',shardSourceId):false
            const fullyOwned=e.shard_bonus?(owned&&shardOwned):owned
            const partOwned=e.shard_bonus?(owned||shardOwned):owned
            const unlockCost=redCrystalBuffUnlockCost(e,activeKind,activeKey,activeStat)
            return(
              <div key={e.name+i} className={`buff-source-row${e.shard_bonus?' buff-source-row-combo':''}`} style={{
                display:'flex',alignItems:'center',gap:'14px',padding:'12px 16px',borderRadius:'14px',
                background:fullyOwned?'linear-gradient(90deg,rgba(26,138,90,.1),var(--sur))':partOwned?'linear-gradient(90deg,rgba(26,138,90,.05),var(--sur))':isTop?`linear-gradient(90deg,${sc}0a,var(--sur))`:'var(--sur)',
                border:`1px solid ${fullyOwned?'#1a8a5a55':partOwned?'#1a8a5a33':isTop?sc+'44':'var(--bdr)'}`,transition:'transform .12s,box-shadow .12s',
              }}
                onMouseEnter={ev=>{ev.currentTarget.style.transform='translateY(-1px)';ev.currentTarget.style.boxShadow=`0 4px 14px ${sc}20`}}
                onMouseLeave={ev=>{ev.currentTarget.style.transform='';ev.currentTarget.style.boxShadow=''}}>
                <div className="buff-source-rank" style={{minWidth:'32px',textAlign:'center'}}>
                  {isTop
                    ?<div style={{width:28,height:28,borderRadius:'50%',background:sc,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'.75rem',margin:'0 auto'}}>{i+1}</div>
                    :<span style={{fontSize:'.7rem',fontWeight:700,color:'var(--txt3)'}}>{i+1}</span>}
                </div>
                <div className="buff-source-avatar" style={{width:56,height:56,borderRadius:'50%',overflow:'hidden',flexShrink:0,border:`2.5px solid ${fc}`,background:fc+'22',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {char?.icon?<img src={char.icon} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}} alt={e.name}/>
                  :char?.image?<img src={char.image} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={e.name}/>
                  :<span style={{fontSize:'1.2rem',fontWeight:700,color:fc}}>{e.name[0]}</span>}
                </div>
                <div className="buff-source-info" style={{flex:1,minWidth:0}}>
                  <div className="buff-source-name-line" style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap',marginBottom:'3px'}}>
                    <span style={{fontWeight:700,fontSize:'.92rem',color:'var(--txt)'}}>{e.name}</span>
                    <span style={{fontSize:'.65rem',color:'var(--txt3)'}}>{e.name_jp}</span>
                    {e.star6&&<span style={{fontSize:'.65rem',color:'#c9902a',fontWeight:800}}>☆6</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{fontSize:'.62rem',padding:'1px 7px',borderRadius:'4px',background:fc+'22',color:fc,border:`1px solid ${fc}44`,fontWeight:700}}>{e.type}</span>
                    <span style={{fontSize:'.62rem',color:'var(--txt3)'}}>{FACTIONS.find(f=>f.id===e.faction)?.label||e.faction}</span>
                  </div>
                </div>
                <div className="buff-source-actions" style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'12px',flexShrink:0,minWidth:e.shard_bonus?'260px':'240px'}}>
                  <BuffValueCluster
                    value={e.value}
                    color={sc}
                    cost={unlockCost}
                    icon={unlockIcon}
                    iconLabel={unlockLabel}
                    iconTitle={unlockTitle}
                    shardBonus={!!e.shard_bonus}
                    shardOwned={shardOwned}
                    mainOwned={owned}
                  />
                  {e.shard_bonus?(
                    <div className="buff-source-own-stack" style={{display:'flex',flexDirection:'column',gap:'4px',alignItems:'stretch'}}>
                      <OwnedToggle
                        owned={shardOwned}
                        onToggle={()=>tracker.toggleOwned('buffSources',shardSourceId)}
                        label="Shard"
                        className="owned-toggle-shard"
                      />
                      <OwnedToggle
                        owned={owned}
                        onToggle={()=>tracker.toggleOwned('buffSources',sourceId)}
                        label="Crystal"
                        className="owned-toggle-crystal"
                      />
                    </div>
                  ):(
                    <OwnedToggle
                      owned={owned}
                      onToggle={()=>tracker.toggleOwned('buffSources',sourceId)}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  const sceneStatMeta={
    hp:{label:'HP',color:BUFF_STAT_COLORS.HP,total:SCENE_CARD.hp,unit:''},
    atk:{label:'Attack',color:BUFF_STAT_COLORS.Attack,total:SCENE_CARD.atk,unit:''},
    def:{label:'Defense',color:BUFF_STAT_COLORS.Defense,total:SCENE_CARD.def,unit:''},
    morale:{label:'Max Morale',color:'#5a8fcb',total:SCENE_CARD.maxMp,unit:''},
    crit_rate:{label:'Critical Rate',color:'#b85b28',total:SCENE_CARD.critRate/100,unit:'%'},
    evasion:{label:'Evasion',color:'#7a65c7',total:SCENE_CARD.dodgeRate/100,unit:'%'},
  }
  const sceneStatOrder=['hp','atk','def','morale','crit_rate','evasion']
  const sceneCardStar=card=>{
    const saved=Number(tracker.progress.sceneBuffStars?.[card.id]||0)
    if(saved>0) return Math.min(6,Math.max(0,Math.round(saved)))
    return tracker.isOwned('sceneBuffCards',card.id)?6:0
  }
  const setSceneCardStar=(card,star)=>{
    const next=Math.min(6,Math.max(0,Number(star)||0))
    tracker.setProgressValue('sceneBuffStars',card.id,next)
    if(tracker.progress.sceneBuffCards?.[card.id]) tracker.setProgressValue('sceneBuffCards',card.id,false)
  }
  const sceneCardValueAt=(card,star=sceneCardStar(card))=>{
    if(star<=0) return 0
    return card.starValues?.[star-1] ?? (star===6?card.value:Math.round((card.value||0)*star/6))
  }
  const sceneValueText=(card,value=sceneCardValueAt(card))=>card.valueMode==='percent'?`+${value.toFixed(1)}%`:`+${value.toLocaleString()}`
  const sceneTotalText=m=>m.unit==='%'?`+${m.total.toFixed(1)}%`:`+${m.total.toLocaleString()}`
  const sceneCardIds=(sceneCardBuffs.cards||[]).map(c=>c.id)
  const sceneOwnedCount=(sceneCardBuffs.cards||[]).filter(c=>sceneCardStar(c)>0).length
  const buffStats=['HP','Attack','Defense']
  const findBuffChar=e=>findCharByName(e.name)||ALL.find(c=>c.name_jp===e.name_jp)
  const buildSourceRows=()=>{
    const rows=[]
    const pushRows=(kind,keys,label)=>{
      keys.forEach(key=>{
        buffStats.forEach(stat=>{
          lookupEntries(kind,key,stat).forEach((e,i)=>{
            const char=findBuffChar(e)
            rows.push({
              bucket:'buffSources',
              id:buffSourceId(kind,key,stat,e,i),
              group:label,
              category:key,
              stat,
              source:e.name,
              jp:e.name_jp,
              value:e.shard_bonus?`+5.0% + +${(e.value||0).toFixed(1)}%`:`+${(e.value||0).toFixed(1)}%`,
              unlock:e.shard_bonus?'Shard + Red Crystal':e.special_label||((e.value||0)===5?'Shard':'Red Crystal'),
              icon:char?.icon||char?.image,
            })
          })
        })
      })
    }
    pushRows('unit',BUFF_UNIT_CATS,'Unit Types')
    pushRows('state',BUFF_STATES,'States')
    pushRows('army',BUFF_ARMIES,'Special Units')
    TERRAIN_BUFFS.forEach(terrain=>{
      const entries=[...(terrain.entries||[])].sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name))
      entries.forEach((e,i)=>{
        const char=findBuffChar(e)
        rows.push({
          bucket:'buffSources',
          id:buffSourceId('terrain',terrain.name,'terrain',e,i),
          group:'Terrain',
          category:terrain.name,
          stat:terrain.typeLabel,
          source:e.name,
          jp:e.name_jp,
          value:`+${(e.value||0).toFixed(1)}%`,
          unlock:'Red Crystal',
          icon:char?.icon||char?.image,
        })
      })
    })
    ;(sceneCardBuffs.cards||[]).forEach(card=>{
      const m=sceneStatMeta[card.stat]
      rows.push({
        bucket:'sceneBuffStars',
        id:card.id,
        group:'Scene Cards',
        category:m?.label||card.stat,
        stat:m?.label||card.stat,
        source:card.ownerName,
        jp:card.name_jp,
        value:sceneValueText(card),
        unlock:'Scene Card',
        icon:card.ownerIcon,
      })
    })
    return rows
  }
  const progressRows=buildSourceRows()
  const ownedBuffValue=(kind,key,stat)=>lookupEntries(kind,key,stat).reduce((sum,e,i)=>{
    const id=buffSourceId(kind,key,stat,e,i)
    let v=0
    if(tracker.isOwned('buffSources',id)) v+=(e.value||0)
    if(e.shard_bonus&&tracker.isOwned('buffSources',id+':shard')) v+=5
    return sum+v
  },0)
  const maxBuffValue=(kind,key,stat)=>lookupEntries(kind,key,stat).reduce((sum,e)=>sum+(e.value||0)+(e.shard_bonus?5:0),0)
  const buffSummarySections=[
    {label:'Unit Types',rows:BUFF_UNIT_CATS.map(key=>({key,kind:'unit',color:CAT_COLOR[key]}))},
    {label:'States',rows:BUFF_STATES.map(key=>({key,kind:'state',color:CC[STATE_FACTION_ID[key]]||'#888'}))},
    {label:'Special Units',rows:BUFF_ARMIES.map(key=>({key,kind:'army',color:CC[ARMY_PARENT_STATE[key]]||'#888'}))},
  ]
  const sceneOwnedByStat=stat=>(sceneCardBuffs.cards||[]).filter(c=>c.stat===stat).reduce((sum,c)=>sum+sceneCardValueAt(c),0)
  const sceneStatProgress=stat=>{
    const cards=(sceneCardBuffs.cards||[]).filter(c=>c.stat===stat)
    const owned=cards.filter(c=>sceneCardStar(c)>0).length
    return `${owned}/${cards.length}`
  }
  const isProgressRowOwned=r=>r.bucket==='sceneBuffStars'?sceneCardStar({id:r.id})>0:tracker.isOwned(r.bucket,r.id)
  const allOwnedCount=progressRows.reduce((n,r)=>n+(isProgressRowOwned(r)?1:0),0)
  const statProgressCell=(kind,key,stat)=>(
    <span className="buff-summary-stat" title={`Max ${stat}: ${maxBuffValue(kind,key,stat).toFixed(1)}%`}>
      <b>{stat}</b>
      <span>+{ownedBuffValue(kind,key,stat).toFixed(1)}%</span>
    </span>
  )
  const renderBuffProgressSection=()=>(
    <section className="buff-progress-panel">
      <div className="buff-progress-head">
        <div>
          <h3>Owned Buff Totals</h3>
          <p>{allOwnedCount}/{progressRows.length} sources marked owned.</p>
        </div>
        <ProgressTools tracker={tracker}/>
      </div>
      <details className="buff-progress-details">
        <summary>
          <span>Show totals by category</span>
          <span>by category - click to expand</span>
        </summary>
        <div className="buff-summary-list">
          {buffSummarySections.map(section=>(
            <div key={section.label} className="buff-summary-section">
              <h4>{section.label}</h4>
              <div className="buff-summary-rows">
                {section.rows.map(row=>(
                  <button key={`${row.kind}:${row.key}`} type="button" className="buff-summary-row" onClick={()=>handlePick(row.kind,row.key)}>
                    <span className="buff-summary-name" style={{'--sc':row.color}}>{row.key}</span>
                    <span className="buff-summary-stats">
                      {buffStats.map(stat=><span key={stat}>{statProgressCell(row.kind,row.key,stat)}</span>)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="buff-summary-section">
            <h4>Scene Cards</h4>
            <div className="buff-summary-rows">
              <div className="buff-summary-row">
                <span className="buff-summary-name" style={{'--sc':'#1a8a5a'}}>Scene Card Buffs</span>
                <span className="buff-summary-stats">
                  {sceneStatOrder.map(stat=>{
                    const meta=sceneStatMeta[stat]
                    const val=sceneOwnedByStat(stat)
                    const text=meta.unit==='%'?`+${val.toFixed(1)}%`:`+${val.toLocaleString()}`
                    return(
                      <span key={stat} className="buff-summary-stat">
                        <b>{meta.label}</b>
                        <span>{text}</span>
                      </span>
                    )
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </details>
    </section>
  )
  const renderSceneCardsSection=()=>(
    <div style={{marginBottom:'2rem',display:'flex',flexDirection:'column',gap:'10px'}}>
        <div className="progress-section-bar">
          <span>{sceneOwnedCount}/{sceneCardIds.length} scene-card buffs owned</span>
          <div className="progress-filter-group" aria-label="Scene-card buff ownership filter">
            {progressFilterItems.map(item=>(
              <button key={item.id} type="button" className={sceneProgressFilter===item.id?'active':''} onClick={()=>setSceneProgressFilter(item.id)}>{item.label}</button>
            ))}
          </div>
        </div>
        {sceneStatOrder.map(stat=>{
          const m=sceneStatMeta[stat]
          const cards=(sceneCardBuffs.cards||[]).filter(c=>c.stat===stat)
          const visibleCards=cards.filter(card=>{
            const owned=sceneCardStar(card)>0
            return sceneProgressFilter==='all'||(sceneProgressFilter==='owned'?owned:!owned)
          })
          const ownedCount=cards.filter(c=>sceneCardStar(c)>0).length
          return(
            <details key={stat} style={{
              border:`1px solid ${m.color}44`,borderRadius:'8px',background:'var(--sur)',overflow:'hidden',
              boxShadow:'0 2px 10px rgba(0,0,0,.05)',
            }}>
              <summary style={{
                cursor:'pointer',listStyle:'revert',padding:'12px 14px',
                background:`linear-gradient(135deg,${m.color}18,var(--sur))`,
              }}>
                <span style={{display:'inline-flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'.86rem',fontWeight:900,color:m.color}}>{m.label}</span>
                  <span style={{fontSize:'.95rem',fontWeight:900,color:'var(--txt)'}}>{sceneTotalText(m)}</span>
                  <span style={{fontSize:'.66rem',color:'var(--txt3)',padding:'2px 8px',borderRadius:'999px',background:'var(--bg2)',border:'1px solid var(--bdr)'}}>{ownedCount}/{cards.length} owned</span>
                </span>
              </summary>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,116px)',justifyContent:'center',gap:'12px',padding:'12px'}}>
                {visibleCards.map((card,i)=>(
                  (()=>{const star=sceneCardStar(card);return(
                  <div key={card.id} style={{
                    border:'1px solid var(--bdr)',borderRadius:'8px',overflow:'hidden',
                    background:star>0?'linear-gradient(180deg,rgba(26,138,90,.1),var(--sur))':'var(--sur)',
                    boxShadow:'0 2px 10px rgba(0,0,0,.06)',
                    }}>
                    <div style={{position:'relative',aspectRatio:'1 / 1',background:'var(--bg2)',overflow:'hidden'}}>
                      <img src={card.thumb||card.image} alt={card.name_en} title={card.name_en} loading="eager" decoding="async" fetchPriority={i<4?'high':'auto'} style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>
                      <div style={{
                        position:'absolute',left:7,bottom:7,padding:'3px 7px',borderRadius:'6px',
                        background:'rgba(0,0,0,.66)',color:'#fff',fontSize:'.68rem',fontWeight:900,
                      }}>{sceneValueText(card)}</div>
                    </div>
                    <div style={{minHeight:68,padding:'5px 7px 7px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'5px'}}>
                      <SceneStarControl star={star} onChange={next=>setSceneCardStar(card,next)}/>
                      <img src={card.ownerIcon} alt={card.ownerName} title={card.ownerName} loading="lazy" decoding="async" style={{
                        width:30,height:30,borderRadius:'50%',objectFit:'cover',objectPosition:'center top',
                        border:`2px solid ${m.color}`,background:m.color+'18',
                      }}/>
                    </div>
                  </div>
                  )})()
                ))}
                {visibleCards.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',fontSize:'.78rem',color:'var(--txt3)',padding:'1rem'}}>No cards in this filter.</div>}
              </div>
            </details>
          )
        })}
    </div>
  )
  const SectionLabel=({children})=>(
    <div style={{display:'flex',alignItems:'center',gap:'10px',margin:'0 0 1rem'}}>
      <div style={{flex:1,height:1,background:'var(--bdr)'}}/>
      <span style={{fontSize:'.72rem',fontWeight:800,color:'var(--txt3)',letterSpacing:'.08em',textTransform:'uppercase'}}>{children}</span>
      <div style={{flex:1,height:1,background:'var(--bdr)'}}/>
    </div>
  )
  return(
    <div style={{maxWidth:'960px',margin:'0 auto',padding:'0 1rem'}}>
      <div style={{textAlign:'center',marginBottom:'1.5rem',paddingTop:'1rem'}}>
        <h2 style={{fontSize:'1.5rem',fontWeight:800,color:'var(--txt)',marginBottom:'.3rem'}}>CW Buffs</h2>
        <p style={{fontSize:'.82rem',color:'var(--txt3)',maxWidth:'620px',margin:'0 auto'}}>Passive buffs that stay active for the whole Castle War, even when the general isn't on the field. You unlock them by upgrading characters — Red Crystals raise the skill-level buffs, Shards grant the flat +5%.</p>
        <div style={{display:'flex',justifyContent:'center',gap:'18px',marginTop:'.6rem',fontSize:'.7rem',color:'var(--txt3)'}}>
          <span style={{display:'inline-flex',alignItems:'center',gap:'5px'}}><img src="/icons/Red_Crystal.webp" alt="" style={{width:15,height:15,objectFit:'contain'}}/>Red Crystal upgrade</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:'5px'}}><img src="/icons/Shard.webp" alt="" style={{width:15,height:15,objectFit:'contain'}}/>Shard upgrade (+5%)</span>
        </div>
      </div>

      {renderBuffProgressSection()}

      <SectionLabel>Unit Types</SectionLabel>
      <div style={{display:'flex',justifyContent:'center',gap:'14px',marginBottom:'2rem',flexWrap:'wrap'}}>
        {BUFF_UNIT_CATS.map(cat=>{
          const uniqueNames=new Set(Object.values(cwBuffsData[cat]||{}).flat().map(e=>e.name))
          return renderCard('unit',cat,CAT_COLOR[cat],<UnitCatIcon cat={cat} size={64}/>,`${uniqueNames.size} generals`)
        })}
      </div>

      <SectionLabel>States</SectionLabel>
      <div style={{display:'flex',justifyContent:'center',gap:'12px',marginBottom:'2rem',flexWrap:'wrap'}}>
        {BUFF_STATES.map(s=>{
          const col=CC[STATE_FACTION_ID[s]]||'#888'
          const n=stateCount(s)
          return renderCard('state',s,col,<StateBadge id={STATE_FACTION_ID[s]}/>,`${n} ${n===1?'general':'generals'}`)
        })}
      </div>

      <SectionLabel>Special Units</SectionLabel>
      <div style={{display:'flex',justifyContent:'center',gap:'12px',marginBottom:'2rem',flexWrap:'wrap'}}>
        {BUFF_ARMIES.map(a=>{
          const col=CC[ARMY_PARENT_STATE[a]]||'#888'
          const n=armyCount(a)
          return renderCard('army',a,col,<ArmyBadge name={a}/>,`${n} ${n===1?'general':'generals'}`)
        })}
      </div>

      <SectionLabel>Terrain</SectionLabel>
      <div style={{display:'flex',justifyContent:'center',gap:'12px',marginBottom:'2rem',flexWrap:'wrap'}}>
        {TERRAIN_BUFFS.map(t=>renderCard('terrain',t.name,t.color,<TerrainIcon terrain={t}/>,`${t.entries.length} generals`))}
      </div>

      <SectionLabel>Scene Cards</SectionLabel>
      <p style={{fontSize:'.78rem',color:'var(--txt3)',textAlign:'center',margin:'-.35rem auto 1rem',maxWidth:'520px'}}>
        Scene card buffs apply to all characters.
      </p>
      {renderSceneCardsSection()}

      <div style={{textAlign:'center',padding:'2.5rem 1rem',color:'var(--txt3)'}}>
        <div style={{fontSize:'2rem',opacity:.15,marginBottom:'.6rem'}}>⚔</div>
        <div style={{fontSize:'.85rem'}}>Tap any category above to see its CW buffs</div>
      </div>
      {activeKey&&(
        <div className="overlay" onClick={()=>{setActiveKind(null);setActiveKey(null)}}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:'var(--sur)',borderRadius:'18px',width:'min(720px,94vw)',maxHeight:'88vh',
            display:'flex',flexDirection:'column',overflow:'hidden',
            boxShadow:'0 24px 70px rgba(0,0,0,.35)',border:'1px solid var(--bdr)'
          }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid var(--bdr)',background:'var(--bg2)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                {activeKind==='unit'
                  ?<UnitCatIcon cat={activeKey} size={32}/>
                  :activeKind==='state'
                    ?<StateBadge id={STATE_FACTION_ID[activeKey]} size={32}/>
                    :activeKind==='terrain'
                      ?<TerrainIcon terrain={TERRAIN_BUFFS.find(t=>t.name===activeKey)} size={34}/>
                      :<ArmyBadge name={activeKey} size={32}/>}
                <div>
                  <div style={{fontWeight:800,fontSize:'.95rem',color:'var(--txt)'}}>{activeKey}</div>
                  <div style={{fontSize:'.66rem',color:'var(--txt3)',textTransform:'uppercase',letterSpacing:'.05em'}}>{activeKind==='unit'?'Unit Type':activeKind==='state'?'State':activeKind==='terrain'?'Terrain':'Special Unit'}</div>
                </div>
              </div>
              <button className="x-btn" onClick={()=>{setActiveKind(null);setActiveKey(null)}}>✕</button>
            </div>
            <div style={{padding:'18px',overflowY:'auto'}}>
              {renderDetails()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ── TIER LIST ─────────────────────────────────────────────────────────────────
const TIER_DEFS={
  S:{color:'#c0392b',def:'Top-tier armies — tech plays, require all CW6★ cards'},
  A:{color:'#e07f48',def:'Strong armies — can handle S Tier, need at least 1 CW6★ card'},
  B:{color:'#cc972d',def:'Solid but niche / expensive — struggle at Gold vs above'},
  C:{color:'#3d6eb5',def:'Struggle in S5+ / need more data to confirm viability'},
}

function TierPage(){
  return(
    <div className="tier-page-wrap">
      <div className="tier-page-header">
        <h2 className="tier-main-title">⚔ CW Metawatch</h2>
        <p className="tier-main-sub">Commonly Seen Armies · Last updated: Apr 2026</p>
        <p style={{fontSize:'.75rem',color:'var(--txt3)',marginTop:'.25rem'}}>Tier List done by <strong style={{color:'var(--txt2)'}}>Doge</strong></p>
      </div>
      <div className="tier-list">
        {['S','A','B','C'].map(tier=>{
          const {color,def}=TIER_DEFS[tier]
          const teams=TIER_TEAMS.filter(t=>t.tier===tier)
          return(
            <div key={tier} className="tier-section">
              <div className="tier-section-head">
                <div className="tier-big-badge" style={{background:color}}>{tier}</div>
                <div className="tier-section-info">
                  <div className="tier-section-label" style={{color}}>Tier {tier}</div>
                  <div className="tier-section-def">{def}</div>
                </div>
              </div>
              <div className="tier-teams-grid">
                {teams.map((team,ti)=>{
                  const chars=team.members.map(findCharByName).filter(Boolean)
                  return(
                    <div key={ti} className="tier-team-card" style={{borderLeftColor:color}}>
                      <div className="tier-team-name">{team.name}</div>
                      <div className="tier-team-members">
                        {chars.map((c,ci)=>{
                          const hasStar6=(c.skills||[]).some(s=>s.star6)
                          return(
                            <div key={ci} className="tier-member">
                              <div className="tier-member-img-wrap">
                                <CharIcon c={c} size={52} round={true} className="tier-member-img"/>
                                {hasStar6&&<span className="tier-s6">☆6</span>}
                              </div>
                              <span className="tier-member-name">{c.name_en}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <p className="tier-source">Source: Gold fights, X, YouTube and Community insights · Benchmark: Army Synergy, Unique Skills, Unit Stats and Training Cost</p>
    </div>
  )
}

// ── TEAM COST PAGE ────────────────────────────────────────────────────────────
function TeamCostPage(){
  const[slots,setSlots]=useState([null,null,null,null])
  const[skillsDone,setSkillsDone]=useState([0,0,0,0])
  const[picker,setPicker]=useState(null)
  const[search,setSearch]=useState('')

  const COST=RED_CRYSTAL_TOTAL_COST
  const SKILL_COSTS=RED_CRYSTAL_SKILL_COSTS
  const RCOL={R:'#3d9970',SR:'#3d6eb5',UR:'#c0392b'}
  const RBG={R:'#3d997018',SR:'#3d6eb518',UR:'#c0392b18'}

  const remainingCost=(rarity,done)=>SKILL_COSTS[rarity||'SR'].slice(done).reduce((s,v)=>s+v,0)

  const allChars=ALL.map(c=>{
    const rd=RARITY_DATA[c.name_en]
    return{...c,rarity:rd?.rarity||c.rarity||'SR'}
  }).filter(c=>RARITY_DATA[c.name_en]||c.image)

  const filtered=allChars.filter(c=>
    !search||(c.name_en.toLowerCase().includes(search.toLowerCase())||c.name_jp.includes(search))
  ).sort((a,b)=>a.name_en.localeCompare(b.name_en))

  const setSlot=(idx,char)=>{
    setSlots(p=>{const n=[...p];n[idx]=char;return n})
    setSkillsDone(p=>{const n=[...p];n[idx]=0;return n})
    setPicker(null);setSearch('')
  }
  const clearSlot=(idx)=>{
    setSlots(p=>{const n=[...p];n[idx]=null;return n})
    setSkillsDone(p=>{const n=[...p];n[idx]=0;return n})
  }
  const clearAll=()=>{setSlots([null,null,null,null]);setSkillsDone([0,0,0,0])}
  const toggleSkill=(idx,n)=>setSkillsDone(p=>{const ns=[...p];ns[idx]=ns[idx]>=n?n-1:n;return ns})

  const filled=slots.filter(Boolean)
  const total=slots.reduce((s,c,idx)=>{if(!c)return s;const r=RARITY_DATA[c.name_en]?.rarity||'SR';return s+remainingCost(r,skillsDone[idx])},0)
  const urCount=filled.filter(c=>RARITY_DATA[c.name_en]?.rarity==='UR').length
  const srCount=filled.filter(c=>RARITY_DATA[c.name_en]?.rarity==='SR').length
  const rCount=filled.filter(c=>RARITY_DATA[c.name_en]?.rarity==='R').length

  return(
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'1rem 1rem 3rem'}}>

      {/* Header */}
      <div style={{textAlign:'center',marginBottom:'2.5rem'}}>
        <h2 style={{fontSize:'1.6rem',fontWeight:900,color:'var(--txt)',marginBottom:'.3rem',letterSpacing:'-.5px'}}>Team Cost Calculator</h2>
        <p style={{fontSize:'.82rem',color:'var(--txt3)'}}>Select up to 4 generals to calculate total Red Crystal cost</p>
      </div>

      {/* Crystal total banner */}
      <div className="tc-banner" style={{
        padding:'20px 28px',borderRadius:'20px',marginBottom:'2rem',
        background:'linear-gradient(135deg,#1a0a2e,#2d1255)',
        border:'1.5px solid #6a30c8',
        boxShadow:'0 8px 32px rgba(106,48,200,0.25)',
      }}>
        <div className="tc-banner-left">
          <img src="/icons/Red_Crystal.webp" alt="Red Crystal" style={{width:56,height:56,objectFit:"contain",flexShrink:0}}/>
          <div className="tc-banner-total">
            <div style={{fontSize:'.72rem',color:'#b89fe0',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px'}}>Red Crystals Needed</div>
            <div className="tc-total-num">{total.toLocaleString()}</div>
          </div>
        </div>
        <div className="tc-banner-right">
          {urCount>0&&<div style={{textAlign:'center',padding:'8px 16px',borderRadius:'12px',background:'#c0392b22',border:'1px solid #c0392b55'}}>
            <div style={{fontWeight:800,fontSize:'1.1rem',color:'#e05555'}}>{urCount}</div>
            <div style={{fontSize:'.62rem',color:'#e05555aa',fontWeight:600}}>UR</div>
          </div>}
          {srCount>0&&<div style={{textAlign:'center',padding:'8px 16px',borderRadius:'12px',background:'#3d6eb522',border:'1px solid #3d6eb555'}}>
            <div style={{fontWeight:800,fontSize:'1.1rem',color:'#6a9ee0'}}>{srCount}</div>
            <div style={{fontSize:'.62rem',color:'#6a9ee0aa',fontWeight:600}}>SR</div>
          </div>}
          {rCount>0&&<div style={{textAlign:'center',padding:'8px 16px',borderRadius:'12px',background:'#3d997022',border:'1px solid #3d997055'}}>
            <div style={{fontWeight:800,fontSize:'1.1rem',color:'#5dc090'}}>{rCount}</div>
            <div style={{fontSize:'.62rem',color:'#5dc090aa',fontWeight:600}}>R</div>
          </div>}
          {filled.length===0&&<div style={{fontSize:'.78rem',color:'#b89fe0',opacity:.6}}>No generals selected</div>}
        </div>
        {filled.length>0&&<button onClick={clearAll} style={{padding:'6px 16px',borderRadius:'8px',border:'1px solid #6a30c855',background:'transparent',color:'#b89fe0',fontSize:'.72rem',cursor:'pointer'}}>Clear All</button>}
      </div>

      {/* 4 Slots */}
      <div className="tc-slots">
        {slots.map((char,idx)=>{
          const rarity=char?RARITY_DATA[char.name_en]?.rarity||'SR':null
          const fc=char?(CC[char.country]||'#888'):null
          const rc=rarity?RCOL[rarity]:'#888'
          const done=skillsDone[idx]
          const remaining=char?remainingCost(rarity,done):null
          const isMaxed=char&&remaining===0
          return char?(
            <div key={idx} style={{
              borderRadius:'16px',overflow:'hidden',
              border:`2px solid ${rc}55`,
              background:`linear-gradient(160deg,${rc}0d,var(--sur))`,
              boxShadow:`0 3px 16px ${rc}18`,
              display:'flex',flexDirection:'column',
              transition:'transform .15s',
            }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e=>e.currentTarget.style.transform=''}>
              {/* Portrait */}
              <div style={{position:'relative',aspectRatio:'1 / 1',background:fc+'15',overflow:'hidden'}}>
                {char.icon?<img src={char.icon} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} alt={char.name_en}/>
                :char.image?<img src={char.image} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={char.name_en}/>
                :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',fontWeight:800,color:fc+'66'}}>{char.name_en[0]}</div>}
                <div style={{position:'absolute',top:'6px',left:'6px',padding:'1px 7px',borderRadius:'5px',background:rc,color:'white',fontSize:'.6rem',fontWeight:800}}>{rarity}</div>
                <button onClick={()=>clearSlot(idx)} style={{position:'absolute',top:'5px',right:'5px',width:20,height:20,borderRadius:'50%',border:'none',background:'rgba(0,0,0,0.55)',color:'white',cursor:'pointer',fontSize:'.6rem',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              </div>
              {/* Info */}
              <div style={{padding:'8px 10px',display:'flex',flexDirection:'column',gap:'7px',flex:1}}>
                <div>
                  <div style={{fontWeight:800,fontSize:'.82rem',color:'var(--txt)',lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{char.name_en}</div>
                  <div style={{fontSize:'.6rem',color:'var(--txt3)',marginTop:'1px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{FACTIONS.find(f=>f.id===char.country)?.label||char.country}</div>
                </div>
                {/* Skill toggles */}
                <div style={{display:'flex',gap:'4px'}}>
                  {[1,2,3].map(n=>{
                    const active=done>=n
                    return(
                      <button key={n} onClick={e=>{e.stopPropagation();toggleSkill(idx,n)}} style={{
                        flex:1,padding:'5px 0',borderRadius:'6px',
                        border:`1.5px solid ${active?rc:rc+'44'}`,
                        background:active?rc:'transparent',
                        color:active?'white':rc+'88',
                        fontSize:'.75rem',fontWeight:800,cursor:'pointer',
                        transition:'all .12s',
                      }}>{n}</button>
                    )
                  })}
                </div>
                {/* Cost row */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto'}}>
                  {isMaxed?(
                    <span style={{fontSize:'.72rem',fontWeight:800,color:'#3d9970'}}>✓ Maxed</span>
                  ):(
                    <div style={{display:'flex',alignItems:'center',gap:'3px'}}>
                      <img src="/icons/Red_Crystal.webp" alt="RC" style={{width:14,height:14,objectFit:'contain'}}/>
                      <span style={{fontWeight:900,fontSize:'.88rem',color:rc}}>{remaining?.toLocaleString()}</span>
                    </div>
                  )}
                  <button onClick={()=>{setPicker(idx);setSearch('')}} style={{padding:'3px 8px',borderRadius:'6px',border:`1px solid ${rc}44`,background:'transparent',color:rc,fontSize:'.62rem',cursor:'pointer',fontWeight:700}}>↺</button>
                </div>
              </div>
            </div>
          ):(
            <button key={idx} onClick={()=>{setPicker(idx);setSearch('')}} style={{
              borderRadius:'18px',border:'2px dashed var(--bdr)',
              background:'var(--sur)',minHeight:'120px',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'8px',
              cursor:'pointer',transition:'all .15s',color:'var(--txt3)',
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#6a30c8';e.currentTarget.style.background='#6a30c808'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bdr)';e.currentTarget.style.background='var(--sur)'}}>
              <div style={{fontSize:'2rem',opacity:.3}}>＋</div>
              <div style={{fontSize:'.8rem',fontWeight:700}}>Slot {idx+1}</div>
              <div style={{fontSize:'.68rem',opacity:.6}}>Click to add general</div>
            </button>
          )
        })}
      </div>

      {/* Rarity reference */}
      <div style={{display:'flex',justifyContent:'center',gap:'8px',marginBottom:'2rem',flexWrap:'wrap'}}>
        {(['R','SR','UR']).map(r=>{
          const[s1,s2,s3]=SKILL_COSTS[r]
          const rc2=RCOL[r]
          return(
            <div key={r} style={{borderRadius:'12px',background:RBG[r],border:`1px solid ${rc2}44`,overflow:'hidden',minWidth:'180px'}}>
              <div style={{padding:'5px 12px',background:rc2+'22',borderBottom:`1px solid ${rc2}33`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontWeight:800,fontSize:'.82rem',color:rc2}}>{r}</span>
                <span style={{fontSize:'.68rem',color:rc2,fontWeight:700,display:'flex',alignItems:'center',gap:'3px'}}>
                  <img src="/icons/Red_Crystal.webp" alt="RC" style={{width:12,height:12,objectFit:'contain'}}/>{COST[r].toLocaleString()} total
                </span>
              </div>
              <div style={{padding:'6px 12px',display:'flex',gap:'10px',fontSize:'.68rem',color:'var(--txt3)'}}>
                {[[1,s1],[2,s2],[3,s3]].map(([n,v])=>(
                  <span key={n} style={{display:'flex',alignItems:'center',gap:'2px'}}>
                    <span style={{fontWeight:700,color:rc2}}>{['①','②','③'][n-1]}</span>
                    <img src="/icons/Red_Crystal.webp" alt="RC" style={{width:11,height:11,objectFit:'contain'}}/>{v}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Picker modal */}
      {picker!==null&&(
        <div className="overlay" onClick={()=>{setPicker(null);setSearch('')}}>
          <div className="picker" onClick={e=>e.stopPropagation()} style={{maxWidth:'560px',maxHeight:'80vh'}}>
            <div className="picker-head">
              <span>Select General — Slot {picker+1}</span>
              <button className="x-btn" onClick={()=>{setPicker(null);setSearch('')}}>✕</button>
            </div>
            <div className="picker-filters">
              <input autoFocus className="picker-search" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div style={{overflowY:'auto',maxHeight:'55vh',padding:'8px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:'8px'}}>
                {filtered.map(c=>{
                  const rarity=RARITY_DATA[c.name_en]?.rarity||'SR'
                  const rc=RCOL[rarity]
                  const isSelected=slots.some(s=>s?.id===c.id)
                  return(
                    <button key={c.id} disabled={isSelected} onClick={()=>setSlot(picker,c)} style={{
                      borderRadius:'12px',border:`1.5px solid ${isSelected?'var(--bdr)':rc+'55'}`,
                      background:isSelected?'var(--bg2)':rc+'0a',
                      padding:'8px',display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',
                      cursor:isSelected?'not-allowed':'pointer',opacity:isSelected?.5:1,
                      transition:'all .12s',
                    }}
                      onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background=rc+'18'}}
                      onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background=rc+'0a'}}>
                      <div style={{width:52,height:52,borderRadius:'50%',overflow:'hidden',border:`2px solid ${rc}55`,background:rc+'18',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {c.icon?<img src={c.icon} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={c.name_en}/>
                        :c.image?<img src={c.image} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={c.name_en}/>
                        :<span style={{fontWeight:700,color:rc,fontSize:'1.1rem'}}>{c.name_en[0]}</span>}
                      </div>
                      <div style={{fontWeight:700,fontSize:'.68rem',color:'var(--txt)',textAlign:'center',lineHeight:1.2}}>{c.name_en}</div>
                      <div style={{padding:'1px 7px',borderRadius:'5px',background:rc,color:'white',fontSize:'.6rem',fontWeight:800}}>{rarity}</div>
                      <div style={{fontSize:'.62rem',color:rc,fontWeight:700}}><img src="/icons/Red_Crystal.webp" alt="RC" style={{width:14,height:14,objectFit:"contain",verticalAlign:"middle",marginRight:2}}/>{COST[rarity]}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── CW GUIDE ──────────────────────────────────────────────────────────────────
const GUIDE_SECTIONS=[
  {id:'basics',       label:'Basics',              category:'Beginner'},
  {id:'stats-screen', label:'CW Stats Screen',     category:'Beginner'},
  {id:'roles',        label:'Roles',               category:'Beginner'},
  {id:'bandits',      label:'Bandit Hunt',         category:'Beginner'},
  {id:'matchups',     label:'Unit Matchups',       category:'Beginner'},
  {id:'types',        label:'Skill Types',         category:'Beginner'},
  {id:'stats',        label:'How To Raise CW Stats',category:'Beginner'},
  {id:'debuffs',      label:'Debuff Resist',       category:'Advanced'},
  {id:'effects',      label:'Status Effects',      category:'Advanced'},
  {id:'terrain',      label:'Terrain Effects',     category:'Advanced'},
  {id:'interactions', label:'Effect Interactions', category:'Advanced'},
  {id:'targeting',    label:'Targeting Rules',     category:'Advanced'},
]
const GUIDE_GROUPS=['Beginner','Advanced']

function GuideCard({title,children,accent='var(--terra)'}) {
  return (
    <div style={{
      borderRadius:'12px',background:'var(--sur)',border:'1px solid var(--bdr)',
      borderTop:`4px solid ${accent}`,padding:'1rem',boxShadow:'0 2px 8px rgba(6,38,76,.05)',
    }}>
      <h3 style={{fontSize:'.96rem',fontWeight:900,color:'var(--txt)',margin:'0 0 .5rem'}}>{title}</h3>
      <div style={{fontSize:'.82rem',lineHeight:1.58,color:'var(--txt2)'}}>{children}</div>
    </div>
  )
}

function GuideList({items}) {
  return (
    <ul style={{margin:'.25rem 0 0 1.05rem',padding:0}}>
      {items.map((item,i)=><li key={i} style={{marginBottom:'.32rem'}}>{item}</li>)}
    </ul>
  )
}

function GuideFormula({formula,children}) {
  return (
    <div style={{
      marginTop:'.7rem',padding:'.8rem .9rem',borderRadius:'10px',
      background:'var(--bg2)',border:'1px solid var(--bdr)',fontSize:'.8rem',
    }}>
      <div style={{fontFamily:'monospace',fontWeight:900,color:'var(--navy)',marginBottom:'.45rem'}}>{formula}</div>
      <div style={{color:'var(--txt3)',lineHeight:1.55}}>{children}</div>
    </div>
  )
}

function GuideMarkedImage({src,alt,markers,aspectRatio}) {
  return (
    <div style={{
      position:'relative',maxWidth:'920px',margin:'0 auto 1rem',borderRadius:'12px',
      overflow:'hidden',background:'var(--bg2)',border:'1px solid var(--bdr)',
      boxShadow:'0 3px 14px rgba(6,38,76,.08)',
    }}>
      <img src={src} alt={alt} loading="lazy" decoding="async" style={{
        display:'block',width:'100%',aspectRatio,objectFit:'contain',background:'var(--bg2)',
      }}/>
      {markers.map(marker=>(
        <div key={marker.id} title={marker.title} style={{
          position:'absolute',left:`${marker.x}%`,top:`${marker.y}%`,transform:'translate(-50%,-50%)',
          width:marker.size||18,height:marker.size||18,borderRadius:'999px',display:'flex',alignItems:'center',justifyContent:'center',
          background:marker.ring?'rgba(229,57,53,.08)':marker.color||'var(--terra)',
          color:marker.ring?'#e53935':'#fff',
          border:marker.ring?'4px solid #e53935':'2px solid #fff',
          boxShadow:marker.ring?'0 0 0 3px rgba(255,255,255,.85),0 2px 10px rgba(0,0,0,.4)':'0 2px 8px rgba(0,0,0,.35)',
          fontSize:marker.ring?'0':'.56rem',fontWeight:900,
        }}>
          {marker.label ?? marker.id}
        </div>
      ))}
    </div>
  )
}

const FAQ_IMAGES={
  basics:[
    {src:'/guide/basics-map-en.webp',label:'Castle War map overview'},
    {src:'/guide/basics-flow-en.webp',label:'Castle War flow screen'},
  ],
  roles:[
    {src:'/guide/roles-selection.webp',label:'Role selection screen'},
    {src:'/guide/roles-button.webp',label:'Role button on battle map'},
    {src:'/guide/roles-effect.webp',label:'Role effect view'},
  ],
  bandits:[
    {src:'/guide/bandit-button.webp',label:'Bandit Hunt button'},
    {src:'/guide/bandit-start.webp',label:'Bandit Hunt start screen'},
    {src:'/guide/bandit-team.webp',label:'Bandit Hunt team setup'},
    {src:'/guide/bandit-results.webp',label:'Bandit Hunt results'},
  ],
}

function GuideImages({images}) {
  return (
    <div style={{margin:'0 auto 1.25rem',maxWidth:'900px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'10px',alignItems:'start'}}>
        {images.map(img=>(
          <a key={img.src} href={img.src} target="_blank" rel="noopener noreferrer" style={{
            display:'block',borderRadius:'10px',overflow:'hidden',background:'var(--sur)',
            border:'1px solid var(--bdr)',boxShadow:'0 2px 8px rgba(6,38,76,.06)',textDecoration:'none',
          }}>
            <div style={{aspectRatio:'16 / 10',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
              <img src={img.src} alt={img.label} loading="lazy" decoding="async" style={{display:'block',width:'100%',height:'100%',objectFit:'contain'}}/>
            </div>
            <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--txt2)',padding:'.45rem .55rem',lineHeight:1.3}}>{img.label}</div>
          </a>
        ))}
      </div>
    </div>
  )
}

function CastleWarBasicsSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        Castle War is alliance territory combat. The goal is not only to win single fights, but to choose the right castles, place defenses, and spend limited actions well.
      </p>
      <GuideImages images={FAQ_IMAGES.basics}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'12px'}}>
        <GuideCard title="Core Loop" accent="var(--terra)">
          <GuideList items={[
            'A group contains 7 alliances fighting over castles.',
            'Your alliance declares which castles to attack, then members place attacking or defending teams.',
            'Defenders protect owned castles. Attackers try to break declared targets during invasion time.',
            'Winning the map is a team planning problem, not only a character power check.',
          ]}/>
        </GuideCard>
        <GuideCard title="Daily Timing" accent="var(--gold)">
          <GuideList items={[
            'Garrison placement is available from declaration start until invasion ends.',
            'Attack reservations can be placed before invasion time, then start automatically when invasion opens.',
            'Direct invasion placement happens during the invasion window.',
            'Participation status and role planning should be handled before the active window if possible.',
          ]}/>
        </GuideCard>
        <GuideCard title="Actions and Sorties" accent="#3d6eb5">
          <GuideList items={[
            'Each general used in a team consumes action count or sortie resources depending on the activity.',
            'A 4-general team is usually more expensive than a partial team, but is much safer in real fights.',
            'Sortie resources recover daily, and some recovery options cost jewels.',
            'Do not spend strong teams early unless the castle or timing is worth it.',
          ]}/>
        </GuideCard>
      </div>
      <GuideFormula formula="Simple priority: defend key castles -> attack declared targets -> spend leftovers efficiently">
        If a player is new, the best first step is to understand where the alliance needs bodies before trying to optimize every individual matchup.
      </GuideFormula>
    </div>
  )
}

const CW_STATS_SCREEN_MARKERS=[
  {id:'1',title:'HP',x:5.4,y:30.4,color:'#d8472f',body:'Maximum HP for Castle War.'},
  {id:'2',title:'Morale',x:5.4,y:35.9,color:'#1a9f75',body:'Maximum Morale. Morale skills draw from this cap.'},
  {id:'3',title:'Max Attack',x:5.4,y:41.4,color:'#c0392b',body:'The upper attack value used when damage is calculated.'},
  {id:'4',title:'Min Attack',x:5.4,y:47.0,color:'#c0392b',body:'The lower attack value used when damage is calculated.'},
  {id:'5',title:'Type Advantage Damage',x:5.4,y:52.6,color:'#a85bb6',body:'Bonus special attack effect when the unit has the favorable matchup.'},
  {id:'6',title:'Type Disadvantage Damage',x:5.4,y:58.1,color:'#8b6fbd',body:'Special attack effect shown for unfavorable matchups.'},
  {id:'7',title:'Hit Rate',x:5.4,y:63.8,color:'#a65a7a',body:'Helps attacks connect instead of missing.'},
  {id:'8',title:'Critical Rate',x:5.4,y:69.6,color:'#7a65c7',body:'Chance for an attack to become a critical hit.'},
  {id:'9',title:'Critical Damage',x:5.4,y:75.3,color:'#9a6b1c',body:'Bonus damage applied when a critical hit happens.'},
  {id:'10',title:'Defense Penetration',x:5.4,y:80.9,color:'#5869a8',body:'Helps bypass part of the enemy Defense. It is not the same thing as Attack.'},
  {id:'11',title:'Defense',x:5.4,y:86.6,color:'#2471a3',body:'Reduces incoming damage.'},
  {id:'12',title:'Evasion (Dodge chance)',x:5.4,y:92.2,color:'#1a8a72',body:'Chance to dodge incoming attacks.'},
]

function CWStatsScreenGuideSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        The CW Stats screen shows a character's Castle War-specific stats. These values are separate from the normal character detail stats and are used for Castle War.
      </p>
      <GuideCard title="How To Open It" accent="var(--terra)">
        <p style={{margin:'0 0 .8rem'}}>
          Open a character page, then tap the castle icon on the right side of the screen.
        </p>
        <GuideMarkedImage src="/guide/cw-stats-access.webp" alt="Character page showing the Castle War stats icon" markers={[]} aspectRatio="2014 / 1218"/>
      </GuideCard>
      <div style={{height:'12px'}}/>
      <GuideMarkedImage src="/guide/cw-stats-screen.webp" alt="Castle War stats screen with numbered stat rows" markers={CW_STATS_SCREEN_MARKERS} aspectRatio="1855 / 1194"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:'12px'}}>
        {CW_STATS_SCREEN_MARKERS.map(stat=>(
          <GuideCard key={stat.id} title={`${stat.id}. ${stat.title}`} accent={stat.color}>
            {stat.body}
          </GuideCard>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px',marginTop:'12px'}}>
        <GuideCard title="Screen Notes" accent="var(--gold)">
          <GuideList items={[
            'Green values in parentheses show the bonus portion currently added to that stat or effect.',
            'Max Attack and Min Attack both matter because damage can roll between them.',
            <>Type advantage follows unit matchups. Check the <Link to="/guide/matchups" style={{fontWeight:900,color:'var(--terra)',textDecoration:'underline',textUnderlineOffset:'3px'}}>Unit Matchups</Link> guide for the matchup chart.</>,
          ]}/>
        </GuideCard>
        <GuideCard title="Related Pages" accent="#3d6eb5">
          <div>
            Use <Link to="/guide/stats" style={{fontWeight:900,color:'var(--terra)',textDecoration:'underline',textUnderlineOffset:'3px'}}>How To Raise CW Stats</Link> for progression sources, and <Link to="/buffs" style={{fontWeight:900,color:'var(--terra)',textDecoration:'underline',textUnderlineOffset:'3px'}}>Buffs</Link> for Castle War buff references.
          </div>
        </GuideCard>
      </div>
    </div>
  )
}

function CWStatsGuideSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        CW stats are affected by several progression systems besides the{' '}
        (<Link to="/buffs" style={{fontWeight:900,color:'var(--terra)',textDecoration:'underline',textUnderlineOffset:'3px'}}>Buffs</Link>) page. Buffs are an important layer, but the final number also depends on the character, troops, weapons, and small scene-card bonuses.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px'}}>
        <GuideCard title="What Affects CW Stats" accent="#3d6eb5">
          <GuideList items={[
            'Character level. Level 85 is the maximum.',
            'Character star progress. Maxing the first page gives the maximum stat buff; maxing the second page does not add more CW stat gain.',
            'LG level.',
            'Troop level.',
            'Weapon level and weapon rarity.',
            'Character scene cards, which provide a small stat boost for min-maxers.',
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

function RolesGuideSection(){
  const roles=[
    {name:'Assault Captain',trigger:'When invading',effect:'Raises attack for your own generals.',accent:'#c0392b'},
    {name:'Defense Captain',trigger:'When garrisoning',effect:'Raises defense for your own generals.',accent:'#2471a3'},
    {name:'Support Captain',trigger:'When invading or garrisoning',effect:'Raises morale cap for your own generals.',accent:'#8e44ad'},
    {name:'Bandit Hunt Captain',trigger:'When doing Bandit Hunt',effect:'Raises attack and defense for your own generals.',accent:'#1a8a72'},
  ]
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        Roles are personal Castle War assignments. They only buff the player who set the role, so choose the role that matches what you are actually going to do that day.
      </p>
      <GuideImages images={FAQ_IMAGES.roles}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'12px',marginBottom:'1rem'}}>
        {roles.map(r=>(
          <GuideCard key={r.name} title={r.name} accent={r.accent}>
            <div style={{fontSize:'.74rem',fontWeight:900,color:r.accent,marginBottom:'.35rem'}}>{r.trigger}</div>
            <div>{r.effect}</div>
          </GuideCard>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px'}}>
        <GuideCard title="Cost Rules" accent="var(--gold)">
          <GuideList items={[
            'Two roles are free and two roles cost jewels each day.',
            'The free/paid role combination changes daily and is shared across alliances.',
            'The first day starts with all roles free.',
            'Changing away from a paid role does not refund the jewels.',
          ]}/>
        </GuideCard>
        <GuideCard title="Lock Timing" accent="var(--terra)">
          <GuideList items={[
            'You can change role freely before invasion time starts.',
            'If you forgot to set a role, you can still set one during invasion time.',
            'After invasion time starts, an already selected role cannot be changed.',
            'Free role availability updates at 8:00 each day.',
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

function BanditHuntGuideSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        Bandit Hunt is a Castle War side objective where the alliance fights NPC bandit teams for ranking rewards. It competes with castle attacks for your limited actions.
      </p>
      <GuideImages images={FAQ_IMAGES.bandits}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'12px'}}>
        <GuideCard title="What It Is" accent="#1a8a72">
          <GuideList items={[
            'Available during Normal Castle War invasion time.',
            'The alliance competes on total Bandit Hunt count across the season.',
            'It can give alliance ranking rewards and personal ranking points.',
            'Selected War weapons cannot be used for Bandit Hunt.',
          ]}/>
        </GuideCard>
        <GuideCard title="How It Runs" accent="var(--terra)">
          <GuideList items={[
            'Choose the Bandit Hunt option, select a team, then start the run.',
            'The team keeps fighting in sequence while it wins.',
            'If multiple players start hunts, they queue in order.',
            'A team that is fighting or queued cannot be used for invasion or garrison until it returns.',
          ]}/>
        </GuideCard>
        <GuideCard title="When To Use It" accent="var(--gold)">
          <GuideList items={[
            'Use it when the alliance wants Bandit ranking or has spare action resources.',
            'Avoid locking important generals if a castle fight still needs them.',
            'The Bandit Hunt Captain role is best for players assigned to this job.',
            'If invasion time ends mid-run, only the completed chain up to that point counts.',
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

function DebuffResistanceGuideSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        Debuff resistance reduces certain negative effects before they apply. This matters a lot when judging whether attack down, defense down, or defense penetration actually lands.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px'}}>
        <GuideCard title="What Resistance Covers" accent="#8e44ad">
          <GuideList items={[
            'Attack Down Resistance reduces attack lowering effects.',
            'Defense Down Resistance reduces defense lowering effects.',
            'Defense Penetration Resistance reduces defense penetration effects.',
            'It works against both Combat skills and Strategy skills.',
          ]}/>
        </GuideCard>
        <GuideCard title="Important Notes" accent="var(--terra)">
          <GuideList items={[
            'Defense penetration is treated like a debuff for this resistance calculation.',
            'If resistance is higher than the debuff, the final debuff becomes 0%.',
            'Attack down effects still apply to critical attacks.',
            'Multiple debuffs are added together before resistance is subtracted.',
          ]}/>
        </GuideCard>
      </div>
      <GuideFormula formula="Final debuff % = max(0, total debuff % - total resistance %)">
        Example 1: 40% Attack Down against 50% Attack Down Resistance becomes 0%.
        <br/>
        Example 2: 40% Attack Down + 30% Attack Down against 50% resistance becomes 20%.
      </GuideFormula>
    </div>
  )
}

function TerrainEffectsSection(){
  const priorityText='Slope > Forest > River > Swamp > Checkpoint > Ambush > No terrain'
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        Terrain effects are Castle War map debuffs attached to invasion routes between castles. They can lower your damage, make you take more damage, or make your unit start the fight with less HP.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px',marginBottom:'1rem'}}>
        {TERRAIN_EFFECTS.map(t=>(
          <div key={t.id} style={{
            display:'flex',gap:'13px',alignItems:'center',padding:'14px 15px',borderRadius:'14px',
            background:`linear-gradient(135deg,${t.color}12,var(--sur))`,
            border:`1.5px solid ${t.color}36`,boxShadow:'0 2px 10px rgba(0,0,0,.04)',
          }}>
            <div style={{width:66,height:66,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <TerrainEffectIcon terrain={t} size={62}/>
            </div>
            <div style={{minWidth:0}}>
              <div style={{display:'flex',alignItems:'baseline',gap:'7px',flexWrap:'wrap',marginBottom:'4px'}}>
                <span style={{fontWeight:900,fontSize:'.95rem',color:'var(--txt)'}}>{t.name}</span>
                <span style={{fontSize:'.7rem',color:'var(--txt3)'}}>{t.jp}</span>
                <span style={{fontSize:'.68rem',fontWeight:900,color:t.color,background:t.color+'18',border:`1px solid ${t.color}40`,borderRadius:'999px',padding:'2px 8px'}}>{t.effect}</span>
              </div>
              <div style={{fontSize:'.78rem',lineHeight:1.42,color:'var(--txt2)',marginBottom:'5px'}}>{t.detail}</div>
              <div style={{fontSize:'.68rem',lineHeight:1.35,color:'var(--txt3)'}}>{t.mitigatedBy}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        padding:'13px 15px',borderRadius:'14px',
        background:'var(--bg2)',border:'1px solid var(--bdr)',fontSize:'.76rem',
        lineHeight:1.6,color:'var(--txt3)',
      }}>
        When multiple routes can reach the same castle, the game prefers a route with no terrain debuff. If every route has a debuff, it picks the route with the smallest remaining penalty after your terrain-resistance buffs are applied. If the remaining penalty is tied, the route priority is <strong style={{color:'var(--txt2)'}}>{priorityText}</strong>. Terrain placements can change each Castle War event.
      </div>
    </div>
  )
}

function CWGuidePage(){
  const navigate=useNavigate()
  const {section}=useParams()
  const active=GUIDE_SECTIONS.find(s=>s.id===section)?.id || 'basics'
  const go=id=>navigate(`/guide/${id}`)
  return(
    <div style={{maxWidth:'960px',width:'100%',margin:'0 auto',padding:'0 1rem',boxSizing:'border-box'}}>
      <div style={{textAlign:'center',marginBottom:'1.5rem',paddingTop:'1rem'}}>
        <h2 style={{fontSize:'1.5rem',fontWeight:800,color:'var(--txt)',marginBottom:'.3rem'}}>CW Guide</h2>
        <p style={{fontSize:'.82rem',color:'var(--txt3)'}}>Tips, mechanics, and reference info for Castle Wars</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.75rem'}}>
        {GUIDE_GROUPS.map(group=>(
          <div key={group}>
            <div style={{fontSize:'.68rem',fontWeight:900,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--txt3)',textAlign:'center',marginBottom:'.45rem'}}>
              {group}
            </div>
            <div style={{display:'flex',justifyContent:'center',gap:'8px',flexWrap:'wrap'}}>
              {GUIDE_SECTIONS.filter(s=>s.category===group).map(s=>{
                const on=active===s.id
                return(
                  <button key={s.id} onClick={()=>go(s.id)} style={{
                    padding:'.55rem 1.1rem',borderRadius:'999px',cursor:'pointer',
                    fontSize:'.85rem',fontWeight:on?700:500,
                    background:on?'var(--txt)':'var(--sur)',
                    color:on?'var(--bg2)':'var(--txt2)',
                    border:`1px solid ${on?'var(--txt)':'var(--bdr)'}`,
                    transition:'all .15s ease',
                  }}>{s.label}</button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {active==='basics' && <CastleWarBasicsSection/>}
      {active==='stats-screen' && <CWStatsScreenGuideSection/>}
      {active==='stats' && <CWStatsGuideSection/>}
      {active==='roles' && <RolesGuideSection/>}
      {active==='bandits' && <BanditHuntGuideSection/>}
      {active==='debuffs' && <DebuffResistanceGuideSection/>}
      {active==='effects' && <StatusEffectsSection/>}
      {active==='matchups' && <UnitMatchupsSection/>}
      {active==='terrain' && <TerrainEffectsSection/>}
      {active==='types' && <SkillTypesSection/>}
      {active==='interactions' && <EffectInteractionsSection/>}
      {active==='targeting' && <TargetingRulesSection/>}
    </div>
  )
}


const EFFECT_INTERACTIONS=[
  {
    type:'overwrite',
    label:'Overwrite Each Other',
    note:'Only the most recently applied effect stays active. Applying one removes the other.',
    groups:[
      {
        effects:[
          {name_en:'Provoke',       icon:'/icons/status/provoke.webp'},
          {name_en:'Less Likely to be Targeted', icon:'/icons/status/less_targeted.webp'},
        ],
      },
      {
        effects:[
          {name_en:'Confusion', icon:'/icons/status/confusion.webp'},
          {name_en:'Betrayal',  icon:'/icons/status/betrayal.webp'},
          {name_en:'Rampage',   icon:'/icons/status/berserk.webp'},
        ],
      },
    ],
  },
  {
    type:'stack',
    label:'Stack with Priority Order',
    note:'Both can be active at the same time. Attack Nullification triggers first and reduces damage to 0 — but both effects still consume a charge.',
    groups:[
      {
        effects:[
          {name_en:'Attack Nullification', icon:'/icons/status/nullify.webp'},
          {name_en:'Guard',                icon:'/icons/status/guard.webp'},
        ],
      },
    ],
  },
  {
    type:'guard_overwrite',
    label:'Guard Overwrites by Judgment Value',
    note:'Applying Guard to a character who already has Guard active does not always overwrite it. The system compares a judgment value for each: Reduction % × Remaining Charges. The higher value wins. If the new effect loses, the existing Guard is kept unchanged.',
    formula:'Judgment Value = Reduction % × Remaining Charges',
    example:'30% × 2 charges = 60  vs  70% × 1 charge = 70  →  70% overwrites',
    groups:[
      {
        effects:[
          {name_en:'Guard', icon:'/icons/status/guard.webp'},
        ],
      },
    ],
  },
]

function EffectInteractionsSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        When two effects conflict, this determines which one takes precedence or whether both remain active.
      </p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        {EFFECT_INTERACTIONS.map(rule=>{
          const isOverwrite=rule.type==='overwrite'
          const isGuard=rule.type==='guard_overwrite'
          const accent=isOverwrite?'#e67e22':isGuard?'#8e44ad':'#2980b9'
          return(
            <div key={rule.type} style={{
              borderRadius:'12px',background:'var(--sur)',
              border:'1px solid var(--bdr)',borderLeft:`3px solid ${accent}`,
              padding:'1rem',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.35rem'}}>
                <span style={{
                  fontSize:'.7rem',fontWeight:700,letterSpacing:'.04em',textTransform:'uppercase',
                  color:accent,background:`${accent}22`,padding:'.15rem .55rem',borderRadius:'999px',
                }}>{rule.label}</span>
              </div>
              <p style={{fontSize:'.8rem',color:'var(--txt2)',margin:'0 0 .75rem',lineHeight:1.5}}>{rule.note}</p>
              {rule.formula &&(
                <div style={{
                  display:'flex',flexDirection:'column',gap:'.4rem',
                  padding:'.65rem .85rem',borderRadius:'8px',background:'var(--bg2)',
                  marginBottom:'.75rem',
                }}>
                  <div style={{fontSize:'.78rem',fontWeight:700,color:accent,fontFamily:'monospace'}}>{rule.formula}</div>
                  <div style={{fontSize:'.75rem',color:'var(--txt3)'}}>{rule.example}</div>
                </div>
              )}
              <div style={{display:'flex',flexDirection:'column',gap:'.6rem'}}>
                {rule.groups.map((g,gi)=>(
                  <div key={gi} style={{
                    display:'flex',alignItems:'center',flexWrap:'wrap',gap:'.5rem',
                    padding:'.6rem .75rem',borderRadius:'8px',background:'var(--bg2)',
                  }}>
                    {g.effects.map((e,ei)=>(
                      <span key={e.name_en} style={{display:'flex',alignItems:'center',gap:'.35rem'}}>
                        <img src={e.icon} alt={e.name_en} style={{width:26,height:26,flexShrink:0,imageRendering:'auto'}}/>
                        <span style={{fontSize:'.82rem',fontWeight:600,color:'var(--txt)'}}>{e.name_en}</span>
                        {ei<g.effects.length-1 &&
                          <span style={{fontSize:'.75rem',color:'var(--txt3)',margin:'0 .1rem'}}>
                            {isOverwrite?'↔':'→'}
                          </span>
                        }
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const TARGETING_RULES=[
  {
    title:'Skill Target Selection Priority',
    body:'When a target has a special status effect, target selection follows this order:',
    list:[
      <>Status effect presence (e.g. <span style={{display:'inline-flex',alignItems:'center',gap:'.2rem',whiteSpace:'nowrap'}}><img src="/icons/status/provoke.webp" alt="Provoke" style={{width:18,height:18}}/><b>Provocation</b></span>, <span style={{display:'inline-flex',alignItems:'center',gap:'.2rem',whiteSpace:'nowrap'}}><img src="/icons/status/confusion.webp" alt="Confusion" style={{width:18,height:18}}/><b>Confusion</b></span>)</>,
      <>The skill's specified priority (e.g. highest attack, lowest defense)</>,
    ],
  },
  {
    title:'Unmet Target Conditions',
    body:'If a skill specifies a target that does not exist on the field (e.g. "enemy Qin general" when no Qin general is present), the effect simply fails to activate.',
  },
  {
    title:'Random Targeting',
    body:'Skills that target a "random enemy general" pick randomly with no restrictions, and ignore Provocation.',
  },
  {
    title:'Provocation',
    icon:'/icons/status/provoke.webp',
    bullets:[
      'Concentrates incoming enemy damage attacks on the provoked unit.',
      'Does not affect targeting of non-damage skills.',
      'Does not stack — reapplying overwrites the existing state.',
    ],
  },
  {
    title:'Confusion',
    icon:'/icons/status/confusion.webp',
    bullets:[
      'The affected unit attacks both allies and enemies indiscriminately.',
      'Uses skills if available, otherwise normal attacks.',
      'If no allies remain alive, attacks enemies normally.',
      'Does not stack — reapplying refreshes to the longer duration.',
      'Cannot be applied to units already under Betrayal or Rampage (those take priority); however, Betrayal or Rampage applied to a Confused unit overwrites Confusion.',
    ],
  },
]

function TargetingRulesSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        How skills choose their targets, and how status effects influence targeting.
      </p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        {TARGETING_RULES.map((r,i)=>(
          <div key={i} style={{
            borderRadius:'12px',background:'var(--sur)',
            border:'1px solid var(--bdr)',borderLeft:'3px solid #2980b9',
            padding:'1rem',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.4rem'}}>
              {r.icon && <img src={r.icon} alt={r.title} style={{width:24,height:24}}/>}
              <h3 style={{fontSize:'.95rem',fontWeight:800,color:'var(--txt)',margin:0}}>{r.title}</h3>
            </div>
            {r.body && <p style={{fontSize:'.82rem',color:'var(--txt2)',margin:'0 0 .5rem',lineHeight:1.5}}>{r.body}</p>}
            {r.list &&(
              <ol style={{margin:'.25rem 0 0 1.1rem',padding:0,fontSize:'.82rem',color:'var(--txt2)',lineHeight:1.6}}>
                {r.list.map((item,j)=><li key={j} style={{marginBottom:'.2rem'}}>{item}</li>)}
              </ol>
            )}
            {r.bullets &&(
              <ul style={{margin:'.25rem 0 0 1.1rem',padding:0,fontSize:'.82rem',color:'var(--txt2)',lineHeight:1.6}}>
                {r.bullets.map((b,j)=><li key={j} style={{marginBottom:'.2rem'}}>{b}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function EffectCard({entry,accent}){
  return(
    <div style={{
      display:'flex',gap:'.75rem',alignItems:'flex-start',
      padding:'.75rem',borderRadius:'12px',
      background:'var(--sur)',border:'1px solid var(--bdr)',
      borderLeft:`3px solid ${accent}`,
    }}>
      <img src={entry.icon} alt="" style={{width:36,height:36,flexShrink:0,imageRendering:'auto'}}/>
      <div style={{minWidth:0,flex:1}}>
        <div style={{display:'flex',alignItems:'baseline',gap:'.5rem',flexWrap:'wrap',marginBottom:'.2rem'}}>
          <div style={{fontWeight:700,fontSize:'.92rem',color:'var(--txt)'}}>{entry.name_en}</div>
          <div style={{fontSize:'.72rem',color:'var(--txt3)'}}>{entry.name_jp}</div>
        </div>
        <div style={{fontSize:'.78rem',color:'var(--txt2)',lineHeight:1.45}}>{entry.description}</div>
      </div>
    </div>
  )
}

function StatusEffectsSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        Buffs and debuffs that can be applied during Castle Wars battles.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'1.25rem'}}>
        <div>
          <h3 style={{fontSize:'1rem',fontWeight:800,color:'#27ae60',marginBottom:'.75rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#27ae60'}}/>
            Buffs ({statusEffects.buffs.length})
          </h3>
          <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
            {statusEffects.buffs.map(e=><EffectCard key={e.name_en} entry={e} accent="#27ae60"/>)}
          </div>
        </div>
        <div>
          <h3 style={{fontSize:'1rem',fontWeight:800,color:'#c0392b',marginBottom:'.75rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#c0392b'}}/>
            Debuffs ({statusEffects.debuffs.length})
          </h3>
          <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
            {statusEffects.debuffs.map(e=><EffectCard key={e.name_en} entry={e} accent="#c0392b"/>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function UnitMatchupsSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        Damage between unit types follows a rock-paper-scissors relationship.
      </p>
      <div style={{textAlign:'center',marginBottom:'1.75rem'}}>
        <img src={unitMatchups.chart_image} alt="Unit matchup chart" loading="lazy" decoding="async" style={{display:'block',margin:'0 auto',maxWidth:'min(100%,520px)',height:'auto',boxSizing:'border-box'}}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'.75rem',marginBottom:'1.5rem'}}>
        {unitMatchups.rules.map((r,i)=>(
          <div key={i} style={{
            padding:'.75rem',borderRadius:'12px',
            background:'var(--sur)',border:'1px solid var(--bdr)',
            display:'flex',alignItems:'center',justifyContent:'center',gap:'.5rem',
          }}>
            <img src={r.icon_strong} alt={r.strong} loading="lazy" decoding="async" style={{width:32,height:32,objectFit:'contain',flexShrink:0}}/>
            <span style={{fontWeight:700,fontSize:'.85rem',color:'var(--txt)'}}>{r.strong}</span>
            <span style={{fontSize:'.75rem',color:'#27ae60',fontWeight:700,margin:'0 .25rem'}}>strong vs</span>
            <img src={r.icon_weak} alt={r.weak} loading="lazy" decoding="async" style={{width:32,height:32,objectFit:'contain',flexShrink:0,opacity:.6}}/>
            <span style={{fontSize:'.85rem',color:'var(--txt2)'}}>{r.weak}</span>
          </div>
        ))}
      </div>
      <div style={{
        padding:'.85rem 1rem',borderRadius:'12px',
        background:'var(--sur)',border:'1px solid var(--bdr)',
        display:'flex',alignItems:'center',gap:'.6rem',justifyContent:'center',flexWrap:'wrap',
      }}>
        <img src={unitMatchups.mutual.icon_left} alt="Infantry" loading="lazy" decoding="async" style={{width:32,height:32,objectFit:'contain',flexShrink:0}}/>
        <span style={{fontWeight:700,fontSize:'.85rem',color:'var(--txt)'}}>{unitMatchups.mutual.left}</span>
        <span style={{fontSize:'.85rem',color:'var(--txt3)'}}>↔</span>
        <span style={{fontWeight:700,fontSize:'.85rem',color:'var(--txt)'}}>{unitMatchups.mutual.right}</span>
        <span style={{fontSize:'.78rem',color:'var(--txt2)',width:'100%',textAlign:'center',marginTop:'.25rem'}}>{unitMatchups.mutual.note}</span>
      </div>
    </div>
  )
}

function SkillTypesSection(){
  const types=[
    {jp:'戦技', data:skillTypesGlossary['戦技']},
    {jp:'軍略', data:skillTypesGlossary['軍略']},
    {jp:'内政', data:skillTypesGlossary['内政']},
  ]
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        Every general's skill belongs to one of three categories.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'1rem'}}>
        {types.map(t=>(
          <div key={t.jp} style={{
            padding:'1rem',borderRadius:'12px',
            background:'var(--sur)',border:'1px solid var(--bdr)',
            borderTop:`4px solid ${t.data.color}`,
          }}>
            <div style={{display:'flex',alignItems:'baseline',gap:'.5rem',marginBottom:'.5rem'}}>
              <div style={{fontWeight:800,fontSize:'1.05rem',color:t.data.color}}>{t.data.en}</div>
              <div style={{fontSize:'.78rem',color:'var(--txt3)'}}>{t.jp}</div>
            </div>
            <div style={{fontSize:'.82rem',color:'var(--txt2)',lineHeight:1.5}}>{t.data.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
