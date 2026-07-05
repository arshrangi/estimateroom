<script setup lang="ts">
// ABOUTME: Landing surface. Creating a room expands an inline deck chooser; Create mints the room,
// ABOUTME: remembers the deck, copies the invite link, and drops the facilitator in.
import { DECK_PRESETS } from '~~/shared/decks'

const creating = ref(false)
const open = ref(false)
const chosen = ref<string[] | null>(null)
const deckMemory = useDeckMemory()

const rootEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
const pickerEl = ref<{ focusFirst: () => void } | null>(null)

function openPanel() {
  deckMemory.load()
  chosen.value = deckMemory.lastDeck.value ?? DECK_PRESETS[0]!.cards
  open.value = true
  nextTick(() => pickerEl.value?.focusFirst())
}

// Close the panel; return focus to the trigger unless focus already left (outside click).
function closePanel(returnFocus = true) {
  open.value = false
  if (returnFocus) nextTick(() => triggerEl.value?.focus())
}

function toggle() {
  if (open.value) closePanel()
  else openPanel()
}

async function createRoom() {
  if (creating.value || !chosen.value) return
  creating.value = true
  try {
    const { roomId } = await $fetch('/api/rooms', { method: 'POST' })
    deckMemory.save(chosen.value)
    deckMemory.stashPendingDeck(chosen.value)
    // Copy within this click's activation window, before navigating away.
    await useInvite(roomId).copy()
    await navigateTo(`/r/${roomId}`)
  } finally {
    creating.value = false
  }
}

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
  <main class="mx-auto mt-16 max-w-lg text-center sm:mt-24">
    <h1 class="text-heading font-bold text-ink">Planning poker that respects your meeting</h1>
    <p class="mx-auto mt-3 max-w-md text-body text-ink-soft">
      Ad-free, account-free estimation for agile teams. Open a room, paste the link, estimate.
    </p>

    <p class="mt-5 inline-flex items-center gap-2 rounded-sm border border-accent-border bg-accent-bg px-3 py-1.5 font-mono text-meta text-accent">
      No ads, no signup, ever
    </p>

    <div ref="rootEl" class="relative mt-8 inline-block" @keydown.escape="closePanel()">
      <button
        ref="triggerEl"
        type="button"
        aria-haspopup="true"
        aria-controls="create-panel"
        :aria-expanded="open"
        class="h-11 cursor-pointer rounded-sm bg-accent px-6 text-body font-semibold text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        @click="toggle"
      >
        Create a room
      </button>

      <div
        v-if="open"
        id="create-panel"
        class="absolute left-1/2 z-40 mt-2 w-64 -translate-x-1/2 rounded-md border border-line bg-surface p-2 text-left shadow-md"
      >
        <p class="px-2 pb-1 font-mono text-meta text-ink-soft">Deck</p>
        <DeckPicker ref="pickerEl" :selected="chosen" @pick="(cards) => (chosen = cards)" />
        <button
          type="button"
          :disabled="creating"
          :aria-busy="creating"
          class="mt-3 h-9 w-full cursor-pointer rounded-sm bg-accent px-4 font-semibold text-accent-fg disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          @click="createRoom"
        >
          {{ creating ? 'Creating room…' : 'Create room' }}
        </button>
      </div>
    </div>
  </main>
</template>
