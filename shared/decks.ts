// ABOUTME: Planning-poker deck presets and the parser for host-defined custom decks.
// ABOUTME: A deck is just an ordered list of card face values; custom decks are per-room, not saved.
export interface Deck {
  id: string
  label: string
  cards: string[]
}

export const DECK_PRESETS: Deck[] = [
  { id: 'fibonacci', label: 'Fibonacci', cards: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89'] },
  { id: 'fibonacci-modified', label: 'Modified Fibonacci', cards: ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100'] },
  { id: 'tshirt', label: 'T-shirt', cards: ['S', 'M', 'L', 'XL'] },
  { id: 'powers-of-2', label: 'Powers of 2', cards: ['1', '2', '4', '8', '16', '32', '64'] },
  { id: 'one-to-five', label: '1 to 5', cards: ['1', '2', '3', '4', '5'] },
]

export const MAX_DECK_CARDS = 15
export const MAX_CARD_LEN = 8

export function getDeckPreset(id: string): Deck | undefined {
  return DECK_PRESETS.find((d) => d.id === id)
}

/** Parses a free-text custom deck (comma/space separated) into trimmed, de-duplicated, capped cards. */
export function normalizeCustomDeck(input: string): string[] {
  const seen = new Set<string>()
  const cards: string[] = []
  for (const raw of input.split(/[,\s]+/)) {
    const card = raw.trim().slice(0, MAX_CARD_LEN)
    if (!card || seen.has(card)) continue
    seen.add(card)
    cards.push(card)
    if (cards.length >= MAX_DECK_CARDS) break
  }
  return cards
}
