// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

// Applies the saved or system theme to <html> before first paint, so there is no flash of the wrong theme.
const noFlashTheme = `(function(){try{var t=localStorage.getItem('estimateroom-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`

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
      htmlAttrs: { lang: 'en' },
      script: [{ innerHTML: noFlashTheme, tagPosition: 'head' }],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
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
