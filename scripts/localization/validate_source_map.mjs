// Validate the RanHQ source-identity maps (Phase 1 + Phase 2).
//
// PHASE 1 — CHARACTERS: every character record carries a minimal inline
// `source` block (characterId + generalIds) that must exactly match the
// reviewed build-time artifact data/source/characters.map.json.
//
// PHASE 2 — CW SKILLS: every current project skill row (keyed
// `projectId#projectIndex`) must exactly match data/source/cw_skills.map.json,
// including canonical identity (skillId/textId), status classification, source
// metadata, scene-card rank rows, the four by-design ambiguous rows, and a
// recomputed effects fingerprint. A reorder or edit of any project skill
// breaks the build instead of silently associating the wrong source ID.
//
// The validator is strictly read-only: it never mutates files.
//
// Usage: node scripts/localization/validate_source_map.mjs  (exits 1 on violation)
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const J = (p) => JSON.parse(readFileSync(join(root, p), 'utf-8'))

// ── Phase 1 character expectations ───────────────────────────────────────────
const EXPECTED_TOTAL = 209
const EXPECTED_EXACT = 198
const EXPECTED_RESOLVED = 11

// ── Phase 2 CW-skill expectations ────────────────────────────────────────────
const EXPECTED_SKILLS = 661
const EXPECTED_SKILL_EXACT = 618
const EXPECTED_SKILL_RESOLVED = 39
const EXPECTED_SKILL_AMBIGUOUS = 4
const EXPECTED_SKILL_DETERMINISTIC = 657
const EXPECTED_BASE = 627
const EXPECTED_SCENE_CARD_RANK = 34
const AMBIGUOUS_KEYS = ['futei#0', 'gakuki#0', 'jiou#1', 'kousonryu#0']

// The current decrypted snapshot now contains the previously pending Soutan
// rows. Keep this explicit so a stale map cannot silently reintroduce them.
const EXPECTED_SKILL_PENDING = 0
const PENDING_KEYS = []
const EXPECTED_ROLE_SKILLS = 10

const errors = []
const warn = (msg) => console.warn('  WARN: ' + msg)
const err = (msg) => errors.push(msg)

