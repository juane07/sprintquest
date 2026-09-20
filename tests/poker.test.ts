import { describe, it, expect } from "vitest"
import { POKER_CARDS, numericVotes, pokerStats, suggestPoints } from "../lib/poker"

describe("pokerStats", () => {
  it("computes average and median", () => {
    const s = pokerStats(["1", "2", "3"])
    expect(s.count).toBe(3)
    expect(s.average).toBeCloseTo(2)
    expect(s.median).toBe(2)
    expect(s.consensus).toBe(false)
  })
  it("handles even counts", () => {
    expect(pokerStats(["2", "8"]).median).toBe(5)
  })
  it("detects consensus", () => {
    expect(pokerStats(["5", "5", "5"]).consensus).toBe(true)
  })
  it("ignores ? and break cards in numeric stats", () => {
    const s = pokerStats(["?", "☕"])
    expect(s.count).toBe(2)
    expect(s.average).toBeNull()
    expect(s.consensus).toBe(false)
  })
  it("handles empty votes", () => {
    expect(pokerStats([])).toEqual({ count: 0, average: null, median: null, consensus: false })
  })
})

describe("suggestPoints", () => {
  it("snaps median to nearest card", () => {
    expect(suggestPoints(["2", "8"])).toBe("5")
    expect(suggestPoints(["13", "13"])).toBe("13")
    expect(suggestPoints(["1", "2", "3", "8"])).toBe("2")
    expect(suggestPoints([])).toBeNull()
  })
})

describe("POKER_CARDS", () => {
  it("uses a fibonacci-like deck", () => {
    expect(POKER_CARDS).toEqual(["1", "2", "3", "5", "8", "13", "?", "☕"])
  })
})
