<script setup lang="ts">
// ABOUTME: One participant row: identity on the left, voted/waiting status (or the revealed value) on the right.
// ABOUTME: The row's accessible label carries name, role, and status/value; the visual cell mirrors it.
import type { Participant, Role } from '~~/shared/protocol'

const props = defineProps<{
  participant: Participant
  isHost: boolean
  isYou: boolean
  canManage: boolean
  revealed: boolean
}>()

defineEmits<{ kick: []; makeHost: []; setRole: [Role] }>()

// Host actions read as small chips; the tint carries the consequence, so neutral for the
// reversible toggle and accent for a promotion. Removal lives in ConfirmButton's danger tint.
const actionChip = 'inline-flex h-6 shrink-0 items-center rounded-sm border px-2 font-mono text-meta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink'

const descriptor = computed(() => {
  const parts: string[] = []
  if (props.isHost) parts.push('host')
  parts.push(props.participant.role === 'observer' ? 'not voting' : 'voter')
  if (props.isYou) parts.push('you')
  if (props.revealed) {
    // A vote cast before opting out stays public, so report it whatever the role now is.
    if (props.participant.vote !== null) parts.push(`voted ${props.participant.vote}`)
    else if (props.participant.role !== 'observer') parts.push('not voted')
  } else if (props.participant.role !== 'observer') {
    parts.push(props.participant.hasVoted ? 'voted' : 'waiting')
  }
  return parts.join(', ')
})
</script>

<template>
  <li
    class="flex flex-wrap items-center justify-between px-4 py-2 not-first:border-t not-first:border-line-soft"
    :class="isYou ? 'bg-row-you' : ''"
    :aria-label="`${participant.name} (${descriptor})`"
  >
    <!-- Below sm the name takes a whole line so the host's action chips cannot starve it. -->
    <div class="flex min-w-0 basis-full items-center gap-2 sm:basis-auto">
      <UserAvatar :name="participant.name" :tint="participant.avatar" />
      <span class="min-w-0 truncate text-body font-semibold text-ink">{{ participant.name }}</span>
      <span
        v-if="isHost"
        class="shrink-0 rounded-sm bg-accent-bg px-1.5 py-0.5 font-mono text-label-caps font-bold uppercase tracking-wider text-accent-ink"
      >Host</span>
      <span v-if="isYou" class="shrink-0 text-meta text-accent-ink">· you</span>
      <span v-if="participant.role === 'observer'" class="shrink-0 font-mono text-meta text-ink-muted">not voting</span>
    </div>

    <div class="flex basis-full flex-wrap items-center justify-end gap-x-3 gap-y-1 sm:basis-auto">
      <button
        v-if="canManage"
        type="button"
        :class="[actionChip, 'border-line bg-surface-2 text-ink-soft hover:border-ink-muted']"
        @click="$emit('setRole', participant.role === 'observer' ? 'voter' : 'observer')"
      >
        {{ participant.role === 'observer' ? 'Mark voting' : 'Mark not voting' }}
      </button>
      <button
        v-if="canManage && !isHost"
        type="button"
        :class="[actionChip, 'border-accent-border bg-accent-bg text-accent-ink hover:border-accent']"
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
        <template v-if="revealed">
          <span v-if="participant.vote === null && participant.role === 'observer'" class="text-ink-muted">—</span>
          <VoteValue v-else :value="participant.vote" />
        </template>
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
