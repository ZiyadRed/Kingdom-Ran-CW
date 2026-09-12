import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import cwBuffsData from '../../../data/cw_buffs.json'
import cwTeamBuffs from '../../../data/cw_team_buffs.json'
import sceneCardBuffs from '../../../data/scene_card_cw_buffs.json'
import { ALL, CHAR_BY_ID, CC, FACTIONS, CharIcon, BuffValueCluster, OwnedToggle, ProgressTools, RedCrystalCostChip, SCENE_CARD, SceneStarControl, buffEntryRarity, buffSourceId, findCharByName, persosThumb, progressFilterItems, redCrystalBuffUnlockCost, useProgressTracker } from '../../core.jsx'
import { resolveRegularBuffCharacter } from '../../buff-identity.js'
import Dialog from '../../Dialog.jsx'
import { ArtLightbox, ViewArtButton } from '../../art-preview.jsx'
import { secondaryName } from '../../display-names.js'
import { useLocale, formatNumber as formatLocaleNumber, formatFixedNumber } from '../../i18n/index.js'
import { localizedCharacterName, matchesCharacterName } from '../../i18n/ar-character-names.js'
import { localizedCharacter, localizedText } from '../../i18n/data.js'
import { BUFF_UNIT_CATS, BUFF_STAT_COLORS, CAT_COLOR, TERRAIN_BUFFS, BUFF_STATES, STATE_FACTION_ID, BUFF_ARMIES, ARMY_PARENT_STATE, ARMY_ICON_CHAR, WOGG_BUFF_NAME, BUFF_SIEGE, SIEGE_META, WOGG_BUFF_SOURCES, UNIT_ICON_SCALE } from './data.js'

