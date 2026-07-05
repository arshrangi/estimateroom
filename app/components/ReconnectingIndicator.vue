<script setup lang="ts">
// ABOUTME: A transient, non-blocking banner shown while the room socket is re-establishing.
// ABOUTME: It resolves on its own when the connection reopens; the button forces an immediate retry.
defineProps<{ show: boolean }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    v-if="show"
    role="status"
    aria-live="polite"
    class="flex items-center gap-3 rounded-sm border border-outlier-border bg-outlier-bg px-3 py-1.5 font-mono text-meta text-outlier"
  >
    <span>Reconnecting…</span>
    <button
      type="button"
      class="underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
      @click="$emit('retry')"
    >
      Reconnect now
    </button>
  </div>
</template>
