<script setup lang="ts">
// ABOUTME: Host-only top-bar control to set the room's deck from a preset or a custom card list.
// ABOUTME: Shown only to the host; changing the deck broadcasts to everyone via the store.
import { DECK_PRESETS } from '~~/shared/decks'

const store = useRoomStore()
const { identity } = useIdentity()
const deckMemory = useDeckMemory()

const isHost = computed(() => !!store.hostId && store.hostId === identity.value.participantId)
const votesExist = computed(() => store.revealed || store.participants.some((p) => p.hasVoted))
const open = ref(false)
// When votes already exist, a chosen deck waits here for confirmation (changing clears votes).
const pending = ref<string[] | null>(null)

const rootEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
const pickerEl = ref<{ focusFirst: () => void } | null>(null)
const confirmEl = ref<HTMLButtonElement | null>(null)

const currentLabel = computed(() => {
  const deck = store.deck
  if (!deck) return 'Deck'
  const preset = DECK_PRESETS.find((d) => d.cards.length === deck.length && d.cards.every((c, i) => c === deck[i]))
  return preset ? preset.label : 'Custom'
})

function openPanel() {
  open.value = true
  nextTick(() => pickerEl.value?.focusFirst())
}

// Close the panel; return focus to the trigger unless focus already left the control (outside click).
function closePanel(returnFocus = true) {
  open.value = false
  pending.value = null
  if (returnFocus) nextTick(() => triggerEl.value?.focus())
}

function toggle() {
  if (open.value) closePanel()
  else openPanel()
}

function apply(cards: string[]) {
  store.changeDeck(cards)
  deckMemory.save(cards)
  closePanel()
}

function choose(cards: string[]) {
  if (!cards.length) return
  if (votesExist.value) pending.value = cards
  else apply(cards)
}

// A deck change with votes present asks for confirmation; move focus to the confirm action.
watch(pending, (cards) => {
  if (cards) nextTick(() => confirmEl.value?.focus())
})

function onDocPointer(e: PointerEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) closePanel(false)
}

watch(open, (isOpen) => {
  if (!import.meta.client) return
  if (isOpen) document.addEventListener('pointerdown', onDocPointer)
  else document.removeEventListener('pointerdown', onDocPointer)
})

onBeforeUnmount(() => {
  if (import.meta.client) document.removeEventListener('pointerdown', onDocPointer)
})
</script>

<template>
  <div v-if="isHost" ref="rootEl" class="relative" @keydown.escape="closePanel()">
    <button
      ref="triggerEl"
      type="button"
      aria-label="Choose deck"
      aria-haspopup="true"
      aria-controls="deck-panel"
      :aria-expanded="open"
      class="flex h-8 items-center gap-1 rounded-sm border border-line bg-surface px-3 font-mono text-meta text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      @click="toggle"
    >
      {{ currentLabel }}
      <span aria-hidden="true" class="opacity-55">▾</span>
    </button>

    <div v-if="open" id="deck-panel" class="absolute right-0 z-40 mt-1 w-60 rounded-md border border-line bg-surface p-2 shadow-md">
      <div v-if="pending" class="p-1">
        <p class="text-body text-ink">Change the deck? This clears the current votes.</p>
        <div class="mt-3 flex gap-2">
          <button
            ref="confirmEl"
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
        <DeckPicker ref="pickerEl" :selected="store.deck" @pick="choose" />
      </template>
    </div>
  </div>
</template>
