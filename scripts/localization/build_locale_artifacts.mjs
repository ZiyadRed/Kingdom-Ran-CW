// Build the generated localization artifacts from COMMITTED sources only.
//
// This script must never need the original game snapshot (C:\kingdom_data).
// Extraction is a separate maintainer action (scripts/localization/extract_ja_text.py)
// whose output — data/source/ja/*.raw.json — is committed. Everything here is
// derived from files already in the repository, so Vercel/CI builds work with
// no access to the game data:
//
//   data/source/ja/*.raw.json      (verbatim STBL snapshots)
//   data/source/cw_skills.map.json (reviewed Phase 2 identity map)
//   data/source/characters.map.json + data/characters/*.json
//        |
//        v
//   data/generated/ja/skills.json             597 canonical Japanese skills
//   data/generated/source_index.json          661 project rows -> skillId|null
//   data/generated/ja/character_readings.json 208 slugs (187 kana / 21 null)
//   data/generated/ja/character_names.json     name_en -> name_jp
//   data/generated/ja/entity_names.json        characterId -> name, for
//                                             {-N:characterId} placeholders
//
// Runtime imports only the generated Japanese text fields; provenance and
// candidate metadata stay in the source layer and never enter the app bundle.
// Files are written only when their content changes, mirroring sync_star6.mjs,
// so repeat builds stay diff-clean.
//
// Usage: node scripts/localization/build_locale_artifacts.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const J = (p) => JSON.parse(readFileSync(join(root, p), 'utf-8'))

const SNAPSHOT = '59408FDF1D9E5A6B0A18DA30D4175EE90B2D0B2554E7D17D53FFD04B91A931E0'
const RAW_SCHEMA = 'ranhq.stbl_raw/1'
const AMBIGUOUS_KEYS = ['futei#0', 'gakuki#0', 'jiou#1', 'kousonryu#0']

// NOTE ON COUNTS: 654 deterministic PROJECT ROWS resolve onto only 597 DISTINCT
// canonical skillIds, because 42 canonical CW skills are legitimately shared by
// several characters (generic stat skills; one is carried by 5 project rows).
// data/generated/ja/skills.json is keyed by skillId, so it holds 597 entries —
// it cannot hold 654. Both numbers are recorded explicitly so neither is
// mistaken for the other: `rows` counts entries in the file, and
// `coveredProjectRows` counts the deterministic project rows they serve.
const EXPECTED = {
  skills: 661,
  deterministic: 657,
  canonicalSkills: 600,
  ambiguous: 4,
  // Rows for characters who shipped after the pinned snapshot: no canonical
  // skillId/textId exists yet, so they contribute no Japanese text and are
  // excluded from `deterministic`/`canonicalSkills` (see cw_skills.map.json).
  pending: 0,
  characters: 209,
  readingsAvailable: 188,
  readingsMissing: 21,
}

const fail = (msg) => {
  console.error(`build_locale_artifacts: ${msg}`)
  process.exit(1)
}

// ── Load committed raw STBL snapshots ────────────────────────────────────────
function loadRaw(file, table) {
  const path = `data/source/ja/${file}`
  if (!existsSync(join(root, path))) {
    fail(`missing ${path} — run scripts/localization/extract_ja_text.py first`)
  }
  const raw = J(path)
  if (raw?._meta?.schema !== RAW_SCHEMA) {
    fail(`${path}: unexpected schema ${JSON.stringify(raw?._meta?.schema)}`)
  }
  if (raw._meta.table !== table) {
    fail(`${path}: table is ${raw._meta.table}, expected ${table}`)
  }
  if (!Array.isArray(raw.values) || raw.values.length !== raw._meta.entries) {
    fail(`${path}: values length ${raw.values?.length} != _meta.entries ${raw._meta.entries}`)
  }
  return raw
}

