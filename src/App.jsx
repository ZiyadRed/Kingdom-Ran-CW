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
  {tier:'A',color:'#e07f48',name:'Hi Shin',   members:['Garo','Gakuei','Naki','Robin']},
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
              {c.image?<img src={c.image} className="p-img" alt={c.name_en}/>
                :<div className="p-ph" style={{background:CC[c.country]+'22',color:CC[c.country]||'#999'}}>{c.name_en[0]}</div>}
              <span className="p-name">{c.name_en}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// App
const PAGES=['Archive','Party Builder','Activation Order','CW Buffs','Tier List']
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
              <div className="logo-en">Kingdom Ran EN</div>
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
        {page==='Party Builder'    && <BuilderPage atk={atk} def={def} setSlot={setSlot} rm={rm} goSim={()=>setPage('Activation Order')} loadMetaTeam={loadMetaTeam}/>}
        {page==='Activation Order' && <SimPage atk={atk} def={def} goBuilder={()=>setPage('Party Builder')}/>}
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
          <input className="fac-search" placeholder="Search…" value={search} onChange={e=>{setSearch(e.target.value);setSelected(null)}}/>
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
            {selected.image&&<img src={selected.image} className="detail-portrait" alt={selected.name_en}/>}
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
    <div className="sk">
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
            {c.image
              ?<img src={c.image} className="meta-member-img" alt={c.name_en}/>
              :<div className="meta-member-ph" style={{background:CC[c.country]+'22',color:CC[c.country]||'#999'}}>{c.name_en[0]}</div>}
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
        {['S','A','B','C'].map(tier=>{
          const teams=META_TEAMS.filter(t=>t.tier===tier)
          const col=teams[0]?.color||'#999'
          return(
            <div key={tier} className="meta-tier-group">
              <div className="meta-tier-label" style={{color:col,borderLeftColor:col}}>
                <span className="meta-tier-letter" style={{background:col}}>{tier}</span>
                <span>Tier</span>
              </div>
              <div className="meta-grid">
                {teams.map((team,i)=><MetaTeamCard key={i} team={team} onLoad={loadMetaTeam}/>)}
              </div>
            </div>
          )
        })}
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
            {m.image&&<img src={m.image} className="slot-av" alt={m.name_en}/>}
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
          <StratCol label="⚔ Attacker" entries={st.attack} side="attack"/>
          <StratCol label="🛡 Defender" entries={st.defense} side="defense"/>
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
                      {general.image&&<img src={general.image} className="te-av" alt={general.name_en}/>}
                      <div><b className="te-name">{general.name_en}</b><span className="te-jp">{general.name_jp}</span></div>
                      <span className="te-tag" style={{background:side==='attack'?'rgba(192,57,43,.15)':'rgba(36,113,163,.15)',color:side==='attack'?'#e88':'#8ab'}}>{side==='attack'?'ATK':'DEF'}</span>
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
            {g.image&&<img src={g.image} className="f-chip-img" alt={g.name_en}/>}
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
    <div className="scol">
      <div className="scol-lbl" style={{color:ac,borderBottomColor:ac+'44'}}>{label}</div>
      {!entries.length?<p className="scol-none">None</p>:entries.map(({general:g,skills:gs})=>(
        <div key={g.id} className="scol-gen">
          <div className="scol-gen-hdr" style={{color:ac}}>
            {g.image&&<img src={g.image} className="scol-av" alt={g.name_en}/>}
            <b>{g.name_en}</b><span className="scol-jp">{g.name_jp}</span>
          </div>
          {gs.map((sk,i)=><SkillCard key={i} skill={sk}/>)}
        </div>
      ))}
    </div>
  )
}

