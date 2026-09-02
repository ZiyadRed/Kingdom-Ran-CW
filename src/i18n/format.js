/**
 * Locale-aware number formatting based on Intl.NumberFormat.
 *
 * Formatters are cached per (locale, options) so pages and data adapters can
 * share consistent grouping and separators without ad-hoc Intl usage.
 */
import { DEFAULT_LOCALE } from './locales.js'

const formatterCache = new Map()
const pluralCache = new Map()

function cacheKey(intlLocale, options) {
  return `${intlLocale}|${JSON.stringify(options || null)}`
}

/**
 * The i18next key suffix for a value's CLDR plural category in a locale, e.g.
 * `_two` for 2 in Arabic or `_one` for 1 in English.
 *
 * Callers that display grouped numbers must pass an already-formatted STRING
 * as i18next's `count`, which destroys i18next's own plural selection. This
 * lets them keep both: select the key from the real number, interpolate the
 * formatted one.
 *
 * @param {number} value
 * @param {object} [locale] A locale registry entry (defaults to English).
 * @returns {string} A suffix such as '_one', or '' when the value is not finite.
 */
export function pluralSuffix(value, locale = DEFAULT_LOCALE) {
  if (!Number.isFinite(value)) return ''
  const tag = (locale && locale.bcp47) || DEFAULT_LOCALE.bcp47
  let rules = pluralCache.get(tag)
  if (!rules) {
    try {
      rules = new Intl.PluralRules(tag)
    } catch {
      return ''
    }
    pluralCache.set(tag, rules)
  }
  return `_${rules.select(value)}`
}

/**
 * Format a number for a locale registry entry.
 *
 * @param {number} value The numeric value to format.
 * @param {object} [locale] A locale registry entry (defaults to English).
 * @param {object} [options] Intl.NumberFormat options (style, maximumFractionDigits, ...).
 * @returns {string} The formatted number.
 */
export function formatNumber(value, locale = DEFAULT_LOCALE, options) {
  const intlLocale = (locale && locale.numberLocale) || DEFAULT_LOCALE.numberLocale
  const key = cacheKey(intlLocale, options)

  let formatter = formatterCache.get(key)
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(intlLocale, options || undefined)
    } catch {
      // Unknown/unsupported locale must never crash the app — degrade to the
      // default locale's formatter, or plain string output as a last resort.
      try {
        formatter = new Intl.NumberFormat(DEFAULT_LOCALE.numberLocale, options || undefined)
      } catch {
        return String(value)
      }
    }
    formatterCache.set(key, formatter)
  }
  return formatter.format(value)
}
