// ABOUTME: Tests spread stats and deck-step grading over revealed votes.
import { describe, expect, it } from 'vitest'
import { computeSpread, parseCard, spreadGrade } from './spread'

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

describe('spreadGrade', () => {
  const fib = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89']

  it('grades adjacent cards as low', () => {
    expect(spreadGrade(['3', '5'], fib)).toBe('low')
  })

  it('grades two steps as moderate', () => {
    expect(spreadGrade(['3', '5', '8'], fib)).toBe('moderate')
  })

  it('grades three or more steps as high', () => {
    expect(spreadGrade(['3', '13'], fib)).toBe('high')
  })

  it('measures deck positions, not numeric distance', () => {
    expect(spreadGrade(['13', '21'], fib)).toBe('low')
  })

  it('returns null on identical votes (consensus handles that)', () => {
    expect(spreadGrade(['5', '5'], fib)).toBeNull()
  })

  it('returns null for fewer than two numeric votes', () => {
    expect(spreadGrade([], fib)).toBeNull()
    expect(spreadGrade(['5'], fib)).toBeNull()
  })

  it('ignores non-numeric votes and off-deck values', () => {
    expect(spreadGrade(['S', 'L'], ['S', 'M', 'L'])).toBeNull()
    expect(spreadGrade(['3', '5', '?'], fib)).toBe('low')
  })
})
