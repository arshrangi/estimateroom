<script setup lang="ts">
// ABOUTME: Presentational deck chooser: the preset list plus the free-text custom input.
// ABOUTME: Emits pick with the chosen cards; apply semantics and confirms belong to the parent.
import { DECK_PRESETS, normalizeCustomDeck } from '~~/shared/decks'

const props = defineProps<{ selected?: string[] | null }>()
const emit = defineEmits<{ pick: [cards: string[]] }>()

const custom = ref('')
const firstPresetEl = ref<HTMLButtonElement | null>(null)

function isSelected(cards: string[]): boolean {
  const sel = props.selected
  return !!sel && sel.length === cards.length && cards.every((c, i) => c === sel[i])
}

const selectedIsPreset = computed(() => DECK_PRESETS.some((d) => isSelected(d.cards)))

onMounted(() => {
  // A remembered custom deck starts in the input so it can be seen and edited.
  if (props.selected && !selectedIsPreset.value) custom.value = props.selected.join(' ')
})

function submitCustom() {
  const cards = normalizeCustomDeck(custom.value)
  if (cards.length) emit('pick', cards)
}

function focusFirst() {
  firstPresetEl.value?.focus()
}
defineExpose({ focusFirst })
</script>

<template>
  <div>
    <button
      v-for="(d, i) in DECK_PRESETS"
      :key="d.id"
      :ref="(el) => { if (i === 0) firstPresetEl = el as HTMLButtonElement }"
      type="button"
      :aria-pressed="isSelected(d.cards)"
      class="flex w-full flex-col rounded-sm px-2 py-1 text-left hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      :class="isSelected(d.cards) ? 'bg-surface-2' : ''"
      @click="emit('pick', d.cards)"
    >
      <span class="text-body text-ink">{{ d.label }}</span>
      <span class="font-mono text-meta text-ink-muted">{{ d.cards.slice(0, 7).join(' ') }}{{ d.cards.length > 7 ? ' …' : '' }}</span>
    </button>

    <form class="mt-2 flex gap-1 border-t border-line-soft pt-2" @submit.prevent="submitCustom">
      <input
        v-model="custom"
        type="text"
        placeholder="Custom: 1 2 3 5 8"
        aria-label="Custom deck values"
        class="h-8 w-full rounded-sm border border-line bg-bg px-2 font-mono text-meta text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
      <button
        type="submit"
        class="h-8 shrink-0 rounded-sm border border-line bg-surface px-2 font-mono text-meta text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Set
      </button>
    </form>
  </div>
</template>
