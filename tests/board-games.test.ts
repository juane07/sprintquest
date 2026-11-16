import { describe, it, expect } from "vitest"
import { generateAsymmetryCards, getAsymmetryPrompt, normalizePlayerCount } from "../components/asymmetry"

describe("Asymmetry warm-up", () => {
  it("clamps player count to a cooperative group", () => {
    expect(normalizePlayerCount(0)).toBe(1)
    expect(normalizePlayerCount(3)).toBe(3)
    expect(normalizePlayerCount(99)).toBe(6)
    expect(normalizePlayerCount(Number.NaN)).toBe(3)
  })
  it("generates private hands with valid sprint numbers", () => {
    const players = generateAsymmetryCards(2, 3)
    expect(players).toHaveLength(3)
    const ids = new Set<string>()
    players.forEach(p => {
      expect(p.hand.length).toBeGreaterThanOrEqual(1)
      p.hand.forEach(card => {
        expect(card.sprintNumber).toBeGreaterThanOrEqual(1)
        expect(card.commitment.length).toBeGreaterThan(0)
        ids.add(card.id)
      })
    })
    expect(ids.size).toBeGreaterThanOrEqual(3)
  })
  it("adapts the prompt by sprint depth", () => {
    expect(getAsymmetryPrompt(1)).toContain("last sprint")
    expect(getAsymmetryPrompt(4)).toContain("2-3 sprints")
    expect(getAsymmetryPrompt(8)).toContain("3+ sprints")
  })
})
