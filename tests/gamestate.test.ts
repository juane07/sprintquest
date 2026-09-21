import { describe, it, expect } from "vitest"
import {
  buildBurst, parseBurst, activeBurst, burstVotes, distinctTappers,
  snailSteps, SNAIL_STEPS_PER_ENTRY, topContenders, teamOf, tugScore, memoryPairs, memoryRevealed, memoryDone,
  flipAction, rollDice, parseBoard, boardState, TRAIL, BURST_CAT, BOARD_CAT,
} from "../lib/gamestate"

describe("burst payload", () => {
  it("round-trips through JSON", () => {
    const b = buildBurst("snail")
    expect(parseBurst(JSON.stringify(b))?.type).toBe("snail")
  })
  it("rejects garbage", () => {
    expect(parseBurst("hello")).toBeNull()
    expect(parseBurst(JSON.stringify({ kind: "nope" }))).toBeNull()
  })
  it("finds the latest active burst", () => {
    const a = { id: "1", category: BURST_CAT, content: JSON.stringify({ ...buildBurst("snail"), status: "done" }) }
    const b = { id: "2", category: BURST_CAT, content: JSON.stringify(buildBurst("whack")) }
    expect(activeBurst([a, b])?.comment.id).toBe("2")
    expect(activeBurst([a]) ).toBeNull()
  })
})

describe("taps", () => {
  const vs = [
    { option: "x:tap", userId: "u1" },
    { option: "x:tap", userId: "u1" },
    { option: "x:tap", userId: "u2" },
    { option: "x:other", userId: "u3" },
  ]
  it("filters by action", () => {
    expect(burstVotes(vs, "x", "tap")).toHaveLength(3)
  })
  it("counts distinct tappers", () => {
    expect(distinctTappers(burstVotes(vs, "x", "tap"))).toBe(2)
  })
})

describe("snailSteps", () => {
  it("entries move 5 steps, taps sustain, 1/sec drains", () => {
    expect(snailSteps(2, 0, 0, 30)).toBe(2 * SNAIL_STEPS_PER_ENTRY)
    expect(snailSteps(2, 10, 3, 30)).toBe(2 * SNAIL_STEPS_PER_ENTRY + 10 - 3)
  })
  it("clamps at 0 and target", () => {
    expect(snailSteps(0, 2, 10, 30)).toBe(0)
    expect(snailSteps(99, 99, 0, 30)).toBe(30)
  })
})

describe("topContenders", () => {
  it("returns top-N ids by score", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }]
    const score = (id: string) => ({ a: 1, b: 5, c: 3 }[id] ?? 0)
    expect(topContenders(items, score, 2)).toEqual(["b", "c"])
  })
})

describe("buildBurst target override", () => {
  it("accepts a custom target", () => {
    expect(buildBurst("tug", "", 5).target).toBe(5)
    expect(buildBurst("tug").target).toBe(5)
  })
})

describe("tug", () => {
  it("splits deterministically", () => {
    expect(teamOf("abc")).toBe(teamOf("abc"))
    expect(["A", "B"]).toContain(teamOf("u1"))
  })
  it("declares winner past target with lead", () => {
    expect(tugScore(25, 10, 25).winner).toBe("A")
    expect(tugScore(10, 10, 25).winner).toBeNull()
    expect(tugScore(30, 30, 25).winner).toBeNull()
  })
})

describe("memory", () => {
  it("builds shuffled pairs deterministically", () => {
    const d1 = memoryPairs(["a", "b", "c", "d"], 42)
    const d2 = memoryPairs(["a", "b", "c", "d"], 42)
    expect(d1).toEqual(d2)
    expect(d1).toHaveLength(8)
  })
  it("reveals only matched pairs", () => {
    const deck = ["a", "x", "a", "y"]
    const rev = memoryRevealed(deck, [0, 1])
    expect(rev).toEqual([false, false, false, false])
    const rev2 = memoryRevealed(deck, [0, 2])
    expect(rev2[0] && rev2[2]).toBe(true)
    expect(memoryDone(rev2)).toBe(false)
    expect(memoryDone([true, true, true, true])).toBe(true)
  })
  it("flip action format", () => {
    expect(flipAction(3)).toBe("flip:3")
  })
})

describe("trail", () => {
  it("has 12 tiles from start to finish", () => {
    expect(TRAIL).toHaveLength(12)
    expect(TRAIL[0].kind).toBe("start")
    expect(TRAIL[TRAIL.length - 1].kind).toBe("finish")
  })
  it("dice in range", () => {
    for (let i = 0; i < 50; i++) {
      const d = rollDice()
      expect(d).toBeGreaterThanOrEqual(1)
      expect(d).toBeLessThanOrEqual(6)
    }
  })
  it("board defaults to start", () => {
    expect(boardState([]).pos).toBe(0)
    expect(parseBoard("junk")).toBeNull()
    const st = boardState([{ category: BOARD_CAT, content: JSON.stringify({ kind: "board", pos: 5, log: [] }) }])
    expect(st.pos).toBe(5)
  })
})
