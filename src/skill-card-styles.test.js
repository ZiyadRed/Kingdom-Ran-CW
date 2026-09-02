import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const styles = readFileSync(new URL('./styles/globals.css', import.meta.url), 'utf8')

const luminance = (hex) => {
  const channels = hex.match(/[\da-f]{2}/gi).map((value) => parseInt(value, 16) / 255)
  const [red, green, blue] = channels.map((value) => (
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  ))
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue)
}

const contrastAgainstWhite = (hex) => 1.05 / (luminance(hex) + 0.05)

const roleHeaderBackground = (type) => {
  const selector = `\\.sk\\[data-type="${type}"\\] \\.sk-head`
  return styles.match(new RegExp(`${selector}\\s*\\{[^}]*background:\\s*(#[\\da-f]{6})`, 'i'))?.[1]
}

describe('role skill card contrast', () => {
  it.each(['Leader', 'Strategist'])('keeps the %s title readable on an opaque header', (type) => {
    const background = roleHeaderBackground(type)

    expect(background).toBeDefined()
    expect(contrastAgainstWhite(background)).toBeGreaterThanOrEqual(4.5)
  })
})
