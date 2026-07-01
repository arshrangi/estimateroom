<script setup lang="ts">
// ABOUTME: Landing surface. One action creates a room, copies its invite link, and drops the facilitator in.
const creating = ref(false)

async function createRoom() {
  if (creating.value) return
  creating.value = true
  try {
    const { roomId } = await $fetch('/api/rooms', { method: 'POST' })
    // Copy within this click's activation window, before navigating away.
    await useInvite(roomId).copy()
    await navigateTo(`/r/${roomId}`)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <main>
    <h1>Pointr</h1>
    <button type="button" :disabled="creating" @click="createRoom">Create room</button>
  </main>
</template>