// ── CW BUFFS ──────────────────────────────────────────────────────────────────
function BuffsPage(){
  const[cat,setCat]=useState(null)
  const[stat,setStat]=useState(null)
  const buffs=cwBuffsData.buffs
  const catCnt=Object.fromEntries(BUFF_CATS.map(c=>[c.id,buffs.filter(b=>b.unit_cat===c.id).length]))
  const statsForCat=cat?[...new Set(buffs.filter(b=>b.unit_cat===cat).map(b=>b.stat))].sort():[]
  const filtered=cat&&stat?buffs.filter(b=>b.unit_cat===cat&&b.stat===stat):[]
  const byChar={}
  for(const b of filtered){if(!byChar[b.char_id])byChar[b.char_id]={...b,list:[]};byChar[b.char_id].list.push(b)}
  const chars=Object.values(byChar).sort((a,b)=>b.list.reduce((s,x)=>s+x.pct,0)-a.list.reduce((s,x)=>s+x.pct,0))
  const grand=filtered.reduce((s,b)=>s+b.pct,0)
  const isPct=!['Repair Speed','Coin Cost','Material Cost','Ore Cost','Terrain Bonus','Status Resistance','Other'].includes(stat)
  return(
    <div className="main-page">
      <h2 className="pg-title">CW Buffs</h2>
      <p className="pg-sub">Administration skills active during Castle Wars even when not deployed.</p>
      <div className="cat-pills">
        {BUFF_CATS.map(c=>{
          const n=catCnt[c.id]||0;if(!n)return null
          return(<button key={c.id} className={`cat-pill${cat===c.id?' active':''}`} onClick={()=>{setCat(cat===c.id?null:c.id);setStat(null)}}>
            <UnitBadge cat={c.id} size={22}/><span>{c.label}</span><span className="cat-n">{n}</span>
          </button>)
        })}
      </div>
      {cat&&(<div className="stat-pills">
        <span className="stat-lbl">Sub-category:</span>
        {statsForCat.map(s=>{
          const t=buffs.filter(b=>b.unit_cat===cat&&b.stat===s).reduce((x,b)=>x+b.pct,0)
          return(<button key={s} className={`stat-pill${stat===s?' active':''}`} onClick={()=>setStat(stat===s?null:s)}>
            <span>{s}</span>{t>0&&<span className="stat-pct"> +{t.toFixed(1)}%</span>}
          </button>)
        })}
      </div>)}
      {cat&&stat&&(
        <div className="buff-panel">
          <div className="buff-panel-hdr">
            <div className="buff-panel-title-row"><UnitBadge cat={cat} size={32}/><span className="buff-res-title">{cat} · {stat}</span></div>
            {isPct&&grand>0&&<span className="buff-grand">Stack total: <b>+{grand.toFixed(1)}%</b></span>}
          </div>
          <div className="buff-cards">
            {chars.map(entry=>{
              const col=CC[entry.char_country]||'#999'
              const tot=entry.list.reduce((s,b)=>s+b.pct,0)
              return(
                <div key={entry.char_id} className="bc" style={{borderTopColor:col}}>
                  <div className="bc-top">
                    {entry.char_image?<img src={entry.char_image} className="bc-av" alt={entry.char_name}/>
                      :<div className="bc-ph" style={{color:col,background:col+'22'}}>{entry.char_name[0]}</div>}
                    <div><div className="bc-name">{entry.char_name}</div>{tot>0&&<div className="bc-pct" style={{color:col}}>+{tot.toFixed(1)}%</div>}</div>
                  </div>
                  <div className="bc-effs">
                    {entry.list.map((b,i)=>(
                      <div key={i} className="bc-eff">
                        <span className="bc-val">{b.effect}</span>
                        {b.condition&&!b.condition.includes('deployed')&&!b.condition.includes('CW battle')&&(<span className="bc-cond">{b.condition}</span>)}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
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
                    <div key={ti} className="tier-team-card" style={{borderTopColor:color}}>
                      <div className="tier-team-name">{team.name}</div>
                      <div className="tier-team-members">
                        {chars.map((c,ci)=>{
                          const hasStar6=(c.skills||[]).some(s=>s.star6)
                          return(
                            <div key={ci} className="tier-member">
                              <div className="tier-member-img-wrap">
                                {c.image
                                  ?<img src={c.image} className="tier-member-img" alt={c.name_en}/>
                                  :<div className="tier-member-ph" style={{background:CC[c.country]+'33',color:CC[c.country]||'#888'}}>{c.name_en[0]}</div>}
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
