<script setup lang="ts">
// ABOUTME: The top bar: the wordmark logo (navigates home), the deck selector and invite control (in a room), and the theme toggle.
// ABOUTME: In a live room the logo leaves the room; a host confirms first because leaving hands the host role to someone else.
const route = useRoute()
const roomId = computed(() => (route.params.roomId ? String(route.params.roomId) : null))

const store = useRoomStore()
const { identity } = useIdentity()
// The store holds room state only while connected; on the landing page or the Join screen it is null.
const inLiveRoom = computed(() => !!store.roomState)
const isHost = computed(() => inLiveRoom.value && store.hostId === identity.value.participantId)

function leaveRoom() {
  store.leave()
  navigateTo('/')
}
</script>

<template>
  <header class="flex h-8 items-center justify-between gap-3">
    <ConfirmButton v-if="isHost" message="Leave room? Host passes to another member." confirm-label="Leave" @confirm="leaveRoom">
      <template #trigger><TheWordmark /></template>
    </ConfirmButton>
    <button
      v-else-if="inLiveRoom"
      type="button"
      class="cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
      @click="leaveRoom"
    >
      <TheWordmark />
    </button>
    <NuxtLink v-else to="/" class="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink">
      <TheWordmark />
    </NuxtLink>
    <div class="flex items-center gap-3">
      <DeckSelector v-if="roomId" />
      <InviteControl v-if="roomId" :room-id="roomId" />
      <ThemeToggle />
    </div>
  </header>
</template>
