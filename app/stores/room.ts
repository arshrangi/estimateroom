// ABOUTME: Authoritative-replica room store. Applies server messages and dispatches client messages.
// ABOUTME: It never originates truth; the socket transport is registered by useRoomSocket on connect.
import { defineStore } from 'pinia'
import type { ClientMessage, Participant, RoomState } from '~~/shared/protocol'

export const useRoomStore = defineStore('room', () => {
  const roomState = ref<RoomState | null>(null)
  const transport = shallowRef<((msg: ClientMessage) => void) | null>(null)

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

  function reset() {
    roomState.value = null
  }

  const participants = computed(() => roomState.value?.participants ?? [])
  const hostId = computed(() => roomState.value?.hostId ?? null)
  const deck = computed(() => roomState.value?.deck ?? null)

  return {
    roomState,
    participants,
    hostId,
    deck,
    applyState,
    applyJoined,
    applyLeft,
    applyDeckChanged,
    bindTransport,
    unbindTransport,
    changeDeck,
    reset,
  }
})
