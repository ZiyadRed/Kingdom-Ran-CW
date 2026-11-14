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
// Image tiles show a neutral skeleton (CSS) until the browser reports the
// image loaded; `is-loaded` is set on load and for already-cached images.
export const markImageLoaded = image => {
  if (image?.complete && image.naturalWidth > 0) image.classList.add('is-loaded')
}
export const onImageLoaded = event => event.currentTarget.classList.add('is-loaded')

// `eager` loads the first visible row immediately; `priority` (default: same
// as eager) additionally asks for high fetch priority, used for the first few.
export function ArchiveImage({ src, srcSet, sizes, alt, title, enabled, eager = false, priority = eager, fade = false, style, className = 'banner-img' }) {
  const ref = useRef(null)
  const [revealed, setRevealed] = useState(false)
  const active = enabled && (eager || revealed)
  useEffect(() => {
    if (active) markImageLoaded(ref.current)
  }, [active, src])
  // React 18 passes this newer HTML attribute through in lowercase; its
  // camelCase form logs an unknown-property warning in development.
  const fetchPriority = eager && priority ? { fetchpriority: 'high' } : {}
  useEffect(() => {
    if (!enabled || eager || revealed) return
    const element = ref.current
    if ('IntersectionObserver' in window) {
      // Start a little before a tile scrolls into view so it is rarely blank.
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      }, { rootMargin: '240px 0px' })
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
    sizes={sizes} alt={alt} title={title} className={`archive-img ${fade ? 'fade-img ' : ''}${className}`.trim()} style={{...style, ...(!active ? { visibility: 'hidden' } : {})}}
    onLoad={onImageLoaded}
    loading={eager ? 'eager' : 'lazy'} {...fetchPriority} decoding="async" />
}
