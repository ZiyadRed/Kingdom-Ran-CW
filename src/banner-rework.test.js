import { describe, expect, it } from 'vitest'
import crypto from 'node:crypto'
import fs from 'node:fs'
import audit from '../docs/character-integrity/banner-rework.json'
import { ALL } from './core.jsx'

const expectedIds = [
  'yugi', 'kesshi', 'amon', 'jiou', 'douken', 'shishi', 'gii',
  'hyou', 'kei', 'hakukisei', 'roen', 'kou2', 'gotan', 'shuki',
  'maki', 'saizatsu', 'domon', 'miyamoto', 'saji', 'jokan', 'chouko',
]

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex')
}

function readLosslessWebp(bytes) {
  expect(bytes.toString('ascii', 0, 4)).toBe('RIFF')
  expect(bytes.toString('ascii', 8, 12)).toBe('WEBP')
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const type = bytes.toString('ascii', offset, offset + 4)
    const size = bytes.readUInt32LE(offset + 4)
    const payload = offset + 8
    if (type === 'VP8L') {
      expect(bytes[payload]).toBe(0x2f)
      const bits = bytes.readUInt32LE(payload + 1)
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
        alpha: Boolean((bits >>> 28) & 1),
      }
    }
    offset = payload + size + (size % 2)
  }
  throw new Error('Lossless WebP payload not found')
}

describe('strict replacement-banner acceptance', () => {
  it('records a decision for all 21 rejected attempts and keeps 19 on fallback', () => {
    expect(audit.characters.map(entry => entry.id)).toEqual(expectedIds)
    expect(audit.counts).toEqual({
      attempted: 21,
      accepted_new_banner: 2,
      accepted_improved_crop: 0,
      keep_fallback_unresolved: 19,
    })
    for (const entry of audit.characters) {
      expect(entry.rejected_attempt.decision, entry.id).toBe('REJECTED')
      expect(entry.rejected_attempt.mode, entry.id).toBe('RGB')
      expect(entry.rejected_attempt.black_edges, entry.id).toBe(true)
      expect(entry.rejected_attempt.outer4_dark_fraction, entry.id).toBeGreaterThan(0.82)
      expect(entry.same_source_crop.salvageable, entry.id).toBe(false)
    }
  })

  it('maps only the two official transparent overview banners', () => {
    const accepted = audit.characters.filter(entry => entry.outcome === 'ACCEPTED NEW BANNER')
    expect(accepted.map(entry => entry.id)).toEqual(['yugi', 'domon'])
    for (const entry of accepted) {
      const character = ALL.find(candidate => candidate.id === entry.id)
      const banner = entry.accepted_banner
      expect(character.image, entry.id).toBe(`/persos/${entry.id}.webp`)
      expect(new URL(banner.source_page).hostname).toBe('www.kingdomran.jp')
      expect(new URL(banner.source_url).hostname).toBe('dxqkr1fuhva1u.cloudfront.net')
      for (const path of [banner.final_path, banner.thumbnail_path]) {
        const bytes = fs.readFileSync(path)
        expect(bytes.length, path).toBe(banner.bytes)
        expect(sha256(bytes), path).toBe(banner.webp_sha256)
        expect(readLosslessWebp(bytes), path).toEqual({ width: 313, height: 440, alpha: true })
      }
    }
  })

  it('does not leave rejected files or mappings in the release tree', () => {
    const unresolved = audit.characters.filter(entry => entry.outcome === 'KEEP FALLBACK / UNRESOLVED')
    expect(unresolved).toHaveLength(19)
    for (const entry of unresolved) {
      const character = ALL.find(candidate => candidate.id === entry.id)
      expect(character.image ?? null, entry.id).toBe(null)
      expect(fs.existsSync(`public/persos/${entry.id}.webp`), entry.id).toBe(false)
      expect(fs.existsSync(`public/persos/thumbs/${entry.id}.webp`), entry.id).toBe(false)
    }
  })
})
