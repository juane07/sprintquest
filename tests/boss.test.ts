import { describe, it, expect } from "vitest"
import { BOSS_HP, ATTACK_DMG, bossHp, isDefeated } from "../lib/boss"

describe("bossHp", () => {
  it("starts full and drops per attack", () => {
    expect(bossHp(0)).toBe(BOSS_HP)
    expect(bossHp(1)).toBe(BOSS_HP - ATTACK_DMG)
    expect(bossHp(999)).toBe(0)
  })
  it("ignores negatives", () => {
    expect(bossHp(-2)).toBe(BOSS_HP)
  })
})

describe("isDefeated", () => {
  it("dies at zero HP", () => {
    expect(isDefeated(0)).toBe(false)
    expect(isDefeated(4)).toBe(true)
  })
  it("is killable by a unanimous small team", () => {
    // tuning invariant: 4 attacks x 25 dmg = 100 HP
    expect(BOSS_HP / ATTACK_DMG).toBeLessThanOrEqual(4)
  })
})
