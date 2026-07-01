<script setup lang="ts">
// ABOUTME: A revealed vote chip: digit-locked monospace value, outlier variant + low/high flag, abstain "?".
import type { Spread } from '~~/shared/spread'
import { outlierFlag } from '~~/shared/spread'

const props = defineProps<{ value: string | null; spread: Spread }>()

const flag = computed(() => (props.value ? outlierFlag(props.value, props.spread) : null))
</script>

<template>
  <span v-if="value === null" class="font-mono text-ink-muted" aria-label="abstained">?</span>
  <span v-else class="inline-flex items-center gap-1">
    <span v-if="flag" class="font-mono text-label-caps font-bold uppercase tracking-wider text-outlier">{{ flag }}</span>
    <span
      class="flex h-[42px] w-[34px] items-center justify-center rounded-sm border font-mono text-vote font-bold tabular-nums"
      :class="flag ? 'border-outlier-border bg-outlier-bg text-outlier' : 'border-line bg-bg text-ink'"
    >
      {{ value }}
    </span>
  </span>
</template>
