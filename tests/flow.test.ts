import { describe, it, expect } from "vitest"
import {
  FLOW_CAT,
  emptyFlow,
  encodeFlowEvent,
  decodeFlowEvent,
  applyFlowEvent,
  foldFlow,
  flowEventsFrom,
  flowFromRows,
  flowRows,
  isFlowRow,
  seedFlowFromCeremony,
  flowBoardStep,
  flowGate,
  flowWaiting,
  flowAdvanceLabel,
  flowAdvanceEvent,
  flowTotal,
  type FlowEvent,
  type FlowState,
} from "../lib/flow"

const row = (id: string, ev: FlowEvent, createdAt: string) => ({ id, content: encodeFlowEvent(ev), category: FLOW_CAT, createdAt })

describe("flow event codec", () => {
  it("round-trips every event kind", () => {
    const events: FlowEvent[] = [
      { e: "round", v: 2 },
      { e: "recall" },
      { e: "reflect", r: 3 },
      { e: "stage", v: "vote" },
      { e: "finish", score: 140, bonus: 40, level: 2, leveledUp: true, streak: "🔥 3-sprint improvement streak" },
    ]
    for (const ev of events) {
      const back = decodeFlowEvent(encodeFlowEvent(ev))
      expect(back).toEqual(ev)
    }
  })

  it("returns null for ordinary entry text and malformed payloads", () => {
    expect(decodeFlowEvent("Code reviews are sitting for 3 days")).toBeNull()
    expect(decodeFlowEvent("")).toBeNull()
    expect(decodeFlowEvent("{not json")).toBeNull()
    expect(decodeFlowEvent("[]")).toBeNull()
    expect(decodeFlowEvent(`{"e":"nope"}`)).toBeNull()
    expect(decodeFlowEvent(`{"e":"round"}`)).toBeNull()
    expect(decodeFlowEvent(`{"e":"stage","v":"whatever"}`)).toBeNull()
  })

  it("never lets a flow row masquerade as a player entry", () => {
    expect(isFlowRow({ id: "1", content: "{}", category: FLOW_CAT })).toBe(true)
    expect(isFlowRow({ id: "2", content: "{}", category: "👹 Boss" })).toBe(false)
    const comments = [
      { id: "1", content: "a", category: "👹 Boss" },
      { id: "2", content: encodeFlowEvent({ e: "recall" }), category: FLOW_CAT },
    ]
    expect(flowRows(comments).map((c) => c.id)).toEqual(["2"])
  })
})

describe("foldFlow", () => {
  it("starts at round 1, board stage, recall pending", () => {
    expect(emptyFlow()).toEqual({ round: 1, stage: "board", recallDone: false, reflected: [], result: null, events: 0 })
  })

  it("folds round, recall, reflection and stage", () => {
    const s = foldFlow([{ e: "round", v: 3 }, { e: "recall" }, { e: "reflect", r: 3 }, { e: "stage", v: "vote" }])
    expect(s.round).toBe(3)
    expect(s.stage).toBe("vote")
    expect(s.recallDone).toBe(true)
    expect(s.reflected).toEqual([3])
    expect(s.events).toBe(4)
  })

  it("keeps the highest reflected rounds deduped and sorted", () => {
    const s = foldFlow([{ e: "reflect", r: 3 }, { e: "reflect", r: 2 }, { e: "reflect", r: 3 }])
    expect(s.reflected).toEqual([2, 3])
    expect(s.events).toBe(3)
  })

  it("is idempotent when a row is replayed or duplicated", () => {
    const ev: FlowEvent = { e: "round", v: 2 }
    const once = foldFlow([ev])
    const twice = foldFlow([ev, ev])
    expect(twice.round).toBe(once.round)
    expect(twice.recallDone).toBe(once.recallDone)
    expect(twice.reflected).toEqual(once.reflected)
  })

  it("clamps nonsense round numbers instead of trusting them", () => {
    expect(foldFlow([{ e: "round", v: 0 }]).round).toBe(1)
    expect(foldFlow([{ e: "round", v: -4 }]).round).toBe(1)
    expect(applyFlowEvent(emptyFlow(), { e: "round", v: 2.7 }).round).toBe(2)
  })

  it("records the finishing device's result once, for everyone", () => {
    const s = foldFlow([{ e: "finish", score: 140, bonus: 40, level: 2, leveledUp: true, streak: "🔥 3-sprint improvement streak" }])
    expect(s.stage).toBe("done")
    expect(flowTotal(s.result)).toBe(180)
    expect(s.result?.leveledUp).toBe(true)
    // A late joiner replaying the same log lands on the same numbers.
    expect(flowTotal(foldFlow([]).result)).toBe(0)
  })

  it("carries the AI reflection to every device, in either arrival order", () => {
    const finish: FlowEvent = { e: "finish", score: 140, bonus: 0, level: 2, leveledUp: true, streak: null }
    const summary: FlowEvent = { e: "summary", text: "Reviews are the bottleneck.", actions: [{ title: "Set a review SLA", why: "3-day average" }] }
    const a = foldFlow([finish, summary])
    const b = foldFlow([summary, finish])
    expect(a.result?.summary).toBe("Reviews are the bottleneck.")
    expect(b.result?.summary).toBe(a.result?.summary)
    expect(b.result?.score).toBe(a.result?.score)
    expect(a.result?.actions).toHaveLength(1)
  })

  it("sanitizes a hostile summary payload at the decode boundary", () => {
    // The codec is the only thing untrusted data passes through before folding.
    const hostile = JSON.stringify({ e: "summary", text: "x".repeat(9000), actions: [{ title: "t".repeat(900), why: "w".repeat(900) }, "nope", null] })
    const s = foldFlow([decodeFlowEvent(hostile)!])
    expect(s.result!.summary!.length).toBe(4000)
    expect(s.result!.actions).toHaveLength(1)
    expect(s.result!.actions[0].title.length).toBe(200)
    expect(s.result!.actions[0].why.length).toBe(300)
  })
})

