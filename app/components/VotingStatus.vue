<script setup lang="ts">
// ABOUTME: The pre-reveal "who are we waiting on" line, announced politely for screen readers.
import { votingStatusText } from '~~/shared/status'

const store = useRoomStore()
const text = computed(() => votingStatusText(store.participants))
</script>

<template>
  <p aria-live="polite" class="font-mono text-meta text-ink-soft">{{ text }}</p>
</template>
