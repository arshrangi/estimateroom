<script setup lang="ts">
// ABOUTME: The room surface. Gates behind the JoinCard, then connects and shows the live session
// ABOUTME: as one dense vertical stack: status strip, participant table, and the deck + host controls row.
const route = useRoute()
const roomId = computed(() => String(route.params.roomId))

const store = useRoomStore()
const { connect, disconnect } = useRoomSocket(roomId.value)

const entered = ref(false)

function onJoin() {
  entered.value = true
  connect()
  // Runs inside the join click, so clipboard access still has user activation.
  if (route.query.created) useInvite(roomId.value).copy()
}

onBeforeUnmount(disconnect)
</script>

<template>
  <JoinCard v-if="!entered" @join="onJoin" />

  <div v-else class="mt-4 flex flex-col gap-3">
    <VotingStatus v-if="!store.revealed" />
    <SpreadSummary v-else />

    <ParticipantTable />

    <p v-if="store.participants.length <= 1" class="text-body text-ink-soft">
      Share the link to get your team in.
    </p>

    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0 flex-1">
        <DeckRow v-if="!store.revealed" />
      </div>
      <HostControls />
    </div>
  </div>
</template>
