<script setup lang="ts">
// ABOUTME: The room surface. Gates behind the JoinCard, connects, shows the live participant table,
// ABOUTME: auto-copies the invite when the room was just created, and guides an empty room.
const route = useRoute()
const roomId = computed(() => String(route.params.roomId))

const store = useRoomStore()
const { status, connect, disconnect } = useRoomSocket(roomId.value)
const { copy } = useInvite(roomId.value)

const entered = ref(false)

function onJoin() {
  entered.value = true
  connect()
  // Runs inside the join click, so clipboard access still has user activation.
  if (route.query.created) copy()
}

onBeforeUnmount(disconnect)
</script>

<template>
  <JoinCard v-if="!entered" @join="onJoin" />
  <section v-else class="mt-4">
    <p class="mb-2 font-mono text-meta text-ink-muted">Room {{ roomId }} — {{ status }}</p>
    <VotingStatus v-if="!store.revealed" class="mb-3" />
    <SpreadSummary v-else class="mb-3" />
    <ParticipantTable />
    <p v-if="store.participants.length <= 1" class="mt-3 text-body text-ink-soft">
      Share the link to get your team in.
    </p>
    <div class="mt-4 flex flex-wrap items-start justify-between gap-4">
      <DeckRow v-if="!store.revealed" />
      <div class="ml-auto">
        <HostControls />
      </div>
    </div>
  </section>
</template>
