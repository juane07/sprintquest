import { describe, it, expect } from "vitest"
import { MODE_CONFIG, DEFAULT_MODE, GAME_MODES, CATEGORIES, XP_PER_LEVEL } from "../constants"

const EXPECTED_MODES = ["BOSS_BATTLE", "SAILBOAT", "MISSION_CONTROL", "DETECTIVE", "TEAM_BATTLE"]

describe("game modes", () => {
  it("defines all 5 MVP modes", () => {
    for (const key of EXPECTED_MODES) {
      expect(MODE_CONFIG[key]).toBeDefined()
      expect(GAME_MODES).toHaveProperty(key)
    }
  })
  it("gives every mode 4 rounds with title and prompt", () => {
    for (const [key, mode] of Object.entries(MODE_CONFIG)) {
      expect(mode.rounds, key).toHaveLength(4)
      for (const round of mode.rounds) {
        expect(round.title.length).toBeGreaterThan(0)
        expect(round.prompt.length).toBeGreaterThan(0)
      }
    }
  })
  it("gives every mode categories, vote and victory copy", () => {
    for (const [key, mode] of Object.entries(MODE_CONFIG)) {
      expect(mode.categories.length, key).toBeGreaterThanOrEqual(2)
      for (const cat of mode.categories) {
        expect(cat.name.length).toBeGreaterThan(0)
        expect(cat.hint.length).toBeGreaterThan(0)
      }
      expect(mode.voteTitle.length).toBeGreaterThan(0)
      expect(mode.victoryTitle.length).toBeGreaterThan(0)
      expect(mode.victoryEmoji.length).toBeGreaterThan(0)
      expect(mode.intro.length).toBeGreaterThan(0)
    }
  })
  it("keeps the fallback mode valid", () => {
    expect(DEFAULT_MODE.rounds).toHaveLength(4)
    expect(DEFAULT_MODE.categories.length).toBeGreaterThan(0)
  })
  it("keeps economy constants sane", () => {
    expect(XP_PER_LEVEL).toBe(1000)
    expect(CATEGORIES.length).toBeGreaterThan(0)
  })
})
