import { useEffect, useRef, useState } from 'react'

// A detail URL has the same source-free gallery on the server and the first
// client render. Only a desktop layout may reveal that gallery beside detail.
export function useArchiveGalleryVisible(hasSelection) {
  const [desktop, setDesktop] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 769px)')
    const sync = () => setDesktop(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  return !hasSelection || desktop
}

// Keep every card/link in the document, with its existing geometry. Browser
// lazy-loading alone starts too many offscreen requests on slow connections.
// Remember revealed art across detail/back navigation, but withhold sources
// while the mobile detail panel covers the gallery.
export function ArchiveImage({ src, srcSet, sizes, alt, enabled, eager = false, className = 'banner-img' }) {
  const ref = useRef(null)
  const [revealed, setRevealed] = useState(false)
  const active = enabled && (eager || revealed)
  // React 18 passes this newer HTML attribute through in lowercase; its
  // camelCase form logs an unknown-property warning in development.
  const priority = eager ? { fetchpriority: 'high' } : {}
  useEffect(() => {
    if (!enabled || eager || revealed) return
    const element = ref.current
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      })
      observer.observe(element)
      return () => observer.disconnect()
    }
    // Older engines still reveal only visible art. Capture also sees the
    // desktop gallery's own scroll container, without replacing its scrolling.
    const revealVisible = () => {
      const rect = element.getBoundingClientRect()
      if (rect.width && rect.height && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth) setRevealed(true)
    }
    revealVisible()
    window.addEventListener('scroll', revealVisible, true)
    window.addEventListener('resize', revealVisible)
    return () => {
      window.removeEventListener('scroll', revealVisible, true)
      window.removeEventListener('resize', revealVisible)
    }
  }, [enabled, eager, revealed])

  return <img ref={ref} src={active ? src : undefined} srcSet={active ? srcSet : undefined}
    sizes={sizes} alt={alt} className={className} style={active ? undefined : { visibility: 'hidden' }}
    loading={eager ? 'eager' : 'lazy'} {...priority} decoding="async" />
}
