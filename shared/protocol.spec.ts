// ABOUTME: Tests for the shared client/server message protocol contract.
// ABOUTME: Guards the single source of truth against drift; the state snapshot is the first message.
import { describe, expect, it } from 'vitest'
import { RoomStateSchema, ServerMessageSchema } from './protocol'

const validState = {
  roomId: 'V1StGXR8Z5jdHi6BmyT8sx',
  deck: null,
  revealMode: 'host',
  hostId: null,
  revealed: false,
  participants: [],
}

describe('RoomStateSchema', () => {
  it('accepts a minimal valid room state', () => {
    expect(RoomStateSchema.parse(validState)).toEqual(validState)
  })

  it('accepts a participant with pre-reveal secrecy (hasVoted true, vote null)', () => {
    const state = {
      ...validState,
      hostId: 'p1',
      participants: [
        { id: 'p1', name: 'Priya', avatar: null, role: 'voter', connected: true, hasVoted: true, vote: null },
      ],
    }
    expect(RoomStateSchema.parse(state).participants[0]?.hasVoted).toBe(true)
  })

  it('rejects an unknown reveal mode', () => {
    expect(() => RoomStateSchema.parse({ ...validState, revealMode: 'sometime' })).toThrow()
  })

  it('rejects a missing roomId', () => {
    const { roomId, ...noId } = validState
    expect(() => RoomStateSchema.parse(noId)).toThrow()
  })
})

describe('ServerMessageSchema', () => {
  it('parses a state message', () => {
    const msg = { type: 'state', state: validState }
    expect(ServerMessageSchema.parse(msg)).toEqual(msg)
  })

  it('rejects an unknown message type', () => {
    expect(() => ServerMessageSchema.parse({ type: 'nope' })).toThrow()
  })
})
