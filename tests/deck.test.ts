import { describe, it, expect } from "vitest"
import { CHANCE_DECK, drawChance, POLL_QUESTIONS } from "../lib/deck"

describe("chance deck", () => {
  it("holds 8 cards with valid effects", () => {
    expect(CHANCE_DECK).toHaveLength(8)
    for (const c of CHANCE_DECK) {
      expect(["xp", "timer", "anon", "poll", "shuffle", "spotlight", "dice"]).toContain(c.effect.kind)
    }
  })
  it("avoids repeats then reshuffles", () => {
    const all = CHANCE_DECK.map((c) => c.id)
    const last = drawChance(all)
    expect(CHANCE_DECK.map((c) => c.id)).toContain(last.id)
    const seen = new Set<string>()
    for (let i = 0; i < 8; i++) seen.add(drawChance([...seen]).id)
    expect(seen.size).toBe(8)
  })
})

describe("anti-grief", () => {
  it("no card takes more than 30s from the team", () => {
    for (const c of CHANCE_DECK) {
      if (c.effect.kind === "timer" && (c.effect.amount ?? 0) < 0) {
        expect(c.effect.amount).toBeGreaterThanOrEqual(-30)
      }
    }
  })
})

describe("poll questions", () => {
  it("every question has 3 options", () => {
    expect(POLL_QUESTIONS.length).toBeGreaterThan(0)
    for (const p of POLL_QUESTIONS) expect(p.opts).toHaveLength(3)
  })
})
