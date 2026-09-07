import { startTransition, useCallback, useEffect, useRef, useState } from 'react'

// Static HTML and the first hydration render share the same default snapshot.
// Restoring browser state is nonurgent so an outer Suspense boundary can finish
// hydrating. Loading alone never requests a storage write. An early interaction
// applies to the saved value, not the temporary server default; a later restore
// cannot replace that interaction. The read cache also survives StrictMode's
// effect replay without reading or writing storage during render.
export function useHydratedState(createDefault, readSaved) {
  const [snapshot, setSnapshot] = useState(() => ({ value: createDefault(), loaded: false, changed: false }))
  const restored = useRef(null)
  const readOnce = useCallback(() => {
    if (!restored.current) restored.current = { value: readSaved() }
    return restored.current.value
  }, [readSaved])

  useEffect(() => {
    const value = readOnce()
    startTransition(() => setSnapshot(current => current.loaded ? current : { value, loaded: true, changed: false }))
  }, [readOnce])

  const update = useCallback(action => {
    const saved = readOnce()
    setSnapshot(current => {
      const previous = current.loaded ? current.value : saved
      const value = typeof action === 'function' ? action(previous) : action
      return current.loaded && Object.is(value, previous) ? current : { value, loaded: true, changed: true }
    })
  }, [readOnce])

  return [snapshot.value, update, snapshot.changed]
}
