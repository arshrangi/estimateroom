// ABOUTME: Participant identity shape and normalization of the browser-remembered profile.
// ABOUTME: No accounts, no server PII: identity is a client-generated id plus a self-chosen name/avatar.
import { isAvatarTint, type AvatarTint } from './avatars'

export const IDENTITY_STORAGE_KEY = 'estimateroom-identity'

export interface Identity {
  participantId: string
  name: string
  avatar: AvatarTint | null
  observer: boolean
}

/** Coerces whatever was in storage into a valid Identity, minting an id when absent. */
export function normalizeIdentity(raw: unknown, makeId: () => string): Identity {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  return {
    participantId: typeof o.participantId === 'string' && o.participantId ? o.participantId : makeId(),
    name: typeof o.name === 'string' ? o.name : '',
    avatar: isAvatarTint(o.avatar) ? o.avatar : null,
    observer: o.observer === true,
  }
}

/** A remembered profile exists once the person has given a name. */
export function hasProfile(identity: Identity): boolean {
  return identity.name.trim().length > 0
}
