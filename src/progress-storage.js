export const PROGRESS_STORAGE_KEY = 'ranhq-progress-v3'
export const PROGRESS_SNAPSHOT_KEY = `${PROGRESS_STORAGE_KEY}:before-import`
export const emptyProgress = () => ({ cw6Cards: {}, sceneBuffCards: {}, sceneBuffStars: {}, buffSources: {} })

const BUCKETS = Object.keys(emptyProgress())
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const exactKeys = (value, keys) => isRecord(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key))

export class ProgressImportError extends Error {
  constructor(code, options) {
    super(code, options)
    this.name = 'ProgressImportError'
    this.code = code
  }
}

// Since its introduction in 8850e1a, the exporter has written version 1 and
// all four buckets. The only unversioned input we support is that exact raw
// storage shape, also accepted by the original importer. Partial objects and
// imagined older versions are not backups. IDs remain opaque; never guess or
// discard ownership because a source is absent from today's roster.
export function parseProgressBackup(text) {
  try {
    const parsed = JSON.parse(text)
    let raw = parsed
    if (isRecord(parsed) && Object.hasOwn(parsed, 'version')) {
      if (!exactKeys(parsed, ['version', 'exportedAt', 'progress']) || parsed.version !== 1) throw Error()
      if (typeof parsed.exportedAt !== 'string' || new Date(parsed.exportedAt).toISOString() !== parsed.exportedAt) throw Error()
      raw = parsed.progress
    }
    if (!exactKeys(raw, BUCKETS)) throw Error()
    for (const bucket of BUCKETS) {
      if (!isRecord(raw[bucket])) throw Error()
      for (const [id, value] of Object.entries(raw[bucket])) {
        if (!id.trim() || ['__proto__', 'constructor', 'prototype'].includes(id)) throw Error()
        if (bucket === 'sceneBuffStars') {
          if (!Number.isInteger(value) || value < 1 || value > 6) throw Error()
        } else if (typeof value !== 'boolean') throw Error()
      }
    }
    return Object.fromEntries(BUCKETS.map(bucket => [bucket, { ...raw[bucket] }]))
  } catch {
    throw new ProgressImportError('format')
  }
}

export function progressImportCounts(progress) {
  const owned = bucket => Object.keys(progress[bucket]).filter(id => progress[bucket][id])
  return {
    cw6: owned('cw6Cards').length,
    scene: new Set([...owned('sceneBuffCards'), ...owned('sceneBuffStars')]).size,
    buffs: owned('buffSources').length,
  }
}

export function readProgressSnapshot(storage) {
  try {
    const snapshot = JSON.parse(storage.getItem(PROGRESS_SNAPSHOT_KEY))
    return snapshot?.version === 1 && typeof snapshot.raw === 'string' ? snapshot.raw : null
  } catch {
    return null
  }
}

// Validate before touching storage or state. localStorage.setItem is atomic
// for one key; if the main write fails, restore the previous snapshot key.
// The hook commits React state and announces success only after this returns.
export function replaceProgressFromBackup(text, storage, normalize = value => value) {
  const progress = normalize(parseProgressBackup(text))
  const serialized = JSON.stringify(progress)
  let previousSnapshot
  let snapshotWritten = false
  try {
    const previous = storage.getItem(PROGRESS_STORAGE_KEY) ?? JSON.stringify(emptyProgress())
    previousSnapshot = storage.getItem(PROGRESS_SNAPSHOT_KEY)
    storage.setItem(PROGRESS_SNAPSHOT_KEY, JSON.stringify({ version: 1, raw: previous }))
    snapshotWritten = true
    storage.setItem(PROGRESS_STORAGE_KEY, serialized)
  } catch (error) {
    if (snapshotWritten) {
      try {
        if (previousSnapshot === null) storage.removeItem(PROGRESS_SNAPSHOT_KEY)
        else storage.setItem(PROGRESS_SNAPSHOT_KEY, previousSnapshot)
      } catch (rollbackError) {
        console.error('RanHQ could not restore the prior import snapshot.', rollbackError)
      }
    }
    throw new ProgressImportError('storage', { cause: error })
  }
  return { progress, counts: progressImportCounts(progress) }
}
