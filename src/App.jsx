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
  {id:'qin',label:'Qin',jp:'秦',color:'#d44'},
  {id:'zhao',label:'Zhao',jp:'趙',color:'#44a'},
  {id:'chu',label:'Chu',jp:'楚',color:'#84b'},
  {id:'wei',label:'Wei',jp:'魏',color:'#2a9'},
  {id:'yan',label:'Yan',jp:'燕',color:'#29a'},
  {id:'ai',label:'Ai',jp:'毐',color:'#72a'},
  {id:'han',label:'Han',jp:'韓',color:'#a90'},
  {id:'qi',label:'Qi',jp:'斉',color:'#b52'},
  {id:'mountain_folk',label:'Mountain Folk',jp:'山の民',color:'#7a5'},
]
const CC=Object.fromEntries(FACTIONS.map(f=>[f.id,f.color]))

const BUFF_CATS=[
  {id:'Cavalry',label:'Cavalry',icon:'🐴'},
  {id:'Infantry',label:'Infantry',icon:'⚔'},
  {id:'Archer',label:'Archer',icon:'🏹'},
  {id:'Shield',label:'Shield',icon:'🛡'},
  {id:'War Machine',label:'War Machine',icon:'⚙'},
  {id:'Attack War Machine',label:'Atk W.M.',icon:'💥'},
  {id:'Defense War Machine',label:'Def W.M.',icon:'🔩'},
  {id:'Terrain',label:'Terrain',icon:'🗺'},
  {id:'CW Repair',label:'Repair',icon:'🔧'},
]

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

function Picker({onSelect,onClose,excl=[]}){
  const[q,setQ]=useState(''),
       [f,setF]=useState('all'),
       ref=useRef(null)
  useEffect(()=>{ref.current?.focus()},[])
  const chars=ALL.filter(c=>{
    if(excl.includes(c.id))return false
    if(f!=='all'&&c.country!==f)return false
    if(q){const s=q.toLowerCase();return c.name_en.toLowerCase().includes(s)||c.name_jp.includes(q)}
    return true
  })
  return(
    <div className="overlay" onClick={onClose}>
      <div className="picker" onClick={e=>e.stopPropagation()}>
        <div className="picker-head">
          <span>Select General</span>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="picker-filters">
          <input ref={ref} className="picker-search" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}/>
          <select className="picker-fac" value={f} onChange={e=>setF(e.target.value)}>
            <option value="all">All Factions</option>
            {FACTIONS.map(x=><option key={x.id} value={x.id}>{x.label} {x.jp}</option>)}
          </select>
        </div>
        <div className="picker-grid">
          {chars.map(c=>(
            <button key={c.id} className="picker-card" style={{borderTopColor:CC[c.country]||'#555'}} onClick={()=>{onSelect(c);onClose()}}>
              {c.image?<img src={c.image} className="picker-img" alt={c.name_en}/>
                :<div className="picker-ph" style={{color:CC[c.country]||'#888'}}>{c.name_en[0]}</div>}
              <span className="picker-name">{c.name_en}</span>
              <span className="picker-jp">{c.name_jp}</span>
            </button>
          ))}
          {!chars.length&&<p className="picker-empty">No results</p>}
        </div>
      </div>
    </div>
  )
}

