import { useState, useRef, useEffect } from 'react'
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

const ALL = [
  ...mountainFolk,...qin,...qinBatch2,...qinMajor,
  ...zhao,...zhaoBatch2,...zhaoMajor,...otherStates,
  ...chu,...chuMajor,...wei,...yan,...qi,
  ...aiYanMajor,...misc,...misc2,
].filter(c=>c.country!=='unknown')

const GROUPS={
  'Gyokuhou':           ['ouhon','kanjo','shotaku','kyukou'],
  'Six Great Generals': ['hakuki','ouki','mou','shimasaku','kosho','ohkotsu'],
  'Wei Fire Dragon':    ['ranbishaku','tairoji','reiou','gokei','gaimo','gofuumei','shihaku'],
  'Renpa Forces':       ['renpa','rinka','genho','kyouen','kaishi_renmei'],
  'Kanmei Forces':      ['kanmei','baiman','gomosho','jino','kyobou'],
  'Karin Forces':       ['karin','kaen','gotoku','bamyuu','kouyoku','hakurei'],
  'Ouki Forces':        ['ouki','tou'],
  'Hi Shin Unit':       ['shin','naki','romin','garo','gakurai'],
  'Kanki Forces':       ['kanki','naki','romin','zenou','raido','ogiko','maron','kokuou','bain','kakuun'],
  'Kisui Forces':       ['kisei','batei','ryuto','seikou','kishou'],
  'Kisei Forces':       ['kisei','batei','ryuto','seikou','kishou'],
  'Ousen Forces':       ['akou','denrimi','kanjo','shotaku','kyukou'],
  'Coalition Forces':   ['karin','kanmei','riboku','houken','seika','rinbujun','gofuumei','mangoku'],
}
const UNIT_TYPES={
  // Cavalry
  akou:'Cavalry',bajio:'Cavalry',bakan:'Cavalry',bakukoshin:'Cavalry',bananci:'Cavalry',
  batei:'Cavalry',baiman:'Cavalry',chouko:'Cavalry',choso:'Cavalry',danto:'Cavalry',
  denyu:'Cavalry',dokin:'Cavalry',douken:'Cavalry',denti:'Cavalry',gaimo:'Cavalry',
  gakuei:'Cavalry',rakki:'Cavalry',gakurai:'Cavalry',garo:'Cavalry',gekishin:'Cavalry',
  hamui:'Cavalry',hanoki:'Cavalry',hyou:'Cavalry',hyoshiga:'Cavalry',hyoukou:'Cavalry',
  kaen:'Cavalry',kaine:'Cavalry',kaishi_renmei:'Cavalry',kanjo:'Cavalry',kanki:'Cavalry',
  kanmei:'Cavalry',kanou:'Cavalry',katari:'Cavalry',kisei:'Cavalry',kitari:'Cavalry',
  kouyoku:'Cavalry',mou:'Cavalry',kyobou:'Cavalry',kyoukai:'Cavalry',mangoku:'Cavalry',
  moubu:'Cavalry',muten:'Cavalry',naki:'Cavalry',nako:'Cavalry',ordo:'Cavalry',
  ouhon:'Cavalry',ouki:'Cavalry',qingxiang:'Cavalry',renpa:'Cavalry',rikusen:'Cavalry',
  rinbo:'Cavalry',rinbujun:'Cavalry',ringyoku:'Cavalry',rinka:'Cavalry',shin:'Cavalry',
  shinseicho:'Cavalry',shihaku:'Cavalry',shoou:'Cavalry',shouheikun:'Cavalry',shomou:'Cavalry',
  shunsuiki:'Cavalry',sosui:'Cavalry',tou:'Cavalry',juutekkoo:'Cavalry',yotanwa:'Cavalry',
  rokuomi:'Cavalry',
  // Archer
  amon:'Archer',budai:'Archer',denrimi:'Archer',domon:'Archer',seikou:'Archer',
  fuji:'Archer',rakujo:'Archer',genho:'Archer',gii:'Archer',gika:'Archer',
  gofuumei:'Archer',gotoku:'Archer',hakukisei:'Archer',hakurei:'Archer',hakusui:'Archer',
  hanryuki:'Archer',hoki:'Archer',hyouki:'Archer',jino:'Archer',kosho2:'Archer',
  kaioku:'Archer',karyoten:'Archer',keisha:'Archer',kesshi:'Archer',ko:'Archer',
  korgen:'Archer',kosho:'Archer',kyouen:'Archer',kyokai:'Archer',maki:'Archer',
  ogiko:'Archer',otaji:'Archer',taiko:'Archer',ramaoji:'Archer',reiou:'Archer',
  rishi:'Archer',romin:'Archer',roen:'Archer',rokin:'Archer',ryofui:'Archer',
  saizatsu:'Archer',seika:'Archer',seikyo:'Archer',seki:'Archer',shimasaku:'Archer',
  shika2:'Archer',shishi:'Archer',shoumounkun:'Archer',sougen:'Archer',takukei:'Archer',
  todji:'Archer',yo:'Archer',yukii:'Archer',kokuou:'Archer',
  // Infantry
  bain:'Infantry',bamyuu:'Infantry',obira:'Infantry',chutetsu:'Infantry',encho:'Infantry',
  fuchi:'Infantry',gotan:'Infantry',hairou:'Infantry',hokaku:'Infantry',houken:'Infantry',
  jokan:'Infantry',taishi_ka:'Infantry',kakukai:'Infantry',kei:'Infantry',kyomei:'Infantry',
  keirei:'Infantry',kyoushou:'Infantry',kyukou:'Infantry',linhtama:'Infantry',maron:'Infantry',
  muta:'Infantry',ohkotsu:'Infantry',pamu:'Infantry',rankai:'Infantry',rui:'Infantry',
  ryusen:'Infantry',ryuto:'Infantry',ryuyu:'Infantry',saji:'Infantry',shikika:'Infantry',
  shosa:'Infantry',shotaku:'Infantry',shuki:'Infantry',shunmen:'Infantry',shunpeikun:'Infantry',
  suirou:'Infantry',toumi:'Infantry',youka:'Infantry',yuri:'Infantry',yuren:'Infantry',
  zenou:'Infantry',
  // Shield
  banyou:'Shield',bikou:'Shield',chouin:'Shield',choto:'Shield',denei:'Shield',
  ei_sei:'Shield',gokei:'Shield',gomosho:'Shield',hakuki:'Shield',heki:'Shield',
  junso:'Shield',kakubi:'Shield',kakuun:'Shield',karin:'Shield',keiminoo:'Shield',
  kinmo:'Shield',kishou:'Shield',kousonryu:'Shield',koretsuo:'Shield',muten_grandpa:'Shield',
  miyamoto:'Shield',mougo:'Shield',mouki:'Shield',oukenwang:'Shield',ousen:'Shield',
  raido:'Shield',ranbishaku:'Shield',riboku:'Shield',rien:'Shield',rihaku2:'Shield',
  raoai:'Shield',ryukoku:'Shield',shoukaku:'Shield',shunshinkun:'Shield',taijifu:'Shield',
  tairoji:'Shield',yugi:'Shield',
}
const UNIT_COLOR={Infantry:'#7a7020',Cavalry:'#c0392b',Archer:'#27ae60',Shield:'#2471a3'}
const UNIT_ICON_SRC={Infantry:'/icons/unit_infantry.png',Cavalry:'/icons/unit_cavalry.png',Archer:'/icons/unit_archer.png',Shield:'/icons/unit_shield.png'}

// Fix .png icon refs → .webp, rename Shoka → Shouheikun, patch unit_type + groups
ALL.forEach(c=>{
  if(c.icon) c.icon=c.icon.replace('.png','.webp')
  if(c.id==='shoka'){c.name_en='Shouheikun';c.country='qin'}
  c.unit_type=UNIT_TYPES[c.id]||null
  c.groups=Object.entries(GROUPS).filter(([,ids])=>ids.includes(c.id)).map(([gn])=>gn)
})

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
  if(c?.icon) return <img src={c.icon} style={s} className={className} alt={c.name_en}/>
  if(c?.image) return <img src={c.image} style={{...s,objectPosition:'top center'}} className={className} alt={c.name_en}/>
  const col=(CC[c?.country]||'#888')
  return <div style={{...s,background:col+'33',color:col,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:size*.38+'px'}} className={className}>{c?.name_en?.[0]||'?'}</div>
}


