// Validate the Phase 3 localization artifacts (raw source + generated output).
//
// Phase 1/2 identity checks live in validate_source_map.mjs and are NOT
// duplicated or weakened here; this validator runs after it and assumes the
// source maps are already proven. It checks the layer built on top of them:
//
//   data/source/ja/*.raw.json                 verbatim STBL snapshots
//   data/generated/ja/skills.json             canonical Japanese skill text
//   data/generated/source_index.json          project row -> canonical skillId
//   data/generated/ja/character_readings.json kana readings for sorting
//
// The decisive check is that every generated Japanese string is byte-identical
// to the raw STBL entry at its mapped textId, so generated output can never
// drift from the verified source snapshot.
//
// Strictly read-only: it never mutates files.
//
// Usage: node scripts/localization/validate_locale_artifacts.mjs (exits 1 on violation)
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const J = (p) => JSON.parse(readFileSync(join(root, p), 'utf-8'))
const has = (p) => existsSync(join(root, p))

// 657 deterministic project rows resolve onto 600 distinct canonical skillIds:
// 42 canonical CW skills are legitimately shared by several characters. Both
// counts are asserted so neither can silently drift into the other.
const EXPECTED_PROJECT_SKILLS = 661
const EXPECTED_DETERMINISTIC = 657
const EXPECTED_CANONICAL_SKILLS = 600
const EXPECTED_AMBIGUOUS = 4
// Rows for characters who shipped after the pinned snapshot — no canonical
// skillId exists yet, so they stay unassigned like the ambiguous rows.
const EXPECTED_PENDING = 0
const PENDING_KEYS = []
const EXPECTED_CHARACTERS = 209
const EXPECTED_READINGS_AVAILABLE = 188
const EXPECTED_READINGS_MISSING = 21
const AMBIGUOUS_KEYS = ['futei#0', 'gakuki#0', 'jiou#1', 'kousonryu#0']

const RAW_TABLES = [
  ['skill_name.raw.json', 'MsgUnionConquestSkillName.stbl', 869],
  ['skill_desc.raw.json', 'MsgUnionConquestSkillDesc.stbl', 869],
  ['general_ruby.raw.json', 'MsgUnitGeneralRubyName.stbl', 609],
  ['general_name.raw.json', 'MsgUnitGeneralName.stbl', 609],
  ['skill_effect_desc.raw.json', 'MsgUnionConquestSkillEffectDesc.stbl', 1020],
]

const errors = []
const err = (msg) => errors.push(msg)

// ── Required files ───────────────────────────────────────────────────────────
const REQUIRED = [
  ...RAW_TABLES.map(([f]) => `data/source/ja/${f}`),
  'data/generated/ja/skills.json',
  'data/generated/source_index.json',
  'data/generated/ja/character_readings.json',
  'data/generated/ja/entity_names.json',
  'data/source/general_names.map.json',
  'data/source/_provenance.json',
]
for (const p of REQUIRED) {
  if (!has(p)) err(`missing artifact: ${p} (run scripts/localization/build_locale_artifacts.mjs)`)
}
if (errors.length) {
  for (const e of errors) console.error('  ERROR: ' + e)
  process.exit(1)
}

const provenance = J('data/source/_provenance.json')
let placeholderIdCount = 0

// ── 1. Raw STBL snapshots ────────────────────────────────────────────────────
const raw = {}
for (const [file, table, expected] of RAW_TABLES) {
  const path = `data/source/ja/${file}`
  const doc = J(path)

  if (doc?._meta?.schema !== 'ranhq.stbl_raw/1') {
    err(`${path}: unexpected schema ${JSON.stringify(doc?._meta?.schema)}`)
    continue
  }
  if (doc._meta.table !== table) {
    err(`${path}: table is ${doc._meta.table}, expected ${table}`)
  }
  if (!Array.isArray(doc.values)) {
    err(`${path}: "values" is not an array`)
    continue
  }
  if (doc.values.length !== expected) {
    err(`${path}: ${doc.values.length} values, expected ${expected}`)
  }
  if (doc._meta.entries !== doc.values.length) {
    err(`${path}: _meta.entries ${doc._meta.entries} != values length ${doc.values.length}`)
  }
  if (!/^[0-9A-F]{64}$/.test(doc._meta.sha256 || '')) {
    err(`${path}: _meta.sha256 is not an uppercase SHA-256`)
  }

  // The raw artifact's recorded hash must agree with provenance, so the two
  // committed records of the same snapshot can never disagree.
  const recorded = provenance?.stblTables?.[table]
  if (!recorded) {
    err(`_provenance.json: no stblTables entry for ${table}`)
  } else {
    if (recorded.sha256 !== doc._meta.sha256) {
      err(`${table}: provenance sha256 ${recorded.sha256} != raw artifact ${doc._meta.sha256}`)
    }
    if (recorded.entries !== doc.values.length) {
      err(`${table}: provenance entries ${recorded.entries} != raw artifact ${doc.values.length}`)
    }
  }

  raw[table] = doc.values
}

