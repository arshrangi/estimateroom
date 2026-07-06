<script setup lang="ts">
// ABOUTME: A single pickable deck card. Selected state is a solid accent fill with an accent-bg ring.
defineProps<{ value: string; selected: boolean }>()
defineEmits<{ pick: [] }>()
</script>

<template>
  <button
    type="button"
    :aria-pressed="selected"
    class="flex h-16 w-12 items-center justify-center rounded-sm border font-mono text-vote font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
    :class="selected
      ? 'border-accent bg-accent text-accent-fg ring-3 ring-accent-bg'
      : 'border-line bg-surface text-ink-soft hover:text-ink'"
    @click="$emit('pick')"
  >
    {{ value }}
  </button>
</template>
