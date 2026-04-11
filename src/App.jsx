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
  { id:'qin',           label:'Qin',           jp:'秦',    color:'#c0392b' },
  { id:'zhao',          label:'Zhao',          jp:'趙',    color:'#2471a3' },
  { id:'chu',           label:'Chu',           jp:'楚',    color:'#7d3c98' },
  { id:'wei',           label:'Wei',           jp:'魏',    color:'#148f77' },
  { id:'yan',           label:'Yan',           jp:'燕',    color:'#117a65' },
  { id:'ai',            label:'Ai',            jp:'毐',    color:'#6c3483' },
  { id:'han',           label:'Han',           jp:'韓',    color:'#b7950b' },
  { id:'qi',            label:'Qi',            jp:'斉',    color:'#ba4a00' },
  { id:'mountain_folk', label:'Mountain Folk', jp:'山の民', color:'#7d6608' },
]
const CC = Object.fromEntries(FACTIONS.map(f=>[f.id,f.color]))

const TYPE_BG = { Combat:'#7b1e1e', Strategy:'#1a3a6a', Administration:'#1a4a2a' }
const TYPE_COL = { Combat:'#f1948a', Strategy:'#7fb3d3', Administration:'#82e0aa' }

const BUFF_CATS = [
  {id:'Cavalry',             label:'Cavalry',      icon:'🐴'},
  {id:'Infantry',            label:'Infantry',     icon:'⚔'},
  {id:'Archer',              label:'Archer',       icon:'🏹'},
  {id:'Shield',              label:'Shield',       icon:'🛡'},
  {id:'War Machine',         label:'War Machine',  icon:'⚙'},
  {id:'Attack War Machine',  label:'Atk W.M.',     icon:'💥'},
  {id:'Defense War Machine', label:'Def W.M.',     icon:'🔩'},
  {id:'Terrain',             label:'Terrain',      icon:'🗺'},
  {id:'CW Repair',           label:'CW Repair',    icon:'🔧'},
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
      if(i<atk.length)  e.push({general:atk[i], skill:aq[i].shift()||null, side:'attack'})
      if(i<def.length)  e.push({general:def[i], skill:dq[i].shift()||null, side:'defense'})
    }
    turns.push({turn:t,entries:e})
  }
  return {strat,turns}
}

// ── Picker ────────────────────────────────────────────────────────────────────
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
            <button key={c.id} className="modal-char-btn" style={{borderTopColor:CC[c.country]||'#555'}} onClick={()=>{onSelect(c);onClose()}}>
              {c.image?<img src={c.image} alt={c.name_en} className="modal-char-img"/>
                :<div className="modal-char-ph" style={{background:(CC[c.country]||'#555')+'33',color:CC[c.country]||'#888'}}>{c.name_en[0]}</div>}
              <span className="modal-char-name">{c.name_en}</span>
              <span className="modal-char-jp">{c.name_jp}</span>
            </button>
          ))}
          {!chars.length&&<p className="picker-empty">No generals found.</p>}
        </div>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
const PAGES = ['Skill Archive','Party Builder','Activation Order','CW Buffs']

export default function App() {
  const [page,setPage]       = useState('Skill Archive')
  const [atkParty,setAtk]    = useState([])
  const [defParty,setDef]    = useState([])

  const removeFrom = (char,side) => (side==='attack'?setAtk:setDef)(p=>p.filter(x=>x.id!==char.id))
  const setSlot = (char,side,idx) => {
    const set=side==='attack'?setAtk:setDef
    set(prev=>{ const n=[...prev]; const e=n.findIndex(p=>p.id===char.id); if(e!==-1)n.splice(e,1); n[idx]=char; return n.filter(Boolean) })
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <div className="site-title">
            <span className="title-mark">⚔</span>
            <div>
              <div className="title-kanji">キングダム乱</div>
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
        {page==='Skill Archive'    && <ArchivePage/>}
        {page==='Party Builder'    && <BuilderPage atkParty={atkParty} defParty={defParty} setSlot={setSlot} removeFrom={removeFrom} goSim={()=>setPage('Activation Order')}/>}
        {page==='Activation Order' && <SimPage atkParty={atkParty} defParty={defParty} goBuilder={()=>setPage('Party Builder')}/>}
        {page==='CW Buffs'         && <BuffsPage/>}
      </main>
      <footer className="site-footer">Kingdom Ran EN · {ALL_CHARACTERS.length} generals · Fan resource, not affiliated with Cygames</footer>
    </div>
  )
}

