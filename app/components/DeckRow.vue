<script setup lang="ts">
// ABOUTME: The voter's hand of cards. Click to cast; click the selected card again to clear.
// ABOUTME: Carries the "Not voting" toggle; anyone not voting gets no deck.
const store = useRoomStore()
const { identity } = useIdentity()

// The server's role is the truth here rather than the remembered join preference,
// because the host can change it and the change has to reach this client.
const me = computed(() => store.participants.find((p) => p.id === identity.value.participantId) ?? null)
const notVoting = computed(() => me.value?.role === 'observer')

function setVoting(voting: boolean) {
  store.setRole(identity.value.participantId, voting ? 'voter' : 'observer')
}

function pick(card: string) {
  if (store.myVote === card) store.clearVote()
  else store.vote(card)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="flex w-fit items-center gap-2">
      <input
        type="checkbox"
        class="size-4 accent-[var(--color-accent-ink)]"
        :checked="notVoting"
        @change="setVoting(notVoting)"
      >
      <span class="text-body text-ink-soft">Not voting</span>
    </label>

    <div v-if="notVoting" class="font-mono text-meta text-ink-muted">You're not voting this round.</div>
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
  </div>
</template>