describe("flowEventsFrom ordering", () => {
  it("orders by createdAt, then by id, so every device folds the same log", () => {
    const rows = [
      row("b", { e: "stage", v: "vote" }, "2026-01-01T00:00:03.000Z"),
      row("a", { e: "round", v: 2 }, "2026-01-01T00:00:01.000Z"),
      row("c", { e: "round", v: 4 }, "2026-01-01T00:00:01.000Z"),
    ]
    expect(flowEventsFrom(rows).map((e) => e.e)).toEqual(["round", "round", "stage"])
    expect(flowFromRows(rows).round).toBe(4)
    expect(flowFromRows(rows).stage).toBe("vote")
  })

  it("is order-independent on input order", () => {
    const rows = [
      row("z", { e: "reflect", r: 2 }, "2026-01-01T00:00:09.000Z"),
      row("y", { e: "recall" }, "2026-01-01T00:00:02.000Z"),
    ]
    const a = flowFromRows(rows)
    const b = flowFromRows([...rows].reverse())
    expect(a).toEqual(b)
  })

  it("skips rows that are not flow events", () => {
    const rows = [
      { id: "1", content: "flaky pipeline", category: "👹 Boss", createdAt: "2026-01-01T00:00:01.000Z" },
      row("2", { e: "recall" }, "2026-01-01T00:00:02.000Z"),
    ]
    expect(flowFromRows(rows).recallDone).toBe(true)
  })
})

describe("seedFlowFromCeremony", () => {
  it("keeps a brand new ceremony at the start square", () => {
    expect(seedFlowFromCeremony({ round: 0, status: "active" }, 4)).toEqual(emptyFlow())
  })

  it("starts at the start square while the ceremony is still loading", () => {
    // The retro page renders once with a null ceremony before its fetch lands.
    expect(seedFlowFromCeremony(null, 4)).toEqual(emptyFlow())
    expect(seedFlowFromCeremony(undefined, 4)).toEqual(emptyFlow())
  })

  it("adopts pre-flow ceremonies from their durable round", () => {
    expect(seedFlowFromCeremony({ round: 2, status: "active" }, 4)).toMatchObject({ round: 2, recallDone: true, stage: "board" })
    expect(seedFlowFromCeremony({ round: 4, status: "active" }, 4)).toMatchObject({ round: 4, stage: "vote" })
    expect(seedFlowFromCeremony({ round: 99, status: "active" }, 4)).toMatchObject({ round: 4, stage: "vote" })
    expect(seedFlowFromCeremony({ round: 3, status: "completed" }, 4)).toMatchObject({ stage: "done" })
  })
})