const skillName = loadRaw('skill_name.raw.json', 'MsgUnionConquestSkillName.stbl')
const skillDesc = loadRaw('skill_desc.raw.json', 'MsgUnionConquestSkillDesc.stbl')
const generalRuby = loadRaw('general_ruby.raw.json', 'MsgUnitGeneralRubyName.stbl')
loadRaw('general_name.raw.json', 'MsgUnitGeneralName.stbl')
loadRaw('skill_effect_desc.raw.json', 'MsgUnionConquestSkillEffectDesc.stbl') // future token work

// ── Load characters + Phase 2 map ────────────────────────────────────────────
const characters = []
for (const f of readdirSync(join(root, 'data/characters'))) {
  if (!f.endsWith('.json')) continue
  for (const c of J(`data/characters/${f}`)) {
    if (c && typeof c.id === 'string') characters.push(c)
  }
}

const skillMap = J('data/source/cw_skills.map.json')
const entries = skillMap?.skills || {}

// Current project skill rows, so the source index always covers exactly what
// the app actually ships (not a stale snapshot of it).
const projectKeys = []
for (const c of characters) {
  ;(Array.isArray(c.skills) ? c.skills : []).forEach((_, i) => projectKeys.push(`${c.id}#${i}`))
}

if (projectKeys.length !== EXPECTED.skills) {
  fail(`project skill rows are ${projectKeys.length}, expected ${EXPECTED.skills}`)
}

// ── data/generated/ja/skills.json ────────────────────────────────────────────
const skills = {}
let deterministic = 0
let ambiguous = 0
let pending = 0

for (const key of projectKeys) {
  const entry = entries[key]
  if (!entry) fail(`project row ${key} has no cw_skills.map.json entry`)

  if (entry.status === 'ambiguous') {
    ambiguous++
    if (entry.skillId !== null) fail(`${key}: ambiguous row must keep skillId null`)
    continue
  }
  if (entry.status === 'pending_source') {
    pending++
    if (entry.skillId !== null) fail(`${key}: pending_source row must keep skillId null`)
    if (entry.textId !== null) fail(`${key}: pending_source row must keep textId null`)
    continue
  }
  if (entry.status !== 'exact' && entry.status !== 'resolved') {
    fail(`${key}: unexpected status ${JSON.stringify(entry.status)}`)
  }

  const { skillId, textId } = entry
  if (typeof skillId !== 'number' || typeof textId !== 'number') {
    fail(`${key}: deterministic row missing skillId/textId`)
  }
  if (textId < 0 || textId >= skillName._meta.entries) {
    fail(`${key}: textId ${textId} out of SkillName range`)
  }
  if (textId < 0 || textId >= skillDesc._meta.entries) {
    fail(`${key}: textId ${textId} out of SkillDesc range`)
  }

  const name = skillName.values[textId]
  const desc = skillDesc.values[textId]
  if (!name?.trim()) fail(`${key}: empty source name at textId ${textId}`)
  if (!desc?.trim()) fail(`${key}: empty source desc at textId ${textId}`)

  // Two project rows may legitimately share one canonical skill; identical
  // content is fine, a genuine collision is not.
  const existing = skills[skillId]
  if (existing && (existing.name !== name || existing.desc !== desc)) {
    fail(`skillId ${skillId} mapped to conflicting source text`)
  }
  skills[skillId] = { name, desc }
  deterministic++
}

if (deterministic !== EXPECTED.deterministic) {
  fail(`deterministic rows are ${deterministic}, expected ${EXPECTED.deterministic}`)
}
if (ambiguous !== EXPECTED.ambiguous) {
  fail(`ambiguous rows are ${ambiguous}, expected ${EXPECTED.ambiguous}`)
}
if (pending !== EXPECTED.pending) {
  fail(`pending_source rows are ${pending}, expected ${EXPECTED.pending}`)
}

const canonicalSkills = Object.keys(skills).length
if (canonicalSkills !== EXPECTED.canonicalSkills) {
  fail(`canonical skill entries are ${canonicalSkills}, expected ${EXPECTED.canonicalSkills}`)
}

