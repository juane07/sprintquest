import { describe, it, expect } from "vitest"
import { rankSuspects, majorityThreshold } from "../lib/detective"

describe("rankSuspects", () => {
  it("ranks by distinct accusers", () => {
    const ranked = rankSuspects(
      [{ id: "a", content: "CI" }, { id: "b", content: "Specs" }],
      [
        { commentId: "a", userId: "u1" },
        { commentId: "a", userId: "u2" },
        { commentId: "b", userId: "u1" },
      ]
    )
    expect(ranked[0]).toEqual({ id: "a", content: "CI", accusations: 2 })
    expect(ranked[1].accusations).toBe(1)
  })
  it("counts zero for unaccused", () => {
    expect(rankSuspects([{ id: "a", content: "x" }], [])).toEqual([{ id: "a", content: "x", accusations: 0 }])
  })
})

describe("majorityThreshold", () => {
  it("needs over half the voters", () => {
    expect(majorityThreshold(1)).toBe(1)
    expect(majorityThreshold(4)).toBe(3)
    expect(majorityThreshold(5)).toBe(3)
  })
})
