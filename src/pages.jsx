import { useState, useEffect, useMemo, useDeferredValue, useRef } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import cwBuffsData  from '../data/cw_buffs.json'
import cwTeamBuffs  from '../data/cw_team_buffs.json'
import sceneCardBuffs from '../data/scene_card_cw_buffs.json'

import {
  useModalDismiss, useProgressTracker, progressFilterItems, ProgressTools, OwnedToggle, SceneStarControl, buffSourceId, ALL, findCharById, findCharByName, ARCHIVE_CHAR_COUNT, persosThumb, RED_CRYSTAL_TOTAL_COST, RED_CRYSTAL_SKILL_COSTS, redCrystalBuffUnlockCost, RedCrystalCostChip, BuffValueCluster, FACTIONS, MIXED_COUNTRY, metaTeamsByCountry, CC, CharIcon, TYPE_COLOR, TIER_TEAMS, simulate, SCENE_CARD, calcCharBuffs, calcTeamEnemyDebuffs, Picker, RARITY_DATA, INVERSE_STATS, SPECIAL_STATS, statSortKey, CHAR_GROUPS, DEFAULT_SK, hasStar6, hasRoleSkill, updateSkillMasks, applyMask, buffEntryRarity, PUBLIC_CW6_CARDS
} from './core.jsx'
import { characterSeo, routeSeo, setSeo } from './seo.js'
import { classifyConditionParts } from './skillConditions.js'
import { useLocale, formatNumber as formatLocaleNumber } from './i18n/index.js'
import { localizedTeamName } from './i18n/team-names.js'
import { localizedCharacterName, matchesCharacterName } from './i18n/ar-character-names.js'
import { localizedCharacter, localizedDuration, localizedSkill, localizedTarget, localizedText } from './i18n/data.js'
import { builderShareUrl, characterShareUrl, createCharacterSkillsImage, createTeamSkillsImage, downloadBlob, formatCharacterSkillsShare, formatSceneCardShare, formatTeamBuffShare, sceneCardShareUrl, shareImageBlob, shareText } from './share.js'

export function ArchiveTabs({active}){
  const{t}=useTranslation('common')
  const tabs=[
    {id:'characters',label:t('nav.characters'),count:String(ARCHIVE_CHAR_COUNT),route:'/archive/characters'},
    {id:'cw6',label:t('nav.sceneCards'),count:String(PUBLIC_CW6_CARDS.length),route:'/archive/cw6-scene-cards'},
  ]
  return(
    <nav className="archive-tabs" aria-label={t('archive.sections')}>
      {tabs.map(tab=>{
        const on=active===tab.id
        return(
          <Link key={tab.id} to={tab.route} className={`archive-tab${on?' archive-tab-active':''}`} aria-current={on?'page':undefined}>
            {tab.label}
            <span>{tab.count}</span>
          </Link>
        )
      })}
    </nav>
  )
}

// Small overlay button placed on a scene-card image to open full-resolution art.
function ViewArtButton({onClick,style}){
  const{t}=useTranslation('common')
  return(
    <button
      type="button"
      title={t('viewArt')}
      aria-label={t('viewArt')}
      onClick={onClick}
      style={{
        position:'absolute',top:7,right:7,zIndex:4,
        width:26,height:26,minHeight:0,padding:0,cursor:'pointer',
        display:'inline-flex',alignItems:'center',justifyContent:'center',
        borderRadius:'50%',border:'1.5px solid rgba(255,255,255,.85)',
        background:'rgba(6,38,76,.45)',color:'#fff',
        WebkitBackdropFilter:'blur(3px)',backdropFilter:'blur(3px)',
        boxShadow:'0 1px 5px rgba(0,0,0,.28)',
        ...style,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
      </svg>
    </button>
  )
}

// Full-screen lightbox showing an image at full resolution. Click backdrop / Esc to close.
function ArtLightbox({src,alt,onClose}){
  const{t}=useTranslation('common')
  useModalDismiss(!!src,onClose)
  if(!src) return null
  return(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position:'fixed',inset:0,zIndex:1000,
        background:'rgba(0,0,0,.85)',cursor:'zoom-out',
        display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',
      }}
    >
      <img
        src={src} alt={alt||''}
        onClick={e=>e.stopPropagation()}
        style={{maxWidth:'95vw',maxHeight:'95vh',objectFit:'contain',cursor:'default',
          borderRadius:8,boxShadow:'0 10px 50px rgba(0,0,0,.6)'}}
      />
      <button
        type="button" onClick={onClose} aria-label={t('close')}
        style={{position:'fixed',top:16,right:18,width:40,height:40,borderRadius:'50%',
          border:'1px solid rgba(255,255,255,.3)',background:'rgba(0,0,0,.5)',color:'#fff',
          fontSize:'1.5rem',lineHeight:1,cursor:'pointer'}}
      >{'×'}</button>
      <a
        href={src} target="_blank" rel="noopener noreferrer"
        onClick={e=>e.stopPropagation()}
        style={{position:'fixed',bottom:18,left:'50%',transform:'translateX(-50%)',
          fontSize:'.72rem',color:'rgba(255,255,255,.82)',textDecoration:'underline'}}
      >{t('openOriginal')}</a>
    </div>
  )
}

// <img> that fades in once decoded, avoiding the hard pop-in as scene-card art
// streams in. Handles cached images (already `complete` on mount) so they never
// get stuck transparent.
function FadeImg({className='',...props}){
  const onMount=el=>{ if(el&&el.complete&&el.naturalWidth>0) el.classList.add('is-loaded') }
  return <img ref={onMount} className={`fade-img ${className}`.trim()} onLoad={e=>e.currentTarget.classList.add('is-loaded')} {...props}/>
}

const characterSkillsWithRole=character=>[
  ...(character?.skills||[]),
  ...(character?.roleSkill?[character.roleSkill]:[]),
]
const factionDisplay=(f,locale)=>{
  if(!f) return ''
  if(locale?.code==='ja') return f.jp||f.label
  return locale?.code==='ar'?localizedText(f.label,'ar'):f.label
}

const ROLE_SKILL_ICON={
  Leader:'/icons/royal_helmet_hex_badge.webp',
  Strategist:'/icons/feather_fan_hex_badge.webp',
}

const SKILL_LEVEL_ICON={
  1:'/icons/number_1_hex_badge.webp',
  2:'/icons/number_2_hex_badge.webp',
  3:'/icons/number_3_hex_badge.webp',
}

const CW6_SKILL_ICON='/icons/neon_cw6_hexagon_badge.webp'

export function ArchiveHubPage(){
  return(
    <>
      <ArchiveTabs active="characters"/>
      <ArchivePage hideTabs/>
    </>
  )
}

export function CW6SceneCardsPage(){
  const shareLabels=useShareLabels()
  const locale=useLocale()
  const{t}=useTranslation('common')
  const[selected,setSelected]=useState(null)
  const[artSrc,setArtSrc]=useState(null)
  const[progressFilter,setProgressFilter]=useState('all')
  const tracker=useProgressTracker()
  const cards=PUBLIC_CW6_CARDS
  const visibleCards=cards.filter(card=>{
    const owned=tracker.isOwned('cw6Cards',card.id)
    return progressFilter==='all'||(progressFilter==='owned'?owned:!owned)
  })
  const ownedCount=tracker.countOwned('cw6Cards',cards.map(c=>c.id))
  const pickCard=card=>setSelected(selected?.id===card.id?null:card)
  const clearSelection=()=>setSelected(null)
  const sceneCardFileName=card=>card.name_en||`${card.ownerName||'Scene'} CW6 star`
  const sceneCardAccessibleName=card=>{
    const owner=localizedCharacterName(locale.code==='ja'?(card.ownerNameJp||card.ownerName):card.ownerName,locale)
    const skill=locale.code==='ja'?(card.skill_jp||card.skill_en):card.skill_en
    return [owner,t('archive.sceneCards'),skill].filter(Boolean).join(' — ')
  }
  return(
    <>
    <ArchiveTabs active="cw6"/>
    <div className={'archive-layout cw6-scene-page' + (selected?' has-selection':'')}>
      <div className="gallery-wrap">
        <div className="gallery-header" style={{alignItems:'flex-start',gap:'12px',flexWrap:'wrap'}}>
          <div>
            <h1 className="gallery-title">{t('nav.sceneCards')}</h1>
            <div style={{fontSize:'.72rem',color:'var(--txt3)',marginTop:'3px'}}>{t('archive.sceneSubtitle')}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'9px',flexWrap:'wrap',marginLeft:'auto'}}>
            <span className="gallery-count">{t('ownedCount',{owned:ownedCount,total:cards.length})}</span>
            <div className="progress-filter-group" aria-label={t('archive.ownershipFilter')}>
              {progressFilterItems.map(item=>(
                <button key={item.id} type="button" className={progressFilter===item.id?'active':''} onClick={()=>setProgressFilter(item.id)}>{t(item.id,{defaultValue:item.label})}</button>
              ))}
            </div>
            <ProgressTools tracker={tracker}/>
          </div>
        </div>
        <div className="cw6-scene-grid">
          {visibleCards.map((card,i)=>(
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              onClick={()=>pickCard(card)}
              onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pickCard(card)}}}
              className={`cw6-card${selected?.id===card.id?' is-selected':''}`}>
              <div className="cw6-card-art">
                <FadeImg src={card.thumb||card.image} alt={sceneCardAccessibleName(card)} title={sceneCardAccessibleName(card)} loading={i<7?'eager':'lazy'} decoding="async" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
                {card.image&&<ViewArtButton onClick={e=>{e.stopPropagation();setArtSrc(card.image)}} style={{left:7,right:'auto'}}/>}
                <OwnedToggle
                  owned={tracker.isOwned('cw6Cards',card.id)}
                  className="owned-toggle-overlay"
                  onToggle={e=>{e.stopPropagation();tracker.toggleOwned('cw6Cards',card.id)}}
                />
              </div>
              <div className="cw6-card-body">
                <div>
                  <strong className="cw6-card-skill">{locale.code==='ja'?(card.skill_jp||card.skill_en):card.skill_en}</strong>
                  <span className="cw6-card-jp">{card.skill_jp}</span>
                </div>
                {card.ownerName&&(
                  <div className="cw6-card-owner">
                    {card.ownerIcon&&<img className="cw6-card-owner-ico" src={card.ownerIcon} alt="" loading="lazy" decoding="async"/>}
                    <span className="cw6-card-owner-name">{localizedCharacterName(locale.code==='ja'?(card.ownerNameJp||card.ownerName):card.ownerName, locale)}</span>
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
            <FadeImg src={selected.image} alt={sceneCardAccessibleName(selected)} className="detail-portrait" loading="eager" decoding="async" style={{objectFit:'contain',background:'rgba(255,255,255,.08)',objectPosition:'center'}}/>
            <div className="detail-info">
              <div className="detail-name">{locale.code==='ja'?(selected.skill_jp||selected.skill_en):selected.skill_en}</div>
              {secondaryName(locale.code==='ja'?(selected.skill_jp||selected.skill_en):selected.skill_en,selected.skill_jp)&&(
                <div className="detail-jp">{selected.skill_jp}</div>
              )}
              {selected.ownerName&&(
                <div className="detail-faction" style={{display:'flex',alignItems:'center',gap:'6px',color:'rgba(255,255,255,.82)'}}>
                  {selected.ownerIcon&&<img src={selected.ownerIcon} alt="" loading="lazy" decoding="async" style={{width:18,height:18,borderRadius:'50%',objectFit:'cover',objectPosition:'center top',border:'1px solid rgba(255,255,255,.22)'}}/>}
                  <span>{localizedCharacterName(locale.code==='ja'?(selected.ownerNameJp||selected.ownerName):selected.ownerName, locale)}</span>
                </div>
              )}
            </div>
            <div className="detail-actions">
              <ShareButton
                title={`${selected.skill_en||sceneCardFileName(selected)} - RanHQ`}
                getText={()=>formatSceneCardShare(selected,{url:sceneCardShareUrl(locale.code),labels:shareLabels})}
              />
              <SkillImageButton
                character={{
                  ...selected,
                  name_en:selected.ownerName||selected.skill_en||sceneCardFileName(selected),
                  name_jp:selected.ownerNameJp||selected.skill_jp,
                  icon:selected.ownerIcon,
                  unit_type:'CW6 Scene Card',
                  skills:selected.skill?[selected.skill]:[],
                }}
                url={sceneCardShareUrl(locale.code)}
                label={t('archive.sceneCards')}
              />
            </div>
            <button className="detail-close" onClick={clearSelection} aria-label={t('close')}>{'\u00d7'}</button>
          </div>
          <div className="detail-skills">
            <OwnedToggle
              owned={tracker.isOwned('cw6Cards',selected.id)}
              onToggle={()=>tracker.toggleOwned('cw6Cards',selected.id)}
            />
            {selected.skill?<SkillCard skill={localizedSkill({...selected.skill,cwId:selected.cwIds?.[5]},selected.owner_id,5,locale)}/>:<p className="no-skills">{t('translationPending')}</p>}
          </div>
        </aside>
      )}
    </div>
    <ArtLightbox src={artSrc} alt={t('archive.cardArt')} onClose={()=>setArtSrc(null)}/>
    </>
  )
}

