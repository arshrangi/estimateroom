<script setup lang="ts">
// ABOUTME: One participant row: identity on the left, vote/status on the right (status arrives in Epic 2).
// ABOUTME: The row announces the person's name and role to screen readers.
import type { Participant } from '~~/shared/protocol'

const props = defineProps<{ participant: Participant; isHost: boolean; isYou: boolean }>()

const roleLabel = computed(() => {
  const parts: string[] = []
  if (props.isHost) parts.push('host')
  parts.push(props.participant.role === 'observer' ? 'observer' : 'voter')
  if (props.isYou) parts.push('you')
  return parts.join(', ')
})
</script>

<template>
  <li
    class="flex items-center justify-between px-4 py-2 not-first:border-t not-first:border-line-soft"
    :class="isYou ? 'bg-row-you' : ''"
    :aria-label="`${participant.name} (${roleLabel})`"
  >
    <div class="flex items-center gap-2">
      <UserAvatar :name="participant.name" :tint="participant.avatar" />
      <span class="text-body font-semibold text-ink">{{ participant.name }}</span>
      <span
        v-if="isHost"
        class="rounded-sm bg-accent-bg px-1.5 py-0.5 font-mono text-label-caps font-bold uppercase tracking-wider text-accent"
      >Host</span>
      <span v-if="isYou" class="text-meta text-accent">· you</span>
      <span v-if="participant.role === 'observer'" class="font-mono text-meta text-ink-muted">observer</span>
    </div>
    <div aria-hidden="true" class="text-right" />
  </li>
</template>
