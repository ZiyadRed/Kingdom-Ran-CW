import { ArtLightbox, ViewArtButton } from './art-preview.jsx'
import './buff-summary.css'
import { useMobileDetailFocus } from './use-mobile-detail-focus.js'
import { useArchiveUrlState } from './use-archive-url-state.js'
import { ARCHIVE_QUERY_LIMIT } from './archive-url-state.js'
import { secondaryName } from './display-names.js'
import { startTransition, useState, useEffect, useMemo, useDeferredValue, useRef, useId } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  useProgressTracker, progressFilterItems, ProgressTools, OwnedToggle, ALL, useReleaseData, ARCHIVE_CHAR_COUNT, persosThumb, RED_CRYSTAL_TOTAL_COST, RED_CRYSTAL_SKILL_COSTS, FACTIONS, MIXED_COUNTRY, metaTeamsByCountry, CC, CharIcon, TYPE_COLOR, TIER_TEAMS, simulate, calcCharBuffs, calcTeamEnemyDebuffs, Picker, characterInitialRarity, INVERSE_STATS, SPECIAL_STATS, statSortKey, DEFAULT_SK, hasStar6, hasRoleSkill, updateSkillMasks, applyMask, matchCharacterSearch, searchCharacters, BUFF_APPLICABILITY
} from './core.jsx'
import { characterSeo, routeSeo, setSeo } from './seo.js'
import { classifyConditionParts } from './skillConditions.js'
import { ArchiveImage, useArchiveGalleryVisible } from './archive-images.jsx'
import Dialog from './Dialog.jsx'
import NotFoundPage from './NotFoundPage.jsx'
import { useStoredDraft } from './use-stored-draft.js'
import { TEAM_COST_DRAFT_KEY, createTeamCostDraft, normalizeTeamCostDraft } from './team-cost-draft.js'
import { useLocale, formatNumber as formatLocaleNumber } from './i18n/index.js'
import { localizedTeamName } from './i18n/team-names.js'
import { localizedCharacterName } from './i18n/ar-character-names.js'
import { localizedCharacter, localizedDuration, localizedSkill, localizedTarget, localizedText } from './i18n/data.js'
import { builderShareUrl, characterShareUrl, createCharacterSkillsImage, createTeamSkillsImage, downloadBlob, formatCharacterSkillsShare, formatSceneCardShare, formatTeamBuffShare, sceneCardShareUrl, shareImageBlob, shareText } from './share.js'
import { BUILDER_SCHEMA_VERSION } from './builder-storage.js'

export function ArchiveTabs({active}){
  const location=useLocation()
  const[hydrated,setHydrated]=useState(false)
  useEffect(()=>{startTransition(()=>setHydrated(true))},[])
  const {PUBLIC_CW6_CARDS}=useReleaseData()
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
          <Link key={tab.id} to={tab.route+(hydrated&&on&&active==='characters'?location.search:'')} className={`archive-tab${on?' archive-tab-active':''}`} aria-current={on?'page':undefined}>
            {tab.label}
            <span>{tab.count}</span>
          </Link>
        )
      })}
    </nav>
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
  // Arabic and French resolve faction names through their own lexicon so a
  // filter chip and an effect sentence never spell a faction two ways.
  return localizedText(f.label,locale)
}

/**
 * The archive's faction rail is a five-column grid on phones, so its label has
 * room for two short lines. "Peuple des Montagnes" needs three and the third
 * was being clipped. TouranKo shortens the same filter chip to "Montagne", so
 * French does too here; every other surface keeps the full faction name.
 */
const FACTION_RAIL_SHORT={fr:{'Mountain Folk':'Montagne'}}
const factionRailLabel=(f,locale)=>FACTION_RAIL_SHORT[locale?.code]?.[f?.label]||factionDisplay(f,locale)

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

