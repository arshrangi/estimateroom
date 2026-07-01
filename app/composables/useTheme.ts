// ABOUTME: Reactive light/dark theme synced to <html>.dark and localStorage.
// ABOUTME: The inline no-flash head script sets the initial class; init() syncs reactive state on mount.
import { resolveInitialTheme, THEME_STORAGE_KEY, type Theme } from '~~/shared/theme'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'light')

  function set(next: Theme) {
    theme.value = next
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', next === 'dark')
      localStorage.setItem(THEME_STORAGE_KEY, next)
    }
  }

  function init() {
    if (!import.meta.client) return
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    theme.value = resolveInitialTheme(stored, window.matchMedia('(prefers-color-scheme: dark)').matches)
  }

  function toggle() {
    set(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, set, toggle, init }
}