if (errors.length) {
  for (const e of errors) console.error('  ERROR: ' + e)
  process.exit(1)
}

const names = raw['MsgUnionConquestSkillName.stbl']
const descs = raw['MsgUnionConquestSkillDesc.stbl']

// ── 2. Current project rows ──────────────────────────────────────────────────
const characters = []
for (const f of readdirSync(join(root, 'data/characters'))) {
  if (!f.endsWith('.json')) continue
  for (const c of J(`data/characters/${f}`)) {
    if (c && typeof c.id === 'string') characters.push(c)
  }
}

const projectKeys = []
for (const c of characters) {
  ;(Array.isArray(c.skills) ? c.skills : []).forEach((_, i) => projectKeys.push(`${c.id}#${i}`))
}
if (projectKeys.length !== EXPECTED_PROJECT_SKILLS) {
  err(`project skill rows are ${projectKeys.length}, expected ${EXPECTED_PROJECT_SKILLS}`)
}

// ── 3. Source index ──────────────────────────────────────────────────────────
const indexDoc = J('data/generated/source_index.json')
const index = indexDoc?.skills || {}
const indexKeys = Object.keys(index)

if (indexDoc?._meta?.schema !== 'ranhq.source_index/1') {
  err(`source_index.json: unexpected schema ${JSON.stringify(indexDoc?._meta?.schema)}`)
}
if (indexKeys.length !== EXPECTED_PROJECT_SKILLS) {
  err(`source_index.json has ${indexKeys.length} entries, expected ${EXPECTED_PROJECT_SKILLS}`)
}
if (indexDoc?._meta?.rows !== indexKeys.length) {
  err(`source_index.json: _meta.rows ${indexDoc?._meta?.rows} != entry count ${indexKeys.length}`)
}

// Complete coverage of the CURRENT project, in both directions.
const projectKeySet = new Set(projectKeys)
for (const k of projectKeys) if (!index[k]) err(`source_index.json: missing project row ${k}`)
for (const k of indexKeys) if (!projectKeySet.has(k)) err(`source_index.json: unknown row ${k}`)

let canonicalRows = 0
let ambiguousRows = 0
let pendingRows = 0
const ambiguousSeen = []
const pendingSeen = []
for (const [key, entry] of Object.entries(index)) {
  if (entry.status === 'ambiguous') {
    ambiguousRows++
    ambiguousSeen.push(key)
    if (entry.skillId !== null) err(`source_index.json: ${key} is ambiguous but has a skillId`)
  } else if (entry.status === 'pending_source') {
    pendingRows++
    pendingSeen.push(key)
    if (entry.skillId !== null) err(`source_index.json: ${key} is pending_source but has a skillId`)
  } else if (entry.status === 'exact' || entry.status === 'resolved') {
    canonicalRows++
    if (typeof entry.skillId !== 'number') {
      err(`source_index.json: ${key} status ${entry.status} but skillId is not a number`)
    }
  } else {
    err(`source_index.json: ${key} has unexpected status ${JSON.stringify(entry.status)}`)
  }
}

if (canonicalRows !== EXPECTED_DETERMINISTIC) {
  err(`source_index.json: ${canonicalRows} canonical rows, expected ${EXPECTED_DETERMINISTIC}`)
}
if (ambiguousRows !== EXPECTED_AMBIGUOUS) {
  err(`source_index.json: ${ambiguousRows} ambiguous rows, expected ${EXPECTED_AMBIGUOUS}`)
}
if (pendingRows !== EXPECTED_PENDING) {
  err(`source_index.json: ${pendingRows} pending_source rows, expected ${EXPECTED_PENDING}`)
}
if (pendingSeen.slice().sort().join(',') !== [...PENDING_KEYS].sort().join(',')) {
  err(`pending_source rows are [${pendingSeen.join(', ')}], expected [${PENDING_KEYS.join(', ')}]`)
}

