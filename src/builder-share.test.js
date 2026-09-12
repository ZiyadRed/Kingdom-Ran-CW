import { describe, expect, it } from 'vitest'
import {
  BUILDER_SHARE_VERSION,
  decodeBuilderShareSearch,
  encodeBuilderShareSearch,
} from './builder-share.js'

const mask = (n = 3, s6 = true, role = false) => ({ n, s6, role })
const plan = {
  version: 1,
  attack: ['shouheikun', 'renpa', 'shin', 'makou'],
  defense: ['rien', 'beiman', 'karin', 'shunshinkun'],
  attackSkills: [mask(2, false, true), mask(3, true, true), mask(), mask(1, false)],
  defenseSkills: [mask(3, true, true), mask(2), mask(1, false), mask(0, false)],
}

describe('Builder share state', () => {
  it('round-trips stable IDs, slot order, skill masks, and the combat option', () => {
    const search = encodeBuilderShareSearch(plan, { includeCombat: true })
    const decoded = decodeBuilderShareSearch(search)

    expect(decoded).toEqual({
      status: 'valid',
      version: BUILDER_SHARE_VERSION,
      state: plan,
      includeCombat: true,
    })
  })

  it('is deterministic and locale-independent', () => {
    const first = encodeBuilderShareSearch(plan, { includeCombat: false })
    const equivalent = encodeBuilderShareSearch(JSON.parse(JSON.stringify(plan)), { includeCombat: false })
    expect(equivalent).toBe(first)
  })

  it('distinguishes an ordinary Builder URL from malformed shared state', () => {
    expect(decodeBuilderShareSearch('')).toEqual({ status: 'absent' })
    expect(decodeBuilderShareSearch('?plan=99')).toMatchObject({ status: 'invalid' })
    expect(decodeBuilderShareSearch('?plan=1&a=<script>')).toMatchObject({ status: 'invalid' })
    expect(decodeBuilderShareSearch(`?plan=1&a=${'x'.repeat(1300)}`)).toMatchObject({ status: 'invalid' })
  })
})
