<script setup lang="ts">
// ABOUTME: The room surface. Gates behind the JoinCard, then connects and shows the live participant table.
const route = useRoute()
const roomId = computed(() => String(route.params.roomId))

const entered = ref(false)
const { status, connect, disconnect } = useRoomSocket(roomId.value)

function onJoin() {
  entered.value = true
  connect()
}

onBeforeUnmount(disconnect)
</script>

<template>
  <JoinCard v-if="!entered" @join="onJoin" />
  <section v-else class="mt-4">
    <p class="mb-3 font-mono text-meta text-ink-soft">Room {{ roomId }} — {{ status }}</p>
    <ParticipantTable />
  </section>
</template>
