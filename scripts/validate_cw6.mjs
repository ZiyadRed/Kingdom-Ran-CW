// Validate CW6 archive/party-builder parity.
//
// The party builder reads each character's own `skills` array (it shows a
// CW6 toggle only when a skill has `star6: true`), while the archive gallery
// reads data/cw6_scene_cards.json. These two MUST stay in sync: every CW6
// archive card's owner must also carry the matching star6 skill in their
// character entry, or the card shows in the archive but is missing from the
// party builder (the Kyuukou bug, 2026-06-17).
//
// Usage: node scripts/validate_cw6.mjs   (exits 1 on hard errors)
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const J = p => JSON.parse(readFileSync(join(root, p), 'utf-8'))

// id -> { char, file, star6 skills }
const charById = {}
const charDir = 'data/characters'
for (const f of readdirSync(join(root, charDir))) {
  if (!f.endsWith('.json')) continue
  for (const c of J(`${charDir}/${f}`)) {
    if (!c.id) continue
    const star6 = (c.skills || []).filter(s => s.star6)
    charById[c.id] = { name: c.name_en, file: f, star6 }
  }
}

const cards = J('data/cw6_scene_cards.json').cards || []
const norm = s => (s || '').trim().toLowerCase()

const errors = []
const warnings = []
const seenOwners = new Set()

for (const card of cards) {
  const owner = card.owner_id
  const label = `card ${card.id} (${card.ownerName} / ${card.skill_en})`
  if (!owner) { errors.push(`${label}: missing owner_id`); continue }
  seenOwners.add(owner)
  const ch = charById[owner]
  if (!ch) {
    errors.push(`${label}: owner_id "${owner}" has no character entry in ${charDir}/`)
    continue
  }
  if (ch.star6.length === 0) {
    errors.push(`${label}: character "${owner}" (${ch.file}) has NO star6 skill — ` +
                `card will appear in the archive but be MISSING from the party builder. ` +
                `Add the star6 skill block to that character's "skills" array.`)
    continue
  }
  // soft check: the card's skill should match one of the character's star6 skills
  const cardSkill = card.skill?.name_en || card.skill_en
  const matched = ch.star6.find(s => norm(s.name_en) === norm(cardSkill))
  if (!matched) {
    warnings.push(`${label}: card skill "${cardSkill}" not found among ${owner}'s ` +
                  `star6 skills [${ch.star6.map(s => s.name_en).join(', ')}]`)
  }
  // hard check: the SAME star6 skill is duplicated in the character entry and the
  // archive card — their effects MUST stay identical or the builder and archive show
  // different skills (the Tairoji/Rinbukun drift, 2026-06-17).
  const ref = matched || (ch.star6.length === 1 ? ch.star6[0] : null)
  if (ref) {
    const sig = e => JSON.stringify((e.effects || [])
      .map(x => [x.condition ?? null, x.target ?? null, x.effect ?? null, x.duration ?? null]))
    if (sig(card.skill || {}) !== sig(ref)) {
      errors.push(`${label}: star6 effects DIFFER between the archive card and ${owner}'s ` +
                  `character entry (${ch.file}). They are the same skill and must match. ` +
                  `Reconcile both against game-data ground truth.`)
    }
  }
}

// reverse check: a character carrying a star6 skill with no archive card
for (const [id, ch] of Object.entries(charById)) {
  if (ch.star6.length && !seenOwners.has(id)) {
    warnings.push(`character "${id}" (${ch.file}) has star6 skill ` +
                  `"${ch.star6[0].name_en}" but no CW6 archive card in cw6_scene_cards.json`)
  }
}

for (const w of warnings) console.warn('  WARN: ' + w)
for (const e of errors) console.error('  ERROR: ' + e)

console.log(`\nCW6 parity: ${cards.length} archive cards checked, ` +
            `${errors.length} error(s), ${warnings.length} warning(s).`)
if (errors.length) {
  console.error('\nCW6 validation FAILED — archive/party-builder mismatch (see ERRORs above).')
  process.exit(1)
}
console.log('CW6 validation passed.')
