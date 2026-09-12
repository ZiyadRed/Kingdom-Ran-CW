import { describe, expect, it } from 'vitest'
import { calculateTodayPoints, rankCastlePointBoard, summarizeCastlePointStanding } from './castlepoints.jsx'

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

  it('reproduces F08 as an official tied first place instead of using today points as a tiebreak', () => {
    const ranked = rankCastlePointBoard([
      { id: 'mine', name: 'Mine', large: 2, medium: 0, small: 0, carried: 1000, isMine: true },
      { id: 'rival', name: 'Alliance 2', large: 0, medium: 4, small: 0, carried: 0, isMine: false },
    ])

    expect(Object.fromEntries(ranked.map(alliance => [alliance.id, {
      projected: alliance.projected,
      rank: alliance.rank,
      isTied: alliance.isTied,
      tieCount: alliance.tieCount,
    }]))).toEqual({
      mine: { projected: 6400, rank: 1, isTied: true, tieCount: 2 },
      rival: { projected: 6400, rank: 1, isTied: true, tieCount: 2 },
    })
    expect(summarizeCastlePointStanding(ranked)).toMatchObject({ status: 'tied-first', gapToFirst: 0 })
  })

  it('keeps tied placement independent of input order and presentation names', () => {
    const board = [
      // Deliberately oppose stable-ID order and today's points. A regression to
      // the former today-points tiebreak would put `mine` first in this array.
      { id: 'mine', name: 'Zulu', large: 0, medium: 4, small: 0, carried: 0, isMine: true },
      { id: 'alliance-2', name: 'Alpha', large: 0, medium: 0, small: 0, carried: 6400, isMine: false },
      { id: 'alliance-3', name: 'Middle', large: 0, medium: 0, small: 0, carried: 6000, isMine: false },
    ]
    const placements = rows => Object.fromEntries(rows.map(({ id, rank, projected }) => [id, { rank, projected }]))

    const original = rankCastlePointBoard(board)
    const reversedAndRenamed = rankCastlePointBoard(board.toReversed().map(alliance => ({
      ...alliance,
      name: `Localized ${alliance.id}`,
    })))

    expect(placements(original)).toEqual({
      'alliance-2': { rank: 1, projected: 6400 },
      mine: { rank: 1, projected: 6400 },
      'alliance-3': { rank: 3, projected: 6000 },
    })
    expect(placements(reversedAndRenamed)).toEqual(placements(original))
    expect(original.map(alliance => alliance.id)).toEqual(reversedAndRenamed.map(alliance => alliance.id))
  })

  it('keeps sole leadership and behind-first summaries distinct from a tie', () => {
    const ranked = rankCastlePointBoard([
      { id: 'mine', large: 0, medium: 0, small: 2, carried: 0, isMine: true },
      { id: 'rival', large: 1, medium: 0, small: 0, carried: 0, isMine: false },
    ])

    expect(summarizeCastlePointStanding(ranked)).toMatchObject({ status: 'behind', gapToFirst: 700 })
    expect(summarizeCastlePointStanding(ranked, 'rival')).toMatchObject({ status: 'first', gapToFirst: 0 })
  })
})
