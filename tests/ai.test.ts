import { describe, it, expect } from "vitest"
import { buildFacilitatorPrompt, extractJson, truncateEntries } from "../lib/ai"

describe("extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson<{ a: number }>('{"a": 1}')).toEqual({ a: 1 })
  })
  it("parses fenced JSON", () => {
    expect(extractJson<{ a: number }>('```json\n{"a": 2}\n```')).toEqual({ a: 2 })
  })
  it("extracts JSON from surrounding prose", () => {
    expect(extractJson<{ a: number }>('Here you go: {"a": 3} done')).toEqual({ a: 3 })
  })
  it("returns null on garbage", () => {
    expect(extractJson("no json here")).toBeNull()
    expect(extractJson("{broken")).toBeNull()
  })
})

describe("truncateEntries", () => {
  it("passes short text through", () => {
    expect(truncateEntries("hi", 10)).toBe("hi")
  })
  it("truncates long text with marker", () => {
    const out = truncateEntries("abcdefghij", 5)
    expect(out.startsWith("abcde")).toBe(true)
    expect(out).toContain("[truncated]")
  })
})

describe("buildFacilitatorPrompt", () => {
  it("includes mode and entries", () => {
    const { system, user } = buildFacilitatorPrompt("SAILBOAT", [{ category: "🌬️ Wind", content: "Shipped early", author: "Sam" }])
    expect(system).toContain("STRICT JSON")
    expect(user).toContain("SAILBOAT")
    expect(user).toContain("Shipped early")
    expect(system).toContain("engagement metrics")
    expect(system).toContain("rewards or prizes")
  })
})