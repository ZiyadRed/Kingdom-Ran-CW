import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'https://ranhq.vercel.app'
const lastmod = new Date().toISOString().slice(0, 10)
const characterDir = path.resolve('data/characters')

const staticRoutes = [
  ['/', '1.0'],
  ['/archive', '0.9'],
  ['/archive/characters', '0.9'],
  ['/archive/cw6-scene-cards', '0.8'],
  ['/guide', '0.9'],
  ['/builder', '0.8'],
  ['/buffs', '0.8'],
  ['/tiers', '0.8'],
  ['/cost', '0.7'],
]

const guideSections = [
  'basics',
  'stats-screen',
  'stats',
  'roles',
  'bandits',
  'debuffs',
  'effects',
  'matchups',
  'terrain',
  'types',
  'interactions',
  'targeting',
]

function readCharacters(){
  const seen = new Set()
  const chars = []
  for(const file of fs.readdirSync(characterDir).filter(name => name.endsWith('.json')).sort()){
    const raw = JSON.parse(fs.readFileSync(path.join(characterDir, file), 'utf8'))
    const entries = Array.isArray(raw) ? raw : raw.characters || []
    for(const char of entries){
      if(!char?.id || seen.has(char.id)) continue
      seen.add(char.id)
      chars.push(char.id)
    }
  }
  return chars.sort((a, b) => a.localeCompare(b))
}

const urls = [
  ...staticRoutes.map(([route, priority]) => ({ route, priority })),
  ...guideSections.map(id => ({ route: `/guide/${id}`, priority: '0.75' })),
  ...readCharacters().map(id => ({ route: `/archive/characters/${id}`, priority: '0.65' })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ route, priority }) => {
  const loc = `${ROOT}${route === '/' ? '/' : route}`
  return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority></url>`
}).join('\n')}
</urlset>
`

fs.writeFileSync(path.resolve('public/sitemap.xml'), xml)
console.log(`generate_sitemap: wrote ${urls.length} URLs to public/sitemap.xml`)
