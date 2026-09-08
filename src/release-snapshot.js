import { startTransition, useEffect, useState } from 'react'

export const RELEASE_SNAPSHOT_ATTRIBUTE = 'data-ranhq-release-time'
const validTime = value => Number.isSafeInteger(value) && value >= 0
export function parseReleaseSnapshot(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return 0
  const time = Number(value)
  return validTime(time) ? time : 0
}

// Prerender sets this once before importing any route/data module. Every HTML
// document carries that same instant; the browser never guesses its SSR time.
let documentSnapshot = typeof document === 'undefined'
  ? Date.now()
  : document.documentElement.hasAttribute(RELEASE_SNAPSHOT_ATTRIBUTE)
    ? parseReleaseSnapshot(document.documentElement.getAttribute(RELEASE_SNAPSHOT_ATTRIBUTE))
    : document.getElementById('root')?.hasChildNodes() ? 0 : Date.now()
export const getDocumentReleaseSnapshot = () => documentSnapshot
export function setDocumentReleaseSnapshot(time) {
  if (!validTime(time)) throw new Error('Invalid release snapshot')
  documentSnapshot = time
}

export const releaseStage = (times, now) => times.reduce((stage, time) => time <= now ? Math.max(stage, time) : stage, 0)
export const nextReleaseDelay = (times, now) => {
  const next = times.find(time => time > now)
  // Browsers cap setTimeout at a signed 32-bit delay. Recheck long waits.
  return next === undefined ? null : Math.min(next - now, 2_147_483_647)
}

export function useReleaseStage(times) {
  const [stage, setStage] = useState(() => releaseStage(times, documentSnapshot))
  useEffect(() => {
    let timer
    const refresh = () => {
      clearTimeout(timer)
      const now = Date.now()
      // Nonurgent updates let any surrounding lazy boundary finish hydrating;
      // do not replace the route or reset its browser-restored state.
      startTransition(() => setStage(releaseStage(times, now)))
      const delay = nextReleaseDelay(times, now)
      if (delay !== null) timer = setTimeout(refresh, delay)
    }
    refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pageshow', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [times])
  return stage
}
