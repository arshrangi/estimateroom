// ABOUTME: Tests the empty-room-state factory used for a room's first authoritative snapshot.
import { describe, expect, it } from 'vitest'
import { RoomStateSchema } from './protocol'
import { emptyRoomState } from './room'

describe('emptyRoomState', () => {
  it('produces a schema-valid, empty state for the given room id', () => {
    const state = emptyRoomState('abc123')
    expect(() => RoomStateSchema.parse(state)).not.toThrow()
    expect(state).toMatchObject({
      roomId: 'abc123',
      deck: null,
      revealMode: 'host',
      hostId: null,
      revealed: false,
      participants: [],
    })
  })
})
