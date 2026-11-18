// Pure helpers for the Party Builder buff summary: value formatting and the
// row classification shared by the phone list and the saved image.
//
//   shared  every general in the formation shows the same value (incl. Guard
//           duration / alternative count), so one "All N" value replaces N cells
//   single  exactly one general has the stat (or the formation has one general)
//   varies  anything else: one value per general
//
// The classification only changes presentation. Values, sources and the Guard
// "highest instance only" rule come unchanged from calcCharBuffs.

export function formatBuffNumber(value){
  return Number.isInteger(value)?String(value):value.toFixed(1)
}

/**
 * Display parts for one general's bucket of a stat.
 * tone is 'good' for the formation (green) and 'bad' (red); inverse stats such
 * as Morale Consumption are good when they go down.
 */
export function buffCellParts(stat,buff,{inverseStats=new Set(),specialStats=new Set()}={}){
  if(!buff) return []
  const up=buff.up||0
  const down=buff.down||0
  if(specialStats.has(stat)) return up>0?[{text:`● ${up}×`,tone:'good',flag:true}]:[]
  if(stat==='Guard'&&buff.instances?.length){
    const top=sortedGuardInstances(buff)[0]
    return [{text:`+${formatBuffNumber(top.val)}%`,tone:'good'}]
  }
  const inverse=inverseStats.has(stat)
  const parts=[]
  if(up>0) parts.push({text:`+${formatBuffNumber(up)}%`,tone:inverse?'bad':'good'})
  if(down>0) parts.push({text:`−${formatBuffNumber(down)}%`,tone:inverse?'good':'bad'})
  return parts
}

export function sortedGuardInstances(buff){
  return [...(buff?.instances||[])].sort((a,b)=>b.val-a.val)
}

/** Parts plus the Guard extras, with a signature used to detect shared rows. */
export function buffCellInfo(stat,buff,options){
  const parts=buffCellParts(stat,buff,options)
  let duration=null
  let more=0
  if(stat==='Guard'&&buff?.instances?.length){
    const sorted=sortedGuardInstances(buff)
    duration=sorted[0].duration||null
    more=sorted.length-1
  }
  return {parts,duration,more,signature:JSON.stringify([parts.map(part=>`${part.text}|${part.tone}`),duration,more])}
}

/**
 * activeStats: one Map(stat -> bucket) per general, in formation order.
 * statRows: the stats to show, already sorted.
 */
export function classifyBuffRows(activeStats,statRows,options){
  const count=activeStats.length
  return statRows.map(stat=>{
    const cells=activeStats.map(map=>{
      const buff=map.get(stat)
      return buff?{buff,...buffCellInfo(stat,buff,options)}:null
    })
    const present=cells.flatMap((cell,index)=>cell?[index]:[])
    let kind='varies'
    if(count>1&&present.length===count&&cells.every(cell=>cell.signature===cells[0].signature)) kind='shared'
    else if(present.length===1) kind='single'
    return {stat,kind,cells,present}
  })
}

/** Canonical description of where one general's value comes from. */
export function buffSourceSignature(stat,buff){
  if(stat==='Guard'&&buff?.instances?.length){
    return JSON.stringify(buff.instances.map(instance=>[instance.owner?.id,instance.val,instance.duration||'',instance.skill?.name_en||'']).map(String).sort())
  }
  return JSON.stringify((buff?.sources||[]).map(source=>[source.owner?.id,source.dir,source.contribution,source.skill?.name_en||'',source.effect?.effect||'']).map(String).sort())
}

/**
 * For a shared row: generals whose values come from exactly the same skills
 * are listed once, so "All 4" does not repeat four identical breakdowns.
 */
export function groupCellsBySources(stat,cells){
  const groups=[]
  cells.forEach((cell,index)=>{
    if(!cell) return
    const signature=buffSourceSignature(stat,cell.buff)
    let group=groups.find(entry=>entry.signature===signature)
    if(!group){
      group={signature,indexes:[],buff:cell.buff}
      groups.push(group)
    }
    group.indexes.push(index)
  })
  return groups
}

/** Flatten calcTeamEnemyDebuffs output into display rows (down first, as before). */
export function enemyDebuffRows(enemyDebuffs){
  return Object.entries(enemyDebuffs||{}).flatMap(([target,bucket])=>{
    if(!bucket||typeof bucket!=='object') return []
    const {up={},down={},sources={}}=bucket
    return [
      ...Object.keys(down).filter(stat=>(down[stat]||0)>0).map(stat=>({target,stat,dir:'down',value:down[stat],sources:sources[`down|${stat}`]||[]})),
      ...Object.keys(up).filter(stat=>(up[stat]||0)>0).map(stat=>({target,stat,dir:'up',value:up[stat],sources:sources[`up|${stat}`]||[]})),
    ]
  })
}

export function enemyDebuffText(row){
  return `${row.dir==='down'?'−':'+'}${formatBuffNumber(row.value)}%`
}
