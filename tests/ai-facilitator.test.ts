import { describe, it, expect } from "vitest"
import { detectPatterns, buildFacilitatorPrompt } from "../lib/ai"

describe("AI Facilitator", () => {
  it("detectPatterns returns patterns for repeated categories", () => {
    const entries = [
      { category: "🚀", content: "Deployment pipeline is smooth" },
      { category: "🐌", content: "Pipeline keeps failing" },
      { category: "🚀", content: "CI/CD is fast" },
    ]
    const patterns = detectPatterns(entries)
    expect(Array.isArray(patterns)).toBe(true)
    const rocketPattern = patterns.find(p => p.topic === "🚀")
    expect(rocketPattern).toBeDefined()
    expect(rocketPattern!.count).toBe(2)
  })
  it("returns empty for unique categories", () => {
    expect(detectPatterns([{ category: "test", content: "only one" }])).toEqual([])
  })
  it("buildFacilitatorPrompt uses engagement framing", () => {
    const result = buildFacilitatorPrompt("boss", [
      { category: "🚀", content: "test", author: "Alice" },
    ])
    expect(result.system).toContain("engagement metrics")
    expect(result.system).not.toContain("earned XP")
    expect(result.system).toContain("never as rewards")
  })
})
