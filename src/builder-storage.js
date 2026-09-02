import { useCallback, useEffect, useState } from 'react'

export const BUILDER_STORAGE_KEY = 'ranhq:party-builder'
export const BUILDER_SCHEMA_VERSION = 1
export const BUILDER_SLOT_COUNT = 4
export const DEFAULT_BUILDER_SKILL_MASK = Object.freeze({ n: 3, s6: true, role: false })

const defaultTeam = () => Array(BUILDER_SLOT_COUNT).fill(null)
const defaultMasks = () => Array.from(
  { length: BUILDER_SLOT_COUNT },
  () => ({ ...DEFAULT_BUILDER_SKILL_MASK }),
)

export function createDefaultBuilderState() {
  return {
    version: BUILDER_SCHEMA_VERSION,
    attack: defaultTeam(),
    defense: defaultTeam(),
    attackSkills: defaultMasks(),
    defenseSkills: defaultMasks(),
  }
}

function normalizeTeam(value) {
  const source = Array.isArray(value) ? value : []
  const seen = new Set()
  return Array.from({ length: BUILDER_SLOT_COUNT }, (_, index) => {
    const raw = source[index]
    const id = typeof raw === 'string' ? raw.trim() : ''
    if (!id || seen.has(id)) return null
    seen.add(id)
    return id
  })
}

function normalizeSkillMask(value) {
  const rawN = Number(value?.n)
  const n = Number.isFinite(rawN)
    ? Math.max(0, Math.min(3, Math.trunc(rawN)))
    : DEFAULT_BUILDER_SKILL_MASK.n
  return {
    n,
    s6: typeof value?.s6 === 'boolean' ? value.s6 : DEFAULT_BUILDER_SKILL_MASK.s6,
    role: value?.role === true,
  }
}

function normalizeMasks(value) {
  const source = Array.isArray(value) ? value : []
  return Array.from(
    { length: BUILDER_SLOT_COUNT },
    (_, index) => normalizeSkillMask(source[index]),
  )
}

/**
 * Normalize the storage schema without importing game data. Unknown character
 * IDs are reconciled separately once the lazily loaded data chunk is present.
 */
export function normalizeBuilderState(value) {
  if (!value || value.version !== BUILDER_SCHEMA_VERSION) return createDefaultBuilderState()
  return {
    version: BUILDER_SCHEMA_VERSION,
    attack: normalizeTeam(value.attack),
    defense: normalizeTeam(value.defense),
    attackSkills: normalizeMasks(value.attackSkills),
    defenseSkills: normalizeMasks(value.defenseSkills),
  }
}

function reconcileSide(ids, masks, characterById) {
  const usedRoles = new Set()
  const team = ids.map((id) => (id && characterById.has(id) ? id : null))
  const skills = masks.map((mask, index) => {
    const character = team[index] ? characterById.get(team[index]) : null
    if (!character) return { ...DEFAULT_BUILDER_SKILL_MASK }
    const roleType = character.roleSkill?.type
    const role = Boolean(mask.role && roleType && !usedRoles.has(roleType))
    if (role) usedRoles.add(roleType)
    return { ...mask, role }
  })
  return { team, skills }
}

/** Remove deleted IDs and impossible/duplicate role assignments. */
export function reconcileBuilderState(value, characters) {
  const normalized = normalizeBuilderState(value)
  const characterById = new Map(
    (Array.isArray(characters) ? characters : [])
      .filter((character) => typeof character?.id === 'string')
      .map((character) => [character.id, character]),
  )
  const attack = reconcileSide(normalized.attack, normalized.attackSkills, characterById)
  const defense = reconcileSide(normalized.defense, normalized.defenseSkills, characterById)
  return {
    version: BUILDER_SCHEMA_VERSION,
    attack: attack.team,
    defense: defense.team,
    attackSkills: attack.skills,
    defenseSkills: defense.skills,
  }
}

export function builderStateHasSetup(value) {
  const state = normalizeBuilderState(value)
  return state.attack.some(Boolean) || state.defense.some(Boolean)
}

function browserStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

export function readBuilderState() {
  try {
    const storage = browserStorage()
    const raw = storage?.getItem(BUILDER_STORAGE_KEY)
    if (!raw) return createDefaultBuilderState()
    return normalizeBuilderState(JSON.parse(raw))
  } catch {
    return createDefaultBuilderState()
  }
}

export function writeBuilderState(value) {
  try {
    const storage = browserStorage()
    if (!storage) return false
    const serialized = JSON.stringify(normalizeBuilderState(value))
    if (storage.getItem(BUILDER_STORAGE_KEY) !== serialized) {
      storage.setItem(BUILDER_STORAGE_KEY, serialized)
    }
    return true
  } catch {
    return false
  }
}

export function usePersistedBuilderState() {
  const [state, setState] = useState(readBuilderState)

  useEffect(() => {
    writeBuilderState(state)
  }, [state])

  const reconcile = useCallback((characters) => {
    setState((current) => {
      const next = reconcileBuilderState(current, characters)
      return JSON.stringify(next) === JSON.stringify(current) ? current : next
    })
  }, [])

  return [state, setState, reconcile]
}
