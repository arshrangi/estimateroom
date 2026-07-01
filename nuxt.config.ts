// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  nitro: {
    preset: 'cloudflare_module',
  },
  vite: {
    optimizeDeps: { include: ['partysocket', 'zod'] },
  },
  runtimeConfig: {
    public: {
      // Host[:port] of the partyserver Worker. Defaults to the local `dev:party` port.
      // Deployments MUST set NUXT_PUBLIC_PARTY_HOST to their deployed party Worker origin.
      partyHost: '127.0.0.1:8787',
    },
  },
})
