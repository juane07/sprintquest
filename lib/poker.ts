// Planning-poker math. "?" and break cards count as votes but are excluded
// from numeric stats. Pure functions — covered by unit tests.
export const POKER_CARDS = ["1", "2", "3", "5", "8", "13", "?", "☕"]

export interface PokerStats {
  count: number
  average: number | null
  median: number | null
  consensus: boolean
}

export function numericVotes(values: string[]): number[] {
  return values.map((v) => parseFloat(v)).filter((n) => !Number.isNaN(n))
}

export function pokerStats(values: string[]): PokerStats {
  const nums = numericVotes(values).sort((a, b) => a - b)
  if (nums.length === 0) return { count: values.length, average: null, median: null, consensus: false }
  const average = nums.reduce((a, b) => a + b, 0) / nums.length
  const mid = Math.floor(nums.length / 2)
  const median = nums.length % 2 === 1 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2
  return { count: values.length, average, median, consensus: new Set(nums).size === 1 }
}

// Suggest a lock-in value: median snapped to the nearest card.
export function suggestPoints(values: string[]): string | null {
  const { median } = pokerStats(values)
  if (median === null) return null
  const cards = POKER_CARDS.filter((c) => c !== "?" && c !== "☕").map(Number)
  return String(cards.reduce((a, b) => (Math.abs(b - median) < Math.abs(a - median) ? b : a)))
}
