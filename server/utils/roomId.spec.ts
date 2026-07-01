// ABOUTME: Tests for room-id minting used by POST /api/rooms.
// ABOUTME: The unguessable id is the room's access control, so charset and uniqueness matter.
import { describe, expect, it } from 'vitest'
import { createRoomId } from './roomId'

describe('createRoomId', () => {
  it('returns a URL-safe nanoid', () => {
    expect(createRoomId()).toMatch(/^[A-Za-z0-9_-]{21}$/)
  })

  it('returns a distinct id on each call', () => {
    expect(createRoomId()).not.toBe(createRoomId())
  })
})
