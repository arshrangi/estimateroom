<script setup lang="ts">
// ABOUTME: Top-bar control to copy the room invite link. Shows a glyph + text confirmation (not color alone).
const props = defineProps<{ roomId: string }>()
const { copied, copy } = useInvite(props.roomId)
</script>

<template>
  <button
    type="button"
    class="h-8 rounded-sm border px-3 font-mono text-meta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    :class="copied
      ? 'border-accent-border bg-accent-bg text-accent'
      : 'border-line bg-surface text-ink-soft hover:text-ink'"
    @click="copy"
  >
    {{ copied ? 'Link copied ✓' : 'Copy invite link' }}
  </button>
</template>
