// ABOUTME: Tests deck presets lookup and custom-deck parsing.
import { describe, expect, it } from 'vitest'
import { DECK_PRESETS, MAX_DECK_CARDS, QUESTION_CARD, getDeckPreset, normalizeCustomDeck, normalizeStoredDeck, withQuestionCard } from './decks'

describe('deck presets', () => {
  it('includes the expected presets with non-empty cards', () => {
    const ids = DECK_PRESETS.map((d) => d.id)
    expect(ids).toContain('fibonacci')
    expect(ids).toContain('tshirt')
    expect(ids).toContain('one-to-five')
    expect(DECK_PRESETS.every((d) => d.cards.length > 0)).toBe(true)
  })

  it('looks up a preset by id', () => {
    expect(getDeckPreset('tshirt')?.cards).toEqual(['S', 'M', 'L', 'XL', '?'])
    expect(getDeckPreset('nope')).toBeUndefined()
  })

  it('ends every preset with the ? card', () => {
    expect(DECK_PRESETS.every((d) => d.cards[d.cards.length - 1] === QUESTION_CARD)).toBe(true)
  })
})

describe('normalizeCustomDeck', () => {
  it('splits on commas and whitespace, trims, and drops empties', () => {
    expect(normalizeCustomDeck('S, M ,  L')).toEqual(['S', 'M', 'L', '?'])
    expect(normalizeCustomDeck('  ')).toEqual([])
  })

  it('de-duplicates while preserving order', () => {
    expect(normalizeCustomDeck('1 2 2 3 1')).toEqual(['1', '2', '3', '?'])
  })

  it('moves a user-typed ? to the end', () => {
    expect(normalizeCustomDeck('1 2 ? 3')).toEqual(['1', '2', '3', '?'])
  })

  it('caps the number of cards', () => {
    const many = Array.from({ length: 30 }, (_, i) => String(i)).join(' ')
    expect(normalizeCustomDeck(many).length).toBe(MAX_DECK_CARDS)
  })

  it('truncates over-long card values', () => {
    expect(normalizeCustomDeck('verylongcardvalue')[0]).toHaveLength(8)
  })
})

describe('normalizeStoredDeck', () => {
  it('accepts a stored array of cards', () => {
    expect(normalizeStoredDeck(['1', '2', '3'])).toEqual(['1', '2', '3', '?'])
  })

  it('rejects non-arrays and empty arrays', () => {
    expect(normalizeStoredDeck('fib')).toBeNull()
    expect(normalizeStoredDeck(null)).toBeNull()
    expect(normalizeStoredDeck([])).toBeNull()
  })

  it('drops non-string and oversized entries, rejects if nothing valid remains', () => {
    expect(normalizeStoredDeck(['1', 42, 'x'.repeat(9)])).toEqual(['1', '?'])
    expect(normalizeStoredDeck([42])).toBeNull()
  })

  it('rejects decks over the card cap', () => {
    expect(normalizeStoredDeck(Array.from({ length: 16 }, (_, i) => String(i)))).toBeNull()
  })

  it('drops the last stored card when a full deck needs room for the ?', () => {
    const full = Array.from({ length: MAX_DECK_CARDS }, (_, i) => String(i))
    expect(normalizeStoredDeck(full)).toEqual([...full.slice(0, MAX_DECK_CARDS - 1), QUESTION_CARD])
  })
})

describe('withQuestionCard', () => {
  it('appends ? when missing and keeps it last', () => {
    expect(withQuestionCard(['1', '2'])).toEqual(['1', '2', '?'])
  })

  it('moves an existing ? to the end without duplicating', () => {
    expect(withQuestionCard(['?', '1'])).toEqual(['1', '?'])
  })

  it('caps at MAX_DECK_CARDS including the ?', () => {
    const many = Array.from({ length: 20 }, (_, i) => String(i))
    const deck = withQuestionCard(many)
    expect(deck).toHaveLength(MAX_DECK_CARDS)
    expect(deck[deck.length - 1]).toBe(QUESTION_CARD)
  })
})
