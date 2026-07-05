<script setup lang="ts">
// ABOUTME: Two-cell segmented light/dark control. Persists the choice and is fully keyboard-operable.
import type { Theme } from '~~/shared/theme'

const { theme, set } = useTheme()

const cells: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]
</script>

<template>
  <div
    role="group"
    aria-label="Theme"
    class="inline-flex overflow-hidden rounded-sm border border-line"
  >
    <button
      v-for="cell in cells"
      :key="cell.value"
      type="button"
      :aria-pressed="theme === cell.value"
      class="h-8 px-3 font-mono text-meta transition-colors not-first:border-l not-first:border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
      :class="theme === cell.value ? 'bg-ink text-bg' : 'text-ink-soft hover:text-ink'"
      @click="set(cell.value)"
    >
      {{ cell.label }}
    </button>
  </div>
</template>
