import { describe, it, expect } from "vitest"
import { WILD_CARDS, drawWildCard } from "../lib/wildcards"

describe("WILD_CARDS deck", () => {
  it("has at least 6 cards with title and text", () => {
    expect(WILD_CARDS.length).toBeGreaterThanOrEqual(6)
    for (const card of WILD_CARDS) {
      expect(card.id.length).toBeGreaterThan(0)
      expect(card.title.length).toBeGreaterThan(0)
      expect(card.text.length).toBeGreaterThan(0)
    }
  })
  it("has unique ids", () => {
    expect(new Set(WILD_CARDS.map((c) => c.id)).size).toBe(WILD_CARDS.length)
  })
})

describe("drawWildCard", () => {
  it("draws from the deck", () => {
    expect(WILD_CARDS).toContain(drawWildCard())
  })
  it("avoids recently drawn cards", () => {
    const allButOne = WILD_CARDS.slice(1).map((c) => c.id)
    expect(drawWildCard(allButOne)).toEqual(WILD_CARDS[0])
  })
  it("reshuffles when everything is excluded", () => {
    expect(WILD_CARDS).toContain(drawWildCard(WILD_CARDS.map((c) => c.id)))
  })
})
