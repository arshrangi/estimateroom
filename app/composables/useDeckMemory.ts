// ABOUTME: Remembers the last deck the user applied (localStorage) and the created-room marker
// ABOUTME: that tells the room page to offer the deck step to the creator (sessionStorage).
import { CREATED_ROOM_KEY, DECK_STORAGE_KEY, normalizeStoredDeck } from '~~/shared/decks'

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

  function markCreated(roomId: string) {
    if (import.meta.client) sessionStorage.setItem(CREATED_ROOM_KEY, roomId)
  }

  function isCreatorOf(roomId: string): boolean {
    return import.meta.client && sessionStorage.getItem(CREATED_ROOM_KEY) === roomId
  }

  function clearCreated() {
    if (import.meta.client) sessionStorage.removeItem(CREATED_ROOM_KEY)
  }

  return { lastDeck, load, save, markCreated, isCreatorOf, clearCreated }
}
