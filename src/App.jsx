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

// Picker
function Picker({onSelect,onClose,excl=[]}){
  const[q,setQ]=useState(''),ref=useRef(null)
  useEffect(()=>{ref.current?.focus()},[])
  const chars=ALL.filter(c=>!excl.includes(c.id)&&(!q||(c.name_en.toLowerCase().includes(q.toLowerCase())||c.name_jp.includes(q))))
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

// App
const PAGES=['Archive','Party Builder','Simulate','CW Buffs','Tier List']
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
    ?ALL.filter(c=>c.name_en.toLowerCase().includes(search.toLowerCase())||c.name_jp.includes(search))
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

// ── CW BUFFS ──────────────────────────────────────────────────────────────────
const BUFF_UNIT_CATS = ['Infantry','Cavalry','Archer','Shield']
const BUFF_STAT_COLORS = {HP:'#1a8a72', Attack:'#c0392b', Defense:'#2471a3'}
const CAT_COLOR = {Infantry:'#b8880a', Cavalry:'#c0392b', Archer:'#27ae60', Shield:'#6a4fc8'}

function UnitCatIcon({cat, size=48}){
  if(cat==='Infantry') return(
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="ig1" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f5e070"/>
          <stop offset="50%" stopColor="#d4a020"/>
          <stop offset="100%" stopColor="#8a6000"/>
        </radialGradient>
        <radialGradient id="ig2" cx="45%" cy="30%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,200,0.35)"/>
          <stop offset="100%" stopColor="rgba(255,255,200,0)"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#ig1)" stroke="#c8900a" strokeWidth="2"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,240,100,0.4)" strokeWidth="2"/>
      <circle cx="50" cy="50" r="48" fill="url(#ig2)"/>
      {/* Mace/hammer: handle diagonal, rectangular head */}
      <g transform="rotate(-40, 50, 50)">
        <rect x="46" y="20" width="8" height="38" rx="4" fill="white" opacity="0.95"/>
        <rect x="32" y="15" width="36" height="20" rx="5" fill="white" opacity="0.95"/>
        <rect x="35" y="12" width="30" height="6" rx="3" fill="white" opacity="0.7"/>
      </g>
    </svg>
  )
  if(cat==='Cavalry') return(
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="cg1" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ff5555"/>
          <stop offset="45%" stopColor="#d42020"/>
          <stop offset="100%" stopColor="#7a0a0a"/>
        </linearGradient>
        <radialGradient id="cg2" cx="40%" cy="30%" r="55%">
          <stop offset="0%" stopColor="rgba(255,200,200,0.4)"/>
          <stop offset="100%" stopColor="rgba(255,200,200,0)"/>
        </radialGradient>
      </defs>
      <path d="M50 4L96 50L50 96L4 50Z" fill="url(#cg1)" stroke="#ff8080" strokeWidth="2"/>
      <path d="M50 12L88 50L50 88L12 50Z" fill="none" stroke="rgba(255,150,150,0.3)" strokeWidth="1.5"/>
      <path d="M50 4L96 50L50 96L4 50Z" fill="url(#cg2)"/>
      {/* Horse head silhouette facing left */}
      <path d="M62 28 C68 28 74 32 76 38 C78 44 76 50 72 54 C70 56 67 57 65 58 L63 66 C62 68 60 69 58 68 L55 67 C53 66 52 64 53 62 L54 58 C50 57 46 55 43 51 C39 46 38 40 40 35 C42 30 47 27 52 27 C55 27 58 28 60 29 Z" fill="white" opacity="0.95"/>
      <path d="M62 28 C65 24 68 22 70 23 C72 24 72 27 70 29 C68 30 65 30 63 30 Z" fill="white" opacity="0.95"/>
      <circle cx="57" cy="36" r="2.5" fill="#d42020"/>
    </svg>
  )
  if(cat==='Archer') return(
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="ag1" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#50d060"/>
          <stop offset="45%" stopColor="#22a030"/>
          <stop offset="100%" stopColor="#0a5018"/>
        </linearGradient>
        <radialGradient id="ag2" cx="40%" cy="25%" r="55%">
          <stop offset="0%" stopColor="rgba(180,255,180,0.45)"/>
          <stop offset="100%" stopColor="rgba(180,255,180,0)"/>
        </radialGradient>
      </defs>
      {/* Pentagon flat-bottom */}
      <path d="M50 5L95 36L78 92L22 92L5 36Z" fill="url(#ag1)" stroke="#50e870" strokeWidth="2"/>
      <path d="M50 13L87 40L72 86L28 86L13 40Z" fill="none" stroke="rgba(150,255,150,0.3)" strokeWidth="1.5"/>
      <path d="M50 5L95 36L78 92L22 92L5 36Z" fill="url(#ag2)"/>
      {/* Bow */}
      <path d="M28 65 Q50 30 72 65" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <line x1="28" y1="65" x2="72" y2="65" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
      {/* Arrow pointing up */}
      <line x1="50" y1="20" x2="50" y2="72" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      {/* Arrowhead */}
      <path d="M50 14 L44 26 L50 22 L56 26 Z" fill="white"/>
      {/* Tail feathers */}
      <path d="M50 72 L44 80 L50 76 L56 80 Z" fill="white" opacity="0.8"/>
      {/* Bow tips curl */}
      <circle cx="28" cy="65" r="3" fill="white" opacity="0.8"/>
      <circle cx="72" cy="65" r="3" fill="white" opacity="0.8"/>
    </svg>
  )
  // Shield — purple/blue rounded square with hourglass shield
  return(
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="sg1" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#9070e8"/>
          <stop offset="50%" stopColor="#5535b0"/>
          <stop offset="100%" stopColor="#2a1870"/>
        </linearGradient>
        <radialGradient id="sg2" cx="40%" cy="25%" r="60%">
          <stop offset="0%" stopColor="rgba(180,200,255,0.45)"/>
          <stop offset="100%" stopColor="rgba(180,200,255,0)"/>
        </radialGradient>
      </defs>
      {/* Outer rounded square with blue rim */}
      <rect x="3" y="3" width="94" height="94" rx="18" fill="url(#sg1)" stroke="#88aaff" strokeWidth="3"/>
      <rect x="3" y="3" width="94" height="94" rx="18" fill="url(#sg2)"/>
      {/* Inner border */}
      <rect x="10" y="10" width="80" height="80" rx="13" fill="none" stroke="rgba(180,180,255,0.3)" strokeWidth="2"/>
      {/* Hourglass shield shape — wide top, narrow waist, wide bottom */}
      <path d="M50 18 C50 18 70 18 72 22 C74 28 66 40 64 48 C66 56 74 68 72 76 C70 80 50 82 50 82 C50 82 30 80 28 76 C26 68 34 56 36 48 C34 40 26 28 28 22 C30 18 50 18 50 18 Z" fill="white" opacity="0.95"/>
    </svg>
  )
}

function BuffsPage(){
  const[activeCat,setActiveCat]=useState(null)
  const[openStats,setOpenStats]=useState({})
  const data=cwBuffsData

  const toggleStat=(cat,stat)=>{
    const k=`${cat}__${stat}`
    setOpenStats(p=>({...p,[k]:!p[k]}))
  }
  const handleCat=(cat)=>{
    if(activeCat===cat){setActiveCat(null)}
    else{setActiveCat(cat);setOpenStats(p=>({...p,[`${cat}__HP`]:true}))}
  }

  return(
    <div className="main-page">
      <h2 className="pg-title">CW Buffs</h2>
      <p className="pg-sub">Administration skills active during Castle Wars — stackable buffs by unit type.</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:'10px',marginBottom:'1.5rem',maxWidth:'680px'}}>
        {BUFF_UNIT_CATS.map(cat=>{
          const isActive=activeCat===cat
          const col=CAT_COLOR[cat]
          const uniqueNames=new Set(Object.values(data[cat]||{}).flat().map(e=>e.name))
          return(
            <button key={cat} onClick={()=>handleCat(cat)} style={{
              display:'flex',flexDirection:'column',alignItems:'center',gap:'7px',
              padding:'14px 8px',borderRadius:'14px',cursor:'pointer',
              border:`${isActive?'2px':'1.5px'} solid ${isActive?col:'var(--bdr)'}`,
              background:isActive?col+'14':'var(--sur)',
              boxShadow:isActive?`0 2px 14px ${col}30`:'none',
              transform:isActive?'translateY(-2px)':'none',
              transition:'all .18s',
            }}>
              <UnitCatIcon cat={cat} size={44}/>
              <span style={{fontWeight:700,fontSize:'.78rem',color:isActive?col:'var(--txt)'}}>{cat}</span>
              <span style={{fontSize:'.62rem',color:'var(--txt3)',background:'var(--bg2)',padding:'1px 7px',borderRadius:'10px',border:'1px solid var(--bdr)'}}>{uniqueNames.size} chars</span>
            </button>
          )
        })}
      </div>

      {activeCat&&(
        <div style={{maxWidth:'720px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',marginBottom:'12px',borderLeft:`4px solid ${CAT_COLOR[activeCat]}`,background:'var(--sur)',borderRadius:'0 8px 8px 0'}}>
            <UnitCatIcon cat={activeCat} size={32}/>
            <div>
              <div style={{fontWeight:700,fontSize:'.9rem',color:CAT_COLOR[activeCat]}}>{activeCat} Buffs</div>
              <div style={{fontSize:'.72rem',color:'var(--txt3)'}}>Click a stat to expand characters and stack total</div>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {['HP','Attack','Defense'].map(stat=>{
              const entries=(data[activeCat]||{})[stat]||[]
              const total=entries.reduce((s,e)=>s+e.value,0)
              const isOpen=!!openStats[`${activeCat}__${stat}`]
              const sc=BUFF_STAT_COLORS[stat]
              const catCol=CAT_COLOR[activeCat]
              return(
                <div key={stat} style={{border:`1px solid ${isOpen?catCol+'55':'var(--bdr)'}`,borderRadius:'12px',overflow:'hidden',background:'var(--sur2)',transition:'border-color .2s'}}>
                  <button onClick={()=>toggleStat(activeCat,stat)} style={{
                    width:'100%',display:'flex',alignItems:'center',gap:'8px',
                    padding:'11px 14px',background:isOpen?catCol+'10':'transparent',
                    border:'none',cursor:'pointer',
                    borderBottom:isOpen?`1px solid ${catCol}33`:'1px solid transparent',
                    transition:'background .15s',
                  }}>
                    <span style={{fontSize:'14px',color:sc}}>{stat==='HP'?'♥':stat==='Attack'?'⚔':'⛨'}</span>
                    <span style={{fontWeight:700,fontSize:'.84rem',color:'var(--txt)',flex:1,textAlign:'left'}}>{stat}</span>
                    <span style={{fontSize:'.7rem',fontWeight:700,color:sc,background:sc+'18',border:`1px solid ${sc}44`,padding:'2px 8px',borderRadius:'20px'}}>Stack: +{total.toFixed(1)}%</span>
                    <span style={{fontSize:'.65rem',color:'var(--txt3)',background:'var(--bg2)',padding:'2px 7px',borderRadius:'20px',border:'1px solid var(--bdr)'}}>{entries.length}</span>
                    <span style={{color:catCol,fontWeight:700,fontSize:'1rem',transform:isOpen?'rotate(90deg)':'rotate(0)',transition:'transform .2s'}}>›</span>
                  </button>
                  {isOpen&&(
                    <div style={{padding:'10px',display:'flex',flexDirection:'column',gap:'5px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 12px',borderRadius:'8px',marginBottom:'4px',background:sc+'10',border:`1px solid ${sc}30`}}>
                        <span style={{fontSize:'13px',color:sc}}>{stat==='HP'?'♥':stat==='Attack'?'⚔':'⛨'}</span>
                        <span style={{fontSize:'.76rem',color:'var(--txt2)',flex:1}}>Total stackable <b style={{color:sc}}>{stat}</b> buff</span>
                        <span style={{fontWeight:800,fontSize:'.95rem',color:sc}}>+{total.toFixed(1)}%</span>
                      </div>
                      {entries.map((e,i)=>{
                        const char=ALL.find(c=>c.name_en===e.name||c.name_en.toLowerCase()===e.name.toLowerCase())
                        const fc=CC[e.faction]||'#888'
                        const barW=Math.min(100,(e.value/25)*100).toFixed(1)
                        return(
                          <div key={e.name+i} style={{display:'flex',alignItems:'center',gap:'9px',padding:'7px 11px',borderRadius:'10px',background:'var(--sur)',border:'1px solid var(--bdr)',transition:'transform .12s'}}
                            onMouseEnter={ev=>{ev.currentTarget.style.transform='translateY(-1px)'}}
                            onMouseLeave={ev=>{ev.currentTarget.style.transform=''}}>
                            <span style={{minWidth:'20px',textAlign:'center',fontSize:'.65rem',fontWeight:700,color:i<3?catCol:'var(--txt3)'}}># {i+1}</span>
                            <div style={{width:34,height:34,borderRadius:'50%',overflow:'hidden',flexShrink:0,border:`2px solid ${fc}`,background:fc+'22',display:'flex',alignItems:'center',justifyContent:'center'}}>
                              {char?.icon?<img src={char.icon} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}} alt={e.name}/>
                              :char?.image?<img src={char.image} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={e.name}/>
                              :<span style={{fontSize:'.85rem',fontWeight:700,color:fc}}>{e.name[0]}</span>}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'baseline',gap:'5px',marginBottom:'3px'}}>
                                <span style={{fontWeight:700,fontSize:'.78rem',color:'var(--txt)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.name}</span>
                                <span style={{fontSize:'.6rem',color:'var(--txt3)',flexShrink:0}}>{e.name_jp}</span>
                                {e.star6&&<span style={{fontSize:'.58rem',color:'#c9902a',flexShrink:0}}>☆6</span>}
                                <span style={{fontSize:'.55rem',padding:'1px 5px',borderRadius:'4px',background:fc+'22',color:fc,border:`1px solid ${fc}44`,fontWeight:700,flexShrink:0}}>{e.type}</span>
                              </div>
                              <div style={{height:'4px',borderRadius:'2px',background:'var(--bg3)',overflow:'hidden'}}>
                                <div style={{height:'100%',borderRadius:'2px',width:barW+'%',background:sc,transition:'width .5s ease'}}/>
                              </div>
                            </div>
                            <span style={{fontWeight:800,fontSize:'.85rem',color:sc,minWidth:'46px',textAlign:'right',flexShrink:0}}>+{e.value.toFixed(1)}%</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {!activeCat&&(
        <div style={{textAlign:'center',padding:'3rem 1rem',color:'var(--txt3)',fontSize:'.82rem',maxWidth:'360px',margin:'0 auto'}}>
          <div style={{fontSize:'2rem',opacity:.3,marginBottom:'.75rem'}}>⚔</div>
          Select a unit type above to see CW administration buffs
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
