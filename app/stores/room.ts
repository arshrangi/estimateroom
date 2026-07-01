// ABOUTME: Authoritative-replica room store. Applies server messages; it never originates truth.
// ABOUTME: Components read getters and dispatch actions; they never mutate state directly.
import { defineStore } from 'pinia'
import type { Participant, RoomState } from '~~/shared/protocol'

export const useRoomStore = defineStore('room', () => {
  const roomState = ref<RoomState | null>(null)

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

  function reset() {
    roomState.value = null
  }

  const participants = computed(() => roomState.value?.participants ?? [])
  const hostId = computed(() => roomState.value?.hostId ?? null)

  return { roomState, participants, hostId, applyState, applyJoined, applyLeft, reset }
})
