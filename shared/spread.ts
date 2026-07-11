// ABOUTME: Computes the revealed spread (median, range, consensus) and grades it by deck steps.
// ABOUTME: Numeric cards (and ½) drive the stats; non-numeric decks (e.g. T-shirt) degrade to a count only.
export interface Spread {
  count: number
  median: number | null
  min: number | null
  max: number | null
  consensus: boolean
}

export function parseCard(value: string): number | null {
  if (value === '½') return 0.5
  const n = Number(value)
  return Number.isFinite(n) && value.trim() !== '' ? n : null
}

export function computeSpread(votes: string[]): Spread {
  const consensus = votes.length > 0 && votes.every((v) => v === votes[0])
  const nums = votes.map(parseCard).filter((n): n is number => n !== null)
  if (nums.length === 0) {
    return { count: votes.length, median: null, min: null, max: null, consensus }
  }
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
  return { count: votes.length, median, min: sorted[0]!, max: sorted[sorted.length - 1]!, consensus }
}

export type SpreadGrade = 'low' | 'moderate' | 'high'

/** Grades min-to-max vote distance in deck card positions; null when fewer than two distinct numeric in-deck votes. */
export function spreadGrade(votes: string[], deck: string[]): SpreadGrade | null {
  const indices = votes
    .filter((v) => parseCard(v) !== null)
    .map((v) => deck.indexOf(v))
    .filter((i) => i !== -1)
  if (indices.length < 2) return null
  const steps = Math.max(...indices) - Math.min(...indices)
  if (steps === 0) return null
  if (steps === 1) return 'low'
  if (steps === 2) return 'moderate'
  return 'high'
}
