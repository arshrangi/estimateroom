// ABOUTME: Tests the invite URL builder.
import { describe, expect, it } from 'vitest'
import { inviteUrl } from './invite'

describe('inviteUrl', () => {
  it('builds the join route from origin and room id', () => {
    expect(inviteUrl('https://estimateroom.app', 'abc123')).toBe('https://estimateroom.app/r/abc123')
    expect(inviteUrl('http://localhost:3000', 'xyz')).toBe('http://localhost:3000/r/xyz')
  })
})
