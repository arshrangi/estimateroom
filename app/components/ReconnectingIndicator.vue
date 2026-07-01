<script setup lang="ts">
// ABOUTME: A transient, non-blocking banner shown while the room socket is re-establishing.
// ABOUTME: It never covers the table; it resolves on its own when the connection reopens.
defineProps<{ show: boolean }>()
</script>

<template>
  <p
    v-if="show"
    role="status"
    aria-live="polite"
    class="rounded-sm border border-outlier-border bg-outlier-bg px-3 py-1.5 font-mono text-meta text-outlier"
  >
    Reconnecting…
  </p>
</template>
