<script setup lang="ts">
// ABOUTME: The voter's hand of cards. Click to cast; click the selected card again to clear.
// ABOUTME: Observers get no deck; before a deck is chosen it shows a quiet hint.
const store = useRoomStore()
const { identity } = useIdentity()

const isObserver = computed(() => identity.value.observer)

function pick(card: string) {
  if (store.myVote === card) store.clearVote()
  else store.vote(card)
}
</script>

<template>
  <div v-if="isObserver" class="font-mono text-meta text-ink-muted">You're observing this round.</div>
  <p v-else-if="!store.deck" class="font-mono text-meta text-ink-muted">Waiting for the host to pick a deck.</p>
  <div v-else role="group" aria-label="Your cards" class="flex flex-wrap gap-2">
    <DeckCard
      v-for="card in store.deck"
      :key="card"
      :value="card"
      :selected="store.myVote === card"
      @pick="pick(card)"
    />
  </div>
</template>
