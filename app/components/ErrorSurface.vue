<script setup lang="ts">
// ABOUTME: The dead-link surface: distinct copy for an expired vs not-found room, routing back to Create.
import type { ErrorCode } from '~~/shared/protocol'

const props = defineProps<{ code: ErrorCode }>()

const heading = computed(() => (props.code === 'ROOM_EXPIRED' ? 'Room expired' : 'Room not found'))
const body = computed(() =>
  props.code === 'ROOM_EXPIRED'
    ? 'This room has expired. Rooms close after they have been empty for a while.'
    : "We couldn't find that room. The link may be mistyped, or the room may have closed.",
)
</script>

<template>
  <section class="mx-auto mt-6 max-w-sm rounded-lg border border-line bg-surface p-6 text-center">
    <h1 class="text-heading font-bold text-ink">{{ heading }}</h1>
    <p class="mt-2 text-body text-ink-soft">{{ body }}</p>
    <NuxtLink
      to="/"
      class="mt-5 inline-block h-[38px] rounded-sm bg-accent px-4 font-semibold leading-[38px] text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
    >
      Create a room
    </NuxtLink>
  </section>
</template>
