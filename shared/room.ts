// ABOUTME: Factory for a fresh room's state, plus the secrecy projection that hides votes pre-reveal.
// ABOUTME: The Room server sends emptyRoomState as the first snapshot; reveal mode defaults to host-triggered.
import type { Participant, RoomState } from './types'

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

/**
 * The client-safe view of a participant. Before reveal the vote value is stripped to null
 * (only hasVoted is exposed) — the secrecy invariant (AR12) — except for the viewer's own
 * participant, who may always see their own selection (e.g. to restore it after a reconnect).
 */
export function publicParticipant(participant: Participant, revealed: boolean, viewerId?: string): Participant {
  if (revealed || participant.id === viewerId) return participant
  return { ...participant, vote: null }
}
