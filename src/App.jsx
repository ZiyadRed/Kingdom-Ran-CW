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

// Unit type symbols derived from character card badges (bottom-left corner)
// Cavalry = red diamond + horse | Shield = blue rounded square | Archer = green pentagon + crossbow | Infantry = gold circle + spear
const UNIT_ICONS = {
  Cavalry: (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <path d="M11 2L20 11L11 20L2 11Z" fill="#c0392b" stroke="#922b21" strokeWidth="1"/>
      <text x="11" y="15" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">♞</text>
    </svg>
  ),
  Infantry: (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="9" fill="#c9a84c" stroke="#a07030" strokeWidth="1"/>
      <text x="11" y="15" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">⚔</text>
    </svg>
  ),
  Archer: (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <polygon points="11,2 20,7 17,18 5,18 2,7" fill="#27ae60" stroke="#1a7a40" strokeWidth="1"/>
      <text x="11" y="15" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">🏹</text>
    </svg>
  ),
  Shield: (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <rect x="2" y="3" width="18" height="16" rx="4" ry="4" fill="#2471a3" stroke="#1a5580" strokeWidth="1"/>
      <text x="11" y="15" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">🛡</text>
    </svg>
  ),
}

const BUFF_CATS=[
  {id:'Cavalry',            label:'Cavalry',      icon: UNIT_ICONS.Cavalry,   unitType: true},
  {id:'Infantry',           label:'Infantry',     icon: UNIT_ICONS.Infantry,  unitType: true},
  {id:'Archer',             label:'Archer',       icon: UNIT_ICONS.Archer,    unitType: true},
  {id:'Shield',             label:'Shield',       icon: UNIT_ICONS.Shield,    unitType: true},
  {id:'War Machine',        label:'War Machine',  icon:'⚙',  unitType: false},
  {id:'Attack War Machine', label:'Atk W.M.',     icon:'💥', unitType: false},
  {id:'Defense War Machine',label:'Def W.M.',     icon:'🔩', unitType: false},
  {id:'Terrain',            label:'Terrain',      icon:'🗺', unitType: false},
  {id:'CW Repair',          label:'Repair',       icon:'🔧', unitType: false},
]

// ── Simulate ─────────────────────────────────────────────────────────────────
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

// ── Picker Modal ──────────────────────────────────────────────────────────────
function Picker({onSelect,onClose,excl=[]}){
  const[q,setQ]=useState(''),
       [fac,setFac]=useState('all'),
       ref=useRef(null)
  useEffect(()=>{ref.current?.focus()},[])
  const chars=ALL.filter(c=>{
    if(excl.includes(c.id))return false
    if(fac!=='all'&&c.country!==fac)return false
    if(q){const s=q.toLowerCase();return c.name_en.toLowerCase().includes(s)||c.name_jp.includes(q)}
    return true
  })
  return(
    <div className="overlay" onClick={onClose}>
      <div className="picker" onClick={e=>e.stopPropagation()}>
        <div className="picker-head">
          <span className="picker-title">Select General</span>
          <button className="x-btn" onClick={onClose}>✕</button>
        </div>
        <div className="picker-filters">
          <input ref={ref} className="picker-search" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}/>
          <select className="picker-fac" value={fac} onChange={e=>setFac(e.target.value)}>
            <option value="all">All Factions</option>
            {FACTIONS.map(f=><option key={f.id} value={f.id}>{f.label} {f.jp}</option>)}
          </select>
        </div>
        <div className="picker-grid">
          {chars.map(c=>(
            <button key={c.id} className="p-card" style={{borderTopColor:CC[c.country]||'#999'}} onClick={()=>{onSelect(c);onClose()}}>
              {c.image
                ?<img src={c.image} className="p-img" alt={c.name_en}/>
                :<div className="p-ph" style={{background:CC[c.country]+'22',color:CC[c.country]||'#999'}}>{c.name_en[0]}</div>}
              <span className="p-name">{c.name_en}</span>
              <span className="p-jp">{c.name_jp}</span>
            </button>
          ))}
          {!chars.length&&<p className="p-empty">No results</p>}
        </div>
      </div>
    </div>
  )
}

