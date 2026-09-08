import { useEffect, useRef } from 'react'
import './mobile-detail.css'

// The responsive detail is a page, not a dialog. CSS removes covered content
// from layout, hit testing and the accessibility tree even before hydration.
export function useMobileDetailFocus(selectedId) {
  const layoutRef=useRef(null)
  const previousId=useRef(null)
  useEffect(()=>{
    const media=window.matchMedia('(max-width: 768px)')
    const layout=layoutRef.current
    const focusDetail=()=>{
      if(media.matches&&selectedId) layout?.querySelector('.detail-name')?.focus({preventScroll:true})
    }
    if(selectedId) focusDetail()
    else if(previousId.current&&media.matches){
      const card=[...(layout?.querySelectorAll('[data-detail-id]')||[])].find(node=>node.dataset.detailId===String(previousId.current))
      const search=[...(layout?.querySelectorAll('input[type="search"]')||[])].find(node=>node.getClientRects().length)
      ;(card||search)?.focus({preventScroll:true})
      card?.scrollIntoView({block:'nearest'})
    }
    previousId.current=selectedId
    media.addEventListener('change',focusDetail)
    return ()=>media.removeEventListener('change',focusDetail)
  },[selectedId])
  return layoutRef
}
