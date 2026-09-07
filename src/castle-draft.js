export const CASTLE_DRAFT_KEY = 'ranhq:castle-points'
export const CASTLE_MODES = ['normal', 'selection']

export function makeAlliance(index, isMine = false) {
  return { id: isMine ? 'mine' : `alliance-${index + 1}`, name: null, defaultNumber: index + 1, large: 0, medium: 0, small: 0, carried: 0, isMine }
}

export const defaultBoard = () => [makeAlliance(0, true)]
export const createCastleDraft = () => ({ version: 1, mode: 'normal', boards: { normal: defaultBoard(), selection: defaultBoard() } })

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const nonnegativeInteger = value => typeof value === 'number' && Number.isFinite(value) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.trunc(value))) : 0

function normalizeBoard(board) {
  if (!Array.isArray(board) || board.length < 1 || board.length > 7) return defaultBoard()
  const ids = new Set()
  const valid = board.every(row => {
    if (!object(row) || typeof row.id !== 'string' || !row.id || ids.has(row.id) || typeof row.isMine !== 'boolean' || row.isMine !== (row.id === 'mine') || (row.name !== null && typeof row.name !== 'string')) return false
    ids.add(row.id)
    return true
  })
  if (!valid || !board.some(row => row.isMine)) return defaultBoard()
  return board.map((row, index) => ({
    id: row.id, isMine: row.isMine, name: row.name,
    defaultNumber: nonnegativeInteger(row.defaultNumber) || index + 1,
    ...Object.fromEntries(['large', 'medium', 'small', 'carried'].map(key => [key, nonnegativeInteger(row[key])])),
  }))
}

export function normalizeCastleDraft(value) {
  if (!object(value) || value.version !== 1 || !CASTLE_MODES.includes(value.mode) || !object(value.boards)) return createCastleDraft()
  return { version: 1, mode: value.mode, boards: Object.fromEntries(CASTLE_MODES.map(mode => [mode, normalizeBoard(value.boards[mode])])) }
}

export function defaultAllianceName(alliance, t) {
  return alliance.isMine ? t('castlePoints.mine') : `${t('castlePoints.alliance')} ${alliance.defaultNumber}`
}

export function allianceDisplayName(alliance, t) {
  return typeof alliance.name === 'string' && alliance.name.trim() ? alliance.name : defaultAllianceName(alliance, t)
}
