// ABOUTME: Avatar presets: the fixed tint palette and initials derived from a display name.
// ABOUTME: Avatars are an initials square (per DESIGN.md) with an optional on-brand background tint.
export const AVATAR_TINTS = ['slate', 'teal', 'forest', 'clay', 'plum'] as const
export type AvatarTint = (typeof AVATAR_TINTS)[number]

export function isAvatarTint(value: unknown): value is AvatarTint {
  return typeof value === 'string' && (AVATAR_TINTS as readonly string[]).includes(value)
}

/** Up to two uppercase initials: first letters of the first two words, or first two letters of a single word. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return (words[0]![0]! + words[1]![0]!).toUpperCase()
}
