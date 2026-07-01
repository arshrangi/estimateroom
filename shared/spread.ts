// ABOUTME: Computes the revealed spread (median, range, consensus) and flags low/high outliers.
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

/** Flags a vote value as a low/high outlier, but only when the numeric votes actually disagree. */
export function outlierFlag(value: string, spread: Spread): 'low' | 'high' | null {
  if (spread.min === null || spread.max === null || spread.min === spread.max) return null
  const n = parseCard(value)
  if (n === null) return null
  if (n === spread.min) return 'low'
  if (n === spread.max) return 'high'
  return null
}
