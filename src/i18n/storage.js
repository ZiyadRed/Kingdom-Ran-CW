/**
 * Locale preference storage (planned key: `ranhq-locale`).
 *
 * The URL remains the source of truth for the active locale. The stored
 * preference is written only after an explicit language switch and never
 * triggers a redirect on its own.
 *
 * All access is wrapped so localStorage unavailability (private mode, blocked
 * storage, SSR) degrades to a no-op instead of throwing.
 */
import { getLocale } from './locales.js'

/** Planned localStorage key for the user's locale preference. */
export const LOCALE_STORAGE_KEY = 'ranhq-locale'

/**
 * Read the stored locale preference, if any.
 * Returns the locale registry entry or null when absent/invalid/disabled.
 * Never redirects and never changes the URL.
 */
export function readLocalePreference() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (!raw) return null
    const locale = getLocale(raw)
    return locale && locale.enabled ? locale : null
  } catch {
    return null
  }
}

/**
 * Persist a locale preference. Returns true on success, false when the code
 * is unknown/disabled or storage is unavailable. Enabled locales, including
 * Arabic, are persisted so the next visit keeps the selected language.
 */
export function writeLocalePreference(code) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const locale = getLocale(code)
    if (!locale || !locale.enabled) return false
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale.code)
    return true
  } catch {
    return false
  }
}
