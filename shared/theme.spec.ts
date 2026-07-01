// ABOUTME: Tests theme resolution: a stored override wins; otherwise the OS preference decides.
import { describe, expect, it } from 'vitest'
import { resolveInitialTheme } from './theme'

describe('resolveInitialTheme', () => {
  it('uses a stored light/dark override when present', () => {
    expect(resolveInitialTheme('dark', false)).toBe('dark')
    expect(resolveInitialTheme('light', true)).toBe('light')
  })

  it('falls back to the system preference when nothing is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark')
    expect(resolveInitialTheme(null, false)).toBe('light')
  })

  it('ignores an invalid stored value and uses the system preference', () => {
    expect(resolveInitialTheme('purple', true)).toBe('dark')
  })
})
