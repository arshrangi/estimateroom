<script setup lang="ts">
// ABOUTME: The room surface. Returning members auto-enter (no Join screen on refresh); new members use the JoinCard.
// ABOUTME: Shows the live session as one dense stack, plus a transient reconnecting banner.
import { hasProfile } from '~~/shared/identity'

const route = useRoute()
const roomId = computed(() => String(route.params.roomId))

const store = useRoomStore()
const { identity, load } = useIdentity()
const { status, error, connect, disconnect, reconnect } = useRoomSocket(roomId.value)

const entered = ref(false)

function enter() {
  entered.value = true
  connect()
}

onMounted(() => {
  load()
  // A remembered participant is never dropped to the Join screen; they re-enter directly.
  if (hasProfile(identity.value)) enter()
})

onBeforeUnmount(disconnect)
</script>

<template>
  <ErrorSurface v-if="error" :code="error" />
  <JoinCard v-else-if="!entered" @join="enter" />

  <div v-else class="mt-4 flex flex-col gap-3">
    <ReconnectingIndicator :show="status === 'reconnecting'" @retry="reconnect" />

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
