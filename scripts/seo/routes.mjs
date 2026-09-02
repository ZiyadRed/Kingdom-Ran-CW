import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SITE_URL = 'https://ranhq.vercel.app'
export const SEO_LOCALES = ['en', 'ja', 'ar']

export const STATIC_INDEXABLE_PATHS = [
  '/',
  '/archive',
  '/archive/characters',
  '/archive/cw6-scene-cards',
  '/guide',
  '/builder',
  '/castle-points',
  '/buffs',
  '/tiers',
  '/cost',
  '/cw-stats',
]

export const GUIDE_SECTIONS = [
  'basics',
  'stats-screen',
  'stats',
  'roles',
  'bandits',
  'leaders',
  'crystals',
  'debuffs',
  'effects',
  'matchups',
  'terrain',
  'types',
  'interactions',
  'targeting',
]

// Personalized application states should keep working on direct load, but do
// not belong in the sitemap or index.
export const NON_INDEXABLE_PATHS = ['/sim']

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(moduleDir, '..', '..')
const characterDir = path.join(repoRoot, 'data', 'characters')

export function readCharacters() {
  const seen = new Set()
  const characters = []
  for (const file of fs.readdirSync(characterDir).filter((name) => name.endsWith('.json')).sort()) {
    const raw = JSON.parse(fs.readFileSync(path.join(characterDir, file), 'utf8'))
    const entries = Array.isArray(raw) ? raw : raw.characters || []
    for (const character of entries) {
      if (!character?.id || seen.has(character.id)) continue
      seen.add(character.id)
      characters.push(character)
    }
  }
  return characters.sort((a, b) => a.id.localeCompare(b.id))
}

export function localePath(basePath, localeCode) {
  if (localeCode === 'en') return basePath
  const prefix = `/${localeCode}`
  return basePath === '/' ? prefix : `${prefix}${basePath}`
}

export function localizedVariants(basePath) {
  return SEO_LOCALES.map((locale) => ({
    locale,
    path: localePath(basePath, locale),
    url: `${SITE_URL}${localePath(basePath, locale)}`,
  }))
}

export function baseIndexablePaths() {
  return [
    ...STATIC_INDEXABLE_PATHS,
    ...GUIDE_SECTIONS.map((section) => `/guide/${section}`),
    ...readCharacters().map((character) => `/archive/characters/${character.id}`),
  ]
}

export function indexableRoutes() {
  return baseIndexablePaths().flatMap((basePath) => localizedVariants(basePath))
}

export function renderRoutes() {
  const basePaths = [...baseIndexablePaths(), ...NON_INDEXABLE_PATHS]
  return basePaths.flatMap((basePath) => localizedVariants(basePath))
}

// The app historically accepted /archive/:id. Keep those English URLs alive
// with a canonical pointing at /archive/characters/:id so old bookmarks and
// any existing Google equity are not sacrificed during the static transition.
export function legacyCharacterRoutes() {
  return readCharacters().map((character) => ({
    locale: 'en',
    path: `/archive/${character.id}`,
    canonicalPath: `/archive/characters/${character.id}`,
  }))
}

export function htmlOutputPath(outputDir, routePath) {
  if (routePath === '/') return path.join(outputDir, 'index.html')
  return path.join(outputDir, `${routePath.replace(/^\//, '')}.html`)
}

