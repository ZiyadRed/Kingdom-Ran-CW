import { ARCHIVE_EFFECT_FILTER_IDS, ARCHIVE_ROLE_FILTERS } from './archive-effect-filters.js'

export const ARCHIVE_QUERY_LIMIT=200
export const ARCHIVE_RETURN_KEY='ranhq:archive-return-v1'
// Optional Archive filters. URL values are lowercase; unknown or repeated
// values fail closed to "no filter". The keys are only present in the parsed
// state when a valid filter is set, so existing `?faction=` / `?q=` links parse
// and serialize exactly as before. The old `rarity` filter was retired
// (2026-11-23); a stale `?rarity=` is ignored and dropped on the next update.
export const ARCHIVE_UNIT_FILTERS=['Infantry','Cavalry','Archer','Shield']
export { ARCHIVE_ROLE_FILTERS }
// Effects are the one multi-select filter: `?effect=guard&effect=sure-hit`.
export const ARCHIVE_EFFECT_LIMIT=6

function readFilter(params,key,allowed){
  const values=params.getAll(key)
  if(values.length!==1) return null
  return allowed.find(value=>value.toLowerCase()===values[0].toLowerCase())||null
}

function readEffects(params){
  const values=params.getAll('effect').map(value=>value.toLowerCase())
  if(!values.length||values.length>ARCHIVE_EFFECT_LIMIT) return null
  if(new Set(values).size!==values.length) return null
  if(!values.every(value=>ARCHIVE_EFFECT_FILTER_IDS.includes(value))) return null
  // One canonical order, so the same selection always makes the same URL.
  return ARCHIVE_EFFECT_FILTER_IDS.filter(id=>values.includes(id))
}

export function readArchiveUrlState(search,factionIds,defaultFaction='all'){
  const params=new URLSearchParams(search)
  const queries=params.getAll('q')
  const factions=params.getAll('faction')
  const raw=queries.length===1?queries[0]:''
  const invalid=[...raw].some(char=>char.charCodeAt(0)<32||char==='\u007f'||char==='�')
  const query=raw.length<=ARCHIVE_QUERY_LIMIT&&!invalid?raw:''
  const faction=factions.length===1&&factionIds.includes(factions[0])?factions[0]:defaultFaction
  const unit=readFilter(params,'unit',ARCHIVE_UNIT_FILTERS)
  const role=readFilter(params,'role',ARCHIVE_ROLE_FILTERS)
  const effects=readEffects(params)
  return {query,faction,...(unit?{unit}:{}),...(role?{role}:{}),...(effects?{effects}:{})}
}

export function archiveStateSearch({query,faction,unit,role,effects}){
  const params=new URLSearchParams({faction})
  if(query) params.set('q',query)
  if(unit&&ARCHIVE_UNIT_FILTERS.includes(unit)) params.set('unit',unit.toLowerCase())
  if(role&&ARCHIVE_ROLE_FILTERS.includes(role)) params.set('role',role.toLowerCase())
  const selected=ARCHIVE_EFFECT_FILTER_IDS.filter(id=>effects?.includes(id)).slice(0,ARCHIVE_EFFECT_LIMIT)
  for(const id of selected) params.append('effect',id)
  return `?${params}`
}
