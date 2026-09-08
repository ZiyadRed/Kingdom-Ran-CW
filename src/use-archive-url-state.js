import {startTransition,useEffect,useRef,useState} from 'react'
import {useLocation,useNavigate} from 'react-router-dom'
import {ARCHIVE_RETURN_KEY,archiveStateSearch,readArchiveUrlState} from './archive-url-state.js'

export function useArchiveUrlState(factionIds,selected){
  const location=useLocation()
  const navigate=useNavigate()
  const [hydrated,setHydrated]=useState(false)
  const initialized=useRef(false)
  const isCollection=location.pathname==='/archive/characters'
  const defaultFaction=selected?.country||'qin'
  const state=readArchiveUrlState(hydrated?location.search:'',factionIds,defaultFaction)
  useEffect(()=>{
    if(initialized.current) return
    initialized.current=true
    // Static route HTML has no query-dependent content. Restore only after
    // hydration; this transition also lets the outer Suspense boundary settle.
    let returnSearch=''
    if(isCollection&&!location.search){
      try{returnSearch=sessionStorage.getItem(ARCHIVE_RETURN_KEY)||''}catch{/* URL state still works when storage is unavailable. */}
    }
    startTransition(()=>{
      setHydrated(true)
      if(isCollection&&!location.search) navigate({pathname:location.pathname,search:archiveStateSearch(readArchiveUrlState(returnSearch,factionIds))},{replace:true})
    })
  },[factionIds,isCollection,location.pathname,location.search,navigate])
  useEffect(()=>{
    if(!hydrated||!location.search||(!isCollection&&!selected)) return
    // A per-tab return bookmark is used only on a fresh collection entry with
    // no URL state. Explicit URLs and browser history always take precedence.
    try{sessionStorage.setItem(ARCHIVE_RETURN_KEY,archiveStateSearch(readArchiveUrlState(location.search,factionIds,defaultFaction)))}catch{/* Optional return bookmark. */}
  },[hydrated,location.search,factionIds,defaultFaction,isCollection,selected])
  const update=(patch,{replace=false}={})=>{
    const current=readArchiveUrlState(location.search,factionIds,defaultFaction)
    setHydrated(true)
    navigate({pathname:'/archive/characters',search:archiveStateSearch({...current,...patch})},{replace:replace&&!selected})
  }
  return {...state,returnSearch:archiveStateSearch(state),setQuery:query=>update({query},{replace:true}),setFaction:faction=>update({faction,query:''})}
}
