<script setup lang="ts">
// ABOUTME: A brief, low, non-blocking confirmation toast. Announced politely; honors reduced motion.
const { message } = useToast()
</script>

<template>
  <Transition name="toast">
    <div
      v-if="message"
      role="status"
      aria-live="polite"
      class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-sm border border-accent-border bg-accent-bg px-4 py-2 font-mono text-meta text-accent-ink shadow-md"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<style>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
  .toast-enter-from,
  .toast-leave-to {
    opacity: 1;
    transform: translateX(-50%);
  }
}
</style>
