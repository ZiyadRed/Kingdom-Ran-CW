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

const ALL_CHARACTERS = [
  ...mountainFolk, ...qin, ...qinBatch2, ...qinMajor,
  ...zhao, ...zhaoBatch2, ...zhaoMajor, ...otherStates,
  ...chu, ...chuMajor, ...wei, ...yan, ...qi,
  ...aiYanMajor, ...misc, ...misc2,
].filter(c => c.country !== 'unknown')

const FACTIONS = [
  { id:'qin',           label:'Qin',           jp:'秦',     color:'#c0392b' },
  { id:'zhao',          label:'Zhao',          jp:'趙',     color:'#2471a3' },
  { id:'chu',           label:'Chu',           jp:'楚',     color:'#7d3c98' },
  { id:'wei',           label:'Wei',           jp:'魏',     color:'#148f77' },
  { id:'yan',           label:'Yan',           jp:'燕',     color:'#117a65' },
  { id:'ai',            label:'Ai',            jp:'毐',     color:'#6c3483' },
  { id:'han',           label:'Han',           jp:'韓',     color:'#b7950b' },
  { id:'qi',            label:'Qi',            jp:'斉',     color:'#ba4a00' },
  { id:'mountain_folk', label:'Mountain Folk', jp:'山の民',  color:'#6e5a2a' },
]
const CC = Object.fromEntries(FACTIONS.map(f=>[f.id,f.color]))

const TYPE_COLOR = { Combat:'#c0392b', Strategy:'#1a6fa8', Administration:'#1d7a4a' }

const BUFF_CATS = [
  {id:'Cavalry',             label:'Cavalry',       icon:'🐴'},
  {id:'Infantry',            label:'Infantry',      icon:'⚔'},
  {id:'Archer',              label:'Archer',        icon:'🏹'},
  {id:'Shield',              label:'Shield',        icon:'🛡'},
  {id:'War Machine',         label:'War Machine',   icon:'⚙'},
  {id:'Attack War Machine',  label:'Atk W.M.',      icon:'💥'},
  {id:'Defense War Machine', label:'Def W.M.',      icon:'🔩'},
  {id:'Terrain',             label:'Terrain',       icon:'🗺'},
  {id:'CW Repair',           label:'CW Repair',     icon:'🔧'},
]

// ── Simulate ─────────────────────────────────────────────────────────────────
function simulate(atk, def) {
  const strat = {attack:[], defense:[]}
  for (const g of atk) { const s=(g.skills||[]).filter(s=>s.type==='Strategy'); if(s.length) strat.attack.push({general:g,skills:s}) }
  for (const g of def) { const s=(g.skills||[]).filter(s=>s.type==='Strategy'); if(s.length) strat.defense.push({general:g,skills:s}) }
  const aq=atk.map(g=>[...(g.skills||[]).filter(s=>s.type==='Combat')].reverse())
  const dq=def.map(g=>[...(g.skills||[]).filter(s=>s.type==='Combat')].reverse())
  const turns=[]
  for(let t=1;t<=4;t++){
    const e=[]
    const mx=Math.max(atk.length,def.length)
    for(let i=0;i<mx;i++){
      if(i<atk.length) e.push({general:atk[i],skill:aq[i].shift()||null,side:'attack'})
      if(i<def.length) e.push({general:def[i],skill:dq[i].shift()||null,side:'defense'})
    }
    turns.push({turn:t,entries:e})
  }
  return {strat,turns}
}

