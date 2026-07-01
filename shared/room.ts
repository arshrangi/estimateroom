// ABOUTME: Factory for a fresh room's authoritative state (no participants, no deck chosen yet).
// ABOUTME: The Room server sends this as the first snapshot; reveal mode defaults to host-triggered.
import type { RoomState } from './types'

export function emptyRoomState(roomId: string): RoomState {
  return {
    roomId,
    deck: null,
    revealMode: 'host',
    hostId: null,
    revealed: false,
    participants: [],
  }
}
