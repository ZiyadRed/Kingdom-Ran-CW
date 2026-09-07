import { describe, expect, it } from 'vitest'
import { createCastleDraft, normalizeCastleDraft, makeAlliance, allianceDisplayName, defaultAllianceName } from './castle-draft.js'
import { createTeamCostDraft, normalizeTeamCostDraft } from './team-cost-draft.js'

describe('Castle Points draft contract', () => {
  it.each([null, [], {}, { version: 2 }, { version: 1, mode: 'translated mode', boards: {} }])('rejects incompatible storage %j', value => {
    expect(normalizeCastleDraft(value)).toEqual(createCastleDraft())
  })
  it('round trips both independent boards, mode, IDs, names and carried points', () => {
    const draft = createCastleDraft()
    draft.mode = 'selection'
    draft.boards.normal[0] = { ...draft.boards.normal[0], large: 4, medium: 3, small: 2, carried: 12345, name: 'My Alliance' }
    draft.boards.selection.push({ ...makeAlliance(1), name: 'Alliance 2', large: 5, carried: 67890 })
    expect(normalizeCastleDraft(JSON.parse(JSON.stringify(draft)))).toEqual(draft)
  })
  it('keeps typed default-looking text distinct from translated defaults', () => {
    const t = key => ({ 'castlePoints.mine': 'Mon alliance', 'castlePoints.alliance': 'Alliance' })[key]
    const mine = makeAlliance(0, true)
    expect(allianceDisplayName(mine, t)).toBe('Mon alliance')
    expect(allianceDisplayName({ ...mine, name: 'My Alliance' }, t)).toBe('My Alliance')
    expect(allianceDisplayName({ ...mine, name: ' Alliance 2 ' }, t)).toBe(' Alliance 2 ')
    expect(defaultAllianceName(makeAlliance(2), t)).toBe('Alliance 3')
  })
  it('repairs invalid numeric fields without interpreting labels or inventing IDs', () => {
    const draft = createCastleDraft()
    Object.assign(draft.boards.normal[0], { large: -2, medium: 3.8, small: '8', carried: Infinity })
    expect(normalizeCastleDraft(draft).boards.normal[0]).toMatchObject({ id: 'mine', name: null, large: 0, medium: 3, small: 0, carried: 0 })
  })
  it.each(['duplicate', 'missing-mine', 'bad-name', 'too-many'])('fails safely for %s rows while preserving the other board', kind => {
    const draft = createCastleDraft()
    draft.boards.selection[0].carried = 7654
    if (kind === 'duplicate') draft.boards.normal.push({ ...draft.boards.normal[0] })
    if (kind === 'missing-mine') draft.boards.normal = [makeAlliance(1)]
    if (kind === 'bad-name') draft.boards.normal[0].name = { translated: true }
    if (kind === 'too-many') draft.boards.normal.push(...Array.from({ length: 7 }, (_, i) => makeAlliance(i + 1)))
    const normalized = normalizeCastleDraft(draft)
    expect(normalized.boards.normal).toEqual(createCastleDraft().boards.normal)
    expect(normalized.boards.selection[0].carried).toBe(7654)
  })
})

describe('Team Cost draft contract', () => {
  const ids = new Set(['moubu', 'renpa'])
  it.each([null, [], {}, { version: 2 }, { version: 1, slots: [], skillsDone: [] }])('rejects incompatible storage %j', value => {
    expect(normalizeTeamCostDraft(value, ids)).toEqual(createTeamCostDraft())
  })
  it('round trips stable IDs and completed skill counts without full character objects', () => {
    const draft = { version: 1, slots: ['moubu', null, 'renpa', null], skillsDone: [2, 0, 3, 0] }
    expect(normalizeTeamCostDraft(JSON.parse(JSON.stringify(draft)), ids)).toEqual(draft)
  })
  it('drops unknown IDs and refuses display-name or object migration guesses', () => {
    const draft = { version: 1, slots: ['moubu', 'Moubu', { id: 'renpa' }, 'missing'], skillsDone: [2, 2, 3, 1] }
    expect(normalizeTeamCostDraft(draft, ids)).toEqual({ version: 1, slots: ['moubu', null, null, null], skillsDone: [2, 0, 0, 0] })
  })
  it('normalizes skill flags to supported counts and clears flags on empty slots', () => {
    expect(normalizeTeamCostDraft({ version: 1, slots: ['moubu', 'renpa', 'moubu', null], skillsDone: [20, -1, 1.5, 3] }, ids).skillsDone).toEqual([3, 0, 0, 0])
  })
  it('preserves the picker rule that each general can occupy only one slot', () => {
    const draft = { version: 1, slots: ['moubu', 'moubu', 'renpa', null], skillsDone: [2, 3, 1, 0] }
    expect(normalizeTeamCostDraft(draft, ids)).toEqual({ version: 1, slots: ['moubu', null, 'renpa', null], skillsDone: [2, 0, 1, 0] })
  })
})
