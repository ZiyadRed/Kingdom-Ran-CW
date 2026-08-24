// CW Guide — split out of pages.jsx so /guide does not pull core.jsx and
// the full character dataset for what is static reference content.
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import statusEffects from '../data/glossary/status_effects.json'
import unitMatchups  from '../data/glossary/unit_matchups.json'
import skillTypesGlossary from '../data/glossary/skill_types.json'

export const TERRAIN_EFFECTS = [
  {
    id:'slope', name:'Slope', jp:'坂', icon:'/icons/terrain_effect/slope.webp', color:'#c79b26',
    effect:'Damage dealt -50%',
    detail:'Your attacking unit deals 50% less damage when it invades through a Slope route.',
    mitigatedBy:'Slope Aptitude reduces this damage dealt penalty.',
  },
  {
    id:'forest', name:'Forest', jp:'森', icon:'/icons/terrain_effect/forest.webp', color:'#2f8f4e',
    effect:'Damage dealt -50%',
    detail:'Your attacking unit deals 50% less damage when it invades through a Forest route.',
    mitigatedBy:'Forest Aptitude reduces this damage dealt penalty.',
  },
  {
    id:'river', name:'River', jp:'川', icon:'/icons/terrain_effect/river.webp', color:'#2b80c9',
    effect:'Damage taken +50%',
    detail:'Your attacking unit takes 50% more damage when it invades through a River route.',
    mitigatedBy:'Waterway Aptitude reduces this damage taken increase.',
  },
  {
    id:'swamp', name:'Swamp', jp:'湿地', icon:'/icons/terrain_effect/swamp.webp', color:'#9a7b26',
    effect:'Damage taken +50%',
    detail:'Your attacking unit takes 50% more damage when it invades through a Swamp route.',
    mitigatedBy:'Mud Aptitude reduces this damage taken increase.',
  },
  {
    id:'checkpoint', name:'Checkpoint', jp:'関所', icon:'/icons/terrain_effect/checkpoint.webp', color:'#b98b35',
    effect:'Starting HP -30%',
    detail:'Your attacking unit starts the battle with 30% less HP when it invades through a Checkpoint route.',
    mitigatedBy:'Scout reduces this starting HP loss.',
  },
  {
    id:'ambush', name:'Ambush', jp:'伏兵', icon:'/icons/terrain_effect/ambush.webp', color:'#8a5a3a',
    effect:'Starting HP -30%',
    detail:'Your attacking unit starts the battle with 30% less HP when it invades through an Ambush route.',
    mitigatedBy:'Unit Protection reduces this starting HP loss.',
  },
]
export function TerrainEffectIcon({terrain,size=64}){
  if(!terrain) return null
  return <img src={terrain.icon} alt={terrain.name} loading="lazy" decoding="async" style={{width:size,height:size,objectFit:'contain',flexShrink:0}}/>
}

export const GUIDE_SECTIONS=[
  {id:'basics',       label:'Basics',              category:'Beginner'},
  {id:'stats-screen', label:'CW Stats Screen',     category:'Beginner'},
  {id:'roles',        label:'Roles',               category:'Beginner'},
  {id:'bandits',      label:'Bandit Hunt',         category:'Beginner'},
  {id:'matchups',     label:'Unit Matchups',       category:'Beginner'},
  {id:'types',        label:'Skill Types',         category:'Beginner'},
  {id:'crystals',     label:'Crystal Types',       category:'Beginner'},
  {id:'stats',        label:'How To Raise CW Stats',category:'Beginner'},
  {id:'leaders',      label:'Leader & Strategist', category:'Advanced'},
  {id:'debuffs',      label:'Debuff Resist',       category:'Advanced'},
  {id:'effects',      label:'Status Effects',      category:'Advanced'},
  {id:'terrain',      label:'Terrain Effects',     category:'Advanced'},
  {id:'interactions', label:'Effect Interactions', category:'Advanced'},
  {id:'targeting',    label:'Targeting Rules',     category:'Advanced'},
]
export const GUIDE_GROUPS=['Beginner','Advanced']

export function GuideCard({title,children,accent='var(--terra)'}) {
  return (
    <div className="guide-card" style={{
      borderRadius:'12px',background:'var(--sur)',border:'1px solid var(--bdr)',
      borderTop:`4px solid ${accent}`,padding:'1rem',boxShadow:'0 2px 8px rgba(6,38,76,.05)',
    }}>
      <h3 style={{fontSize:'.96rem',fontWeight:900,color:'var(--txt)',margin:'0 0 .5rem'}}>{title}</h3>
      <div style={{fontSize:'.82rem',lineHeight:1.58,color:'var(--txt2)'}}>{children}</div>
    </div>
  )
}

export function GuideList({items}) {
  return (
    <ul style={{margin:'.25rem 0 0 1.05rem',padding:0}}>
      {items.map((item,i)=><li key={i} style={{marginBottom:'.32rem'}}>{item}</li>)}
    </ul>
  )
}

export function GuideFormula({formula,children}) {
  return (
    <div style={{
      marginTop:'.7rem',padding:'.8rem .9rem',borderRadius:'10px',
      background:'var(--bg2)',border:'1px solid var(--bdr)',fontSize:'.8rem',
    }}>
      <div style={{fontFamily:'monospace',fontWeight:900,color:'var(--navy)',marginBottom:'.45rem'}}>{formula}</div>
      <div style={{color:'var(--txt3)',lineHeight:1.55}}>{children}</div>
    </div>
  )
}