// ── General Picker Modal ─────────────────────────────────────────────────────
function GeneralPicker({onSelect, onClose, excludeIds=[]}) {
  const [search,setSearch]=useState('')
  const [faction,setFaction]=useState('all')
  const ref=useRef(null)
  useEffect(()=>{ ref.current?.focus() },[])
  const chars=ALL_CHARACTERS.filter(c=>{
    if(excludeIds.includes(c.id)) return false
    if(faction!=='all'&&c.country!==faction) return false
    if(search){ const s=search.toLowerCase(); return c.name_en.toLowerCase().includes(s)||c.name_jp.includes(search) }
    return true
  })
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Select General</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-search-row">
          <input ref={ref} className="modal-search" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
          <select className="modal-faction" value={faction} onChange={e=>setFaction(e.target.value)}>
            <option value="all">All Factions</option>
            {FACTIONS.map(f=><option key={f.id} value={f.id}>{f.label} {f.jp}</option>)}
          </select>
        </div>
        <div className="modal-grid">
          {chars.map(c=>(
            <button key={c.id} className="modal-char-btn" style={{borderTopColor:CC[c.country]||'#444'}} onClick={()=>{onSelect(c);onClose()}}>
              {c.image?<img src={c.image} alt={c.name_en} className="modal-char-img"/>:<div className="modal-char-ph" style={{background:(CC[c.country]||'#444')+'22',color:CC[c.country]||'#888'}}>{c.name_en[0]}</div>}
              <span className="modal-char-name">{c.name_en}</span>
              <span className="modal-char-jp">{c.name_jp}</span>
            </button>
          ))}
          {!chars.length&&<p className="empty-note">No generals found.</p>}
        </div>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
const PAGES=['Skill Archive','Party Builder','Activation Order','CW Buffs']

export default function App() {
  const [page,setPage]=useState('Skill Archive')
  const [atkParty,setAtkParty]=useState([])
  const [defParty,setDefParty]=useState([])
  const [search,setSearch]=useState('')
  const [addingTo,setAddingTo]=useState('attack')

  const toggleParty=(char,side)=>{
    const set=side==='attack'?setAtkParty:setDefParty
    set(prev=>prev.find(p=>p.id===char.id)?prev.filter(p=>p.id!==char.id):prev.length>=4?prev:[...prev,char])
  }
  const removeFrom=(char,side)=>{ (side==='attack'?setAtkParty:setDefParty)(p=>p.filter(x=>x.id!==char.id)) }
  const setSlot=(char,side,idx)=>{
    const set=side==='attack'?setAtkParty:setDefParty
    set(prev=>{ const n=[...prev]; const e=n.findIndex(p=>p.id===char.id); if(e!==-1)n.splice(e,1); n[idx]=char; return n.filter(Boolean) })
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <div className="site-title">
            <span className="title-emblem">⚔</span>
            <div>
              <span className="title-kanji">キングダム乱</span>
              <h1>Kingdom Ran EN</h1>
            </div>
          </div>
          <nav className="site-nav">
            {PAGES.map(p=>(
              <button key={p} className={`nav-btn${page===p?' active':''}`} onClick={()=>setPage(p)}>
                {p}
                {p==='Party Builder'&&(atkParty.length+defParty.length>0)&&<span className="nav-badge">{atkParty.length+defParty.length}</span>}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main-content">
        {page==='Skill Archive'    && <ArchivePage atkParty={atkParty} defParty={defParty} toggleParty={toggleParty} addingTo={addingTo} setAddingTo={setAddingTo} search={search} setSearch={setSearch}/>}
        {page==='Party Builder'    && <BuilderPage atkParty={atkParty} defParty={defParty} setSlot={setSlot} removeFrom={removeFrom} goSim={()=>setPage('Activation Order')}/>}
        {page==='Activation Order' && <SimPage atkParty={atkParty} defParty={defParty} goBuilder={()=>setPage('Party Builder')}/>}
        {page==='CW Buffs'         && <BuffsPage/>}
      </main>

      <footer className="site-footer">
        <p>Fan-made English resource · Kingdom Ran (キングダム乱) · {ALL_CHARACTERS.length} generals · Not affiliated with Cygames</p>
      </footer>
    </div>
  )
}

// ── Skill Archive ─────────────────────────────────────────────────────────────
function ArchivePage({atkParty,defParty,toggleParty,addingTo,setAddingTo,search,setSearch}) {
  const [open,setOpen]=useState({})
  const sl=search.toLowerCase()
  const filtered=search?ALL_CHARACTERS.filter(c=>c.name_en.toLowerCase().includes(sl)||c.name_jp.includes(search)):null

  return (
    <section className="archive-page">
      <div className="archive-toolbar">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input className="search-input" placeholder="Search generals…" value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<button className="search-clear" onClick={()=>setSearch('')}>✕</button>}
        </div>
        <div className="side-selector">
          <button className={`side-btn atk-btn${addingTo==='attack'?' active':''}`} onClick={()=>setAddingTo('attack')}>⚔ Attack</button>
          <button className={`side-btn def-btn${addingTo==='defense'?' active':''}`} onClick={()=>setAddingTo('defense')}>🛡 Defense</button>
        </div>
      </div>

      <div className="party-status-bar">
        <div className="ps-side ps-atk">
          <span className="ps-icon">⚔</span>
          <span className="ps-names">{atkParty.length?atkParty.map(c=>c.name_en).join(' · '):'Empty'}</span>
          <span className="ps-count">{atkParty.length}/4</span>
        </div>
        <div className="ps-side ps-def">
          <span className="ps-icon">🛡</span>
          <span className="ps-names">{defParty.length?defParty.map(c=>c.name_en).join(' · '):'Empty'}</span>
          <span className="ps-count">{defParty.length}/4</span>
        </div>
      </div>

      {filtered?(
        <div>
          <p className="result-count">{filtered.length} result{filtered.length!==1?'s':''}</p>
          <div className="char-grid">
            {filtered.map(c=><CharCard key={c.id} char={c} inAtk={atkParty.some(p=>p.id===c.id)} inDef={defParty.some(p=>p.id===c.id)} addingTo={addingTo} onToggle={()=>toggleParty(c,addingTo)} atkFull={atkParty.length>=4} defFull={defParty.length>=4}/>)}
          </div>
        </div>
      ):(
        <div className="faction-list">
          {FACTIONS.map(f=>{
            const chars=ALL_CHARACTERS.filter(c=>c.country===f.id)
            if(!chars.length) return null
            return (
              <div key={f.id} className="faction-section">
                <button className="faction-hdr" onClick={()=>setOpen(o=>({...o,[f.id]:!o[f.id]}))}>
                  <span className="faction-dot" style={{background:f.color}}/>
                  <span className="faction-en">{f.label}</span>
                  <span className="faction-jp">{f.jp}</span>
                  <span className="faction-cnt">{chars.length}</span>
                  <span className="faction-chev">{open[f.id]?'▲':'▼'}</span>
                </button>
                {open[f.id]&&(
                  <div className="char-grid faction-grid">
                    {chars.map(c=><CharCard key={c.id} char={c} inAtk={atkParty.some(p=>p.id===c.id)} inDef={defParty.some(p=>p.id===c.id)} addingTo={addingTo} onToggle={()=>toggleParty(c,addingTo)} atkFull={atkParty.length>=4} defFull={defParty.length>=4}/>)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function CharCard({char,inAtk,inDef,addingTo,onToggle,atkFull,defFull}) {
  const [expanded,setExpanded]=useState(false)
  const inCur=addingTo==='attack'?inAtk:inDef
  const full=addingTo==='attack'?atkFull:defFull
  const col=CC[char.country]||'#555'
  let badge=null
  if(inAtk&&inDef) badge=<span className="card-badge badge-both">Both</span>
  else if(inAtk)   badge=<span className="card-badge badge-atk">⚔ ATK</span>
  else if(inDef)   badge=<span className="card-badge badge-def">🛡 DEF</span>

  return (
    <div className="char-card" style={{'--cc':col}}>
      <div className="char-card-img-wrap" style={{borderTopColor:col}}>
        {char.image?<img src={char.image} alt={char.name_en} className="char-img" loading="lazy"/>
          :<div className="char-img-ph" style={{background:col+'22'}}><span style={{color:col}}>{char.name_en[0]}</span></div>}
        {badge&&<div className="card-badge-wrap">{badge}</div>}
      </div>
      <div className="char-card-body">
        <div className="char-names">
          <span className="char-en">{char.name_en}</span>
          <span className="char-jp">{char.name_jp}</span>
        </div>
        <div className="char-actions">
          <button className="btn-expand" onClick={()=>setExpanded(e=>!e)}>{expanded?'▲ Hide':'▼ Skills'}</button>
          <button className={`btn-add${inCur?' btn-rem':''}`}
            style={inCur?{}:{background:addingTo==='attack'?'#c0392b':'#1a6fa8'}}
            onClick={onToggle} disabled={!inCur&&full}>
            {inCur?'✕ Remove':addingTo==='attack'?'+ ATK':'+ DEF'}
          </button>
        </div>
      </div>
      {expanded&&(
        <div className="skill-panel">
          {(char.skills||[]).length>0
            ?char.skills.map((s,i)=><SkillCard key={i} skill={s}/>)
            :<p className="empty-note">⏳ Translation pending</p>}
        </div>
      )}
    </div>
  )
}

function SkillCard({skill}) {
  const col=TYPE_COLOR[skill.type]||'#555'
  const isAdmin=skill.type==='Administration'
  return (
    <div className="skill-card">
      <div className="skill-card-header" style={{borderLeftColor:col}}>
        <div className="skill-card-title">
          <span className="skill-card-name">{skill.name_en}</span>
          <span className="skill-card-jp">{skill.name_jp}</span>
        </div>
        <div className="skill-card-tags">
          {skill.star6&&<span className="tag tag-star6">☆6</span>}
          <span className="tag" style={{background:col}}>{skill.type}</span>
          {isAdmin&&<span className="tag tag-map">Map</span>}
        </div>
      </div>
      <div className="skill-effects">
        {skill.effects.map((eff,i)=>(
          <div key={i} className="effect-row">
            {eff.condition&&<div className="eff-cond">📌 {eff.condition}</div>}
            <div className="eff-body">
              <span className="eff-target">{eff.target}</span>
              <span className="eff-arrow">→</span>
              <span className="eff-text">{eff.effect}</span>
              {eff.duration&&<span className="eff-dur">[{eff.duration}]</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Party Builder ─────────────────────────────────────────────────────────────
function BuilderPage({atkParty,defParty,setSlot,removeFrom,goSim}) {
  const [picker,setPicker]=useState(null)
  const excl=[...atkParty,...defParty].map(c=>c.id)
  return (
    <section className="builder-page">
      {picker&&<GeneralPicker onSelect={c=>setSlot(c,picker.side,picker.idx)} onClose={()=>setPicker(null)} excludeIds={excl}/>}
      <h2 className="page-title">Party Builder</h2>
      <p className="page-hint">Click any slot to add a general. Slot order = skill firing order.</p>
      <div className="dual-party">
        <Formation side="attack"  label="⚔ Attacking" party={atkParty}  onSlot={i=>setPicker({side:'attack',idx:i})}  onRemove={c=>removeFrom(c,'attack')}/>
        <div className="dual-vs">VS</div>
        <Formation side="defense" label="🛡 Defending" party={defParty} onSlot={i=>setPicker({side:'defense',idx:i})} onRemove={c=>removeFrom(c,'defense')}/>
      </div>
      {(atkParty.length||defParty.length)?<div className="sim-cta"><button className="btn-sim" onClick={goSim}>▶ Simulate Activation Order</button></div>:null}
    </section>
  )
}

function Formation({side,label,party,onSlot,onRemove}) {
  const col=side==='attack'?'#c0392b':'#1a6fa8'
  return (
    <div className="formation">
      <div className="formation-label" style={{color:col,borderBottomColor:col+'55'}}>{label}</div>
      <div className="slot-list">
        {Array.from({length:4}).map((_,i)=>{
          const m=party[i]
          const mc=m?CC[m.country]||'#555':col
          return m?(
            <div key={i} className="slot occupied" style={{borderLeftColor:mc}}>
              <span className="slot-num" style={{color:col}}>{i+1}</span>
              {m.image&&<img src={m.image} alt={m.name_en} className="slot-img"/>}
              <div className="slot-info">
                <span className="slot-name">{m.name_en}</span>
                <span className="slot-jp">{m.name_jp}</span>
                <div className="slot-dots">
                  {(m.skills||[]).filter(s=>s.type==='Combat').map((s,si)=><span key={si} className="sdot sdot-c" title={s.name_en}>C{si+1}</span>)}
                  {(m.skills||[]).filter(s=>s.type==='Strategy').map((s,si)=><span key={si} className={`sdot sdot-s${s.star6?' sdot-6':''}`} title={s.name_en}>{s.star6?'☆':'S'}</span>)}
                </div>
              </div>
              <button className="slot-rm" onClick={()=>onRemove(m)}>✕</button>
            </div>
          ):(
            <button key={i} className="slot empty" style={{'--sc':col}} onClick={()=>onSlot(i)}>
              <span className="slot-num" style={{color:col+'88'}}>{i+1}</span>
              <span className="slot-plus" style={{color:col+'77'}}>＋</span>
              <span className="slot-hint">Click to add</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Activation Order ──────────────────────────────────────────────────────────
function SimPage({atkParty,defParty,goBuilder}) {
  if(!atkParty.length&&!defParty.length) return (
    <section className="sim-page"><h2 className="page-title">Activation Order</h2>
      <div className="empty-cta"><p>Add generals first.</p><button className="btn-sim" onClick={goBuilder}>Go to Party Builder</button></div>
    </section>
  )
  const {strat,turns}=simulate(atkParty,defParty)
  return (
    <section className="sim-page">
      <h2 className="page-title">Skill Activation Order</h2>

      {/* Formation summary */}
      <div className="sim-formation-row">
        <FormBar generals={atkParty} side="attack" label="⚔ Attacking"/>
        <div className="form-vs">VS</div>
        <FormBar generals={defParty} side="defense" label="🛡 Defending"/>
      </div>

      {/* Strategy */}
      <div className="sim-block">
        <div className="sim-block-title strat-title">⚑ Strategy Skills — Always Active</div>
        <div className="strat-columns">
          <StratCol entries={strat.attack}  side="attack"  label="⚔ Attack"/>
          <StratCol entries={strat.defense} side="defense" label="🛡 Defense"/>
        </div>
      </div>

      {/* Turns */}
      <div className="sim-block">
        <div className="sim-block-title combat-title">⚔ Turn-by-Turn Combat</div>
        {turns.map(({turn,entries})=>(
          <div key={turn} className="turn-block">
            <div className="turn-label">Turn {turn}</div>
            <div className="turn-entries">
              {entries.map(({general,skill,side},i)=>(
                <div key={i} className={`turn-entry entry-${side}`}>
                  <div className="entry-bar" style={{background:side==='attack'?'#c0392b':'#1a6fa8'}}/>
                  <div className="entry-body">
                    <div className="entry-general">
                      {general.image&&<img src={general.image} alt={general.name_en} className="entry-img"/>}
                      <div className="entry-names">
                        <span className="entry-en">{general.name_en}</span>
                        <span className="entry-jp">{general.name_jp}</span>
                      </div>
                      <span className="entry-side" style={{background:side==='attack'?'rgba(192,57,43,.2)':'rgba(26,111,168,.2)',color:side==='attack'?'#e07060':'#5ba3d0'}}>{side==='attack'?'⚔ ATK':'🛡 DEF'}</span>
                    </div>
                    {skill?<SimSkill skill={skill}/>:<div className="normal-atk">Normal Attack</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FormBar({generals,side,label}) {
  const col=side==='attack'?'#c0392b':'#1a6fa8'
  return (
    <div className="form-bar-wrap">
      <div className="form-bar-label" style={{color:col}}>{label}</div>
      <div className="form-bar">
        {generals.map((g,i)=>(
          <div key={g.id} className="form-chip" style={{borderTopColor:CC[g.country]||'#444'}}>
            {g.image&&<img src={g.image} alt={g.name_en} className="form-chip-img"/>}
            <span className="form-chip-name">{g.name_en}</span>
          </div>
        ))}
        {!generals.length&&<span className="form-empty">None</span>}
      </div>
    </div>
  )
}

function StratCol({entries,side,label}) {
  const col=side==='attack'?'#c0392b':'#1a6fa8'
  return (
    <div className="strat-col">
      <div className="strat-col-label" style={{color:col,borderBottomColor:col+'44'}}>{label}</div>
      {!entries.length?<p className="empty-note">None</p>:entries.map(({general,skills:gs})=>(
        <div key={general.id} className="strat-entry">
          <div className="strat-gen-name" style={{color:col}}>
            {general.image&&<img src={general.image} alt={general.name_en} className="strat-gen-img"/>}
            <span>{general.name_en}</span>
            <span className="strat-gen-jp">{general.name_jp}</span>
          </div>
          {gs.map((sk,i)=>(
            <div key={i} className="strat-skill">
              <div className="strat-skill-hdr">
                <span className="strat-skill-name">{sk.name_en}</span>
                {sk.star6&&<span className="tag tag-star6">☆6</span>}
              </div>
              {sk.effects.map((eff,ei)=>(
                <div key={ei} className="strat-eff">
                  {eff.condition&&<span className="strat-cond">{eff.condition} → </span>}
                  <span className="strat-tgt">{eff.target}: </span>
                  <span className="strat-txt">{eff.effect}</span>
                  {eff.duration&&<span className="strat-dur"> [{eff.duration}]</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function SimSkill({skill}) {
  return (
    <div className="sim-skill">
      <div className="sim-skill-hdr">
        <span className="sim-skill-name">{skill.name_en}</span>
        <span className="sim-skill-jp">{skill.name_jp}</span>
        {skill.star6&&<span className="tag tag-star6">☆6</span>}
      </div>
      {skill.effects.map((eff,i)=>(
        <div key={i} className="effect-row">
          {eff.condition&&<div className="eff-cond">📌 {eff.condition}</div>}
          <div className="eff-body">
            <span className="eff-target">{eff.target}</span>
            <span className="eff-arrow">→</span>
            <span className="eff-text">{eff.effect}</span>
            {eff.duration&&<span className="eff-dur">[{eff.duration}]</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── CW Buffs ──────────────────────────────────────────────────────────────────
function BuffsPage() {
  const [cat,setCat]=useState(null)
  const [stat,setStat]=useState(null)
  const buffs=cwBuffsData.buffs

  const catCount=Object.fromEntries(BUFF_CATS.map(c=>[c.id,buffs.filter(b=>b.unit_cat===c.id).length]))
  const statsForCat=cat?[...new Set(buffs.filter(b=>b.unit_cat===cat).map(b=>b.stat))].sort():[]
  const filtered=cat&&stat?buffs.filter(b=>b.unit_cat===cat&&b.stat===stat):[]

  // Group by char
  const byChar={}
  for(const b of filtered){ if(!byChar[b.char_id])byChar[b.char_id]={...b,buffs:[]}; byChar[b.char_id].buffs.push(b) }
  const chars=Object.values(byChar).sort((a,b)=>b.buffs.reduce((s,x)=>s+x.pct,0)-a.buffs.reduce((s,x)=>s+x.pct,0))
  const grandTotal=filtered.reduce((s,b)=>s+b.pct,0)

  const statTotal=s=>buffs.filter(b=>b.unit_cat===cat&&b.stat===s).reduce((sum,b)=>sum+b.pct,0)
  const isPct=!['Repair Speed','Coin Cost','Material Cost','Ore Cost','Terrain Bonus','Status Resistance','Other'].includes(stat)

  return (
    <section className="buffs-page">
      <h2 className="page-title">CW Buffs</h2>
      <p className="page-hint">Administration skills active during Castle Wars — even when the general isn't deployed to the battlefield.</p>

      <div className="buff-cats">
        {BUFF_CATS.map(c=>{
          const cnt=catCount[c.id]||0
          if(!cnt) return null
          return (
            <button key={c.id} className={`buff-cat${cat===c.id?' active':''}`} onClick={()=>{setCat(cat===c.id?null:c.id);setStat(null)}}>
              <span className="bc-icon">{c.icon}</span>
              <span className="bc-label">{c.label}</span>
              <span className="bc-cnt">{cnt}</span>
            </button>
          )
        })}
      </div>

      {cat&&(
        <div className="buff-stats">
          {statsForCat.map(s=>{
            const t=statTotal(s)
            return (
              <button key={s} className={`buff-stat${stat===s?' active':''}`} onClick={()=>setStat(stat===s?null:s)}>
                <span className="bs-name">{s}</span>
                {t>0&&<span className="bs-total">+{t.toFixed(1)}%</span>}
              </button>
            )
          })}
        </div>
      )}

      {cat&&stat&&(
        <div className="buff-results">
          <div className="buff-results-hdr">
            <span className="buff-results-title">{cat} · {stat}</span>
            {isPct&&grandTotal>0&&(
              <div className="buff-grand-total">
                Total if all used: <strong>+{grandTotal.toFixed(1)}%</strong>
              </div>
            )}
          </div>
          {!chars.length?<p className="empty-note" style={{padding:'1rem'}}>No buffs.</p>:(
            <div className="buff-char-grid">
              {chars.map(entry=>{
                const col=CC[entry.char_country]||'#555'
                const total=entry.buffs.reduce((s,b)=>s+b.pct,0)
                return (
                  <div key={entry.char_id} className="buff-char" style={{borderLeftColor:col}}>
                    <div className="buff-char-hdr">
                      {entry.char_image?<img src={entry.char_image} alt={entry.char_name} className="buff-char-img"/>
                        :<div className="buff-char-ph" style={{background:col+'22',color:col}}>{entry.char_name[0]}</div>}
                      <div className="buff-char-info">
                        <span className="buff-char-name">{entry.char_name}</span>
                        {total>0&&<span className="buff-char-pct" style={{color:col}}>+{total.toFixed(1)}%</span>}
                      </div>
                    </div>
                    <div className="buff-char-effs">
                      {entry.buffs.map((b,i)=>(
                        <div key={i} className="buff-eff">
                          <span className="buff-eff-val">{b.effect}</span>
                          {b.condition&&!b.condition.includes('deployed')&&!b.condition.includes('CW battle')&&(
                            <span className="buff-eff-cond">{b.condition}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
