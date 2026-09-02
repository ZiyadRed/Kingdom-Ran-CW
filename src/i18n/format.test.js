import { describe, expect, it } from 'vitest'
import { getLocale } from './locales.js'
import { formatNumber } from './format.js'

const en = getLocale('en')
const ja = getLocale('ja')
const ar = getLocale('ar')

describe('formatNumber', () => {
  it('formats with the locale numberLocale (en-US)', () => {
    expect(formatNumber(1234.5, en)).toBe('1,234.5')
    expect(formatNumber(1234567, en)).toBe('1,234,567')
  })

  it('uses ja-JP grouping for the Japanese locale', () => {
    expect(formatNumber(1234.5, ja)).toBe('1,234.5')
  })

  it('formats Arabic with Western digits, by owner decision', () => {
    // `ar-EG` alone resolves to the `arab` numbering system and would render
    // ٢٬٧٠٠, clashing with the game client and with every number the site does
    // not pass through Intl.
    expect(formatNumber(2700, ar)).toBe('2,700')
    expect(formatNumber(1234567, ar)).toBe('1,234,567')
    expect(formatNumber(12.5, ar)).toBe('12.5')
    expect(formatNumber(0, ar)).toBe('0')
    expect(formatNumber(25000, ar)).not.toMatch(/[٠-٩]/)
  })

  it('passes through Intl.NumberFormat options', () => {
    expect(formatNumber(1234.567, en, { maximumFractionDigits: 1 })).toBe('1,234.6')
    expect(formatNumber(1234.567, en, { minimumFractionDigits: 2 })).toBe('1,234.567')
  })

  it('defaults to the English locale when omitted', () => {
    expect(formatNumber(1234.5)).toBe('1,234.5')
  })

  it('degrades safely on unsupported locales', () => {
    const bogus = { code: 'xx', numberLocale: 'xx-XX' }
    expect(formatNumber(1234.5, bogus)).toBe('1,234.5')
  })
})

