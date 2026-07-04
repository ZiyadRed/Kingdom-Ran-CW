import { describe, expect, it } from 'vitest'
import { calculateTodayPoints, rankCastlePointBoard } from './castlepoints.jsx'

describe('castle point calculator', () => {
  it('uses Castle War castle point values', () => {
    expect(calculateTodayPoints({ large: 1, medium: 2, small: 3 })).toBe(8900)
  })

  it('ranks alliances by projected total with today points included', () => {
    const ranked = rankCastlePointBoard([
      { id: 'mine', name: 'Mine', large: 1, medium: 0, small: 0, carried: 1000, isMine: true },
      { id: 'rival', name: 'Rival', large: 0, medium: 1, small: 0, carried: 2500 },
      { id: 'late', name: 'Late', large: 0, medium: 0, small: 0, carried: 3900 },
    ])

    expect(ranked.map(alliance => alliance.id)).toEqual(['rival', 'late', 'mine'])
    expect(ranked.map(alliance => alliance.projected)).toEqual([4100, 3900, 3700])
  })
})