describe("shared flow gate", () => {
  const start = emptyFlow()

  it("blocks leaving Start until the team recalls", () => {
    const g = flowGate(start, 4, 9)
    expect(g.ok).toBe(false)
    expect(g.reason).toMatch(/recall/i)
    expect(flowWaiting(start, 4, 9)).toMatch(/recall warm-up/i)
  })

  it("unblocks every device at once when ANY device completes the recall", () => {
    // Device A folds a recall row it wrote; device B folds the same row from
    // the realtime stream. Both must agree — that is the whole point.
    const rows = [row("a", { e: "recall" }, "2026-01-01T00:00:01.000Z")]
    const onA = flowFromRows(rows)
    const onB = flowFromRows(rows)
    expect(flowGate(onA, 4, 9).ok).toBe(flowGate(onB, 4, 9).ok)
    expect(onA.recallDone).toBe(true)
  })

  it("blocks Share until 3 team entries exist", () => {
    const f = { ...start, recallDone: true, round: 2 }
    expect(flowGate(f, 4, 2).ok).toBe(false)
    expect(flowWaiting(f, 4, 2)).toMatch(/1 of 3|2 of 3/)
    expect(flowGate(f, 4, 3).ok).toBe(true)
    expect(flowWaiting(f, 4, 3)).toBeNull()
  })

  it("blocks Deepen until the reflection for the shared round is logged", () => {
    const f = { ...start, recallDone: true, round: 3 }
    expect(flowGate(f, 4, 9).ok).toBe(false)
    expect(flowWaiting(f, 4, 9)).toMatch(/guided reflection/i)
    const after = foldFlow([{ e: "round", v: 3 }, { e: "recall" }, { e: "reflect", r: 3 }])
    expect(flowGate(after, 4, 9).ok).toBe(true)
  })

  it("does not accept a reflection logged for a different round", () => {
    const f = foldFlow([{ e: "round", v: 4 }, { e: "recall" }, { e: "reflect", r: 3 }])
    expect(flowGate(f, 4, 9).ok).toBe(false)
  })

  it("stops gating once the ceremony is finished", () => {
    const done = foldFlow([{ e: "finish", score: 10, bonus: 0, level: 1, leveledUp: false, streak: null }])
    expect(flowGate(done, 4, 0).ok).toBe(true)
    expect(flowWaiting(done, 4, 0)).toBeNull()
  })

  it("never disagrees with itself: waiting is null exactly when the gate opens", () => {
    const states: FlowState[] = [
      emptyFlow(),
      foldFlow([{ e: "recall" }]),
      foldFlow([{ e: "recall" }, { e: "round", v: 2 }]),
      foldFlow([{ e: "recall" }, { e: "round", v: 2 }, { e: "reflect", r: 2 }]),
      foldFlow([{ e: "recall" }, { e: "round", v: 3 }]),
      foldFlow([{ e: "recall" }, { e: "round", v: 3 }, { e: "reflect", r: 3 }]),
      foldFlow([{ e: "recall" }, { e: "round", v: 4 }]),
      foldFlow([{ e: "recall" }, { e: "round", v: 4 }, { e: "reflect", r: 4 }]),
      foldFlow([{ e: "stage", v: "vote" }]),
    ]
    for (const s of states) {
      for (const entries of [0, 2, 3, 9]) {
        expect({ step: flowBoardStep(s, 4), waiting: flowWaiting(s, 4, entries), ok: flowGate(s, 4, entries).ok }).toEqual({
          step: flowBoardStep(s, 4),
          waiting: flowGate(s, 4, entries).ok ? null : expect.any(String),
          ok: flowGate(s, 4, entries).ok,
        })
      }
    }
  })
})

describe("board position from shared flow", () => {
  it("maps the shared round onto the 5 squares", () => {
    expect(flowBoardStep(emptyFlow(), 4)).toBe(0)
    expect(flowBoardStep(foldFlow([{ e: "round", v: 2 }]), 4)).toBe(1)
    expect(flowBoardStep(foldFlow([{ e: "round", v: 3 }]), 4)).toBe(2)
    expect(flowBoardStep(foldFlow([{ e: "round", v: 4 }]), 4)).toBe(3)
    expect(flowBoardStep(foldFlow([{ e: "stage", v: "vote" }]), 4)).toBe(4)
  })

  it("names the next action from the shared phase", () => {
    expect(flowAdvanceLabel(foldFlow([{ e: "round", v: 3 }]), 4)).toBe("Advance team token ➜")
    expect(flowAdvanceLabel(foldFlow([{ e: "round", v: 4 }]), 4)).toBe("Go to Vote 🗳️")
  })
})

describe("flowAdvanceEvent", () => {
  it("steps the shared round forward", () => {
    expect(flowAdvanceEvent(foldFlow([{ e: "recall" }]), 4)).toEqual({ e: "round", v: 2 })
    expect(flowAdvanceEvent(foldFlow([{ e: "recall" }, { e: "round", v: 3 }]), 4)).toEqual({ e: "round", v: 4 })
  })

  it("switches to the shared vote stage after the last round", () => {
    expect(flowAdvanceEvent(foldFlow([{ e: "round", v: 4 }]), 4)).toEqual({ e: "stage", v: "vote" })
  })

  it("is a no-op when the team is already voting or done, so double taps are harmless", () => {
    expect(flowAdvanceEvent(foldFlow([{ e: "stage", v: "vote" }]), 4)).toBeNull()
    expect(flowAdvanceEvent(foldFlow([{ e: "finish", score: 1, bonus: 0, level: 1, leveledUp: false, streak: null }]), 4)).toBeNull()
  })

  it("emits an event that moves the board forward when folded back in", () => {
    const log = [row("1", { e: "recall" }, "2026-01-01T00:00:01.000Z")]
    const before = flowFromRows(log)
    expect(flowBoardStep(before, 4)).toBe(0)
    const ev = flowAdvanceEvent(before, 4)!
    const after = foldFlow([...flowEventsFrom(log), ev])
    expect(flowBoardStep(after, 4)).toBe(1)
  })
})