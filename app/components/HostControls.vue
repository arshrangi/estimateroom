<script setup lang="ts">
// ABOUTME: Host-only round controls. Pre-reveal: reveal-mode toggle + Reveal. Post-reveal: equal-weight Vote again / Next.
import type { RevealMode } from '~~/shared/protocol'

const store = useRoomStore()
const { identity } = useIdentity()

const isHost = computed(() => !!store.hostId && store.hostId === identity.value.participantId)
const anyVote = computed(() => store.participants.some((p) => p.hasVoted))

const modes: { value: RevealMode; label: string }[] = [
  { value: 'host', label: 'Host' },
  { value: 'auto', label: 'Auto' },
]
</script>

<template>
  <div v-if="isHost" class="flex items-center gap-3">
    <template v-if="!store.revealed">
      <div role="group" aria-label="Reveal mode" class="inline-flex overflow-hidden rounded-sm border border-line">
        <button
          v-for="m in modes"
          :key="m.value"
          type="button"
          :aria-pressed="store.revealMode === m.value"
          class="h-8 px-3 font-mono text-meta not-first:border-l not-first:border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          :class="store.revealMode === m.value ? 'bg-ink text-bg' : 'text-ink-soft hover:text-ink'"
          @click="store.setRevealMode(m.value)"
        >
          {{ m.label }}
        </button>
      </div>
      <button
        type="button"
        class="h-[38px] rounded-sm bg-accent px-4 font-semibold text-accent-fg disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        :disabled="!anyVote"
        @click="store.reveal()"
      >
        {{ store.revealMode === 'auto' ? 'Reveal now' : 'Reveal' }}
      </button>
    </template>

    <!-- Equal-weight peers: same style, same size, neither demoted. Vote again confirms (it clears votes); Next does not. -->
    <template v-else>
      <ConfirmButton
        label="Vote again"
        message="Clear everyone's votes and re-vote this item?"
        confirm-label="Clear & re-vote"
        @confirm="store.revote()"
      />
      <button
        type="button"
        class="h-[38px] rounded-sm border border-line bg-surface px-4 font-semibold text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        @click="store.next()"
      >
        Next
      </button>
    </template>
  </div>
</template>
