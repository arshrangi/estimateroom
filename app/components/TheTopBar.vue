<script setup lang="ts">
// ABOUTME: The top bar: the Pointr wordmark (accent "i"), the invite control (in a room), and the theme toggle.
// ABOUTME: Deck selector slots in here in a later epic.
const route = useRoute()
const roomId = computed(() => (route.params.roomId ? String(route.params.roomId) : null))
</script>

<template>
  <header class="flex h-8 items-center justify-between gap-3">
    <span class="text-wordmark font-extrabold tracking-[-0.6px] text-ink">Po<span class="text-accent">i</span>ntr</span>
    <div class="flex items-center gap-3">
      <DeckSelector v-if="roomId" />
      <InviteControl v-if="roomId" :room-id="roomId" />
      <ThemeToggle />
    </div>
  </header>
</template>