// ── 4. The four ambiguous rows stay unassigned ───────────────────────────────
const expectedAmbiguous = [...AMBIGUOUS_KEYS].sort().join(',')
if (ambiguousSeen.sort().join(',') !== expectedAmbiguous) {
  err(`ambiguous rows are [${ambiguousSeen.join(', ')}], expected [${AMBIGUOUS_KEYS.join(', ')}]`)
}

// ── 5. Generated Japanese skills ─────────────────────────────────────────────
const skillsDoc = J('data/generated/ja/skills.json')
const skills = skillsDoc?.skills || {}
const skillIds = Object.keys(skills)

if (skillsDoc?._meta?.schema !== 'ranhq.ja_skills/1') {
  err(`skills.json: unexpected schema ${JSON.stringify(skillsDoc?._meta?.schema)}`)
}
if (skillsDoc?._meta?.sourceSnapshot !== provenance?.sourceSnapshot?.manifestSha256) {
  err('skills.json: sourceSnapshot does not match provenance manifestSha256')
}
if (skillIds.length !== EXPECTED_CANONICAL_SKILLS) {
  err(`skills.json has ${skillIds.length} entries, expected ${EXPECTED_CANONICAL_SKILLS}`)
}
if (skillsDoc?._meta?.rows !== skillIds.length) {
  err(`skills.json: _meta.rows ${skillsDoc?._meta?.rows} != entry count ${skillIds.length}`)
}
if (skillsDoc?._meta?.coveredProjectRows !== EXPECTED_DETERMINISTIC) {
  err(
    `skills.json: _meta.coveredProjectRows ${skillsDoc?._meta?.coveredProjectRows}, ` +
    `expected ${EXPECTED_DETERMINISTIC}`
  )
}

// Runtime payload stays minimal: no evidence, candidates, or source paths.
const ALLOWED_SKILL_FIELDS = new Set(['name', 'desc'])
for (const [id, entry] of Object.entries(skills)) {
  for (const field of Object.keys(entry)) {
    if (!ALLOWED_SKILL_FIELDS.has(field)) {
      err(`skills.json: skillId ${id} has unexpected field "${field}"`)
    }
  }
}

// Every deterministic project row resolves to generated text that is
// byte-identical to the raw STBL entry at its mapped textId.
const skillMap = J('data/source/cw_skills.map.json')
const mapEntries = skillMap?.skills || {}
let verified = 0

for (const [key, entry] of Object.entries(index)) {
  if (entry.status === 'ambiguous' || entry.status === 'pending_source') {
    if (Object.prototype.hasOwnProperty.call(skills, String(entry.skillId))) {
      err(`skills.json: ${entry.status} row ${key} received a canonical entry`)
    }
    continue
  }

  const generated = skills[String(entry.skillId)]
  if (!generated) {
    err(`skills.json: missing entry for skillId ${entry.skillId} (project row ${key})`)
    continue
  }

  const mapping = mapEntries[key]
  if (!mapping) {
    err(`cw_skills.map.json: missing entry for ${key}`)
    continue
  }
  if (mapping.skillId !== entry.skillId) {
    err(`${key}: source_index skillId ${entry.skillId} != map skillId ${mapping.skillId}`)
    continue
  }

  const textId = mapping.textId
  if (typeof textId !== 'number' || textId < 0 || textId >= names.length || textId >= descs.length) {
    err(`${key}: textId ${textId} is out of raw STBL range`)
    continue
  }
  if (generated.name !== names[textId]) {
    err(`${key}: generated name does not match raw SkillName[${textId}]`)
  }
  if (generated.desc !== descs[textId]) {
    err(`${key}: generated desc does not match raw SkillDesc[${textId}]`)
  }
  if (!generated.name?.trim()) err(`${key}: generated name is empty`)
  if (!generated.desc?.trim()) err(`${key}: generated desc is empty`)
  verified++
}

if (verified !== EXPECTED_DETERMINISTIC) {
  err(`verified ${verified} deterministic rows against raw source, expected ${EXPECTED_DETERMINISTIC}`)
}

