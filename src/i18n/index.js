/**
 * RanHQ i18n module — public surface for the localization runtime.
 *
 * Import from '@/i18n' (or './i18n/index.js') instead of individual files so
 * later phases get a stable API surface.
 */
export * from './locales.js'
export * from './routing.js'
export { default as i18n, initI18n, CATALOGS } from './i18n.js'
export { LocaleContext, LocaleProvider, useLocale } from './LocaleContext.jsx'
export { formatNumber, pluralSuffix } from './format.js'
export {
  LOCALE_STORAGE_KEY,
  readLocalePreference,
  writeLocalePreference,
} from './storage.js'
