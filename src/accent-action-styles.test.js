import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const styles = readFileSync(new URL('./styles/globals.css', import.meta.url), 'utf8')
const redesignStyles = readFileSync(new URL('./styles/redesign.css', import.meta.url), 'utf8')
const actionStyles = `${styles}\n${redesignStyles}`

const hexToRgb = (hex) => hex.match(/[\da-f]{2}/gi).map((value) => parseInt(value, 16))
const variableHex = (name) => styles.match(new RegExp(`--${name}:\\s*(#[\\da-f]{6})`, 'i'))?.[1]
const over = (foreground, background, alpha) => foreground.map((value, index) => (
  (value * alpha) + (background[index] * (1 - alpha))
))
const luminance = (rgb) => rgb.map((value) => value / 255).map((value) => (
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
)).reduce((total, value, index) => total + (value * [0.2126, 0.7152, 0.0722][index]), 0)
const contrast = (one, two) => {
  const [light, dark] = [luminance(one), luminance(two)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

describe('semantic accent action foreground', () => {
  const terra = hexToRgb(variableHex('terra'))
  const actionForeground = hexToRgb(variableHex('accent-action-fg'))
  const page = over([255, 255, 255], hexToRgb(variableHex('bg')), 0.1)
  const surface = hexToRgb(variableHex('sur'))
  const summarySurface = over([26, 120, 60], page, 0.07)

  it('is the reviewed 55% terra tint over black', () => {
    const expected = over(terra, [0, 0, 0], 0.55).map(Math.round)
    expect(actionForeground).toEqual(expected)
  })

  it.each([
    ['share on surface', over(terra, surface, 0.12)],
    ['share hover on surface', over(terra, surface, 0.20)],
    ['summary share', over(terra, summarySurface, 0.12)],
    ['summary share hover', over(terra, summarySurface, 0.20)],
    ['Stats add team', over(terra, page, 0.05)],
    ['Stats add team hover', over(terra, page, 0.11)],
    ['Stats search result', surface],
    ['Stats search result hover', hexToRgb(variableHex('bg2'))],
  ])('keeps %s normal text at or above 4.5:1', (_surfaceName, background) => {
    expect(contrast(actionForeground, background)).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the compact-action focus outline above non-text 3:1', () => {
    const darkestRelevantSurface = over(terra, summarySurface, 0.20)
    expect(contrast(actionForeground, darkestRelevantSurface)).toBeGreaterThanOrEqual(3)
    expect(contrast(hexToRgb(variableHex('salmon')), [56, 82, 112])).toBeGreaterThanOrEqual(3)
  })

  it('leaves the raw accent available for decorative surfaces', () => {
    expect(variableHex('terra')).toBe('#E07F48')
    expect(styles).toContain('border-bottom: 3px solid var(--terra)')
    expect(styles).toContain('background: var(--terra); border-color: var(--terra)')
  })

  it.each([
    '.foot a:hover',
    '.progress-tools button:hover',
    '.progress-filter-group button:hover',
    '.owned-toggle:hover',
    '.share-btn',
    '.seo-breadcrumbs a:hover',
    '.cat-pill:hover',
    '.stat-pill:hover',
    '.cwstats-clear-button:hover',
    '.cwstats-remove-team:hover',
    '.cwstats-action-button:hover',
    '.cwstats-result-add',
    '.cwstats-add-team',
    '.cp-mode-tabs button:hover',
    '.cp-soft-btn:hover',
    '.cp-add-btn:hover',
    '.sim-page-head button:hover',
    '.builder-buff-toggle > span:last-child',
  ])('routes the %s action consumer through the semantic foreground', (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    expect(actionStyles).toMatch(new RegExp(`${escaped}[^{}]*\\{[^}]*color:\\s*var\\(--accent-action-fg\\)`, 's'))
  })
})
