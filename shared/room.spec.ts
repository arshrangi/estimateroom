// ABOUTME: Tests the empty-room-state factory and the vote-secrecy projection.
import { describe, expect, it } from 'vitest'
import { RoomStateSchema } from './protocol'
import { emptyRoomState, publicParticipant } from './room'
import type { Participant } from './types'

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

describe('publicParticipant (secrecy)', () => {
  const voted: Participant = { id: 'p1', name: 'Priya', avatar: null, role: 'voter', connected: true, hasVoted: true, vote: '5' }

  it('strips the vote value pre-reveal but keeps hasVoted', () => {
    const pub = publicParticipant(voted, false)
    expect(pub.vote).toBeNull()
    expect(pub.hasVoted).toBe(true)
  })

  it('exposes the vote value once revealed', () => {
    expect(publicParticipant(voted, true).vote).toBe('5')
  })
})