// ── Load character data (all batch files under data/characters) ─────────────
const characters = []
for (const f of readdirSync(join(root, 'data/characters'))) {
  if (!f.endsWith('.json')) continue
  for (const c of J(`data/characters/${f}`)) {
    if (c && typeof c.id === 'string') characters.push(c)
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE 1 — CHARACTER SOURCE MAP
// ════════════════════════════════════════════════════════════════════════════

const map = J('data/source/characters.map.json')
const bySlug = map && map.characters ? map.characters : {}
const mapSlugs = Object.keys(bySlug)

// 1. Counts
if (characters.length !== EXPECTED_TOTAL) {
  err(`character count is ${characters.length}, expected ${EXPECTED_TOTAL}`)
}
if (mapSlugs.length !== EXPECTED_TOTAL) {
  err(`characters.map.json entry count is ${mapSlugs.length}, expected ${EXPECTED_TOTAL}`)
}

// 2. Coverage: every character has exactly one mapping; no extra mappings
const charSlugs = new Set(characters.map((c) => c.id))
for (const c of characters) {
  if (!bySlug[c.id]) err(`character "${c.id}" has no mapping entry in characters.map.json`)
}
for (const slug of mapSlugs) {
  if (!charSlugs.has(slug)) err(`mapping entry "${slug}" has no character record (extra mapping)`)
}

// 3. Inline consistency + identity uniqueness + general-id rules
const seenCharacterIds = new Map() // characterId -> slug
const seenGeneralIds = new Map() // generalId -> slug
for (const c of characters) {
  const m = bySlug[c.id]
  if (!m) continue

  const s = c.source
  if (!s || typeof s !== 'object') {
    err(`character "${c.id}": missing inline "source" block`)
    continue
  }

  if (typeof s.characterId !== 'number') {
    err(`character "${c.id}": inline source.characterId missing or not a number`)
  } else if (m.characterId !== s.characterId) {
    err(`character "${c.id}": inline source.characterId ${s.characterId} != map ${m.characterId}`)
  } else if (seenCharacterIds.has(s.characterId)) {
    err(`characterId ${s.characterId} is duplicated between "${seenCharacterIds.get(s.characterId)}" and "${c.id}"`)
  } else {
    seenCharacterIds.set(s.characterId, c.id)
  }

  if (!Array.isArray(s.generalIds)) {
    err(`character "${c.id}": inline source.generalIds missing or not an array`)
    continue
  }
  if (s.generalIds.length < 1) {
    err(`character "${c.id}": inline source.generalIds is empty`)
  }
  if (new Set(s.generalIds).size !== s.generalIds.length) {
    err(`character "${c.id}": duplicate generalId inside source.generalIds`)
  }
  const mapGeneral = Array.isArray(m.generalIds) ? m.generalIds : null
  if (!mapGeneral || JSON.stringify(mapGeneral) !== JSON.stringify(s.generalIds)) {
    err(`character "${c.id}": inline source.generalIds != map generalIds`)
  }
  for (const g of s.generalIds) {
    if (seenGeneralIds.has(g)) {
      err(`generalId ${g} is shared between "${seenGeneralIds.get(g)}" and "${c.id}" (cross-character duplicate)`)
    } else {
      seenGeneralIds.set(g, c.id)
    }
  }
}

// 4. Status counts
let exact = 0
let resolved = 0
let ambiguous = 0
let unresolved = 0
for (const slug of mapSlugs) {
  const m = bySlug[slug]
  const status = m && m.status
  if (status === 'exact') exact++
  else if (status === 'resolved') resolved++
  else if (status === 'ambiguous') ambiguous++
  else if (status === 'unresolved') unresolved++
  else err(`mapping "${slug}": unknown status ${JSON.stringify(status)}`)
}

if (exact !== EXPECTED_EXACT) err(`exact count is ${exact}, expected ${EXPECTED_EXACT}`)
if (resolved !== EXPECTED_RESOLVED) err(`resolved count is ${resolved}, expected ${EXPECTED_RESOLVED}`)
if (ambiguous !== 0) err(`ambiguous count is ${ambiguous}, expected 0`)
if (unresolved !== 0) err(`unresolved count is ${unresolved}, expected 0`)

// 5. Resolved evidence: every resolved entry has a non-empty basis
for (const slug of mapSlugs) {
  const m = bySlug[slug]
  if (m && m.status === 'resolved' && !(typeof m.basis === 'string' && m.basis.trim().length > 0)) {
    err(`mapping "${slug}": status "resolved" but basis is missing or empty`)
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE 2 — CW SKILL SOURCE MAP
// ════════════════════════════════════════════════════════════════════════════

// Rebuild current skill rows from the character data loaded above.
// Key = "projectId#projectIndex" (a verified migration/join coordinate — NOT
// canonical identity; it is only safe because fingerprints are re-verified).
const currentSkills = new Map()
for (const c of characters) {
  const skills = Array.isArray(c.skills) ? c.skills : []
  skills.forEach((s, i) => {
    currentSkills.set(`${c.id}#${i}`, {
      charId: c.source && c.source.characterId,
      nameJp: s && s.name_jp,
      effects: Array.isArray(s && s.effects) ? s.effects : [],
    })
  })
}

// Fingerprint contract (from the verified export): SHA-256 over a compact
// UTF-8 JSON array of effect rows; row order preserved; each row serialized
// with key order condition,target,effect,duration; no added whitespace; no
// trailing newline; source/localized strings excluded.
function effectsHash(effects) {
  const rows = effects.map((e) => ({
    condition: e.condition ?? null,
    target: e.target ?? null,
    effect: e.effect ?? null,
    duration: e.duration ?? null,
  }))
  return createHash('sha256').update(JSON.stringify(rows), 'utf8').digest('hex')
}

const skillMap = J('data/source/cw_skills.map.json')
const skillEntries = (skillMap && skillMap.skills) || {}
const skillKeys = Object.keys(skillEntries)
const provenance = J('data/source/_provenance.json')

const sourceSnapshot = provenance?.sourceSnapshot || {}
for (const field of ['snapshotLabel', 'snapshotDate', 'sourceRoot']) {
  if (!(typeof sourceSnapshot[field] === 'string' && sourceSnapshot[field].trim())) {
    err(`_provenance.json sourceSnapshot.${field} is missing`)
  }
}
if (!sourceSnapshot.decoder || typeof sourceSnapshot.decoder !== 'object') {
  err('_provenance.json sourceSnapshot.decoder metadata is missing')
} else {
  for (const field of ['name', 'version', 'rawSchema', 'stblLayout', 'masterDecoder']) {
    if (!(typeof sourceSnapshot.decoder[field] === 'string' && sourceSnapshot.decoder[field].trim())) {
      err(`_provenance.json sourceSnapshot.decoder.${field} is missing`)
    }
  }
}

if (skillMap._schema !== 'ranhq.cw_skill_map/1') {
  err(`cw_skills.map.json unexpected _schema ${JSON.stringify(skillMap._schema)}`)
}

// 1. Counts
if (currentSkills.size !== EXPECTED_SKILLS) {
  err(`current skill rows are ${currentSkills.size}, expected ${EXPECTED_SKILLS}`)
}
if (skillKeys.length !== EXPECTED_SKILLS) {
  err(`cw_skills.map.json entry count is ${skillKeys.length}, expected ${EXPECTED_SKILLS}`)
}

const skillStatusCounts = Object.values(skillEntries).reduce((counts, entry) => {
  counts.total += 1
  if (entry.status === 'exact') counts.exact += 1
  if (entry.status === 'resolved') counts.resolved += 1
  if (entry.status === 'ambiguous') counts.ambiguous += 1
  if (entry.status === 'pending_source') counts.pendingSource += 1
  if (entry.status === 'exact' || entry.status === 'resolved') counts.deterministic += 1
  return counts
}, { total: 0, exact: 0, resolved: 0, ambiguous: 0, pendingSource: 0, deterministic: 0 })
const actualSkillMapHash = createHash('sha256')
  .update(readFileSync(join(root, 'data/source/cw_skills.map.json')))
  .digest('hex')
  .toUpperCase()
const recordedSkillMapping = provenance?.cwSkillMapping || {}
for (const [field, expected] of Object.entries({
  inputFileSha256: actualSkillMapHash,
  total: skillStatusCounts.total,
  exact: skillStatusCounts.exact,
  resolved: skillStatusCounts.resolved,
  ambiguous: skillStatusCounts.ambiguous,
  deterministic: skillStatusCounts.deterministic,
  pendingSource: skillStatusCounts.pendingSource,
})) {
  if (recordedSkillMapping[field] !== expected) {
    err(`_provenance.json cwSkillMapping.${field} ${JSON.stringify(recordedSkillMapping[field])} != ${JSON.stringify(expected)}`)
  }
}

// 2. Coverage: every current skill row has exactly one mapping; no extra keys
for (const key of currentSkills.keys()) {
  if (!skillEntries[key]) err(`skill "${key}" has no entry in cw_skills.map.json (missing mapping)`)
}
for (const key of skillKeys) {
  if (!currentSkills.has(key)) err(`skill-map entry "${key}" has no current project skill (extra mapping)`)
}

// 3. Character identity: map characterId must equal the inline Phase 1 value
let charIdMismatches = 0
for (const [key, entry] of Object.entries(skillEntries)) {
  const cur = currentSkills.get(key)
  if (!cur) continue
  if (entry.characterId !== cur.charId) {
    charIdMismatches++
    err(`skill "${key}": map characterId ${entry.characterId} != character source.characterId ${cur.charId}`)
  }
}

// 4. Fingerprints: recompute against the CURRENT project data
let fpMismatches = 0
for (const [key, entry] of Object.entries(skillEntries)) {
  const cur = currentSkills.get(key)
  if (!cur) continue
  const fp = entry.fingerprint
  if (!fp || fp.name_jp !== cur.nameJp) {
    fpMismatches++
    err(`skill "${key}": current name_jp ${JSON.stringify(cur.nameJp)} != fingerprint name_jp ${JSON.stringify(fp && fp.name_jp)}`)
  }
  const hash = effectsHash(cur.effects)
  if (!fp || fp.effectsHash !== hash) {
    fpMismatches++
    err(`skill "${key}": fingerprint effectsHash mismatch (recomputed ${hash} != stored ${fp && fp.effectsHash})`)
  }
}

// 5. Deterministic rows (exact + resolved): canonical skillId/textId required
let detCount = 0
for (const [key, entry] of Object.entries(skillEntries)) {
  if (entry.status === 'exact' || entry.status === 'resolved') {
    detCount++
    if (!Number.isInteger(entry.skillId) || entry.skillId < 1) {
      err(`skill "${key}": deterministic row has invalid skillId ${JSON.stringify(entry.skillId)}`)
    }
    if (!Number.isInteger(entry.textId) || entry.textId < 1) {
      err(`skill "${key}": deterministic row has invalid textId ${JSON.stringify(entry.textId)}`)
    }
  }
}
if (detCount !== EXPECTED_SKILL_DETERMINISTIC) {
  err(`deterministic skill rows are ${detCount}, expected ${EXPECTED_SKILL_DETERMINISTIC}`)
}

// 5b. Canonical identity consistency: textId is a function of skillId.
// Source skills can legitimately be shared across project rows (42 shared
// skillIds in the reviewed export), but a skillId must never map to two
// different textIds. Catches swapped/corrupted canonical IDs.
const skillIdToTextId = new Map() // skillId -> textId (first seen)
for (const [key, entry] of Object.entries(skillEntries)) {
  if (entry.status !== 'exact' && entry.status !== 'resolved') continue
  const seen = skillIdToTextId.get(entry.skillId)
  if (seen === undefined) {
    skillIdToTextId.set(entry.skillId, entry.textId)
  } else if (seen !== entry.textId) {
    err(`skill "${key}": skillId ${entry.skillId} maps to textId ${entry.textId}, but another row maps it to ${seen}`)
  }
}

// 6. Ambiguous rows: exactly the four known keys, unresolved by design
const ambiguousKeys = skillKeys.filter((k) => skillEntries[k].status === 'ambiguous')
if (ambiguousKeys.length !== EXPECTED_SKILL_AMBIGUOUS) {
  err(`ambiguous skill rows are ${ambiguousKeys.length}, expected ${EXPECTED_SKILL_AMBIGUOUS}`)
}
for (const expected of AMBIGUOUS_KEYS) {
  if (!skillEntries[expected]) err(`expected ambiguous key "${expected}" missing from cw_skills.map.json`)
}
for (const [key, entry] of Object.entries(skillEntries)) {
  if (entry.status !== 'ambiguous') continue
  if (!AMBIGUOUS_KEYS.includes(key)) err(`skill "${key}": ambiguous status on unexpected key`)
  if (entry.skillId !== null) err(`skill "${key}": ambiguous row must have canonical skillId null, got ${JSON.stringify(entry.skillId)}`)
  if (entry.textId !== null) err(`skill "${key}": ambiguous row must have canonical textId null, got ${JSON.stringify(entry.textId)}`)
  const cands = entry.candidates
  if (!Array.isArray(cands) || cands.length < 2) {
    err(`skill "${key}": ambiguous row must have at least 2 candidates`)
  } else {
    cands.forEach((cd, i) => {
      if (!Number.isInteger(cd.skillId)) err(`skill "${key}": candidate ${i} skillId is not numeric`)
      if (!Number.isInteger(cd.textId)) err(`skill "${key}": candidate ${i} textId is not numeric`)
      const hasEvidence =
        (typeof cd.evidence === 'string' && cd.evidence.trim().length > 0) ||
        (typeof cd.basis === 'string' && cd.basis.trim().length > 0)
      if (!hasEvidence) err(`skill "${key}": candidate ${i} lacks basis/evidence`)
    })
  }
}

// 6b. Pending-source rows: exactly the known keys, null canonical IDs by design
const pendingKeys = skillKeys.filter((k) => skillEntries[k].status === 'pending_source')
if (pendingKeys.length !== EXPECTED_SKILL_PENDING) {
  err(`pending_source skill rows are ${pendingKeys.length}, expected ${EXPECTED_SKILL_PENDING}`)
}
for (const expected of PENDING_KEYS) {
  if (!skillEntries[expected]) err(`expected pending_source key "${expected}" missing from cw_skills.map.json`)
}
for (const [key, entry] of Object.entries(skillEntries)) {
  if (entry.status !== 'pending_source') continue
  if (!PENDING_KEYS.includes(key)) err(`skill "${key}": pending_source status on unexpected key`)
  if (entry.skillId !== null) err(`skill "${key}": pending_source row must have skillId null, got ${JSON.stringify(entry.skillId)}`)
  if (entry.textId !== null) err(`skill "${key}": pending_source row must have textId null, got ${JSON.stringify(entry.textId)}`)
  if (!(typeof entry.basis === 'string' && entry.basis.trim().length > 0)) {
    err(`skill "${key}": pending_source row must record a basis`)
  }
}

// 7. Source types
let baseCount = 0
let sceneCardCount = 0
for (const [key, entry] of Object.entries(skillEntries)) {
  if (entry.sourceType === 'base') baseCount++
  else if (entry.sourceType === 'scene_card_rank') sceneCardCount++
  else err(`skill "${key}": unknown sourceType ${JSON.stringify(entry.sourceType)}`)
}
if (baseCount !== EXPECTED_BASE) err(`base skill rows are ${baseCount}, expected ${EXPECTED_BASE}`)
if (sceneCardCount !== EXPECTED_SCENE_CARD_RANK) {
  err(`scene_card_rank rows are ${sceneCardCount}, expected ${EXPECTED_SCENE_CARD_RANK}`)
}

// 8. Base rows: validate the stored source-slot metadata supplied by the
// reviewed manifest. We deliberately do NOT assume projectIndex + 1 ===
// sourceSlot — the prior audit proved 9 profiles are reordered.
for (const [key, entry] of Object.entries(skillEntries)) {
  if (entry.sourceType !== 'base') continue
  if (entry.status === 'exact' || entry.status === 'resolved') {
    if (!Number.isInteger(entry.sourceSlot) || entry.sourceSlot < 1) {
      err(`skill "${key}": base deterministic row has invalid sourceSlot ${JSON.stringify(entry.sourceSlot)}`)
    }
    if (!(typeof entry.sourceNameJp === 'string' && entry.sourceNameJp.trim().length > 0)) {
      err(`skill "${key}": base deterministic row missing sourceNameJp`)
    }
  }
}

// 9. Star-6 / scene-card-rank rows: exactly 34, never a normal 4th base slot.
// cardId is cross-verified against data/cw6_scene_cards.json (card exists,
// card owner matches the project slug, and the card's star-6 skill name
// matches the row's source name after the ☆6 rank-suffix is normalized — two
// legacy cards omit the suffix in cw6_scene_cards.json).
const sceneCards = J('data/cw6_scene_cards.json')
const cardsById = new Map((sceneCards.cards || []).map((c) => [c.id, c]))
const stripStar6 = (s) => (typeof s === 'string' ? s.replace(/☆6$/, '') : s)
for (const [key, entry] of Object.entries(skillEntries)) {
  if (entry.sourceType !== 'scene_card_rank') continue
  if (entry.status !== 'resolved') err(`skill "${key}": scene_card_rank row must have status "resolved"`)
  const cardId = entry.sceneCard && entry.sceneCard.cardId
  if (!cardId || !Number.isInteger(cardId)) {
    err(`skill "${key}": scene_card_rank row missing numeric sceneCard.cardId`)
    continue
  }
  if (!entry.sceneCard || entry.sceneCard.rank !== 6) {
    err(`skill "${key}": scene_card_rank row rank must be 6, got ${JSON.stringify(entry.sceneCard && entry.sceneCard.rank)}`)
  }
  if (entry.sourceSlot !== null) {
    err(`skill "${key}": scene_card_rank row must have sourceSlot null, got ${JSON.stringify(entry.sourceSlot)} (never a normal 4th source slot)`)
  }
  const card = cardsById.get(cardId)
  const projectSlug = key.split('#')[0]
  if (!card) {
    err(`skill "${key}": sceneCard.cardId ${cardId} not found in data/cw6_scene_cards.json`)
    continue
  }
  if (card.owner_id !== projectSlug) {
    err(`skill "${key}": sceneCard.cardId ${cardId} owner is "${card.owner_id}", expected "${projectSlug}"`)
  }
  if (stripStar6(card.skill && card.skill.name_jp) !== stripStar6(entry.sourceNameJp)) {
    err(`skill "${key}": card ${cardId} star-6 skill name ${JSON.stringify(card.skill && card.skill.name_jp)} != sourceNameJp ${JSON.stringify(entry.sourceNameJp)}`)
  }
}

// ── Role-skill source gate ───────────────────────────────────────────────────
// Role skills live in a separate extraction because they are referenced by
// mstUnionConquestGenerals chiefGeneralSkillId/tacticianSkillId rather than a
// normal four-slot character row. Keep their Japanese names tied to the raw
// STBL text IDs so a future refresh cannot silently drift this catalogue.
const roleSkillDocument = J('data/souha_role_skills.json')
const roleSkills = Array.isArray(roleSkillDocument?.skills) ? roleSkillDocument.skills : []
const rawSkillNames = J('data/source/ja/skill_name.raw.json')
const rawSkillNameValues = Array.isArray(rawSkillNames?.values) ? rawSkillNames.values : []
if (roleSkills.length !== EXPECTED_ROLE_SKILLS) {
  err(`role skill rows are ${roleSkills.length}, expected ${EXPECTED_ROLE_SKILLS}`)
}
for (const row of roleSkills) {
  const skill = row?.skill || {}
  if (!Number.isInteger(skill.cwId) || !Number.isInteger(skill.textId)) {
    err(`role skill ${row?.owner_id || '<unknown>'}: cwId/textId must be integers`)
    continue
  }
  const rawName = rawSkillNameValues[skill.textId]
  if (rawName !== skill.name_jp) {
    err(`role skill ${row.owner_id}: textId ${skill.textId} raw Japanese name ${JSON.stringify(rawName)} != ${JSON.stringify(skill.name_jp)}`)
  }
  if (skill.roleSkill !== true) err(`role skill ${row.owner_id}: skill.roleSkill must be true`)
  if (!['Leader', 'Strategist'].includes(row.role)) err(`role skill ${row.owner_id}: unexpected role ${JSON.stringify(row.role)}`)
}

// ── Report ───────────────────────────────────────────────────────────────────
for (const e of errors) console.error('  ERROR: ' + e)
console.log(
  `\nCharacter source map: ${characters.length}/${EXPECTED_TOTAL} characters, ` +
    `${mapSlugs.length}/${EXPECTED_TOTAL} mapping entries, ` +
    `${exact} exact / ${resolved} resolved / ${ambiguous} ambiguous / ${unresolved} unresolved, ` +
    `${errors.length} error(s).`,
)
console.log(
  `CW skill source map: ${currentSkills.size}/${EXPECTED_SKILLS} skills, ` +
    `${skillKeys.length}/${EXPECTED_SKILLS} mapping entries, ` +
    `${ambiguousKeys.length} ambiguous, ${pendingKeys.length} pending, ` +
    `${detCount} deterministic, ${baseCount} base / ${sceneCardCount} scene_card_rank, ` +
    `${fpMismatches} fingerprint mismatch(es), ${charIdMismatches} characterId mismatch(es).`,
)
console.log(`Role-skill source gate: ${roleSkills.length}/${EXPECTED_ROLE_SKILLS} rows with exact raw Japanese names.`)
if (errors.length) {
  console.error('\nSource map validation FAILED (see ERRORs above).')
  process.exit(1)
}
console.log('Source map validation passed (characters + CW skills).')
