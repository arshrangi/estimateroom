<script setup lang="ts">
// ABOUTME: The top bar: the Pointr wordmark (accent-colored "i") and the theme toggle.
// ABOUTME: Deck selector and invite control slot in here in later stories.
</script>

<template>
  <header class="flex h-8 items-center justify-between gap-3">
    <span class="text-wordmark font-extrabold tracking-[-0.6px] text-ink">Po<span class="text-accent">i</span>ntr</span>
    <ThemeToggle />
  </header>
</template>
