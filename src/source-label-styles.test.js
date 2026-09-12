import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./styles/localization.css', import.meta.url), 'utf8')
const globals = readFileSync(new URL('./styles/globals.css', import.meta.url), 'utf8')

const rgb = hex => hex.match(/[\da-f]{2}/gi).map(channel => parseInt(channel, 16))
const luminance = color => color.map(value => {
  const channel = value / 255
  return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
}).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + .05) / (dark + .05)
}

describe('Japanese source-description label', () => {
  it('uses a distinct blue semantic foreground with normal-text contrast on its translucent surface', () => {
    const panel = css.match(/\.sk-source-desc\s*\{([^}]*)\}/)?.[1]
    const label = css.match(/\.sk-source-label\s*\{([^}]*)\}/)?.[1]
    const sourceColor = panel?.match(/--source-label-fg:\s*(#[\da-f]{6})/i)?.[1]
    const actionColor = globals.match(/--accent-action-fg:\s*(#[\da-f]{6})/i)?.[1]
    const surfaceColor = globals.match(/--sur:\s*(#[\da-f]{6})/i)?.[1]
    const panelAlpha = Number(panel?.match(/background:\s*rgba\(61,110,181,([\d.]+)\)/)?.[1])

    expect(label).toMatch(/color:\s*var\(--source-label-fg\)/)
    expect(sourceColor).toMatch(/^#[\da-f]{6}$/i)
    expect(sourceColor).not.toBe(actionColor)
    expect(rgb(sourceColor)[2]).toBeGreaterThan(rgb(sourceColor)[0])
    expect(panelAlpha).toBeGreaterThan(0)
    const effectiveBackground = rgb(surfaceColor).map((value, index) =>
      value * (1 - panelAlpha) + rgb('3d6eb5')[index] * panelAlpha)
    expect(contrast(rgb(sourceColor), effectiveBackground)).toBeGreaterThan(5)
  })
})
