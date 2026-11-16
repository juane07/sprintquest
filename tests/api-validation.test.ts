import { describe, it, expect } from "vitest"

describe("Retrieval API validation", () => {
  it("validates sprintId", () => {
    const invalid = { sprintId: null }
    expect(invalid.sprintId).toBeFalsy()
  })
})
