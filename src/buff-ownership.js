import manifest from '../data/buff_ownership_legacy.json'

const validId = id => /^buff_[a-f0-9]{32}(?::shard)?$/.test(id)
const legacyKeys = manifest.legacyKeys

export function buffOwnershipId(entry) {
  const id = entry?.ownership_id
  if (typeof id !== 'string' || !validId(id) || id.endsWith(':shard')) {
    throw new Error('Buff source is missing its authored ownership ID')
  }
  return id
}

function legacyTargets(key, aliases) {
  if (Object.hasOwn(aliases, key)) return aliases[key]
  // Historical keys appended an array index and, for the independent shard
  // toggle, :shard. Strip only that suffix, and only into an explicit alias.
  const indexed = /^(.*):\d+(:shard)?$/.exec(key)
  if (!indexed) return null
  const candidate = indexed[1] + (indexed[2] || '')
  return Object.hasOwn(aliases, candidate) ? aliases[candidate] : null
}

export function migrateBuffOwnership(raw = {}, aliases = legacyKeys) {
  const migrated = new Map()
  for (const [key, value] of Object.entries(raw)) {
    const targets = legacyTargets(key, aliases)
    // Unknown/ambiguous identities remain opaque and round-trip unchanged.
    // A current true flag wins over a false alias regardless of input order.
    const ids = Array.isArray(targets) && targets.length && targets.every(validId) ? targets : [key]
    for (const id of ids) if (migrated.get(id) !== true) migrated.set(id, value)
  }
  return Object.fromEntries(migrated)
}
