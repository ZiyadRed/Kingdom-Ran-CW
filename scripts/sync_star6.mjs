// Single source of truth for CW6★ skills.
//
// Each star6 skill is shown in TWO places: the character entry (party builder)
// and the CW6 scene card (archive). To stop them drifting (the Tairoji/Rinbukun
// bug, 2026-06-17), the CHARACTER entry is canonical and this script regenerates
// every card's skill block from it. Wired into `prebuild`, so every build/deploy
// is guaranteed consistent. Edit the star6 skill in data/characters/*.json only.
//
// Usage: node scripts/sync_star6.mjs   (writes data/cw6_scene_cards.json if changed)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const J = p => JSON.parse(readFileSync(join(root, p), 'utf-8'))

// owner_id -> character star6 skill
const star6ById = {}
for (const f of readdirSync(join(root, 'data/characters'))) {
  if (!f.endsWith('.json')) continue
  for (const c of J(`data/characters/${f}`)) {
    const s6 = (c.skills || []).find(s => s.star6)
    if (c.id && s6) star6ById[c.id] = s6
  }
}

const path = 'data/cw6_scene_cards.json'
const raw = readFileSync(join(root, path), 'utf-8')
const data = JSON.parse(raw)
let changed = 0
const changedOwners = []

for (const card of data.cards || []) {
  const s6 = star6ById[card.owner_id]
  if (!s6) continue
  // canonical skill block, derived from the character entry
  const next = {
    name_en: s6.name_en,
    name_jp: s6.name_jp,
    type: s6.type,
    star6: true,
    effects: s6.effects,
  }
  const before = JSON.stringify({ skill: card.skill, skill_en: card.skill_en, skill_jp: card.skill_jp })
  card.skill = next
  card.skill_en = s6.name_en
  card.skill_jp = (s6.name_jp || '').replace(/☆\d+$/, '')
  const after = JSON.stringify({ skill: card.skill, skill_en: card.skill_en, skill_jp: card.skill_jp })
  if (before !== after) { changed++; changedOwners.push(card.ownerName || card.owner_id) }
}

if (changed) {
  writeFileSync(join(root, path), JSON.stringify(data, null, 2))
  console.log(`sync_star6: regenerated ${changed} card skill block(s) from character data: ${changedOwners.join(', ')}`)
} else {
  console.log('sync_star6: all CW6 cards already match their character star6 skill.')
}
