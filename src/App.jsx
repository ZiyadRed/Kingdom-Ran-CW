import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import { routeSeo, setSeo } from './seo.js'

// Inlined here (no data import) so the shell — and the Home route — never pull
// in the character data / engine chunk. Pages resolve their own data lazily.
const DEFAULT_SK = {n:3, s6:true}
const defaultSks = () => Array.from({length:4}, () => ({...DEFAULT_SK}))

// Route pages are code-split: the page bundle (and the data/engine it pulls)
// loads on first navigation instead of blocking the initial Home render.
const ArchiveTabs = lazy(() => import('./pages.jsx').then(m => ({ default: m.ArchiveTabs })))
const ArchiveHubPage = lazy(() => import('./pages.jsx').then(m => ({ default: m.ArchiveHubPage })))
const CW6SceneCardsPage = lazy(() => import('./pages.jsx').then(m => ({ default: m.CW6SceneCardsPage })))
const ArchivePage = lazy(() => import('./pages.jsx').then(m => ({ default: m.ArchivePage })))
const BuilderPage = lazy(() => import('./pages.jsx').then(m => ({ default: m.BuilderPage })))
const SimPage = lazy(() => import('./pages.jsx').then(m => ({ default: m.SimPage })))
const BuffsPage = lazy(() => import('./pages.jsx').then(m => ({ default: m.BuffsPage })))
const TierPage = lazy(() => import('./pages.jsx').then(m => ({ default: m.TierPage })))
const TeamCostPage = lazy(() => import('./pages.jsx').then(m => ({ default: m.TeamCostPage })))
const CWGuidePage = lazy(() => import('./pages.jsx').then(m => ({ default: m.CWGuidePage })))

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
const BASE_TITLE='RanHQ - Kingdom Ran Castle War Companion'
// Per-route document title for accurate tabs, history, bookmarks, and SEO.
function pageTitle(pathname){
  if(pathname==='/'||pathname==='') return BASE_TITLE
  if(pathname.startsWith('/archive')){
    if(pathname.includes('cw6-scene-cards')) return 'CW6★ Scene Cards — Archive — RanHQ'
    // A specific character title is set by ArchivePage once it resolves the id.
    return 'Archive — RanHQ'
  }
  if(pathname.startsWith('/sim')) return 'Battle Order - RanHQ'
  if(pathname.startsWith('/builder')) return 'Party Builder - RanHQ'
  if(pathname.startsWith('/buffs')) return 'Buffs - RanHQ'
  if(pathname.startsWith('/tiers')) return 'Metawatch - Tier List - RanHQ'
  if(pathname.startsWith('/cost')) return 'Team Cost - RanHQ'
  if(pathname.startsWith('/guide')) return 'Guide - RanHQ'
  return BASE_TITLE
}
function PageIcon({p}){
  const v=PAGE_ICONS[p]
  if(v&&typeof v==='object'&&v.img) return <img src={v.img} alt="" className="bntab-img"/>
  return <span>{v}</span>
}
export default function App(){
  const location=useLocation()
  const navigate=useNavigate()
  const page=currentPage(location.pathname)
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
  // Receives already-resolved character objects (BuilderPage resolves names via
  // findCharByName) so the shell doesn't depend on the data module.
  const loadMetaTeam=(chars,side)=>{
    const picked=(chars||[]).filter(Boolean).slice(0,4)
    const slots=[...picked,...Array(Math.max(0,4-picked.length)).fill(null)]
    if(side==='attack'){ setAtk(slots); setAtkSk(defaultSks()) }
    else { setDef(slots); setDefSk(defaultSks()) }
    navigate('/builder')
  }
  // Scroll to top when switching top-level tab (not on character deep-link changes within Archive)
  useEffect(()=>{window.scrollTo(0,0)},[page])
  // Keep route-level SEO tags in sync for crawlers that render the SPA.
  useEffect(()=>{
    const seo=routeSeo(location.pathname)
    setSeo({...seo,title:seo.title||pageTitle(location.pathname),pathname:location.pathname})
  },[location.pathname])
  return(
    <div className="app">
      <header className="hdr">
        <div className="hdr-in">
          <Link className="logo" to="/" style={{color:'inherit'}}>
            <img src="/ranhq-icon.webp" alt="RanHQ" className="logo-icon"/>
            <div>
              <div className="logo-ja">キングダム乱</div>
              <div className="logo-en">RanHQ</div>
            </div>
          </Link>
          <nav className="nav">
            {PAGES.map(p=>(
              <Link key={p} className={`nb${page===p?' nb-on':''}`} to={PAGE_TO_ROUTE[p]}>
                {p}{p==='Party Builder'&&(atk.filter(Boolean).length+def.filter(Boolean).length)>0&&<span className="nb-dot">{atk.filter(Boolean).length+def.filter(Boolean).length}</span>}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="app-body">
        <Suspense fallback={<div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--txt3)' }}>Loading…</div>}>
          <Routes>
          <Route path="/" element={<HomePage/>}/>
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
        </Suspense>
      </div>
      <footer className="foot">
        <div style={{marginTop:'.35rem'}}>Made by <strong>@ZiyadRed</strong> · Purgatory 復活 · Room 575</div>
        <div style={{marginTop:'.2rem'}}>Special thanks <strong>@WiperLuffy</strong> · <a href="https://touranko.vercel.app" target="_blank" rel="noopener noreferrer" style={{color:'var(--txt3)',textDecoration:'underline'}}>touranko.vercel.app</a></div>
        <div style={{marginTop:'.35rem',color:'var(--txt3)'}}>Unofficial fan site — not for commercial purposes.</div>
        <div style={{marginTop:'.2rem',color:'var(--txt3)'}}>© Yasuhisa Hara / Shueisha・Kingdom Production Committee ©でらゲー</div>
        <div style={{marginTop:'.2rem',color:'var(--txt3)'}}>非公式ファンサイト・営利目的ではありません。</div>
        <div style={{marginTop:'.2rem',color:'var(--txt3)'}}>© 原泰久／集英社・キングダム製作委員会 ©でらゲー</div>
        <div style={{marginTop:'.2rem'}}><a href="https://discord.gg/XeeuWs9G2K" target="_blank" rel="noopener noreferrer" style={{color:'var(--txt3)',textDecoration:'underline'}}>Join the Discord</a></div>
      </footer>
      <nav className="bottom-nav">
        {PAGES.map(p=>(
          <Link key={p} className={`bntab${page===p?' bntab-on':''}`} to={PAGE_TO_ROUTE[p]}>
            <span className="bntab-icon"><PageIcon p={p}/></span>
            {PAGE_SHORT[p]}
          </Link>
        ))}
      </nav>
    </div>
  )
}

// ── ARCHIVE ───────────────────────────────────────────────────────────────────
function HomePage(){
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
        <img
          src="/ranhq-home-banner-1200.webp"
          srcSet="/ranhq-home-banner-640.webp 640w, /ranhq-home-banner-1200.webp 1200w, /ranhq-home-banner.webp 1881w"
          sizes="(max-width: 1560px) 100vw, 1560px"
          alt="" className="home-hero-img" width="1881" height="836" decoding="async" fetchPriority="high"/>
        <div className="home-hero-shade"/>
        <div className="home-hero-content">
          <div className="home-kicker">Kingdom Ran Castle War companion</div>
          <h1>RanHQ</h1>
          <p>
            RanHQ is a fan-made English project for Kingdom Ran's Castle War mode,
            built to help players learn the mode, understand skills and buffs, and plan stronger strategies.
          </p>
          <p lang="ja">
            キングダム乱（キンラン / キングダム 乱 -天下統一への道-）の同盟争覇戦・争覇戦向けに、
            武将スキル、バフ、編成、攻略メモを英語で整理しています。
          </p>
          <div className="home-actions">
            <Link className="home-primary" to="/archive">Open Archive</Link>
            <Link className="home-secondary" to="/guide">Read Guide</Link>
          </div>
        </div>
      </section>

      <section className="home-tools">
        <div className="home-section-head">
          <h2>Start Here</h2>
        </div>
        <div className="home-tool-grid">
          {tools.map((tool,i)=>(
            <Link key={tool.page} className={`home-tool-card${i<2?' home-tool-card-main':''}`} to={PAGE_TO_ROUTE[tool.page]}>
              <span className="home-tool-index">{String(i+1).padStart(2,'0')}</span>
              <strong>{tool.title}</strong>
              <span>{tool.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