export function UnitCatIcon({cat,size=80}){
  const locale=useLocale()
  const imgs={'Infantry':'/icons/controls/unit_infantry.webp','Cavalry':'/icons/controls/unit_cavalry.webp','Archer':'/icons/controls/unit_archer.webp','Shield':'/icons/controls/unit_shield.webp'}
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
  const lookupEntries=(kind,key,stat)=>{
    if(kind==='unit') return (cwBuffsData[key]||{})[stat]||[]
    if(kind==='state') return ((cwTeamBuffs.states||{})[key]||{})[stat]||[]
    if(kind==='army')  return ((cwTeamBuffs.armies||{})[key]||{})[stat]||[]
    if(kind==='siege') return ((cwTeamBuffs.siege||{})[key]||{})[stat]||[]
    return []
  }
  const findBuffChar=(e,kind=activeKind)=>kind==='unit'
    ? resolveRegularBuffCharacter(e,CHAR_BY_ID,ALL)
    : findCharByName(e?.name)||ALL.find(c=>c.name_jp===e?.name_jp)||null
  const buffEntryDisplayName=(e,kind=activeKind)=>{
    const character=findBuffChar(e,kind)
    return character?localizedCharacter(character,locale).displayName
      :locale.code==='ja'&&e?.name_jp?e.name_jp:localizedCharacterName(e?.name,locale)
  }
  const buffEntryMatches=(entry,query,kind)=>matchesCharacterName(
    findBuffChar(entry,kind)||{name_en:entry?.name,name_jp:entry?.name_jp},
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
    return buffStats.some(stat=>String(labelFor(stat)).toLowerCase().includes(buffSearchNorm)||lookupEntries(kind,key,stat).some(entry=>buffEntryMatches(entry,buffSearch,kind)))
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
  // The panel's sentence is templated per terrain family, so the copy lives in
  // the catalog and only the (already localized) terrain name is interpolated.
  const TERRAIN_DESCRIPTION_KEYS={
    'Damage Dealt Reduction':'buffs.terrainDamageDealt',
    'Damage Taken Increase':'buffs.terrainDamageTaken',
    'Starting Troop HP Loss':'buffs.terrainStartingHp',
  }
  const terrainDescription=(terrain)=>{
    const key=TERRAIN_DESCRIPTION_KEYS[terrain.typeLabel]
    return key?t(key,{terrain:labelFor(terrain.name),defaultValue:terrain.description}):terrain.description
  }
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
              <div style={{fontWeight:900,fontSize:'1.05rem',color:'var(--txt)'}}>{labelFor(terrain.name)}</div>
              <div style={{fontSize:'.78rem',color:'var(--txt3)'}}>{terrain.jp}</div>
            </div>
            <div style={{fontSize:'.82rem',lineHeight:1.45,color:'var(--txt2)'}}>{terrainDescription(terrain)}</div>
            <div style={{fontSize:'.68rem',color:terrain.color,fontWeight:800,marginTop:'5px',letterSpacing:'.03em',textTransform:'uppercase'}}>{localizedText(terrain.typeLabel,locale)}</div>
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
                <span style={{fontSize:'.7rem',fontWeight:700,color:c}}>+{formatFixedNumber(t,locale)}%</span>
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
          <div style={{fontWeight:900,fontSize:'1.5rem',color:sc}}>+{formatFixedNumber(total,locale)}%</div>
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
                      <span style={{fontWeight:900,fontSize:'1.1rem',color:sc,fontVariantNumeric:'tabular-nums'}}>+{formatFixedNumber(5,locale)}%</span>
                     <img src="/icons/Shard.webp" alt={t('teamCost.buffs.shard')} title={t('teamCost.buffs.shard')} loading="lazy" decoding="async" style={{width:20,height:20,objectFit:'contain',flexShrink:0}}/>
                      <OwnedToggle
                        owned={shardOwned}
                        onToggle={()=>tracker.toggleOwned('buffSources',shardSourceId)}
                      />
                    </span>
                    <span style={{color:'var(--txt3)',fontWeight:800,fontSize:'.9rem'}}>+</span>
                    <span className="buff-value-crystal-group" style={{display:'inline-flex',alignItems:'center',gap:'8px',opacity:owned?1:.55}}>
                      <RedCrystalCostChip cost={unlockCost} value={e.value}/>
                      <span style={{fontWeight:900,fontSize:'1.1rem',color:sc,minWidth:'52px',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>+{formatFixedNumber(e.value,locale)}%</span>
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
  const sceneValueText=(card,value=sceneCardValueAt(card))=>card.valueMode==='percent'?`+${formatFixedNumber(value,locale,2)}%`:`+${formatLocaleNumber(value,locale)}`
  const sceneTotalText=m=>m.unit==='%'?`+${formatFixedNumber(m.total,locale,2)}%`:`+${formatLocaleNumber(m.total,locale)}`
  const sceneCardIds=(sceneCardBuffs.cards||[]).map(c=>c.id)
  const sceneOwnedCount=(sceneCardBuffs.cards||[]).filter(c=>sceneCardStar(c)>0).length
  const buffStats=['HP','Attack','Defense']
  const buildSourceRows=()=>{
    const rows=[]
    const pushRows=(kind,keys,label)=>{
      keys.forEach(key=>{
        buffStats.forEach(stat=>{
          lookupEntries(kind,key,stat).forEach((e,i)=>{
            const char=findBuffChar(e,kind)
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
        const char=findBuffChar(e,'terrain')
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
    <span className="buff-summary-stat" title={`${localizedText('Max '+stat,locale)}: ${formatFixedNumber(maxBuffValue(kind,key,stat),locale)}%`}>
      <b>{localizedText(stat,locale)}</b>
      <span>+{formatFixedNumber(ownedBuffValue(kind,key,stat),locale)}%</span>
    </span>
  )
  const renderBuffProgressSection=()=>(
    <section className="buff-progress-panel">
      <div className="buff-progress-head">
        <div>
          <h2>{t('buffs.ownedTotals')}</h2>
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
              <h3>{labelFor(section.label)}</h3>
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
            <h3>{t('buffs.sceneCards')}</h3>
            <div className="buff-summary-rows">
              <div className="buff-summary-row">
                <span className="buff-summary-name" style={{'--sc':'#1a8a5a'}}>{t('buffs.sceneCards')} · {t('buffs.ownedTotals')}</span>
                <span className="buff-summary-stats">
                  {sceneStatOrder.map(stat=>{
                    const meta=sceneStatMeta[stat]
                    const val=sceneOwnedByStat(stat)
                    const text=meta.unit==='%'?`+${formatFixedNumber(val,locale,2)}%`:`+${formatLocaleNumber(val,locale)}`
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
        <Dialog className="overlay" onClose={closeDetails} aria-label={`${labelFor(activeKey)} — ${t('buffs.title')}`}>
          <div className="buff-dialog" onClick={e=>e.stopPropagation()} style={{
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
        </Dialog>
      )}
      <ArtLightbox src={artSrc} alt={t('altSceneCardArt')} onClose={()=>setArtSrc(null)}/>
    </div>
  )
}
