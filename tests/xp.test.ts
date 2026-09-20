import { describe, it, expect } from "vitest"
import { levelForXp, progressToNext, ceremonyReward, streakBonus, actionXp } from "../lib/xp"

describe("levelForXp", () => {
  it("starts at level 1", () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(999)).toBe(1)
  })
  it("levels up every 1000 XP", () => {
    expect(levelForXp(1000)).toBe(2)
    expect(levelForXp(2500)).toBe(3)
  })
  it("clamps negative XP", () => {
    expect(levelForXp(-50)).toBe(1)
  })
})

describe("progressToNext", () => {
  it("computes percent to next level", () => {
    expect(progressToNext(0)).toBe(0)
    expect(progressToNext(500)).toBe(50)
    expect(progressToNext(140)).toBe(14)
    expect(progressToNext(1000)).toBe(0)
  })
})

describe("ceremonyReward", () => {
  it("pays base 100 plus 10 per entry", () => {
    expect(ceremonyReward(0)).toBe(100)
    expect(ceremonyReward(4)).toBe(140)
  })
  it("ignores negative counts", () => {
    expect(ceremonyReward(-3)).toBe(100)
  })
})

describe("streakBonus", () => {
  it("pays 50 per streak sprint", () => {
    expect(streakBonus(0)).toBe(0)
    expect(streakBonus(3)).toBe(150)
  })
})

describe("actionXp", () => {
  it("falls back to schema default 50", () => {
    expect(actionXp(undefined)).toBe(50)
    expect(actionXp(null)).toBe(50)
    expect(actionXp(100)).toBe(100)
  })
})
