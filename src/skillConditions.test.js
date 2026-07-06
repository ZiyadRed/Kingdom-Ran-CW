import { describe, it, expect } from 'vitest'
import { classifyConditionParts, splitConditionParts } from './skillConditions.js'

const labels = (condition) => classifyConditionParts(condition).map(part => part.label)
const texts = (condition) => classifyConditionParts(condition).map(part => part.text)

describe('skill condition display classifier', () => {
  it('labels target selectors without calling them IF conditions', () => {
    expect(labels('Enemy [General] with highest ATK')).toEqual(['Target'])
  })

  it('separates battle timing from target selection', () => {
    expect(labels('When Garrisoning, enemy [General] with highest ATK')).toEqual(['When', 'Target'])
  })

  it('separates activation requirements from target selection', () => {
    expect(classifyConditionParts('Own HP < 90%, enemy [General] with highest DEF')).toEqual([
      { kind: 'requires', label: 'Requires', text: 'Own HP < 90%' },
      { kind: 'target', label: 'Target', text: 'enemy [General] with highest DEF' },
    ])
  })

  it('labels scaling and chained-damage qualifiers', () => {
    expect(labels('Per ally [Cavalry] [General]')).toEqual(['Scales'])
    expect(labels('From the 170% Damage')).toEqual(['After'])
  })

  it('keeps comma-separated faction lists together when they form one target selector', () => {
    const condition='[Zhao], [Wei], [Chu], [Qi] enemy with highest ATK'
    expect(splitConditionParts(condition)).toEqual([condition])
    expect(labels(condition)).toEqual(['Target'])
  })

  it('splits target plus own-HP clauses joined with and', () => {
    expect(texts('Enemy [General] with highest DEF and own HP > 90%')).toEqual([
      'Enemy [General] with highest DEF',
      'own HP > 90%',
    ])
    expect(labels('Enemy [General] with highest DEF and own HP > 90%')).toEqual(['Target', 'Requires'])
  })

  it('labels mode and route qualifiers distinctly', () => {
    expect(labels('CW battle (effective even when not deployed)')).toEqual(['Mode'])
    expect(labels('When passing Marsh terrain (effective even if not deployed)')).toEqual(['Route'])
  })

  it('returns no chips for empty conditions', () => {
    expect(classifyConditionParts(null)).toEqual([])
    expect(classifyConditionParts('')).toEqual([])
  })
})