// ── SKILL ARCHIVE — pure reference page ──────────────────────────────────────
function ArchivePage() {
  const [search,setSearch] = useState('')
  const [openFactions,setOpenFactions] = useState({})
  const sl = search.toLowerCase()
  const filtered = search ? ALL_CHARACTERS.filter(c=>c.name_en.toLowerCase().includes(sl)||c.name_jp.includes(search)) : null

  return (
    <section className="archive-page">
      {/* Search */}
      <div className="archive-search">
        <span className="search-icon">⌕</span>
        <input className="search-input" placeholder="Search generals…" value={search} onChange={e=>setSearch(e.target.value)}/>
        {search && <button className="search-clear" onClick={()=>setSearch('')}>✕</button>}
      </div>

      {filtered ? (
        <>
          <p className="result-count">{filtered.length} general{filtered.length!==1?'s':''}</p>
          <div className="char-grid">
            {filtered.map(c=><CharCard key={c.id} char={c}/>)}
          </div>
        </>
      ) : (
        <div className="faction-list">
          {FACTIONS.map(f=>{
            const chars = ALL_CHARACTERS.filter(c=>c.country===f.id)
            if(!chars.length) return null
            const isOpen = openFactions[f.id]
            return (
              <div key={f.id} className="faction-section">
                <button className="faction-hdr" onClick={()=>setOpenFactions(o=>({...o,[f.id]:!o[f.id]}))}>
                  <span className="faction-pill" style={{background:f.color}}/>
                  <span className="faction-name">{f.label}</span>
                  <span className="faction-jp">{f.jp}</span>
                  <span className="faction-cnt">{chars.length} generals</span>
                  <span className="faction-chev">{isOpen?'▲':'▼'}</span>
                </button>
                {isOpen && (
                  <div className="char-grid faction-body">
                    {chars.map(c=><CharCard key={c.id} char={c}/>)}
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

// ── Character card ────────────────────────────────────────────────────────────
function CharCard({char}) {
  const [open,setOpen] = useState(false)
  const col = CC[char.country] || '#666'
  const skills = char.skills || []
  const combat   = skills.filter(s=>s.type==='Combat')
  const strategy = skills.filter(s=>s.type==='Strategy')
  const admin    = skills.filter(s=>s.type==='Administration')

  return (
    <div className="char-card">
      {/* Portrait */}
      <div className="char-portrait" style={{borderTopColor:col}}>
        {char.image
          ? <img src={char.image} alt={char.name_en} className="char-img" loading="lazy"/>
          : <div className="char-img-ph" style={{background:col+'22',color:col}}>{char.name_en[0]}</div>}
        <div className="char-faction-bar" style={{background:col}}/>
      </div>

      {/* Info */}
      <div className="char-info">
        <div className="char-name-en">{char.name_en}</div>
        <div className="char-name-jp">{char.name_jp}</div>
        {/* Skill type summary dots */}
        <div className="char-skill-dots">
          {combat.map((_,i)=><span key={i} className="dot dot-c" title={combat[i]?.name_en}>C</span>)}
          {strategy.map((s,i)=><span key={i} className={`dot dot-s${s.star6?' dot-6':''}`} title={s.name_en}>{s.star6?'☆':'S'}</span>)}
          {admin.length>0 && <span className="dot dot-a" title="Has Admin skills">A</span>}
        </div>
        <button className="char-expand-btn" onClick={()=>setOpen(o=>!o)}>
          {open ? '▲ Collapse' : '▼ View Skills'}
        </button>
      </div>

      {/* Skills — open below, full width */}
      {open && skills.length>0 && (
        <div className="skills-drawer">
          {skills.map((sk,i)=><SkillEntry key={i} skill={sk}/>)}
        </div>
      )}
      {open && skills.length===0 && (
        <div className="skills-drawer"><p className="skills-pending">⏳ Translation pending</p></div>
      )}
    </div>
  )
}

// ── Skill entry — the KEY readability component ───────────────────────────────
function SkillEntry({skill}) {
  const bg  = TYPE_BG[skill.type]  || '#2a2a2a'
  const col = TYPE_COL[skill.type] || '#ccc'
  return (
    <div className="skill-entry">
      {/* Skill header bar */}
      <div className="skill-entry-header" style={{borderLeftColor:col,background:bg}}>
        <div className="skill-entry-name-wrap">
          <span className="skill-entry-name">{skill.name_en}</span>
          <span className="skill-entry-jp">{skill.name_jp}</span>
        </div>
        <div className="skill-entry-tags">
          {skill.star6 && <span className="stag stag-6">☆6</span>}
          <span className="stag" style={{color:col,borderColor:col+'66'}}>{skill.type}</span>
          {skill.type==='Administration' && <span className="stag stag-map">Map</span>}
        </div>
      </div>
      {/* Effects list */}
      <div className="skill-entry-effects">
        {skill.effects.map((eff,i)=>(
          <div key={i} className="eff-item">
            {eff.condition && (
              <div className="eff-condition">
                <span className="eff-cond-dot">◆</span>
                <span>{eff.condition}</span>
              </div>
            )}
            <div className="eff-main">
              <span className="eff-target">{eff.target}</span>
              <span className="eff-sep">›</span>
              <span className="eff-value">{eff.effect}</span>
              {eff.duration && <span className="eff-duration">{eff.duration}</span>}
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
        <FormationSlots side="attack"  label="⚔ Attacking" party={atkParty}  onSlot={i=>setPicker({side:'attack',idx:i})}  onRemove={c=>removeFrom(c,'attack')}/>
        <div className="dual-vs">VS</div>
        <FormationSlots side="defense" label="🛡 Defending" party={defParty} onSlot={i=>setPicker({side:'defense',idx:i})} onRemove={c=>removeFrom(c,'defense')}/>
      </div>
      {(atkParty.length||defParty.length)>0 && (
        <div className="sim-cta"><button className="btn-sim" onClick={goSim}>▶ View Activation Order</button></div>
      )}
    </section>
  )
}

function FormationSlots({side,label,party,onSlot,onRemove}) {
  const col=side==='attack'?'#c0392b':'#1a6fa8'
  return (
    <div className="formation">
      <div className="formation-label" style={{color:col,borderBottomColor:col+'55'}}>{label}</div>
      <div className="slot-list">
        {Array.from({length:4}).map((_,i)=>{
          const m=party[i]
          const mc=m?CC[m.country]||'#555':col
          return m?(
            <div key={i} className="slot-filled" style={{borderLeftColor:mc}}>
              <span className="slot-n" style={{color:col+'aa'}}>{i+1}</span>
              {m.image&&<img src={m.image} alt={m.name_en} className="slot-img"/>}
              <div className="slot-text">
                <span className="slot-en">{m.name_en}</span>
                <span className="slot-jp">{m.name_jp}</span>
              </div>
              <button className="slot-rm" onClick={()=>onRemove(m)}>✕</button>
            </div>
          ):(
            <button key={i} className="slot-empty" style={{'--sc':col}} onClick={()=>onSlot(i)}>
              <span className="slot-n" style={{color:col+'66'}}>{i+1}</span>
              <span style={{color:col+'66',fontSize:'1.2rem'}}>＋</span>
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
    <section className="sim-page">
      <h2 className="page-title">Activation Order</h2>
      <div className="empty-cta"><p>Build your formations first.</p><button className="btn-sim" onClick={goBuilder}>Go to Party Builder</button></div>
    </section>
  )
  const {strat,turns}=simulate(atkParty,defParty)
  return (
    <section className="sim-page">
      <h2 className="page-title">Skill Activation Order</h2>
      {/* Formation row */}
      <div className="sim-form-row">
        <FormBar generals={atkParty} side="attack" label="⚔ Attacking"/>
        <div className="form-vs">VS</div>
        <FormBar generals={defParty} side="defense" label="🛡 Defending"/>
      </div>
      {/* Strategy */}
      <div className="sim-section">
        <div className="sim-sec-title strat-title">⚑ Strategy Skills — Always Active</div>
        <div className="strat-cols">
          <StratCol entries={strat.attack}  side="attack"  label="⚔ Attacker"/>
          <StratCol entries={strat.defense} side="defense" label="🛡 Defender"/>
        </div>
      </div>
      {/* Turns */}
      <div className="sim-section">
        <div className="sim-sec-title combat-title">⚔ Turn-by-Turn Combat</div>
        {turns.map(({turn,entries})=>(
          <div key={turn} className="turn-block">
            <div className="turn-lbl">Turn {turn}</div>
            <div className="turn-entries">
              {entries.map(({general,skill,side},i)=>(
                <div key={i} className={`turn-entry entry-${side}`}>
                  <div className="entry-stripe" style={{background:side==='attack'?'#c0392b':'#1a6fa8'}}/>
                  <div className="entry-content">
                    <div className="entry-general">
                      {general.image&&<img src={general.image} alt={general.name_en} className="entry-avatar"/>}
                      <div>
                        <span className="entry-en">{general.name_en}</span>
                        <span className="entry-jp">{general.name_jp}</span>
                      </div>
                      <span className="entry-badge" style={{background:side==='attack'?'rgba(192,57,43,.2)':'rgba(26,111,168,.2)',color:side==='attack'?'#f1948a':'#7fb3d3'}}>{side==='attack'?'ATK':'DEF'}</span>
                    </div>
                    {skill ? <SkillEntry skill={skill}/> : <div className="normal-atk">Normal Attack</div>}
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
    <div className="form-bar">
      <div className="form-bar-lbl" style={{color:col}}>{label}</div>
      <div className="form-bar-chips">
        {generals.map((g,i)=>(
          <div key={g.id} className="form-chip" style={{borderTopColor:CC[g.country]||'#555'}}>
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
      <div className="strat-col-lbl" style={{color:col,borderBottomColor:col+'44'}}>{label}</div>
      {!entries.length?<p className="strat-empty">None</p>:entries.map(({general,skills:gs})=>(
        <div key={general.id} className="strat-gen">
          <div className="strat-gen-hdr" style={{color:col}}>
            {general.image&&<img src={general.image} alt={general.name_en} className="strat-gen-img"/>}
            <span>{general.name_en}</span>
            <span className="strat-gen-jp">{general.name_jp}</span>
          </div>
          {gs.map((sk,i)=><SkillEntry key={i} skill={sk}/>)}
        </div>
      ))}
    </div>
  )
}

// ── CW Buffs ──────────────────────────────────────────────────────────────────
function BuffsPage() {
  const [cat,setCat]   = useState(null)
  const [stat,setStat] = useState(null)
  const buffs = cwBuffsData.buffs

  const catCount = Object.fromEntries(BUFF_CATS.map(c=>[c.id, buffs.filter(b=>b.unit_cat===c.id).length]))
  const statsForCat = cat ? [...new Set(buffs.filter(b=>b.unit_cat===cat).map(b=>b.stat))].sort() : []

  const filtered = cat&&stat ? buffs.filter(b=>b.unit_cat===cat&&b.stat===stat) : []
  const byChar = {}
  for(const b of filtered){
    if(!byChar[b.char_id]) byChar[b.char_id]={...b,buffs:[]}
    byChar[b.char_id].buffs.push(b)
  }
  const chars = Object.values(byChar).sort((a,b)=>b.buffs.reduce((s,x)=>s+x.pct,0)-a.buffs.reduce((s,x)=>s+x.pct,0))
  const grandTotal = filtered.reduce((s,b)=>s+b.pct,0)
  const isPct = !['Repair Speed','Coin Cost','Material Cost','Ore Cost','Terrain Bonus','Status Resistance','Other'].includes(stat)

  return (
    <section className="buffs-page">
      <h2 className="page-title">CW Buffs</h2>
      <p className="page-hint">Administration skills active during Castle Wars — even when generals aren't deployed.</p>

      <div className="buff-cat-row">
        {BUFF_CATS.map(c=>{
          const cnt=catCount[c.id]||0
          if(!cnt) return null
          return (
            <button key={c.id} className={`buff-cat-btn${cat===c.id?' active':''}`} onClick={()=>{setCat(cat===c.id?null:c.id);setStat(null)}}>
              <span className="bcb-icon">{c.icon}</span>
              <span className="bcb-label">{c.label}</span>
              <span className="bcb-cnt">{cnt}</span>
            </button>
          )
        })}
      </div>

      {cat && (
        <div className="buff-stat-row">
          <span className="buff-stat-label">Sub-category:</span>
          {statsForCat.map(s=>{
            const t=buffs.filter(b=>b.unit_cat===cat&&b.stat===s).reduce((sum,b)=>sum+b.pct,0)
            return (
              <button key={s} className={`buff-stat-btn${stat===s?' active':''}`} onClick={()=>setStat(stat===s?null:s)}>
                <span>{s}</span>
                {t>0&&<span className="bsb-total">+{t.toFixed(1)}%</span>}
              </button>
            )
          })}
        </div>
      )}

      {cat&&stat&&(
        <div className="buff-results">
          <div className="buff-results-bar">
            <span className="buff-res-title">{cat} — {stat}</span>
            {isPct&&grandTotal>0&&<span className="buff-grand">Stack total: <strong>+{grandTotal.toFixed(1)}%</strong></span>}
          </div>
          {!chars.length ? <p style={{padding:'1rem',color:'var(--txt3)',fontStyle:'italic'}}>No entries.</p> : (
            <div className="buff-char-grid">
              {chars.map(entry=>{
                const col=CC[entry.char_country]||'#666'
                const total=entry.buffs.reduce((s,b)=>s+b.pct,0)
                return (
                  <div key={entry.char_id} className="buff-card" style={{borderLeftColor:col}}>
                    <div className="buff-card-top">
                      {entry.char_image
                        ?<img src={entry.char_image} alt={entry.char_name} className="buff-avatar"/>
                        :<div className="buff-avatar-ph" style={{background:col+'22',color:col}}>{entry.char_name[0]}</div>}
                      <div className="buff-card-info">
                        <span className="buff-card-name">{entry.char_name}</span>
                        {total>0&&<span className="buff-card-pct" style={{color:col}}>+{total.toFixed(1)}%</span>}
                      </div>
                    </div>
                    <div className="buff-card-effs">
                      {entry.buffs.map((b,i)=>(
                        <div key={i} className="buff-eff-line">
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
