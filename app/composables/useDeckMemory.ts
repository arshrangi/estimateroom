// ABOUTME: Remembers the last deck the user applied (localStorage) and carries the one-shot
// ABOUTME: pending deck from room creation to the room page (sessionStorage, consumed on read).
import { DECK_STORAGE_KEY, PENDING_DECK_KEY, normalizeStoredDeck } from '~~/shared/decks'

export function useDeckMemory() {
  const lastDeck = useState<string[] | null>('deck-memory', () => null)

  function load() {
    if (!import.meta.client) return
    let raw: unknown
    try {
      raw = JSON.parse(localStorage.getItem(DECK_STORAGE_KEY) ?? 'null')
    } catch {
      raw = null
    }
    lastDeck.value = normalizeStoredDeck(raw)
  }

  function save(cards: string[]) {
    lastDeck.value = cards
    if (import.meta.client) localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(cards))
  }

  function stashPendingDeck(cards: string[]) {
    if (import.meta.client) sessionStorage.setItem(PENDING_DECK_KEY, JSON.stringify(cards))
  }

  function takePendingDeck(): string[] | null {
    if (!import.meta.client) return null
    let raw: unknown
    try {
      raw = JSON.parse(sessionStorage.getItem(PENDING_DECK_KEY) ?? 'null')
    } catch {
      raw = null
    }
    sessionStorage.removeItem(PENDING_DECK_KEY)
    return normalizeStoredDeck(raw)
  }

  return { lastDeck, load, save, stashPendingDeck, takePendingDeck }
}
