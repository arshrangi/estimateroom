<script setup lang="ts">
// ABOUTME: A square avatar showing monospace initials, with an optional on-brand background tint.
import { initials, type AvatarTint } from '~~/shared/avatars'

const props = defineProps<{ name: string; tint?: AvatarTint | null }>()

// Full class strings (static) so Tailwind's scanner emits them.
const TINT_BG: Record<AvatarTint, string> = {
  slate: 'bg-avatar-slate',
  teal: 'bg-avatar-teal',
  forest: 'bg-avatar-forest',
  clay: 'bg-avatar-clay',
  plum: 'bg-avatar-plum',
}

const background = computed(() => (props.tint ? TINT_BG[props.tint] : 'bg-surface-2'))
</script>

<template>
  <span
    aria-hidden="true"
    class="inline-flex size-6 items-center justify-center rounded-sm font-mono text-meta text-ink-soft"
    :class="background"
  >
    {{ initials(name) }}
  </span>
</template>