// ── App Shell ─────────────────────────────────────────────────────────────────
const PAGES=['Skill Archive','Party Builder','Activation Order','CW Buffs','Tier List']
export default function App(){
  const[page,setPage]=useState('Skill Archive')
  const[atk,setAtk]=useState([])
  const[def,setDef]=useState([])
  const rm=(char,side)=>(side==='attack'?setAtk:setDef)(p=>p.filter(x=>x.id!==char.id))
  const setSlot=(char,side,idx)=>{
    const set=side==='attack'?setAtk:setDef
    set(p=>{const n=[...p];const e=n.findIndex(x=>x.id===char.id);if(e!==-1)n.splice(e,1);n[idx]=char;return n.filter(Boolean)})
  }
  return(
    <div className="app">
      <header className="hdr">
        <div className="hdr-in">
          <div className="logo">
            <div className="logo-badge">⚔</div>
            <div className="logo-text">
              <div className="logo-ja">キングダム乱</div>
              <div className="logo-en">Kingdom Ran EN</div>
            </div>
          </div>
          <nav className="nav">
            {PAGES.map(p=>(
              <button key={p} className={`nb${page===p?' nb-on':''}`} onClick={()=>setPage(p)}>
                {p}
                {p==='Party Builder'&&(atk.length+def.length)>0&&
                  <span className="nb-dot">{atk.length+def.length}</span>}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="main">
        {page==='Skill Archive'    && <ArchivePage/>}
        {page==='Party Builder'    && <BuilderPage atk={atk} def={def} setSlot={setSlot} rm={rm} goSim={()=>setPage('Activation Order')}/>}
        {page==='Activation Order' && <SimPage atk={atk} def={def} goBuilder={()=>setPage('Party Builder')}/>}
        {page==='CW Buffs'         && <BuffsPage/>}
        {page==='Tier List'         && <TierListPage/>}
      </main>
      <footer className="footer">{ALL.length} generals · Fan resource · Not affiliated with Cygames</footer>
    </div>
  )
}

// ── SKILL ARCHIVE — list layout so skills can expand freely ──────────────────
function ArchivePage(){
  const[q,setQ]=useState('')
  const[openFac,setOpenFac]=useState({})
  const sl=q.toLowerCase()
  const filtered=q?ALL.filter(c=>c.name_en.toLowerCase().includes(sl)||c.name_jp.includes(q)):null

  return(
    <div className="archive">
      <div className="search-row">
        <div className="search-box">
          <span className="s-icon">⌕</span>
          <input className="s-input" placeholder="Search generals…" value={q} onChange={e=>setQ(e.target.value)}/>
          {q&&<button className="s-clear" onClick={()=>setQ('')}>✕</button>}
        </div>
      </div>

      {filtered?(
        <div>
          <p className="res-count">{filtered.length} general{filtered.length!==1?'s':''}</p>
          <div className="gen-list">
            {filtered.map(c=><GenRow key={c.id} char={c}/>)}
          </div>
        </div>
      ):(
        <div className="fac-accordion">
          {FACTIONS.map(f=>{
            const chars=ALL.filter(c=>c.country===f.id)
            if(!chars.length)return null
            const isOpen=openFac[f.id]
            return(
              <div key={f.id} className="fac-item">
                <button className="fac-btn" onClick={()=>setOpenFac(o=>({...o,[f.id]:!o[f.id]}))}>
                  <span className="fac-stripe" style={{background:f.color}}/>
                  <span className="fac-label">{f.label}</span>
                  <span className="fac-jp">{f.jp}</span>
                  <span className="fac-n">{chars.length}</span>
                  <span className="fac-chev">{isOpen?'▲':'▼'}</span>
                </button>
                {isOpen&&(
                  <div className="fac-body">
                    <div className="gen-list">
                      {chars.map(c=><GenRow key={c.id} char={c}/>)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── GenRow — horizontal list item, skills expand BELOW full width ─────────────
function GenRow({char}){
  const[open,setOpen]=useState(false)
  const col=CC[char.country]||'#999'
  const skills=char.skills||[]
  const combat=skills.filter(s=>s.type==='Combat')
  const strat=skills.filter(s=>s.type==='Strategy')

  return(
    <div className="gr">
      {/* Portrait + info row — always visible, full width */}
      <div className="gr-header" onClick={()=>setOpen(o=>!o)} style={{borderLeftColor:col}}>
        {/* Portrait: fixed size, shows full image */}
        <div className="gr-portrait" style={{borderColor:col}}>
          {char.image
            ?<img src={char.image} alt={char.name_en} className="gr-img"/>
            :<div className="gr-ph" style={{background:col+'22',color:col}}>{char.name_en[0]}</div>}
        </div>
        {/* Names */}
        <div className="gr-names">
          <span className="gr-en">{char.name_en}</span>
          <span className="gr-jp">{char.name_jp}</span>
        </div>
        {/* Skill preview chips */}
        <div className="gr-chips">
          {combat.map((s,i)=>(
            <span key={i} className="chip chip-c" title={s.name_en}>C{i+1}</span>
          ))}
          {strat.map((s,i)=>(
            <span key={i} className={`chip chip-s${s.star6?' chip-6':''}`} title={s.name_en}>
              {s.star6?'☆6':'S'}
            </span>
          ))}
          {!skills.length&&<span className="chip chip-x">pending</span>}
        </div>
        {/* Toggle */}
        <button className="gr-toggle" aria-label="toggle skills">
          <span className="gr-toggle-arrow">{open?'▲':'▼'}</span>
          <span className="gr-toggle-txt">{open?'Hide':'Skills'}</span>
        </button>
      </div>

      {/* Skills panel — full width, with big portrait on the left */}
      {open&&(
        <div className="gr-skills">
          {/* Full portrait */}
          <div className="gr-skills-portrait">
            {char.image
              ?<img src={char.image} alt={char.name_en} className="gr-skills-portrait-img"/>
              :<div className="gr-skills-portrait-ph" style={{color:col,background:col+'18'}}>
                {char.name_en[0]}
              </div>}
            <div className="gr-skills-portrait-name">{char.name_en}</div>
            <div className="gr-skills-portrait-jp">{char.name_jp}</div>
          </div>
          {/* Skills */}
          <div className="gr-skills-content">
            {!skills.length
              ?<p className="no-skills-note">⏳ Translation pending for this general.</p>
              :<div className="skills-layout">
                {skills.map((sk,i)=><SkillCard key={i} skill={sk}/>)}
              </div>
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── SkillCard — the KEY component, must be readable ──────────────────────────
function SkillCard({skill}){
  const col=TYPE_COLOR[skill.type]||'#999'
  return(
    <div className="sk">
      {/* Skill header */}
      <div className="sk-head" style={{borderLeftColor:col,background:col+'18'}}>
        <div className="sk-name-col">
          <span className="sk-name">{skill.name_en}</span>
          <span className="sk-jp">{skill.name_jp}</span>
        </div>
        <div className="sk-tags">
          {skill.star6&&<span className="tag t-star">☆6</span>}
          <span className="tag" style={{background:col+'30',color:col,border:`1px solid ${col}60`}}>
            {skill.type}
          </span>
          {skill.type==='Administration'&&<span className="tag t-map">Map only</span>}
        </div>
      </div>
      {/* Effects table */}
      <div className="sk-effects">
        {skill.effects.map((e,i)=>(
          <div key={i} className="eff">
            {e.condition&&(
              <div className="eff-if">
                <span className="eff-if-label">IF</span>
                <span className="eff-if-text">{e.condition}</span>
              </div>
            )}
            <div className="eff-body">
              <span className="eff-target">{e.target}</span>
              <span className="eff-sep">→</span>
              <span className="eff-effect">{e.effect}</span>
              {e.duration&&<span className="eff-dur">{e.duration}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Party Builder ─────────────────────────────────────────────────────────────
function BuilderPage({atk,def,setSlot,rm,goSim}){
  const[picker,setPicker]=useState(null)
  const excl=[...atk,...def].map(c=>c.id)
  return(
    <div className="builder">
      {picker&&<Picker onSelect={c=>setSlot(c,picker.side,picker.idx)} onClose={()=>setPicker(null)} excl={excl}/>}
      <h2 className="pg-title">Party Builder</h2>
      <p className="pg-sub">Click any slot to add a general. Slot order = skill firing order (last slot fires first).</p>
      <div className="two-sides">
        <SideSlots side="attack"  label="⚔ Attacking" party={atk} onSlot={i=>setPicker({side:'attack',idx:i})}  onRm={c=>rm(c,'attack')}/>
        <div className="vs-badge">VS</div>
        <SideSlots side="defense" label="🛡 Defending" party={def} onSlot={i=>setPicker({side:'defense',idx:i})} onRm={c=>rm(c,'defense')}/>
      </div>
      {(atk.length||def.length)>0&&(
        <div className="cta-row">
          <button className="cta-btn" onClick={goSim}>View Activation Order →</button>
        </div>
      )}
    </div>
  )
}

function SideSlots({side,label,party,onSlot,onRm}){
  const ac=side==='attack'?'var(--red)':'var(--blue)'
  return(
    <div className="side">
      <div className="side-label" style={{color:ac,borderBottomColor:ac}}>{label}</div>
      {Array.from({length:4}).map((_,i)=>{
        const m=party[i]
        return m?(
          <div key={i} className="slot-filled" style={{borderLeftColor:CC[m.country]||'#999'}}>
            <span className="sn" style={{color:ac}}>{i+1}</span>
            {m.image&&<img src={m.image} className="slot-av" alt={m.name_en}/>}
            <div className="slot-info">
              <span className="slot-en">{m.name_en}</span>
              <span className="slot-jp">{m.name_jp}</span>
            </div>
            <button className="slot-rm" onClick={()=>onRm(m)}>✕</button>
          </div>
        ):(
          <button key={i} className="slot-empty" style={{borderColor:ac+'55'}} onClick={()=>onSlot(i)}>
            <span style={{color:ac+'88',fontSize:'1.3rem',lineHeight:1}}>+</span>
            <span style={{color:ac+'77',fontSize:'.78rem',fontWeight:600}}>{i+1} — Click to add</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Activation Order ──────────────────────────────────────────────────────────
function SimPage({atk,def,goBuilder}){
  if(!atk.length&&!def.length) return(
    <div className="empty-cta">
      <p>No formations set.</p>
      <button className="cta-btn" onClick={goBuilder}>Go to Party Builder</button>
    </div>
  )
  const{st,turns}=simulate(atk,def)
  return(
    <div className="sim">
      <h2 className="pg-title">Activation Order</h2>
      {/* Formation bars */}
      <div className="form-bars">
        <FormBar generals={atk} side="attack" label="⚔ Attacking"/>
        <div className="form-vs">VS</div>
        <FormBar generals={def} side="defense" label="🛡 Defending"/>
      </div>

      {/* Strategy */}
      <div className="sim-sec">
        <div className="sec-hd sec-strat">⚑ Strategy Skills — Always Active</div>
        <div className="strat-cols">
          <StratCol label="⚔ Attacker Strategy" entries={st.attack} side="attack"/>
          <StratCol label="🛡 Defender Strategy" entries={st.defense} side="defense"/>
        </div>
      </div>

      {/* Turns */}
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
                      <div>
                        <b className="te-name">{general.name_en}</b>
                        <span className="te-jp">{general.name_jp}</span>
                      </div>
                      <span className="te-tag" style={{
                        background:side==='attack'?'rgba(192,57,43,.15)':'rgba(61,110,181,.15)',
                        color:side==='attack'?'#e88':'#8ab'
                      }}>{side==='attack'?'ATK':'DEF'}</span>
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
      <div className="scol-lbl" style={{color:ac,borderBottomColor:ac+'55'}}>{label}</div>
      {!entries.length
        ?<p className="scol-none">None</p>
        :entries.map(({general:g,skills:gs})=>(
          <div key={g.id} className="scol-gen">
            <div className="scol-gen-hdr" style={{color:ac}}>
              {g.image&&<img src={g.image} className="scol-av" alt={g.name_en}/>}
              <b>{g.name_en}</b>
              <span className="scol-jp">{g.name_jp}</span>
            </div>
            {gs.map((sk,i)=><SkillCard key={i} skill={sk}/>)}
          </div>
        ))
      }
    </div>
  )
}

// ── CW Buffs ──────────────────────────────────────────────────────────────────
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
    <div className="buffs">
      <h2 className="pg-title">CW Buffs</h2>
      <p className="pg-sub">Administration skills active during Castle Wars, even when the general isn't deployed.</p>
      <div className="cat-pills">
        {BUFF_CATS.map(c=>{
          const n=catCnt[c.id]||0
          if(!n)return null
          return(
            <button key={c.id} className={`cat-pill${cat===c.id?' active':''}`}
              onClick={()=>{setCat(cat===c.id?null:c.id);setStat(null)}}>
              {c.icon} {c.label} <span className="cat-n">{n}</span>
            </button>
          )
        })}
      </div>
      {cat&&(
        <div className="stat-pills">
          <span className="stat-lbl">Sub-category:</span>
          {statsForCat.map(s=>{
            const t=buffs.filter(b=>b.unit_cat===cat&&b.stat===s).reduce((x,b)=>x+b.pct,0)
            return(
              <button key={s} className={`stat-pill${stat===s?' active':''}`}
                onClick={()=>setStat(stat===s?null:s)}>
                {s}{t>0&&<span className="stat-pct"> +{t.toFixed(1)}%</span>}
              </button>
            )
          })}
        </div>
      )}
      {cat&&stat&&(
        <div className="buff-panel">
          <div className="buff-panel-hdr">
            <span className="buff-panel-title">{cat} · {stat}</span>
            {isPct&&grand>0&&<span className="buff-total">Stack total: <b>+{grand.toFixed(1)}%</b></span>}
          </div>
          <div className="buff-cards">
            {chars.map(entry=>{
              const col=CC[entry.char_country]||'#999'
              const tot=entry.list.reduce((s,b)=>s+b.pct,0)
              return(
                <div key={entry.char_id} className="bc" style={{borderTopColor:col}}>
                  <div className="bc-top">
                    {entry.char_image
                      ?<img src={entry.char_image} className="bc-av" alt={entry.char_name}/>
                      :<div className="bc-ph" style={{color:col,background:col+'22'}}>{entry.char_name[0]}</div>}
                    <div>
                      <div className="bc-name">{entry.char_name}</div>
                      {tot>0&&<div className="bc-pct" style={{color:col}}>+{tot.toFixed(1)}%</div>}
                    </div>
                  </div>
                  <div className="bc-effs">
                    {entry.list.map((b,i)=>(
                      <div key={i} className="bc-eff">
                        <span className="bc-val">{b.effect}</span>
                        {b.condition&&!b.condition.includes('deployed')&&!b.condition.includes('CW battle')&&(
                          <span className="bc-cond">{b.condition}</span>
                        )}
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

// ── Tier List ─────────────────────────────────────────────────────────────────
function TierListPage(){
  return(
    <div className="tier-page">
      <h2 className="pg-title">Tier List</h2>
      <p className="pg-sub">Coming soon — rank generals by performance in Castle Wars.</p>
      <div className="tier-placeholder">
        <div className="tier-placeholder-icon">⚔</div>
        <p>The tier list is being prepared.</p>
        <p className="tier-placeholder-sub">Check back soon.</p>
      </div>
    </div>
  )
}
