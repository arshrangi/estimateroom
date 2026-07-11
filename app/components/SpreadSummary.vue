<script setup lang="ts">
// ABOUTME: The revealed metrics strip: median, range, and a consensus or deck-step-graded spread callout.
import { computeSpread, spreadGrade } from '~~/shared/spread'

const store = useRoomStore()

const votes = computed(() =>
  store.participants.filter((p) => p.role !== 'observer' && p.vote !== null).map((p) => p.vote as string),
)
const spread = computed(() => computeSpread(votes.value))
const grade = computed(() => (store.deck ? spreadGrade(votes.value, store.deck) : null))
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-line bg-surface-2 px-4 py-2.5 font-mono text-meta text-ink-soft"
  >
    <template v-if="spread.median !== null">
      <span>Median <b class="font-semibold text-ink">{{ spread.median }}</b></span>
      <span>Range <b class="font-semibold text-ink">{{ spread.min }} to {{ spread.max }}</b></span>
    </template>
    <span v-if="spread.consensus" class="text-ink">Consensus</span>
    <span v-else-if="grade" class="inline-flex items-center gap-1.5 text-ink">
      spread: {{ grade }}
      <span class="group relative inline-flex">
        <button
          type="button"
          aria-label="What spread means"
          aria-describedby="spread-tooltip"
          class="flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
        >i</button>
        <span
          id="spread-tooltip"
          role="tooltip"
          class="pointer-events-none invisible absolute bottom-full left-1/2 z-10 mb-1.5 w-60 -translate-x-1/2 rounded-sm border border-line bg-surface px-2.5 py-1.5 text-left font-sans text-meta normal-case text-ink-soft opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
        >
          How far apart the lowest and highest votes sit in this deck: neighbouring cards read low, two apart moderate, three or more high.
        </span>
      </span>
    </span>
    <span class="text-ink-muted">{{ spread.count }} vote{{ spread.count === 1 ? '' : 's' }}</span>
  </div>
</template>