export function CW6SceneCardsPage(){
  const {PUBLIC_CW6_CARDS}=useReleaseData()
  const shareLabels=useShareLabels()
  const locale=useLocale()
  const{t}=useTranslation('common')
  const[selected,setSelected]=useState(null)
  const galleryVisible=useArchiveGalleryVisible(!!selected)
  const detailLayoutRef=useMobileDetailFocus(selected?.id)
  const[artSrc,setArtSrc]=useState(null)
  const[progressFilter,setProgressFilter]=useState('all')
  const tracker=useProgressTracker()
  const cards=PUBLIC_CW6_CARDS
  const visibleCards=cards.filter(card=>{
    const owned=tracker.isOwned('cw6Cards',card.id)
    return progressFilter==='all'||(progressFilter==='owned'?owned:!owned)
  })
  const ownedCount=tracker.countOwned('cw6Cards',cards.map(c=>c.id))
  const GalleryHeading=selected?'h2':'h1'
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
    <div ref={detailLayoutRef} className={'archive-layout cw6-scene-page' + (selected?' has-selection':'')}>
      <div className="gallery-wrap">
        <div className="gallery-header" style={{alignItems:'flex-start',gap:'12px',flexWrap:'wrap'}}>
          <div>
            <GalleryHeading className="gallery-title">{t('nav.sceneCards')}</GalleryHeading>
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
              className={`cw6-card${selected?.id===card.id?' is-selected':''}`}>
              <button
                type="button"
                className="cw6-card-detail"
                data-detail-id={card.id}
                aria-label={sceneCardAccessibleName(card)}
                aria-pressed={selected?.id===card.id}
                onClick={()=>pickCard(card)}
              />
              <div className="cw6-card-art">
                <ArchiveImage src={card.thumb||card.image} alt={sceneCardAccessibleName(card)} title={sceneCardAccessibleName(card)} enabled={galleryVisible} eager={!selected&&i<2} fade className="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain'}}/>
                {card.image&&<ViewArtButton onClick={()=>setArtSrc(card.image)} style={{left:7,right:'auto'}}/>}
                <OwnedToggle
                  owned={tracker.isOwned('cw6Cards',card.id)}
                  className="owned-toggle-overlay"
                  onToggle={()=>tracker.toggleOwned('cw6Cards',card.id)}
                />
              </div>
              <div className="cw6-card-body">
                <div>
                  <strong className="cw6-card-skill">{locale.code==='ja'?(card.skill_jp||card.skill_en):card.skill_en}</strong>
                  <span className="cw6-card-jp">{card.skill_jp}</span>
                </div>
                {card.ownerName&&(
                  <div className="cw6-card-owner">
                    {card.ownerIcon&&<ArchiveImage className="cw6-card-owner-ico" src={card.ownerIcon} alt="" enabled={galleryVisible}/>}
                    <span className="cw6-card-owner-name">{localizedCharacterName(locale.code==='ja'?(card.ownerNameJp||card.ownerName):card.ownerName, locale)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected&&(
        <article className="detail-panel">
          <div className="detail-header">
            <FadeImg src={selected.image} alt={sceneCardAccessibleName(selected)} className="detail-portrait" loading="eager" decoding="async" style={{objectFit:'contain',background:'rgba(255,255,255,.08)',objectPosition:'center'}}/>
            <div className="detail-info">
              <h1 tabIndex={-1} className="detail-name">{locale.code==='ja'?(selected.skill_jp||selected.skill_en):selected.skill_en}</h1>
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
        </article>
      )}
    </div>
    <ArtLightbox src={artSrc} alt={t('archive.cardArt')} onClose={()=>setArtSrc(null)}/>
    </>
  )
}

const ARCHIVE_FACTION_IDS=FACTIONS.map(faction=>faction.id)

export function ArchivePage(){
  const {ALL,ARCHIVE_BROWSE_CHARACTERS,findCharById}=useReleaseData()
  const shareLabels=useShareLabels()
  const{charId}=useParams()
  const navigate=useNavigate()
  const location=useLocation()
  const locale=useLocale()
  const{t}=useTranslation('common')
  const selected=useMemo(()=>findCharById(charId),[charId,findCharById])
  const detailLayoutRef=useMobileDetailFocus(selected?.id)
  const{faction:activeFac,query:search,setQuery:setSearch,setFaction:handleFacClick,returnSearch}=useArchiveUrlState(ARCHIVE_FACTION_IDS,selected)
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
  const clearSelection=()=>navigate('/archive/characters'+returnSearch)
  // Defer + memoize the full-roster search scan so typing
  // stays responsive on slower phones.
  const deferredSearch=useDeferredValue(search)
  const deferredQuery=deferredSearch.trim()
  const hasSearch=Boolean(search.trim())
  const filtered=useMemo(()=>{
    const source=deferredQuery?ALL:ARCHIVE_BROWSE_CHARACTERS
    const alphabetical=source.slice().sort((a,b)=>a.name_en.localeCompare(b.name_en))
    return deferredQuery?searchCharacters(alphabetical,deferredQuery,locale):alphabetical.filter(c=>c.country===activeFac)
  },[deferredQuery,activeFac,locale,ALL,ARCHIVE_BROWSE_CHARACTERS])
  const localizedSelected=useMemo(()=>selected?localizedCharacter(selected,locale):null,[selected,locale])
  const localizedFiltered=useMemo(()=>filtered.map(character=>localizedCharacter(character,locale)),[filtered,locale])
  const galleryVisible=useArchiveGalleryVisible(!!selected)

  const GalleryHeading=selected?'h2':'h1'
  if(charId&&!selected) return <NotFoundPage/>
  return(
    <div ref={detailLayoutRef} className={`archive-layout${selected?' has-selection':''}`}>
      {/* Sidebar */}
      <aside className="fac-sidebar">
        <div className="fac-search-wrap">
          <input className="fac-search" type="search" maxLength={ARCHIVE_QUERY_LIMIT} aria-label={t('archive.searchGenerals')} placeholder={`${t('archive.searchGenerals')}…`} value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<button className="search-clear" type="button" onClick={()=>setSearch('')}>{t('clear')}</button>}
        </div>
        <div className="fac-nav">
          {FACTIONS.map(f=>{
            const n=ARCHIVE_BROWSE_CHARACTERS.filter(c=>c.country===f.id).length
            if(!n) return null
            return(
              <button key={f.id} className={`fac-item${activeFac===f.id&&!hasSearch?' fac-active':''}`}
                style={activeFac===f.id&&!hasSearch?{'--fc':f.color}:{}} onClick={()=>handleFacClick(f.id)}>
                <span className="fac-stripe" style={{background:f.color}}/>
                <span className="fac-name">{factionRailLabel(f,locale)}</span>
                {secondaryName(factionRailLabel(f,locale),f.jp)&&<span className="fac-jp">{f.jp}</span>}
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
            maxLength={ARCHIVE_QUERY_LIMIT}
            aria-label={t('archive.searchGenerals')}
            placeholder={`${t('archive.searchGenerals')}…`}
            value={search}
            onChange={e=>setSearch(e.target.value)}/>
          {search&&<button className="mobile-search-clear" type="button" aria-label={t('clear')} onClick={()=>setSearch('')}>✕</button>}
        </div>
        <div className="gallery-header">
          <GalleryHeading className="gallery-title">{hasSearch?t('resultCount',{count:filtered.length}):t('archive.roster',{faction:factionDisplay(FACTIONS.find(f=>f.id===activeFac),locale)})}</GalleryHeading>
          <span className="gallery-count">{t('generalCount',{count:filtered.length})}</span>
        </div>
        <div className="gallery-grid">
          {!filtered.length&&<p className="search-empty" role="status">{t('stats.noCharacterMatches',{query:search})}</p>}
          {localizedFiltered.map((c,index)=>{
            const skillTag=deferredQuery?matchCharacterSearch(c,deferredQuery,locale)?.hint:null
            return(
            <Link key={c.id}
              data-detail-id={c.id}
              to={`/archive/characters/${c.id}${returnSearch}`}
              className={`banner-card${selected?.id===c.id?' banner-selected':''}`}
              onClick={e=>{if(selected?.id===c.id){e.preventDefault();clearSelection()}}}
              style={selected?.id===c.id?{outline:`3px solid ${CC[c.country]||'#999'}`}:{}}>
              <div className="banner-faction-tag" style={{background:CC[c.country]||'#666'}}>
                {FACTIONS.find(f=>f.id===c.country)?.jp||c.country}
              </div>
              {c.image?<ArchiveImage
                src={persosThumb(c.image)}
                srcSet={`${persosThumb(c.image)} 320w, ${c.image} 626w`}
                sizes="(max-width: 480px) 23vw, (max-width: 768px) 31vw, 180px"
                alt={c.displayName} enabled={galleryVisible} eager={!selected&&index<3}/>
                :<div className="banner-ph" style={{'--faction-color':CC[c.country]||'var(--navy)'}}>
                  <ArchiveImage src={c.icon} alt={c.displayName} className="banner-img banner-icon" enabled={galleryVisible} eager={!selected&&index<3}/>
                </div>}
              <div className="banner-footer">
                <span className="banner-name">{c.displayName}</span>
                {skillTag&&<span className="banner-skill-tag" title={skillTag}>{skillTag.length>22?skillTag.slice(0,21)+'…':skillTag}</span>}
              </div>
            </Link>
            )
          })}
        </div>
      </div>

      {/* Skills panel — desktop: right column, mobile: complete detail page */}
      {selected&&(
        <article className="detail-panel">
          <nav className="seo-breadcrumbs" aria-label={t('breadcrumbs')}>
            <Link to="/">{t('nav.home')}</Link>
            <span aria-hidden="true">›</span>
            <Link to="/archive">{t('nav.archive')}</Link>
            <span aria-hidden="true">›</span>
            <Link to={'/archive/characters'+returnSearch}>{t('nav.characters')}</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{localizedSelected?.displayName||selected.name_en}</span>
          </nav>
          <div className="detail-header">
            <CharIcon c={selected} size={64} round={false} className="detail-portrait" eager/>
            <div className="detail-info">
              <h1 tabIndex={-1} className="detail-name">{localizedSelected?.displayName||selected.name_en}</h1>
              {secondaryName(localizedSelected?.displayName||selected.name_en,localizedSelected?.displaySecondaryName||selected.name_jp)&&(
                <div className="detail-jp">{localizedSelected?.displaySecondaryName||selected.name_jp}</div>
              )}
              <div className="detail-faction" style={{color:'var(--salmon)'}}>
                {factionDisplay(FACTIONS.find(f=>f.id===selected.country),locale)}
              </div>
              {characterSkillsWithRole(selected).some(skill=>skill.star6)&&(
                <Link className="detail-related-link" to="/archive/cw6-scene-cards">{t('nav.sceneCards')}</Link>
              )}
            </div>
            <div className="detail-actions">
              <ShareButton
                title={`${locale.code==='ar'?`${t('archive.skills')} ${localizedSelected?.displayName||selected.name_en}`:locale.code==='fr'?`${t('archive.skills')} — ${localizedSelected?.displayName||selected.name_en}`:`${localizedSelected?.displayName||selected.name_en} ${t('archive.skills')}`} - RanHQ`}
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
    </div>
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
        </div>
        <div className="sk-tags">
          {skill.star6&&<span className="tag t-star">☆6</span>}
          <span className="tag sk-type" style={{background:col+'22',border:`1px solid ${col}55`}}>{localizedText(skill.type,locale)}</span>
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
  const shareUrl=url||characterShareUrl(character,locale.code)
  const imageName=character.displayName||localizedCharacterName(locale.code==='ja'?(character.name_jp||character.name_en):character.name_en,locale)
  const imageTitle=label==='skills'
    ?(locale.code==='ar'?`${t('archive.skills')} ${imageName}`:locale.code==='fr'?`${t('archive.skills')} — ${imageName}`:`${imageName} ${t('archive.skills')}`)
    :(locale.code==='ar'?`${label} ${imageName}`:locale.code==='fr'?`${label} — ${imageName}`:`${imageName} ${label}`)
  useEffect(()=>()=>{if(preview?.url) URL.revokeObjectURL(preview.url)},[preview?.url])
  const clearPreview=()=>{
    setStatus('idle')
    setPreview(prev=>{
      if(prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
  }
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
        <Dialog className="share-preview-backdrop" aria-label={`${imageTitle} ${t('imagePreview')}`} onClose={clearPreview} initialFocus={()=>closeRef.current} returnFocus={()=>triggerRef.current}>
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
        </Dialog>
      )}
    </>
  )
}

export function TeamImageButton({team,side='team',builderState}){
  const shareLabels=useShareLabels()
  const locale=useLocale()
  const{t}=useTranslation('common')
  const[status,setStatus]=useState('idle')
  const[preview,setPreview]=useState(null)
  const triggerRef=useRef(null)
  const closeRef=useRef(null)
  const sideName=side==='attack'?t('builder.attacking'):side==='defense'?t('builder.defending'):t('builder.formationSide')
  // Word order differs per language: English appends the noun, Arabic needs a
  // genitive construct (مهارات الهجوم, never الهجوم المهارات). Interpolating a
  // per-locale template keeps the image title grammatical everywhere.
  const title=t('shareOutput.sideSkills',{side:sideName})
  useEffect(()=>()=>{if(preview?.url) URL.revokeObjectURL(preview.url)},[preview?.url])
  const clearPreview=()=>{
    setStatus('idle')
    setPreview(prev=>{
      if(prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
  }
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
        url:builderShareUrl(locale.code,builderState),
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
        <Dialog className="share-preview-backdrop" aria-label={`${title} ${t('imagePreview')}`} onClose={clearPreview} initialFocus={()=>closeRef.current} returnFocus={()=>triggerRef.current}>
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
        </Dialog>
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
  return localizedText(faction.label, locale)
}


export const CONDITION_CHIP_LABELS={
  ja:{Requires:'条件',Route:'経路',Mode:'モード',When:'発動時',Scales:'累積',After:'発生後',Source:'出典',Vs:'対',Target:'対象',State:'状態',Scope:'範囲'},
  ar:{Requires:'الشرط',Route:'المسار',Mode:'الوضع',When:'عند',Scales:'يتدرج',After:'بعد',Source:'المصدر',Vs:'ضد',Target:'الهدف',State:'الحالة',Scope:'النطاق'},
  fr:{Requires:'Condition',Route:'Route',Mode:'Mode',When:'Quand',Scales:'Progressif',After:'Après',Source:'Source',Vs:'Contre',Target:'Cible',State:'État',Scope:'Portée'},
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
    summaryConditions:t('buffs.summaryConditions'),
    potential:t('buffs.potential'),
    conditionalOmitted:t('buffs.conditionalOmitted'),
    unsupportedOmitted:t('buffs.unsupportedOmitted'),
    noRelevantBuffs:t('noRelevantBuffs'),
    unknown:t('unknown'),
    truncated:t('shareOutput.truncated'),
    fullDetails:t('shareOutput.fullDetails'),
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
  const {findCharByName}=useReleaseData()
  const locale=useLocale()
  const{t}=useTranslation('common')
  const chars=team.members.map(findCharByName).filter(Boolean)
  const accent=team.color||CC[chars[0]?.country]||'var(--terra)'
  return(
    <div className="meta-card" style={{borderTopColor:accent}}>
      <div className="meta-card-head">
        <span className="meta-name">{localizedTeamName(team.name,locale.code)}</span>
      </div>
      <div className="meta-members" dir="ltr">
        {chars.map((c,i)=>(
          <div key={i} className="meta-member" dir={locale.direction}>
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
export function BuilderPage({atk:atkIds,def:defIds,atkSk,defSk,setAtkSk,setDefSk,setSlot,rm,goSim,loadMetaTeam,sharedIncludeCombat=false,shareStatus='absent'}){
  const {findCharById,findCharByName}=useReleaseData()
  const{t}=useTranslation('common')
  const locale=useLocale()
  const[picker,setPicker]=useState(null)
  const[activeSide,setActiveSide]=useState('attack')
  const[buffsOpen,setBuffsOpen]=useState(true)
  const atk=atkIds.map(findCharById)
  const def=defIds.map(findCharById)
  const atkF=atk.filter(Boolean),defF=def.filter(Boolean)
  const atkM=atk.map((c,i)=>applyMask(c,atkSk[i])).filter(Boolean)
  const defM=def.map((c,i)=>applyMask(c,defSk[i])).filter(Boolean)
  const builderShareState=useMemo(()=>({
    version:BUILDER_SCHEMA_VERSION,
    attack:atkIds,
    defense:defIds,
    attackSkills:atkSk,
    defenseSkills:defSk,
  }),[atkIds,defIds,atkSk,defSk])
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
    sync(media)
    media.addEventListener('change',sync)
    return()=>media.removeEventListener('change',sync)
  },[])
  return(
    <div className="main-page builder-page">
      {picker&&<Picker onSelect={c=>setSlot(c,picker.side,picker.idx)} onClose={()=>setPicker(null)} excl={excl} returnFocus={()=>document.querySelector(`[data-builder-slot="${picker.side}-${picker.idx}"] button, button[data-builder-slot="${picker.side}-${picker.idx}"]`)}/>}
      <h1 className="pg-title">{t('builder.title')}</h1>
      <p className="pg-sub">{t('builder.subtitle')}</p>
      {shareStatus==='invalid'&&<p className="builder-share-error" role="alert">{t('builder.sharedPlanInvalid')}</p>}
      <div className="builder-side-switch" role="group" aria-label={t('builder.formationSide')}>
        <button type="button" className={activeSide==='attack'?'active':''} aria-pressed={activeSide==='attack'} onClick={()=>setActiveSide('attack')}>{t('builder.attacking')} <span>{atkF.length}/4</span></button>
        <button type="button" className={activeSide==='defense'?'active':''} aria-pressed={activeSide==='defense'} onClick={()=>setActiveSide('defense')}>{t('builder.defending')} <span>{defF.length}/4</span></button>
      </div>
      <div className={`two-sides builder-two-sides builder-show-${activeSide}`}>
        <SideSlots side="attack"  label={t('builder.attacking')} party={atk} skMask={atkSk}
                   onSlot={i=>setPicker({side:'attack',idx:i})}  onRm={c=>rm(c,'attack')}
                   onSkChange={(i,mk)=>updateSk('attack',i,mk)} builderState={builderShareState}/>
        <div className="vs-sep">{t('versus')}</div>
        <SideSlots side="defense" label={t('builder.defending')} party={def} skMask={defSk}
                   onSlot={i=>setPicker({side:'defense',idx:i})} onRm={c=>rm(c,'defense')}
                   onSkChange={(i,mk)=>updateSk('defense',i,mk)} builderState={builderShareState}/>
      </div>
      {(atkF.length&&defF.length)>0&&<div className="cta-row"><button className="cta-btn" onClick={goSim}>{t('builder.viewBattleOrder')}</button></div>}
      {(atkM.length||defM.length)>0&&(
        <section className="builder-buff-disclosure">
          <button type="button" className="builder-buff-toggle" aria-expanded={buffsOpen} onClick={()=>setBuffsOpen(open=>!open)}>
            <span><strong>{t('builder.teamBuffs')}</strong><small>{t('builder.calculated')}</small></span>
            <span>{buffsOpen?t('builder.hide'):t('builder.review')}</span>
          </button>
          {buffsOpen&&<BuffTable atk={atkM} def={defM} builderState={builderShareState} initialIncludeCombat={sharedIncludeCombat}/>}
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

export function SideSlots({side,label,party,skMask,onSlot,onRm,onSkChange,builderState}){
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
        <TeamImageButton team={maskedTeam} side={side} builderState={builderState}/>
      </div>
      {Array.from({length:4}).map((_,i)=>{
        const m=party[i]
        const display=m?localizedCharacter(m,locale):null
        return m?(
          <div key={i} data-builder-slot={`${side}-${i}`} data-builder-character={m.id} className="slot-filled" style={{borderLeftColor:CC[m.country]||'#999'}}>
            <span className="sn" style={{color:ac}}>{i+1}</span>
            <CharIcon c={m} size={36} round={true}/>
            <div className="slot-info"><span className="slot-en">{display.displayName}</span>{secondaryName(display.displayName,display.displaySecondaryName)&&<span className="slot-jp">{display.displaySecondaryName}</span>}</div>
            <SkillToggles char={m} mask={skMask?.[i]||DEFAULT_SK} onChange={nm=>onSkChange(i,nm)}/>
            <button className="slot-rm" onClick={()=>onRm(m)} aria-label={t('remove')}>✕</button>
          </div>
        ):(
          <button key={i} data-builder-slot={`${side}-${i}`} className="slot-empty" style={{borderColor:ac+'44'}} onClick={()=>onSlot(i)}>
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
  const localizedRoleSkill=roleExists?localizedSkill(char.roleSkill,char.id,-1,locale):null
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
          aria-label={`${localizedText(char.roleSkill.type,locale)} ${t('shareOutput.skill')} ${localizedRoleSkill.displayName} ${roleOn?t('enabled'):t('disabled')}`}
          aria-pressed={roleOn}
          title={`${localizedText(char.roleSkill.type,locale)}: ${localizedRoleSkill.displayName}`}
        >
          <img className="skill-toggle-art" src={ROLE_SKILL_ICON[char.roleSkill.type]} alt="" aria-hidden="true" draggable="false" decoding="async"/>
        </button>
      )}
    </div>
  )
}

// ── ACTIVATION ORDER ──────────────────────────────────────────────────────────
export function SimPage({atk:atkIds,def:defIds,atkSk,defSk,goBuilder}){
  const {findCharById}=useReleaseData()
  const locale=useLocale()
  const{t}=useTranslation('common')
  const atk=atkIds.map(findCharById)
  const def=defIds.map(findCharById)
  const atkF=atk.map((c,i)=>applyMask(c,atkSk?.[i])).filter(Boolean).map(c=>localizedCharacter(c,locale))
  const defF=def.map((c,i)=>applyMask(c,defSk?.[i])).filter(Boolean).map(c=>localizedCharacter(c,locale))
  if(!atkF.length||!defF.length) return(
    <div className="main-page sim-empty">
      <section className="sim-empty-card" aria-labelledby="sim-empty-title">
        <h1 id="sim-empty-title">{t('sim.title')}</h1>
        <p className="sim-empty-description">{t('sim.emptyDescription')}</p>
        <p className="sim-empty-reason">{t('sim.emptyReason')}</p>
        <button className="cta-btn" onClick={goBuilder}>{t('sim.goBuilder')}</button>
      </section>
    </div>
  )
  const{st,turns}=simulate(atkF,defF)
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
      <div className="sim-sec">
        <div className="sec-hd sec-combat">{t('sim.activation')}</div>
        <div className="turn-guidance">
          <strong>{t('sim.openingRule')}</strong>
          <span>{t('sim.roleConditional')}</span>
          <span>{t('sim.timelineLimit')}</span>
        </div>
        {turns.map(({turn,entries})=>(
          <div key={turn} className="turn">
            <div className="turn-lbl">{t('sim.turn',{turn})}</div>
            <div className="turn-entries">
              {entries.map(({kind,general,skill,side,role},i)=>(
                <div key={`${kind}-${side}-${general.id}-${role||i}`} className={`te te-${side}${kind==='role'?' te-role':''}`} data-event-kind={kind} data-role={role||undefined} data-order={i+1}>
                  <div className="te-stripe" style={{background:side==='attack'?'var(--red)':'var(--blue)'}}/>
                  <span className="te-order" aria-hidden="true">{formatLocaleNumber(i+1,locale)}</span>
                  <div className="te-body">
                    <div className="te-gen">
                      <CharIcon c={general} size={38} round={true}/>
                      <div><b className="te-name">{general.displayName||general.name_en}</b>{secondaryName(general.displayName||general.name_en,general.name_jp)&&<span className="te-jp">{general.name_jp}</span>}</div>
                      <span className="te-tag" style={{background:side==='attack'?'rgba(192,57,43,.18)':'rgba(26,95,168,.18)',color:side==='attack'?'#c0392b':'#1a5fa8',border:`1px solid ${side==='attack'?'rgba(192,57,43,.3)':'rgba(26,95,168,.3)'}`}}>{t(side==='attack'?'sim.attackingSide':'sim.defendingSide')}</span>
                    </div>
                    {kind==='role'&&<div className="te-role-priority">{t('sim.specialRoleAction')}</div>}
                    {skill?<SkillCard skill={skill}/>:<div className="normal-atk">{locale.code==='ja'?'通常攻撃':locale.code==='ar'?'هجوم عادي':locale.code==='fr'?'Attaque normale':'Normal Attack'}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="sim-sec">
        <div className="sec-hd sec-strat">{t('sim.strategySkills')}</div>
        <div className="strat-cols">
          <StratCol label={t('builder.attacking')} entries={st.attack} side="attack"/>
          <StratCol label={t('builder.defending')} entries={st.defense} side="defense"/>
        </div>
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
      {!entries.length?<p className="scol-none">{locale.code==='ja'?'なし':locale.code==='ar'?'لا يوجد':locale.code==='fr'?'Aucun':'None'}</p>:entries.map(({general:g,skills:gs})=>(
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
export function BuffTable({atk,def,builderState,initialIncludeCombat=false}){
  const shareLabels=useShareLabels()
  const locale=useLocale()
  const{t}=useTranslation('common')
  const[includeCombat,setIncludeCombat]=useState(Boolean(initialIncludeCombat))
  if(!atk.length&&!def.length) return null
  // Formation totals use the actual side; unresolved battle conditions remain
  // potential contributions, disclosed below and beside their source effects.
  const atkBuffs=atk.map(g=>({general:g,buffs:calcCharBuffs(g,atk,def,false,false,includeCombat)}))
  const defBuffs=def.map(g=>({general:g,buffs:calcCharBuffs(g,def,atk,true,false,includeCombat)}))
  const atkEnemyDebuffs=calcTeamEnemyDebuffs(atk,def,includeCombat,false)
  const defEnemyDebuffs=calcTeamEnemyDebuffs(def,atk,includeCombat,true)
  const hasAny=arr=>arr.some(({buffs})=>Object.keys(buffs).length>0||buffs.meta?.conditionalUnquantified.length||buffs.meta?.unsupported.length)
  const hasEnemyOutput=debuffs=>Object.keys(debuffs).length>0||debuffs.meta?.conditionalUnquantified.length||debuffs.meta?.unsupported.length
  if(!hasAny(atkBuffs)&&!hasAny(defBuffs)&&!hasEnemyOutput(atkEnemyDebuffs)&&!hasEnemyOutput(defEnemyDebuffs)) return null
  return(
    <div className="sim-sec buff-summary">
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
               url:builderShareUrl(locale.code,builderState,{includeCombat}),
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
      <p className="buff-summary-note">{t('buffs.summaryConditions')}</p>
      <div className="strat-cols">
        <BuffSideTable label={`⚔ ${t('buffs.attackingFormation')}`} entries={atkBuffs} side="attack" enemyDebuffs={atkEnemyDebuffs}/>
        <BuffSideTable label={`🛡 ${t('buffs.defendingFormation')}`} entries={defBuffs} side="defense" enemyDebuffs={defEnemyDebuffs}/>
      </div>
    </div>
  )
}
export function BuffSourceEvidence({source}){
  const {findCharById}=useReleaseData()
  const locale=useLocale()
  const{t}=useTranslation('common')
  if(!source.skill||!source.effect) return null
  const skillIndex=findCharById(source.owner.id)?.skills.indexOf(source.skill)
  const skill=localizedSkill(source.skill,source.owner.id,skillIndex,locale)
  const effect=skill.displayEffects[source.skill.effects.indexOf(source.effect)]
  return <div className="buff-source-evidence">
    <span className="buff-source-skill">{skill.displayName}{source.applicability===BUFF_APPLICABILITY.CONDITIONAL&&<span className="buff-source-state"> · {t('buffs.potential')}</span>}{source.applicability===BUFF_APPLICABILITY.UNSUPPORTED&&<span className="buff-source-state"> · {t('buffs.unsupported')}</span>}</span>
    {effect?.condition&&<span className="buff-source-condition">{effect.condition}</span>}
    <span>{effect?.target} → {effect?.effect}{effect?.duration?` · ${effect.duration}`:''}</span>
  </div>
}
function uniqueBuffMetaSources(entries,enemyDebuffs,key){
  const all=[
    ...entries.flatMap(({buffs})=>buffs.meta?.[key]||[]),
    ...(enemyDebuffs.meta?.[key]||[]),
  ]
  const seen=new Set()
  return all.filter(source=>{
    const id=[source.owner?.id,source.skill?.name_en,source.effect?.condition,source.effect?.target,source.effect?.effect,source.stat].join('|')
    if(seen.has(id)) return false
    seen.add(id)
    return true
  })
}
export function BuffApplicabilityNotices({entries,enemyDebuffs}){
  const{t}=useTranslation('common')
  const locale=useLocale()
  const conditional=uniqueBuffMetaSources(entries,enemyDebuffs,'conditionalUnquantified')
  const unsupported=uniqueBuffMetaSources(entries,enemyDebuffs,'unsupported')
  if(!conditional.length&&!unsupported.length) return null
  const notice=(kind,sources,label)=><details className={`buff-applicability-notice ${kind}`}>
    <summary>{label}</summary>
    <div className="buff-sources">
      {sources.map((source,index)=><div key={`${source.owner?.id}|${source.skill?.name_en}|${source.stat}|${index}`} className="buff-source-contribution">
        <div className="buff-source-row">
          <CharIcon c={source.owner} size={16} round={true}/>
          <span className="buff-source-name">{localizedCharacter(source.owner,locale).displayName}</span>
          {source.stat&&<span className="buff-source-state">{localizedText(source.stat,locale)}</span>}
        </div>
        <BuffSourceEvidence source={source}/>
      </div>)}
    </div>
  </details>
  return <div className="buff-applicability-notices">
    {conditional.length>0&&notice('conditional',conditional,t('buffs.conditionalOmittedCount',{count:conditional.length}))}
    {unsupported.length>0&&notice('unsupported',unsupported,t('buffs.unsupportedOmittedCount',{count:unsupported.length}))}
  </div>
}
export function BuffSideTable({label,entries,side,enemyDebuffs={}}){
  const disclosureId=useId()
  const{t}=useTranslation('common')
  const locale=useLocale()
  const[expanded,setExpanded]=useState(null)
  const ac=side==='attack'?'var(--red)':'var(--blue)'
  const hasNotices=entries.some(({buffs})=>buffs.meta?.conditionalUnquantified.length||buffs.meta?.unsupported.length)||enemyDebuffs.meta?.conditionalUnquantified.length||enemyDebuffs.meta?.unsupported.length
  const hasAny=entries.some(({buffs})=>Object.keys(buffs).length>0)
  const hasEnemyDebuffs=Object.keys(enemyDebuffs).length>0
  const fmt=v=>Number.isInteger(v)?v:v.toFixed(1)
  return(
    <div className={`scol ${side==='attack'?'atk':'def'}`}>
      <div className="scol-lbl" style={{color:ac,borderBottomColor:ac+'44'}}>{label}</div>
       {!hasAny&&!hasEnemyDebuffs?<p className="scol-none">{t('noRelevantBuffs')}</p>:entries.map(({general:g,buffs})=>{
        const stats=Object.entries(buffs).filter(([,v])=>v.up>0||v.down>0||v.potentialUp>0||v.potentialDown>0).sort(([a],[b])=>statSortKey(a)-statSortKey(b))
        return(
          <div key={g.id} className="scol-gen" data-buff-general={g.id}>
            <div className="scol-gen-hdr" style={{color:ac}}>
              <CharIcon c={g} size={26} round={true}/>
              <b>{localizedCharacter(g,locale).displayName}</b>
              {g.unit_type&&<span className="scol-unit-badge" style={{background:ac+'22',color:ac,border:`1px solid ${ac}44`}}>{localizedText(g.unit_type,locale)}</span>}
            </div>
            {!stats.length?<div className="buff-none-row">—</div>:(
              <div className="buff-stats">
                {stats.map(([stat,buff])=>{
                  const{up,down,potentialUp=0,potentialDown=0,sources=[],potentialSources=[],instances,potentialInstances}=buff
                  const inv=INVERSE_STATS.has(stat)
                  const isFlag=SPECIAL_STATS.has(stat)
                  // Guard doesn't stack — show one row for the active (highest) instance,
                  // with the alternatives revealed on expand.
                  if(stat==='Guard'&&(instances?.length||potentialInstances?.length)){
                    const sorted=[...(instances||[])].sort((a,b)=>b.val-a.val)
                    const potentialSorted=[...(potentialInstances||[])].sort((a,b)=>b.val-a.val)
                    const top=sorted[0]
                    const potentialTop=potentialSorted[0]
                    const extra=sorted.length+potentialSorted.length-1
                    const key=`${g.id}|Guard`
                    const isOpen=expanded===key
                    return(
                      <div key={stat} data-buff-stat={stat}>
                        <button type="button" aria-expanded={isOpen} aria-controls={`${disclosureId}-${encodeURIComponent(key)}`} className={`buff-row buff-row-click${isOpen?' buff-row-open':''}`}
                             onClick={()=>setExpanded(isOpen?null:key)}>
                          <span className="buff-stat-name">{localizedText('Guard',locale)}</span>
                          <span className="buff-vals">
                            {top&&<span className="buff-up">+{fmt(top.val)}%</span>}
                            {top?.duration&&<span className="buff-dur">{localizedDuration(top.duration,locale)}</span>}
                            {potentialTop&&<span className="buff-potential">{t('buffs.potential')} +{fmt(potentialTop.val)}%</span>}
                            {extra>0&&<span className="buff-more">+{extra}</span>}
                            <span className="buff-chevron" aria-hidden="true">{isOpen?'▴':'▾'}</span>
                          </span>
                        </button>
                        {(
                          <div id={`${disclosureId}-${encodeURIComponent(key)}`} hidden={!isOpen} className="buff-sources">
                            {[...sorted,...potentialSorted].map((inst,idx)=>(
                              <div key={idx} className="buff-source-contribution">
                              <div className="buff-source-row">
                                <CharIcon c={inst.owner} size={16} round={true}/>
                                <span className="buff-source-name">{localizedCharacter(inst.owner,locale).displayName}</span>
                                <span className={inst.applicability===BUFF_APPLICABILITY.CONDITIONAL?'buff-potential':'buff-up'}>{inst.applicability===BUFF_APPLICABILITY.CONDITIONAL?`${t('buffs.potential')} `:''}+{fmt(inst.val)}%{inst.duration?` · ${localizedDuration(inst.duration,locale)}`:''}</span>
                              </div>
                              <BuffSourceEvidence source={inst}/>
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
                    <div key={stat} data-buff-stat={stat}>
                      <button type="button" aria-expanded={isOpen} aria-controls={`${disclosureId}-${encodeURIComponent(key)}`} className={`buff-row buff-row-click${isOpen?' buff-row-open':''}`}
                           onClick={()=>setExpanded(isOpen?null:key)}>
                        <span className="buff-stat-name">{localizedText(stat,locale)}</span>
                        <span className="buff-vals">
                          {isFlag
                            ?<><span className="buff-up" style={{fontSize:'.75rem',letterSpacing:'.02em'}}>● {up}×</span>{potentialUp>0&&<span className="buff-potential">{t('buffs.potential')} {potentialUp}×</span>}</>
                            :<>{up>0&&<span className={inv?'buff-down':'buff-up'}>+{fmt(up)}%</span>}
                               {down>0&&<span className={inv?'buff-up':'buff-down'}>−{fmt(down)}%</span>}
                               {potentialUp>0&&<span className="buff-potential">{t('buffs.potential')} +{fmt(potentialUp)}%</span>}
                               {potentialDown>0&&<span className="buff-potential">{t('buffs.potential')} −{fmt(potentialDown)}%</span>}</>
                          }
                          <span className="buff-chevron" aria-hidden="true">{isOpen?'▴':'▾'}</span>
                        </span>
                      </button>
                      {(
                        <div id={`${disclosureId}-${encodeURIComponent(key)}`} hidden={!isOpen} className="buff-sources">
                          {[...sources,...potentialSources].map((s,i)=>(
                            <div key={i} className="buff-source-contribution">
                            <div className="buff-source-row">
                              <CharIcon c={s.owner} size={16} round={true}/>
                              <span className="buff-source-name">{localizedCharacter(s.owner,locale).displayName}</span>
                              <span className={s.applicability===BUFF_APPLICABILITY.CONDITIONAL?'buff-potential':s.dir==='up'?(inv?'buff-down':'buff-up'):(inv?'buff-up':'buff-down')}>
                                {s.applicability===BUFF_APPLICABILITY.CONDITIONAL?`${t('buffs.potential')} `:''}{isFlag?`${s.contribution}×`:`${s.dir==='up'?'+':'−'}${fmt(s.contribution)}%`}
                              </span>
                            </div>
                            <BuffSourceEvidence source={s}/>
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
      {hasEnemyDebuffs&&Object.entries(enemyDebuffs).map(([target,{up,down,potentialUp={},potentialDown={},sources={},potentialSources={}}])=>{
        const allStats=[
          ...[...new Set([...Object.keys(down),...Object.keys(potentialDown)])].map(s=>({s,v:down[s]||0,pv:potentialDown[s]||0,d:'down'})),
          ...[...new Set([...Object.keys(up),...Object.keys(potentialUp)])].map(s=>({s,v:up[s]||0,pv:potentialUp[s]||0,d:'up'})),
        ].filter(x=>x.v>0||x.pv>0)
        if(!allStats.length) return null
        return(
          <div key={target} className="scol-gen" style={{marginTop:'.5rem',borderColor:'rgba(176,80,0,.35)'}}>
            <div className="scol-gen-hdr" style={{color:'#b05000',fontSize:'.78rem',fontWeight:800,letterSpacing:'.02em'}}>
              <span style={{fontSize:'.85rem'}}>↓</span> {localizedTarget(target,locale)}
            </div>
            <div className="buff-stats">
              {allStats.map(({s,v,pv,d})=>{
                const skey=`${d}|${s}`
                const srcs=[...(sources[skey]||[]),...(potentialSources[skey]||[])]
                const rowKey=`deb|${target}|${skey}`
                const isOpen=expanded===rowKey
                return(
                  <div key={s}>
                    <button type="button" aria-expanded={isOpen} aria-controls={`${disclosureId}-${encodeURIComponent(rowKey)}`} className={`buff-row buff-row-click${isOpen?' buff-row-open':''}`}
                         style={{background:'rgba(176,80,0,.07)',borderColor:'rgba(176,80,0,.22)'}}
                         onClick={()=>setExpanded(isOpen?null:rowKey)}>
                      <span className="buff-stat-name" style={{color:'#b05000',fontWeight:700,fontSize:'.75rem'}}>{localizedText(s,locale)}</span>
                      <span className="buff-vals">
                        {v>0&&<span className="buff-down">{d==='down'?'−':'+'}{fmt(v)}%</span>}
                        {pv>0&&<span className="buff-potential">{t('buffs.potential')} {d==='down'?'−':'+'}{fmt(pv)}%</span>}
                        <span className="buff-chevron" aria-hidden="true">{isOpen?'▴':'▾'}</span>
                      </span>
                    </button>
                    {(
                      <div id={`${disclosureId}-${encodeURIComponent(rowKey)}`} hidden={!isOpen} className="buff-sources">
                        {srcs.map((x,i)=>(
                          <div key={i} className="buff-source-contribution">
                          <div className="buff-source-row">
                            <CharIcon c={x.owner} size={16} round={true}/>
                            <span className="buff-source-name">{localizedCharacter(x.owner,locale).displayName}</span>
                            <span className={x.applicability===BUFF_APPLICABILITY.CONDITIONAL?'buff-potential':'buff-down'}>{x.applicability===BUFF_APPLICABILITY.CONDITIONAL?`${t('buffs.potential')} `:''}{x.dir==='down'?'−':'+'}{fmt(x.contribution)}%</span>
                          </div>
                          <BuffSourceEvidence source={x}/>
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
      {hasNotices&&<BuffApplicabilityNotices entries={entries} enemyDebuffs={enemyDebuffs}/>}
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
  const {findCharByName}=useReleaseData()
  const locale = useLocale()
  const chars=team.members.map(findCharByName).filter(Boolean)
  return(
    <div className={'mw-team'+(ss?' mw-team--ss':'')} style={{borderInlineStartColor:def.accent}}>
      <div className="mw-team-name">{localizedTeamName(team.name,locale.code)}</div>
      <div className="mw-team-members" dir="ltr">
        {chars.map((c,ci)=>{
          const star6=(c.skills||[]).some(s=>s.star6)
          return(
            <div key={ci} className="mw-member" dir={locale.direction}>
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
const COST_CHARACTERS=ALL.map(c=>({ ...c, rarity:characterInitialRarity(c) }))
const COST_CHARACTER_BY_ID=new Map(COST_CHARACTERS.map(c=>[c.id,c]))
const normalizeCostDraft=value=>normalizeTeamCostDraft(value,COST_CHARACTER_BY_ID)

export function TeamCostPage(){
  const {ALL}=useReleaseData()
  const allChars=useMemo(()=>ALL.map(c=>({...c,rarity:characterInitialRarity(c)})),[ALL])
  const { t } = useTranslation('common')
  const locale = useLocale()
  const[draft,setDraft]=useStoredDraft(TEAM_COST_DRAFT_KEY,createTeamCostDraft,normalizeCostDraft)
  const slots=draft.slots.map(id=>COST_CHARACTER_BY_ID.get(id)||null)
  const skillsDone=draft.skillsDone
  const[picker,setPicker]=useState(null)
  const[search,setSearch]=useState('')
  const closePicker=()=>{setPicker(null);setSearch('')}
  const pickerInputRef=useRef(null)

  const COST=RED_CRYSTAL_TOTAL_COST
  const SKILL_COSTS=RED_CRYSTAL_SKILL_COSTS
  const RCOL={N:'#68704a',R:'#3d9970',SR:'#3d6eb5',UR:'#c0392b'}

  const remainingCost=(rarity,done)=>SKILL_COSTS[rarity||'SR'].slice(done).reduce((s,v)=>s+v,0)


  const filtered=searchCharacters(allChars.slice().sort((a,b)=>a.name_en.localeCompare(b.name_en)),search,locale)

  const setSlot=(idx,char)=>{
    setDraft(p=>({ ...p, slots:p.slots.map((id,i)=>i===idx?char.id:id), skillsDone:p.skillsDone.map((done,i)=>i===idx?0:done) }))
    setPicker(null);setSearch('')
  }
  const clearSlot=(idx)=>{
    setDraft(p=>({ ...p, slots:p.slots.map((id,i)=>i===idx?null:id), skillsDone:p.skillsDone.map((done,i)=>i===idx?0:done) }))
  }
  const clearAll=()=>setDraft(createTeamCostDraft())
  const toggleSkill=(idx,n)=>setDraft(p=>({ ...p, skillsDone:p.skillsDone.map((done,i)=>i===idx?(done>=n?n-1:n):done) }))

  const filled=slots.filter(Boolean)
  const total=slots.reduce((s,c,idx)=>{if(!c)return s;const r=characterInitialRarity(c);return s+remainingCost(r,skillsDone[idx])},0)
  const urCount=filled.filter(c=>characterInitialRarity(c)==='UR').length
  const srCount=filled.filter(c=>characterInitialRarity(c)==='SR').length
  const rCount=filled.filter(c=>characterInitialRarity(c)==='R').length
  const nCount=filled.filter(c=>characterInitialRarity(c)==='N').length

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
          {nCount>0&&<span style={{'--rarity-color':RCOL.N}}><b>{nCount}</b> N</span>}
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
          const rarity=char?characterInitialRarity(char):null
          const displayName=char?localizedCharacter(char, locale).displayName:''
          const fc=char?(CC[char.country]||'#888'):null
          const rc=rarity?RCOL[rarity]:'#888'
          const done=skillsDone[idx]
          const remaining=char?remainingCost(rarity,done):null
          const isMaxed=char&&remaining===0
          return char?(
            <div key={idx} data-cost-slot={idx} className="tc-slot-card tc-slot-filled" style={{
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
                <button type="button" className="tc-remove" aria-label={t('teamCost.removeGeneral',{name:displayName})} onClick={()=>clearSlot(idx)}>✕</button>
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
                      <button key={n} type="button" className="tc-skill-toggle" aria-label={t('teamCost.skillCompleted',{name:displayName,number:n})} aria-pressed={active}
                        onClick={e=>{e.stopPropagation();toggleSkill(idx,n)}}>{n}</button>
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
                  <button type="button" className="tc-change" aria-label={t('teamCost.changeGeneral',{name:displayName})} onClick={()=>{setPicker(idx);setSearch('')}}>{t('teamCost.change')}</button>
                </div>
              </div>
            </div>
          ):(
            <button key={idx} data-cost-slot={idx} className="tc-slot-card tc-slot-empty" onClick={()=>{setPicker(idx);setSearch('')}} style={{
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
            {(['N','R','SR','UR']).map(r=>(
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
        <Dialog className="overlay" onClose={closePicker} aria-label={`${t('teamCost.selectGeneral')} · ${t('teamCost.slot', { number: picker + 1 })}`}
          initialFocus={()=>pickerInputRef.current} returnFocus={()=>document.querySelector(`[data-cost-slot="${picker}"] .tc-change, button[data-cost-slot="${picker}"]`)}>
          <div className="picker" onClick={e=>e.stopPropagation()} style={{maxWidth:'560px',maxHeight:'80vh'}}>
            <div className="picker-head">
              <span>{t('teamCost.selectGeneral')} — {t('teamCost.slot', { number: picker + 1 })}</span>
              <button className="x-btn" aria-label={t('close')} onClick={closePicker}>✕</button>
            </div>
            <div className="picker-filters">
              <input ref={pickerInputRef} type="search" className="picker-search" aria-label={t('teamCost.search')} placeholder={t('teamCost.search')} value={search} onChange={e=>setSearch(e.target.value)}/>
              {search&&<button type="button" onClick={()=>{setSearch('');pickerInputRef.current?.focus()}}>{t('clear')}</button>}
            </div>
            <div className="tc-picker-body" style={{overflowY:'auto',maxHeight:'55vh',padding:'8px'}}>
              {!filtered.length&&<p className="search-empty" role="status">{t('stats.noCharacterMatches',{query:search})}</p>}
              <div className="tc-picker-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:'8px'}}>
                {filtered.map(c=>{
                  const rarity=characterInitialRarity(c)
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
        </Dialog>
      )}
    </div>
  )
}

// ── CW GUIDE ──────────────────────────────────────────────────────────────────
