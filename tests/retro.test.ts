import { describe, it, expect } from "vitest"
import {
  RETRO_CATEGORIES,
  isRetroCategory,
  priorityCount,
  myPriority,
  orderedEntries,
  canFinish,
  type RetroAction,
  type RetroEntry,
  type RetroVote,
} from "../lib/retro"

describe("minimal Scrum retrospective model", () => {
  it("has only the two inspection categories", () => {
    expect(RETRO_CATEGORIES.map((c) => c.id)).toEqual(["went-well", "to-improve"])
    expect(isRetroCategory("went-well")).toBe(true)
    expect(isRetroCategory("🌬️ Wind")).toBe(false)
    expect(isRetroCategory(null)).toBe(false)
  })

  it("counts one priority mark per device and finds mine", () => {
    const votes: RetroVote[] = [
      { id: "v1", option: "a:priority", userId: "u1" },
      { id: "v2", option: "a:priority", userId: "u2" },
      { id: "v3", option: "b:priority", userId: "u1" },
      { id: "v4", option: "garbage", userId: "u1" },
    ]
    expect(priorityCount(votes, "a")).toBe(2)
    expect(priorityCount(votes, "b")).toBe(1)
    expect(priorityCount(votes, "missing")).toBe(0)
    expect(myPriority(votes, "b", "u1")?.userId).toBe("u1")
    expect(myPriority(votes, "a", "u3")).toBeNull()
  })

  it("orders shared entries by priority, then by when they were shared", () => {
    const entries: RetroEntry[] = [
      { id: "a", content: "A", category: "went-well", createdAt: "2026-01-01" },
      { id: "b", content: "B", category: "to-improve", createdAt: "2026-01-02" },
      { id: "c", content: "C", category: "went-well", createdAt: "2026-01-03" },
    ]
    const votes: RetroVote[] = [{ id: "v1", option: "b:priority", userId: "u1" }]
    expect(orderedEntries(entries, votes).map((e) => e.id)).toEqual(["b", "a", "c"])
    // The input array is never mutated.
    expect(entries.map((e) => e.id)).toEqual(["a", "b", "c"])
  })

  it("blocks finishing until there is at least one owned improvement", () => {
    expect(canFinish([])).toBe(false)
    expect(canFinish([{ id: "x", title: "Fix code reviews", owner: "   " }])).toBe(false)
    expect(canFinish([{ id: "x", title: "   ", owner: "Sam" }])).toBe(false)
    expect(canFinish([{ id: "x", title: "Fix code reviews", owner: "Sam" }])).toBe(true)
    const actions: RetroAction[] = [
      { id: "x", title: "Fix code reviews", owner: "Sam", status: "pending" },
    ]
    expect(canFinish(actions)).toBe(true)
  })
})
