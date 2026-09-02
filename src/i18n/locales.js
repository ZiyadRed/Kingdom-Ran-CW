/**
 * Central locale registry for RanHQ.
 *
 * Single source of truth for every locale's metadata (codes, direction,
 * labels, route prefixes, formatting/OG locales). Do not scatter locale
 * metadata across the app — import from here.
 *
 * Locale metadata is intentionally centralized here. English keeps the
 * existing unprefixed URLs; Japanese and Arabic use exact URL prefixes so
 * bookmarks and shared links remain unambiguous.
 */
export const LOCALES = [
  {
    code: 'en',
    bcp47: 'en',
    direction: 'ltr',
    nativeLabel: 'English',
    enabled: true,
    default: true,
    routePrefix: '', // unprefixed — English is served at the root
    numberLocale: 'en-US',
    ogLocale: 'en_US',
  },
  {
    code: 'ja',
    bcp47: 'ja',
    direction: 'ltr',
    nativeLabel: '日本語',
    enabled: true,
    default: false,
    routePrefix: '/ja',
    numberLocale: 'ja-JP',
    ogLocale: 'ja_JP',
  },
  {
    code: 'ar',
    bcp47: 'ar',
    direction: 'rtl',
    nativeLabel: 'العربية',
    enabled: true,
    default: false,
    routePrefix: '/ar',
    // Arabic text, Western digits. `ar-EG` alone resolves to the `arab`
    // numbering system and renders ٢٬٧٠٠, which clashed with the game client
    // and with every number the site does not pass through Intl (skill
    // percentages, ranks, counts, version labels). The `-u-nu-latn` extension
    // pins `latn` explicitly rather than relying on a CLDR default.
    numberLocale: 'ar-EG-u-nu-latn',
    ogLocale: 'ar_EG',
  },
]

/** The default (fallback) locale entry — currently English. */
export const DEFAULT_LOCALE = LOCALES.find((l) => l.default)

/** Code of the default locale, e.g. 'en'. */
export const DEFAULT_LOCALE_CODE = DEFAULT_LOCALE.code

/**
 * Look up a locale registry entry by its `code`.
 * Returns `null` for unknown codes (never a partial object).
 */
export function getLocale(code) {
  if (!code) return null
  return LOCALES.find((l) => l.code === code) || null
}

/** Whether a locale code is registered AND enabled. */
export function isLocaleEnabled(code) {
  const locale = getLocale(code)
  return Boolean(locale && locale.enabled)
}

/** Registry entries for locales that are currently enabled. */
export function enabledLocales() {
  return LOCALES.filter((l) => l.enabled)
}

/** Whether a locale entry is the default one. */
export function isDefaultLocale(locale) {
  return Boolean(locale && locale.default)
}
