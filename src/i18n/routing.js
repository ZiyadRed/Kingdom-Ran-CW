/**
 * Pure routing helpers for URL-derived locales.
 *
 * The URL is the source of truth: the first exact path segment decides the
 * locale. English has no prefix; Japanese is `/ja` and Arabic is `/ar`.
 * Unknown prefixes (e.g. `/jamaica`) are not treated as locales — no
 * redirects are ever triggered from here, and browser-language detection is
 * intentionally not implemented.
 *
 * All functions are pure (pathname in, value out) so they are safe to test
 * and to call before React mounts.
 */
import { DEFAULT_LOCALE, enabledLocales } from './locales.js'

// First path segment: leading slash, then everything up to the next slash,
// '?' or '#'. `/jamaica` yields `jamaica`; `/ja/archive` yields `ja`.
const FIRST_SEGMENT_RE = /^\/([^/?#]+)/

/**
 * Resolve the locale entry for a pathname by matching the first exact path
 * segment against ENABLED locales' route prefixes. Any other path (root,
 * unprefixed, unknown prefix, disabled prefix) resolves to the default locale.
 *
 * Examples:
 *   '/archive'                        -> en
 *   '/ja/archive/characters/ka'       -> ja
 *   '/jamaica'                        -> en (NOT ja)
 *   '/ar/archive'                     -> ar
 *   '/'                               -> en
 */
export function localeFromPathname(pathname) {
  if (!pathname) return DEFAULT_LOCALE
  const match = FIRST_SEGMENT_RE.exec(pathname)
  const first = match ? match[1] : null
  if (first) {
    const prefixed = enabledLocales().find(
      (l) => l.routePrefix && l.routePrefix === `/${first}`,
    )
    if (prefixed) return prefixed
  }
  return DEFAULT_LOCALE
}

/**
 * The Router `basename` for a locale entry: its route prefix, or '' for the
 * unprefixed default. Pass this to <BrowserRouter basename={...}> so the same
 * route tree serves both '/archive/...' and '/ja/archive/...'.
 */
export function localeBasename(locale) {
  if (!locale || !locale.routePrefix) return ''
  return locale.routePrefix
}

/**
 * Strip a locale's own route prefix from a pathname, but ONLY when the prefix
 * actually matches (exact segment boundary). Non-matching paths are returned
 * unchanged.
 *
 *   stripLocalePrefix('/ja/archive', jaLocale) -> '/archive'
 *   stripLocalePrefix('/ja',         jaLocale) -> '/'
 *   stripLocalePrefix('/jamaica',    jaLocale) -> '/jamaica' (unchanged)
 *   stripLocalePrefix('/archive',    enLocale) -> '/archive' (unchanged)
 */
export function stripLocalePrefix(pathname, locale) {
  const prefix = locale && locale.routePrefix
  if (!prefix || !pathname) return pathname
  if (pathname === prefix) return '/'
  if (pathname.startsWith(prefix + '/')) return pathname.slice(prefix.length)
  return pathname
}

/**
 * Build a locale-prefixed path from an app path (may or may not start with '/').
 *
 *   localePrefixedPath('/archive', jaLocale) -> '/ja/archive'
 *   localePrefixedPath('archive',  enLocale) -> '/archive'
 *   localePrefixedPath('/builder', jaLocale) -> '/ja/builder'
 */
export function localePrefixedPath(path, locale) {
  const prefix = locale && locale.routePrefix
  const normalized = path && path.startsWith('/') ? path : `/${path || ''}`
  if (!prefix) return normalized
  return normalized === '/' ? prefix : `${prefix}${normalized}`
}
