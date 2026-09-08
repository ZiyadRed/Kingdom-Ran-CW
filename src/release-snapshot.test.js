import { describe, expect, it } from 'vitest'
import { getReleaseData, hasStar6, matchCharacterSearch } from './core.jsx'
import { localizedCharacter } from './i18n/data.js'
import { nextReleaseDelay, parseReleaseSnapshot, releaseStage } from './release-snapshot.js'

const boundary = 1789290000000
describe('the scheduled Kisui CW6 release snapshot', () => {
  it('releases the card and its stable-ID-linked skills together at the exact boundary', () => {
    const before = getReleaseData(boundary - 1)
    const after = getReleaseData(boundary)
    expect(before.PUBLIC_CW6_CARDS).toHaveLength(33)
    expect(before.PUBLIC_CW6_CARDS.some(card => card.id === 42004)).toBe(false)
    expect(after.PUBLIC_CW6_CARDS.some(card => card.id === 42004)).toBe(true)
    expect(hasStar6(before.findCharById('kisui'))).toBe(false)
    expect(hasStar6(after.findCharById('kisui'))).toBe(true)
    const card = after.PUBLIC_CW6_CARDS.find(card => card.id === 42004)
    for (const skill of after.findCharById('kisui').skills.filter(skill => skill.star6)) expect(card.cwIds).toContain(skill.cwId)
    expect(before.ALL.map(c => c.id)).toEqual(after.ALL.map(c => c.id))
    expect(before.ARCHIVE_BROWSE_CHARACTERS.map(c => c.id)).toEqual(after.ARCHIVE_BROWSE_CHARACTERS.map(c => c.id))
    expect(before.ARCHIVE_BROWSE_CHARACTERS).toHaveLength(190)
  })

  it('keeps old snapshots immutable and preserves identities between release boundaries', () => {
    const before = getReleaseData(boundary - 1)
    const after = getReleaseData(boundary)
    expect(getReleaseData(boundary - 1000)).toBe(before)
    expect(getReleaseData(boundary + 1000)).toBe(after)
    expect(after.findCharById('kisui')).not.toBe(before.findCharById('kisui'))
    expect(after.findCharById('moubu')).toBe(before.findCharById('moubu'))
    expect(before.findCharById('kisui').skills.some(skill => skill.star6)).toBe(false)
    expect(after.findCharByName('Kisui')).toBe(after.findCharById('kisui'))
  })

  for (const code of ['en', 'ja', 'ar', 'fr']) {
    it(`refreshes localized skills and cached content search in ${code}`, () => {
      const locale = { code }
      const before = getReleaseData(boundary - 1).findCharById('kisui')
      const after = getReleaseData(boundary).findCharById('kisui')
      expect(matchCharacterSearch(before, 'Hidden Great General', locale)).toBeFalsy()
      expect(matchCharacterSearch(after, 'Hidden Great General', locale)).toBeTruthy()
      expect(localizedCharacter(after, locale).skills.length).toBe(localizedCharacter(before, locale).skills.length + 1)
    })
  }
})

describe('release clock policy', () => {
  it('fails closed for malformed document timestamps', () => {
    expect(parseReleaseSnapshot(String(boundary))).toBe(boundary)
    for (const raw of [null, '', '-1', 'NaN', 'Infinity', '1e12', '9007199254740992']) expect(parseReleaseSnapshot(raw)).toBe(0)
  })
  it('schedules exact boundaries, caps long timers and stops after the last release', () => {
    const times = [1000, boundary]
    expect(releaseStage(times, 999)).toBe(0)
    expect(releaseStage(times, 1000)).toBe(1000)
    expect(nextReleaseDelay(times, 999)).toBe(1)
    expect(nextReleaseDelay(times, 1000)).toBe(2_147_483_647)
    expect(nextReleaseDelay(times, boundary - 1)).toBe(1)
    expect(nextReleaseDelay(times, boundary)).toBeNull()
  })
})
