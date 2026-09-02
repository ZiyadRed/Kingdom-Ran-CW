import { describe, expect, it } from 'vitest'
import { getLocale } from './locales.js'
import {
  localeBasename,
  localeFromPathname,
  localePrefixedPath,
  stripLocalePrefix,
} from './routing.js'

const en = getLocale('en')
const ja = getLocale('ja')

describe('localeFromPathname', () => {
  it('resolves English for unprefixed routes and root', () => {
    expect(localeFromPathname('/').code).toBe('en')
    expect(localeFromPathname('/archive').code).toBe('en')
    expect(localeFromPathname('/archive/characters/ka').code).toBe('en')
    expect(localeFromPathname('/buffs').code).toBe('en')
    expect(localeFromPathname('/guide').code).toBe('en')
  })

  it('resolves Japanese for the exact /ja first segment', () => {
    expect(localeFromPathname('/ja/archive/characters/ka').code).toBe('ja')
    expect(localeFromPathname('/ja/archive').code).toBe('ja')
    expect(localeFromPathname('/ja').code).toBe('ja')
    expect(localeFromPathname('/ja/').code).toBe('ja')
  })

  it('does NOT treat /jamaica as Japanese (exact segment match)', () => {
    expect(localeFromPathname('/jamaica').code).toBe('en')
    expect(localeFromPathname('/ja-jp/archive').code).toBe('en')
    expect(localeFromPathname('/jaguar').code).toBe('en')
  })

  it('resolves the first-class Arabic locale for the exact /ar segment', () => {
    expect(localeFromPathname('/ar/archive').code).toBe('ar')
    expect(localeFromPathname('/ar').code).toBe('ar')
  })

  it('falls back to the default locale for empty/unknown input', () => {
    expect(localeFromPathname('').code).toBe('en')
    expect(localeFromPathname(null).code).toBe('en')
    expect(localeFromPathname(undefined).code).toBe('en')
  })
})

describe('localeBasename', () => {
  it('returns the route prefix for Japanese and empty for English', () => {
    expect(localeBasename(ja)).toBe('/ja')
    expect(localeBasename(en)).toBe('')
  })

  it('returns empty for null locale', () => {
    expect(localeBasename(null)).toBe('')
  })
})

describe('stripLocalePrefix', () => {
  it('strips only the locale\u2019s own matching prefix', () => {
    expect(stripLocalePrefix('/ja/archive', ja)).toBe('/archive')
    expect(stripLocalePrefix('/ja/archive/characters/ka', ja)).toBe('/archive/characters/ka')
    expect(stripLocalePrefix('/ja', ja)).toBe('/')
    expect(stripLocalePrefix('/jamaica', ja)).toBe('/jamaica')
    expect(stripLocalePrefix('/archive', en)).toBe('/archive')
  })
})

describe('localePrefixedPath', () => {
  it('prefixes paths for prefixed locales only', () => {
    expect(localePrefixedPath('/archive', ja)).toBe('/ja/archive')
    expect(localePrefixedPath('archive', ja)).toBe('/ja/archive')
    expect(localePrefixedPath('/builder', ja)).toBe('/ja/builder')
    expect(localePrefixedPath('/archive', en)).toBe('/archive')
    expect(localePrefixedPath('/', ja)).toBe('/ja')
  })
})