export function GuideMarkedImage({src,alt,markers,aspectRatio}) {
  return (
    <div style={{
      position:'relative',maxWidth:'920px',margin:'0 auto 1rem',borderRadius:'12px',
      overflow:'hidden',background:'var(--bg2)',border:'1px solid var(--bdr)',
      boxShadow:'0 3px 14px rgba(6,38,76,.08)',
    }}>
      <img src={src} alt={alt} loading="lazy" decoding="async" style={{
        display:'block',width:'100%',aspectRatio,objectFit:'contain',background:'var(--bg2)',
      }}/>
      {markers.map(marker=>(
        <div key={marker.id} title={marker.title} style={{
          position:'absolute',left:`${marker.x}%`,top:`${marker.y}%`,transform:'translate(-50%,-50%)',
          width:marker.size||18,height:marker.size||18,borderRadius:'999px',display:'flex',alignItems:'center',justifyContent:'center',
          background:marker.ring?'rgba(229,57,53,.08)':marker.color||'var(--terra)',
          color:marker.ring?'#e53935':'#fff',
          border:marker.ring?'4px solid #e53935':'2px solid #fff',
          boxShadow:marker.ring?'0 0 0 3px rgba(255,255,255,.85),0 2px 10px rgba(0,0,0,.4)':'0 2px 8px rgba(0,0,0,.35)',
          fontSize:marker.ring?'0':'.56rem',fontWeight:900,
        }}>
          {marker.label ?? marker.id}
        </div>
      ))}
    </div>
  )
}

export const FAQ_IMAGES={
  basics:[
    {src:'/guide/basics-map-en.webp',label:'Castle War map overview'},
    {src:'/guide/basics-flow-en.webp',label:'Castle War flow screen'},
  ],
  roles:[
    {src:'/guide/roles-selection.webp',label:'Role selection screen'},
    {src:'/guide/roles-button.webp',label:'Role button on battle map'},
    {src:'/guide/roles-effect.webp',label:'Role effect view'},
  ],
  bandits:[
    {src:'/guide/bandit-button.webp',label:'Bandit Hunt button'},
    {src:'/guide/bandit-start.webp',label:'Bandit Hunt start screen'},
    {src:'/guide/bandit-team.webp',label:'Bandit Hunt team setup'},
    {src:'/guide/bandit-results.webp',label:'Bandit Hunt results'},
  ],
}

export function GuideImages({images}) {
  return (
    <div style={{margin:'0 auto 1.25rem',maxWidth:'900px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'10px',alignItems:'start'}}>
        {images.map(img=>(
          <a key={img.src} href={img.src} target="_blank" rel="noopener noreferrer" style={{
            display:'block',borderRadius:'10px',overflow:'hidden',background:'var(--sur)',
            border:'1px solid var(--bdr)',boxShadow:'0 2px 8px rgba(6,38,76,.06)',textDecoration:'none',
          }}>
            <div style={{aspectRatio:'16 / 10',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
              <img src={img.src} alt={img.label} loading="lazy" decoding="async" style={{display:'block',width:'100%',height:'100%',objectFit:'contain'}}/>
            </div>
            <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--txt2)',padding:'.45rem .55rem',lineHeight:1.3}}>{img.label}</div>
          </a>
        ))}
      </div>
    </div>
  )
}

export function CastleWarBasicsSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        Castle War is alliance territory combat. The goal is not only to win single fights, but to choose the right castles, place defenses, and spend limited actions well.
      </p>
      <GuideImages images={FAQ_IMAGES.basics}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'12px'}}>
        <GuideCard title="Core Loop" accent="var(--terra)">
          <GuideList items={[
            'A group contains 7 alliances fighting over castles.',
            'Your alliance declares which castles to attack, then members place attacking or defending teams.',
            'Defenders protect owned castles. Attackers try to break declared targets during invasion time.',
            'Winning the map is a team planning problem, not only a character power check.',
          ]}/>
        </GuideCard>
        <GuideCard title="Daily Timing" accent="var(--gold)">
          <GuideList items={[
            'Garrison placement is available from declaration start until invasion ends.',
            'Attack reservations can be placed before invasion time, then start automatically when invasion opens.',
            'Direct invasion placement happens during the invasion window.',
            'Participation status and role planning should be handled before the active window if possible.',
          ]}/>
        </GuideCard>
        <GuideCard title="Actions and Sorties" accent="#3d6eb5">
          <GuideList items={[
            'Each general used in a team consumes action count or sortie resources depending on the activity.',
            'A 4-general team is usually more expensive than a partial team, but is much safer in real fights.',
            'Sortie resources recover daily, and some recovery options cost jewels.',
            'Do not spend strong teams early unless the castle or timing is worth it.',
          ]}/>
        </GuideCard>
      </div>
      <GuideFormula formula="Simple priority: defend key castles -> attack declared targets -> spend leftovers efficiently">
        If a player is new, the best first step is to understand where the alliance needs bodies before trying to optimize every individual matchup.
      </GuideFormula>
    </div>
  )
}

export const CW_STATS_SCREEN_MARKERS=[
  {id:'1',title:'HP',x:5.4,y:30.4,color:'#d8472f',body:'Maximum HP for Castle War.'},
  {id:'2',title:'Morale',x:5.4,y:35.9,color:'#1a9f75',body:'Maximum Morale. Morale skills draw from this cap.'},
  {id:'3',title:'Max Attack',x:5.4,y:41.4,color:'#c0392b',body:'The upper attack value used when damage is calculated.'},
  {id:'4',title:'Min Attack',x:5.4,y:47.0,color:'#c0392b',body:'The lower attack value used when damage is calculated.'},
  {id:'5',title:'Type Advantage Damage',x:5.4,y:52.6,color:'#a85bb6',body:'Bonus special attack effect when the unit has the favorable matchup.'},
  {id:'6',title:'Type Disadvantage Damage',x:5.4,y:58.1,color:'#8b6fbd',body:'Special attack effect shown for unfavorable matchups.'},
  {id:'7',title:'Hit Rate',x:5.4,y:63.8,color:'#a65a7a',body:'Helps attacks connect instead of missing.'},
  {id:'8',title:'Critical Rate',x:5.4,y:69.6,color:'#7a65c7',body:'Chance for an attack to become a critical hit.'},
  {id:'9',title:'Critical Damage',x:5.4,y:75.3,color:'#9a6b1c',body:'Bonus damage applied when a critical hit happens.'},
  {id:'10',title:'Defense Penetration',x:5.4,y:80.9,color:'#5869a8',body:'Helps bypass part of the enemy Defense. It is not the same thing as Attack.'},
  {id:'11',title:'Defense',x:5.4,y:86.6,color:'#2471a3',body:'Reduces incoming damage.'},
  {id:'12',title:'Evasion (Dodge chance)',x:5.4,y:92.2,color:'#1a8a72',body:'Chance to dodge incoming attacks.'},
]

