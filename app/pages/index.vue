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
  <main class="mx-auto mt-16 max-w-lg text-center sm:mt-24">
    <h1 class="text-heading font-bold text-ink">Planning poker that respects your meeting</h1>
    <p class="mx-auto mt-3 max-w-md text-body text-ink-soft">
      Ad-free, account-free estimation for agile teams. Open a room, paste the link, estimate.
    </p>

    <p class="mt-5 inline-flex items-center gap-2 rounded-sm border border-accent-border bg-accent-bg px-3 py-1.5 font-mono text-meta text-accent">
      No ads, no signup, ever
    </p>

    <div class="mt-8">
      <button
        type="button"
        :disabled="creating"
        :aria-busy="creating"
        class="h-11 rounded-sm bg-accent px-6 text-body font-semibold text-accent-fg disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        @click="createRoom"
      >
        {{ creating ? 'Creating room…' : 'Create a room' }}
      </button>
    </div>

    <p class="mt-10 font-mono text-meta text-ink-muted">
      Free and open source. Self-hostable. Light and dark, built in.
    </p>
  </main>
</template>
