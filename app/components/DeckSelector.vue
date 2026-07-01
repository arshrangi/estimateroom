<script setup lang="ts">
// ABOUTME: Host-only top-bar control to set the room's deck from a preset or a custom card list.
// ABOUTME: Shown only to the host; changing the deck broadcasts to everyone via the store.
import { DECK_PRESETS, normalizeCustomDeck } from '~~/shared/decks'

const store = useRoomStore()
const { identity } = useIdentity()

const isHost = computed(() => !!store.hostId && store.hostId === identity.value.participantId)
const votesExist = computed(() => store.revealed || store.participants.some((p) => p.hasVoted))
const open = ref(false)
const custom = ref('')
// When votes already exist, a chosen deck waits here for confirmation (changing clears votes).
const pending = ref<string[] | null>(null)

const currentLabel = computed(() => {
  const deck = store.deck
  if (!deck) return 'Deck'
  const preset = DECK_PRESETS.find((d) => d.cards.length === deck.length && d.cards.every((c, i) => c === deck[i]))
  return preset ? preset.label : 'Custom'
})

function apply(cards: string[]) {
  store.changeDeck(cards)
  open.value = false
  custom.value = ''
  pending.value = null
}

function choose(cards: string[]) {
  if (!cards.length) return
  if (votesExist.value) pending.value = cards
  else apply(cards)
}

function applyCustom() {
  choose(normalizeCustomDeck(custom.value))
}
</script>

<template>
  <div v-if="isHost" class="relative" @keydown.escape="open = false">
    <button
      type="button"
      class="flex h-8 items-center gap-1 rounded-sm border border-line bg-surface px-3 font-mono text-meta text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ currentLabel }}
      <span aria-hidden="true" class="opacity-55">▾</span>
    </button>

    <div v-if="open" class="absolute right-0 z-40 mt-1 w-60 rounded-md border border-line bg-surface p-2 shadow-md">
      <div v-if="pending" class="p-1">
        <p class="text-body text-ink">Change the deck? This clears the current votes.</p>
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            class="h-8 rounded-sm bg-accent px-3 font-mono text-meta font-bold text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            @click="apply(pending)"
          >
            Change deck
          </button>
          <button
            type="button"
            class="h-8 rounded-sm px-3 font-mono text-meta text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            @click="pending = null"
          >
            Cancel
          </button>
        </div>
      </div>

      <template v-else>
        <button
          v-for="d in DECK_PRESETS"
          :key="d.id"
          type="button"
          class="flex w-full flex-col rounded-sm px-2 py-1 text-left hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          @click="choose(d.cards)"
        >
          <span class="text-body text-ink">{{ d.label }}</span>
          <span class="font-mono text-meta text-ink-muted">{{ d.cards.slice(0, 7).join(' ') }}{{ d.cards.length > 7 ? ' …' : '' }}</span>
        </button>

        <form class="mt-2 flex gap-1 border-t border-line-soft pt-2" @submit.prevent="applyCustom">
          <input
            v-model="custom"
            type="text"
            placeholder="Custom: 1 2 3 5 8"
            aria-label="Custom deck values"
            class="h-8 w-full rounded-sm border border-line bg-bg px-2 font-mono text-meta text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
          <button
            type="submit"
            class="h-8 shrink-0 rounded-sm border border-line bg-surface px-2 font-mono text-meta text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Set
          </button>
        </form>
      </template>
    </div>
  </div>
</template>
