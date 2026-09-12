import {
  BUILDER_SCHEMA_VERSION,
  BUILDER_SLOT_COUNT,
  normalizeBuilderState,
} from './builder-storage.js'

export const BUILDER_SHARE_VERSION = 1
export const MAX_BUILDER_SHARE_QUERY_LENGTH = 1200

const TEAM_NULL = '-'
const CHARACTER_ID = /^[a-z0-9][a-z0-9_-]{0,99}$/
const REQUIRED_PARAMS = ['plan', 'a', 'd', 'as', 'ds', 'c']

const encodeTeam = team => team.map(id => id || TEAM_NULL).join(',')
const encodeMasks = masks => masks
  .map(mask => `${mask.n}${mask.s6 ? 1 : 0}${mask.role ? 1 : 0}`)
  .join(',')

function decodeTeam(raw) {
  const tokens = raw.split(',')
  if (tokens.length !== BUILDER_SLOT_COUNT) return null
  const team = tokens.map(token => token === TEAM_NULL ? null : token)
  return team.every(id => id === null || CHARACTER_ID.test(id)) ? team : null
}

function decodeMasks(raw) {
  const tokens = raw.split(',')
  if (tokens.length !== BUILDER_SLOT_COUNT || tokens.some(token => !/^[0-3][01][01]$/.test(token))) return null
  return tokens.map(token => ({ n: Number(token[0]), s6: token[1] === '1', role: token[2] === '1' }))
}

/**
 * Serialize only the canonical, user-selected Builder inputs. Character names,
 * calculated totals, local storage, and source data never enter the URL.
 */
export function encodeBuilderShareSearch(value, { includeCombat = false } = {}) {
  const state = normalizeBuilderState(value)
  const params = new URLSearchParams()
  params.set('plan', String(BUILDER_SHARE_VERSION))
  params.set('a', encodeTeam(state.attack))
  params.set('d', encodeTeam(state.defense))
  params.set('as', encodeMasks(state.attackSkills))
  params.set('ds', encodeMasks(state.defenseSkills))
  params.set('c', includeCombat ? '1' : '0')
  const search = `?${params.toString()}`
  if (search.length > MAX_BUILDER_SHARE_QUERY_LENGTH) throw new Error('Builder share state is too large')
  return search
}

/**
 * Decode the versioned URL boundary without trusting it. Registry-dependent
 * checks (unknown IDs and impossible role selections) are applied separately
 * by reconcileBuilderState once the lazy character data is available.
 */
export function decodeBuilderShareSearch(search = '') {
  const raw = String(search || '')
  if (!raw) return { status: 'absent' }
  if (raw.length > MAX_BUILDER_SHARE_QUERY_LENGTH) return { status: 'invalid', reason: 'oversized' }
  try {
    const params = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw)
    if (!params.has('plan')) return { status: 'absent' }
    if (REQUIRED_PARAMS.some(key => params.getAll(key).length !== 1)) return { status: 'invalid', reason: 'shape' }
    if (params.get('plan') !== String(BUILDER_SHARE_VERSION)) return { status: 'invalid', reason: 'version' }
    const attack = decodeTeam(params.get('a'))
    const defense = decodeTeam(params.get('d'))
    const attackSkills = decodeMasks(params.get('as'))
    const defenseSkills = decodeMasks(params.get('ds'))
    const combat = params.get('c')
    if (!attack || !defense || !attackSkills || !defenseSkills || !/^[01]$/.test(combat)) {
      return { status: 'invalid', reason: 'content' }
    }
    return {
      status: 'valid',
      version: BUILDER_SHARE_VERSION,
      state: {
        version: BUILDER_SCHEMA_VERSION,
        attack,
        defense,
        attackSkills,
        defenseSkills,
      },
      includeCombat: combat === '1',
    }
  } catch {
    return { status: 'invalid', reason: 'decode' }
  }
}
