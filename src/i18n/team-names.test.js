import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { META_TEAMS } from '../core.jsx'
import { TEAM_NAMES, localizedTeamName } from './team-names.js'

const JA_NAMES = JSON.parse(
  readFileSync(join(process.cwd(), 'data/generated/ja/character_names.json'), 'utf8'),
).names

describe('team preset names', () => {
  it('covers every preset, so a new team cannot ship untranslated', () => {
    const missing = META_TEAMS.map((t) => t.name).filter((name) => !TEAM_NAMES[name])
    expect(missing).toEqual([])
  })

  it('uses the game’s own Japanese for units and armies', () => {
    expect(localizedTeamName('Gyokuhou', 'ja')).toBe('玉鳳隊')
    expect(localizedTeamName('Hi Shin', 'ja')).toBe('飛信隊')
    expect(localizedTeamName('6GG', 'ja')).toBe('六大将軍')
    expect(localizedTeamName('Kanki', 'ja')).toBe('桓騎軍')
  })

  it('names the general the preset actually contains', () => {
    // Kanmei is 汗明 (Chu). 干央 is Kanou — a different general entirely, and
    // the name this map originally carried.
    expect(JA_NAMES['Kanmei']).toBe('汗明')
    expect(localizedTeamName('Karin + Kanmei', 'ja')).toContain('汗明')
    expect(localizedTeamName('Karin + Kanmei', 'ja')).not.toContain('干央')
    // Makou is written 麻礦 in the source, not the 麻鉱 variant.
    expect(JA_NAMES['Makou']).toBe('麻礦')
    expect(localizedTeamName('Makou Army', 'ja')).toBe('麻礦軍')
  })

  it('uses Arabic character names while translating the rest', () => {
    expect(localizedTeamName('Karin Army', 'ar')).toBe('جيش كارين')
    expect(localizedTeamName('Archers', 'ar')).toBe('تشكيلة السهامين')
    expect(localizedTeamName('6GG', 'ar')).toBe('الجنرالات الستة العظام')
  })

  it('leaves English alone and falls back rather than guessing', () => {
    expect(localizedTeamName('Gyokuhou', 'en')).toBe('Gyokuhou')
    expect(localizedTeamName('Some Future Team', 'ja')).toBe('Some Future Team')
  })
})

describe('locale argument handling', () => {
  it('accepts the registry entry useLocale() returns, not only a code', () => {
    // Indexing by the entry object silently rendered English on /tiers with no
    // error to catch it — the reason this overload exists.
    expect(localizedTeamName('Gyokuhou', { code: 'ja' })).toBe('玉鳳隊')
    expect(localizedTeamName('Karin Army', { code: 'ar' })).toBe('جيش كارين')
    expect(localizedTeamName('Gyokuhou', undefined)).toBe('Gyokuhou')
  })
})
