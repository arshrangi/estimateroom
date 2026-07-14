<script setup lang="ts">
// ABOUTME: A revealed vote chip: digit-locked monospace value, or the plain "Not voted" marker.
defineProps<{ value: string | null }>()
</script>

<template>
  <span v-if="value === null" class="font-mono text-ink-muted">Not voted</span>
  <span
    v-else
    class="flex h-[42px] w-[34px] items-center justify-center rounded-sm border border-line bg-bg font-mono text-vote font-bold tabular-nums text-ink"
  >
    {{ value }}
  </span>
</template>
