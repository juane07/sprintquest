import { describe, it, expect } from "vitest"
import { MODE_CONFIG, DEFAULT_MODE, GAME_MODES, CATEGORIES, XP_PER_LEVEL, MODE_UNLOCK_LEVEL } from "../constants"

const EXPECTED_MODES = ["BOSS_BATTLE", "SAILBOAT", "MISSION_CONTROL", "DETECTIVE", "TEAM_BATTLE", "MAD_SAD_GLAD", "START_STOP_CONTINUE", "FOUR_LS", "LEAN_COFFEE", "PLUS_DELTA", "BUG_BASH", "QUEST_TRAIL"]

describe("game modes", () => {
  it("defines all 10 modes (5 MVP + 5 classics)", () => {
    for (const key of EXPECTED_MODES) {
      expect(MODE_CONFIG[key]).toBeDefined()
    }
    for (const key of ["BOSS_BATTLE", "SAILBOAT", "MISSION_CONTROL", "DETECTIVE", "TEAM_BATTLE"]) {
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
  it("assigns an unlock level to every mode", () => {
    for (const key of EXPECTED_MODES) {
      expect(MODE_UNLOCK_LEVEL[key]).toBeGreaterThanOrEqual(1)
    }
    expect(MODE_UNLOCK_LEVEL.SAILBOAT).toBe(1)
  })
})
