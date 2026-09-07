export const TEAM_COST_DRAFT_KEY = 'ranhq:team-cost'
export const createTeamCostDraft = () => ({ version: 1, slots: [null, null, null, null], skillsDone: [0, 0, 0, 0] })

export function normalizeTeamCostDraft(value, validIds) {
  if (!value || value.version !== 1 || !Array.isArray(value.slots) || value.slots.length !== 4 || !Array.isArray(value.skillsDone) || value.skillsDone.length !== 4) return createTeamCostDraft()
  const seen = new Set()
  const slots = value.slots.map(id => {
    if (typeof id !== 'string' || !validIds.has(id) || seen.has(id)) return null
    seen.add(id)
    return id
  })
  const skillsDone = slots.map((id, index) => id && Number.isInteger(value.skillsDone[index]) ? Math.max(0, Math.min(3, value.skillsDone[index])) : 0)
  return { version: 1, slots, skillsDone }
}
