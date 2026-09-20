import { describe, it, expect } from "vitest"
import { buildActionReminders, buildCeremonyRecap } from "../lib/slack"

describe("buildActionReminders", () => {
  it("lists actions with owners and XP", () => {
    const text = buildActionReminders("Squad", [
      { title: "Fix CI", owner: "Sam", dueDate: null, xpValue: 100 },
    ])
    expect(text).toContain("Squad")
    expect(text).toContain("Fix CI")
    expect(text).toContain("Sam")
    expect(text).toContain("+100 XP")
  })
  it("flags overdue actions", () => {
    const text = buildActionReminders("Squad", [
      { title: "Old", owner: "Sam", dueDate: "2020-01-01T00:00:00.000Z", xpValue: null },
    ])
    expect(text).toContain("OVERDUE")
    expect(text).toContain("+50 XP")
  })
})

describe("buildCeremonyRecap", () => {
  it("includes label, XP and entries", () => {
    const text = buildCeremonyRecap({ teamName: "Squad", label: "🏝️ Sailboat", xp: 140, entries: 4 })
    expect(text).toContain("Squad")
    expect(text).toContain("+140")
  })
  it("appends summary and open actions when present", () => {
    const text = buildCeremonyRecap({ teamName: "S", label: "R", xp: 0, entries: 0, summary: "Great sprint", openActions: 2 })
    expect(text).toContain("Great sprint")
    expect(text).toContain("2 open action items")
  })
})
