// ABOUTME: Tests deck presets lookup and custom-deck parsing.
import { describe, expect, it } from 'vitest'
import { DECK_PRESETS, MAX_DECK_CARDS, getDeckPreset, normalizeCustomDeck } from './decks'

describe('deck presets', () => {
  it('includes the expected presets with non-empty cards', () => {
    const ids = DECK_PRESETS.map((d) => d.id)
    expect(ids).toContain('fibonacci')
    expect(ids).toContain('tshirt')
    expect(ids).toContain('one-to-five')
    expect(DECK_PRESETS.every((d) => d.cards.length > 0)).toBe(true)
  })

  it('looks up a preset by id', () => {
    expect(getDeckPreset('tshirt')?.cards).toEqual(['S', 'M', 'L', 'XL'])
    expect(getDeckPreset('nope')).toBeUndefined()
  })
})

describe('normalizeCustomDeck', () => {
  it('splits on commas and whitespace, trims, and drops empties', () => {
    expect(normalizeCustomDeck('S, M ,  L')).toEqual(['S', 'M', 'L'])
    expect(normalizeCustomDeck('  ')).toEqual([])
  })

  it('de-duplicates while preserving order', () => {
    expect(normalizeCustomDeck('1 2 2 3 1')).toEqual(['1', '2', '3'])
  })

  it('caps the number of cards', () => {
    const many = Array.from({ length: 30 }, (_, i) => String(i)).join(' ')
    expect(normalizeCustomDeck(many).length).toBe(MAX_DECK_CARDS)
  })

  it('truncates over-long card values', () => {
    expect(normalizeCustomDeck('verylongcardvalue')[0]).toHaveLength(8)
  })
})
