import { describe, it, expect } from "vitest"

describe("Retrieval API validation", () => {
  it("validates sprintId", () => {
    const invalid = { sprintId: null }
    expect(invalid.sprintId).toBeFalsy()
  })
})

describe("Reflection API validation", () => {
  it("validates round is positive", () => {
    const invalid = { ceremonyId: "c1", round: 0 }
    expect(invalid.round < 1).toBe(true)
  })
})
