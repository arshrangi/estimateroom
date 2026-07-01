// ABOUTME: Tests initials derivation and avatar-tint validation.
import { describe, expect, it } from 'vitest'
import { initials, isAvatarTint } from './avatars'

describe('initials', () => {
  it('takes the first two letters of a single-word name', () => {
    expect(initials('Priya')).toBe('PR')
  })

  it('takes the first letter of the first two words', () => {
    expect(initials('Priya Sharma')).toBe('PS')
    expect(initials('a b c')).toBe('AB')
  })

  it('returns empty for a blank name', () => {
    expect(initials('   ')).toBe('')
  })
})

describe('isAvatarTint', () => {
  it('accepts known tints and rejects anything else', () => {
    expect(isAvatarTint('teal')).toBe(true)
    expect(isAvatarTint('gold')).toBe(false)
    expect(isAvatarTint(null)).toBe(false)
  })
})
