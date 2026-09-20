import { describe, it, expect } from "vitest"
import { CODE_ALPHABET, CODE_LENGTH, generateJoinCode, normalizeCode, isValidCodeFormat } from "../lib/joinCode"

describe("generateJoinCode", () => {
  it("generates 6-char codes by default", () => {
    expect(generateJoinCode()).toMatch(/^[A-Z0-9]{6}$/)
    expect(generateJoinCode().length).toBe(CODE_LENGTH)
  })
  it("uses only unambiguous characters", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateJoinCode()
      expect(isValidCodeFormat(code)).toBe(true)
      expect(code).not.toMatch(/[01IO L]/)
    }
  })
  it("generates unique codes", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateJoinCode()))
    expect(codes.size).toBeGreaterThan(195)
  })
  it("excludes confusables from the alphabet", () => {
    for (const ch of ["0", "O", "1", "I", "L"]) {
      expect(CODE_ALPHABET).not.toContain(ch)
    }
  })
})

describe("normalizeCode", () => {
  it("trims and uppercases", () => {
    expect(normalizeCode("  k7q2xa ")).toBe("K7Q2XA")
  })
})

describe("isValidCodeFormat", () => {
  it("rejects empty and invalid codes", () => {
    expect(isValidCodeFormat("")).toBe(false)
    expect(isValidCodeFormat("ABC-12")).toBe(false)
  })
})
