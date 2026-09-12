import { describe, expect, it, vi } from 'vitest'
import { normalizeProgress } from './core.jsx'
import unitBuffs from '../data/cw_buffs.json'
import buffLegacy from '../data/buff_ownership_legacy.json'
import { emptyProgress, parseProgressBackup, parseProgressStorageValue, PROGRESS_STORAGE_KEY, PROGRESS_SNAPSHOT_KEY, progressImportCounts, readProgressSnapshot, replaceProgressFromBackup, writeProgressState, writeProgressValue } from './progress-storage.js'

const populated = () => ({ cw6Cards: { '40172': true, oldCard: false }, sceneBuffCards: { legacyCard: true }, sceneBuffStars: { currentCard: 4 }, buffSources: { sourceA: true, 'sourceB:shard': true } })
const backup = progress => ({ version: 1, exportedAt: '2026-09-05T10:00:00.000Z', progress })
function storageFixture() {
  const before = JSON.stringify(populated(), null, 2)
  const values = new Map([[PROGRESS_STORAGE_KEY, before], [PROGRESS_SNAPSHOT_KEY, 'older snapshot'], ['unrelated', 'unchanged']])
  return { values, before, storage: {
    getItem: vi.fn(key => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn(key => values.delete(key)),
  } }
}

const invalid = [null, [], {}, { unexpected: true }, true, 1, 'abc', { progress: populated() },
  { ...backup(populated()), version: 2 }, { ...backup(populated()), version: '1' },
  { ...backup(populated()), exportedAt: 'invalid' }, { ...backup(populated()), progress: null },
  { ...backup(populated()), extra: true }, { cw6Cards: {} },
  ...Object.keys(emptyProgress()).flatMap(bucket => [null, [], 'bad', 1, true].map(value => ({ ...populated(), [bucket]: value }))),
  ...['cw6Cards', 'sceneBuffCards', 'buffSources'].flatMap(bucket => [null, [], {}, 1, 'true'].map(value => ({ ...populated(), [bucket]: { bad: value } }))),
  ...[null, {}, [], false, '3', 0, 7, -1, 2.5].map(value => ({ ...populated(), sceneBuffStars: { bad: value } })),
  { ...populated(), unknown: {} },
  { ...populated(), buffSources: JSON.parse('{"__proto__":true}') },
  { ...populated(), cw6Cards: { '': true } },
]

describe('progress import validation and storage atomicity (F01)', () => {
  it.each(invalid.map((value, i) => [i, value]))('rejects malformed input %s without state or storage mutation', (_i, value) => {
    const { values, storage } = storageFixture()
    const before = [...values]
    const normalize = vi.fn(normalizeProgress)
    expect(() => replaceProgressFromBackup(JSON.stringify(value), storage, normalize)).toThrow('format')
    expect(normalize).not.toHaveBeenCalled()
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(storage.removeItem).not.toHaveBeenCalled()
    expect([...values]).toEqual(before)
  })

  it('rejects invalid JSON and an incomplete four-bucket object', () => {
    expect(() => parseProgressBackup('{')).toThrow('format')
    const partial = populated()
    delete partial.sceneBuffStars
    expect(() => parseProgressBackup(JSON.stringify(backup(partial)))).toThrow('format')
  })

  it.each(['version1', 'raw-v3'])('round-trips the supported %s shape, including a valid empty replacement', shape => {
    for (const original of [populated(), emptyProgress()]) {
      const { storage } = storageFixture()
      const text = JSON.stringify(shape === 'version1' ? backup(original) : original)
      const result = replaceProgressFromBackup(text, storage, normalizeProgress)
      expect(result.progress).toEqual(original)
      expect(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY))).toEqual(original)
      expect(parseProgressBackup(JSON.stringify(backup(result.progress)))).toEqual(original)
    }
  })

  it('keeps the prior saved bytes recoverable and swaps snapshots on restore', () => {
    const { before, storage } = storageFixture()
    replaceProgressFromBackup(JSON.stringify(backup(emptyProgress())), storage, normalizeProgress)
    expect(readProgressSnapshot(storage)).toBe(before)
    const restored = replaceProgressFromBackup(readProgressSnapshot(storage), storage, normalizeProgress)
    expect(restored.progress).toEqual(populated())
    expect(JSON.parse(readProgressSnapshot(storage))).toEqual(emptyProgress())
    expect(storage.getItem('unrelated')).toBe('unchanged')
  })

  it.each([PROGRESS_SNAPSHOT_KEY, PROGRESS_STORAGE_KEY])('leaves storage intact when writing %s fails', failedKey => {
    const { storage, values } = storageFixture()
    const before = [...values]
    storage.setItem.mockImplementation((key, value) => {
      if (key === failedKey) throw Error('quota')
      values.set(key, value)
    })
    expect(() => replaceProgressFromBackup(JSON.stringify(backup(emptyProgress())), storage)).toThrow('storage')
    expect([...values]).toEqual(before)
  })

  it('counts unique scene ownership without counting an old boolean twice', () => {
    const progress = populated()
    progress.sceneBuffStars.legacyCard = 6
    expect(progressImportCounts(progress)).toEqual({ cw6: 1, scene: 2, buffs: 2 })
  })

  it('applies existing evidenced indexed, shard, Fuuki and Nakon migrations only after validation', () => {
    const nakonEntries = unitBuffs.Cavalry.Defense.filter(entry => entry.name === 'Nakon')
    const nakonLegacy = `unit:Cavalry:Defense:${nakonEntries[0].name}:${nakonEntries[0].name_jp}:10:${nakonEntries[0].special_label || ''}`
    const legacy = emptyProgress()
    legacy.buffSources = {
      'state:Chu:Attack:Kyoubou:巨暴:5::7': true,
      'state:Chu:Attack:Kyoubou:巨暴:5::9:shard': true,
      'unit:Shield:HP:Mouki:蒙毅:18.2::4:shard': true,
      'siege:Attack Siege Weapons:HP:Hoki:馮忌:12.3:': true,
      [nakonLegacy]: true,
    }
    const { storage } = storageFixture()
    const result = replaceProgressFromBackup(JSON.stringify(backup(legacy)), storage, normalizeProgress)
    expect(result.progress).toEqual(normalizeProgress(legacy))
    expect(result.progress.buffSources[buffLegacy.legacyKeys['state:Chu:Attack:Kyoubou:巨暴:5:'][0]]).toBe(true)
    expect(result.progress.buffSources[buffLegacy.legacyKeys['siege:Attack Siege Weapons:HP:Fuuki:馮忌:12.3:'][0]]).toBe(true)
    expect(nakonEntries.every(entry => result.progress.buffSources[entry.ownership_id])).toBe(true)
    expect(result.progress.buffSources[buffLegacy.legacyKeys['unit:Shield:HP:Mouki:蒙毅:18.2::shard'][0]]).toBe(true)
    // This source has no evidenced shard toggle. Preserve its unknown key.
    expect(result.progress.buffSources['state:Chu:Attack:Kyoubou:巨暴:5::9:shard']).toBe(true)
    expect(legacy.buffSources['state:Chu:Attack:Kyoubou:巨暴:5::7']).toBe(true)
  })
})

