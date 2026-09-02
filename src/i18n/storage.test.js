import { afterEach, describe, expect, it } from 'vitest'
import {
  LOCALE_STORAGE_KEY,
  readLocalePreference,
  writeLocalePreference,
} from './storage.js'

function stubWindow() {
  const store = new Map()
  global.window = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
    },
  }
}

afterEach(() => {
  delete global.window
})

describe('locale preference storage', () => {
  it('defines the planned storage key', () => {
    expect(LOCALE_STORAGE_KEY).toBe('ranhq-locale')
  })

  it('is safe when localStorage is unavailable', () => {
    delete global.window
    expect(readLocalePreference()).toBeNull()
    expect(writeLocalePreference('ja')).toBe(false)
  })

  it('persists and reads back an enabled locale', () => {
    stubWindow()
    expect(writeLocalePreference('ja')).toBe(true)
    expect(readLocalePreference()).toMatchObject({ code: 'ja', enabled: true })
  })

  it('rejects unknown locale codes and persists Arabic', () => {
    stubWindow()
    expect(writeLocalePreference('ar')).toBe(true)
    expect(writeLocalePreference('xx')).toBe(false) // unknown
    expect(readLocalePreference()).toMatchObject({ code: 'ar', enabled: true })
  })
})