const TYPE_COLOR={Combat:'#c0392b',Strategy:'#3d6eb5',Administration:'#1a8a72'}

const BUFF_CATS=[
  {id:'Cavalry',            label:'Cavalry',      svgColor:'#c0392b',svgShape:'diamond', svgIcon:'♞'},
  {id:'Infantry',           label:'Infantry',     svgColor:'#c9a84c',svgShape:'circle',  svgIcon:'⚔'},
  {id:'Archer',             label:'Archer',       svgColor:'#27ae60',svgShape:'pentagon',svgIcon:'🏹'},
  {id:'Shield',             label:'Shield',       svgColor:'#2471a3',svgShape:'shield',  svgIcon:'🛡'},
  {id:'War Machine',        label:'War Machine',  svgColor:'#666',   svgShape:'none',    svgIcon:'⚙'},
  {id:'Attack War Machine', label:'Atk W.M.',     svgColor:'#666',   svgShape:'none',    svgIcon:'💥'},
  {id:'Defense War Machine',label:'Def W.M.',     svgColor:'#666',   svgShape:'none',    svgIcon:'🔩'},
  {id:'Terrain',            label:'Terrain',      svgColor:'#666',   svgShape:'none',    svgIcon:'🗺'},
  {id:'CW Repair',          label:'Repair',       svgColor:'#666',   svgShape:'none',    svgIcon:'🔧'},
]

function UnitBadge({cat,size=28}){
  const bc=BUFF_CATS.find(c=>c.id===cat)
  if(!bc||bc.svgShape==='none') return <span style={{fontSize:size*.6+'px'}}>{bc?.svgIcon||'⚙'}</span>
  const s=size,h=size
  if(bc.svgShape==='diamond') return(<svg width={s} height={h} viewBox="0 0 28 28"><path d="M14 2L26 14L14 26L2 14Z" fill={bc.svgColor} stroke={bc.svgColor+'99'} strokeWidth="1.5"/><text x="14" y="18" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">♞</text></svg>)
  if(bc.svgShape==='circle')  return(<svg width={s} height={h} viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill={bc.svgColor} stroke={bc.svgColor+'99'} strokeWidth="1.5"/><text x="14" y="19" textAnchor="middle" fontSize="13" fill="white">⚔</text></svg>)
  if(bc.svgShape==='pentagon') return(<svg width={s} height={h} viewBox="0 0 28 28"><polygon points="14,2 26,10 22,24 6,24 2,10" fill={bc.svgColor} stroke={bc.svgColor+'99'} strokeWidth="1.5"/><text x="14" y="19" textAnchor="middle" fontSize="11" fill="white">🏹</text></svg>)
  if(bc.svgShape==='shield')  return(<svg width={s} height={h} viewBox="0 0 28 28"><path d="M14 2L26 8V16C26 22 20 26 14 27C8 26 2 22 2 16V8Z" fill={bc.svgColor} stroke={bc.svgColor+'99'} strokeWidth="1.5"/><text x="14" y="19" textAnchor="middle" fontSize="12" fill="white">🛡</text></svg>)
  return <span>{bc.svgIcon}</span>
}

// ── Meta Teams data ───────────────────────────────────────────────────────────
const META_TEAMS=[
  {tier:'S',color:'#c0392b',name:'Ouhon',     members:['Shoutaku','Ouhon','Kanjou','Gakuki']},
  {tier:'S',color:'#c0392b',name:'Archers',   members:['Keisha','Seikai','Hakurei','Queen Biki']},
  {tier:'S',color:'#c0392b',name:'Zhao',      members:['Shunsuiju','Houken','Shinseijou','Riboku']},
  {tier:'S',color:'#c0392b',name:'YTW',       members:['Katari','Yotanwa','Kitari','Ramauji']},
  {tier:'A',color:'#e07f48',name:'Renpa',     members:['Rinko','Tairoji','Renpa','Kouretsu']},
  {tier:'A',color:'#e07f48',name:'Qin Shields',members:['Hakuki','Akou','Ousen','Ei Sei']},
  {tier:'A',color:'#e07f48',name:'Hi Shin',   members:['Garo','Gakurai','Naki','Robin']},
  {tier:'A',color:'#e07f48',name:'Wei',       members:['Ranbihaku','Tairoji','Reiou','Gokei']},
  {tier:'B',color:'#cc972d',name:'Ai',        members:['Wategi','Budai','Hanoki','Hamui']},
  {tier:'B',color:'#cc972d',name:'6GG',       members:['Shoou','Ouki','Tou','Kyou']},
  {tier:'B',color:'#cc972d',name:'Karin',     members:['Rien','Karin','Kaen','Goutoku']},
  {tier:'B',color:'#cc972d',name:'Chu',       members:['Kyoubou','Rinbukun','Kanmei','Shunshinkun']},
  {tier:'C',color:'#3d6eb5',name:'Han',       members:['Seikai','Chouin','Bakan','Nakon']},
  {tier:'C',color:'#3d6eb5',name:'Archer Garrison',members:['Rouai','Queen Biki','Seikai','Keisha']},
  {tier:'C',color:'#3d6eb5',name:'Rigan',     members:['Kisui','Kishou','Batei','Duke Sei']},
  {tier:'C',color:'#3d6eb5',name:'Kanki',     members:['Zenou','Raido','Kanki','Naki']},
]

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

// ── BUFF ENGINE ───────────────────────────────────────────────────────────────
const UNIT_TYPE_LIST=['Infantry','Cavalry','Archer','Shield']
const FACTION_MAP={'qin':'qin','zhao':'zhao','chu':'chu','wei':'wei','yan':'yan','qi':'qi','han':'han','mountain folk':'mountain_folk','ai':'ai'}
function parseBuffEffect(str){
  if(!str) return []
  const results=[],deferred=[]
  for(let part of str.split(/[,、]/)){
    part=part.trim()
    if(/\d+[%％]\s*Damage|Normal Attack|HP Drain|Provoke|Confusion Infliction|Stun Rate|Seal Rate/i.test(part)) continue
    let ownerType=null,antiEnemy=null,m
    // "Ally [X] Anti-[Y] ..." — owner unit type + anti enemy type (from effect field)
    m=part.match(/^(?:Ally\s+)\[([A-Za-z]+)\]\s+Anti-\[([^\]]+)\]\s+(.+)/i)
    if(m){ownerType=m[1];antiEnemy=m[2].trim();part=m[3]}
    // "[X] Anti-[Y] ..." — owner unit type + anti enemy type
    if(!ownerType){
      m=part.match(/^\[([A-Za-z]+)\]\s+Anti-\[([^\]]+)\]\s+(.+)/i)
      if(m){ownerType=m[1];antiEnemy=m[2].trim();part=m[3]}
    }
    // "Anti-[X] ..." — bracketed anti target (faction or unit type)
    if(!antiEnemy){
      m=part.match(/^Anti-\[([^\]]+)\]\s+(.+)/i)
      if(m){antiEnemy=m[1].trim();part=m[2]}
    }
    // "Anti-GroupName ..." — unbracketed known group
    if(!antiEnemy){
      for(const gn of Object.keys(GROUPS)){
        const re=new RegExp('^Anti-'+gn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s+(.+)','i')
        m=part.match(re)
        if(m){antiEnemy=gn;part=m[1];break}
      }
    }
    // "Stat Up/Down X%"
    m=part.match(/^(.+?)\s+(Up|Down)\s+(\d+(?:\.\d+)?)[%％]/)
    if(m){
      const r={stat:m[1].trim(),dir:m[2],val:parseFloat(m[3]),ownerType,antiEnemy}
      results.push(r)
      // flush any deferred "Stat Dir" entries that had no value (e.g. "ATK Down、DEF Down 20%")
      for(const d of deferred) if(d.dir===r.dir) results.push({...d,val:r.val})
      deferred=[]
      continue
    }
    // "Stat Up/Down" with no value — defer until we see a value in the same direction
    m=part.match(/^(.+?)\s+(Up|Down)\s*$/)
    if(m){deferred.push({stat:m[1].trim(),dir:m[2],ownerType,antiEnemy});continue}
    // "DEF Penetration X%" or "DEF Penetration Resistance X%" (no Up keyword)
    m=part.match(/^(DEF Penetration(?:\s+Resistance)?)\s+(\d+(?:\.\d+)?)[%％]$/)
    if(m){results.push({stat:m[1],dir:'Up',val:parseFloat(m[2]),ownerType,antiEnemy});continue}
    // Simple rate buffs
    m=part.match(/^(Guard|Hit Rate|Critical Rate|HP Recovery)\s+(\d+(?:\.\d+)?)[%％]$/)
    if(m){results.push({stat:m[1],dir:'Up',val:parseFloat(m[2]),ownerType,antiEnemy});continue}
  }
  return results
}
function inGroup(c,groupName){
  const g=groupName.toLowerCase().replace(/[^a-z]/g,'')
  return(c.groups||[]).some(gn=>{const n=gn.toLowerCase().replace(/[^a-z]/g,'');return n===g||n.includes(g)||g.includes(n)})
}
function isTargetedBy(target,G,owner,team){
  if(!target) return false
  const t=target.trim()
  if(/^enemy|^1\s*enemy|^other\s+enemy|^war\s+machine|^ally\s+war|^gate|^\d+\s+enemy|^Enemy\s*\[/i.test(t)) return false
  // "Self and/or ally X"
  const selfAnd=/^self(?:\s+and|\s*[\/,])\s*ally\s+(.+)/i.exec(t)
  if(selfAnd){if(G.id===owner.id) return true; return isTargetedBy('Ally '+selfAnd[1],G,owner,team)}
  // "Self" only
  if(/^self$/i.test(t)) return G.id===owner.id
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
  const nameM=/ally\s+"?([^"\/\n,\[\]]+?)"?\s*(?:vs\s+\S.*)?$/i.exec(t)
  if(nameM){
    const nm=nameM[1].trim()
    if(!nm) return false
    for(const gn of Object.keys(GROUPS)){if(gn.toLowerCase().includes(nm.toLowerCase().split(' ')[0])) return inGroup(G,gn)}
    return G.name_en.toLowerCase()===nm.toLowerCase()&&G.id!==owner.id
  }
  return false
}
function getMultiplier(cond,owner,team){
  if(!cond) return 1
  const perM=/per\s+(?:other\s+)?ally\s+(.+?)\s+(?:member|general)/i.exec(cond)
  if(perM){
    const gName=perM[1].trim()
    for(const [gn,ids] of Object.entries(GROUPS)){
      if(gn.toLowerCase().includes(gName.toLowerCase())||gName.toLowerCase().includes(gn.toLowerCase().split(' ')[0])){
        return team.filter(m=>ids.includes(m.id)&&m.id!==owner.id).length
      }
    }
    return 0
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
          if(!stats[stat]) stats[stat]={up:0,down:0}
          if(dir==='Up') stats[stat].up+=val*mult; else stats[stat].down+=val*mult
        }
      }
    }
  }
  return stats
}

