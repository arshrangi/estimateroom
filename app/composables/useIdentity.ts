// ABOUTME: Reactive participant identity remembered in localStorage (no accounts, no server PII).
// ABOUTME: load() hydrates from storage (minting an id on first visit); save() persists edits.
import { nanoid } from 'nanoid'
import { IDENTITY_STORAGE_KEY, normalizeIdentity, type Identity } from '~~/shared/identity'

export function useIdentity() {
  const identity = useState<Identity>('identity', () => ({
    participantId: '',
    name: '',
    avatar: null,
    observer: false,
  }))

  function load() {
    if (!import.meta.client) return
    let raw: unknown
    try {
      raw = JSON.parse(localStorage.getItem(IDENTITY_STORAGE_KEY) ?? 'null')
    } catch {
      raw = null
    }
    identity.value = normalizeIdentity(raw, () => nanoid())
  }

  function save(patch: Partial<Identity>) {
    identity.value = { ...identity.value, ...patch }
    if (import.meta.client) {
      localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity.value))
    }
  }

  return { identity, load, save }
}
