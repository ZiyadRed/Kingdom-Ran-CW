import { describe, expect, it } from 'vitest'
import { routePreloads } from '../scripts/route-preloads.mjs'

const manifest = {
  'src/ArchiveHubPage.jsx': { file: 'assets/archive-hub.js', imports: ['react'] },
  'src/pages.jsx': { file: 'assets/pages.js', imports: ['core', 'react'], dynamicImports: ['unrelated'] },
  'src/features/buffs/BuffsPage.jsx': { file: 'assets/buffs.js', imports: ['core'] },
  'src/guide.jsx': { file: 'assets/guide.js', imports: ['react'] },
  'src/cwstats.jsx': { file: 'assets/stats.js', imports: ['core'] },
  'src/castlepoints.jsx': { file: 'assets/castle.js', imports: ['react'], css: ['assets/castle.css'] },
  core: { file: 'assets/core.js', imports: ['data', 'react'] },
  data: { file: 'assets/data.js' },
  react: { file: 'assets/react.js' },
  unrelated: { file: 'assets/unrelated.js' },
}

describe('selected-route build preloads', () => {
  it.each(['/', '/404', '/missing'])('adds no route graph on %s', path => {
    expect(routePreloads(manifest, path)).toEqual({ scripts: [], styles: [] })
  })
  it('includes the selected static dependency graph once, without lazy unrelated features', () => {
    const preloads = routePreloads(manifest, '/archive/characters/moubu', ['/assets/react.js'])
    expect(preloads.scripts).toEqual(['/assets/pages.js', '/assets/core.js', '/assets/data.js'])
  })
  it('keeps Guide outside the character data graph', () => {
    expect(routePreloads(manifest, '/guide/basics', ['/assets/react.js']).scripts).toEqual(['/assets/guide.js'])
  })
  it('keeps the Archive overview outside the character data graph', () => {
    expect(routePreloads(manifest, '/archive', ['/assets/react.js']).scripts).toEqual(['/assets/archive-hub.js'])
  })
  it('preloads Buff Tracker without downloading unrelated archive/tool pages', () => {
    expect(routePreloads(manifest, '/buffs', ['/assets/react.js']).scripts).toEqual(['/assets/buffs.js', '/assets/core.js', '/assets/data.js'])
  })
  it('includes feature styles without duplicate template assets', () => {
    expect(routePreloads(manifest, '/castle-points', ['/assets/react.js'])).toEqual({ scripts: ['/assets/castle.js'], styles: ['/assets/castle.css'] })
  })
  it('fails the build when a selected module is missing instead of silently losing preloads', () => {
    expect(() => routePreloads({}, '/cw-stats')).toThrow('Missing route manifest entry')
  })
})
