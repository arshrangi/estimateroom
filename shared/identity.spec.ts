// ABOUTME: Tests identity normalization from (possibly missing or malformed) stored data.
import { describe, expect, it } from 'vitest'
import { hasProfile, normalizeIdentity } from './identity'

describe('normalizeIdentity', () => {
  it('mints an id and sensible defaults when nothing is stored', () => {
    const id = normalizeIdentity(null, () => 'generated')
    expect(id).toEqual({ participantId: 'generated', name: '', avatar: null, observer: false })
  })

  it('preserves a valid stored profile', () => {
    const stored = { participantId: 'p1', name: 'Priya', avatar: 'teal', observer: true }
    expect(normalizeIdentity(stored, () => 'x')).toEqual(stored)
  })

  it('drops an invalid avatar and coerces a non-boolean observer', () => {
    const id = normalizeIdentity({ participantId: 'p1', name: 'A', avatar: 'gold', observer: 'yes' }, () => 'x')
    expect(id.avatar).toBeNull()
    expect(id.observer).toBe(false)
  })

  it('mints an id when the stored id is missing or empty', () => {
    expect(normalizeIdentity({ name: 'A' }, () => 'fresh').participantId).toBe('fresh')
    expect(normalizeIdentity({ participantId: '', name: 'A' }, () => 'fresh').participantId).toBe('fresh')
  })
})

describe('hasProfile', () => {
  it('is true only once a name is present', () => {
    expect(hasProfile({ participantId: 'p', name: '', avatar: null, observer: false })).toBe(false)
    expect(hasProfile({ participantId: 'p', name: 'Priya', avatar: null, observer: false })).toBe(true)
  })
})
