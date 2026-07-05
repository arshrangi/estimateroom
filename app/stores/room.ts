// ABOUTME: Authoritative-replica room store. Applies server messages and dispatches client messages.
// ABOUTME: It never originates truth; the socket transport is registered by useRoomSocket on connect.
import { defineStore } from 'pinia'
import type { ClientMessage, RevealMode, RoomState } from '~~/shared/protocol'

export const useRoomStore = defineStore('room', () => {
  const roomState = ref<RoomState | null>(null)
  const transport = shallowRef<((msg: ClientMessage) => void) | null>(null)
  // The local participant's own selection (optimistic; the server never echoes vote values pre-reveal).
  const myVote = ref<string | null>(null)

  /* ── inbound: apply server truth ── */
  function applyState(state: RoomState) {
    // A revealed -> not-revealed transition means the round was reset; drop the stale local selection.
    if (roomState.value?.revealed && !state.revealed) myVote.value = null
    roomState.value = state
  }
  function applyVoteStatus(participantId: string, hasVoted: boolean) {
    const participant = roomState.value?.participants.find((p) => p.id === participantId)
    if (participant) participant.hasVoted = hasVoted
  }
  function setMyVote(card: string | null) {
    myVote.value = card
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
  function setRevealMode(mode: RevealMode) {
    transport.value?.({ type: 'setRevealMode', mode })
  }
  function reveal() {
    transport.value?.({ type: 'reveal' })
  }
  function revote() {
    transport.value?.({ type: 'revote' })
  }
  function next() {
    transport.value?.({ type: 'next' })
  }
  function kick(participantId: string) {
    transport.value?.({ type: 'kick', participantId })
  }
  function makeHost(participantId: string) {
    transport.value?.({ type: 'makeHost', participantId })
  }
  function leave() {
    transport.value?.({ type: 'leave' })
  }

  function reset() {
    roomState.value = null
    myVote.value = null
  }

  const participants = computed(() => roomState.value?.participants ?? [])
  const hostId = computed(() => roomState.value?.hostId ?? null)
  const deck = computed(() => roomState.value?.deck ?? null)
  const revealed = computed(() => roomState.value?.revealed ?? false)
  const revealMode = computed(() => roomState.value?.revealMode ?? 'host')

  return {
    roomState,
    myVote,
    participants,
    hostId,
    deck,
    revealed,
    revealMode,
    applyState,
    applyVoteStatus,
    setMyVote,
    bindTransport,
    unbindTransport,
    changeDeck,
    vote,
    clearVote,
    setRevealMode,
    reveal,
    revote,
    next,
    kick,
    makeHost,
    leave,
    reset,
  }
})
