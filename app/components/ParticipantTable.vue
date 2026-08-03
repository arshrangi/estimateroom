<script setup lang="ts">
// ABOUTME: The participant list — the spine of the room. Exposed as a labelled list for screen readers.
import { QUESTION_CARD } from '~~/shared/decks'
import type { Participant } from '~~/shared/protocol'

const store = useRoomStore()
const { identity } = useIdentity()

const viewerIsHost = computed(() => !!store.hostId && store.hostId === identity.value.participantId)

// Revealed rows sort low-to-high by deck position, "?" votes after the numbered votes
// (the card leads the deck but reads as "unsure", not as the lowest estimate), then rows
// with no vote, then people not voting; a vote cast before opting out still sorts by its
// value. Ties keep join order. Pre-reveal keeps join order.
const sortedParticipants = computed(() => {
  const deck = store.deck
  if (!store.revealed || !deck) return store.participants
  const rank = (p: Participant): number => {
    if (p.vote !== null) {
      if (p.vote === QUESTION_CARD) return deck.length
      const i = deck.indexOf(p.vote)
      return i === -1 ? deck.length + 1 : i
    }
    return p.role === 'observer' ? deck.length + 2 : deck.length + 1
  }
  return [...store.participants].sort((a, b) => rank(a) - rank(b))
})
</script>

<template>
  <ul role="list" aria-label="Participants" class="overflow-hidden rounded-lg border border-line bg-surface">
    <ParticipantRow
      v-for="p in sortedParticipants"
      :key="p.id"
      :participant="p"
      :is-host="p.id === store.hostId"
      :is-you="p.id === identity.participantId"
      :can-manage="viewerIsHost && p.id !== identity.participantId"
      :revealed="store.revealed"
      @kick="store.kick(p.id)"
      @make-host="store.makeHost(p.id)"
      @set-role="(role) => store.setRole(p.id, role)"
    />
  </ul>
</template>
