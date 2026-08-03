<script setup lang="ts">
// ABOUTME: A trigger that expands inline into a "message + Confirm/Cancel" affordance (never a blocking modal).
// ABOUTME: Focus moves to Confirm on open and returns to the trigger on confirm/cancel; Escape cancels.
const props = withDefaults(
  defineProps<{
    label?: string
    message: string
    confirmLabel?: string
    destructive?: boolean
    compact?: boolean
  }>(),
  { label: '', confirmLabel: 'Confirm', destructive: false, compact: false },
)

const slots = useSlots()

const emit = defineEmits<{ confirm: [] }>()

const open = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const confirmRef = ref<HTMLButtonElement | null>(null)

function openConfirm() {
  open.value = true
  nextTick(() => confirmRef.value?.focus())
}
function cancel() {
  open.value = false
  nextTick(() => triggerRef.value?.focus())
}
function confirm() {
  open.value = false
  emit('confirm')
  nextTick(() => triggerRef.value?.focus())
}

const triggerClass = computed(() => {
  if (slots.trigger) return 'cursor-pointer rounded-sm'
  return props.compact
    ? 'inline-flex h-6 items-center rounded-sm border border-danger-border bg-danger-bg px-2 font-mono text-meta text-danger hover:border-danger'
    : 'h-[38px] rounded-sm border border-line bg-surface px-4 font-semibold text-ink-soft hover:text-ink'
})
</script>

<template>
  <span class="inline-flex" @keydown.escape="open && cancel()">
    <button
      v-if="!open"
      ref="triggerRef"
      type="button"
      class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
      :class="triggerClass"
      @click="openConfirm"
    >
      <slot name="trigger">{{ label }}</slot>
    </button>

    <span v-else class="inline-flex items-center gap-2 rounded-sm border border-line bg-surface px-2 py-1">
      <span class="font-mono text-meta text-ink-soft">{{ message }}</span>
      <button
        ref="confirmRef"
        type="button"
        class="rounded-sm px-2 py-1 font-mono text-meta font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
        :class="destructive ? 'bg-danger-bg text-danger' : 'bg-accent text-accent-fg'"
        @click="confirm"
      >
        {{ confirmLabel }}
      </button>
      <button
        type="button"
        class="rounded-sm px-2 py-1 font-mono text-meta text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
        @click="cancel"
      >
        Cancel
      </button>
    </span>
  </span>
</template>