// ── data/generated/source_index.json ─────────────────────────────────────────
const index = {}
for (const key of projectKeys) {
  const entry = entries[key]
  index[key] = entry.status === 'ambiguous' || entry.status === 'pending_source'
    ? { status: entry.status, skillId: null }
    : { status: entry.status, skillId: entry.skillId }
}

for (const key of AMBIGUOUS_KEYS) {
  if (index[key]?.skillId !== null) fail(`${key} must remain unassigned in source_index`)
}

// ── data/generated/ja/character_readings.json ────────────────────────────────
// Raw ruby stays untouched; derived readings are whitespace-trimmed only.
const readings = {}
let available = 0
let missing = 0

for (const c of characters) {
  const ids = Array.isArray(c.source?.generalIds) ? c.source.generalIds : []
  const found = new Set()
  for (const g of ids) {
    if (typeof g !== 'number' || g < 0 || g >= generalRuby._meta.entries) {
      fail(`character "${c.id}": generalId ${g} out of ruby table range`)
    }
    const value = (generalRuby.values[g] ?? '').trim()
    if (value && value !== 'null') found.add(value)
  }
  if (found.size > 1) {
    fail(`character "${c.id}": conflicting ruby readings ${[...found].join(' | ')}`)
  }
  if (found.size === 1) {
    readings[c.id] = [...found][0]
    available++
  } else {
    readings[c.id] = null // never invent a reading
    missing++
  }
}

if (Object.keys(readings).length !== EXPECTED.characters) {
  fail(`readings cover ${Object.keys(readings).length} characters, expected ${EXPECTED.characters}`)
}
if (available !== EXPECTED.readingsAvailable || missing !== EXPECTED.readingsMissing) {
  fail(
    `ruby coverage is ${available} available / ${missing} missing, expected ` +
    `${EXPECTED.readingsAvailable} / ${EXPECTED.readingsMissing} — refusing to fill values`
  )
}

// ── Write (only when changed) ────────────────────────────────────────────────
const written = []
function writeIfChanged(path, payload) {
  const full = join(root, path)
  mkdirSync(dirname(full), { recursive: true })
  const next = JSON.stringify(payload, null, 2) + '\n'
  const prev = existsSync(full) ? readFileSync(full, 'utf-8') : null
  if (prev === next) return false
  writeFileSync(full, next)
  written.push(path)
  return true
}

// ── data/generated/ja/entity_names.json ──────────────────────────────────────
// Skill descriptions reference other generals as 「{-N:characterId}」. The
// extractor resolved those ids through mstUnitGenerals.id (NOT characterId —
// see build_general_index() for why a direct lookup silently returns the wrong
// general). Here we only verify that every id actually used by a canonical
// skill has a name, so a missing one fails the build instead of reaching users.
const generalNames = J('data/source/general_names.map.json')?.names || {}
if (!Object.keys(generalNames).length) fail('general_names.map.json has no names')

const PLACEHOLDER_RE = /\{-\d+:(\d+)\}/g
const usedIds = new Set()
for (const skill of Object.values(skills)) {
  for (const m of String(skill.desc || '').matchAll(PLACEHOLDER_RE)) usedIds.add(m[1])
}
const unresolved = [...usedIds].filter((id) => !generalNames[id]).sort()
if (unresolved.length) {
  fail(`skill descriptions reference ${unresolved.length} characterId(s) with no source name: ${unresolved.join(', ')}`)
}
const entityNames = {}
for (const id of [...usedIds].sort((a, b) => Number(a) - Number(b))) entityNames[id] = generalNames[id]

writeIfChanged('data/generated/ja/skills.json', {
  _meta: {
    schema: 'ranhq.ja_skills/1',
    sourceSnapshot: SNAPSHOT,
    rows: canonicalSkills, // entries in `skills` (keyed by canonical skillId)
    coveredProjectRows: deterministic, // deterministic project rows they serve
  },
  skills,
})