export function ArchivePage(){
  const shareLabels=useShareLabels()
  const{charId}=useParams()
  const navigate=useNavigate()
  const location=useLocation()
  const locale=useLocale()
  const{t}=useTranslation('common')
  const selected=useMemo(()=>charId?ALL.find(character=>character.id===charId)||null:null,[charId])
  const[activeFac,setActiveFac]=useState(()=>selected?.country||'qin')
  const[search,setSearch]=useState('')
  // Keep the faction rail aligned when direct-loading a character. Selection
  // itself is derived synchronously from the URL so prerendered detail pages
  // contain the character on the first HTML response rather than after an
  // effect-only second render.
  useEffect(()=>{
    if(selected?.country) setActiveFac(selected.country)
  },[selected])
  // Refine route metadata with source-backed character names/readings.
  useEffect(()=>{
    if(selected){
      const factionRecord=FACTIONS.find(f=>f.id===selected.country)
      const localized=localizedCharacter(selected,locale)
      setSeo(characterSeo(selected,{
        locale,
        displayName:localized.displayName,
        reading:localized.sourceReading,
        factionName:factionDisplay(factionRecord,locale),
      }))
    }else{
      const seo=routeSeo(location.pathname,locale)
      setSeo(charId?{...seo,robots:'noindex,follow'}:seo)
    }
  },[selected,charId,location.pathname,locale])
  const clearSelection=()=>navigate('/archive/characters')
  // Defer + memoize the search scan (211 chars × every skill string) so typing
  // stays responsive on slower phones.
  const deferredSearch=useDeferredValue(search)
  const filtered=useMemo(()=>(deferredSearch
    ?ALL.filter(c=>{
      const q=deferredSearch.toLowerCase()
      if(matchesCharacterName(c,deferredSearch)) return true
      if(c.unit_type&&c.unit_type.toLowerCase().includes(q)) return true
      if(c.groups&&c.groups.some(g=>g.toLowerCase().includes(q))) return true
      // hidden group tags
      const groupMatch=Object.entries(CHAR_GROUPS).find(([tag])=>tag.toLowerCase().includes(q)||q.includes(tag.toLowerCase()))
      if(groupMatch&&groupMatch[1].includes(c.name_en)) return true
      if(characterSkillsWithRole(c).some(sk=>(
        sk.type?.toLowerCase().includes(q)||
        sk.name_en?.toLowerCase().includes(q)||
        sk.name_jp?.includes(deferredSearch)||
        sk.effects?.some(e=>e.effect&&e.effect.toLowerCase().includes(q))
      ))) return true
      return false
    })
    :ALL.filter(c=>c.country===activeFac&&c.image)
  ).slice().sort((a,b)=>a.name_en.localeCompare(b.name_en)),[deferredSearch,activeFac])
  const localizedSelected=useMemo(()=>selected?localizedCharacter(selected,locale):null,[selected,locale])
  const localizedFiltered=useMemo(()=>filtered.map(character=>localizedCharacter(character,locale)),[filtered,locale])
  const handleFacClick=(fid)=>{setActiveFac(fid);if(selected)navigate('/archive/characters');setSearch('')}

  const GalleryHeading=selected?'h2':'h1'
  return(
    <main className={`archive-layout${selected?' has-selection':''}`}>
      {/* Sidebar */}
      <aside className="fac-sidebar">
        <div className="fac-search-wrap">
          <input className="fac-search" type="search" aria-label={t('archive.searchGenerals')} placeholder={`${t('archive.searchGenerals')}…`} value={search} onChange={e=>{setSearch(e.target.value);if(selected)navigate('/archive/characters')}}/>
        </div>
        <div className="fac-nav">
          {FACTIONS.map(f=>{
            const n=ALL.filter(c=>c.country===f.id&&c.image).length
            if(!n) return null
            return(
              <button key={f.id} className={`fac-item${activeFac===f.id&&!search?' fac-active':''}`}
                style={activeFac===f.id&&!search?{'--fc':f.color}:{}} onClick={()=>handleFacClick(f.id)}>
                <span className="fac-stripe" style={{background:f.color}}/>
                <span className="fac-name">{factionDisplay(f,locale)}</span>
                {secondaryName(factionDisplay(f,locale),f.jp)&&<span className="fac-jp">{f.jp}</span>}
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
            type="search"
            aria-label={t('archive.searchGenerals')}
            placeholder={`${t('archive.searchGenerals')}…`}
            value={search}
            onChange={e=>{setSearch(e.target.value);if(selected)navigate('/archive/characters')}}/>
          {search&&<button className="mobile-search-clear" type="button" aria-label={t('clear')} onClick={()=>setSearch('')}>✕</button>}
        </div>
        <div className="gallery-header">
          <GalleryHeading className="gallery-title">{search?t('resultCount',{count:filtered.length}):t('archive.roster',{faction:factionDisplay(FACTIONS.find(f=>f.id===activeFac),locale)})}</GalleryHeading>
          <span className="gallery-count">{t('generalCount',{count:filtered.length})}</span>
        </div>
        <div className="gallery-grid">
          {localizedFiltered.map(c=>{
            // Matching stays on the English source so a romaji or English query
            // finds the same generals in every locale; only the hint shown to
            // the reader is localized.
            const skillTag=deferredSearch?(()=>{
              const q=deferredSearch.toLowerCase()
              if(matchesCharacterName(c,deferredSearch)) return null
              if(c.unit_type&&c.unit_type.toLowerCase().includes(q)) return null
              for(const sk of characterSkillsWithRole(c)){
                if(sk.type?.toLowerCase().includes(q)||sk.name_en?.toLowerCase().includes(q)||sk.name_jp?.includes(deferredSearch))
                  return `${localizedText(sk.type,locale)}: ${sk.displayName||sk.name_en}`
                const rows=sk.effects||[]
                for(let i=0;i<rows.length;i+=1){
                  const e=rows[i]
                  if(e.effect&&e.effect.toLowerCase().includes(q))
                    return sk.displayEffects?.[i]?.effect||e.effect
                }
              }
              return null
            })():null
            return(
            <Link key={c.id}
              to={`/archive/characters/${c.id}`}
              className={`banner-card${selected?.id===c.id?' banner-selected':''}`}
              onClick={e=>{if(selected?.id===c.id){e.preventDefault();navigate('/archive/characters')}}}
              style={selected?.id===c.id?{outline:`3px solid ${CC[c.country]||'#999'}`}:{}}>
              <div className="banner-faction-tag" style={{background:CC[c.country]||'#666'}}>
                {FACTIONS.find(f=>f.id===c.country)?.jp||c.country}
              </div>
              {c.image?<img
                src={persosThumb(c.image)}
                srcSet={`${persosThumb(c.image)} 320w, ${c.image} 626w`}
                sizes="(max-width: 480px) 23vw, (max-width: 768px) 31vw, 180px"
                alt={c.displayName} className="banner-img" loading="lazy" decoding="async"/>
                :<div className="banner-ph" style={{background:(CC[c.country]||'#555')+'33',color:CC[c.country]||'#888'}}>{c.displayName?.[0]||'?'}</div>}
              <div className="banner-footer">
                <span className="banner-name">{c.displayName}</span>
                {skillTag&&<span className="banner-skill-tag" title={skillTag}>{skillTag.length>22?skillTag.slice(0,21)+'…':skillTag}</span>}
              </div>
            </Link>
            )
          })}
        </div>
      </div>

      {/* Skills panel — desktop: right column, mobile: bottom sheet */}
      {selected&&(
        <article className="detail-panel">
          <nav className="seo-breadcrumbs" aria-label={t('archive.breadcrumbs',{defaultValue:'Breadcrumbs'})}>
            <Link to="/">{t('nav.home')}</Link>
            <span aria-hidden="true">›</span>
            <Link to="/archive">{t('nav.archive')}</Link>
            <span aria-hidden="true">›</span>
            <Link to="/archive/characters">{t('nav.characters')}</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{localizedSelected?.displayName||selected.name_en}</span>
          </nav>
          <div className="detail-header">
            <CharIcon c={selected} size={64} round={false} className="detail-portrait" eager/>
            <div className="detail-info">
              <h1 className="detail-name">{localizedSelected?.displayName||selected.name_en}</h1>
              {secondaryName(localizedSelected?.displayName||selected.name_en,localizedSelected?.displaySecondaryName||selected.name_jp)&&(
                <div className="detail-jp">{localizedSelected?.displaySecondaryName||selected.name_jp}</div>
              )}
              <div className="detail-faction" style={{color:CC[selected.country]||'#999'}}>
                {factionDisplay(FACTIONS.find(f=>f.id===selected.country),locale)}
              </div>
              {characterSkillsWithRole(selected).some(skill=>skill.star6)&&(
                <Link className="detail-related-link" to="/archive/cw6-scene-cards">{t('nav.sceneCards')}</Link>
              )}
            </div>
            <div className="detail-actions">
              <ShareButton
                title={`${locale.code==='ar'?`${t('archive.skills')} ${localizedSelected?.displayName||selected.name_en}`:`${localizedSelected?.displayName||selected.name_en} ${t('archive.skills')}`} - RanHQ`}
                getText={()=>formatCharacterSkillsShare(localizedSelected||selected,{url:characterShareUrl(localizedSelected||selected,locale.code),labels:shareLabels})}
              />
              <SkillImageButton character={localizedSelected||selected}/>
            </div>
            <button className="detail-close" onClick={clearSelection} aria-label={t('close')}>✕</button>
          </div>
          <div className="detail-skills">
            {characterSkillsWithRole(localizedSelected||selected).length===0
              ?<p className="no-skills">{t('translationPending')}</p>
              :characterSkillsWithRole(localizedSelected||selected).map((sk,i)=>(
                <SkillCard key={i} skill={sk}/>
              ))
            }
          </div>
        </article>
      )}
    </main>
  )
}

export function SkillCard({skill}){
  const locale=useLocale()
  const{t}=useTranslation('common')
  const col=TYPE_COLOR[skill.type]||'#888'
  const displayName=skill.displayName||(locale.code==='ja'?skill.name_jp:skill.name_en)||t('unknown')
  const displayEffects=skill.displayEffects||skill.effects||[]
  return(
    <div className="sk" data-type={skill.type}>
      <div className="sk-head" style={{borderLeftColor:col,borderRightColor:col}}>
        <div>
          <span className="sk-name">{displayName}</span>
          {secondaryName(displayName,skill.name_jp)&&<span className="sk-jp">{skill.name_jp}</span>}
          <span className={`sk-source-status${skill.sourceStatus==='VERIFIED_ORIGINAL'?' is-verified':''}`}>
            {skill.sourceStatus==='VERIFIED_ORIGINAL'?t('sourceVerified'):t('sourceUnavailable')}
          </span>
        </div>
        <div className="sk-tags">
          {skill.star6&&<span className="tag t-star">☆6</span>}
          <span className="tag" style={{background:col+'22',color:col,border:`1px solid ${col}55`}}>{localizedText(skill.type,locale)}</span>
          {skill.type==='Internal Affairs'&&<span className="tag t-map">{localizedText('Map',locale)}</span>}
        </div>
      </div>
      <div className="sk-effects">
        {locale.code==='ja'&&skill.descriptionJp&&(
          <div className="sk-source-desc" lang="ja">
            <span className="sk-source-label">{t('originalJapanese')}</span>
            <span>{skill.descriptionJp}</span>
          </div>
        )}
        {displayEffects.map((e,i)=>(
          <div key={i} className="eff">
            <SkillConditionChips condition={e.condition}/>
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

export function ShareButton({title,getText,label='Share',className=''}) {
  const{t}=useTranslation('common')
  const[status,setStatus]=useState('idle')
  const onShare=async()=>{
    try{
      const result=await shareText({title,text:getText(),promptLabel:t('copyShareText')})
      if(result==='cancelled') return
      setStatus(result==='shared'?'shared':'copied')
      window.setTimeout(()=>setStatus('idle'),1800)
    }catch{
      setStatus('failed')
      window.setTimeout(()=>setStatus('idle'),2200)
    }
  }
  const text=status==='shared'?t('shared'):status==='copied'?t('copied'):status==='failed'?t('copyFailed'):label==='Share'?t('share'):label
  return(
    <button type="button" className={`share-btn ${className}`.trim()} onClick={onShare}>
      {text}
    </button>
  )
}

export function SkillImageButton({character,url,label='skills'}){
  const locale=useLocale()
  const{t}=useTranslation('common')
  const shareLabels=useShareLabels()
  const[status,setStatus]=useState('idle')
  const[preview,setPreview]=useState(null)
  const triggerRef=useRef(null)
  const closeRef=useRef(null)
  const restoreFocusRef=useRef(false)
  const shareUrl=url||characterShareUrl(character,locale.code)
  const imageName=character.displayName||localizedCharacterName(locale.code==='ja'?(character.name_jp||character.name_en):character.name_en,locale)
  const imageTitle=label==='skills'
    ?(locale.code==='ar'?`${t('archive.skills')} ${imageName}`:`${imageName} ${t('archive.skills')}`)
    :(locale.code==='ar'?`${label} ${imageName}`:`${imageName} ${label}`)
  useEffect(()=>()=>{if(preview?.url) URL.revokeObjectURL(preview.url)},[preview?.url])
  const clearPreview=()=>{
    restoreFocusRef.current=true
    setStatus('idle')
    setPreview(prev=>{
      if(prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
  }
  useModalDismiss(Boolean(preview),clearPreview)
  useEffect(()=>{
    if(preview) closeRef.current?.focus()
    else if(restoreFocusRef.current){restoreFocusRef.current=false;triggerRef.current?.focus()}
  },[preview])
  const showRendered=rendered=>{
    const url=URL.createObjectURL(rendered.blob)
    setPreview(prev=>{
      if(prev?.url) URL.revokeObjectURL(prev.url)
      return {...rendered,url}
    })
  }
  const setTimedStatus=next=>{
    setStatus(next)
    window.setTimeout(()=>setStatus('idle'),next==='failed'?2200:1800)
  }
  const makeImage=async()=>{
    try{
      setStatus('making')
      const rendered=await createCharacterSkillsImage(character,{url:shareUrl,labels:shareLabels})
      showRendered(rendered)
      const result=await shareImageBlob(rendered.blob,rendered.fileName,`${imageTitle} - RanHQ`)
      if(result==='cancelled'){setStatus('idle');return}
      setTimedStatus(result==='shared'?'shared':result==='copied'?'image-copied':'preview')
    }catch{
      setTimedStatus('failed')
    }
  }
  const copyPreview=async()=>{
    if(!preview) return
    try{
      const result=await shareImageBlob(preview.blob,preview.fileName,`${imageTitle} - RanHQ`)
      if(result==='cancelled') return
      setTimedStatus(result==='shared'?'shared':result==='copied'?'image-copied':'preview')
    }catch{
      setTimedStatus('failed')
    }
  }
  const text={
    idle:t('image'),
    making:t('making'),
    shared:t('shared'),
    'image-copied':`${t('copied')} ${t('image')}`,
    preview:t('previewReady'),
    failed:t('imageFailed'),
  }[status]||t('image')
  return(
    <>
      <button ref={triggerRef} type="button" className="share-btn share-image-btn" onClick={makeImage} disabled={status==='making'}>
        {text}
      </button>
      {preview&&(
        <div className="share-preview-backdrop" role="dialog" aria-modal="true" aria-label={`${imageTitle} ${t('imagePreview')}`} onClick={clearPreview}>
          <div className="share-preview" onClick={e=>e.stopPropagation()}>
            <div className="share-preview-head">
              <div>
                <strong>{imageTitle} {t('image')}</strong>
                <span>{t('pasteImageHint')}</span>
              </div>
              <button ref={closeRef} type="button" className="share-preview-close" onClick={clearPreview}>{t('close')}</button>
            </div>
            <div className="share-preview-img-wrap">
                <img src={preview.url} alt={`${imageTitle} ${t('imagePreview')}`}/>
            </div>
            <div className="share-preview-actions">
              <button type="button" className="share-btn" onClick={copyPreview}>{t('copyImage')}</button>
              <button type="button" className="share-btn" onClick={()=>downloadBlob(preview.blob,preview.fileName)}>{t('downloadPng')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function TeamImageButton({team,side='team'}){
  const shareLabels=useShareLabels()
  const locale=useLocale()
  const{t}=useTranslation('common')
  const[status,setStatus]=useState('idle')
  const[preview,setPreview]=useState(null)
  const triggerRef=useRef(null)
  const closeRef=useRef(null)
  const restoreFocusRef=useRef(false)
  const sideName=side==='attack'?t('builder.attacking'):side==='defense'?t('builder.defending'):t('builder.formationSide')
  // Word order differs per language: English appends the noun, Arabic needs a
  // genitive construct (مهارات الهجوم, never الهجوم المهارات). Interpolating a
  // per-locale template keeps the image title grammatical everywhere.
  const title=t('shareOutput.sideSkills',{side:sideName})
  useEffect(()=>()=>{if(preview?.url) URL.revokeObjectURL(preview.url)},[preview?.url])
  const clearPreview=()=>{
    restoreFocusRef.current=true
    setStatus('idle')
    setPreview(prev=>{
      if(prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
  }
  useModalDismiss(Boolean(preview),clearPreview)
  useEffect(()=>{
    if(preview) closeRef.current?.focus()
    else if(restoreFocusRef.current){restoreFocusRef.current=false;triggerRef.current?.focus()}
  },[preview])
  if(!team?.length) return null
  const showRendered=rendered=>{
    const url=URL.createObjectURL(rendered.blob)
    setPreview(prev=>{
      if(prev?.url) URL.revokeObjectURL(prev.url)
      return {...rendered,url}
    })
  }
  const setTimedStatus=next=>{
    setStatus(next)
    window.setTimeout(()=>setStatus('idle'),next==='failed'?2200:1800)
  }
  const makeImage=async()=>{
    try{
      setStatus('making')
      const rendered=await createTeamSkillsImage({
        team,
        title,
        side,
        url:builderShareUrl(locale.code),
        labels:shareLabels,
      })
      showRendered(rendered)
      const result=await shareImageBlob(rendered.blob,rendered.fileName,`${title} - RanHQ`)
      if(result==='cancelled'){setStatus('idle');return}
      setTimedStatus(result==='shared'?'shared':result==='copied'?'image-copied':'preview')
    }catch{
      setTimedStatus('failed')
    }
  }
  const copyPreview=async()=>{
    if(!preview) return
    try{
      const result=await shareImageBlob(preview.blob,preview.fileName,`${title} - RanHQ`)
      if(result==='cancelled') return
      setTimedStatus(result==='shared'?'shared':result==='copied'?'image-copied':'preview')
    }catch{
      setTimedStatus('failed')
    }
  }
  const text={
    idle:t('shareTeam'),
    making:t('making'),
    shared:t('shared'),
    'image-copied':`${t('copied')} ${t('image')}`,
    preview:t('previewReady'),
    failed:t('imageFailed'),
  }[status]||t('shareTeam')
  return(
    <>
      <button ref={triggerRef} type="button" className="share-btn team-share-btn" onClick={makeImage} disabled={status==='making'}>
        {text}
      </button>
      {preview&&(
        <div className="share-preview-backdrop" role="dialog" aria-modal="true" aria-label={`${title} ${t('imagePreview')}`} onClick={clearPreview}>
          <div className="share-preview share-preview-wide" onClick={e=>e.stopPropagation()}>
            <div className="share-preview-head">
              <div>
                <strong>{title} {t('image')}</strong>
                <span>{t('pasteImageHint')}</span>
              </div>
              <button ref={closeRef} type="button" className="share-preview-close" onClick={clearPreview}>{t('close')}</button>
            </div>
            <div className="share-preview-img-wrap">
                <img src={preview.url} alt={`${title} ${t('imagePreview')}`}/>
            </div>
            <div className="share-preview-actions">
              <button type="button" className="share-btn" onClick={copyPreview}>{t('copyImage')}</button>
              <button type="button" className="share-btn" onClick={()=>downloadBlob(preview.blob,preview.fileName)}>{t('downloadPng')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Skill condition chips
/**
 * Chip labels for skill-effect qualifiers, shared with the share renderer so a
 * generated image uses the same wording as the page.
 *
 * `State` here means an alive/surviving status, not a Warring-States country,
 * so الحالة is the correct Arabic in this context.
 */
/**
 * The Japanese reading shown beneath a primary name — omitted when the primary
 * name is already that same string.
 *
 * On /ja the primary name IS the Japanese one, so every card was printing it
 * twice (名将一閃【橙象】 名将一閃【橙象】, 廉頗 廉頗, 秦 秦). Returning null lets
 * the caller skip the element entirely rather than render an empty node.
 */
/**
 * A country-group heading. Countries reuse the site's canonical faction names
 * — English from FACTIONS.label, Japanese from FACTIONS.jp, Arabic from the
 * lexicon that already renders the same states in effect text — so the
 * accordion never introduces a second name for a country.
 */
export function countryGroupLabel(country, locale, t) {
  if (country === MIXED_COUNTRY) return t('builder.mixedCountry')
  const faction = FACTIONS.find((f) => f.id === country)
  if (!faction) return country
  if (locale?.code === 'ja') return faction.jp
  if (locale?.code === 'ar') return localizedText(faction.label, locale)
  return faction.label
}

export function secondaryName(primary, japanese) {
  const jp = japanese == null ? '' : String(japanese)
  if (!jp) return null
  return String(primary == null ? '' : primary).trim() === jp.trim() ? null : jp
}

export const CONDITION_CHIP_LABELS={
  ja:{Requires:'条件',Route:'経路',Mode:'モード',When:'発動時',Scales:'累積',After:'発生後',Source:'出典',Vs:'対',Target:'対象',State:'状態',Scope:'範囲'},
  ar:{Requires:'الشرط',Route:'المسار',Mode:'الوضع',When:'عند',Scales:'يتدرج',After:'بعد',Source:'المصدر',Vs:'ضد',Target:'الهدف',State:'الحالة',Scope:'النطاق'},
}

/**
 * Share-output labels for the active locale.
 *
 * A share image goes straight into Discord, so its chrome is as user-visible
 * as the page itself. Existing catalog keys are reused where they already say
 * the same thing (formations, the buff summary heading, translation pending).
 */
export function useShareLabels(){
  const locale=useLocale()
  const{t}=useTranslation('common')
  return useMemo(()=>({
    skillCard:t('shareOutput.skillCard'),
    generatedFor:t('shareOutput.generatedFor'),
    partyBuilder:t('shareOutput.partyBuilder'),
    builderNote:t('shareOutput.builderNote'),
    teamSheet:t('shareOutput.teamSheet'),
    teamSkills:t('shareOutput.teamSkills'),
    noEffects:t('shareOutput.noEffects'),
    translationPending:t('translationPending'),
    attackingFormation:t('buffs.attackingFormation'),
    defendingFormation:t('buffs.defendingFormation'),
    duration:t('shareOutput.duration'),
    sceneCardSkill:t('shareOutput.sceneCardSkill'),
    enemyDebuffOn:t('shareOutput.enemyDebuffOn'),
    effect:t('shareOutput.effect'),
    skill:t('shareOutput.skill'),
    star6:t('shareOutput.star6'),
    unnamedSkill:t('shareOutput.unnamedSkill'),
    noGenerals:t('shareOutput.noGenerals'),
    team:t('teamCost.team'),
    teamBuffSummary:t('shareOutput.teamBuffSummary'),
    withCombat:t('shareOutput.withCombat'),
    strategyOnly:t('shareOutput.strategyOnly'),
    noRelevantBuffs:t('noRelevantBuffs'),
    direction:locale.direction,
    conditions:CONDITION_CHIP_LABELS[locale.code]||{},
    localizeTerm:value=>localizedText(value,locale),
    // Faction, unit-type and skill-type words drawn inside the image.
    terms:Object.fromEntries(
      ['Qin','Zhao','Wei','Chu','Yan','Han','Qi','Ai','Mountain Folk','Other',
       'General','Infantry','Cavalry','Archer','Shield','Siege Weapon',
       'Combat','Strategy','Internal Affairs','Leader','Strategist']
        .map(term=>[term,localizedText(term,locale)]),
    ),
  }),[t,locale])
}


export function SkillConditionChips({condition}){
  const locale=useLocale()
  const{t}=useTranslation('common')
  const chips=classifyConditionParts(condition)
  if(chips.length===0) return null
  const labels=CONDITION_CHIP_LABELS[locale.code]||{}
  return(
    <div className="eff-conds" aria-label={t('skillEffectQualifiers')}>
      {chips.map((chip,i)=>(
        <span key={`${chip.kind}-${chip.text}-${i}`} className={`eff-cond eff-cond-${chip.kind}`}>
          <span className="eff-cond-lbl">{labels[chip.label]||chip.label}</span>
          <span className="eff-cond-text">{localizedText(chip.text,locale)}</span>
        </span>
      ))}
    </div>
  )
}

// Meta team card
export function MetaTeamCard({team,onLoad}){
  const locale=useLocale()
  const{t}=useTranslation('common')
  const chars=team.members.map(findCharByName).filter(Boolean)
  const accent=team.color||CC[chars[0]?.country]||'var(--terra)'
  return(
    <div className="meta-card" style={{borderTopColor:accent}}>
      <div className="meta-card-head">
        <span className="meta-name">{localizedTeamName(team.name,locale.code)}</span>
      </div>
      <div className="meta-members">
        {chars.map((c,i)=>(
          <div key={i} className="meta-member">
            <CharIcon c={c} size={60} round={true} className="meta-member-img"/>
            <span className="meta-member-name">{localizedCharacter(c,locale).displayName}</span>
          </div>
        ))}
      </div>
      <div className="meta-btns">
        <button className="meta-btn meta-atk" aria-label={t('setAttacker')} onClick={()=>onLoad(team,'attack')}><span className="meta-btn-full">{t('setAttacker')}</span><span className="meta-btn-short">{t('attack')}</span></button>
        <button className="meta-btn meta-def" aria-label={t('setDefender')} onClick={()=>onLoad(team,'defense')}><span className="meta-btn-full">{t('setDefender')}</span><span className="meta-btn-short">{t('defend')}</span></button>
      </div>
    </div>
  )
}

// ── PARTY BUILDER ─────────────────────────────────────────────────────────────
export function BuilderPage({atk:atkIds,def:defIds,atkSk,defSk,setAtkSk,setDefSk,setSlot,rm,goSim,loadMetaTeam}){
  const{t}=useTranslation('common')
  const locale=useLocale()
  const[picker,setPicker]=useState(null)
  const[activeSide,setActiveSide]=useState('attack')
  const[buffsOpen,setBuffsOpen]=useState(()=>typeof window==='undefined'||!window.matchMedia('(max-width: 768px)').matches)
  const atk=atkIds.map(findCharById)
  const def=defIds.map(findCharById)
  const atkF=atk.filter(Boolean),defF=def.filter(Boolean)
  const atkM=atk.map((c,i)=>applyMask(c,atkSk[i])).filter(Boolean)
  const defM=def.map((c,i)=>applyMask(c,defSk[i])).filter(Boolean)
  // Only exclude chars already on the SAME side — opposing-team chars must remain searchable
  const excl=picker ? (picker.side==='attack'?atkF:defF).map(c=>c.id) : []
  const updateSk=(side,idx,mask)=>{
    const party=side==='attack'?atk:def
    const setMasks=side==='attack'?setAtkSk:setDefSk
    setMasks(prev=>updateSkillMasks(prev,party,idx,mask))
  }
  useEffect(()=>{
    const media=window.matchMedia('(max-width: 768px)')
    const sync=event=>setBuffsOpen(!event.matches)
    media.addEventListener('change',sync)
    return()=>media.removeEventListener('change',sync)
  },[])
  return(
    <div className="main-page builder-page">
      {picker&&<Picker onSelect={c=>setSlot(c,picker.side,picker.idx)} onClose={()=>setPicker(null)} excl={excl}/>}
      <h1 className="pg-title">{t('builder.title')}</h1>
      <p className="pg-sub">{t('builder.subtitle')}</p>
      <div className="builder-side-switch" role="group" aria-label={t('builder.formationSide')}>
        <button type="button" className={activeSide==='attack'?'active':''} aria-pressed={activeSide==='attack'} onClick={()=>setActiveSide('attack')}>{t('builder.attacking')} <span>{atkF.length}/4</span></button>
        <button type="button" className={activeSide==='defense'?'active':''} aria-pressed={activeSide==='defense'} onClick={()=>setActiveSide('defense')}>{t('builder.defending')} <span>{defF.length}/4</span></button>
      </div>
      <div className={`two-sides builder-two-sides builder-show-${activeSide}`}>
        <SideSlots side="attack"  label={t('builder.attacking')} party={atk} skMask={atkSk}
                   onSlot={i=>setPicker({side:'attack',idx:i})}  onRm={c=>rm(c,'attack')}
                   onSkChange={(i,mk)=>updateSk('attack',i,mk)}/>
        <div className="vs-sep">{t('versus')}</div>
        <SideSlots side="defense" label={t('builder.defending')} party={def} skMask={defSk}
                   onSlot={i=>setPicker({side:'defense',idx:i})} onRm={c=>rm(c,'defense')}
                   onSkChange={(i,mk)=>updateSk('defense',i,mk)}/>
      </div>
      {(atkF.length&&defF.length)>0&&<div className="cta-row"><button className="cta-btn" onClick={goSim}>{t('builder.viewBattleOrder')}</button></div>}
      {(atkM.length||defM.length)>0&&(
        <section className="builder-buff-disclosure">
          <button type="button" className="builder-buff-toggle" aria-expanded={buffsOpen} onClick={()=>setBuffsOpen(open=>!open)}>
            <span><strong>{t('builder.teamBuffs')}</strong><small>{t('builder.calculated')}</small></span>
            <span>{buffsOpen?t('builder.hide'):t('builder.review')}</span>
          </button>
          {buffsOpen&&<BuffTable atk={atkM} def={defM}/>}
        </section>
      )}

      {/* Meta Teams */}
      <div className="meta-section">
        <h2 className="meta-section-title">{t('builder.knownTeam')}</h2>
        <p className="meta-section-sub">{t('builder.knownTeamDescription')}</p>
        {metaTeamsByCountry().map(group=>(
          <details key={group.country} className="meta-country">
            <summary className="meta-country-head">
              <span className="meta-country-name">{countryGroupLabel(group.country,locale,t)}</span>
              <span className="meta-country-count">{group.teams.length}</span>
            </summary>
            <div className="meta-grid">
              {group.teams.map(team=>(
                <MetaTeamCard key={team.name} team={team} onLoad={(x,side)=>loadMetaTeam(x.members.map(findCharByName),side)}/>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

export function SideSlots({side,label,party,skMask,onSlot,onRm,onSkChange}){
  const locale=useLocale()
  const{t}=useTranslation('common')
  const ac=side==='attack'?'var(--red)':'var(--blue)'
  // The generated team image renders this data directly, so it has to be
  // localized here — otherwise an Arabic page produces an English image.
  const maskedTeam=party.map((c,i)=>applyMask(c,skMask?.[i])).filter(Boolean)
    .map(c=>localizedCharacter(c,locale))
  return(
    <div className={`side side-${side}`}>
      <div className="side-lbl side-lbl-with-action" style={{color:ac,borderBottomColor:ac}}>
        <span>{label}</span>
        <TeamImageButton team={maskedTeam} side={side}/>
      </div>
      {Array.from({length:4}).map((_,i)=>{
        const m=party[i]
        const display=m?localizedCharacter(m,locale):null
        return m?(
          <div key={i} className="slot-filled" style={{borderLeftColor:CC[m.country]||'#999'}}>
            <span className="sn" style={{color:ac}}>{i+1}</span>
            <CharIcon c={m} size={36} round={true}/>
            <div className="slot-info"><span className="slot-en">{display.displayName}</span>{secondaryName(display.displayName,display.displaySecondaryName)&&<span className="slot-jp">{display.displaySecondaryName}</span>}</div>
            <SkillToggles char={m} mask={skMask?.[i]||DEFAULT_SK} onChange={nm=>onSkChange(i,nm)}/>
            <button className="slot-rm" onClick={()=>onRm(m)} aria-label={t('remove')}>✕</button>
          </div>
        ):(
          <button key={i} className="slot-empty" style={{borderColor:ac+'44'}} onClick={()=>onSlot(i)}>
            <span style={{color:ac+'88',fontSize:'1.3rem'}}>+</span>
            <span style={{color:ac+'77',fontSize:'.78rem'}}>{i+1} — {t('builder.clickAdd')}</span>
          </button>
        )
      })}
    </div>
  )
}

export function SkillToggles({char,mask,onChange}){
  const locale=useLocale()
  const{t}=useTranslation('common')
  const s6Exists=hasStar6(char)
  const roleExists=hasRoleSkill(char)
  const n=mask?.n??3
  const s6on=mask?.s6!==false
  const roleOn=mask?.role===true
  const clickNum=k=>{
    // Cascade: clicking k while n>=k => dim down to k-1; else unlock up to k.
    const nextN=n>=k?k-1:k
    onChange({...mask, n:nextN, s6:s6on, role:roleOn})
  }
  const toggleS6=()=>onChange({...mask, n, s6:!s6on, role:roleOn})
  const toggleRole=()=>onChange({...mask, n, s6:s6on, role:!roleOn})
  return(
    <div className="skill-toggles" onClick={e=>e.stopPropagation()}>
      {[1,2,3].map(k=>(
        <button key={k}
                className={`stog${n>=k?' stog-on':''}`}
                onClick={e=>{e.stopPropagation();clickNum(k)}}
                title={`${t('shareOutput.skill')} ${k}`}
                aria-label={`${t('shareOutput.skill')} ${k} ${n>=k?t('enabled'):t('disabled')}`}
                aria-pressed={n>=k}>
          <img className="skill-toggle-art" src={SKILL_LEVEL_ICON[k]} alt="" aria-hidden="true" draggable="false" decoding="async"/>
        </button>
      ))}
      {s6Exists && (
        <button className={`stog-s6-btn${s6on?' stog-s6-on':''}`}
                onClick={e=>{e.stopPropagation();toggleS6()}}
                title={t('starSkill')}
                aria-label={`${t('starSkill')} ${s6on?t('enabled'):t('disabled')}`}
                aria-pressed={s6on}>
          <img className="skill-toggle-art" src={CW6_SKILL_ICON} alt="" aria-hidden="true" draggable="false" decoding="async"/>
        </button>
      )}
      {roleExists&&(
        <button
          className={`stog-role stog-role-${char.roleSkill.type.toLowerCase()}${roleOn?' stog-role-on':''}`}
          onClick={e=>{e.stopPropagation();toggleRole()}}
          aria-label={`${localizedText(char.roleSkill.type,locale)} ${t('shareOutput.skill')} ${char.roleSkill.name_en} ${roleOn?t('enabled'):t('disabled')}`}
          aria-pressed={roleOn}
          title={`${localizedText(char.roleSkill.type,locale)}: ${char.roleSkill.name_en}`}
        >
          <img className="skill-toggle-art" src={ROLE_SKILL_ICON[char.roleSkill.type]} alt="" aria-hidden="true" draggable="false" decoding="async"/>
        </button>
      )}
    </div>
  )
}

// ── ACTIVATION ORDER ──────────────────────────────────────────────────────────
export function SimPage({atk:atkIds,def:defIds,atkSk,defSk,goBuilder}){
  const locale=useLocale()
  const{t}=useTranslation('common')
  const atk=atkIds.map(findCharById)
  const def=defIds.map(findCharById)
  const atkF=atk.map((c,i)=>applyMask(c,atkSk?.[i])).filter(Boolean).map(c=>localizedCharacter(c,locale))
  const defF=def.map((c,i)=>applyMask(c,defSk?.[i])).filter(Boolean).map(c=>localizedCharacter(c,locale))
  if(!atkF.length||!defF.length) return(
    <main className="main-page sim-empty">
      <section className="sim-empty-card" aria-labelledby="sim-empty-title">
        <h1 id="sim-empty-title">{t('sim.title')}</h1>
        <p className="sim-empty-description">{t('sim.emptyDescription')}</p>
        <p className="sim-empty-reason">{t('sim.emptyReason')}</p>
        <button className="cta-btn" onClick={goBuilder}>{t('sim.goBuilder')}</button>
      </section>
    </main>
  )
  const{roles,st,turns}=simulate(atkF,defF)
  return(
    <div className="main-page">
      {/* ── Battle Result (hidden for now) ──────────────── */}
      {/* <BattleResult battle={battle} atkTeam={atkF} defTeam={defF} rerun={()=>setTick(t=>t+1)}/> */}

      <header className="sim-page-head">
        <div>
          <h1>{t('sim.title')}</h1>
          <p>{t('sim.description')}</p>
        </div>
        <button type="button" onClick={goBuilder}>{t('sim.editTeams')}</button>
      </header>

      {/* ── Formation bars ─────────────────────────────────── */}
      <div className="form-bars">
        <FormBar generals={atkF} side="attack" label={t('builder.attacking')}/>
        <div className="form-vs">{t('versus')}</div>
        <FormBar generals={defF} side="defense" label={t('builder.defending')}/>
      </div>
      {(roles.attack.length||roles.defense.length)>0&&(
        <div className="sim-sec">
          <div className="sec-hd sec-role">{t('sim.leaderSkills')}</div>
          <div className="strat-cols">
            <StratCol label={t('builder.attacking')} entries={roles.attack} side="attack"/>
            <StratCol label={t('builder.defending')} entries={roles.defense} side="defense"/>
          </div>
        </div>
      )}
      <div className="sim-sec">
        <div className="sec-hd sec-strat">{t('sim.strategySkills')}</div>
        <div className="strat-cols">
          <StratCol label={t('builder.attacking')} entries={st.attack} side="attack"/>
          <StratCol label={t('builder.defending')} entries={st.defense} side="defense"/>
        </div>
      </div>
      <div className="sim-sec">
        <div className="sec-hd sec-combat">{t('sim.activation')}</div>
        {turns.map(({turn,entries})=>(
          <div key={turn} className="turn">
            <div className="turn-lbl">{t('sim.turn',{turn})}</div>
            <div className="turn-entries">
              {entries.map(({general,skill,side},i)=>(
                <div key={i} className={`te te-${side}`}>
                  <div className="te-stripe" style={{background:side==='attack'?'var(--red)':'var(--blue)'}}/>
                  <div className="te-body">
                    <div className="te-gen">
                      <CharIcon c={general} size={38} round={true}/>
                      <div><b className="te-name">{general.displayName||general.name_en}</b>{secondaryName(general.displayName||general.name_en,general.name_jp)&&<span className="te-jp">{general.name_jp}</span>}</div>
                      <span className="te-tag" style={{background:side==='attack'?'rgba(192,57,43,.18)':'rgba(26,95,168,.18)',color:side==='attack'?'#c0392b':'#1a5fa8',border:`1px solid ${side==='attack'?'rgba(192,57,43,.3)':'rgba(26,95,168,.3)'}`}}>{side==='attack'?'ATK':'DEF'}</span>
                    </div>
                    {skill?<SkillCard skill={skill}/>:<div className="normal-atk">{locale.code==='ja'?'通常攻撃':locale.code==='ar'?'هجوم عادي':'Normal Attack'}</div>}
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

export function BattleResult({battle,rerun}){
  const{aS,dS,winner,finalTurn,log}=battle
  const locale=useLocale()
  const{t}=useTranslation('common')
  const isAtkWin=winner==='attack'||winner==='atk_pts'
  const isPoints=winner==='atk_pts'||winner==='def_pts'
  const winColor=isAtkWin?'var(--red)':'var(--blue)'
  const kills=log.flatMap(({turn,events})=>events.filter(e=>e.died).map(e=>({...e,turn})))
  const fmtK=(n)=>n>=1000?`${formatLocaleNumber(Number((n/1000).toFixed(1)),locale)}k`:formatLocaleNumber(n,locale)
  const generalName=(g)=>localizedCharacter(g,locale).displayName||g?.name_en||''
  const HpBar=({state,side})=>{
    const pct=Math.round(state.curHp/state.hp*100)
    const col=side==='attack'?'var(--red)':'var(--blue)'
    const died=!state.alive
    return(
      <div className="br-gen-row">
        <CharIcon c={state.g} size={32} round={true}/>
        <div className="br-gen-info">
          <div className="br-gen-name">{generalName(state.g)}{died&&<span className="br-dead">☠</span>}</div>
          <div className="br-hp-bar">
            <div className="br-hp-fill" style={{width:`${pct}%`,background:died?'#555':col}}/>
          </div>
          <div className="br-hp-nums">
            <span style={{color:died?'var(--txt3)':col}}>{fmtK(state.curHp)}</span>
            <span style={{color:'var(--txt3)'}}> / {fmtK(state.hp)}</span>
            <span style={{color:'var(--txt3)',marginLeft:'auto',fontSize:'.65rem'}}>{died?`☠ ${t('battle.ko')}`:`${formatLocaleNumber(pct,locale)}%`}</span>
          </div>
        </div>
      </div>
    )
  }
  return(
    <div className="sim-sec">
      <div className="sec-hd" style={{background:winColor+'22',borderColor:winColor+'66',color:winColor}}>
        {isAtkWin?'⚔':'🛡'} {t(isAtkWin?'battle.attackWins':'battle.defendWins')}
        {isPoints?` ${t('battle.byPoints')}`:''} — {t('battle.turn',{count:finalTurn})}
      </div>
      <div className="br-body">
        <div className="br-cols">
          {/* Attacking team HP */}
          <div className="br-side">
            <div className="br-side-lbl" style={{color:'var(--red)'}}>⚔ {t('battle.attackingSide')}</div>
            {aS.map((s,i)=><HpBar key={i} state={s} side="attack"/>)}
            <div className="br-dmg-total">
              {t('battle.totalDamage')}: <strong>{fmtK(aS.reduce((t,s)=>t+s.totalDmgDone,0))}</strong>
            </div>
          </div>
          {/* Kill log */}
          {kills.length>0&&(
            <div className="br-kills">
              <div className="br-kills-lbl">{t('battle.killLog')}</div>
              {kills.map((k,i)=>(
                <div key={i} className="br-kill-row">
                  <span className="br-kill-t">T{k.turn}</span>
                  <CharIcon c={k.actor.g} size={16} round/>
                  <span className="br-kill-arrow" style={{color:k.side==='attack'?'var(--red)':'var(--blue)'}}>→☠</span>
                  <CharIcon c={k.target.g} size={16} round/>
                  <span className="br-kill-name">{generalName(k.target.g)}</span>
                </div>
              ))}
            </div>
          )}
          {/* Defending team HP */}
          <div className="br-side">
            <div className="br-side-lbl" style={{color:'var(--blue)'}}>🛡 {t('battle.defendingSide')}</div>
            {dS.map((s,i)=><HpBar key={i} state={s} side="defense"/>)}
            <div className="br-dmg-total">
              {t('battle.totalDamage')}: <strong>{fmtK(dS.reduce((t,s)=>t+s.totalDmgDone,0))}</strong>
            </div>
          </div>
        </div>
        <div className="br-note">
          <button className="resim-btn" onClick={rerun}>🎲 {t('battle.resimulate')}</button>
          <span className="br-note-txt">{t('battle.varyNote')}</span>
        </div>
      </div>
    </div>
  )
}
export function FormBar({generals,side,label}){
  const locale=useLocale()
  const{t}=useTranslation('common')
  const ac=side==='attack'?'var(--red)':'var(--blue)'
  return(
    <div className="form-side">
      <div className="form-lbl" style={{color:ac}}>{label}</div>
      <div className="form-chips">
        {generals.map(g=>(
          <div key={g.id} className="f-chip" style={{borderTopColor:CC[g.country]||'#999'}}>
            <CharIcon c={g} size={36} round={true}/>
            <span className="f-chip-name">{g.displayName||localizedCharacter(g,locale).displayName}</span>
          </div>
        ))}
        {!generals.length&&<span className="form-none">{t('unknown')}</span>}
      </div>
    </div>
  )
}
export function StratCol({label,entries,side}){
  const locale=useLocale()
  const ac=side==='attack'?'var(--red)':'var(--blue)'
  return(
    <div className={`scol ${side==='attack'?'atk':'def'}`}>
      <div className="scol-lbl" style={{color:ac,borderBottomColor:ac+'44'}}>{label}</div>
      {!entries.length?<p className="scol-none">{locale.code==='ja'?'なし':locale.code==='ar'?'لا يوجد':'None'}</p>:entries.map(({general:g,skills:gs})=>(
        <div key={g.id} className="scol-gen">
          <div className="scol-gen-hdr" style={{color:ac}}>
            <CharIcon c={g} size={32} round={true}/>
            <b>{g.displayName||localizedCharacter(g,locale).displayName}</b>{secondaryName(g.displayName||localizedCharacter(g,locale).displayName,g.name_jp)&&<span className="scol-jp">{g.name_jp}</span>}
          </div>
          {gs.map((sk,i)=><SkillCard key={i} skill={sk}/>)}
        </div>
      ))}
    </div>
  )
}

// ── BUFF TABLE ────────────────────────────────────────────────────────────────
export function BuffTable({atk,def}){
  const shareLabels=useShareLabels()
  const locale=useLocale()
  const{t}=useTranslation('common')
  const[includeCombat,setIncludeCombat]=useState(false)
  if(!atk.length&&!def.length) return null
  const atkBuffs=atk.map(g=>({general:g,buffs:calcCharBuffs(g,atk,def,false,true,includeCombat)}))
  const defBuffs=def.map(g=>({general:g,buffs:calcCharBuffs(g,def,atk,true,true,includeCombat)}))
  const atkEnemyDebuffs=calcTeamEnemyDebuffs(atk,def,includeCombat,false)
  const defEnemyDebuffs=calcTeamEnemyDebuffs(def,atk,includeCombat,true)
  const hasAny=arr=>arr.some(({buffs})=>Object.keys(buffs).length>0)
  if(!hasAny(atkBuffs)&&!hasAny(defBuffs)&&!Object.keys(atkEnemyDebuffs).length&&!Object.keys(defEnemyDebuffs).length) return null
  return(
    <div className="sim-sec">
      <div className="sec-hd sec-buff" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap'}}>
         <span>⚡ {t('buffs.teamSummary')}</span>
        <div className="sec-actions">
          <ShareButton
            title={t('shareOutput.teamBuffSummary')}
            getText={()=>formatTeamBuffShare({
              atk,
              def,
              atkBuffs,
              defBuffs,
              atkEnemyDebuffs,
              defEnemyDebuffs,
              includeCombat,
               specialStats:SPECIAL_STATS,
               statSortKey,
               url:builderShareUrl(locale.code),
               labels:shareLabels,
             })}
          />
          <label style={{display:'inline-flex',alignItems:'center',gap:'.4rem',fontSize:'.72rem',fontWeight:400,cursor:'pointer',textTransform:'none',letterSpacing:'normal'}}
            title={t('buffs.includeCombatTitle')}>
            <input type="checkbox" checked={includeCombat} onChange={e=>setIncludeCombat(e.target.checked)} style={{cursor:'pointer'}}/>
             {t('buffs.includeCombat')}
          </label>
        </div>
      </div>
      <div className="strat-cols">
        <BuffSideTable label={`⚔ ${t('buffs.attackingFormation')}`} entries={atkBuffs} side="attack" enemyDebuffs={atkEnemyDebuffs}/>
        <BuffSideTable label={`🛡 ${t('buffs.defendingFormation')}`} entries={defBuffs} side="defense" enemyDebuffs={defEnemyDebuffs}/>
      </div>
    </div>
  )
}
export function BuffSideTable({label,entries,side,enemyDebuffs={}}){
  const{t}=useTranslation('common')
  const locale=useLocale()
  const[expanded,setExpanded]=useState(null)
  const ac=side==='attack'?'var(--red)':'var(--blue)'
  const hasAny=entries.some(({buffs})=>Object.keys(buffs).length>0)
  const hasEnemyDebuffs=Object.keys(enemyDebuffs).length>0
  const fmt=v=>Number.isInteger(v)?v:v.toFixed(1)
  return(
    <div className={`scol ${side==='attack'?'atk':'def'}`}>
      <div className="scol-lbl" style={{color:ac,borderBottomColor:ac+'44'}}>{label}</div>
       {!hasAny?<p className="scol-none">{t('noRelevantBuffs')}</p>:entries.map(({general:g,buffs})=>{
        const stats=Object.entries(buffs).filter(([,v])=>v.up>0||v.down>0).sort(([a],[b])=>statSortKey(a)-statSortKey(b))
        return(
          <div key={g.id} className="scol-gen">
            <div className="scol-gen-hdr" style={{color:ac}}>
              <CharIcon c={g} size={26} round={true}/>
              <b>{localizedCharacter(g,locale).displayName}</b>
              {g.unit_type&&<span className="scol-unit-badge" style={{background:ac+'22',color:ac,border:`1px solid ${ac}44`}}>{localizedText(g.unit_type,locale)}</span>}
            </div>
            {!stats.length?<div className="buff-none-row">—</div>:(
              <div className="buff-stats">
                {stats.map(([stat,buff])=>{
                  const{up,down,sources=[],instances}=buff
                  const inv=INVERSE_STATS.has(stat)
                  const isFlag=SPECIAL_STATS.has(stat)
                  // Guard doesn't stack — show one row for the active (highest) instance,
                  // with the alternatives revealed on expand.
                  if(stat==='Guard'&&instances&&instances.length){
                    const sorted=[...instances].sort((a,b)=>b.val-a.val)
                    const top=sorted[0]
                    const extra=sorted.length-1
                    const key=`${g.id}|Guard`
                    const isOpen=expanded===key
                    return(
                      <div key={stat}>
                        <div className={`buff-row buff-row-click${isOpen?' buff-row-open':''}`}
                             onClick={()=>extra>0&&setExpanded(isOpen?null:key)}>
                          <span className="buff-stat-name">{localizedText('Guard',locale)}</span>
                          <span className="buff-vals">
                            <span className="buff-up">+{fmt(top.val)}%</span>
                            {top.duration&&<span className="buff-dur">{localizedDuration(top.duration,locale)}</span>}
                            {extra>0&&<span className="buff-more">+{extra}</span>}
                            <span className="buff-chevron" style={extra>0?undefined:{opacity:.25}}>{isOpen?'▴':'▾'}</span>
                          </span>
                        </div>
                        {isOpen&&extra>0&&(
                          <div className="buff-sources">
                            {sorted.map((inst,idx)=>(
                              <div key={idx} className="buff-source-row">
                                <CharIcon c={inst.owner} size={16} round={true}/>
                                <span className="buff-source-name">{localizedCharacter(inst.owner,locale).displayName}</span>
                                <span className="buff-up">+{fmt(inst.val)}%{inst.duration?` · ${localizedDuration(inst.duration,locale)}`:''}</span>
                              </div>
                            ))}
                             <div className="buff-guard-note">{t('buffs.guardNote')}</div>
                          </div>
                        )}
                      </div>
                    )
                  }
                  const key=`${g.id}|${stat}`
                  const isOpen=expanded===key
                  return(
                    <div key={stat}>
                      <div className={`buff-row buff-row-click${isOpen?' buff-row-open':''}`}
                           onClick={()=>setExpanded(isOpen?null:key)}>
                        <span className="buff-stat-name">{localizedText(stat,locale)}</span>
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
                              <span className="buff-source-name">{localizedCharacter(s.owner,locale).displayName}</span>
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
              <span style={{fontSize:'.85rem'}}>↓</span> {localizedTarget(target,locale)}
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
                      <span className="buff-stat-name" style={{color:'#b05000',fontWeight:700,fontSize:'.75rem'}}>{localizedText(s,locale)}</span>
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
                            <span className="buff-source-name">{localizedCharacter(x.owner,locale).displayName}</span>
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
export const BUFF_UNIT_CATS = ['Infantry','Cavalry','Archer','Shield']
export const BUFF_STAT_COLORS = {HP:'#1a8a72', Attack:'#c0392b', Defense:'#2471a3'}
export const CAT_COLOR = {Infantry:'#b8880a', Cavalry:'#c0392b', Archer:'#27ae60', Shield:'#6a4fc8'}
export const TERRAIN_BUFFS = [
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

export const BUFF_STATES = ['Qin','Zhao','Wei','Chu','Han','Ai','Mountain Folk']
export const STATE_FACTION_ID = {Qin:'qin',Zhao:'zhao',Wei:'wei',Chu:'chu',Han:'han',Ai:'ai','Mountain Folk':'mountain_folk'}
export const BUFF_ARMIES = ['Gyokuhou Squad','Hishin Unit','Kanki Army','Karin Army','Ousen Army','Ouki Army','Gakuka Unit','Six Great Generals']
export const ARMY_PARENT_STATE = {'Gyokuhou Squad':'qin','Hishin Unit':'qin','Kanki Army':'qin','Karin Army':'chu','Ousen Army':'qin','Ouki Army':'qin','Gakuka Unit':'qin','Six Great Generals':'qin'}
export const ARMY_ICON_CHAR = {'Gyokuhou Squad':'Ouhon','Hishin Unit':'Shin','Kanki Army':'Kanki','Karin Army':'Karin','Ousen Army':'Ousen','Ouki Army':'Ouki','Gakuka Unit':'Mouten','Six Great Generals':'Sho'}
export const WOGG_BUFF_NAME = 'Way of The Great General'
// CW siege-weapon buffs (攻撃兵器 / 防衛兵器). A minor category compared with
// unit types and states, so the page shows it last and compact.
export const BUFF_SIEGE = ['Attack Siege Weapons','Defense Siege Weapons']
export const SIEGE_META = {
  'Attack Siege Weapons':  {color:'#a8452e', icon:'/icons/siege_attack.webp'},
  'Defense Siege Weapons': {color:'#4a6b7c', icon:'/icons/siege_defense.webp'},
}
export const WOGG_BUFF_DESCRIPTION = 'These buffs unlock from the second page of WoGG.'
export const WOGG_BUFF_SOURCES = [
  {name:'Bajio',icon:'/icons/Bajio.webp',tier:'A'},
  {name:'Gakuki',icon:'/icons/Gakuki.webp',tier:'A'},
  {name:'Houken',icon:'/icons/Houken.webp',tier:'A'},
  {name:'Denyuu',icon:'/icons/Denyuu.webp',tier:'B'},
  {name:'Ryuusen',icon:'/icons/Ryuusen.webp',tier:'B'},
  {name:'Banyou',icon:'/icons/Banyou.webp',tier:'B'},
  {name:'Kuzen',icon:'/icons/Kuzen.webp',tier:'B'},
  {name:'Chousou',icon:'/icons/Chousou.webp',tier:'B'},
  {name:'Shoumou',icon:'/icons/Shoumou.webp',tier:'B'},
  {name:'Kousonryu',icon:'/icons/Kousonryu.webp',tier:'B'},
  {name:'Mangoku',icon:'/icons/Mangoku.webp',tier:'B'},
]

export const UNIT_ICON_SCALE={Infantry:1.18,Cavalry:1.18,Archer:1,Shield:1}
export function UnitCatIcon({cat,size=80}){
  const locale=useLocale()
  const imgs={'Infantry':'/icons/unit_infantry.webp','Cavalry':'/icons/unit_cavalry.webp','Archer':'/icons/unit_archer.webp','Shield':'/icons/unit_shield.webp'}
  const s=Math.round(size*( UNIT_ICON_SCALE[cat]||1))
  return <img src={imgs[cat]} alt={localizedText(cat,locale)} loading="lazy" decoding="async" style={{width:s,height:s,objectFit:'contain',flexShrink:0}}/>
}

export function TerrainIcon({terrain,size=72}){
  const locale=useLocale()
  if(!terrain) return null
  return <img src={terrain.icon} alt={localizedText(terrain.name,locale)} loading="lazy" decoding="async" style={{width:size,height:size,objectFit:'contain',flexShrink:0}}/>
}


export function BuffsPage(){
  const { t } = useTranslation('common')
  const locale = useLocale()
  // Category chips use the SHORT state names the archive rail uses (秦, 趙),
  // not the full 秦国/趙国 forms the effect sentences need, so this small map
  // stays. It is sourced from FACTIONS so the two can never drift apart.
  const labelFor = value => {
    const japanese = {
      Infantry: '歩兵', Cavalry: '騎兵', Archer: '弓兵', Shield: '盾兵',
      ...Object.fromEntries(FACTIONS.map(f => [f.label, f.jp])),
      Slope: '坂', Forest: '森', River: '川', Swamp: '湿地', Ambush: '伏兵', Checkpoint: '関所',
    }
    return locale.code === 'ja' ? (japanese[value] || localizedText(value, locale)) : localizedText(value, locale)
  }
  const[activeKind,setActiveKind]=useState(null) // 'unit'|'state'|'army'|'terrain'|'wogg'|'siege'
  const[activeKey,setActiveKey]=useState(null)
  const[activeStat,setActiveStat]=useState('HP')
  const[sceneProgressFilter,setSceneProgressFilter]=useState('all')
  const[artSrc,setArtSrc]=useState(null)
  const[buffSearch,setBuffSearch]=useState('')
  const tracker=useProgressTracker()
  const closeDetails=()=>{setActiveKind(null);setActiveKey(null)}
  useModalDismiss(!!activeKey,closeDetails)
  const lookupEntries=(kind,key,stat)=>{
    if(kind==='unit') return (cwBuffsData[key]||{})[stat]||[]
    if(kind==='state') return ((cwTeamBuffs.states||{})[key]||{})[stat]||[]
    if(kind==='army')  return ((cwTeamBuffs.armies||{})[key]||{})[stat]||[]
    if(kind==='siege') return ((cwTeamBuffs.siege||{})[key]||{})[stat]||[]
    return []
  }
  const findBuffChar=e=>findCharByName(e?.name)||ALL.find(c=>c.name_jp===e?.name_jp)||null
  const buffEntryDisplayName=e=>{
    const character=findBuffChar(e)
    return character?localizedCharacter(character,locale).displayName:localizedCharacterName(e?.name,locale)
  }
  const buffEntryMatches=(entry,query)=>matchesCharacterName(
    findBuffChar(entry)||{name_en:entry?.name,name_jp:entry?.name_jp},
    query,
  )
  const buffSearchNorm=buffSearch.trim().toLowerCase()
  const categoryMatches=(kind,key)=>{
    if(!buffSearchNorm) return true
    if(key.toLowerCase().includes(buffSearchNorm)||String(labelFor(key)).toLowerCase().includes(buffSearchNorm)) return true
    if(kind==='wogg') return WOGG_BUFF_SOURCES.some(source=>buffEntryMatches(source,buffSearch))
    if(kind==='army'){
      const leader=ARMY_ICON_CHAR[key]&&findCharByName(ARMY_ICON_CHAR[key])
      if(leader&&matchesCharacterName(leader,buffSearch)) return true
    }
    if(kind==='terrain'){
      const terrain=TERRAIN_BUFFS.find(item=>item.name===key)
      return terrain?.entries.some(entry=>buffEntryMatches(entry,buffSearch))
    }
    return buffStats.some(stat=>String(labelFor(stat)).toLowerCase().includes(buffSearchNorm)||lookupEntries(kind,key,stat).some(entry=>buffEntryMatches(entry,buffSearch)))
  }
  const handlePick=(kind,key)=>{
    if(activeKind===kind&&activeKey===key){setActiveKind(null);setActiveKey(null)}
    else{setActiveKind(kind);setActiveKey(key);setActiveStat('HP')}
  }
  const renderCard=(kind,key,col,iconNode,countLabel)=>{
    const isActive=activeKind===kind&&activeKey===key
    return(
      <button key={kind+':'+key} className="buff-pick-card" onClick={()=>handlePick(kind,key)} style={{
        display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',
        padding:'16px 18px 12px',borderRadius:'18px',cursor:'pointer',width:'138px',
        border:`2px solid ${isActive?col:'var(--bdr)'}`,
        background:isActive?`linear-gradient(135deg,${col}18,${col}08)`:'var(--sur)',
        boxShadow:isActive?`0 6px 24px ${col}35`:'0 2px 8px rgba(0,0,0,0.06)',
        transform:isActive?'translateY(-4px) scale(1.03)':'scale(1)',
        transition:'all .2s ease',
      }}>
        <div className={`buff-pick-icon buff-pick-icon-${kind}`} style={{width:72,height:72,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{iconNode}</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontWeight:800,fontSize:'.88rem',color:isActive?col:'var(--txt)',marginBottom:'4px',lineHeight:'1.15'}}>{labelFor(key)}</div>
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
  const SiegeIcon=({name,size=34})=>(
    <img src={SIEGE_META[name]?.icon} alt="" loading="lazy" decoding="async"
      style={{width:size,height:size,objectFit:'contain'}}/>
  )
  const siegeCount=(key)=>new Set(Object.values((cwTeamBuffs.siege||{})[key]||{}).flat().map(e=>e.name)).size
  const renderSiegeCard=(key)=>{
    const col=SIEGE_META[key]?.color||'#888'
    const isActive=activeKind==='siege'&&activeKey===key
    return(
      <button key={'siege:'+key} className="buff-siege-card" onClick={()=>handlePick('siege',key)} style={{
        borderColor:isActive?col:'var(--bdr)',
        background:isActive?`linear-gradient(135deg,${col}18,${col}08)`:'var(--sur)',
      }}>
        <SiegeIcon name={key}/>
        <span className="buff-siege-text">
          <span className="buff-siege-name" style={isActive?{color:col}:undefined}>{labelFor(key)}</span>
          <span className="buff-siege-n">{t('generalCount',{count:siegeCount(key)})}</span>
        </span>
      </button>
    )
  }
  // ── details panel ──
  const WoggIcon=({size=72})=>(
    <div style={{width:size,height:size,borderRadius:'50%',background:'linear-gradient(135deg,#d6a634,#8e6313)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff8dd',fontWeight:900,fontSize:size*.38+'px',fontFamily:'serif',border:'2px solid #d6a634',boxShadow:'0 4px 14px #8e631355'}}>
      {'将'}
    </div>
  )
  const renderWoggDetails=()=> (
    <div>
      <div style={{display:'flex',gap:'14px',alignItems:'center',padding:'14px 16px',borderRadius:'14px',marginBottom:'1rem',background:'linear-gradient(90deg,#d6a63418,#d6a63408)',border:'1.5px solid #d6a63444'}}>
        <WoggIcon size={54}/>
        <div style={{minWidth:0}}>
          <div style={{fontWeight:900,fontSize:'1.05rem',color:'var(--txt)',marginBottom:'4px'}}>{t('buffs.woggTitle')}</div>
          <div style={{fontSize:'.82rem',lineHeight:1.45,color:'var(--txt2)'}}>{t('buffs.woggDescription')}</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(112px,1fr))',gap:'10px'}}>
        {WOGG_BUFF_SOURCES.map(source=>{
          const sourceName=buffEntryDisplayName(source)
          return <div key={source.name} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',padding:'12px 8px',borderRadius:'12px',background:'var(--sur)',border:'1px solid var(--bdr)'}}>
            <img src={source.icon} alt={sourceName} title={sourceName} loading="lazy" decoding="async" style={{width:64,height:64,borderRadius:'50%',objectFit:'cover',objectPosition:'center top',border:'2px solid #d6a63466',background:'#d6a63418'}}/>
            <span style={{fontWeight:800,fontSize:'.78rem',color:'var(--txt)',textAlign:'center'}}>{sourceName}</span>
            <span aria-label={t('meta.tier',{tier:source.tier})} style={{fontWeight:900,fontSize:'.72rem',lineHeight:1,color:'#b88b2c',letterSpacing:'.08em'}}>{source.tier}</span>
          </div>
        })}
      </div>
    </div>
  )
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
            const displayName=buffEntryDisplayName(e)
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
                  {char?.icon?<img src={char.icon} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}} alt={displayName}/>
                  :char?.image?<img src={persosThumb(char.image)} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={displayName}/>
                  :<span style={{fontSize:'1.15rem',fontWeight:800,color:fc}}>{displayName?.[0]||'?'}</span>}
                </div>
                <div className="buff-source-info" style={{flex:1,minWidth:0}}>
                  <div className="buff-source-name-line" style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap',marginBottom:'3px'}}>
                    <span style={{fontWeight:800,fontSize:'.92rem',color:'var(--txt)'}}>{displayName}</span>
                    {secondaryName(displayName,e.name_jp)&&<span style={{fontSize:'.65rem',color:'var(--txt3)'}}>{e.name_jp}</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{fontSize:'.62rem',padding:'1px 7px',borderRadius:'4px',background:fc+'22',color:fc,border:`1px solid ${fc}44`,fontWeight:700}}>{buffEntryRarity(e)}</span>
                    <span style={{fontSize:'.62rem',color:'var(--txt3)'}}>{localizedText(FACTIONS.find(f=>f.id===e.faction)?.label||e.faction,locale)}</span>
                  </div>
                </div>
                <div className="buff-source-actions" style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'12px',flexShrink:0,minWidth:'240px'}}>
                  <BuffValueCluster
                    value={e.value}
                    color={terrain.color}
                    cost={unlockCost}
                    icon="/icons/Red_Crystal.webp"
                    iconLabel={t('teamCost.buffs.redCrystal')}
                    iconTitle={t('teamCost.buffs.redCrystal')}
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
    if(activeKind==='wogg') return renderWoggDetails()
    if(activeKind==='terrain'){
      const terrain=TERRAIN_BUFFS.find(t=>t.name===activeKey)
      return terrain?renderTerrainDetails(terrain):null
    }
    const col = activeKind==='unit'?CAT_COLOR[activeKey]
              : activeKind==='state'?(CC[STATE_FACTION_ID[activeKey]]||'#888')
              : activeKind==='siege'?(SIEGE_META[activeKey]?.color||'#888')
              : (CC[ARMY_PARENT_STATE[activeKey]]||'#888')
    const entries=lookupEntries(activeKind,activeKey,activeStat)
    const total=entries.reduce((s,e)=>s+(e.value||0)+(e.shard_bonus?5:0),0)
    const sc=BUFF_STAT_COLORS[activeStat]
    return(
      <div>
        <div className="buff-stat-tabs" style={{display:'flex',justifyContent:'center',gap:'10px',position:'sticky',top:0,zIndex:5,background:'var(--sur)',margin:'-18px -18px 1.5rem',padding:'16px 18px 12px',borderBottom:'1px solid var(--bdr)'}}>
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
                <span style={{fontWeight:700,fontSize:'.85rem',color:isOn?c:'var(--txt)'}}>{labelFor(stat)}</span>
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
              :activeKind==='siege'
                ?<SiegeIcon name={activeKey} size={36}/>
                :<ArmyBadge name={activeKey} size={36}/>}
            <div>
              <div style={{fontWeight:700,fontSize:'.88rem',color:col}}>{labelFor(activeKey)} · {labelFor(activeStat)}</div>
              <div style={{fontSize:'.7rem',color:'var(--txt3)'}}>{t('buffs.totalStackable', { count: entries.length })}</div>
            </div>
          </div>
          <div style={{fontWeight:900,fontSize:'1.5rem',color:sc}}>+{total.toFixed(1)}%</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {entries.length===0&&<div style={{textAlign:'center',padding:'2rem 1rem',color:'var(--txt3)',fontSize:'.85rem'}}>{t('buffs.noBuffFor', { stat: labelFor(activeStat), key: labelFor(activeKey) })}</div>}
          {entries.map((e,i)=>{
            const char=findBuffChar(e)
            const displayName=buffEntryDisplayName(e)
            const fc=CC[e.faction]||'#888'
            const isTop=i<3
            const unlockIcon=e.special_icon|| (e.value===5?'/icons/Shard.webp':'/icons/Red_Crystal.webp')
             const unlockLabel=e.special_label|| (e.value===5?t('teamCost.buffs.shard'):t('teamCost.buffs.redCrystal'))
             const unlockTitle=e.special_label|| (e.value===5?t('teamCost.buffs.shard'):t('teamCost.buffs.redCrystal'))
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
                  {char?.icon?<img src={char.icon} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}} alt={displayName}/>
                  :char?.image?<img src={persosThumb(char.image)} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={displayName}/>
                  :<span style={{fontSize:'1.2rem',fontWeight:700,color:fc}}>{displayName[0]}</span>}
                </div>
                <div className="buff-source-info" style={{flex:1,minWidth:0}}>
                  <div className="buff-source-name-line" style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap',marginBottom:'3px'}}>
                    <span style={{fontWeight:700,fontSize:'.92rem',color:'var(--txt)'}}>{displayName}</span>
                    {secondaryName(displayName,e.name_jp)&&<span style={{fontSize:'.65rem',color:'var(--txt3)'}}>{e.name_jp}</span>}
                    {e.star6&&<span style={{fontSize:'.65rem',color:'#c9902a',fontWeight:800}}>☆6</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{fontSize:'.62rem',padding:'1px 7px',borderRadius:'4px',background:fc+'22',color:fc,border:`1px solid ${fc}44`,fontWeight:700}}>{buffEntryRarity(e)}</span>
                    <span style={{fontSize:'.62rem',color:'var(--txt3)'}}>{localizedText(FACTIONS.find(f=>f.id===e.faction)?.label||e.faction,locale)}</span>
                  </div>
                </div>
                <div className="buff-source-actions" style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'10px',flexShrink:0,minWidth:e.shard_bonus?'300px':'240px',flexWrap:e.shard_bonus?'wrap':'nowrap',rowGap:'6px'}}>
                  {e.shard_bonus?(<>
                    <span className="buff-value-shard-group" style={{display:'inline-flex',alignItems:'center',gap:'6px',opacity:shardOwned?1:.55}}>
                      <span style={{fontWeight:900,fontSize:'1.1rem',color:sc,fontVariantNumeric:'tabular-nums'}}>+5.0%</span>
                     <img src="/icons/Shard.webp" alt={t('teamCost.buffs.shard')} title={t('teamCost.buffs.shard')} loading="lazy" decoding="async" style={{width:20,height:20,objectFit:'contain',flexShrink:0}}/>
                      <OwnedToggle
                        owned={shardOwned}
                        onToggle={()=>tracker.toggleOwned('buffSources',shardSourceId)}
                      />
                    </span>
                    <span style={{color:'var(--txt3)',fontWeight:800,fontSize:'.9rem'}}>+</span>
                    <span className="buff-value-crystal-group" style={{display:'inline-flex',alignItems:'center',gap:'8px',opacity:owned?1:.55}}>
                      <RedCrystalCostChip cost={unlockCost} value={e.value}/>
                      <span style={{fontWeight:900,fontSize:'1.1rem',color:sc,minWidth:'52px',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>+{e.value.toFixed(1)}%</span>
                      <OwnedToggle
                        owned={owned}
                        onToggle={()=>tracker.toggleOwned('buffSources',sourceId)}
                      />
                    </span>
                  </>):(<>
                    <BuffValueCluster
                      value={e.value}
                      color={sc}
                      cost={unlockCost}
                      icon={unlockIcon}
                      iconLabel={unlockLabel}
                      iconTitle={unlockTitle}
                    />
                    <OwnedToggle
                      owned={owned}
                      onToggle={()=>tracker.toggleOwned('buffSources',sourceId)}
                    />
                  </>)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  // Stat headings are game terminology, so they resolve through the shared
  // data localizer rather than the UI catalog.
  const sceneStatLabel=name=>localizedText(name,locale)
  const sceneStatMeta={
    hp:{label:sceneStatLabel('HP'),color:BUFF_STAT_COLORS.HP,total:SCENE_CARD.hp,unit:''},
    atk:{label:sceneStatLabel('Attack'),color:BUFF_STAT_COLORS.Attack,total:SCENE_CARD.atk,unit:''},
    def:{label:sceneStatLabel('Defense'),color:BUFF_STAT_COLORS.Defense,total:SCENE_CARD.def,unit:''},
    morale:{label:sceneStatLabel('Max Morale'),color:'#5a8fcb',total:SCENE_CARD.maxMp,unit:''},
    crit_rate:{label:sceneStatLabel('Critical Rate'),color:'#b85b28',total:SCENE_CARD.critRate/100,unit:'%'},
    evasion:{label:sceneStatLabel('Evasion'),color:'#7a65c7',total:SCENE_CARD.dodgeRate/100,unit:'%'},
    hit_rate:{label:sceneStatLabel('Hit Rate'),color:'#c79a3a',total:(SCENE_CARD.hitRate||0)/100,unit:'%'},
    atk_down_resist:{label:sceneStatLabel('Attack Down Resistance'),color:'#b5654d',total:(SCENE_CARD.atkDownResist||0)/100,unit:'%'},
    def_down_resist:{label:sceneStatLabel('Defense Down Resistance'),color:'#5d8aa8',total:(SCENE_CARD.defDownResist||0)/100,unit:'%'},
  }
  const sceneStatOrder=['hp','atk','def','morale','crit_rate','evasion','hit_rate','atk_down_resist','def_down_resist']
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
  const sceneValueText=(card,value=sceneCardValueAt(card))=>card.valueMode==='percent'?`+${value.toFixed(2)}%`:`+${formatLocaleNumber(value,locale)}`
  const sceneTotalText=m=>m.unit==='%'?`+${m.total.toFixed(2)}%`:`+${formatLocaleNumber(m.total,locale)}`
  const sceneCardIds=(sceneCardBuffs.cards||[]).map(c=>c.id)
  const sceneOwnedCount=(sceneCardBuffs.cards||[]).filter(c=>sceneCardStar(c)>0).length
  const buffStats=['HP','Attack','Defense']
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
    pushRows('siege',BUFF_SIEGE,'Siege Weapons')
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
    {label:t('buffs.unitTypes'),rows:BUFF_UNIT_CATS.map(key=>({key,kind:'unit',color:CAT_COLOR[key]}))},
    {label:t('buffs.states'),rows:BUFF_STATES.map(key=>({key,kind:'state',color:CC[STATE_FACTION_ID[key]]||'#888'}))},
    {label:t('buffs.specialUnits'),rows:BUFF_ARMIES.map(key=>({key,kind:'army',color:CC[ARMY_PARENT_STATE[key]]||'#888'}))},
    {label:t('buffs.siegeWeapons'),rows:BUFF_SIEGE.map(key=>({key,kind:'siege',color:SIEGE_META[key]?.color||'#888'}))},
  ]
  const sceneOwnedByStat=stat=>(sceneCardBuffs.cards||[]).filter(c=>c.stat===stat).reduce((sum,c)=>sum+sceneCardValueAt(c),0)
  const isProgressRowOwned=r=>r.bucket==='sceneBuffStars'?sceneCardStar({id:r.id})>0:tracker.isOwned(r.bucket,r.id)
  const allOwnedCount=progressRows.reduce((n,r)=>n+(isProgressRowOwned(r)?1:0),0)
  const statProgressCell=(kind,key,stat)=>(
    <span className="buff-summary-stat" title={`${localizedText('Max '+stat,locale)}: ${maxBuffValue(kind,key,stat).toFixed(1)}%`}>
      <b>{localizedText(stat,locale)}</b>
      <span>+{ownedBuffValue(kind,key,stat).toFixed(1)}%</span>
    </span>
  )
  const renderBuffProgressSection=()=>(
    <section className="buff-progress-panel">
      <div className="buff-progress-head">
        <div>
          <h3>{t('buffs.ownedTotals')}</h3>
          <p>{t('buffs.sourcesOwned', { owned: allOwnedCount, total: progressRows.length })}</p>
        </div>
        <ProgressTools tracker={tracker}/>
      </div>
      <details className="buff-progress-details">
        <summary>
          <span>{t('buffs.showTotals')}</span>
          <span>{t('buffs.byCategory')}</span>
        </summary>
        <div className="buff-summary-list">
          {buffSummarySections.map(section=>(
            <div key={section.label} className="buff-summary-section">
              <h4>{labelFor(section.label)}</h4>
              <div className="buff-summary-rows">
                {section.rows.map(row=>(
                  <button key={`${row.kind}:${row.key}`} type="button" className="buff-summary-row" onClick={()=>handlePick(row.kind,row.key)}>
                    <span className="buff-summary-name" style={{'--sc':row.color}}>{labelFor(row.key)}</span>
                    <span className="buff-summary-stats">
                      {buffStats.map(stat=><span key={stat}>{statProgressCell(row.kind,row.key,stat)}</span>)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="buff-summary-section">
            <h4>{t('buffs.sceneCards')}</h4>
            <div className="buff-summary-rows">
              <div className="buff-summary-row">
                <span className="buff-summary-name" style={{'--sc':'#1a8a5a'}}>{t('buffs.sceneCards')} · {t('buffs.ownedTotals')}</span>
                <span className="buff-summary-stats">
                  {sceneStatOrder.map(stat=>{
                    const meta=sceneStatMeta[stat]
                    const val=sceneOwnedByStat(stat)
                    const text=meta.unit==='%'?`+${val.toFixed(2)}%`:`+${formatLocaleNumber(val,locale)}`
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
    <div className="buff-scene-section" style={{marginBottom:'2rem',display:'flex',flexDirection:'column',gap:'10px'}}>
        <div className="progress-section-bar">
          <span>{t('buffs.buffsOwned', { owned: sceneOwnedCount, total: sceneCardIds.length })}</span>
          <div className="progress-filter-group" aria-label={t('buffs.ownershipFilter')}>
            {progressFilterItems.map(item=>(
              <button key={item.id} type="button" className={sceneProgressFilter===item.id?'active':''} onClick={()=>setSceneProgressFilter(item.id)}>{t(item.key,{defaultValue:item.label})}</button>
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
                  <span style={{fontSize:'.66rem',color:'var(--txt3)',padding:'2px 8px',borderRadius:'999px',background:'var(--bg2)',border:'1px solid var(--bdr)'}}>{t('ownedCount',{owned:ownedCount,total:cards.length})}</span>
                </span>
              </summary>
              <div className="buff-scene-card-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,116px)',justifyContent:'center',gap:'12px',padding:'12px'}}>
                {visibleCards.map((card,i)=>(
                  (()=>{const star=sceneCardStar(card);const ownerName=localizedCharacterName(locale.code==='ja'?(card.ownerNameJp||card.ownerName):card.ownerName,locale);return(
                  <div key={card.id} style={{
                    border:'1px solid var(--bdr)',borderRadius:'8px',overflow:'hidden',
                    background:star>0?'linear-gradient(180deg,rgba(26,138,90,.1),var(--sur))':'var(--sur)',
                    boxShadow:'0 2px 10px rgba(0,0,0,.06)',
                    }}>
                    <div style={{position:'relative',aspectRatio:'1 / 1',background:'var(--bg2)',overflow:'hidden'}}>
                      <img src={card.thumb||card.image} alt={`${ownerName} — ${m.label} — ${t('archive.sceneCards')}`} title={`${ownerName} — ${m.label} — ${t('archive.sceneCards')}`} loading={i<4?'eager':'lazy'} decoding="async" style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>
                      {card.image&&<ViewArtButton onClick={e=>{e.stopPropagation();setArtSrc(card.image)}}/>}
                      <div style={{
                        position:'absolute',left:7,bottom:7,padding:'3px 7px',borderRadius:'6px',
                        background:'rgba(0,0,0,.66)',color:'#fff',fontSize:'.68rem',fontWeight:900,
                      }}>{sceneValueText(card)}</div>
                    </div>
                    <div style={{minHeight:68,padding:'5px 7px 7px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'5px'}}>
                      <SceneStarControl star={star} onChange={next=>setSceneCardStar(card,next)}/>
                      <img src={card.ownerIcon} alt={ownerName} title={ownerName} loading="lazy" decoding="async" style={{
                        width:30,height:30,borderRadius:'50%',objectFit:'cover',objectPosition:'center top',
                        border:`2px solid ${m.color}`,background:m.color+'18',
                      }}/>
                    </div>
                  </div>
                  )})()
                ))}
                {visibleCards.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',fontSize:'.78rem',color:'var(--txt3)',padding:'1rem'}}>{t('buffs.noCards')}</div>}
              </div>
            </details>
          )
        })}
    </div>
  )
  const SectionLabel=({children})=>(
    <div className="buff-section-label" style={{display:'flex',alignItems:'center',gap:'10px',margin:'0 0 1rem'}}>
      <div style={{flex:1,height:1,background:'var(--bdr)'}}/>
      <span style={{fontSize:'.72rem',fontWeight:800,color:'var(--txt3)',letterSpacing:'.08em',textTransform:'uppercase'}}>{children}</span>
      <div style={{flex:1,height:1,background:'var(--bdr)'}}/>
    </div>
  )
  return(
    <div className="buffs-page">
      <header className="buffs-page-head">
        <div>
          <h1>{t('buffs.title')}</h1>
          <p>{t('buffs.description')}</p>
        </div>
        <label className="buff-global-search">
          <span>{t('buffs.find')}</span>
          <input type="search" value={buffSearch} onChange={event=>setBuffSearch(event.target.value)} placeholder={t('buffs.search')}/>
        </label>
        <div className="buffs-legend">
          <span style={{display:'inline-flex',alignItems:'center',gap:'5px'}}><img src="/icons/Red_Crystal.webp" alt="" style={{width:15,height:15,objectFit:'contain'}}/>{t('buffs.redCrystal')}</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:'5px'}}><img src="/icons/Shard.webp" alt="" style={{width:15,height:15,objectFit:'contain'}}/>{t('buffs.shard')}</span>
        </div>
      </header>

      {renderBuffProgressSection()}

      <SectionLabel>{t('buffs.unitTypes')}</SectionLabel>
      <div className="buff-pick-row" style={{display:'flex',justifyContent:'center',gap:'14px',marginBottom:'2rem',flexWrap:'wrap'}}>
        {BUFF_UNIT_CATS.filter(cat=>categoryMatches('unit',cat)).map(cat=>{
          const uniqueNames=new Set(Object.values(cwBuffsData[cat]||{}).flat().map(e=>e.name))
           return renderCard('unit',cat,CAT_COLOR[cat],<UnitCatIcon cat={cat} size={64}/>,t('generalCount',{count:uniqueNames.size}))
        })}
      </div>

      <SectionLabel>{t('buffs.states')}</SectionLabel>
      <div className="buff-pick-row" style={{display:'flex',justifyContent:'center',gap:'12px',marginBottom:'2rem',flexWrap:'wrap'}}>
        {BUFF_STATES.filter(state=>categoryMatches('state',state)).map(s=>{
          const col=CC[STATE_FACTION_ID[s]]||'#888'
          const n=stateCount(s)
           return renderCard('state',s,col,<StateBadge id={STATE_FACTION_ID[s]}/>,t('generalCount',{count:n}))
        })}
      </div>

      <SectionLabel>{t('buffs.specialUnits')}</SectionLabel>
      <div className="buff-pick-row" style={{display:'flex',justifyContent:'center',gap:'12px',marginBottom:'2rem',flexWrap:'wrap'}}>
        {BUFF_ARMIES.filter(army=>categoryMatches('army',army)).map(a=>{
          const col=CC[ARMY_PARENT_STATE[a]]||'#888'
          const n=armyCount(a)
           return renderCard('army',a,col,<ArmyBadge name={a}/>,t('generalCount',{count:n}))
        })}
      </div>

       <SectionLabel>{t('buffs.woggTitle')}</SectionLabel>
      <p style={{fontSize:'.78rem',color:'var(--txt3)',textAlign:'center',margin:'-.35rem auto 1rem',maxWidth:'520px'}}>
         {t('buffs.woggDescription')}
      </p>
      <div className="buff-pick-row" style={{display:'flex',justifyContent:'center',gap:'12px',marginBottom:'2rem',flexWrap:'wrap'}}>
         {categoryMatches('wogg',WOGG_BUFF_NAME)&&renderCard('wogg',WOGG_BUFF_NAME,'#b88b2c',<WoggIcon size={64}/>,t('generalCount',{count:WOGG_BUFF_SOURCES.length}))}
      </div>

      <SectionLabel>{t('buffs.terrain')}</SectionLabel>
      <div className="buff-pick-row" style={{display:'flex',justifyContent:'center',gap:'12px',marginBottom:'2rem',flexWrap:'wrap'}}>
         {TERRAIN_BUFFS.filter(terrain=>categoryMatches('terrain',terrain.name)).map(terrain=>renderCard('terrain',terrain.name,terrain.color,<TerrainIcon terrain={terrain}/>,t('generalCount',{count:terrain.entries.length})))}
      </div>

      <SectionLabel>{t('buffs.sceneCards')}</SectionLabel>
      <p style={{fontSize:'.78rem',color:'var(--txt3)',textAlign:'center',margin:'-.35rem auto 1rem',maxWidth:'520px'}}>
        {t('buffs.sceneDescription', { defaultValue: 'Scene card buffs apply to all characters.' })}
      </p>
      {renderSceneCardsSection()}

      <SectionLabel>{t('buffs.siegeWeapons')}</SectionLabel>
      <div className="buff-siege-row">
        {BUFF_SIEGE.filter(key=>categoryMatches('siege',key)).map(renderSiegeCard)}
      </div>

      <div style={{textAlign:'center',padding:'2.5rem 1rem',color:'var(--txt3)'}}>
        <div style={{fontSize:'2rem',opacity:.15,marginBottom:'.6rem'}}>⚔</div>
        <div style={{fontSize:'.85rem'}}>{t('buffs.tapCategory')}</div>
      </div>
      {activeKey&&(
        <div className="overlay" onClick={closeDetails}>
          <div role="dialog" aria-modal="true" aria-label={`${labelFor(activeKey)} — ${t('buffs.title')}`} onClick={e=>e.stopPropagation()} style={{
            background:'var(--sur)',borderRadius:'18px',width:'min(720px,94vw)',maxHeight:'88vh',
            display:'flex',flexDirection:'column',overflow:'hidden',
            boxShadow:'0 24px 70px rgba(0,0,0,.35)',border:'1px solid var(--bdr)'
          }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid var(--bdr)',background:'var(--bg2)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                {activeKind==='wogg'
                  ?<WoggIcon size={32}/>
                  :activeKind==='unit'
                    ?<UnitCatIcon cat={activeKey} size={32}/>
                  :activeKind==='state'
                    ?<StateBadge id={STATE_FACTION_ID[activeKey]} size={32}/>
                    :activeKind==='terrain'
                      ?<TerrainIcon terrain={TERRAIN_BUFFS.find(t=>t.name===activeKey)} size={34}/>
                    :activeKind==='siege'
                      ?<SiegeIcon name={activeKey} size={32}/>
                      :<ArmyBadge name={activeKey} size={32}/>}
                <div>
                  <div style={{fontWeight:800,fontSize:'.95rem',color:'var(--txt)'}}>{labelFor(activeKey)}</div>
                  <div style={{fontSize:'.66rem',color:'var(--txt3)',textTransform:'uppercase',letterSpacing:'.05em'}}>{activeKind==='wogg'?t('buffType', { defaultValue: 'Buff Type' }):activeKind==='unit'?t('unitType', { defaultValue: 'Unit Type' }):activeKind==='state'?t('state', { defaultValue: 'State' }):activeKind==='terrain'?t('buffs.terrain'):activeKind==='siege'?t('buffs.siegeWeapons'):t('buffs.specialUnits')}</div>
                </div>
              </div>
              <button className="x-btn" aria-label={t('close')} onClick={closeDetails}>✕</button>
            </div>
            <div style={{padding:'18px',overflowY:'auto'}}>
              {renderDetails()}
            </div>
          </div>
        </div>
      )}
      <ArtLightbox src={artSrc} alt={t('altSceneCardArt')} onClose={()=>setArtSrc(null)}/>
    </div>
  )
}
// ── TIER LIST (CW Metawatch) ──────────────────────────────────────────────────
// Per-tier visual config. `badge`=header chip gradient, `label`=tier label text
// colour, `accent`=team-card left bar, `ring`=avatar border on light cards.
export const TIER_DEFS={
  SS:{label:'#f5d77e', accent:'#f0c14b', ring:'#b9912e',           badge:'linear-gradient(180deg,#f9de86,#d4a32c)', badgeText:'#4a3408'},
  S :{label:'#c23b30', accent:'#c23b30', ring:'rgba(194,59,48,.4)',  badge:'linear-gradient(180deg,#e2564a,#c23b30)', badgeText:'#fff'},
  A :{label:'#c75f1a', accent:'#d76a1f', ring:'rgba(215,106,31,.4)', badge:'linear-gradient(180deg,#f0903f,#d76a1f)', badgeText:'#fff'},
  B :{label:'#b07d18', accent:'#d39a25', ring:'rgba(211,154,37,.45)',badge:'linear-gradient(180deg,#edc24f,#d39a25)', badgeText:'#4a3408'},
  C :{label:'#2f66bd', accent:'#2f66bd', ring:'rgba(47,102,189,.4)', badge:'linear-gradient(180deg,#5b8fd6,#2f66bd)', badgeText:'#fff'},
}

// Star of David / shield star used in the SS header (lucide "star" path).
const SS_STAR='M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z'

function TierTeamCard({team,def,ss=false}){
  const locale = useLocale()
  const chars=team.members.map(findCharByName).filter(Boolean)
  return(
    <div className={'mw-team'+(ss?' mw-team--ss':'')} style={{borderInlineStartColor:def.accent}}>
      <div className="mw-team-name">{localizedTeamName(team.name,locale.code)}</div>
      <div className="mw-team-members">
        {chars.map((c,ci)=>{
          const star6=(c.skills||[]).some(s=>s.star6)
          return(
            <div key={ci} className="mw-member">
              <div className="mw-avatar" style={{borderColor:ss?'#b9912e':def.ring}}>
                <CharIcon c={c} size={44} round={true} className="mw-avatar-img"/>
              </div>
              {star6&&<span className="mw-badge">☆6</span>}
              <span className="mw-mem-name">{localizedCharacter(c, locale).displayName}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TierPage(){
  const { t } = useTranslation('common')
  return(
    <div className="mw-wrap">
      <div className="mw-inner">

        {/* Hero header */}
        <div className="mw-hero">
          <h1 className="mw-hero-title">{t('meta.title')}</h1>
          <div className="mw-hero-sub">{t('meta.subtitle')}</div>
          <div className="mw-hero-by">{t('meta.by')} <span>Doge</span></div>
          <div className="mw-hero-accent"/>
        </div>

        {/* SS — apex showcase (single, centered team) */}
        <section className="mw-ss">
          <div className="mw-ss-head">
            <svg className="mw-ss-watermark" width="180" height="180" viewBox="0 0 24 24" fill="#f5d77e" aria-hidden="true"><path d={SS_STAR}/><path d="M5 21h14"/></svg>
            <div className="mw-ss-badge">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#4a3408" stroke="#4a3408" strokeWidth="1" strokeLinejoin="round" aria-hidden="true"><path d={SS_STAR}/><path d="M5 21h14"/></svg>
            </div>
            <div className="mw-ss-titles">
              <div className="mw-ss-title">{t('meta.tier', { tier: 'SS' })}</div>
              <div className="mw-ss-sub">{t('meta.apex')}</div>
            </div>
            <div className="mw-ss-sheen"/>
          </div>
          <div className="mw-ss-body">
            <div className="mw-ss-teams">
              {TIER_TEAMS.filter(t=>t.tier==='SS').map((team,ti)=><TierTeamCard key={ti} team={team} def={TIER_DEFS.SS} ss/>)}
            </div>
            <div className="mw-ss-tagline">{t('meta.kings')}</div>
          </div>
        </section>

        {/* S / A / B / C */}
        {['S','A','B','C'].map(tier=>{
          const def=TIER_DEFS[tier]
          const teams=TIER_TEAMS.filter(t=>t.tier===tier)
          return(
            <section key={tier} className="mw-section">
              <div className="mw-tier-head">
                <div className="mw-tier-badge" style={{background:def.badge,color:def.badgeText}}>{tier}</div>
                <div className="mw-tier-label" style={{color:def.label}}>{t('meta.tier', { tier })}</div>
              </div>
              <div className="mw-teams">
                {teams.map((team,ti)=><TierTeamCard key={ti} team={team} def={def}/>)}
              </div>
            </section>
          )
        })}

        <p className="mw-source">{t('meta.source')}</p>
      </div>
    </div>
  )
}

// ── TEAM COST PAGE ────────────────────────────────────────────────────────────
export function TeamCostPage(){
  const { t } = useTranslation('common')
  const locale = useLocale()
  const[slots,setSlots]=useState([null,null,null,null])
  const[skillsDone,setSkillsDone]=useState([0,0,0,0])
  const[picker,setPicker]=useState(null)
  const[search,setSearch]=useState('')
  const closePicker=()=>{setPicker(null);setSearch('')}
  useModalDismiss(picker!==null,closePicker)

  const COST=RED_CRYSTAL_TOTAL_COST
  const SKILL_COSTS=RED_CRYSTAL_SKILL_COSTS
  const RCOL={R:'#3d9970',SR:'#3d6eb5',UR:'#c0392b'}

  const remainingCost=(rarity,done)=>SKILL_COSTS[rarity||'SR'].slice(done).reduce((s,v)=>s+v,0)

  const allChars=ALL.map(c=>{
    const rd=RARITY_DATA[c.name_en]
    return{...c,rarity:rd?.rarity||c.rarity||'SR'}
  }).filter(c=>RARITY_DATA[c.name_en]||c.image)

  const filtered=allChars.filter(c=>
    matchesCharacterName(c,search)
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
    <div className="team-cost-page">

      {/* Header */}
      <header className="tc-head">
        <h1>{t('teamCost.title')}</h1>
        <p>{t('teamCost.description')}</p>
      </header>

      {/* Crystal total */}
      <section className="tc-summary" aria-live="polite">
        <div className="tc-summary-main">
          <img src="/icons/Red_Crystal.webp" alt="" aria-hidden="true"/>
          <div>
          <span>{t('teamCost.needed')}</span>
            <strong>{formatLocaleNumber(total,locale)}</strong>
          </div>
        </div>
        <div className="tc-summary-meta">
          {urCount>0&&<span style={{'--rarity-color':RCOL.UR}}><b>{urCount}</b> UR</span>}
          {srCount>0&&<span style={{'--rarity-color':RCOL.SR}}><b>{srCount}</b> SR</span>}
          {rCount>0&&<span style={{'--rarity-color':RCOL.R}}><b>{rCount}</b> R</span>}
          {filled.length===0&&<span className="tc-summary-empty">{t('teamCost.chooseSlot')}</span>}
          {filled.length>0&&<button type="button" className="tc-clear-all" onClick={clearAll}>{t('teamCost.clearAll')}</button>}
        </div>
      </section>

      {/* 4 Slots */}
      <div className="tc-section-head">
        <h2>{t('teamCost.team')}</h2>
        <span>{t('teamCost.selected', { count: filled.length })}</span>
      </div>
      <section className="tc-slots" aria-label={t('teamCost.team')}>
        {slots.map((char,idx)=>{
          const rarity=char?RARITY_DATA[char.name_en]?.rarity||'SR':null
          const displayName=char?localizedCharacter(char, locale).displayName:''
          const fc=char?(CC[char.country]||'#888'):null
          const rc=rarity?RCOL[rarity]:'#888'
          const done=skillsDone[idx]
          const remaining=char?remainingCost(rarity,done):null
          const isMaxed=char&&remaining===0
          return char?(
            <div key={idx} className="tc-slot-card tc-slot-filled" style={{
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
                {char.icon?<img src={char.icon} className="tc-character-icon" loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'contain',objectPosition:'center'}} alt={displayName}/>
                :char.image?<img src={persosThumb(char.image)} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={displayName}/>
                :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',fontWeight:800,color:fc+'66'}}>{displayName[0]}</div>}
                <div style={{position:'absolute',top:'6px',left:'6px',padding:'1px 7px',borderRadius:'5px',background:rc,color:'white',fontSize:'.6rem',fontWeight:800}}>{rarity}</div>
                <button onClick={()=>clearSlot(idx)} style={{position:'absolute',top:'5px',right:'5px',width:20,height:20,borderRadius:'50%',border:'none',background:'rgba(0,0,0,0.55)',color:'white',cursor:'pointer',fontSize:'.6rem',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              </div>
              {/* Info */}
              <div style={{padding:'8px 10px',display:'flex',flexDirection:'column',gap:'7px',flex:1}}>
                <div>
                  <div style={{fontWeight:800,fontSize:'.82rem',color:'var(--txt)',lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{displayName}</div>
                  <div style={{fontSize:'.6rem',color:'var(--txt3)',marginTop:'1px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{localizedText(FACTIONS.find(f=>f.id===char.country)?.label||char.country, locale)}</div>
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
                    <span style={{fontSize:'.72rem',fontWeight:800,color:'#3d9970'}}>✓ {t('teamCost.maxed')}</span>
                  ):(
                    <div style={{display:'flex',alignItems:'center',gap:'3px'}}>
                      <img src="/icons/Red_Crystal.webp" alt={t('redCrystalAlt')} style={{width:14,height:14,objectFit:'contain'}}/>
                      <span style={{fontWeight:900,fontSize:'.88rem',color:rc}}>{remaining === null ? '' : formatLocaleNumber(remaining,locale)}</span>
                    </div>
                  )}
                  <button onClick={()=>{setPicker(idx);setSearch('')}} style={{padding:'3px 8px',borderRadius:'6px',border:`1px solid ${rc}44`,background:'transparent',color:rc,fontSize:'.62rem',cursor:'pointer',fontWeight:700}}>↺</button>
                </div>
              </div>
            </div>
          ):(
            <button key={idx} className="tc-slot-card tc-slot-empty" onClick={()=>{setPicker(idx);setSearch('')}} style={{
              borderRadius:'18px',border:'2px dashed var(--bdr)',
              background:'var(--sur)',minHeight:'120px',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'8px',
              cursor:'pointer',transition:'all .15s',color:'var(--txt3)',
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#6a30c8';e.currentTarget.style.background='#6a30c808'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bdr)';e.currentTarget.style.background='var(--sur)'}}>
              <div style={{fontSize:'2rem',opacity:.3}}>＋</div>
              <div style={{fontSize:'.8rem',fontWeight:700}}>{t('teamCost.slot', { number: idx + 1 })}</div>
              <div style={{fontSize:'.68rem',opacity:.6}}>{t('teamCost.clickAdd')}</div>
            </button>
          )
        })}
      </section>

      {/* Rarity reference */}
      <div className="tc-reference-head">
        <h2>{t('teamCost.skills')}</h2>
        <span>{t('teamCost.byRarity')}</span>
      </div>
      <div className="tc-cost-table-wrap">
        <table className="tc-cost-table" aria-label={`${t('teamCost.needed')} · ${t('teamCost.byRarity')}`}>
          <thead>
            <tr>
              <th>{t('teamCost.rarity')}</th>
              <th>{t('teamCost.skill', { number: 1 })}</th>
              <th>{t('teamCost.skill', { number: 2 })}</th>
              <th>{t('teamCost.skill', { number: 3 })}</th>
              <th>{t('teamCost.total')}</th>
            </tr>
          </thead>
          <tbody>
            {(['R','SR','UR']).map(r=>(
              <tr key={r} style={{'--rarity-color':RCOL[r]}}>
                <th scope="row">{r}</th>
                 {SKILL_COSTS[r].map((value,index)=><td key={index}>{formatLocaleNumber(value,locale)}</td>)}
                <td className="tc-cost-total">
                  <img src="/icons/Red_Crystal.webp" alt="" aria-hidden="true"/>
                  {formatLocaleNumber(COST[r],locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Picker modal */}
      {picker!==null&&(
        <div className="overlay" onClick={closePicker}>
          <div className="picker" role="dialog" aria-modal="true" aria-label={`${t('teamCost.selectGeneral')} · ${t('teamCost.slot', { number: picker + 1 })}`} onClick={e=>e.stopPropagation()} style={{maxWidth:'560px',maxHeight:'80vh'}}>
            <div className="picker-head">
              <span>{t('teamCost.selectGeneral')} — {t('teamCost.slot', { number: picker + 1 })}</span>
              <button className="x-btn" aria-label={t('close')} onClick={closePicker}>✕</button>
            </div>
            <div className="picker-filters">
              <input autoFocus className="picker-search" placeholder={t('teamCost.search')} value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="tc-picker-body" style={{overflowY:'auto',maxHeight:'55vh',padding:'8px'}}>
              <div className="tc-picker-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:'8px'}}>
                {filtered.map(c=>{
                  const rarity=RARITY_DATA[c.name_en]?.rarity||'SR'
                  const rc=RCOL[rarity]
                  const isSelected=slots.some(s=>s?.id===c.id)
                  const displayName=localizedCharacter(c, locale).displayName
                  return(
                    <button key={c.id} className="tc-picker-card" disabled={isSelected} onClick={()=>setSlot(picker,c)} style={{
                      borderRadius:'12px',border:`1.5px solid ${isSelected?'var(--bdr)':rc+'55'}`,
                      background:isSelected?'var(--bg2)':rc+'0a',
                      padding:'8px',display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',
                      cursor:isSelected?'not-allowed':'pointer',opacity:isSelected?.5:1,
                      transition:'all .12s',
                    }}
                      onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background=rc+'18'}}
                      onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background=rc+'0a'}}>
                      <div className="tc-picker-avatar" style={{width:52,height:52,borderRadius:'50%',overflow:'hidden',border:`2px solid ${rc}55`,background:rc+'18',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {c.icon?<img src={c.icon} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={displayName}/>
                        :c.image?<img src={persosThumb(c.image)} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} alt={displayName}/>
                        :<span style={{fontWeight:700,color:rc,fontSize:'1.1rem'}}>{displayName[0]}</span>}
                      </div>
                      <div style={{fontWeight:700,fontSize:'.68rem',color:'var(--txt)',textAlign:'center',lineHeight:1.2}}>{displayName}</div>
                      <div style={{padding:'1px 7px',borderRadius:'5px',background:rc,color:'white',fontSize:'.6rem',fontWeight:800}}>{rarity}</div>
                      <div style={{fontSize:'.62rem',color:rc,fontWeight:700}}><img src="/icons/Red_Crystal.webp" alt={t('redCrystalAlt')} style={{width:14,height:14,objectFit:"contain",verticalAlign:"middle",marginInlineEnd:2}}/>{formatLocaleNumber(COST[rarity],locale)}</div>
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