// No orphan canonical entries.
const usedSkillIds = new Set(
  Object.values(index).filter((e) => e.skillId !== null).map((e) => String(e.skillId))
)
for (const id of skillIds) {
  if (!usedSkillIds.has(id)) err(`skills.json: skillId ${id} is not referenced by any project row`)
}

// ── 6. Character readings ────────────────────────────────────────────────────
const readingsDoc = J('data/generated/ja/character_readings.json')
const readings = readingsDoc?.characters || {}
const readingKeys = Object.keys(readings)

if (readingsDoc?._meta?.schema !== 'ranhq.ja_character_readings/1') {
  err(`character_readings.json: unexpected schema ${JSON.stringify(readingsDoc?._meta?.schema)}`)
}
if (readingKeys.length !== EXPECTED_CHARACTERS) {
  err(`character_readings.json has ${readingKeys.length} entries, expected ${EXPECTED_CHARACTERS}`)
}

const slugs = new Set(characters.map((c) => c.id))
for (const slug of readingKeys) {
  if (!slugs.has(slug)) err(`character_readings.json: unknown slug "${slug}"`)
}
for (const c of characters) {
  if (!Object.prototype.hasOwnProperty.call(readings, c.id)) {
    err(`character_readings.json: missing slug "${c.id}"`)
  }
}

let readingsAvailable = 0
let readingsMissing = 0
for (const [slug, value] of Object.entries(readings)) {
  if (value === null) readingsMissing++
  else if (typeof value === 'string' && value.trim().length > 0) readingsAvailable++
  else err(`character_readings.json: "${slug}" has an invalid reading ${JSON.stringify(value)}`)
}

if (readingsAvailable !== EXPECTED_READINGS_AVAILABLE) {
  err(`readings available is ${readingsAvailable}, expected ${EXPECTED_READINGS_AVAILABLE}`)
}
if (readingsMissing !== EXPECTED_READINGS_MISSING) {
  err(`readings missing is ${readingsMissing}, expected ${EXPECTED_READINGS_MISSING}`)
}
if (readingsDoc?._meta?.available !== readingsAvailable) {
  err(`character_readings.json: _meta.available != counted ${readingsAvailable}`)
}
if (readingsDoc?._meta?.missing !== readingsMissing) {
  err(`character_readings.json: _meta.missing != counted ${readingsMissing}`)
}

// ── Report ───────────────────────────────────────────────────────────────────
// ── Skill-description placeholders ───────────────────────────────────────────
// 「{-N:characterId}」 references another general. Every id a canonical skill
// actually uses must resolve, or Japanese readers see a raw token.
{
  const entityNames = J('data/generated/ja/entity_names.json')?.names || {}
  const generalNames = J('data/source/general_names.map.json')?.names || {}
  const used = new Set()
  for (const skill of Object.values(J('data/generated/ja/skills.json').skills || {})) {
    for (const m of String(skill.desc || '').matchAll(/\{-\d+:(\d+)\}/g)) used.add(m[1])
  }
  for (const id of used) {
    if (!entityNames[id]) err(`entity_names.json is missing characterId ${id} used by a skill description`)
    else if (entityNames[id] !== generalNames[id]) {
      err(`entity_names.json[${id}] ${entityNames[id]} disagrees with general_names.map.json`)
    }
  }
  for (const id of Object.keys(entityNames)) {
    if (!used.has(id)) err(`entity_names.json carries unused characterId ${id}`)
  }
  placeholderIdCount = used.size
}

if (errors.length) {
  console.error(`Locale artifact validation FAILED with ${errors.length} error(s):`)
  for (const e of errors) console.error('  ERROR: ' + e)
  process.exit(1)
}

console.log(
  `Raw source: ${RAW_TABLES.length} STBL snapshots (` +
  RAW_TABLES.map(([, table]) => raw[table].length).join('/') +
  ' entries), hashes agree with provenance.'
)
console.log(
  `Generated: ${skillIds.length} canonical Japanese skills verified byte-identical to raw source ` +
  `across ${verified} deterministic project rows; ${indexKeys.length} source-index rows ` +
  `(${ambiguousRows} ambiguous, unassigned); ${placeholderIdCount} placeholder characterIds resolved; ` +
  `${readingsAvailable}/${readingKeys.length} ruby readings ` +
  `(${readingsMissing} null).`
)
console.log('Locale artifact validation passed (Phase 3).')
