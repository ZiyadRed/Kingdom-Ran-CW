import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  DEFAULT_LOCALE_CODE,
  LOCALES,
  enabledLocales,
  getLocale,
  isDefaultLocale,
  isLocaleEnabled,
} from './locales.js'

describe('locale registry', () => {
  it('declares en, ja, and ar with full metadata', () => {
    expect(LOCALES.map((l) => l.code)).toEqual(['en', 'ja', 'ar'])
  })

  it('describes English as enabled, default, unprefixed, ltr', () => {
    const en = getLocale('en')
    expect(en).toMatchObject({
      code: 'en',
      bcp47: 'en',
      direction: 'ltr',
      nativeLabel: 'English',
      enabled: true,
      default: true,
      routePrefix: '',
      numberLocale: 'en-US',
      ogLocale: 'en_US',
    })
  })

  it('describes Japanese as enabled, non-default, /ja-prefixed, ltr', () => {
    const ja = getLocale('ja')
    expect(ja).toMatchObject({
      code: 'ja',
      bcp47: 'ja',
      direction: 'ltr',
      nativeLabel: '日本語',
      enabled: true,
      default: false,
      routePrefix: '/ja',
      numberLocale: 'ja-JP',
      ogLocale: 'ja_JP',
    })
  })

  it('describes Arabic as enabled, non-default, /ar-prefixed, rtl', () => {
    const ar = getLocale('ar')
    expect(ar).toMatchObject({
      code: 'ar',
      bcp47: 'ar',
      direction: 'rtl',
      nativeLabel: 'العربية',
      enabled: true,
      default: false,
      routePrefix: '/ar',
      // Arabic text, Western digits — see the note in locales.js.
      numberLocale: 'ar-EG-u-nu-latn',
      ogLocale: 'ar_EG',
    })
  })

  it('pins Arabic to the Latin numbering system', () => {
    const ar = getLocale('ar')
    expect(new Intl.NumberFormat(ar.numberLocale).resolvedOptions().numberingSystem).toBe('latn')
  })

  it('default locale is English', () => {
    expect(DEFAULT_LOCALE.code).toBe('en')
    expect(DEFAULT_LOCALE_CODE).toBe('en')
    expect(isDefaultLocale(DEFAULT_LOCALE)).toBe(true)
  })

  it('getLocale returns null for unknown codes', () => {
    expect(getLocale('xx')).toBeNull()
    expect(getLocale('')).toBeNull()
    expect(getLocale(null)).toBeNull()
  })

  it('enabledLocales includes the first-class Arabic locale', () => {
    expect(enabledLocales().map((l) => l.code)).toEqual(['en', 'ja', 'ar'])
  })

  it('isLocaleEnabled matches the registry flags', () => {
    expect(isLocaleEnabled('en')).toBe(true)
    expect(isLocaleEnabled('ja')).toBe(true)
    expect(isLocaleEnabled('ar')).toBe(true)
    expect(isLocaleEnabled('xx')).toBe(false)
  })
})
