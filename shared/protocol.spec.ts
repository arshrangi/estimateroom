// ABOUTME: Tests for the shared client/server message protocol contract.
// ABOUTME: Guards the single source of truth against drift; the state snapshot is the first message.
import { describe, expect, it } from 'vitest'
import { ClientMessageSchema, RoomStateSchema, ServerMessageSchema } from './protocol'

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

  it('parses participantJoined and participantLeft', () => {
    const p = { id: 'p1', name: 'Priya', avatar: 'teal', role: 'voter', connected: true, hasVoted: false, vote: null }
    expect(ServerMessageSchema.parse({ type: 'participantJoined', participant: p })).toMatchObject({ type: 'participantJoined' })
    expect(ServerMessageSchema.parse({ type: 'participantLeft', participantId: 'p1' })).toMatchObject({ type: 'participantLeft' })
  })
})

describe('ClientMessageSchema (join)', () => {
  const validJoin = { type: 'join', participantId: 'p1', name: 'Priya', avatar: 'teal', role: 'voter' }

  it('parses a valid join', () => {
    expect(ClientMessageSchema.parse(validJoin)).toEqual(validJoin)
  })

  it('accepts a null avatar and an observer role', () => {
    expect(ClientMessageSchema.parse({ ...validJoin, avatar: null, role: 'observer' })).toMatchObject({ avatar: null, role: 'observer' })
  })

  it('rejects an empty name', () => {
    expect(() => ClientMessageSchema.parse({ ...validJoin, name: '' })).toThrow()
  })

  it('rejects a name longer than 40 chars', () => {
    expect(() => ClientMessageSchema.parse({ ...validJoin, name: 'x'.repeat(41) })).toThrow()
  })

  it('rejects an unknown avatar tint', () => {
    expect(() => ClientMessageSchema.parse({ ...validJoin, avatar: 'gold' })).toThrow()
  })
})
