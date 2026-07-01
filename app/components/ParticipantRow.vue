<script setup lang="ts">
// ABOUTME: One participant row: identity on the left, voted/waiting status (or the revealed value) on the right.
// ABOUTME: The row's accessible label carries name, role, and status/value; the visual cell mirrors it.
import type { Participant } from '~~/shared/protocol'
import type { Spread } from '~~/shared/spread'

const props = defineProps<{
  participant: Participant
  isHost: boolean
  isYou: boolean
  canManage: boolean
  revealed: boolean
  spread: Spread
}>()

defineEmits<{ kick: []; makeHost: [] }>()

const descriptor = computed(() => {
  const parts: string[] = []
  if (props.isHost) parts.push('host')
  parts.push(props.participant.role === 'observer' ? 'observer' : 'voter')
  if (props.isYou) parts.push('you')
  if (props.participant.role !== 'observer') {
    if (props.revealed) parts.push(props.participant.vote === null ? 'abstained' : `voted ${props.participant.vote}`)
    else parts.push(props.participant.hasVoted ? 'voted' : 'waiting')
  }
  return parts.join(', ')
})
</script>

<template>
  <li
    class="flex items-center justify-between px-4 py-2 not-first:border-t not-first:border-line-soft"
    :class="isYou ? 'bg-row-you' : ''"
    :aria-label="`${participant.name} (${descriptor})`"
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

    <div class="flex items-center gap-3">
      <button
        v-if="canManage && !isHost"
        type="button"
        class="font-mono text-meta text-ink-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        @click="$emit('makeHost')"
      >
        Make host
      </button>
      <ConfirmButton
        v-if="canManage"
        compact
        destructive
        label="Remove"
        :message="`Remove ${participant.name}?`"
        confirm-label="Remove"
        @confirm="$emit('kick')"
      />
      <div aria-hidden="true" class="text-right font-mono text-meta">
        <VoteValue v-if="revealed && participant.role !== 'observer'" :value="participant.vote" :spread="spread" />
        <template v-else>
          <span v-if="participant.role === 'observer'" class="text-ink-muted">—</span>
          <span v-else-if="participant.hasVoted" class="inline-flex items-center gap-1 text-ok">
            <span>✓</span> voted
          </span>
          <span v-else class="text-ink-muted">waiting</span>
        </template>
      </div>
    </div>
  </li>
</template>
