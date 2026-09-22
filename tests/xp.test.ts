import { describe, it, expect } from "vitest"
import { levelForXp, progressToNext, engagementMetric, streakIndicator, actionValue, engagementLabel, levelLabel } from "../lib/xp"
import { getRetrievalPrompt, getReflectionPrompts, getElaborativePrompts, getAdaptiveRoundDuration, shouldExtendRound } from "../lib/learning-science"

describe("levelForXp", () => {
  it("starts at level 1", () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(999)).toBe(1)
  })
  it("levels up every 1000", () => {
    expect(levelForXp(1000)).toBe(2)
    expect(levelForXp(2500)).toBe(3)
  })
  it("clamps negative", () => {
    expect(levelForXp(-50)).toBe(1)
  })
})

describe("progressToNext", () => {
  it("computes percent", () => {
    expect(progressToNext(0)).toBe(0)
    expect(progressToNext(500)).toBe(50)
    expect(progressToNext(140)).toBe(14)
    expect(progressToNext(1000)).toBe(0)
  })
})

describe("engagementMetric", () => {
  it("computes base + per entry", () => {
    expect(engagementMetric(0)).toBe(100)
    expect(engagementMetric(4)).toBe(140)
  })
  it("ignores negative", () => {
    expect(engagementMetric(-3)).toBe(100)
  })
})

describe("streakIndicator", () => {
  it("computes per streak", () => {
    expect(streakIndicator(0)).toBe(0)
    expect(streakIndicator(3)).toBe(150)
  })
})

describe("actionValue", () => {
  it("falls back to default 50", () => {
    expect(actionValue(undefined)).toBe(50)
    expect(actionValue(null)).toBe(50)
    expect(actionValue(100)).toBe(100)
  })
})

describe("engagementLabel", () => {
  it("returns correct label", () => {
    expect(engagementLabel(500)).toBe("High engagement")
    expect(engagementLabel(300)).toBe("Strong engagement")
    expect(engagementLabel(100)).toBe("Moderate engagement")
    expect(engagementLabel(50)).toBe("Building engagement")
  })
})

describe("levelLabel", () => {
  it("returns level label", () => {
    expect(levelLabel(1)).toBe("Level 1 — Team Maturity")
    expect(levelLabel(3)).toBe("Level 3 — Team Maturity")
  })
})

describe("learning-science: retrieval", () => {
  it("returns early prompt for sprint 1", () => {
    const r = getRetrievalPrompt(1)
    expect(r.type).toBe("early")
  })
  it("returns mid prompt for sprint 3", () => {
    const r = getRetrievalPrompt(3)
    expect(r.type).toBe("mid")
  })
  it("returns deep prompt for sprint 6", () => {
    const r = getRetrievalPrompt(6)
    expect(r.type).toBe("deep")
  })
})

describe("learning-science: reflection", () => {
  it("returns BOSS_BATTLE prompts", () => {
    const p = getReflectionPrompts("BOSS_BATTLE")
    expect(p.length).toBe(4)
    expect(p[0].type).toBe("metacognitive")
  })
  it("returns SAILBOAT prompts", () => {
    const p = getReflectionPrompts("SAILBOAT")
    expect(p.length).toBe(4)
  })
  it("returns default prompts for unknown mode", () => {
    const p = getReflectionPrompts("UNKNOWN")
    expect(p.length).toBe(4)
  })
})

describe("learning-science: elaborative", () => {
  it("returns 2 by default", () => {
    const p = getElaborativePrompts()
    expect(p.length).toBe(2)
  })
  it("returns requested count", () => {
    const p = getElaborativePrompts(6)
    expect(p.length).toBe(6)
  })
})

describe("learning-science: adaptive pacing", () => {
  it("returns base for low entries round 1", () => {
    expect(getAdaptiveRoundDuration(2, 1)).toBe(5) // 4 base + 1 per entry
  })
  it("returns more for high entries", () => {
    expect(getAdaptiveRoundDuration(15, 3)).toBeGreaterThanOrEqual(7)
  })
})
