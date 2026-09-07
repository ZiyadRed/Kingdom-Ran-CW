import { useCallback, useEffect } from 'react'
import { useHydratedState } from './use-hydrated-state.js'

// Both calculators restore after hydration and write only committed edits.
// Invalid/unavailable storage leaves a usable session and is never overwritten
// merely by opening the tool. Reset is an explicit edit, so it is persisted.
export function useStoredDraft(key, createDefault, normalize) {
  const read = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? normalize(JSON.parse(raw)) : createDefault()
    } catch {
      return createDefault()
    }
  }, [key, createDefault, normalize])
  const [draft, setDraft, changed] = useHydratedState(createDefault, read)
  useEffect(() => {
    if (!changed) return
    try {
      const serialized = JSON.stringify(normalize(draft))
      if (window.localStorage.getItem(key) !== serialized) window.localStorage.setItem(key, serialized)
    } catch {
      // The session remains editable if private mode/quota prevents saving.
    }
  }, [key, draft, changed, normalize])
  return [draft, setDraft]
}