export function CWStatsScreenGuideSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        The CW Stats screen shows a character's Castle War-specific stats. These values are separate from the normal character detail stats and are used for Castle War.
      </p>
      <GuideCard title="How To Open It" accent="var(--terra)">
        <p style={{margin:'0 0 .8rem'}}>
          Open a character page, then tap the castle icon on the right side of the screen.
        </p>
        <GuideMarkedImage src="/guide/cw-stats-access.webp" alt="Character page showing the Castle War stats icon" markers={[]} aspectRatio="2014 / 1218"/>
      </GuideCard>
      <div style={{height:'12px'}}/>
      <GuideMarkedImage src="/guide/cw-stats-screen.webp" alt="Castle War stats screen with numbered stat rows" markers={CW_STATS_SCREEN_MARKERS} aspectRatio="1855 / 1194"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:'12px'}}>
        {CW_STATS_SCREEN_MARKERS.map(stat=>(
          <GuideCard key={stat.id} title={`${stat.id}. ${stat.title}`} accent={stat.color}>
            {stat.body}
          </GuideCard>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px',marginTop:'12px'}}>
        <GuideCard title="Screen Notes" accent="var(--gold)">
          <GuideList items={[
            'Green values in parentheses show the bonus portion currently added to that stat or effect.',
            'Max Attack and Min Attack both matter because damage can roll between them.',
            <>Type advantage follows unit matchups. Check the <Link to="/guide/matchups" style={{fontWeight:900,color:'var(--terra)',textDecoration:'underline',textUnderlineOffset:'3px'}}>Unit Matchups</Link> guide for the matchup chart.</>,
          ]}/>
        </GuideCard>
        <GuideCard title="Related Pages" accent="#3d6eb5">
          <div>
            Use <Link to="/guide/stats" style={{fontWeight:900,color:'var(--terra)',textDecoration:'underline',textUnderlineOffset:'3px'}}>How To Raise CW Stats</Link> for progression sources, and <Link to="/buffs" style={{fontWeight:900,color:'var(--terra)',textDecoration:'underline',textUnderlineOffset:'3px'}}>Buffs</Link> for Castle War buff references.
          </div>
        </GuideCard>
      </div>
    </div>
  )
}

export function CWStatsGuideSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        CW stats are affected by several progression systems besides the{' '}
        (<Link to="/buffs" style={{fontWeight:900,color:'var(--terra)',textDecoration:'underline',textUnderlineOffset:'3px'}}>Buffs</Link>) page. Buffs are an important layer, but the final number also depends on the character, troops, weapons, and small scene-card bonuses.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px'}}>
        <GuideCard title="What Affects CW Stats" accent="#3d6eb5">
          <GuideList items={[
            'Character level. Level 85 is the maximum.',
            'Character star progress. Maxing the first page gives the maximum stat buff; maxing the second page does not add more CW stat gain.',
            'LG level.',
            'Troop level.',
            'Weapon level and weapon rarity.',
            'Character scene cards, which provide a small stat boost for min-maxers.',
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

export function RolesGuideSection(){
  const roles=[
    {name:'Assault Captain',trigger:'When invading',effect:'Raises attack for your own generals.',accent:'#c0392b'},
    {name:'Defense Captain',trigger:'When garrisoning',effect:'Raises defense for your own generals.',accent:'#2471a3'},
    {name:'Support Captain',trigger:'When invading or garrisoning',effect:'Raises morale cap for your own generals.',accent:'#8e44ad'},
    {name:'Bandit Hunt Captain',trigger:'When doing Bandit Hunt',effect:'Raises attack and defense for your own generals.',accent:'#1a8a72'},
  ]
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        Roles are personal Castle War assignments. They only buff the player who set the role, so choose the role that matches what you are actually going to do that day.
      </p>
      <GuideImages images={FAQ_IMAGES.roles}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'12px',marginBottom:'1rem'}}>
        {roles.map(r=>(
          <GuideCard key={r.name} title={r.name} accent={r.accent}>
            <div style={{fontSize:'.74rem',fontWeight:900,color:r.accent,marginBottom:'.35rem'}}>{r.trigger}</div>
            <div>{r.effect}</div>
          </GuideCard>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px'}}>
        <GuideCard title="Cost Rules" accent="var(--gold)">
          <GuideList items={[
            'Two roles are free and two roles cost jewels each day.',
            'The free/paid role combination changes daily and is shared across alliances.',
            'The first day starts with all roles free.',
            'Changing away from a paid role does not refund the jewels.',
          ]}/>
        </GuideCard>
        <GuideCard title="Lock Timing" accent="var(--terra)">
          <GuideList items={[
            'You can change role freely before invasion time starts.',
            'If you forgot to set a role, you can still set one during invasion time.',
            'After invasion time starts, an already selected role cannot be changed.',
            'Free role availability updates at 8:00 each day.',
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

export function BanditHuntGuideSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        Bandit Hunt is a Castle War side objective where the alliance fights NPC bandit teams for ranking rewards. It competes with castle attacks for your limited actions.
      </p>
      <GuideImages images={FAQ_IMAGES.bandits}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'12px'}}>
        <GuideCard title="What It Is" accent="#1a8a72">
          <GuideList items={[
            'Available during Normal Castle War invasion time.',
            'The alliance competes on total Bandit Hunt count across the season.',
            'It can give alliance ranking rewards and personal ranking points.',
            'Selected War weapons cannot be used for Bandit Hunt.',
          ]}/>
        </GuideCard>
        <GuideCard title="How It Runs" accent="var(--terra)">
          <GuideList items={[
            'Choose the Bandit Hunt option, select a team, then start the run.',
            'The team keeps fighting in sequence while it wins.',
            'If multiple players start hunts, they queue in order.',
            'A team that is fighting or queued cannot be used for invasion or garrison until it returns.',
          ]}/>
        </GuideCard>
        <GuideCard title="When To Use It" accent="var(--gold)">
          <GuideList items={[
            'Use it when the alliance wants Bandit ranking or has spare action resources.',
            'Avoid locking important generals if a castle fight still needs them.',
            'The Bandit Hunt Captain role is best for players assigned to this job.',
            'If invasion time ends mid-run, only the completed chain up to that point counts.',
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

export function DebuffResistanceGuideSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        Debuff resistance reduces certain negative effects before they apply. This matters a lot when judging whether attack down, defense down, or defense penetration actually lands.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px'}}>
        <GuideCard title="What Resistance Covers" accent="#8e44ad">
          <GuideList items={[
            'Attack Down Resistance reduces attack lowering effects.',
            'Defense Down Resistance reduces defense lowering effects.',
            'Defense Penetration Resistance reduces defense penetration effects.',
            'It works against both Combat skills and Strategy skills.',
          ]}/>
        </GuideCard>
        <GuideCard title="Important Notes" accent="var(--terra)">
          <GuideList items={[
            'Defense penetration is treated like a debuff for this resistance calculation.',
            'If resistance is higher than the debuff, the final debuff becomes 0%.',
            'Attack down effects still apply to critical attacks.',
            'Multiple debuffs are added together before resistance is subtracted.',
          ]}/>
        </GuideCard>
      </div>
      <GuideFormula formula="Final debuff % = max(0, total debuff % - total resistance %)">
        Example 1: 40% Attack Down against 50% Attack Down Resistance becomes 0%.
        <br/>
        Example 2: 40% Attack Down + 30% Attack Down against 50% resistance becomes 20%.
      </GuideFormula>
    </div>
  )
}

export function TerrainEffectsSection(){
  const priorityText='Slope > Forest > River > Swamp > Checkpoint > Ambush > No terrain'
  return(
    <div>
      <p style={{fontSize:'.82rem',lineHeight:1.65,color:'var(--txt3)',textAlign:'center',maxWidth:'760px',margin:'0 auto 1.4rem'}}>
        Terrain effects are Castle War map debuffs attached to invasion routes between castles. They can lower your damage, make you take more damage, or make your unit start the fight with less HP.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'12px',marginBottom:'1rem'}}>
        {TERRAIN_EFFECTS.map(t=>(
          <div key={t.id} style={{
            display:'flex',gap:'13px',alignItems:'center',padding:'14px 15px',borderRadius:'14px',
            background:`linear-gradient(135deg,${t.color}12,var(--sur))`,
            border:`1.5px solid ${t.color}36`,boxShadow:'0 2px 10px rgba(0,0,0,.04)',
          }}>
            <div style={{width:66,height:66,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <TerrainEffectIcon terrain={t} size={62}/>
            </div>
            <div style={{minWidth:0}}>
              <div style={{display:'flex',alignItems:'baseline',gap:'7px',flexWrap:'wrap',marginBottom:'4px'}}>
                <span style={{fontWeight:900,fontSize:'.95rem',color:'var(--txt)'}}>{t.name}</span>
                <span style={{fontSize:'.7rem',color:'var(--txt3)'}}>{t.jp}</span>
                <span style={{fontSize:'.68rem',fontWeight:900,color:t.color,background:t.color+'18',border:`1px solid ${t.color}40`,borderRadius:'999px',padding:'2px 8px'}}>{t.effect}</span>
              </div>
              <div style={{fontSize:'.78rem',lineHeight:1.42,color:'var(--txt2)',marginBottom:'5px'}}>{t.detail}</div>
              <div style={{fontSize:'.68rem',lineHeight:1.35,color:'var(--txt3)'}}>{t.mitigatedBy}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        padding:'13px 15px',borderRadius:'14px',
        background:'var(--bg2)',border:'1px solid var(--bdr)',fontSize:'.76rem',
        lineHeight:1.6,color:'var(--txt3)',
      }}>
        When multiple routes can reach the same castle, the game prefers a route with no terrain debuff. If every route has a debuff, it picks the route with the smallest remaining penalty after your terrain-resistance buffs are applied. If the remaining penalty is tied, the route priority is <strong style={{color:'var(--txt2)'}}>{priorityText}</strong>. Terrain placements can change each Castle War event.
      </div>
    </div>
  )
}

// -- Crystal types ----------------------------------------------------------
// Red/Blue unlock CW skills; Orange/Green unlock the Leader/Strategist skills.
// Red costs mirror RED_CRYSTAL_TOTAL_COST / RED_CRYSTAL_SKILL_COSTS in core.jsx
// (kept in sync by src/guide.test.js).
export const CRYSTAL_TYPES=[
  {
    id:'red',
    name:'Red Crystal',
    img:'/guide/red-crystal.webp',
    accent:'#c0392b',
    unlocks:'Castle War skills',
    body:'The standard crystal. Unlocks the three Castle War skills on any general.',
    cost:'1,750 to fully unlock a UR general (100 / 550 / 1,100 per skill). SR costs 800, R costs 595.',
  },
  {
    id:'blue',
    name:'Blue Crystal',
    img:'/guide/blue-crystal.webp',
    accent:'#2980b9',
    unlocks:'Hi Shin Unit only',
    body:'Works exactly like a Red Crystal, but can only be spent on Hi Shin Unit generals.',
    cost:'Same costs as Red. Spend these on Hi Shin members first and keep your Red for everyone else.',
  },
  {
    id:'orange',
    name:'Orange Crystal',
    img:'/guide/orange-crystal.webp',
    accent:'#e07f48',
    unlocks:'Leader skill',
    body:'Unlocks the Leader skill on a general who can hold that role.',
    cost:'1,000 per general.',
  },
  {
    id:'green',
    name:'Green Crystal',
    img:'/guide/green-crystal.webp',
    accent:'#16a085',
    unlocks:'Strategist skill',
    body:'Unlocks the Strategist skill on a general who can hold that role.',
    cost:'1,000 per general.',
  },
]

export function CrystalTypesSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.2rem'}}>
        Four crystals unlock skills, and they are not interchangeable. Each one only works on what it is meant for.
      </p>
      <div style={{display:'grid',gap:'1rem',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'}}>
        {CRYSTAL_TYPES.map(c=>(
          <div key={c.id} style={{
            borderRadius:'12px',background:'var(--sur)',border:'1px solid var(--bdr)',
            borderTop:'4px solid '+c.accent,padding:'1rem',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'.7rem',marginBottom:'.6rem'}}>
              <img src={c.img} alt={c.name} width="48" height="48" loading="lazy" decoding="async"
                style={{width:48,height:48,flexShrink:0,objectFit:'contain'}}/>
              <div style={{minWidth:0}}>
                <h3 style={{fontSize:'.96rem',fontWeight:900,color:'var(--txt)',margin:0}}>{c.name}</h3>
                <div style={{fontSize:'.75rem',fontWeight:700,color:c.accent}}>{c.unlocks}</div>
              </div>
            </div>
            <p style={{fontSize:'.81rem',color:'var(--txt2)',lineHeight:1.55,margin:'0 0 .5rem'}}>{c.body}</p>
            <div style={{
              fontSize:'.76rem',color:'var(--txt3)',lineHeight:1.5,
              padding:'.45rem .6rem',borderRadius:'8px',
              background:'var(--bg2)',border:'1px solid var(--bdr)',
            }}>{c.cost}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:'1rem'}}>
        <GuideCard title="Which to spend first" accent="var(--navy)">
          <GuideList items={[
            <>Blue is the most restricted, so spend it on Hi Shin Unit generals before touching Red on them.</>,
            <>Red is the one you will always be short of &mdash; a single UR general costs <strong>1,750</strong>.</>,
            <>Orange and Green only matter once you have a general who can hold the Leader or Strategist role. See <strong>Leader &amp; Strategist</strong>.</>,
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

// -- Souha Leader / Strategist skills ---------------------------------------
// Source: https://www.kingdomran.jp/info/260902souha-skill
// Per-general skill effects are not published, so this section documents the
// system only. Add the individual effects here once they are known.
export const SOUHA_LEADER_ROLES=[
  {
    id:'leader',
    label:'Leader',
    accent:'#c0392b',
    stoneImg:'/guide/orange-crystal.webp',
    stone:'Orange Crystals',
    riskLabel:'If your Leader dies',
    risk:'You lose the battle instantly, even if every other unit is still alive.',
    riskIcon:null,
    generals:[
      {name:'Renpa',  icon:'/icons/Renpa.webp'},
      {name:'Sho',    icon:'/icons/Sho.webp'},
      {name:'Rien',   icon:'/icons/Rien.webp'},
      {name:'Kisui',  icon:'/icons/Kisui.webp'},
      {name:'Rouai',  icon:'/icons/Rouai.webp'},
    ],
  },
  {
    id:'strategist',
    label:'Strategist',
    accent:'#2980b9',
    stoneImg:'/guide/green-crystal.webp',
    stone:'Green Crystals',
    riskLabel:'If your Strategist dies',
    risk:'Every allied unit is inflicted with Confusion for 1 turn.',
    riskIcon:'/icons/status/confusion.webp',
    generals:[
      {name:'Shouheikun', icon:'/icons/Shuheikun.webp'},
      {name:'Gohoumei',   icon:'/icons/Gohoumei.webp'},
      {name:'Beiman',     icon:'/icons/Beiman.webp'},
      {name:'Koshou',     icon:'/icons/Koshou.webp'},
      {name:'Shunsuiju',  icon:'/icons/Shunsuiju.webp'},
    ],
  },
]

export function LeaderStrategistSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.2rem'}}>
        Two optional skills. Each fires on turn 1 &mdash; and punishes you if its holder dies.
      </p>

      <div style={{display:'grid',gap:'1rem',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))'}}>
        {SOUHA_LEADER_ROLES.map(role=>(
          <div key={role.id} style={{
            borderRadius:'12px',background:'var(--sur)',border:'1px solid var(--bdr)',
            borderTop:'4px solid '+role.accent,padding:'1rem',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'.7rem',marginBottom:'.8rem'}}>
              <img src={role.stoneImg} alt={role.stone} width="52" height="52" loading="lazy" decoding="async"
                style={{width:52,height:52,flexShrink:0,objectFit:'contain'}}/>
              <div style={{minWidth:0}}>
                <h3 style={{fontSize:'1rem',fontWeight:900,color:'var(--txt)',margin:0}}>{role.label}</h3>
                <div style={{fontSize:'.75rem',color:'var(--txt3)',marginTop:'.2rem'}}>
                  Unlock: <strong style={{color:'var(--gold2)'}}>1,000</strong> &times; {role.stone}
                </div>
              </div>
            </div>

            <div style={{
              padding:'.55rem .65rem',borderRadius:'8px',
              background:role.accent+'12',border:'1px solid '+role.accent+'55',marginBottom:'.8rem',
            }}>
              <div style={{
                display:'flex',alignItems:'center',gap:'.35rem',fontSize:'.75rem',
                fontWeight:800,color:role.accent,marginBottom:'.25rem',
              }}>
                {role.riskIcon && <img src={role.riskIcon} alt="" style={{width:16,height:16}}/>}
                {role.riskLabel}
              </div>
              <div style={{fontSize:'.79rem',color:'var(--txt2)',lineHeight:1.5}}>{role.risk}</div>
            </div>

            <div style={{
              fontSize:'.73rem',fontWeight:800,color:'var(--txt3)',
              textTransform:'uppercase',letterSpacing:'.04em',marginBottom:'.4rem',
            }}>
              Generals
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'.4rem'}}>
              {role.generals.map(g=>(
                <div key={g.name} style={{
                  display:'flex',alignItems:'center',gap:'.35rem',padding:'.25rem .5rem .25rem .25rem',
                  borderRadius:'999px',background:'var(--bg2)',border:'1px solid var(--bdr)',
                }}>
                  <img src={g.icon} alt={g.name} width="22" height="22" loading="lazy" decoding="async"
                    style={{width:22,height:22,borderRadius:'50%',objectFit:'cover',objectPosition:'center top',flexShrink:0,display:'block'}}/>
                  <span style={{fontSize:'.78rem',fontWeight:700,color:'var(--txt2)'}}>{g.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:'1rem'}}>
        <GuideCard title="How it works" accent="var(--navy)">
          <GuideList items={[
            <>The skill fires on <strong>turn 1</strong>, as soon as a general holding the role is set in your formation.</>,
            <>One Leader <em>and</em> one Strategist per formation. You can run both at once, but only one of each.</>,
            <>The effect differs for every general, so <em>which</em> general holds the slot matters as much as filling it.</>,
            <>The two penalties are nowhere near equal. Losing the Strategist costs one turn; losing the Leader costs the battle, so put that slot on someone unlikely to be focused down.</>,
          ]}/>
        </GuideCard>
      </div>
    </div>
  )
}

export function CWGuidePage(){
  const navigate=useNavigate()
  const {section}=useParams()
  const active=GUIDE_SECTIONS.find(s=>s.id===section)?.id || 'basics'
  const[contentsOpen,setContentsOpen]=useState(false)
  const activeLabel=GUIDE_SECTIONS.find(s=>s.id===active)?.label||'Basics'
  const go=id=>{navigate(`/guide/${id}`);setContentsOpen(false)}
  return(
    <main className="guide-page">
      <header className="guide-head">
        <h1>Castle War Guide</h1>
        <p>Mechanics, status effects, terrain, targeting rules, and practical references for Castle War.</p>
      </header>
      <button type="button" className="guide-contents-toggle" aria-expanded={contentsOpen} aria-controls="guide-contents" onClick={()=>setContentsOpen(open=>!open)}>
        <span><small>Guide section</small><strong>{activeLabel}</strong></span>
        <span aria-hidden="true">{contentsOpen?'−':'+'}</span>
      </button>
      <nav id="guide-contents" className={`guide-section-tabs${contentsOpen?' guide-section-tabs-open':''}`} aria-label="Guide contents">
        {GUIDE_GROUPS.map(group=>(
          <div key={group} className="guide-group">
            <h2>{group}</h2>
            <div>
              {GUIDE_SECTIONS.filter(s=>s.category===group).map(s=>{
                const on=active===s.id
                return(
                  <button key={s.id} className="guide-tab" aria-pressed={on} onClick={()=>go(s.id)}>{s.label}</button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      {active==='basics' && <CastleWarBasicsSection/>}
      {active==='stats-screen' && <CWStatsScreenGuideSection/>}
      {active==='stats' && <CWStatsGuideSection/>}
      {active==='roles' && <RolesGuideSection/>}
      {active==='bandits' && <BanditHuntGuideSection/>}
      {active==='leaders' && <LeaderStrategistSection/>}
      {active==='debuffs' && <DebuffResistanceGuideSection/>}
      {active==='effects' && <StatusEffectsSection/>}
      {active==='matchups' && <UnitMatchupsSection/>}
      {active==='terrain' && <TerrainEffectsSection/>}
      {active==='types' && <SkillTypesSection/>}
      {active==='crystals' && <CrystalTypesSection/>}
      {active==='interactions' && <EffectInteractionsSection/>}
      {active==='targeting' && <TargetingRulesSection/>}
    </main>
  )
}


export const EFFECT_INTERACTIONS=[
  {
    type:'overwrite',
    label:'Overwrite Each Other',
    note:'Only the most recently applied effect stays active. Applying one removes the other.',
    groups:[
      {
        effects:[
          {name_en:'Provoke',       icon:'/icons/status/provoke.webp'},
          {name_en:'Less Likely to be Targeted', icon:'/icons/status/less_targeted.webp'},
        ],
      },
      {
        effects:[
          {name_en:'Confusion', icon:'/icons/status/confusion.webp'},
          {name_en:'Betrayal',  icon:'/icons/status/betrayal.webp'},
          {name_en:'Rampage',   icon:'/icons/status/berserk.webp'},
        ],
      },
    ],
  },
  {
    type:'stack',
    label:'Stack with Priority Order',
    note:'Both can be active at the same time. Attack Nullification triggers first and reduces damage to 0 — but both effects still consume a charge.',
    groups:[
      {
        effects:[
          {name_en:'Attack Nullification', icon:'/icons/status/nullify.webp'},
          {name_en:'Guard',                icon:'/icons/status/guard.webp'},
        ],
      },
    ],
  },
  {
    type:'guard_overwrite',
    label:'Guard Overwrites by Judgment Value',
    note:'Applying Guard to a character who already has Guard active does not always overwrite it. The system compares a judgment value for each: Reduction % × Remaining Charges. The higher value wins. If the new effect loses, the existing Guard is kept unchanged.',
    formula:'Judgment Value = Reduction % × Remaining Charges',
    example:'30% × 2 charges = 60  vs  70% × 1 charge = 70  →  70% overwrites',
    groups:[
      {
        effects:[
          {name_en:'Guard', icon:'/icons/status/guard.webp'},
        ],
      },
    ],
  },
]

export function EffectInteractionsSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        When two effects conflict, this determines which one takes precedence or whether both remain active.
      </p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        {EFFECT_INTERACTIONS.map(rule=>{
          const isOverwrite=rule.type==='overwrite'
          const isGuard=rule.type==='guard_overwrite'
          const accent=isOverwrite?'#e67e22':isGuard?'#8e44ad':'#2980b9'
          return(
            <div key={rule.type} style={{
              borderRadius:'12px',background:'var(--sur)',
              border:'1px solid var(--bdr)',borderLeft:`3px solid ${accent}`,
              padding:'1rem',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.35rem'}}>
                <span style={{
                  fontSize:'.7rem',fontWeight:700,letterSpacing:'.04em',textTransform:'uppercase',
                  color:accent,background:`${accent}22`,padding:'.15rem .55rem',borderRadius:'999px',
                }}>{rule.label}</span>
              </div>
              <p style={{fontSize:'.8rem',color:'var(--txt2)',margin:'0 0 .75rem',lineHeight:1.5}}>{rule.note}</p>
              {rule.formula &&(
                <div style={{
                  display:'flex',flexDirection:'column',gap:'.4rem',
                  padding:'.65rem .85rem',borderRadius:'8px',background:'var(--bg2)',
                  marginBottom:'.75rem',
                }}>
                  <div style={{fontSize:'.78rem',fontWeight:700,color:accent,fontFamily:'monospace'}}>{rule.formula}</div>
                  <div style={{fontSize:'.75rem',color:'var(--txt3)'}}>{rule.example}</div>
                </div>
              )}
              <div style={{display:'flex',flexDirection:'column',gap:'.6rem'}}>
                {rule.groups.map((g,gi)=>(
                  <div key={gi} style={{
                    display:'flex',alignItems:'center',flexWrap:'wrap',gap:'.5rem',
                    padding:'.6rem .75rem',borderRadius:'8px',background:'var(--bg2)',
                  }}>
                    {g.effects.map((e,ei)=>(
                      <span key={e.name_en} style={{display:'flex',alignItems:'center',gap:'.35rem'}}>
                        <img src={e.icon} alt={e.name_en} style={{width:26,height:26,flexShrink:0,imageRendering:'auto'}}/>
                        <span style={{fontSize:'.82rem',fontWeight:600,color:'var(--txt)'}}>{e.name_en}</span>
                        {ei<g.effects.length-1 &&
                          <span style={{fontSize:'.75rem',color:'var(--txt3)',margin:'0 .1rem'}}>
                            {isOverwrite?'↔':'→'}
                          </span>
                        }
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const TARGETING_RULES=[
  {
    title:'Skill Target Selection Priority',
    body:'When a target has a special status effect, target selection follows this order:',
    list:[
      <>Status effect presence (e.g. <span style={{display:'inline-flex',alignItems:'center',gap:'.2rem',whiteSpace:'nowrap'}}><img src="/icons/status/provoke.webp" alt="Provoke" style={{width:18,height:18}}/><b>Provocation</b></span>, <span style={{display:'inline-flex',alignItems:'center',gap:'.2rem',whiteSpace:'nowrap'}}><img src="/icons/status/confusion.webp" alt="Confusion" style={{width:18,height:18}}/><b>Confusion</b></span>)</>,
      <>The skill's specified priority (e.g. highest attack, lowest defense)</>,
    ],
  },
  {
    title:'Unmet Target Conditions',
    body:'If a skill specifies a target that does not exist on the field (e.g. "enemy Qin general" when no Qin general is present), the effect simply fails to activate.',
  },
  {
    title:'Random Targeting',
    body:'Skills that target a "random enemy general" pick randomly with no restrictions, and ignore Provocation.',
  },
  {
    title:'Provocation',
    icon:'/icons/status/provoke.webp',
    bullets:[
      'Concentrates incoming enemy damage attacks on the provoked unit.',
      'Does not affect targeting of non-damage skills.',
      'Does not stack — reapplying overwrites the existing state.',
    ],
  },
  {
    title:'Confusion',
    icon:'/icons/status/confusion.webp',
    bullets:[
      'The affected unit attacks both allies and enemies indiscriminately.',
      'Uses skills if available, otherwise normal attacks.',
      'If no allies remain alive, attacks enemies normally.',
      'Does not stack — reapplying refreshes to the longer duration.',
      'Cannot be applied to units already under Betrayal or Rampage (those take priority); however, Betrayal or Rampage applied to a Confused unit overwrites Confusion.',
    ],
  },
]

export function TargetingRulesSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        How skills choose their targets, and how status effects influence targeting.
      </p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        {TARGETING_RULES.map((r,i)=>(
          <div key={i} style={{
            borderRadius:'12px',background:'var(--sur)',
            border:'1px solid var(--bdr)',borderLeft:'3px solid #2980b9',
            padding:'1rem',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.4rem'}}>
              {r.icon && <img src={r.icon} alt={r.title} style={{width:24,height:24}}/>}
              <h3 style={{fontSize:'.95rem',fontWeight:800,color:'var(--txt)',margin:0}}>{r.title}</h3>
            </div>
            {r.body && <p style={{fontSize:'.82rem',color:'var(--txt2)',margin:'0 0 .5rem',lineHeight:1.5}}>{r.body}</p>}
            {r.list &&(
              <ol style={{margin:'.25rem 0 0 1.1rem',padding:0,fontSize:'.82rem',color:'var(--txt2)',lineHeight:1.6}}>
                {r.list.map((item,j)=><li key={j} style={{marginBottom:'.2rem'}}>{item}</li>)}
              </ol>
            )}
            {r.bullets &&(
              <ul style={{margin:'.25rem 0 0 1.1rem',padding:0,fontSize:'.82rem',color:'var(--txt2)',lineHeight:1.6}}>
                {r.bullets.map((b,j)=><li key={j} style={{marginBottom:'.2rem'}}>{b}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function EffectCard({entry,accent}){
  return(
    <div style={{
      display:'flex',gap:'.75rem',alignItems:'flex-start',
      padding:'.75rem',borderRadius:'12px',
      background:'var(--sur)',border:'1px solid var(--bdr)',
      borderLeft:`3px solid ${accent}`,
    }}>
      <img src={entry.icon} alt="" style={{width:36,height:36,flexShrink:0,imageRendering:'auto'}}/>
      <div style={{minWidth:0,flex:1}}>
        <div style={{display:'flex',alignItems:'baseline',gap:'.5rem',flexWrap:'wrap',marginBottom:'.2rem'}}>
          <div style={{fontWeight:700,fontSize:'.92rem',color:'var(--txt)'}}>{entry.name_en}</div>
          <div style={{fontSize:'.72rem',color:'var(--txt3)'}}>{entry.name_jp}</div>
        </div>
        <div style={{fontSize:'.78rem',color:'var(--txt2)',lineHeight:1.45}}>{entry.description}</div>
      </div>
    </div>
  )
}

export function StatusEffectsSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        Buffs and debuffs that can be applied during Castle Wars battles.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'1.25rem'}}>
        <div>
          <h3 style={{fontSize:'1rem',fontWeight:800,color:'#27ae60',marginBottom:'.75rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#27ae60'}}/>
            Buffs ({statusEffects.buffs.length})
          </h3>
          <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
            {statusEffects.buffs.map(e=><EffectCard key={e.name_en} entry={e} accent="#27ae60"/>)}
          </div>
        </div>
        <div>
          <h3 style={{fontSize:'1rem',fontWeight:800,color:'#c0392b',marginBottom:'.75rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#c0392b'}}/>
            Debuffs ({statusEffects.debuffs.length})
          </h3>
          <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
            {statusEffects.debuffs.map(e=><EffectCard key={e.name_en} entry={e} accent="#c0392b"/>)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function UnitMatchupsSection(){
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        Damage between unit types follows a rock-paper-scissors relationship.
      </p>
      <div style={{textAlign:'center',marginBottom:'1.75rem'}}>
        <img src={unitMatchups.chart_image} alt="Unit matchup chart" loading="lazy" decoding="async" style={{display:'block',margin:'0 auto',maxWidth:'min(100%,520px)',height:'auto',boxSizing:'border-box'}}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'.75rem',marginBottom:'1.5rem'}}>
        {unitMatchups.rules.map((r,i)=>(
          <div key={i} style={{
            padding:'.75rem',borderRadius:'12px',
            background:'var(--sur)',border:'1px solid var(--bdr)',
            display:'flex',alignItems:'center',justifyContent:'center',gap:'.5rem',
          }}>
            <img src={r.icon_strong} alt={r.strong} loading="lazy" decoding="async" style={{width:32,height:32,objectFit:'contain',flexShrink:0}}/>
            <span style={{fontWeight:700,fontSize:'.85rem',color:'var(--txt)'}}>{r.strong}</span>
            <span style={{fontSize:'.75rem',color:'#27ae60',fontWeight:700,margin:'0 .25rem'}}>strong vs</span>
            <img src={r.icon_weak} alt={r.weak} loading="lazy" decoding="async" style={{width:32,height:32,objectFit:'contain',flexShrink:0,opacity:.6}}/>
            <span style={{fontSize:'.85rem',color:'var(--txt2)'}}>{r.weak}</span>
          </div>
        ))}
      </div>
      <div style={{
        padding:'.85rem 1rem',borderRadius:'12px',
        background:'var(--sur)',border:'1px solid var(--bdr)',
        display:'flex',alignItems:'center',gap:'.6rem',justifyContent:'center',flexWrap:'wrap',
      }}>
        <img src={unitMatchups.mutual.icon_left} alt="Infantry" loading="lazy" decoding="async" style={{width:32,height:32,objectFit:'contain',flexShrink:0}}/>
        <span style={{fontWeight:700,fontSize:'.85rem',color:'var(--txt)'}}>{unitMatchups.mutual.left}</span>
        <span style={{fontSize:'.85rem',color:'var(--txt3)'}}>↔</span>
        <span style={{fontWeight:700,fontSize:'.85rem',color:'var(--txt)'}}>{unitMatchups.mutual.right}</span>
        <span style={{fontSize:'.78rem',color:'var(--txt2)',width:'100%',textAlign:'center',marginTop:'.25rem'}}>{unitMatchups.mutual.note}</span>
      </div>
    </div>
  )
}

export function SkillTypesSection(){
  const types=[
    {jp:'戦技', data:skillTypesGlossary['戦技']},
    {jp:'軍略', data:skillTypesGlossary['軍略']},
    {jp:'内政', data:skillTypesGlossary['内政']},
  ]
  return(
    <div>
      <p style={{fontSize:'.82rem',color:'var(--txt3)',textAlign:'center',marginBottom:'1.5rem'}}>
        Every general's skill belongs to one of three categories.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'1rem'}}>
        {types.map(t=>(
          <div key={t.jp} style={{
            padding:'1rem',borderRadius:'12px',
            background:'var(--sur)',border:'1px solid var(--bdr)',
            borderTop:`4px solid ${t.data.color}`,
          }}>
            <div style={{display:'flex',alignItems:'baseline',gap:'.5rem',marginBottom:'.5rem'}}>
              <div style={{fontWeight:800,fontSize:'1.05rem',color:t.data.color}}>{t.data.en}</div>
              <div style={{fontSize:'.78rem',color:'var(--txt3)'}}>{t.jp}</div>
            </div>
            <div style={{fontSize:'.82rem',color:'var(--txt2)',lineHeight:1.5}}>{t.data.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
