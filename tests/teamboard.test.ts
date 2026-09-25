import { describe, it, expect } from "vitest"
import { BOARD_STEPS, DEPTH_BOOSTERS } from "../constants"
import {
  boardStepFor,
  advanceGate,
  lupaInsight,
  findPuentePair,
  encodePuenteProposal,
  decodePuenteProposal,
  boosterUsageFrom,
  pourquoiQuestion,
  LUPA_CAT,
  POURQUOI_CAT,
  PUENTE_CAT,
} from "../lib/board"

const entry = (id: string, content: string, category = "👹 Boss") => ({ id, content, category })

describe("team journey board constants", () => {
  it("defines 5 cooperative steps, no punitive squares", () => {
    expect(BOARD_STEPS).toHaveLength(5)
    const labels = BOARD_STEPS.map((s) => s.label.toLowerCase()).join(" ")
    expect(labels).not.toMatch(/jail|bankrupt|rent|lose/)
  })
  it("offers exactly 3 depth boosters, zero speed/skip boosters", () => {
    expect(DEPTH_BOOSTERS.map((b) => b.id).sort()).toEqual(["doble-porque", "lupa", "puente"])
    const text = DEPTH_BOOSTERS.map((b) => `${b.label} ${b.desc}`.toLowerCase()).join(" ")
    expect(text).not.toMatch(/skip|turbo|extra time|double vote/)
  })
})

describe("boardStepFor", () => {
  it("maps rounds 1..4 onto steps 0..3 and voting onto Quest", () => {
    expect(boardStepFor(1, 4, false)).toBe(0)
    expect(boardStepFor(2, 4, false)).toBe(1)
    expect(boardStepFor(3, 4, false)).toBe(2)
    expect(boardStepFor(4, 4, false)).toBe(3)
    expect(boardStepFor(4, 4, true)).toBe(4)
    expect(boardStepFor(1, 4, true)).toBe(4)
  })
  it("clamps out-of-range rounds", () => {
    expect(boardStepFor(99, 4, false)).toBe(3)
    expect(boardStepFor(-1, 4, false)).toBe(0)
  })
})

describe("advanceGate", () => {
  it("blocks leaving Salida without recall", () => {
    const r = advanceGate(0, { recallDone: false, entries: 5, reflectionDone: true })
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/recall/i)
  })
  it("blocks Compartir with fewer than 3 entries", () => {
    expect(advanceGate(1, { recallDone: true, entries: 2, reflectionDone: true }).ok).toBe(false)
    expect(advanceGate(1, { recallDone: true, entries: 3, reflectionDone: true }).ok).toBe(true)
  })
  it("blocks Profundizar/Votar without reflection", () => {
    expect(advanceGate(2, { recallDone: true, entries: 5, reflectionDone: false }).ok).toBe(false)
    expect(advanceGate(3, { recallDone: true, entries: 5, reflectionDone: false }).ok).toBe(false)
    expect(advanceGate(3, { recallDone: true, entries: 5, reflectionDone: true }).ok).toBe(true)
  })
})

describe("lupaInsight", () => {
  it("returns null with fewer than 2 entries", () => {
    expect(lupaInsight([])).toBeNull()
    expect(lupaInsight([entry("1", "flaky pipeline")])).toBeNull()
  })
  it("surfaces dominant category and repeated words", () => {
    const out = lupaInsight([
      entry("1", "flaky pipeline breaks the build every day"),
      entry("2", "pipeline failures block releases again"),
      entry("3", "great demo", "🌬️ Wind"),
    ])
    expect(out).toMatch(/👹 Boss/)
    expect(out).toMatch(/pipeline/)
    expect(out).toMatch(/suggestion only/)
  })
  it("ignores booster output when computing signal", () => {
    const out = lupaInsight([
      entry("1", "slow reviews block us"),
      entry("2", "reviews pile up for days"),
      { id: "9", content: "old insight", category: LUPA_CAT },
    ])
    expect(out).toMatch(/reviews/)
  })
})

describe("findPuentePair", () => {
  it("returns null with fewer than 2 entries or no shared words", () => {
    expect(findPuentePair([])).toBeNull()
    expect(findPuentePair([entry("1", "zebras")])).toBeNull()
    expect(findPuentePair([entry("1", "quantum zebras orbit"), entry("2", "tacos al pastor")])).toBeNull()
  })
  it("picks the most similar pair", () => {
    const pair = findPuentePair([
      entry("1", "flaky pipeline breaks builds", "👹 Boss"),
      entry("2", "pipeline failures block deploys", "⚓ Anchor"),
      entry("3", "lovely demo day", "🌬️ Wind"),
    ])
    expect(pair).not.toBeNull()
    expect([pair!.a.id, pair!.b.id].sort()).toEqual(["1", "2"])
    expect(pair!.score).toBeGreaterThan(0)
  })
})

describe("puente proposal codec", () => {
  it("round-trips IDs through comment content", () => {
    const content = encodePuenteProposal("abc", "def", "both about pipeline")
    const decoded = decodePuenteProposal(content)
    expect(decoded).toEqual({ aId: "abc", bId: "def" })
  })
  it("returns null for foreign content", () => {
    expect(decodePuenteProposal("hello")).toBeNull()
  })
})

describe("boosterUsageFrom + pourquoiQuestion", () => {
  it("derives usage from persisted comments, never local flags", () => {
    expect(boosterUsageFrom([])).toEqual({ lupa: false, pourquoi: false, puente: false })
    expect(
      boosterUsageFrom([
        { id: "1", content: "x", category: LUPA_CAT },
        { id: "2", content: "y", category: PUENTE_CAT },
      ]),
    ).toEqual({ lupa: true, pourquoi: false, puente: true })
  })
  it("rotates elaborative questions", () => {
    const q1 = pourquoiQuestion([], 0)
    const q2 = pourquoiQuestion([], 1)
    expect(q1).not.toBe(q2)
    expect(q1).toMatch(/❓ Doble porqué/)
    expect(POURQUOI_CAT.length).toBeGreaterThan(0)
  })
})
