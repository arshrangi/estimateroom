<script setup lang="ts">
// ABOUTME: App shell: centered column, the top bar, and the routed page. Syncs theme state on mount.
const { init } = useTheme()
onMounted(init)
</script>

<template>
  <div class="min-h-screen bg-bg text-ink">
    <NuxtRouteAnnouncer />
    <div class="mx-auto max-w-[1180px] px-4 py-4">
      <TheTopBar />
      <NuxtPage />
    </div>
  </div>
</template>
