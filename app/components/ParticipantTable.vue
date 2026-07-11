<script setup lang="ts">
// ABOUTME: The participant list — the spine of the room. Exposed as a labelled list for screen readers.
const store = useRoomStore()
const { identity } = useIdentity()

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
      :can-manage="viewerIsHost && p.id !== identity.participantId"
      :revealed="store.revealed"
      @kick="store.kick(p.id)"
      @make-host="store.makeHost(p.id)"
    />
  </ul>
</template>
