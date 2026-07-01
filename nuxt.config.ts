// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

// Applies the saved or system theme to <html> before first paint, so there is no flash of the wrong theme.
const noFlashTheme = `(function(){try{var t=localStorage.getItem('pointr-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  nitro: {
    preset: 'cloudflare_module',
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['partysocket', 'zod'] },
  },
  app: {
    head: {
      script: [{ innerHTML: noFlashTheme, tagPosition: 'head' }],
    },
  },
  runtimeConfig: {
    public: {
      // Host[:port] of the partyserver Worker. Defaults to the local `dev:party` port.
      // Deployments MUST set NUXT_PUBLIC_PARTY_HOST to their deployed party Worker origin.
      partyHost: '127.0.0.1:8787',
    },
  },
})
