<script setup lang="ts">
// ABOUTME: App shell: centered column, the top bar, the routed page, and the site footer. Syncs theme state on mount.
const { init } = useTheme()
onMounted(init)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg text-ink">
    <NuxtRouteAnnouncer />
    <div class="mx-auto w-full max-w-[1180px] flex-1 px-4 py-4">
      <TheTopBar />
      <NuxtPage />
    </div>
    <footer class="mx-auto w-full max-w-[1180px] px-4 pb-4 text-center font-mono text-meta text-ink-muted">
      <p>Free and open source. Self-hostable. Light and dark, built in.</p>
      <p class="mt-2">
        No accounts, no tracking. Rooms expire after 30 idle minutes.
        <a
          href="https://github.com/arshrangi/estimateroom"
          class="rounded-sm underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >GitHub</a>
        · Apache-2.0 ·
        <a
          href="https://buymeacoffee.com/arshrangi"
          class="rounded-sm underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >Buy me a coffee</a>
      </p>
    </footer>
    <AppToast />
  </div>
</template>
