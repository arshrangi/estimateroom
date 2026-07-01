<script setup lang="ts">
// ABOUTME: The participant list — the spine of the room. Exposed as a labelled list for screen readers.
import { computeSpread } from '~~/shared/spread'

const store = useRoomStore()
const { identity } = useIdentity()

const spread = computed(() =>
  computeSpread(store.participants.filter((p) => p.role !== 'observer' && p.vote !== null).map((p) => p.vote as string)),
)
const viewerIsHost = computed(() => !!store.hostId && store.hostId === identity.value.participantId)
</script>

<template>
  <ul role="list" aria-label="Participants" class="overflow-hidden rounded-lg border border-line bg-surface">
    <ParticipantRow
      v-for="p in store.participants"
      :key="p.id"
      :participant="p"
      :is-host="p.id === store.hostId"
      :is-you="p.id === identity.participantId"
      :can-kick="viewerIsHost && p.id !== identity.participantId"
      :revealed="store.revealed"
      :spread="spread"
      @kick="store.kick(p.id)"
    />
  </ul>
</template>
