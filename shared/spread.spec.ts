// ABOUTME: Tests spread stats and outlier flagging over revealed votes.
import { describe, expect, it } from 'vitest'
import { computeSpread, outlierFlag, parseCard } from './spread'

describe('parseCard', () => {
  it('parses numbers and ½, rejects non-numeric', () => {
    expect(parseCard('13')).toBe(13)
    expect(parseCard('½')).toBe(0.5)
    expect(parseCard('M')).toBeNull()
    expect(parseCard('')).toBeNull()
  })
})

describe('computeSpread', () => {
  it('computes median and range over numeric votes', () => {
    const s = computeSpread(['3', '5', '8', '13'])
    expect(s.median).toBe(6.5)
    expect(s.min).toBe(3)
    expect(s.max).toBe(13)
    expect(s.consensus).toBe(false)
  })

  it('reports consensus when all votes match', () => {
    const s = computeSpread(['5', '5', '5'])
    expect(s.consensus).toBe(true)
    expect(s.min).toBe(5)
    expect(s.max).toBe(5)
  })

  it('takes the middle value for an odd count', () => {
    expect(computeSpread(['1', '2', '8']).median).toBe(2)
  })

  it('degrades to a count for non-numeric decks', () => {
    const s = computeSpread(['S', 'M', 'L'])
    expect(s.median).toBeNull()
    expect(s.count).toBe(3)
  })
})

describe('outlierFlag', () => {
  const s = computeSpread(['3', '5', '5', '13'])
  it('flags the min as low and max as high when votes disagree', () => {
    expect(outlierFlag('3', s)).toBe('low')
    expect(outlierFlag('13', s)).toBe('high')
    expect(outlierFlag('5', s)).toBeNull()
  })

  it('flags nothing on consensus', () => {
    expect(outlierFlag('5', computeSpread(['5', '5']))).toBeNull()
  })
})
