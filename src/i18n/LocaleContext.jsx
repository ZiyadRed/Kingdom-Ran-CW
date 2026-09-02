/**
 * Locale context for RanHQ.
 *
 * Exposes the current locale registry entry to the component tree. The URL is
 * resolved before mount, so consumers can read direction/labels/prefixes
 * without duplicating routing logic or causing a locale flash.
 */
import { createContext, useContext } from 'react'
import { DEFAULT_LOCALE } from './locales.js'

/** Defaults to the English entry so consumers outside the provider never crash. */
export const LocaleContext = createContext(DEFAULT_LOCALE)

export function LocaleProvider({ locale, children }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

/** Returns the current locale registry entry. */
export function useLocale() {
  return useContext(LocaleContext)
}
