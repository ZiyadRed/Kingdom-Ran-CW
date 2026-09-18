import { describe, expect, it } from 'vitest'
import { secondaryName } from './display-names.js'

describe('CW6 title presentation', () => {
  it('suppresses whitespace and punctuation-format-only duplicate titles', () => {
    expect(secondaryName('  隠れた名将  ', '隠れた名将')).toBeNull()
    expect(secondaryName('士気：＋３０％', '士気: +30%')).toBeNull()
  })

  it('keeps a distinct Japanese title and a translated title', () => {
    expect(secondaryName('隠れた名将', '闘志の伝染')).toBe('闘志の伝染')
    expect(secondaryName('Hidden Great General', '隠れた名将')).toBe('隠れた名将')
  })
})
