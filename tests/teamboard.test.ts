import { describe, it, expect } from "vitest"
import { BOARD_STEPS, DEPTH_BOOSTERS } from "../constants"
import { boardPositionForRound, canAdvance } from "../components/TeamBoard"

describe("team journey board", () => {
  it("defines 5 cooperative steps, no punitive squares", () => {
    expect(BOARD_STEPS).toHaveLength(5)
    const labels = BOARD_STEPS.map(s => s.label.toLowerCase()).join(" ")
    expect(labels).not.toMatch(/jail|bankrupt|rent|lose/)
  })
  it("offers exactly 3 depth boosters, zero speed/skip boosters", () => {
    expect(DEPTH_BOOSTERS.map(b => b.id).sort()).toEqual(["doble-porque", "lupa", "puente"])
    const text = DEPTH_BOOSTERS.map(b => `${b.label} ${b.desc}`.toLowerCase()).join(" ")
    expect(text).not.toMatch(/skip|turbo|extra time|double vote/)
  })
  it("maps rounds onto board without ever going out of bounds", () => {
    expect(boardPositionForRound(1, 4)).toBe(0)
    expect(boardPositionForRound(4, 4)).toBe(BOARD_STEPS.length - 1)
    expect(boardPositionForRound(99, 4)).toBe(BOARD_STEPS.length - 1)
    expect(boardPositionForRound(-1, 4)).toBe(0)
  })
  it("requires depth before advancing (3 team entries)", () => {
    expect(canAdvance(0)).toBe(false)
    expect(canAdvance(2)).toBe(false)
    expect(canAdvance(3)).toBe(true)
  })
})
