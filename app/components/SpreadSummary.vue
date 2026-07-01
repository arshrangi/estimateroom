<script setup lang="ts">
// ABOUTME: The revealed metrics strip: median, range, and an outlier/consensus callout (warn color, never accent).
import { computeSpread, outlierFlag } from '~~/shared/spread'

const store = useRoomStore()

const votes = computed(() =>
  store.participants.filter((p) => p.role !== 'observer' && p.vote !== null).map((p) => p.vote as string),
)
const spread = computed(() => computeSpread(votes.value))
const outlierCount = computed(() => votes.value.filter((v) => outlierFlag(v, spread.value) !== null).length)
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-line bg-surface-2 px-4 py-2.5 font-mono text-meta text-ink-soft">
    <template v-if="spread.median !== null">
      <span>Median <b class="font-semibold text-ink">{{ spread.median }}</b></span>
      <span>Range <b class="font-semibold text-ink">{{ spread.min }} to {{ spread.max }}</b></span>
    </template>
    <span v-if="spread.consensus" class="text-ink">Consensus</span>
    <span v-else-if="outlierCount > 0" class="text-outlier">spread: high · {{ outlierCount }} outlier{{ outlierCount === 1 ? '' : 's' }}</span>
    <span class="text-ink-muted">{{ spread.count }} vote{{ spread.count === 1 ? '' : 's' }}</span>
  </div>
</template>
