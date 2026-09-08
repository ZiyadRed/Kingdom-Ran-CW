export const ARCHIVE_QUERY_LIMIT=200
export const ARCHIVE_RETURN_KEY='ranhq:archive-return-v1'

export function readArchiveUrlState(search,factionIds,defaultFaction='qin'){
  const params=new URLSearchParams(search)
  const queries=params.getAll('q')
  const factions=params.getAll('faction')
  const raw=queries.length===1?queries[0]:''
  const invalid=[...raw].some(char=>char.charCodeAt(0)<32||char==='\u007f'||char==='\ufffd')
  const query=raw.length<=ARCHIVE_QUERY_LIMIT&&!invalid?raw:''
  const faction=factions.length===1&&factionIds.includes(factions[0])?factions[0]:defaultFaction
  return {query,faction}
}

export function archiveStateSearch({query,faction}){
  const params=new URLSearchParams({faction})
  if(query) params.set('q',query)
  return `?${params}`
}