function normalizeEnemyTarget(t){
  const tl=t.toLowerCase()
  if(/all\s+enemy|all\s+generals/i.test(tl)) return 'All enemies'
  const ut=UNIT_TYPE_LIST.find(u=>tl.includes(u.toLowerCase()))
  if(ut) return `Enemy ${ut}`
  for(const [label] of Object.entries(FACTION_MAP))
    if(tl.includes(label)) return `Enemy ${label[0].toUpperCase()+label.slice(1)}`
  return 'Enemies'
}
function calcTeamEnemyDebuffs(team){
  const byTarget={}
  for(const owner of team){
    for(const sk of(owner.skills||[])){
      for(const eff of(sk.effects||[])){
        const t=(eff.target||'').trim()
        if(!/^enemy|^all\s+enemy/i.test(t)) continue
        const parsed=parseBuffEffect(eff.effect)
        if(!parsed.length) continue
        const key=normalizeEnemyTarget(t)
        if(!byTarget[key]) byTarget[key]={up:{},down:{}}
        for(const{stat,dir,val} of parsed){
          const d=dir==='Up'?'up':'down'
          byTarget[key][d][stat]=(byTarget[key][d][stat]||0)+val
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
  const ql=q.toLowerCase()
  const factionLabel=c=>FACTIONS.find(f=>f.id===c.country)?.label||''
  const chars=ALL.filter(c=>!excl.includes(c.id)&&(!q||(
    c.name_en.toLowerCase().includes(ql)||
    c.name_jp.includes(q)||
    (c.unit_type&&c.unit_type.toLowerCase().includes(ql))||
    (c.groups&&c.groups.some(g=>g.toLowerCase().includes(ql)))||
    factionLabel(c).toLowerCase().includes(ql)||
    (c.country&&c.country.toLowerCase().includes(ql))
  )))
  return(
    <div className="overlay" onClick={onClose}>
      <div className="picker" onClick={e=>e.stopPropagation()}>
        <div className="picker-head"><span>Select General</span><button className="x-btn" onClick={onClose}>✕</button></div>
        <div className="picker-filters"><input ref={ref} className="picker-search" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}/></div>
        <div className="picker-grid">
          {chars.map(c=>(
            <button key={c.id} className="p-card" style={{borderTopColor:CC[c.country]||'#999'}} onClick={()=>{onSelect(c);onClose()}}>
              <CharIcon c={c} size={46} round={true}/>
              <span className="p-name">{c.name_en}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TEAM COST ─────────────────────────────────────────────────────────────────
const RARITY_COST={R:595,SR:800,UR:1750}
const RARITY_COLOR={R:'#3d9970',SR:'#3d6eb5',UR:'#c0392b'}

const RARITY_DATA={
  'Akou':{rarity:'UR',faction:'Qin',name_jp:'亜光'},
  'Amon':{rarity:'SR',faction:'Qin',name_jp:'亜門'},
  'Bain':{rarity:'UR',faction:'Qin',name_jp:'馬印'},
  'Bajio':{rarity:'UR',faction:'Mountain Folk',name_jp:'バジオウ'},
  'Bakan':{rarity:'SR',faction:'Han',name_jp:'馬関'},
  'Bakukoshin':{rarity:'SR',faction:'Qin',name_jp:'縛虎申'},
  'Bamyu':{rarity:'SR',faction:'Chu',name_jp:'バミュウ'},
  'Bananji':{rarity:'UR',faction:'Zhao',name_jp:'馬南慈'},
  'Banyou':{rarity:'SR',faction:'Qin',name_jp:'番陽'},
  'Batei':{rarity:'SR',faction:'Zhao',name_jp:'馬呈'},
  'Beiman':{rarity:'UR',faction:'Chu',name_jp:'貝満'},
  'Bihei':{rarity:'R',faction:'Qin',name_jp:'尾平'},
  'Bikou':{rarity:'R',faction:'Qin',name_jp:'尾到'},
  'Budai':{rarity:'UR',faction:'Ai',name_jp:'ブダイ'},
  'Chouin':{rarity:'UR',faction:'Han',name_jp:'張印'},
  'Chouko':{rarity:'SR',faction:'Zhao',name_jp:'趙高'},
  'Chousou':{rarity:'SR',faction:'Zhao',name_jp:'趙荘'},
  'Choutou':{rarity:'UR',faction:'Qin',name_jp:'張唐'},
  'Chutetsu':{rarity:'SR',faction:'Qin',name_jp:'中鉄'},
  'Danto':{rarity:'UR',faction:'Mountain Folk',name_jp:'ダント'},
  'Denei':{rarity:'SR',faction:'Qin',name_jp:'田永'},
  'Denrimi':{rarity:'UR',faction:'Qin',name_jp:'田里弥'},
  'Denyuu':{rarity:'SR',faction:'Qin',name_jp:'田有'},
  'Domon':{rarity:'SR',faction:'Zhao',name_jp:'土門'},
  'Douken':{rarity:'SR',faction:'Zhao',name_jp:'道剣'},
  'Doukin':{rarity:'SR',faction:'Qin',name_jp:'同金'},
  'Duke Hyou':{rarity:'UR',faction:'Qin',name_jp:'麃公'},
  'Duke Sei':{rarity:'UR',faction:'Zhao',name_jp:'青公'},
  'Ei Sei':{rarity:'SR',faction:'Qin',name_jp:'嬴政'},
  'Entei':{rarity:'SR',faction:'Qin',name_jp:'燕呈'},
  'Fuchi':{rarity:'SR',faction:'Qin',name_jp:'渕'},
  'Fuji':{rarity:'SR',faction:'Mountain Folk',name_jp:'フゥヂ'},
  'Futei':{rarity:'SR',faction:'Zhao',name_jp:'傳抵'},
  'Gaimou':{rarity:'UR',faction:'Wei',name_jp:'凱孟'},
  'Gakuei':{rarity:'UR',faction:'Zhao',name_jp:'岳嬰'},
  'Gakujou':{rarity:'SR',faction:'Zhao',name_jp:'楽乗'},
  'Gakuki':{rarity:'UR',faction:'Yan',name_jp:'楽毅'},
  'Gakurai':{rarity:'UR',faction:'Qin',name_jp:'岳雷'},
  'Garo':{rarity:'UR',faction:'Qin',name_jp:'我呂'},
  'Gekishin':{rarity:'UR',faction:'Yan',name_jp:'劇辛'},
  'Genpo':{rarity:'SR',faction:'Wei',name_jp:'玄峰'},
  'Gii':{rarity:'SR',faction:'Wei',name_jp:'魏興'},
  'Gika':{rarity:'SR',faction:'Wei',name_jp:'魏加'},
  'Gohoumei':{rarity:'UR',faction:'Wei',name_jp:'呉鳳明'},
  'Gokei':{rarity:'UR',faction:'Wei',name_jp:'呉慶'},
  'Gotan':{rarity:'SR',faction:'Mountain Folk',name_jp:'剛炭'},
  'Goumasho':{rarity:'UR',faction:'Chu',name_jp:'剛摩諸'},
  'Goutoku':{rarity:'SR',faction:'Chu',name_jp:'豪徳'},
  'Hairou':{rarity:'SR',faction:'Qin',name_jp:'沛浪'},
  'Hakuki':{rarity:'UR',faction:'Qin',name_jp:'白起'},
  'Hakukisei':{rarity:'SR',faction:'Qin',name_jp:'白亀西'},
  'Hakurei':{rarity:'SR',faction:'Chu',name_jp:'白麗'},
  'Hakusui':{rarity:'UR',faction:'Chu',name_jp:'白翠'},
  'Hamui':{rarity:'UR',faction:'Ai',name_jp:'ハムイ'},
  'Hanoki':{rarity:'UR',faction:'Ai',name_jp:'樊於期'},
  'Hanroki':{rarity:'UR',faction:'Ai',name_jp:'樊琉期'},
  'Heki':{rarity:'R',faction:'Qin',name_jp:'壁'},
  'Hokaku':{rarity:'SR',faction:'Qin',name_jp:'蒲鶮'},
  'Hoki':{rarity:'SR',faction:'Wei',name_jp:'馮忌'},
  'Houken':{rarity:'UR',faction:'Zhao',name_jp:'龐煖'},
  'Hyou':{rarity:'SR',faction:'Qin',name_jp:'漂'},
  'Hyouki':{rarity:'SR',faction:'Chu',name_jp:'氷鬼'},
  'Hyoushiga':{rarity:'UR',faction:'Qin',name_jp:'豹司牙'},
  'Jinou':{rarity:'UR',faction:'Chu',name_jp:'仁凹'},
  'Jiou':{rarity:'SR',faction:'Zhao',name_jp:'江彰'},
  'Jokan':{rarity:'SR',faction:'Zhao',name_jp:'徐完'},
  'Junso':{rarity:'UR',faction:'Wei',name_jp:'荀早'},
  'Ka':{rarity:'UR',faction:'Zhao',name_jp:'太子嘉'},
  'Kaen':{rarity:'UR',faction:'Chu',name_jp:'媧偃'},
  'Kaine':{rarity:'SR',faction:'Zhao',name_jp:'カイネ'},
  'Kaioku':{rarity:'UR',faction:'Qin',name_jp:'介億'},
  'Kaishibou':{rarity:'SR',faction:'Wei',name_jp:'介子坊'},
  'Kakubi':{rarity:'SR',faction:'Qin',name_jp:'郭備'},
  'Kakukai':{rarity:'UR',faction:'Zhao',name_jp:'郭開'},
  'Kakuun':{rarity:'UR',faction:'Qin',name_jp:'角雲'},
  'Kanjou':{rarity:'UR',faction:'Qin',name_jp:'関常'},
  'Kanki':{rarity:'UR',faction:'Qin',name_jp:'桓騎'},
  'Kanmei':{rarity:'UR',faction:'Chu',name_jp:'汗明'},
  'Kanou':{rarity:'SR',faction:'Qin',name_jp:'干央'},
  'Karin':{rarity:'UR',faction:'Chu',name_jp:'媧燐'},
  'Karyoten':{rarity:'SR',faction:'Qin',name_jp:'河了貂'},
  'Katari':{rarity:'UR',faction:'Mountain Folk',name_jp:'カタリ'},
  'Kei':{rarity:'SR',faction:'Qin',name_jp:'慶'},
  'Keibin':{rarity:'UR',faction:'Wei',name_jp:'景湣王'},
  'Keisha':{rarity:'UR',faction:'Zhao',name_jp:'慶舎'},
  'Kesshi':{rarity:'SR',faction:'Zhao',name_jp:'竭氏'},
  'Kinmou':{rarity:'UR',faction:'Zhao',name_jp:'金毛'},
  'Kishou':{rarity:'UR',faction:'Zhao',name_jp:'紀昌'},
  'Kisui':{rarity:'UR',faction:'Zhao',name_jp:'紀彗'},
  'Kitari':{rarity:'UR',faction:'Mountain Folk',name_jp:'キタリ'},
  'Kokuou':{rarity:'SR',faction:'Qin',name_jp:'黒桜'},
  'Koshou':{rarity:'UR',faction:'Qin',name_jp:'胡傷'},
  'Kou':{rarity:'UR',faction:'Qin',name_jp:'向'},
  'Kouretsu':{rarity:'UR',faction:'Chu',name_jp:'考烈王'},
  'Kourigen':{rarity:'SR',faction:'Wei',name_jp:'黄離弦'},
  'Kousonryu':{rarity:'SR',faction:'Zhao',name_jp:'公孫龍'},
  'Kouyoku':{rarity:'SR',faction:'Chu',name_jp:'項翼'},
  'Kuzen':{rarity:'SR',faction:'Qin',name_jp:'蒙恬のじぃ'},
  'Kyomei':{rarity:'SR',faction:'Qin',name_jp:'羌明'},
  'Kyou':{rarity:'UR',faction:'Qin',name_jp:'摎'},
  'KyouEn':{rarity:'SR',faction:'Wei',name_jp:'姜燕'},
  'Kyoubou':{rarity:'UR',faction:'Chu',name_jp:'巨暴'},
  'Kyougai':{rarity:'SR',faction:'Qin',name_jp:'去亥'},
  'Kyoukai':{rarity:'SR',faction:'Qin',name_jp:'羌瘣'},
  'Kyourei':{rarity:'SR',faction:'Qin',name_jp:'京令'},
  'Kyoushou':{rarity:'SR',faction:'Qin',name_jp:'羌象'},
  'Kyuukou':{rarity:'SR',faction:'Qin',name_jp:'宮康'},
  'Linhtama':{rarity:'SR',faction:'Qin',name_jp:'ランタマ'},
  'Maki':{rarity:'SR',faction:'Mountain Folk',name_jp:'麻鬼'},
  'Mangoku':{rarity:'SR',faction:'Zhao',name_jp:'万極'},
  'Maron':{rarity:'SR',faction:'Qin',name_jp:'摩論'},
  'Miyamoto':{rarity:'SR',faction:'Zhao',name_jp:'宮元'},
  'Moubu':{rarity:'UR',faction:'Qin',name_jp:'蒙武'},
  'Mougou':{rarity:'UR',faction:'Qin',name_jp:'蒙驁'},
  'Mouki':{rarity:'SR',faction:'Qin',name_jp:'蒙毅'},
  'Mouten':{rarity:'SR',faction:'Qin',name_jp:'蒙恬'},
  'Muta':{rarity:'SR',faction:'Qin',name_jp:'ムタ'},
  'Naki':{rarity:'UR',faction:'Qin',name_jp:'那貴'},
  'Nakon':{rarity:'SR',faction:'Han',name_jp:'奈棍'},
  'Ogiko':{rarity:'SR',faction:'Qin',name_jp:'オギコ'},
  'Ordo':{rarity:'UR',faction:'Yan',name_jp:'オルド'},
  'Otaji':{rarity:'SR',faction:'Yan',name_jp:'オタジ'},
  'Ouhon':{rarity:'SR',faction:'Qin',name_jp:'王賁'},
  'Ouken':{rarity:'UR',faction:'Qi',name_jp:'王建王'},
  'Ouki':{rarity:'UR',faction:'Qin',name_jp:'王騎'},
  'Oukotsu':{rarity:'UR',faction:'Qin',name_jp:'王齕'},
  'Ousen':{rarity:'UR',faction:'Qin',name_jp:'王翦'},
  'Pam':{rarity:'SR',faction:'Mountain Folk',name_jp:'パム'},
  'Qingxiang':{rarity:'SR',faction:'Zhao',name_jp:'青翔'},
  'Queen Biki':{rarity:'UR',faction:'Qin',name_jp:'太后'},
  'Raido':{rarity:'R',faction:'Qin',name_jp:'雷土'},
  'Ramauji':{rarity:'SR',faction:'Mountain Folk',name_jp:'ラマウジ'},
  'Ranbihaku':{rarity:'UR',faction:'Wei',name_jp:'乱美迫'},
  'Rankai':{rarity:'SR',faction:'Mountain Folk',name_jp:'ランカイ'},
  'Reiou':{rarity:'UR',faction:'Wei',name_jp:'霊凰'},
  'Renpa':{rarity:'UR',faction:'Wei',name_jp:'廉頗'},
  'Riboku':{rarity:'UR',faction:'Zhao',name_jp:'李牧'},
  'Rien':{rarity:'UR',faction:'Chu',name_jp:'李園'},
  'Rihaku':{rarity:'SR',faction:'Zhao',name_jp:'李白'},
  'Rikusen':{rarity:'UR',faction:'Qin',name_jp:'陸仙'},
  'Rinbou':{rarity:'SR',faction:'Qin',name_jp:'鱗坊'},
  'Rinbukun':{rarity:'UR',faction:'Chu',name_jp:'臨武君'},
  'Ringyoku':{rarity:'UR',faction:'Qin',name_jp:'リン玉'},
  'Rinko':{rarity:'UR',faction:'Wei',name_jp:'輪虎'},
  'Rishi':{rarity:'R',faction:'Qin',name_jp:'李斯'},
  'Robin':{rarity:'UR',faction:'Qin',name_jp:'呂敏'},
  'Roen':{rarity:'SR',faction:'Qin',name_jp:'魯延'},
  'Rokin':{rarity:'SR',faction:'Chu',name_jp:'魯近'},
  'Rokuomi':{rarity:'SR',faction:'Qin',name_jp:'録嗚未'},
  'Rouai':{rarity:'UR',faction:'Ai',name_jp:'嫪毐'},
  'Rui':{rarity:'UR',faction:'Qin',name_jp:'瑠衣'},
  'Ryofui':{rarity:'UR',faction:'Qin',name_jp:'呂不韋'},
  'Ryuukoku':{rarity:'SR',faction:'Qin',name_jp:'隆国'},
  'Ryuusen':{rarity:'SR',faction:'Qin',name_jp:'竜川'},
  'Ryuuto':{rarity:'UR',faction:'Zhao',name_jp:'劉冬'},
  'Ryuyu':{rarity:'SR',faction:'Qin',name_jp:'竜有'},
  'Saizatsu':{rarity:'SR',faction:'Qin',name_jp:'蔡沢'},
  'Saji':{rarity:'SR',faction:'Zhao',name_jp:'左慈'},
  'Seikai':{rarity:'UR',faction:'Han',name_jp:'成恢'},
  'Seikyou':{rarity:'SR',faction:'Qin',name_jp:'成蟜'},
  'Seki':{rarity:'SR',faction:'Qin',name_jp:'石'},
  'Shibasaku':{rarity:'UR',faction:'Qin',name_jp:'司馬錯'},
  'Shihaku':{rarity:'UR',faction:'Wei',name_jp:'紫伯'},
  'Shika':{rarity:'SR',faction:'Zhao',name_jp:'紫夏'},
  'Shikika':{rarity:'UR',faction:'Wei',name_jp:'紫季歌'},
  'Shin':{rarity:'SR',faction:'Qin',name_jp:'信'},
  'Shinseijou':{rarity:'UR',faction:'Zhao',name_jp:'晋成常'},
  'Shishi':{rarity:'SR',faction:'Qin',name_jp:'肆氏'},
  'Shoka':{rarity:'SR',faction:'Zhao',name_jp:'尚鹿'},
  'Shoou':{rarity:'SR',faction:'Qin',name_jp:'昭王'},
  'Shouheikun':{rarity:'UR',faction:'Qin',name_jp:'昌平君'},
  'Shoumou':{rarity:'SR',faction:'Zhao',name_jp:'渉孟'},
  'Shoumounkun':{rarity:'UR',faction:'Qin',name_jp:'昌文君'},
  'Shousa':{rarity:'SR',faction:'Qin',name_jp:'松佐'},
  'Shoutaku':{rarity:'SR',faction:'Qin',name_jp:'松琢'},
  'Shuki':{rarity:'SR',faction:'Mountain Folk',name_jp:'朱鬼'},
  'Shunmen':{rarity:'SR',faction:'Mountain Folk',name_jp:'シュンメン'},
  'Shunpeikun':{rarity:'UR',faction:'Zhao',name_jp:'春平君'},
  'Shunshinkun':{rarity:'UR',faction:'Chu',name_jp:'春申君'},
  'Shunsuiju':{rarity:'UR',faction:'Zhao',name_jp:'舜水樹'},
  'Sosui':{rarity:'SR',faction:'Qin',name_jp:'楚水'},
  'Sougen':{rarity:'UR',faction:'Qin',name_jp:'蒼源'},
  'Suirou':{rarity:'SR',faction:'Qin',name_jp:'崇原'},
  'Taijifu':{rarity:'SR',faction:'Mountain Folk',name_jp:'タジフ'},
  'Tairoji':{rarity:'UR',faction:'Wei',name_jp:'太呂慈'},
  'Takukei':{rarity:'SR',faction:'Qin',name_jp:'澤圭'},
  'Toji':{rarity:'SR',faction:'Mountain Folk',name_jp:'トッヂ'},
  'Tou':{rarity:'UR',faction:'Qin',name_jp:'騰'},
  'Toumi':{rarity:'UR',faction:'Qin',name_jp:'東美'},
  'Wategi':{rarity:'UR',faction:'Ai',name_jp:'戎翟公'},
  'Yotanwa':{rarity:'SR',faction:'Mountain Folk',name_jp:'楊端和'},
  'You':{rarity:'UR',faction:'Qin',name_jp:'陽'},
  'Youka':{rarity:'UR',faction:'Qin',name_jp:'姚賈'},
  'Yugi':{rarity:'SR',faction:'Qin',name_jp:'有義'},
  'Yukii':{rarity:'UR',faction:'Yan',name_jp:'ユキイ'},
  'Yuri':{rarity:'UR',faction:'Qin',name_jp:'友里'},
  'Yuuren':{rarity:'SR',faction:'Wei',name_jp:'幽連'},
  'Zenou':{rarity:'UR',faction:'Qin',name_jp:'ゼノウ'}
}

const PAGES=['Archive','Party Builder','Simulate','CW Buffs','Tier List','Team Cost']
export default function App(){
  const[page,setPage]=useState('Archive')
  const[atk,setAtk]=useState([])
  const[def,setDef]=useState([])
  const rm=(char,side)=>(side==='attack'?setAtk:setDef)(p=>p.filter(x=>x.id!==char.id))
  const setSlot=(char,side,idx)=>{
    const set=side==='attack'?setAtk:setDef
    set(p=>{const n=[...p];const e=n.findIndex(x=>x.id===char.id);if(e!==-1)n.splice(e,1);n[idx]=char;return n.filter(Boolean)})
  }
  const loadMetaTeam=(team,side)=>{
    const chars=team.members.map(n=>ALL.find(c=>c.name_en===n||c.name_en.toLowerCase()===n.toLowerCase())).filter(Boolean).slice(0,4)
    if(side==='attack') setAtk(chars)
    else setDef(chars)
    setPage('Party Builder')
  }
  return(
    <div className="app">
      <header className="hdr">
        <div className="hdr-in">
          <div className="logo">
            <div className="logo-badge">⚔</div>
            <div>
              <div className="logo-ja">キングダム乱</div>
              <div className="logo-en">Kingdom Ran CW</div>
            </div>
          </div>
          <nav className="nav">
            {PAGES.map(p=>(
              <button key={p} className={`nb${page===p?' nb-on':''}`} onClick={()=>setPage(p)}>
                {p}{p==='Party Builder'&&(atk.length+def.length)>0&&<span className="nb-dot">{atk.length+def.length}</span>}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div className="app-body">
        {page==='Archive'          && <ArchivePage/>}
        {page==='Party Builder'    && <BuilderPage atk={atk} def={def} setSlot={setSlot} rm={rm} goSim={()=>setPage('Simulate')} loadMetaTeam={loadMetaTeam}/>}
        {page==='Simulate' && <SimPage atk={atk} def={def} goBuilder={()=>setPage('Party Builder')}/>}
        {page==='CW Buffs'         && <BuffsPage/>}
        {page==='Tier List'        && <TierPage/>}
        {page==='Team Cost'        && <TeamCostPage/>}
      </div>
      <footer className="foot">{ALL.length} generals · Fan resource · Not affiliated with Cygames</footer>
    </div>
  )
}

// ── ARCHIVE ───────────────────────────────────────────────────────────────────
function ArchivePage(){
  const[activeFac,setActiveFac]=useState('qin')
  const[selected,setSelected]=useState(null)
  const[search,setSearch]=useState('')
  const facChars=ALL.filter(c=>c.country===activeFac&&c.image)
  const filtered=(search
    ?ALL.filter(c=>{const q=search.toLowerCase();return c.name_en.toLowerCase().includes(q)||c.name_jp.includes(search)||(c.unit_type&&c.unit_type.toLowerCase().includes(q))||(c.groups&&c.groups.some(g=>g.toLowerCase().includes(q)))})
    :facChars
  ).slice().sort((a,b)=>a.name_en.localeCompare(b.name_en))
  const handleFacClick=(fid)=>{setActiveFac(fid);setSelected(null);setSearch('')}

  return(
    <div className={`archive-layout${selected?' has-selection':''}`}>
      {/* Sidebar */}
      <aside className="fac-sidebar">
        <div className="fac-search-wrap">
          <input className="fac-search" placeholder="Search generals…" value={search} onChange={e=>{setSearch(e.target.value);setSelected(null)}}/>
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
            onChange={e=>{setSearch(e.target.value);setSelected(null)}}/>
          {search&&<button className="mobile-search-clear" onClick={()=>setSearch('')}>✕</button>}
        </div>
        <div className="gallery-header">
          <h2 className="gallery-title">{search?`Results (${filtered.length})`:`${FACTIONS.find(f=>f.id===activeFac)?.label} Roster`}</h2>
          <span className="gallery-count">{filtered.length} generals</span>
        </div>
        <div className="gallery-grid">
          {filtered.map(c=>(
            <button key={c.id}
              className={`banner-card${selected?.id===c.id?' banner-selected':''}`}
              onClick={()=>setSelected(selected?.id===c.id?null:c)}
              style={selected?.id===c.id?{outline:`3px solid ${CC[c.country]||'#999'}`}:{}}>
              <div className="banner-faction-tag" style={{background:CC[c.country]||'#666'}}>
                {FACTIONS.find(f=>f.id===c.country)?.jp||c.country}
              </div>
              {c.image?<img src={c.image} alt={c.name_en} className="banner-img"/>
                :<div className="banner-ph" style={{background:(CC[c.country]||'#555')+'33',color:CC[c.country]||'#888'}}>{c.name_en[0]}</div>}
              <div className="banner-footer"><span className="banner-name">{c.name_en}</span></div>
            </button>
          ))}
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
            <button className="detail-close" onClick={()=>setSelected(null)}>✕</button>
          </div>
          <div className="detail-skills">
            {(selected.skills||[]).length===0
              ?<p className="no-skills">Translation pending</p>
              :(selected.skills||[]).map((sk,i)=><SkillCard key={i} skill={sk}/>)
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
          {skill.type==='Administration'&&<span className="tag t-map">Map</span>}
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
  const chars=team.members.map(n=>ALL.find(c=>c.name_en===n||c.name_en.toLowerCase()===n.toLowerCase())).filter(Boolean)
  return(
    <div className="meta-card" style={{borderTopColor:team.color}}>
      <div className="meta-card-head">
        <span className="meta-tier-badge" style={{background:team.color}}>{team.tier}</span>
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
function BuilderPage({atk,def,setSlot,rm,goSim,loadMetaTeam}){
  const[picker,setPicker]=useState(null)
  const excl=[...atk,...def].map(c=>c.id)
  return(
    <div className="main-page">
      {picker&&<Picker onSelect={c=>setSlot(c,picker.side,picker.idx)} onClose={()=>setPicker(null)} excl={excl}/>}
      <h2 className="pg-title">Party Builder</h2>
      <p className="pg-sub">Click slots to add generals. Last slot fires first.</p>
      <div className="two-sides">
        <SideSlots side="attack"  label="⚔ Attacking" party={atk} onSlot={i=>setPicker({side:'attack',idx:i})}  onRm={c=>rm(c,'attack')}/>
        <div className="vs-sep">VS</div>
        <SideSlots side="defense" label="🛡 Defending" party={def} onSlot={i=>setPicker({side:'defense',idx:i})} onRm={c=>rm(c,'defense')}/>
      </div>
      {(atk.length||def.length)>0&&<div className="cta-row"><button className="cta-btn" onClick={goSim}>View Activation Order →</button></div>}
      <BuffTable atk={atk} def={def}/>

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

function SideSlots({side,label,party,onSlot,onRm}){
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
            <button className="slot-rm" onClick={()=>onRm(m)}>✕</button>
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

// ── ACTIVATION ORDER ──────────────────────────────────────────────────────────
function SimPage({atk,def,goBuilder}){
  if(!atk.length&&!def.length) return(
    <div className="main-page empty-cta"><p>No formations set.</p><button className="cta-btn" onClick={goBuilder}>Go to Party Builder</button></div>
  )
  const{st,turns}=simulate(atk,def)
  return(
    <div className="main-page">
      <h2 className="pg-title">Activation Order</h2>
      <div className="form-bars">
        <FormBar generals={atk} side="attack" label="⚔ Attacking"/>
        <div className="form-vs">VS</div>
        <FormBar generals={def} side="defense" label="🛡 Defending"/>
      </div>
      <div className="sim-sec">
        <div className="sec-hd sec-strat">⚑ Strategy Skills — Always Active</div>
        <div className="strat-cols">
          <StratCol label="⚔ Attacking Formation" entries={st.attack} side="attack"/>
          <StratCol label="🛡 Defending Formation" entries={st.defense} side="defense"/>
        </div>
      </div>
      <div className="sim-sec">
        <div className="sec-hd sec-combat">⚔ Turn-by-Turn Combat</div>
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
  const atkEnemyDebuffs=calcTeamEnemyDebuffs(atk)
  const defEnemyDebuffs=calcTeamEnemyDebuffs(def)
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
function BuffSideTable({label,entries,side,enemyDebuffs={}}){
  const ac=side==='attack'?'var(--red)':'var(--blue)'
  const hasAny=entries.some(({buffs})=>Object.keys(buffs).length>0)
  const hasEnemyDebuffs=Object.keys(enemyDebuffs).length>0
  const fmt=v=>Number.isInteger(v)?v:v.toFixed(1)
  return(
    <div className={`scol ${side==='attack'?'atk':'def'}`}>
      <div className="scol-lbl" style={{color:ac,borderBottomColor:ac+'44'}}>{label}</div>
      {!hasAny?<p className="scol-none">No relevant buffs</p>:entries.map(({general:g,buffs})=>{
        const stats=Object.entries(buffs).filter(([,v])=>v.up>0||v.down>0)
        return(
          <div key={g.id} className="scol-gen">
            <div className="scol-gen-hdr" style={{color:ac}}>
              <CharIcon c={g} size={28} round={true}/>
              <b>{g.name_en}</b>
            </div>
            {!stats.length?<div className="buff-none-row">—</div>:(
              <div className="buff-stats">
                {stats.map(([stat,{up,down}])=>(
                  <div key={stat} className="buff-row">
                    <span className="buff-stat-name">{stat}</span>
                    <span className="buff-vals">
                      {up>0&&<span className="buff-up">+{fmt(up)}%</span>}
                      {down>0&&<span className="buff-down">−{fmt(down)}%</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {hasEnemyDebuffs&&(
        <div className="scol-gen" style={{marginTop:'.5rem'}}>
          <div className="scol-gen-hdr" style={{color:'#b05000',fontSize:'.75rem',fontWeight:800,letterSpacing:'.03em'}}>
            ↓ Debuffs Applied to Enemy
          </div>
          <div className="buff-stats">
            {Object.entries(enemyDebuffs).map(([target,{up,down}])=>{
              const allStats=[
                ...Object.entries(down).map(([s,v])=>({s,v,d:'down'})),
                ...Object.entries(up).map(([s,v])=>({s,v,d:'up'})),
              ].filter(x=>x.v>0)
              if(!allStats.length) return null
              return(
                <div key={target} className="buff-row" style={{background:'rgba(176,80,0,.07)',borderColor:'rgba(176,80,0,.2)'}}>
                  <span className="buff-stat-name" style={{color:'#b05000',fontWeight:700,fontSize:'.75rem'}}>{target}</span>
                  <span className="buff-vals">
                    {allStats.map(({s,v,d})=>(
                      <span key={s} className={d==='down'?'buff-down':'buff-up'}>
                        {d==='down'?'−':'+' }{fmt(v)}% {s}
                      </span>
                    ))}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── CW BUFFS ──────────────────────────────────────────────────────────────────
const BUFF_UNIT_CATS = ['Infantry','Cavalry','Archer','Shield']
const BUFF_STAT_COLORS = {HP:'#1a8a72', Attack:'#c0392b', Defense:'#2471a3'}
const CAT_COLOR = {Infantry:'#b8880a', Cavalry:'#c0392b', Archer:'#27ae60', Shield:'#6a4fc8'}

function UnitCatIcon({cat,size=80}){
  const imgs={'Infantry':'/icons/unit_infantry.png','Cavalry':'/icons/unit_cavalry.png','Archer':'/icons/unit_archer.png','Shield':'/icons/unit_shield.png'}
  return <img src={imgs[cat]} alt={cat} style={{width:size,height:size,objectFit:'contain',flexShrink:0}}/>
}

function BuffsPage(){
  const[activeCat,setActiveCat]=useState(null)
  const[activeStat,setActiveStat]=useState('HP')
  const data=cwBuffsData
  const handleCat=(cat)=>{if(activeCat===cat){setActiveCat(null)}else{setActiveCat(cat);setActiveStat('HP')}}
  return(
    <div style={{maxWidth:'860px',margin:'0 auto',padding:'0 1rem'}}>
      <div style={{textAlign:'center',marginBottom:'2rem',paddingTop:'1rem'}}>
        <h2 style={{fontSize:'1.5rem',fontWeight:800,color:'var(--txt)',marginBottom:'.3rem'}}>CW Buffs</h2>
        <p style={{fontSize:'.82rem',color:'var(--txt3)'}}>Administration skills active during Castle Wars — stackable buffs by unit type</p>
      </div>
      <div style={{display:'flex',justifyContent:'center',gap:'16px',marginBottom:'2.5rem',flexWrap:'wrap'}}>
        {BUFF_UNIT_CATS.map(cat=>{
          const isActive=activeCat===cat
          const col=CAT_COLOR[cat]
          const uniqueNames=new Set(Object.values(data[cat]||{}).flat().map(e=>e.name))
          return(
            <button key={cat} onClick={()=>handleCat(cat)} style={{
              display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',
              padding:'20px 24px 16px',borderRadius:'20px',cursor:'pointer',width:'160px',
              border:`2px solid ${isActive?col:'var(--bdr)'}`,
              background:isActive?`linear-gradient(135deg,${col}18,${col}08)`:'var(--sur)',
              boxShadow:isActive?`0 6px 24px ${col}35`:'0 2px 8px rgba(0,0,0,0.06)',
              transform:isActive?'translateY(-4px) scale(1.03)':'scale(1)',
              transition:'all .2s ease',
            }}>
              <UnitCatIcon cat={cat} size={80}/>
              <div style={{textAlign:'center'}}>
                <div style={{fontWeight:800,fontSize:'.95rem',color:isActive?col:'var(--txt)',marginBottom:'4px'}}>{cat}</div>
                <div style={{fontSize:'.68rem',color:'var(--txt3)',background:'var(--bg2)',padding:'2px 10px',borderRadius:'20px',border:'1px solid var(--bdr)',display:'inline-block'}}>{uniqueNames.size} generals</div>
              </div>
            </button>
          )
        })}
      </div>
      {activeCat&&(()=>{
        const col=CAT_COLOR[activeCat]
        const entries=(data[activeCat]||{})[activeStat]||[]
        const total=entries.reduce((s,e)=>s+e.value,0)
        const sc=BUFF_STAT_COLORS[activeStat]
        return(
          <div>
            <div style={{display:'flex',justifyContent:'center',gap:'10px',marginBottom:'1.5rem'}}>
              {['HP','Attack','Defense'].map(stat=>{
                const isOn=activeStat===stat
                const c=BUFF_STAT_COLORS[stat]
                const tot=(Object.values((data[activeCat]||{})[stat]||[]).reduce((s,e)=>s+(e.value||0),0)||entries.reduce((s,e)=>s+e.value,0))
                const ents=(data[activeCat]||{})[stat]||[]
                const t=ents.reduce((s,e)=>s+e.value,0)
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
                <UnitCatIcon cat={activeCat} size={36}/>
                <div>
                  <div style={{fontWeight:700,fontSize:'.88rem',color:col}}>{activeCat} · {activeStat}</div>
                  <div style={{fontSize:'.7rem',color:'var(--txt3)'}}>Total stackable buff from {entries.length} generals</div>
                </div>
              </div>
              <div style={{fontWeight:900,fontSize:'1.5rem',color:sc}}>+{total.toFixed(1)}%</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {entries.map((e,i)=>{
                const char=ALL.find(c=>c.name_en===e.name||c.name_en.toLowerCase()===e.name.toLowerCase())
                const fc=CC[e.faction]||'#888'
                const isTop=i<3
                return(
                  <div key={e.name+i} style={{
                    display:'flex',alignItems:'center',gap:'14px',padding:'12px 16px',borderRadius:'14px',
                    background:isTop?`linear-gradient(90deg,${sc}0a,var(--sur))`:'var(--sur)',
                    border:`1px solid ${isTop?sc+'44':'var(--bdr)'}`,transition:'transform .12s,box-shadow .12s',
                  }}
                    onMouseEnter={ev=>{ev.currentTarget.style.transform='translateY(-1px)';ev.currentTarget.style.boxShadow=`0 4px 14px ${sc}20`}}
                    onMouseLeave={ev=>{ev.currentTarget.style.transform='';ev.currentTarget.style.boxShadow=''}}>
                    <div style={{minWidth:'32px',textAlign:'center'}}>
                      {isTop
                        ?<div style={{width:28,height:28,borderRadius:'50%',background:sc,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'.75rem',margin:'0 auto'}}>{i+1}</div>
                        :<span style={{fontSize:'.7rem',fontWeight:700,color:'var(--txt3)'}}>{i+1}</span>}
                    </div>
                    <div style={{width:56,height:56,borderRadius:'50%',overflow:'hidden',flexShrink:0,border:`2.5px solid ${fc}`,background:fc+'22',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {char?.icon?<img src={char.icon} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}} alt={e.name}/>
                      :char?.image?<img src={char.image} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={e.name}/>
                      :<span style={{fontSize:'1.2rem',fontWeight:700,color:fc}}>{e.name[0]}</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap',marginBottom:'3px'}}>
                        <span style={{fontWeight:700,fontSize:'.92rem',color:'var(--txt)'}}>{e.name}</span>
                        <span style={{fontSize:'.65rem',color:'var(--txt3)'}}>{e.name_jp}</span>
                        {e.star6&&<span style={{fontSize:'.65rem',color:'#c9902a',fontWeight:800}}>☆6</span>}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <span style={{fontSize:'.62rem',padding:'1px 7px',borderRadius:'4px',background:fc+'22',color:fc,border:`1px solid ${fc}44`,fontWeight:700}}>{e.type}</span>
                        <span style={{fontSize:'.62rem',color:'var(--txt3)'}}>{FACTIONS.find(f=>f.id===e.faction)?.label||e.faction}</span>
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontWeight:900,fontSize:'1.1rem',color:sc}}>+{e.value.toFixed(1)}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
      {!activeCat&&(
        <div style={{textAlign:'center',padding:'4rem 1rem',color:'var(--txt3)'}}>
          <div style={{fontSize:'3rem',opacity:.15,marginBottom:'1rem'}}>⚔</div>
          <div style={{fontSize:'.9rem'}}>Select a unit type above to see CW buffs</div>
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
  const byName={}
  ALL.forEach(c=>{byName[c.name_en.toLowerCase()]=c;byName[c.name_en]=c})
  const getChar=n=>byName[n]||byName[n.toLowerCase()]||null
  return(
    <div className="tier-page-wrap">
      <div className="tier-page-header">
        <h2 className="tier-main-title">⚔ CW Metawatch</h2>
        <p className="tier-main-sub">Commonly Seen Armies · Last updated: Apr 2026</p>
      </div>
      <div className="tier-list">
        {['S','A','B','C'].map(tier=>{
          const {color,def}=TIER_DEFS[tier]
          const teams=META_TEAMS.filter(t=>t.tier===tier)
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
                  const chars=team.members.map(n=>getChar(n)).filter(Boolean)
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
  const[picker,setPicker]=useState(null)
  const[search,setSearch]=useState('')

  const COST={R:595,SR:800,UR:1750}
  const RCOL={R:'#3d9970',SR:'#3d6eb5',UR:'#c0392b'}
  const RBG={R:'#3d997018',SR:'#3d6eb518',UR:'#c0392b18'}

  const allChars=ALL.map(c=>{
    const rd=RARITY_DATA[c.name_en]
    return{...c,rarity:rd?.rarity||c.rarity||'SR'}
  }).filter(c=>RARITY_DATA[c.name_en]||c.image)

  const filtered=allChars.filter(c=>
    !search||(c.name_en.toLowerCase().includes(search.toLowerCase())||c.name_jp.includes(search))
  ).sort((a,b)=>a.name_en.localeCompare(b.name_en))

  const setSlot=(idx,char)=>{
    setSlots(p=>{const n=[...p];n[idx]=char;return n})
    setPicker(null);setSearch('')
  }
  const clearSlot=(idx)=>setSlots(p=>{const n=[...p];n[idx]=null;return n})
  const clearAll=()=>setSlots([null,null,null,null])

  const filled=slots.filter(Boolean)
  const total=filled.reduce((s,c)=>s+COST[RARITY_DATA[c.name_en]?.rarity||'SR'],0)
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
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',
        padding:'20px 28px',borderRadius:'20px',marginBottom:'2rem',
        background:'linear-gradient(135deg,#1a0a2e,#2d1255)',
        border:'1.5px solid #6a30c8',
        boxShadow:'0 8px 32px rgba(106,48,200,0.25)',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          <img src="/icons/Red_Crystal.png" alt="Red Crystal" style={{width:56,height:56,objectFit:"contain",flexShrink:0}}/>
          <div>
            <div style={{fontSize:'.72rem',color:'#b89fe0',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px'}}>Total Red Crystals</div>
            <div style={{fontSize:'2.4rem',fontWeight:900,color:'#e8c0ff',lineHeight:1}}>{total.toLocaleString()}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
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
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'2.5rem'}}>
        {slots.map((char,idx)=>{
          const rarity=char?RARITY_DATA[char.name_en]?.rarity||'SR':null
          const cost=char?COST[rarity]:null
          const fc=char?(CC[char.country]||'#888'):null
          const rc=rarity?RCOL[rarity]:'#888'
          return char?(
            <div key={idx} style={{
              borderRadius:'18px',overflow:'hidden',
              border:`2px solid ${rc}66`,
              background:`linear-gradient(160deg,${rc}12,var(--sur))`,
              boxShadow:`0 4px 20px ${rc}20`,
              display:'flex',flexDirection:'column',
              transition:'transform .15s',
            }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e=>e.currentTarget.style.transform=''}>
              {/* Portrait */}
              <div style={{position:'relative',height:'120px',background:fc+'18',overflow:'hidden'}}>
                {char.icon?<img src={char.icon} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={char.name_en}/>
                :char.image?<img src={char.image} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={char.name_en}/>
                :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'3rem',fontWeight:800,color:fc+'66'}}>{char.name_en[0]}</div>}
                {/* Rarity badge */}
                <div style={{position:'absolute',top:'8px',left:'8px',padding:'2px 8px',borderRadius:'6px',background:rc,color:'white',fontSize:'.65rem',fontWeight:800}}>{rarity}</div>
                {/* Remove btn */}
                <button onClick={()=>clearSlot(idx)} style={{position:'absolute',top:'6px',right:'6px',width:24,height:24,borderRadius:'50%',border:'none',background:'rgba(0,0,0,0.5)',color:'white',cursor:'pointer',fontSize:'.7rem',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              </div>
              {/* Info */}
              <div style={{padding:'10px 12px',flex:1}}>
                <div style={{fontWeight:700,fontSize:'.85rem',color:'var(--txt)',marginBottom:'2px'}}>{char.name_en}</div>
                <div style={{fontSize:'.65rem',color:'var(--txt3)',marginBottom:'6px'}}>{char.name_jp} · {FACTIONS.find(f=>f.id===char.country)?.label||char.country}</div>
                <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                  <img src="/icons/Red_Crystal.png" alt="RC" style={{width:18,height:18,objectFit:"contain",verticalAlign:"middle"}}/>
                  <span style={{fontWeight:800,fontSize:'.95rem',color:rc}}>{cost?.toLocaleString()}</span>
                </div>
              </div>
              {/* Replace btn */}
              <button onClick={()=>{setPicker(idx);setSearch('')}} style={{margin:'0 10px 10px',padding:'6px',borderRadius:'8px',border:`1px solid ${rc}44`,background:'transparent',color:rc,fontSize:'.7rem',cursor:'pointer',fontWeight:600}}>Replace</button>
            </div>
          ):(
            <button key={idx} onClick={()=>{setPicker(idx);setSearch('')}} style={{
              borderRadius:'18px',border:'2px dashed var(--bdr)',
              background:'var(--sur)',minHeight:'220px',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'8px',
              cursor:'pointer',transition:'all .15s',color:'var(--txt3)',
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#6a30c8';e.currentTarget.style.background='#6a30c808'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bdr)';e.currentTarget.style.background='var(--sur)'}}>
              <div style={{fontSize:'2rem',opacity:.3}}>＋</div>
              <div style={{fontSize:'.75rem',fontWeight:600}}>Slot {idx+1}</div>
              <div style={{fontSize:'.65rem',opacity:.6}}>Click to add</div>
            </button>
          )
        })}
      </div>

      {/* Rarity reference */}
      <div style={{display:'flex',justifyContent:'center',gap:'12px',marginBottom:'2rem',flexWrap:'wrap'}}>
        {[['R',595],['SR',800],['UR',1750]].map(([r,c])=>(
          <div key={r} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 18px',borderRadius:'10px',background:RBG[r],border:`1px solid ${RCOL[r]}44`}}>
            <span style={{fontWeight:800,fontSize:'.85rem',color:RCOL[r]}}>{r}</span>
            <span style={{fontSize:'.75rem',color:'var(--txt3)'}}><img src="/icons/Red_Crystal.png" alt="RC" style={{width:16,height:16,objectFit:"contain",verticalAlign:"middle",margin:"0 3px"}}/> {c.toLocaleString()}</span>
          </div>
        ))}
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
                        {c.icon?<img src={c.icon} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={c.name_en}/>
                        :c.image?<img src={c.image} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={c.name_en}/>
                        :<span style={{fontWeight:700,color:rc,fontSize:'1.1rem'}}>{c.name_en[0]}</span>}
                      </div>
                      <div style={{fontWeight:700,fontSize:'.68rem',color:'var(--txt)',textAlign:'center',lineHeight:1.2}}>{c.name_en}</div>
                      <div style={{padding:'1px 7px',borderRadius:'5px',background:rc,color:'white',fontSize:'.6rem',fontWeight:800}}>{rarity}</div>
                      <div style={{fontSize:'.62rem',color:rc,fontWeight:700}}><img src="/icons/Red_Crystal.png" alt="RC" style={{width:14,height:14,objectFit:"contain",verticalAlign:"middle",marginRight:2}}/>{COST[rarity]}</div>
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
