import { describe, expect, it } from 'vitest'
import { ALL, findCharById } from './core.jsx'
import { GUIDE_SECTIONS as guideNavigation } from './guide.jsx'
import { GUIDE_SECTIONS as sitemapSections } from '../scripts/seo/routes.mjs'
import { characterRouteId, characterSeo, GUIDE_SECTION_IDS, isGuideSection, routeSeo } from './seo.js'

describe('reference route validity', () => {
  it('uses the same Guide IDs for navigation, metadata and generated routes', () => {
    expect(sitemapSections).toBe(GUIDE_SECTION_IDS)
    expect(guideNavigation.map(section => section.id).sort()).toEqual([...GUIDE_SECTION_IDS].sort())
    for (const section of guideNavigation) {
      expect(isGuideSection(section.id)).toBe(true)
      for (const locale of ['en', 'ja', 'ar', 'fr']) {
        expect(routeSeo(`/guide/${section.id}`, locale).robots).not.toContain('noindex')
      }
    }
  })

  it.each(['no-such-section', 'constructor', '__proto__', 'toString', 'basics/extra', 'Basics'])('rejects the unsupported Guide section %s', section => {
    expect(isGuideSection(section)).toBe(false)
    for (const locale of ['en', 'ja', 'ar', 'fr']) {
      expect(routeSeo(`/guide/${section}`, locale).robots).toBe('noindex,follow')
    }
  })

  it('resolves every published ID exactly and keeps canonical and legacy URLs', () => {
    for (const character of ALL) {
      expect(findCharById(character.id)).toBe(character)
      for (const prefix of ['', '/ja', '/ar', '/fr']) {
        for (const path of [`/archive/${character.id}`, `/archive/characters/${character.id}`]) {
          expect(characterRouteId(`${prefix}${path}/?from=bookmark#skills`)).toBe(character.id)
        }
      }
      expect(characterSeo(character).robots).not.toContain('noindex')
    }
  })

  it.each(['no-such-general', 'constructor', '__proto__', 'toString', '', null, {}])('rejects unknown character identity %s without prototype lookup', id => {
    expect(findCharById(id)).toBe(null)
  })

  it('does not promote arbitrary character-shaped URLs or extra path segments to indexable pages', () => {
    for (const path of ['/archive/characters/no-such-general', '/archive/no-such-general', '/archive/characters/moubu/extra', '/guide/basics/extra']) {
      for (const locale of ['en', 'ja', 'ar', 'fr']) expect(routeSeo(path, locale).robots).toBe('noindex,follow')
    }
    expect(characterRouteId('/archive/characters/moubu/extra')).toBe(null)
    expect(characterRouteId('/archive/characters')).toBe(null)
    expect(characterRouteId('/archive/cw6-scene-cards')).toBe(null)
  })
})