const PAGES=['Skill Archive','Party Builder','Activation Order','CW Buffs']
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
        <div className="hdr-inner">
          <div className="logo">
            <div className="logo-icon">⚔</div>
            <div>
              <div className="logo-sub">キングダム乱</div>
              <div className="logo-main">Kingdom Ran EN</div>
            </div>
          </div>
          <nav className="nav">
            {PAGES.map(p=>(
              <button key={p} className={`nav-pill${page===p?' on':''}`} onClick={()=>setPage(p)}>
                {p}
                {p==='Party Builder'&&(atk.length+def.length)>0&&<span className="pill-dot">{atk.length+def.length}</span>}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="wrap">
        {page==='Skill Archive'&&<ArchivePage/>}
        {page==='Party Builder'&&<BuilderPage atk={atk} def={def} setSlot={setSlot} rm={rm} goSim={()=>setPage('Activation Order')}/>}
        {page==='Activation Order'&&<SimPage atk={atk} def={def} goBuilder={()=>setPage('Party Builder')}/>}
        {page==='CW Buffs'&&<BuffsPage/>}
      </main>
      <footer className="foot">{ALL.length} generals · Fan resource · Not affiliated with Cygames</footer>
    </div>
  )
}

// ── SKILL ARCHIVE ─────────────────────────────────────────────────────────────
function ArchivePage(){
  const[q,setQ]=useState('')
  const[open,setOpen]=useState({})
  const sl=q.toLowerCase()
  const filtered=q?ALL.filter(c=>c.name_en.toLowerCase().includes(sl)||c.name_jp.includes(q)):null
  return(
    <div className="archive">
      <div className="archive-bar">
        <div className="sbox">
          <span className="sbox-icon">⌕</span>
          <input className="sbox-input" placeholder="Search generals…" value={q} onChange={e=>setQ(e.target.value)}/>
          {q&&<button className="sbox-x" onClick={()=>setQ('')}>✕</button>}
        </div>
      </div>
      {filtered?(
        <div>
          <div className="count-label">{filtered.length} general{filtered.length!==1?'s':''}</div>
          <div className="card-grid">{filtered.map(c=><GenCard key={c.id} char={c}/>)}</div>
        </div>
      ):(
        <div className="fac-list">
          {FACTIONS.map(f=>{
            const chars=ALL.filter(c=>c.country===f.id)
            if(!chars.length)return null
            const isOpen=open[f.id]
            return(
              <div key={f.id} className="fac-block">
                <button className="fac-toggle" onClick={()=>setOpen(o=>({...o,[f.id]:!o[f.id]}))}>
                  <span className="fac-bar" style={{background:f.color}}/>
                  <span className="fac-name">{f.label}</span>
                  <span className="fac-jp">{f.jp}</span>
                  <span className="fac-count">{chars.length}</span>
                  <span className="fac-arrow">{isOpen?'▲':'▼'}</span>
                </button>
                {isOpen&&<div className="card-grid fac-body">{chars.map(c=><GenCard key={c.id} char={c}/>)}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GenCard({char}){
  const[open,setOpen]=useState(false)
  const col=CC[char.country]||'#666'
  const skills=char.skills||[]
  const combat=skills.filter(s=>s.type==='Combat')
  const strat=skills.filter(s=>s.type==='Strategy')
  return(
    <div className="gen-card">
      <div className="gen-img-wrap" style={{borderColor:col}}>
        {char.image
          ?<img src={char.image} alt={char.name_en} className="gen-img" loading="lazy"/>
          :<div className="gen-img-ph" style={{color:col,background:col+'18'}}>{char.name_en[0]}</div>}
      </div>
      <div className="gen-body">
        <div className="gen-name">{char.name_en}</div>
        <div className="gen-jp">{char.name_jp}</div>
        <div className="gen-tags">
          <span className="ftag" style={{background:col+'22',color:col,borderColor:col+'66'}}>{FACTIONS.find(f=>f.id===char.country)?.label||char.country}</span>
          {combat.map((_,i)=><span key={i} className="stag stag-c">C{i+1}</span>)}
          {strat.map((s,i)=><span key={i} className={`stag stag-s${s.star6?' stag-6':''}`}>{s.star6?'☆6':'S'}</span>)}
        </div>
        <button className="expand-btn" onClick={()=>setOpen(o=>!o)}>
          {open?'▲ Hide skills':'▼ Show skills'}
        </button>
      </div>
      {open&&(
        <div className="skill-drawer">
          {skills.length?skills.map((sk,i)=><SkillBlock key={i} skill={sk}/>)
            :<div className="no-skills">Translation pending</div>}
        </div>
      )}
    </div>
  )
}

function SkillBlock({skill}){
  const typeColor={Combat:'#c0392b',Strategy:'#2471a3',Administration:'#27ae60'}
  const col=typeColor[skill.type]||'#888'
  return(
    <div className="skill-block">
      <div className="skill-title-row" style={{borderLeftColor:col}}>
        <div className="skill-name-group">
          <span className="skill-name">{skill.name_en}</span>
          <span className="skill-jp">{skill.name_jp}</span>
        </div>
        <div className="skill-badges">
          {skill.star6&&<span className="badge badge-gold">☆6</span>}
          <span className="badge" style={{background:col+'22',color:col,border:`1px solid ${col}44`}}>{skill.type}</span>
          {skill.type==='Administration'&&<span className="badge badge-map">Map</span>}
        </div>
      </div>
      <div className="skill-effects">
        {skill.effects.map((eff,i)=>(
          <div key={i} className="eff-row">
            {eff.condition&&<div className="eff-cond"><span className="cond-marker">IF</span>{eff.condition}</div>}
            <div className="eff-line">
              <span className="eff-who">{eff.target}</span>
              <span className="eff-arrow">→</span>
              <span className="eff-what">{eff.effect}</span>
              {eff.duration&&<span className="eff-dur">{eff.duration}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PARTY BUILDER ─────────────────────────────────────────────────────────────
function BuilderPage({atk,def,setSlot,rm,goSim}){
  const[picker,setPicker]=useState(null)
  const excl=[...atk,...def].map(c=>c.id)
  return(
    <div className="builder">
      {picker&&<Picker onSelect={c=>setSlot(c,picker.side,picker.idx)} onClose={()=>setPicker(null)} excl={excl}/>}
      <h2 className="pg-title">Party Builder</h2>
      <p className="pg-sub">Click any slot to add a general. Order matters — skills fire from last slot to first.</p>
      <div className="sides">
        <Side side="attack" label="⚔ Attacking" party={atk} onSlot={i=>setPicker({side:'attack',idx:i})} onRm={c=>rm(c,'attack')}/>
        <div className="sides-vs">VS</div>
        <Side side="defense" label="🛡 Defending" party={def} onSlot={i=>setPicker({side:'defense',idx:i})} onRm={c=>rm(c,'defense')}/>
      </div>
      {(atk.length||def.length)?<div className="sim-btn-wrap"><button className="sim-btn" onClick={goSim}>View Activation Order →</button></div>:null}
    </div>
  )
}

function Side({side,label,party,onSlot,onRm}){
  const ac=side==='attack'?'#c0392b':'#2471a3'
  return(
    <div className="side-col">
      <div className="side-label" style={{color:ac}}>{label}</div>
      {Array.from({length:4}).map((_,i)=>{
        const m=party[i]
        const bc=m?CC[m.country]||'#555':ac
        return m?(
          <div key={i} className="slot-card" style={{borderLeftColor:bc}}>
            <span className="slot-n" style={{color:ac}}>{i+1}</span>
            {m.image&&<img src={m.image} className="slot-avatar" alt={m.name_en}/>}
            <div className="slot-info">
              <div className="slot-name">{m.name_en}</div>
              <div className="slot-jp">{m.name_jp}</div>
            </div>
            <button className="icon-btn rm-btn" onClick={()=>onRm(m)}>✕</button>
          </div>
        ):(
          <button key={i} className="slot-empty" style={{borderColor:ac+'44'}} onClick={()=>onSlot(i)}>
            <span style={{color:ac+'88',fontSize:'1.4rem'}}>+</span>
            <span className="slot-hint" style={{color:ac+'66'}}>{i+1} — Click to add</span>
          </button>
        )
      })}
    </div>
  )
}

// ── ACTIVATION ORDER ──────────────────────────────────────────────────────────
function SimPage({atk,def,goBuilder}){
  if(!atk.length&&!def.length)return(
    <div className="sim-empty">
      <p>No formations set.</p>
      <button className="sim-btn" onClick={goBuilder}>Go to Party Builder</button>
    </div>
  )
  const{st,turns}=simulate(atk,def)
  return(
    <div className="sim-page">
      <h2 className="pg-title">Activation Order</h2>
      {/* Formation chips */}
      <div className="form-row">
        <FormChips generals={atk} side="attack" label="⚔ Attacking"/>
        <span className="form-vs">VS</span>
        <FormChips generals={def} side="defense" label="🛡 Defending"/>
      </div>
      {/* Strategy */}
      <section className="sim-section">
        <div className="section-head strat-head">⚑ Strategy — Always Active</div>
        <div className="strat-grid">
          <StratCol label="⚔ Attacker Strategy" entries={st.attack} side="attack"/>
          <StratCol label="🛡 Defender Strategy" entries={st.defense} side="defense"/>
        </div>
      </section>
      {/* Turns */}
      <section className="sim-section">
        <div className="section-head combat-head">⚔ Turn-by-Turn Combat</div>
        {turns.map(({turn,entries})=>(
          <div key={turn} className="turn">
            <div className="turn-head">Turn {turn}</div>
            <div className="turn-body">
              {entries.map(({general,skill,side},i)=>(
                <div key={i} className={`turn-row ${side}`}>
                  <div className="turn-stripe" style={{background:side==='attack'?'#c0392b':'#2471a3'}}/>
                  <div className="turn-cell">
                    <div className="turn-gen">
                      {general.image&&<img src={general.image} className="turn-avatar" alt={general.name_en}/>}
                      <div>
                        <span className="turn-name">{general.name_en}</span>
                        <span className="turn-jp">{general.name_jp}</span>
                      </div>
                      <span className="side-tag" style={{background:side==='attack'?'#c0392b22':'#2471a322',color:side==='attack'?'#e88':'#88c'}}>{side==='attack'?'ATK':'DEF'}</span>
                    </div>
                    {skill?<SkillBlock skill={skill}/>:<div className="normal-atk">Normal Attack</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function FormChips({generals,side,label}){
  const ac=side==='attack'?'#c0392b':'#2471a3'
  return(
    <div className="form-side">
      <div className="form-side-lbl" style={{color:ac}}>{label}</div>
      <div className="chips">
        {generals.map((g,i)=>(
          <div key={g.id} className="chip" style={{borderTopColor:CC[g.country]||'#555'}}>
            {g.image&&<img src={g.image} className="chip-img" alt={g.name_en}/>}
            <span className="chip-name">{g.name_en}</span>
          </div>
        ))}
        {!generals.length&&<span className="chip-empty">None</span>}
      </div>
    </div>
  )
}

function StratCol({label,entries,side}){
  const ac=side==='attack'?'#c0392b':'#2471a3'
  return(
    <div className="strat-col">
      <div className="strat-label" style={{color:ac,borderBottomColor:ac+'44'}}>{label}</div>
      {!entries.length?<p className="strat-none">None</p>:entries.map(({general,skills:gs})=>(
        <div key={general.id} className="strat-gen">
          <div className="strat-gen-hdr" style={{color:ac}}>
            {general.image&&<img src={general.image} className="strat-gen-img" alt={general.name_en}/>}
            <b>{general.name_en}</b>
            <span className="strat-gen-jp">{general.name_jp}</span>
          </div>
          {gs.map((sk,i)=><SkillBlock key={i} skill={sk}/>)}
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
    <div className="buffs">
      <h2 className="pg-title">CW Buffs</h2>
      <p className="pg-sub">Administration skills active during Castle Wars, even when not deployed to the battlefield.</p>
      {/* Category pills */}
      <div className="cat-row">
        {BUFF_CATS.map(c=>{
          const cnt=catCnt[c.id]||0
          if(!cnt)return null
          return(
            <button key={c.id} className={`cat-pill${cat===c.id?' active':''}`} onClick={()=>{setCat(cat===c.id?null:c.id);setStat(null)}}>
              <span>{c.icon}</span>
              <span>{c.label}</span>
              <span className="cat-cnt">{cnt}</span>
            </button>
          )
        })}
      </div>
      {/* Stat pills */}
      {cat&&(
        <div className="stat-row">
          {statsForCat.map(s=>{
            const t=buffs.filter(b=>b.unit_cat===cat&&b.stat===s).reduce((x,b)=>x+b.pct,0)
            return(
              <button key={s} className={`stat-pill${stat===s?' active':''}`} onClick={()=>setStat(stat===s?null:s)}>
                <span className="stat-name">{s}</span>
                {t>0&&<span className="stat-tot">+{t.toFixed(1)}%</span>}
              </button>
            )
          })}
        </div>
      )}
      {/* Results */}
      {cat&&stat&&(
        <div className="buff-results">
          <div className="buff-res-hdr">
            <span className="buff-res-title">{cat} · {stat}</span>
            {isPct&&grand>0&&<span className="buff-grand">Stack total: <b>+{grand.toFixed(1)}%</b></span>}
          </div>
          <div className="buff-grid">
            {chars.map(entry=>{
              const col=CC[entry.char_country]||'#666'
              const tot=entry.list.reduce((s,b)=>s+b.pct,0)
              return(
                <div key={entry.char_id} className="buff-card" style={{borderTopColor:col}}>
                  <div className="buff-card-hdr">
                    {entry.char_image
                      ?<img src={entry.char_image} className="buff-avatar" alt={entry.char_name}/>
                      :<div className="buff-avatar-ph" style={{color:col,background:col+'22'}}>{entry.char_name[0]}</div>}
                    <div className="buff-card-info">
                      <span className="buff-char-name">{entry.char_name}</span>
                      {tot>0&&<span className="buff-pct" style={{color:col}}>+{tot.toFixed(1)}%</span>}
                    </div>
                  </div>
                  <div className="buff-effs">
                    {entry.list.map((b,i)=>(
                      <div key={i} className="buff-eff">
                        <span className="buff-eff-txt">{b.effect}</span>
                        {b.condition&&!b.condition.includes('deployed')&&!b.condition.includes('CW battle')
                          &&<span className="buff-eff-cond">{b.condition}</span>}
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
