// ABOUTME: Theme type, storage key, and the pure resolver shared by the no-flash head script and useTheme.
// ABOUTME: A stored override always wins; otherwise the OS prefers-color-scheme decides.
export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'estimateroom-theme'

export function resolveInitialTheme(stored: string | null, systemPrefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored
  return systemPrefersDark ? 'dark' : 'light'
}
