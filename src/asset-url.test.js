import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { versionPublicAsset, versionedPersosThumb } from './asset-url.js'

const digest = path => createHash('sha256').update(readFileSync(new URL(`../public${path}`, import.meta.url))).digest('hex').slice(0, 16)

describe('public artwork cache identity', () => {
  it.each(['/persos/eiki.webp', '/persos/pam.webp', '/icons/Eiki.webp', '/icons/Pam.webp'])(
    'ties %s to its actual bytes', path => {
      expect(versionPublicAsset(path)).toBe(`${path}?v=${digest(path)}`)
    },
  )

  it('uses the thumbnail bytes rather than the full portrait hash', () => {
    expect(versionedPersosThumb(versionPublicAsset('/persos/eiki.webp')))
      .toBe(`/persos/thumbs/eiki.webp?v=${digest('/persos/thumbs/eiki.webp')}`)
  })

  it('preserves cache identity for unchanged content and unrelated URLs', () => {
    expect(versionPublicAsset('/persos/eiki.webp')).toBe(versionPublicAsset('/persos/eiki.webp'))
    expect(versionPublicAsset('/guide/previews/basics-map-en.webp')).toBe('/guide/previews/basics-map-en.webp')
  })
})
