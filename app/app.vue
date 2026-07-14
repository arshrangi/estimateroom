<script setup lang="ts">
// ABOUTME: App shell: centered column, the top bar, the routed page, and the site footer. Syncs theme state on mount.
const { init } = useTheme()
onMounted(init)

// URLs derive from the request so self-hosted instances advertise their own origin.
const url = useRequestURL()
const description = 'Ad-free, account-free planning poker for agile teams. Open a room, paste the link, estimate.'

useHead({
  titleTemplate: (title) =>
    title ? `${title} · EstimateRoom` : 'EstimateRoom · Planning poker that respects your meeting',
})
useSeoMeta({
  description,
  ogSiteName: 'EstimateRoom',
  ogType: 'website',
  ogTitle: 'EstimateRoom · Planning poker that respects your meeting',
  ogDescription: description,
  ogUrl: url.origin + url.pathname,
  ogImage: `${url.origin}/web-app-manifest-512x512.png`,
  twitterCard: 'summary',
})
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
        No accounts, no tracking. Rooms expire after an hour of inactivity.
        <a
          href="https://github.com/arshrangi/estimateroom"
          class="rounded-sm underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
        >GitHub</a>
        · Apache-2.0 ·
        <a
          href="https://buymeacoffee.com/arshrangi"
          class="rounded-sm underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
        >Buy me a coffee</a>
      </p>
    </footer>
    <AppToast />
  </div>
</template>
