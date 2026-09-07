import { describe, expect, it } from 'vitest'
import units from '../data/cw_buffs.json'
import teams from '../data/cw_team_buffs.json'
import manifest from '../data/buff_ownership_legacy.json'
import { TERRAIN_BUFFS } from './features/buffs/data.js'
import { buffSourceId, normalizeProgress } from './core.jsx'
import { buffOwnershipId, migrateBuffOwnership } from './buff-ownership.js'

const rows = []
for (const [kind, groups] of Object.entries({ unit: units, state: teams.states, army: teams.armies, siege: teams.siege })) {
  for (const [key, stats] of Object.entries(groups)) for (const [stat, entries] of Object.entries(stats)) {
    entries.forEach(entry => rows.push({ kind, key, stat, entry }))
  }
}
for (const terrain of TERRAIN_BUFFS) terrain.entries.forEach(entry => rows.push({ kind: 'terrain', key: terrain.name, stat: 'terrain', entry }))
const idFor = ({ kind, key, stat, entry }, index) => buffSourceId(kind, key, stat, entry, index)
const aliases = manifest.legacyKeys

describe('authored buff ownership identity', () => {
  it('gives every displayed source a unique authored ID independent of source/game IDs', () => {
    const ids = rows.map(idFor)
    expect(new Set(ids).size).toBe(rows.length)
    expect(ids.every(id => /^buff_[a-f0-9]{32}$/.test(id))).toBe(true)
    expect(ids.every(id => !Object.hasOwn(aliases, id))).toBe(true)
    expect(manifest.version).toBe(1)
    const current = new Set(rows.flatMap(row => row.entry.shard_bonus ? [idFor(row), idFor(row) + ':shard'] : [idFor(row)]))
    const targets = new Set(Object.values(aliases).flat())
    expect(targets).toEqual(current)
  })

  it('preserves saved ownership through name/value corrections, insertion and reorder in every category', () => {
    const ids = rows.map(idFor)
    const saved = Object.fromEntries(ids.map(id => [id, true]))
    const corrected = rows.map(row => ({ ...row, key: 'Revised category label', stat: 'Revised stat label', entry: { ...row.entry, name: 'Revised name', name_jp: '変更後', value: row.entry.value + 1, special_label: 'Revised description', source_id: 'corrected-source-reference' } }))
    expect(corrected.map(idFor)).toEqual(ids)
    const inserted = { ...corrected[0], entry: { ...corrected[0].entry, ownership_id: 'buff_00000000000000000000000000000000' } }
    const reordered = [inserted, ...corrected.toReversed()]
    expect(reordered.filter(row => saved[idFor(row)]).map(idFor).sort()).toEqual([...ids].sort())
    expect(migrateBuffOwnership(saved)).toEqual(saved)
  })

  it.each([{}, { ownership_id: '' }, { ownership_id: 'mutable-name' }, { ownership_id: 'buff_00000000000000000000000000000000:shard' }])('fails closed for a source without a valid base ID', entry => {
    expect(() => buffOwnershipId(entry)).toThrow('authored ownership ID')
  })

  it('maps an exact frozen alias and its historical index without depending on current content', () => {
    const legacy = 'unit:Cavalry:HP:Bakukoshin:縛虎申:18.2:'
    const id = 'buff_a3734d62c7434ef898229b2e4548c760'
    expect(migrateBuffOwnership({ [legacy]: true })).toEqual({ [id]: true })
    expect(migrateBuffOwnership({ [legacy + ':12']: true })).toEqual({ [id]: true })
    expect(migrateBuffOwnership({ [legacy]: false, [legacy + ':12']: true, [id]: false })).toEqual({ [id]: true })
    expect(migrateBuffOwnership({ [id]: true, [legacy]: false })).toEqual({ [id]: true })
  })

  it('keeps shard and red-crystal ownership independent, including indexed legacy shard keys', () => {
    const legacy = 'unit:Shield:HP:Mouki:蒙毅:18.2:'
    const [id] = aliases[legacy]
    expect(migrateBuffOwnership({ [legacy + ':4:shard']: true })).toEqual({ [id + ':shard']: true })
    expect(migrateBuffOwnership({ [legacy]: true, [legacy + ':shard']: false })).toEqual({ [id]: true, [id + ':shard']: false })
    for (const row of rows.filter(row => row.entry.shard_bonus)) expect(Object.values(aliases).some(ids => ids.includes(idFor(row) + ':shard'))).toBe(true)
  })

  it('retains unknown or explicitly ambiguous keys verbatim instead of guessing a destination', () => {
    const raw = { 'future:value:9:shard': true, unknown: false, ambiguous: true }
    expect(migrateBuffOwnership(raw, { ambiguous: null })).toEqual(raw)
    expect(migrateBuffOwnership(raw, { ambiguous: [] })).toEqual(raw)
    const unknownShard = 'state:Chu:Attack:Kyoubou:巨暴:5::9:shard'
    expect(migrateBuffOwnership({ [unknownShard]: true })).toEqual({ [unknownShard]: true })
  })

  it('keeps the evidenced Fuuki alias and Nakon split without merging the independent Kyoubou sources', () => {
    const hoki = 'siege:Attack Siege Weapons:HP:Hoki:馮忌:12.3:'
    const fuuki = 'siege:Attack Siege Weapons:HP:Fuuki:馮忌:12.3:'
    expect(migrateBuffOwnership({ [hoki]: true })).toEqual({ [aliases[fuuki][0]]: true })
    const nakon = 'unit:Cavalry:Defense:Nakon:奈棍:10:Shard upgrade'
    const targets = units.Cavalry.Defense.filter(entry => entry.source_id?.startsWith('nakon-defense')).map(entry => entry.ownership_id)
    expect(aliases[nakon]).toEqual(targets)
    expect(migrateBuffOwnership({ [nakon]: true })).toEqual(Object.fromEntries(targets.map(id => [id, true])))
    const kyoubou = teams.states.Chu.Attack.filter(entry => entry.name === 'Kyoubou')
    expect(new Set(kyoubou.map(buffOwnershipId)).size).toBe(kyoubou.length)
  })

  it('migrates every frozen alias idempotently without mutating input or other progress buckets', () => {
    const buffSources = Object.fromEntries(Object.keys(aliases).map(key => [key, true]))
    const raw = { cw6Cards: { '40172': true }, sceneBuffCards: { retained: true }, sceneBuffStars: { retained: 4 }, buffSources }
    const before = JSON.stringify(raw)
    const migrated = normalizeProgress(raw)
    expect(migrated.buffSources).toEqual(Object.fromEntries([...new Set(Object.values(aliases).flat())].map(id => [id, true])))
    expect(normalizeProgress(migrated)).toEqual(migrated)
    expect({ ...migrated, buffSources }).toEqual(raw)
    expect(JSON.stringify(raw)).toBe(before)
  })
})
