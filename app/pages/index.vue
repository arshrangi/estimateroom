<script setup lang="ts">
// ABOUTME: Landing surface. One action creates a room and drops the facilitator into it.
const creating = ref(false)

async function createRoom() {
  if (creating.value) return
  creating.value = true
  try {
    const { roomId } = await $fetch('/api/rooms', { method: 'POST' })
    await navigateTo(`/r/${roomId}?created=1`)
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
