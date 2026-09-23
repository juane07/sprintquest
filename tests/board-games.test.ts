import { describe, it, expect } from "vitest"
import { generateAsymmetryCards, getAsymmetryPrompt, normalizePlayerCount } from "../components/asymmetry"
import { buildDeckFromBadges, getMasteryLabel, getMasteryLevel, unlockCard, getMasteryDeck } from "../components/mastery-deck"
import { addTile, boardCommentToTile, boardTileToComment, buildSprintMapFromBoardComments, createSprintMap, getSprintMapSummary, BOARD_CATEGORY } from "../components/legacy-sprint-map"

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

describe("Mastery deck", () => {
  it("maps stored badges to canonical cards without participation rewards", () => {
    const deck = buildDeckFromBadges("team-1", [
      { name: "Recall Master", description: "mastery:recall-master — criteria" },
      { name: "Something else", description: "unrelated" },
    ])
    const unlocked = deck.cards.filter(c => c.unlocked).map(c => c.id)
    expect(unlocked).toContain("recall-master")
    expect(unlocked).not.toContain("pattern-spotter")
  })
  it("computes mastery levels from unlocked behavior", () => {
    let deck = getMasteryDeck("team-1")
    expect(getMasteryLevel(deck)).toBe(1)
    expect(getMasteryLabel(1)).toBe("Apprentice")
    deck = unlockCard(unlockCard(unlockCard(deck, "recall-master"), "deep-thinker"), "bridge-builder")
    expect(getMasteryLevel(deck)).toBe(3)
    expect(getMasteryLabel(3)).toBe("Expert")
  })
})

describe("Legacy sprint map", () => {
  it("round-trips board tiles through Comment storage", () => {
    const content = boardTileToComment({ type: "anchor", title: "Flaky CI", description: "Red builds", sprintNumber: 3 })
    const tile = boardCommentToTile({ id: "c1", content, createdAt: "2026-01-01T00:00:00.000Z" }, 1)
    expect(tile?.type).toBe("anchor")
    expect(tile?.title).toBe("Flaky CI")
    expect(tile?.sprintNumber).toBe(3)
    expect(BOARD_CATEGORY).toBe("🗺️ Board")
  })
  it("ignores malformed board content and detects recurring anchors", () => {
    const map = createSprintMap("team-1")
    const withTiles = addTile(addTile(map, { type: "anchor", title: "Flaky CI", description: "", sprintNumber: 2, category: "CI", verified: false }), { type: "anchor", title: "Flaky CI again", description: "", sprintNumber: 3, category: "CI", verified: false })
    const summary = getSprintMapSummary(withTiles)
    expect(summary.anchors).toBe(2)
    expect(summary.recurringThemes).toContain("CI")
  })
  it("builds a map from ceremonies, sprints and board comments", () => {
    const map = buildSprintMapFromBoardComments(
      "team-1",
      [{ id: "cer1", sprintId: "spr1", status: "completed" }],
      [{ id: "spr1", number: 2 }],
      [{ id: "c1", content: boardTileToComment({ type: "wind", title: "Fast reviews" }), ceremonyId: "cer1" }, { id: "c2", content: "not-json", ceremonyId: "cer1" }],
    )
    expect(map.tiles).toHaveLength(1)
    expect(map.tiles[0].sprintNumber).toBe(2)
    expect(map.sprintsCompleted).toBe(1)
  })
})
