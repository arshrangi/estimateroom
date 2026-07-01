// ABOUTME: Authoritative-replica room store. Applies server messages and dispatches client messages.
// ABOUTME: It never originates truth; the socket transport is registered by useRoomSocket on connect.
import { defineStore } from 'pinia'
import type { ClientMessage, Participant, RoomState } from '~~/shared/protocol'

export const useRoomStore = defineStore('room', () => {
  const roomState = ref<RoomState | null>(null)
  const transport = shallowRef<((msg: ClientMessage) => void) | null>(null)
  // The local participant's own selection (optimistic; the server never echoes vote values pre-reveal).
  const myVote = ref<string | null>(null)

  /* ── inbound: apply server truth ── */
  function applyState(state: RoomState) {
    roomState.value = state
  }
  function applyJoined(participant: Participant) {
    const state = roomState.value
    if (!state) return
    if (!state.participants.some((p) => p.id === participant.id)) {
      state.participants.push(participant)
    }
  }
  function applyLeft(participantId: string) {
    const state = roomState.value
    if (!state) return
    state.participants = state.participants.filter((p) => p.id !== participantId)
  }
  function applyDeckChanged(deck: string[]) {
    if (roomState.value) roomState.value.deck = deck
  }
  function applyVoteStatus(participantId: string, hasVoted: boolean) {
    const participant = roomState.value?.participants.find((p) => p.id === participantId)
    if (participant) participant.hasVoted = hasVoted
  }

  /* ── outbound: dispatch client messages ── */
  function bindTransport(send: (msg: ClientMessage) => void) {
    transport.value = send
  }
  function unbindTransport() {
    transport.value = null
  }
  function changeDeck(cards: string[]) {
    transport.value?.({ type: 'changeDeck', cards })
  }
  function vote(card: string) {
    myVote.value = card
    transport.value?.({ type: 'vote', card })
  }
  function clearVote() {
    myVote.value = null
    transport.value?.({ type: 'clearVote' })
  }

  function reset() {
    roomState.value = null
    myVote.value = null
  }

  const participants = computed(() => roomState.value?.participants ?? [])
  const hostId = computed(() => roomState.value?.hostId ?? null)
  const deck = computed(() => roomState.value?.deck ?? null)

  return {
    roomState,
    myVote,
    participants,
    hostId,
    deck,
    applyState,
    applyJoined,
    applyLeft,
    applyDeckChanged,
    applyVoteStatus,
    bindTransport,
    unbindTransport,
    changeDeck,
    vote,
    clearVote,
    reset,
  }
})
