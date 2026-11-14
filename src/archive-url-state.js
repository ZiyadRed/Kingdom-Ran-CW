export const ARCHIVE_QUERY_LIMIT=200
export const ARCHIVE_RETURN_KEY='ranhq:archive-return-v1'
// Optional Archive filters (UX plan 2026-11-14). URL values are lowercase;
// unknown or repeated values fail closed to "no filter". The keys are only
// present in the parsed state when a valid filter is set, so existing
// `?faction=` / `?q=` links parse and serialize exactly as before.
export const ARCHIVE_UNIT_FILTERS=['Infantry','Cavalry','Archer','Shield']
export const ARCHIVE_RARITY_FILTERS=['N','R','SR','UR','LG']

function readFilter(params,key,allowed){
  const values=params.getAll(key)
  if(values.length!==1) return null
  return allowed.find(value=>value.toLowerCase()===values[0].toLowerCase())||null
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
  const rarity=readFilter(params,'rarity',ARCHIVE_RARITY_FILTERS)
  return {query,faction,...(unit?{unit}:{}),...(rarity?{rarity}:{})}
}

export function archiveStateSearch({query,faction,unit,rarity}){
  const params=new URLSearchParams({faction})
  if(query) params.set('q',query)
  if(unit&&ARCHIVE_UNIT_FILTERS.includes(unit)) params.set('unit',unit.toLowerCase())
  if(rarity&&ARCHIVE_RARITY_FILTERS.includes(rarity)) params.set('rarity',rarity.toLowerCase())
  return `?${params}`
}
