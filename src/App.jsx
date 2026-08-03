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
const CWStatsPage = lazy(() => import('./cwstats.jsx').then(m => ({ default: m.CWStatsPage })))
const CWGuidePage = lazy(() => import('./pages.jsx').then(m => ({ default: m.CWGuidePage })))
const CastlePointsPage = lazy(() => import('./castlepoints.jsx'))

const PAGES=['Home','Archive','Guide','Party Builder','Battle Order','Castle Points','Buffs','Tier List','Team Cost','Stats Calculator']
const PAGE_TO_ROUTE={
  'Home':'/',
  'Archive':'/archive',
  'Guide':'/guide',
  'Party Builder':'/builder',
  'Battle Order':'/sim',
  'Castle Points':'/castle-points',
  'Buffs':'/buffs',
  'Tier List':'/tiers',
  'Team Cost':'/cost',
  'Stats Calculator':'/cw-stats',
}
const NAV_GROUPS=[
  {
    label:'Archive',
    route:'/archive',
    pages:['Archive'],
    items:[
      {label:'Characters',route:'/archive/characters',note:'Skills, stats, and factions'},
      {label:'CW6★ Scene Cards',route:'/archive/cw6-scene-cards',note:'Owners and translated skills'},
    ],
  },
  {
    label:'Teams',
    route:'/builder',
    pages:['Tier List','Party Builder','Battle Order'],
    items:[
      {label:'Party Builder',route:'/builder',note:'Build attacking and defending teams'},
      {label:'Metawatch',route:'/tiers',note:'Current recommended formations'},
      {label:'Battle Order',route:'/sim',note:'Review turns and team buffs'},
    ],
  },
  {label:'Guide',route:'/guide',pages:['Guide']},
  {
    label:'Tools',
    route:'/buffs',
    pages:['Buffs','Stats Calculator','Team Cost','Castle Points'],
    items:[
      {label:'Buff Tracker',route:'/buffs',note:'Mark owned sources and totals'},
      {label:'Stats Calculator',route:'/cw-stats',note:'Calculate Castle War power'},
      {label:'Team Cost',route:'/cost',note:'Plan red crystal costs'},
      {label:'Castle Points',route:'/castle-points',note:'Project alliance ranking'},
    ],
  },
]
const MOBILE_TABS=[
  {label:'Archive',page:'Archive',route:'/archive',icon:'archive'},
  {label:'Builder',page:'Party Builder',route:'/builder',icon:'teams'},
  {label:'Metawatch',page:'Tier List',route:'/tiers',icon:'rank'},
  {label:'Guide',page:'Guide',route:'/guide',icon:'book'},
]
const TOOL_PAGES=['Buffs','Stats Calculator','Team Cost','Castle Points']
const TOOL_LINKS=NAV_GROUPS.find(group=>group.label==='Tools').items
function routeMatches(pathname,page){
  const r=PAGE_TO_ROUTE[page]
  if(pathname===r||pathname===r+'/') return true
  if(pathname.startsWith(r+'/')) return true
  return false
}
function currentPage(pathname){
  return PAGES.find(p=>routeMatches(pathname,p))||'Home'
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
  if(pathname.startsWith('/castle-points')) return 'Castle Points - RanHQ'
  if(pathname.startsWith('/sim')) return 'Battle Order - RanHQ'
  if(pathname.startsWith('/builder')) return 'Party Builder - RanHQ'
  if(pathname.startsWith('/buffs')) return 'Buffs - RanHQ'
  if(pathname.startsWith('/tiers')) return 'Metawatch - Tier List - RanHQ'
  if(pathname.startsWith('/cost')) return 'Team Cost - RanHQ'
  if(pathname.startsWith('/cw-stats')) return 'Stats Calculator - RanHQ'
  if(pathname.startsWith('/guide')) return 'Guide - RanHQ'
  return BASE_TITLE
}
function UiIcon({name,size=20}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true}
  if(name==='archive') return <svg {...common}><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.5-3.7 2.3-5.5 5.5-5.5s5 1.8 5.5 5.5"/><path d="M16 5h5M16 9h5M17 13h4M17 17h4"/></svg>
  if(name==='rank') return <svg {...common}><path d="M6 20v-6M12 20V9M18 20V4"/><path d="m4 10 5-4 4 2 6-6"/></svg>
  if(name==='teams') return <svg {...common}><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 15c3.7-.5 6.2 1.2 6.8 5"/></svg>
  if(name==='book') return <svg {...common}><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22z"/></svg>
  if(name==='tools') return <svg {...common}><path d="m14.7 6.3 3-3a4.2 4.2 0 0 1-5.3 5.3l-7 7a2.1 2.1 0 1 0 3 3l7-7a4.2 4.2 0 0 0 5.3-5.3l-3 3z"/></svg>
  if(name==='chevron') return <svg {...common}><path d="m8 10 4 4 4-4"/></svg>
  if(name==='arrow') return <svg {...common}><path d="M5 12h14M14 7l5 5-5 5"/></svg>
  return null
}
// Shown while a lazy route chunk loads: a top progress bar (immediate "something
// is happening" feedback) plus a content skeleton in place of bare "Loading…".
function RouteFallback(){
  return(
    <>
      <div className="route-progress" aria-hidden="true"><span/></div>
      <div className="route-skeleton" role="status" aria-busy="true" aria-label="Loading">
        <div className="sk sk-title"/>
        <div className="sk sk-sub"/>
        <div className="sk-grid">
          {Array.from({length:8}).map((_,i)=><div key={i} className="sk sk-card"/>)}
        </div>
      </div>
    </>
  )
}
export default function App(){
  const location=useLocation()
  const navigate=useNavigate()
  const page=currentPage(location.pathname)
  const[atk,setAtk]=useState([null,null,null,null])
  const[def,setDef]=useState([null,null,null,null])
  const[atkSk,setAtkSk]=useState(defaultSks())
  const[defSk,setDefSk]=useState(defaultSks())
  const[moreOpen,setMoreOpen]=useState(false)
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
  // Close the mobile "More" sheet on any navigation and lock scroll / allow Escape while it's open.
  useEffect(()=>{setMoreOpen(false)},[location.pathname])
  useEffect(()=>{
    if(!moreOpen) return
    const onKey=e=>{if(e.key==='Escape')setMoreOpen(false)}
    document.addEventListener('keydown',onKey)
    const prev=document.body.style.overflow
    document.body.style.overflow='hidden'
    return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow=prev}
  },[moreOpen])
  // Keep route-level SEO tags in sync for crawlers that render the SPA.
  useEffect(()=>{
    const seo=routeSeo(location.pathname)
    setSeo({...seo,title:seo.title||pageTitle(location.pathname),pathname:location.pathname})
  },[location.pathname])
  const selectedCount=atk.filter(Boolean).length+def.filter(Boolean).length
  return(
    <div className="app">
      <header className="hdr">
        <div className="hdr-in">
          <Link className="logo" to="/" aria-label="RanHQ home">
            <img src="/ranhq-icon.webp" alt="RanHQ" className="logo-icon"/>
            <div>
              <div className="logo-ja">キングダム乱</div>
              <div className="logo-en">RanHQ</div>
            </div>
          </Link>
          <nav className="nav" aria-label="Primary navigation">
            {NAV_GROUPS.map(group=>{
              const active=group.pages.includes(page)
              return(
                <div key={group.label} className={`nav-group${active?' nav-group-active':''}`}>
                  <Link className="nav-link" to={group.route}>
                    <span>{group.label}</span>
                    {group.label==='Teams'&&selectedCount>0&&<span className="nav-count" aria-label={`${selectedCount} selected generals`}>{selectedCount}</span>}
                    {group.items&&<UiIcon name="chevron" size={15}/>}
                  </Link>
                  {group.items&&(
                    <div className="nav-menu">
                      <div className="nav-menu-title">{group.label}</div>
                      {group.items.map(item=>(
                        <Link key={item.route} to={item.route} className={location.pathname.startsWith(item.route)?'is-current':''}>
                          <span>{item.label}</span>
                          <small>{item.note}</small>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </header>
      <div className="app-body">
        <Suspense fallback={<RouteFallback/>}>
          <Routes>
          <Route path="/" element={<HomePage/>}/>
          <Route path="/archive" element={<ArchiveHubPage/>}/>
          <Route path="/archive/characters" element={<><ArchiveTabs active="characters"/><ArchivePage/></>}/>
          <Route path="/archive/characters/:charId" element={<><ArchiveTabs active="characters"/><ArchivePage/></>}/>
          <Route path="/archive/cw6-scene-cards" element={<CW6SceneCardsPage/>}/>
          <Route path="/archive/:charId" element={<><ArchiveTabs active="characters"/><ArchivePage/></>}/>
          <Route path="/builder" element={<BuilderPage atk={atk} def={def} atkSk={atkSk} defSk={defSk} setAtkSk={setAtkSk} setDefSk={setDefSk} setSlot={setSlot} rm={rm} goSim={()=>navigate('/sim')} loadMetaTeam={loadMetaTeam}/>}/>
          <Route path="/sim" element={<SimPage atk={atk} def={def} atkSk={atkSk} defSk={defSk} goBuilder={()=>navigate('/builder')}/>}/>
          <Route path="/castle-points" element={<CastlePointsPage/>}/>
          <Route path="/buffs" element={<BuffsPage/>}/>
          <Route path="/tiers" element={<TierPage/>}/>
          <Route path="/cost" element={<TeamCostPage/>}/>
          <Route path="/cw-stats" element={<CWStatsPage/>}/>
          <Route path="/guide" element={<CWGuidePage/>}/>
          <Route path="/guide/:section" element={<CWGuidePage/>}/>
          <Route path="*" element={<Navigate to="/archive" replace/>}/>
        </Routes>
        </Suspense>
      </div>
      <footer className="foot">
        <div className="foot-inner">
          <div className="foot-primary">
            <span>Made by <strong>@ZiyadRed</strong> · Purgatory 復活 · Room 575</span>
            <span>Special thanks <strong>@WiperLuffy</strong> · <a href="https://touranko.vercel.app" target="_blank" rel="noopener noreferrer">touranko.vercel.app</a></span>
            <a className="foot-discord" href="https://discord.gg/XeeuWs9G2K" target="_blank" rel="noopener noreferrer">Join the Discord</a>
          </div>
          <div className="foot-legal">
            <span>Unofficial fan site — not for commercial purposes.</span>
            <span>© Yasuhisa Hara / Shueisha・Kingdom Production Committee ©でらゲー</span>
            <span lang="ja">非公式ファンサイト・営利目的ではありません。 © 原泰久／集英社・キングダム製作委員会 ©でらゲー</span>
          </div>
        </div>
      </footer>
      <nav className="bottom-nav">
        {MOBILE_TABS.map(tab=>{
          const active=page===tab.page||(tab.page==='Party Builder'&&page==='Battle Order')
          return(
            <Link key={tab.label} className={`bntab${active?' bntab-on':''}`} to={tab.route}>
              <span className="bntab-icon"><UiIcon name={tab.icon}/></span>
              {tab.label}
            </Link>
          )
        })}
        <button type="button" className={`bntab${TOOL_PAGES.includes(page)?' bntab-on':''}`} aria-haspopup="dialog" aria-expanded={moreOpen} onClick={()=>setMoreOpen(true)}>
          <span className="bntab-icon"><UiIcon name="tools"/></span>
          Tools
        </button>
      </nav>
      {moreOpen&&(
        <div className="bn-sheet-overlay" onClick={()=>setMoreOpen(false)}>
          <div className="bn-sheet" role="dialog" aria-modal="true" aria-label="RanHQ tools" onClick={e=>e.stopPropagation()}>
            <div className="bn-sheet-grip"/>
            <div className="bn-sheet-head">
              <div><strong>Tools</strong><span>Track progress and calculate Castle War values.</span></div>
              <button type="button" onClick={()=>setMoreOpen(false)} aria-label="Close tools">×</button>
            </div>
            {TOOL_LINKS.map(item=>(
              <Link key={item.route} className={`bn-sheet-item${location.pathname.startsWith(item.route)?' bn-sheet-item-on':''}`} to={item.route} onClick={()=>setMoreOpen(false)}>
                <span className="bn-sheet-item-icon"><UiIcon name="tools" size={18}/></span>
                <span><strong>{item.label}</strong><small>{item.note}</small></span>
                <UiIcon name="arrow" size={17}/>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── ARCHIVE ───────────────────────────────────────────────────────────────────
function HomePage(){
  const lanes=[
    {
      icon:'archive',
      title:'Find game information',
      description:'Translated character skills and Castle War references in one searchable archive.',
      links:[
        {label:'Characters',route:'/archive/characters'},
        {label:'CW6★ Scene Cards',route:'/archive/cw6-scene-cards'},
      ],
    },
    {
      icon:'teams',
      title:'Build and compare teams',
      description:'Start with current formations, adjust unlocked skills, and inspect the battle order.',
      links:[
        {label:'Party Builder',route:'/builder'},
        {label:'Metawatch',route:'/tiers'},
        {label:'Battle Order',route:'/sim'},
      ],
    },
    {
      icon:'tools',
      title:'Track and calculate',
      description:'Keep your owned buffs organized and plan the resources and power behind each team.',
      links:[
        {label:'Buff Tracker',route:'/buffs'},
        {label:'Stats Calculator',route:'/cw-stats'},
        {label:'Team Cost',route:'/cost'},
        {label:'Castle Points',route:'/castle-points'},
      ],
    },
  ]
  const guideLinks=[
    {label:'Castle War basics',route:'/guide/basics',image:'/guide/basics-map-en.webp'},
    {label:'General roles',route:'/guide/roles',image:'/guide/roles-selection.webp'},
    {label:'CW stats screen',route:'/guide/stats-screen',image:'/guide/cw-stats-screen.webp'},
  ]
  return(
    <main className="home-page">
      <section className="home-hero">
        <img
          src="/ranhq-home-banner-1200.webp"
          srcSet="/ranhq-home-banner-640.webp 640w, /ranhq-home-banner-1200.webp 1200w, /ranhq-home-banner.webp 1881w"
          sizes="(max-width: 1560px) 100vw, 1560px"
          alt="" className="home-hero-img" width="1881" height="836" decoding="async"/>
        <div className="home-hero-shade"/>
        <div className="home-hero-content">
          <h1>RanHQ</h1>
          <p>Your Castle War companion for team building, buffs, matchups, and everything CW related.</p>
          <div className="home-actions">
            <Link className="home-primary" to="/archive">Open Archive</Link>
            <Link className="home-secondary" to="/builder">Build a Team</Link>
          </div>
        </div>
      </section>

      <section className="home-tools">
        <div className="home-task-lanes">
          {lanes.map((lane)=>(
            <article key={lane.title} className="home-task-lane">
              <div className="home-task-head">
                <span className="home-task-icon"><UiIcon name={lane.icon} size={24}/></span>
                <div><h3>{lane.title}</h3><p>{lane.description}</p></div>
              </div>
              <div className="home-task-links">
                {lane.links.map(link=>(
                  <Link key={link.route} to={link.route}><span>{link.label}</span><UiIcon name="arrow" size={17}/></Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-guide-preview">
        <div className="home-guide-copy">
          <h2>Learn Castle War</h2>
          <p>Use the field guide when you need mechanics, targeting rules, status effects, terrain, or matchup references.</p>
          <Link to="/guide">Open the complete guide <UiIcon name="arrow" size={17}/></Link>
        </div>
        <div className="home-guide-list">
          {guideLinks.map(item=>(
            <Link key={item.route} to={item.route}>
              <img src={item.image} alt="" loading="lazy" decoding="async"/>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