describe('cross-tab progress persistence (F04)', () => {
  it('merges one local intent into the newest stored snapshot', () => {
    const { storage } = storageFixture()
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
      ...emptyProgress(),
      cw6Cards: { '40172': true },
      buffSources: { stableSource: true },
    }))
    const result = writeProgressValue(
      storage,
      emptyProgress(),
      'cw6Cards',
      '40186',
      true,
      normalizeProgress,
    )
    expect(result.saved).toBe(true)
    expect(result.progress.cw6Cards).toEqual({ '40172': true, '40186': true })
    expect(result.progress.buffSources).toEqual({ stableSource: true })
    expect(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY))).toEqual(result.progress)
  })

  it('removes only the requested stable ID from current storage', () => {
    const { storage } = storageFixture()
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
      ...emptyProgress(),
      cw6Cards: { '40172': true, '40186': true },
    }))
    const result = writeProgressValue(storage, emptyProgress(), 'cw6Cards', '40172', false, normalizeProgress)
    expect(result.progress.cw6Cards).toEqual({ '40186': true })
  })

  it('keeps a session-only update and reports failure when storage rejects writes', () => {
    const { storage, values, before } = storageFixture()
    storage.setItem.mockImplementation(() => { throw Error('quota') })
    const result = writeProgressValue(storage, JSON.parse(before), 'cw6Cards', '40186', true, normalizeProgress)
    expect(result.saved).toBe(false)
    expect(result.progress.cw6Cards).toMatchObject({ '40172': true, '40186': true })
    expect(values.get(PROGRESS_STORAGE_KEY)).toBe(before)
    expect(values.get('unrelated')).toBe('unchanged')
  })

  it('ignores corrupt live events and persists a valid replacement after corrupt storage', () => {
    expect(parseProgressStorageValue('{broken', normalizeProgress)).toBeNull()
    expect(parseProgressStorageValue('[]', normalizeProgress)).toBeNull()
    expect(parseProgressStorageValue(JSON.stringify({ ...emptyProgress(), cw6Cards: { '40172': 'yes' } }), normalizeProgress)).toBeNull()
    expect(parseProgressStorageValue(JSON.stringify({ cw6Cards: {} }), normalizeProgress)).toBeNull()
    expect(parseProgressStorageValue(null, normalizeProgress)).toEqual(emptyProgress())

    const { storage } = storageFixture()
    storage.setItem(PROGRESS_STORAGE_KEY, '{broken')
    const result = writeProgressValue(storage, emptyProgress(), 'cw6Cards', '40172', true, normalizeProgress)
    expect(result.saved).toBe(true)
    expect(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY))).toEqual(result.progress)
  })

  it('writes exact defaults without touching unrelated keys', () => {
    const { storage } = storageFixture()
    expect(writeProgressState(storage, emptyProgress(), normalizeProgress)).toBe(true)
    expect(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY))).toEqual(emptyProgress())
    expect(storage.getItem('unrelated')).toBe('unchanged')
  })
})
