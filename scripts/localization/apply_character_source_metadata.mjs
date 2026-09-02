// Reconcile inline character source metadata from the reviewed source map.
//
// This is a deterministic maintenance migration: it only adds a missing
// `source` block or verifies that an existing block is byte-for-byte equal to
// data/source/characters.map.json. It never invents IDs and refuses conflicts.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const readJson = (relative) => JSON.parse(readFileSync(join(root, relative), 'utf8'))
const map = readJson('data/source/characters.map.json')
const expected = map?.characters
if (!expected || typeof expected !== 'object') throw new Error('characters.map.json has no characters object')

const changed = []
const seen = new Set()
for (const file of readdirSync(join(root, 'data/characters')).filter((name) => name.endsWith('.json')).sort()) {
  const relative = `data/characters/${file}`
  const path = join(root, relative)
  const characters = readJson(relative)
  if (!Array.isArray(characters)) throw new Error(`${relative} must contain an array`)

  let fileChanged = false
  const next = characters.map((character) => {
    if (!character || typeof character.id !== 'string') return character
    const reviewed = expected[character.id]
    if (!reviewed) throw new Error(`${relative}: no reviewed source mapping for ${character.id}`)
    // Inline records intentionally carry only the stable identity join. The
    // map also contains audit-only rarity/status fields; do not copy those
    // into runtime data or treat their absence as a conflict.
    const source = {
      characterId: reviewed.characterId,
      generalIds: reviewed.generalIds,
    }
    seen.add(character.id)
    const currentIdentity = character.source && {
      characterId: character.source.characterId,
      generalIds: character.source.generalIds,
    }
    if (character.source !== undefined && JSON.stringify(currentIdentity) !== JSON.stringify(source)) {
      throw new Error(`${relative}: existing source metadata conflicts for ${character.id}`)
    }
    if (character.source === undefined) {
      fileChanged = true
      return { ...character, source }
    }
    return character
  })

  if (fileChanged) {
    writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
    changed.push(relative)
  }
}

const missing = Object.keys(expected).filter((id) => !seen.has(id))
if (missing.length) throw new Error(`source map entries have no character record: ${missing.join(', ')}`)
console.log(`apply_character_source_metadata: ${seen.size} characters checked; updated ${changed.length} file(s).`)
if (changed.length) console.log(changed.join('\n'))
