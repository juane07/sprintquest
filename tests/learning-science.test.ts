import { describe, it, expect } from "vitest"
import { getRetrievalPrompt } from "../lib/learning-science"
import { getReflectionPrompts } from "../lib/learning-science"
import { getAdaptiveRoundDuration, shouldExtendRound } from "../lib/learning-science"
import { engagementLabel, levelLabel, engagementMetric, levelForXp } from "../lib/xp"

describe("Spaced Retrieval", () => {
  it("returns early type for sprint 1", () => {
    const result = getRetrievalPrompt(1)
    expect(result.type).toBe("early")
    expect(result.prompt.length).toBeGreaterThan(0)
  })
  it("returns mid type for sprint 3", () => {
    const result = getRetrievalPrompt(3)
    expect(result.type).toBe("mid")
  })
  it("returns deep type for sprint 6+", () => {
    const result = getRetrievalPrompt(6)
    expect(result.type).toBe("deep")
  })
})

describe("Reflection Prompts", () => {
  it("returns prompts for each mode", () => {
    const modes = ["boss", "sailboat", "mission", "detective", "team"]
    modes.forEach((mode) => {
      const prompts = getReflectionPrompts(mode)
      expect(prompts.length).toBeGreaterThan(0)
      prompts.forEach((p) => {
        expect(p.type).toMatch(/metacognitive|elaborative|evaluative|exploratory/)
      })
    })
  })
})

describe("Adaptive Pacing", () => {
  it("returns default duration for low activity", () => {
    const dur = getAdaptiveRoundDuration(0, 0)
    expect(dur).toBeGreaterThan(0)
  })
  it("extends duration when activity is high", () => {
    const base = getAdaptiveRoundDuration(0, 0)
    const extended = getAdaptiveRoundDuration(10, 60)
    expect(extended).toBeGreaterThanOrEqual(base)
  })
  it("shouldExtendRound returns true when entries are growing", () => {
    expect(shouldExtendRound(true, 30)).toBe(true)
  })
  it("shouldExtendRound returns false when time is up", () => {
    expect(shouldExtendRound(false, 0)).toBe(false)
  })
})

describe("Engagement Label (reframed XP)", () => {
  it("engagementLabel returns correct tiers", () => {
    expect(engagementLabel(engagementMetric(0))).toBe("Moderate engagement")
    expect(engagementLabel(50)).toBe("Building engagement")
    expect(engagementLabel(100)).toBe("Moderate engagement")
    expect(engagementLabel(200)).toBe("Moderate engagement")
    expect(engagementLabel(300)).toBe("Strong engagement")
    expect(engagementLabel(engagementMetric(1000))).toBe("High engagement")
    expect(engagementLabel(500)).toBe("High engagement")
  })
  it("levelLabel returns maturity level text", () => {
    expect(levelLabel(levelForXp(0))).toBe("Level 1 — Team Maturity")
    expect(levelLabel(levelForXp(1000))).toBe("Level 2 — Team Maturity")
  })
})
