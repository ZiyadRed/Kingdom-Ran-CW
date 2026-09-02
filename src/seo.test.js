import { describe, expect, it } from 'vitest'
import { absoluteUrl, alternateUrls, canonicalPath, characterSeo, routeSeo } from './seo.js'

describe('locale-aware SEO helpers', () => {
  it('keeps canonical paths stable and prefixes localized URLs once', () => {
    expect(canonicalPath('/archive/characters')).toBe('/archive/characters')
    expect(canonicalPath('/ja/archive/characters/')).toBe('/archive/characters')
    expect(canonicalPath('/archive/characters/soutan/')).toBe('/archive/characters/soutan')
    expect(absoluteUrl('/archive/characters/soutan', 'ja')).toBe('https://ranhq.vercel.app/ja/archive/characters/soutan')
    expect(absoluteUrl('/ja/archive/characters/soutan', 'ja')).toBe('https://ranhq.vercel.app/ja/archive/characters/soutan')
    expect(absoluteUrl('/ar/archive/characters', 'ar')).toBe('https://ranhq.vercel.app/ar/archive/characters')
    expect(absoluteUrl('/', 'ja')).toBe('https://ranhq.vercel.app/ja')
    expect(absoluteUrl('/', 'ar')).toBe('https://ranhq.vercel.app/ar')
    expect(alternateUrls('/ja/guide/terrain')).toEqual({
      en: 'https://ranhq.vercel.app/guide/terrain',
      ja: 'https://ranhq.vercel.app/ja/guide/terrain',
      ar: 'https://ranhq.vercel.app/ar/guide/terrain',
      'x-default': 'https://ranhq.vercel.app/guide/terrain',
    })
  })

  it('generates unique localized guide metadata and noindexes application state', () => {
    expect(routeSeo('/guide').title).toContain('Castle War Guide')
    expect(routeSeo('/ja/guide/terrain', 'ja').title).toContain('地形効果')
    expect(routeSeo('/guide/terrain', 'en').title).not.toBe(routeSeo('/guide/roles', 'en').title)
    expect(routeSeo('/castle-points').robots).toContain('index')
    expect(routeSeo('/sim').robots).toContain('noindex')
    expect(routeSeo('/not-a-page').robots).toContain('noindex')
  })

  it('builds source-backed Japanese character metadata without unsupported rich-result claims', () => {
    const seo = characterSeo({
      id: 'ousen',
      name_en: 'Ousen',
      name_jp: '王翦',
      country: 'qin',
      skills: [
        { name_en: 'Iron Wall', name_jp: '鉄壁', effects: [] },
        { name_en: 'Supreme Strategy', name_jp: '至高の戦略', effects: [] },
      ],
    }, { locale: 'ja', displayName: '王翦', reading: 'おうせん', factionName: '秦' })

    expect(seo.title).toContain('王翦（おうせん）')
    expect(seo.description).toContain('鉄壁')
    expect(seo.url).toBe('https://ranhq.vercel.app/ja/archive/characters/ousen')
    expect(seo.alternates.en).toBe('https://ranhq.vercel.app/archive/characters/ousen')
    const json = JSON.stringify(seo.structuredData)
    expect(json).toContain('"@type":"Thing"')
    expect(json).not.toMatch(/"@type":"(?:Product|Person|Review|AggregateRating)"/)
  })

  it('normalizes query, hash, trailing slashes, and locale prefixes into one canonical path', () => {
    expect(canonicalPath('/guide/terrain/?ref=top#stats')).toBe('/guide/terrain')
    expect(canonicalPath('/ja/archive/characters/ousen?lang=ja#skills')).toBe('/archive/characters/ousen')
    expect(canonicalPath('/ar/guide/basics/')).toBe('/guide/basics')
    expect(canonicalPath('/ja')).toBe('/')
    expect(absoluteUrl('/ar/guide/terrain?x=1#y', 'en')).toBe('https://ranhq.vercel.app/guide/terrain')
    expect(alternateUrls('/ja/archive/characters/ousen?tab=skills')).toEqual({
      en: 'https://ranhq.vercel.app/archive/characters/ousen',
      ja: 'https://ranhq.vercel.app/ja/archive/characters/ousen',
      ar: 'https://ranhq.vercel.app/ar/archive/characters/ousen',
      'x-default': 'https://ranhq.vercel.app/archive/characters/ousen',
    })
  })

  it('emits indexed Arabic route metadata with reciprocal alternates and safe structured data', () => {
    const seo = routeSeo('/ar/guide', 'ar')

    expect(seo.locale).toBe('ar')
    expect(seo.canonicalPath).toBe('/guide')
    expect(seo.url).toBe('https://ranhq.vercel.app/ar/guide')
    expect(seo.title).toContain('Kingdom Ran')
    expect(seo.robots).toContain('index')
    expect(seo.alternates).toEqual({
      en: 'https://ranhq.vercel.app/guide',
      ja: 'https://ranhq.vercel.app/ja/guide',
      ar: 'https://ranhq.vercel.app/ar/guide',
      'x-default': 'https://ranhq.vercel.app/guide',
    })
    expect(seo.alternates['x-default']).toBe(seo.alternates.en)

    const json = JSON.stringify(seo.structuredData)
    expect(json).toContain('"inLanguage":"ar"')
    expect(json).toContain(seo.url)
    expect(json).not.toMatch(/"@type":"(?:Product|Person|Review|AggregateRating)"/)
  })

  it('falls back to noindex for /sim and unknown routes in every locale', () => {
    for (const locale of ['en', 'ja', 'ar']) {
      expect(routeSeo('/sim', locale).robots).toContain('noindex')
      expect(routeSeo('/not-a-real-page', locale).robots).toContain('noindex')
      expect(routeSeo('/guide/unknown-section', locale).robots).toContain('noindex')
    }
    expect(routeSeo('/ja/sim?run=1', 'ja').robots).toContain('noindex')
    expect(routeSeo('/ar/guide/unknown-section', 'ar').robots).toContain('noindex')
    expect(routeSeo('/not-a-real-page', 'ja').title).toContain('見つかりません')
    expect(routeSeo('/not-a-real-page', 'ar').title).toContain('غير موجودة')
  })

  it('builds Arabic character metadata with a stable ID and safe Thing structured data', () => {
    const seo = characterSeo({
      id: 'ousen',
      name_en: 'Ousen',
      name_jp: '王翦',
      skills: [{ name_en: 'Iron Wall', name_jp: '鉄壁', effects: [] }],
    }, { locale: 'ar', displayName: 'أوسن', factionName: 'تشين' })

    expect(seo.locale).toBe('ar')
    expect(seo.canonicalPath).toBe('/archive/characters/ousen')
    expect(seo.url).toBe('https://ranhq.vercel.app/ar/archive/characters/ousen')
    expect(seo.title).toContain('أوسن')
    expect(seo.title).toContain('Ousen')
    expect(seo.description).toContain('تشين')
    expect(seo.alternates.en).toBe('https://ranhq.vercel.app/archive/characters/ousen')
    expect(seo.alternates.ar).toBe(seo.url)

    const json = JSON.stringify(seo.structuredData)
    expect(json).toContain('"@type":"Thing"')
    expect(json).toContain(`${seo.url}#character`)
    expect(json).toContain('"inLanguage":"ar"')
    expect(json).not.toMatch(/"@type":"(?:Product|Person|Review|AggregateRating)"/)
  })
})
