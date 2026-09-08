import { describe, expect, it } from 'vitest'
import { readCharacters } from '../scripts/seo/routes.mjs'
import { deriveArchiveOverview } from '../scripts/generate_archive_overview.mjs'
import cards from '../data/cw6_scene_cards.json'
import metadata from './generated/archive-overview.js'
import { archiveOverviewAt } from './archive-overview.js'
import { getReleaseData } from './core.jsx'

describe('the lightweight Archive overview projection', () => {
  it('is regenerated from authoritative character and card data', () => {
    expect(metadata).toEqual(deriveArchiveOverview(readCharacters(), cards.cards))
  })
  it('agrees with the full public roster before, at, and after every release boundary', () => {
    const times = new Set([0, ...cards.cards.flatMap(card => {
      const time = (card.publicTime || 0) * 1000
      return [Math.max(0, time - 1), time, time + 1]
    })])
    for (const time of times) {
      const full = getReleaseData(time)
      expect(archiveOverviewAt(time)).toEqual({ characterCount: full.ALL.length, cardCount: full.PUBLIC_CW6_CARDS.length })
    }
  })
  it('counts search-only characters and groups simultaneous card releases', () => {
    expect(deriveArchiveOverview([
      { id: 'with-banner', country: 'qin', image: 'banner.webp' },
      { id: 'search-only', country: 'qin' },
      { id: 'excluded', country: 'unknown' },
    ], [{}, { publicTime: 12 }, { publicTime: 12 }, { publicTime: 20 }])).toEqual({
      characterCount: 2, cardReleases: [[0, 1], [12000, 2], [20000, 1]],
    })
  })
})