writeIfChanged('data/generated/source_index.json', {
  _meta: { schema: 'ranhq.source_index/1', rows: projectKeys.length },
  skills: index,
})

writeIfChanged('data/generated/ja/character_readings.json', {
  _meta: {
    schema: 'ranhq.ja_character_readings/1',
    rows: Object.keys(readings).length,
    available,
    missing,
  },
  characters: readings,
})

// ── data/generated/ja/character_names.json ───────────────────────────────────
// Effect text names allies in English ("Ally Ouhon"). The project already
// carries each character's Japanese name, so the Japanese renderer can show
// 味方王賁 instead of 味方「Ouhon」. Built from data/characters, which is the
// same source the archive renders from, so the two cannot disagree.
const characterNames = {}
for (const c of characters) {
  if (typeof c.name_en === 'string' && typeof c.name_jp === 'string' && c.name_en && c.name_jp) {
    characterNames[c.name_en] = c.name_jp
  }
}
if (Object.keys(characterNames).length < 150) {
  fail(`character_names.json has only ${Object.keys(characterNames).length} entries`)
}

writeIfChanged('data/generated/ja/character_names.json', {
  _meta: {
    schema: 'ranhq.character_names/1',
    source: 'data/characters/*.json',
    note: 'English character name -> Japanese name, for effect text that names an ally',
    entries: Object.keys(characterNames).length,
  },
  names: characterNames,
})

writeIfChanged('data/generated/ja/entity_names.json', {
  _meta: {
    schema: 'ranhq.entity_names/1',
    source: 'MsgUnitGeneralName.stbl via mstUnitGenerals.id',
    note: 'characterId -> Japanese name, for {-N:characterId} skill-description placeholders',
    entries: Object.keys(entityNames).length,
  },
  names: entityNames,
})


// Derived counts belong in provenance next to the source hashes recorded by
// the extractor. Keep the source-map summary synchronized with the reviewed
// map so the manifest is self-consistent after a maintainer refresh.
const provenance = J('data/source/_provenance.json')
const mapStatuses = Object.values(entries).reduce((counts, entry) => {
  counts.total += 1
  if (entry.status === 'exact') counts.exact += 1
  if (entry.status === 'resolved') counts.resolved += 1
  if (entry.status === 'ambiguous') counts.ambiguous += 1
  if (entry.status === 'pending_source') counts.pendingSource += 1
  if (entry.status === 'exact' || entry.status === 'resolved') counts.deterministic += 1
  return counts
}, { total: 0, exact: 0, resolved: 0, ambiguous: 0, deterministic: 0, pendingSource: 0 })
provenance.cwSkillMapping = {
  ...(provenance.cwSkillMapping || {}),
  inputFileSha256: createHash('sha256').update(readFileSync(join(root, 'data/source/cw_skills.map.json'))).digest('hex').toUpperCase(),
  total: mapStatuses.total,
  exact: mapStatuses.exact,
  resolved: mapStatuses.resolved,
  ambiguous: mapStatuses.ambiguous,
  unresolved: 0,
  deterministic: mapStatuses.deterministic,
  pendingSource: mapStatuses.pendingSource,
}
provenance.generatedArtifacts = {
  deterministicProjectSkills: deterministic, // 654 project rows with canonical identity
  canonicalJapaneseSkills: canonicalSkills, // 597 distinct skillIds serving them
  ambiguousProjectSkills: ambiguous,
  sourceIndexRows: projectKeys.length,
  rubyReadingsAvailable: available,
  rubyReadingsMissing: missing,
}
writeIfChanged('data/source/_provenance.json', provenance)

console.log(
  `build_locale_artifacts: ${canonicalSkills} canonical Japanese skills covering ${deterministic} ` +
  `deterministic project rows, ${projectKeys.length} source-index rows (${ambiguous} ambiguous), ` +
  `${available}/${available + missing} ruby readings.` +
  (written.length ? ` Updated: ${written.join(', ')}` : ' No changes.')
)
